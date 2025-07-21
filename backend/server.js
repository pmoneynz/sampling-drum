import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import NodeCache from 'node-cache';
import { v4 as uuidv4 } from 'uuid';
import sqlite3 from 'sqlite3';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Cache for 30 minutes
const cache = new NodeCache({ stdTTL: 1800 });

// Create downloads directory
const downloadsDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Database setup
const db = new sqlite3.Database('sessions.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    video_url TEXT NOT NULL,
    video_title TEXT,
    video_duration INTEGER,
    cue_points TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_modified DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

app.use(cors());
app.use(express.json());
app.use('/downloads', express.static(downloadsDir));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected for progress updates:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Enhanced error classification
function classifyYouTubeError(errorOutput) {
  const errorLower = errorOutput.toLowerCase();
  
  if (errorLower.includes('sign in to confirm') || errorLower.includes('not a bot')) {
    return {
      type: 'BOT_DETECTION',
      message: 'YouTube detected automated access. This video requires authentication.',
      userMessage: 'YouTube is blocking automated access to this video. Try a different video or see our authentication guide.',
      suggestion: 'Try using --cookies-from-browser or a different video'
    };
  }
  
  if (errorLower.includes('video unavailable') || errorLower.includes('private video')) {
    return {
      type: 'VIDEO_UNAVAILABLE',
      message: 'Video is unavailable, private, or has been removed.',
      userMessage: 'This video is unavailable, private, or has been removed from YouTube.',
      suggestion: 'Try a different public video'
    };
  }
  
  if (errorLower.includes('age-restricted') || errorLower.includes('age restricted')) {
    return {
      type: 'AGE_RESTRICTED',
      message: 'Video is age-restricted and requires authentication.',
      userMessage: 'This video is age-restricted and cannot be accessed without authentication.',
      suggestion: 'Try a non-age-restricted video'
    };
  }
  
  if (errorLower.includes('geo') || errorLower.includes('region') || errorLower.includes('country')) {
    return {
      type: 'GEO_BLOCKED',
      message: 'Video is not available in your region.',
      userMessage: 'This video is not available in your geographic region.',
      suggestion: 'Try a different video available in your region'
    };
  }
  
  if (errorLower.includes('network') || errorLower.includes('timeout') || errorLower.includes('connection')) {
    return {
      type: 'NETWORK_ERROR',
      message: 'Network connection issue.',
      userMessage: 'Network connection issue. Please check your internet connection.',
      suggestion: 'Check your internet connection and try again'
    };
  }
  
  return {
    type: 'UNKNOWN_ERROR',
    message: 'Unknown error occurred during video extraction.',
    userMessage: 'An unexpected error occurred. Please try a different video.',
    suggestion: 'Try a different YouTube video or contact support'
  };
}

// Progress parsing function
function parseProgress(line) {
  // Parse yt-dlp progress output
  const progressMatch = line.match(/(\d+\.?\d*)%/);
  const speedMatch = line.match(/(\d+\.?\d*)(KiB|MiB|GiB)\/s/);
  const etaMatch = line.match(/ETA\s+(\d+:\d+)/);
  
  if (progressMatch) {
    return {
      percentage: parseFloat(progressMatch[1]),
      speed: speedMatch ? `${speedMatch[1]}${speedMatch[2]}/s` : null,
      eta: etaMatch ? etaMatch[1] : null
    };
  }
  return null;
}

// YouTube URL validation
function isValidYouTubeUrl(url) {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
  ];
  return patterns.some(pattern => pattern.test(url));
}

// Extract video info using yt-dlp
app.post('/api/youtube/info', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || !isValidYouTubeUrl(url)) {
      return res.status(400).json({ 
        error: 'Invalid YouTube URL',
        type: 'INVALID_URL',
        userMessage: 'Please enter a valid YouTube URL'
      });
    }

    // Check cache first
    const cacheKey = `info_${url}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const ytDlp = spawn('yt-dlp', [
      '--dump-json',
      '--no-download',
      '--extractor-args', 'youtube:player_skip=configs',
      '--no-warnings',
      url
    ]);

    let output = '';
    let errorOutput = '';

    ytDlp.stdout.on('data', (data) => {
      output += data.toString();
    });

    ytDlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ytDlp.on('close', (code) => {
      if (code !== 0) {
        console.error('yt-dlp error:', errorOutput);
        const errorInfo = classifyYouTubeError(errorOutput);
        return res.status(400).json({
          error: errorInfo.userMessage,
          type: errorInfo.type,
          suggestion: errorInfo.suggestion,
          technical: errorInfo.message
        });
      }

      try {
        const info = JSON.parse(output);
        
        // Check duration limit (10 minutes = 600 seconds)
        if (info.duration > 600) {
          return res.status(400).json({ 
            error: 'Video exceeds 10-minute limit',
            type: 'DURATION_LIMIT',
            duration: info.duration,
            userMessage: `Video is ${Math.round(info.duration / 60)} minutes long. Maximum allowed is 10 minutes.`
          });
        }

        const videoInfo = {
          id: info.id,
          title: info.title,
          duration: info.duration,
          thumbnail: info.thumbnail,
          uploader: info.uploader,
          upload_date: info.upload_date,
          view_count: info.view_count,
          formats: info.formats?.filter(f => f.acodec !== 'none').slice(0, 3)
        };

        cache.set(cacheKey, videoInfo);
        res.json(videoInfo);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        res.status(500).json({ 
          error: 'Failed to parse video information',
          type: 'PARSE_ERROR',
          userMessage: 'Unable to read video information. The video may be unavailable.'
        });
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      type: 'SERVER_ERROR',
      userMessage: 'Server error occurred. Please try again.'
    });
  }
});

// Extract audio from YouTube video with progress tracking
app.post('/api/youtube/extract', async (req, res) => {
  try {
    const { url, quality = '720p', socketId } = req.body;
    
    if (!url || !isValidYouTubeUrl(url)) {
      return res.status(400).json({ 
        error: 'Invalid YouTube URL',
        type: 'INVALID_URL',
        userMessage: 'Please enter a valid YouTube URL'
      });
    }

    // Check cache first
    const cacheKey = `extract_${url}_${quality}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)[1];
    const audioFileName = `${videoId}_audio.%(ext)s`;
    const videoFileName = `${videoId}_video.%(ext)s`;
    
    const audioPath = path.join(downloadsDir, audioFileName);
    const videoPath = path.join(downloadsDir, videoFileName);

    // Extract audio and video separately for better performance
    const formatSelector = quality === '1080p' 
      ? 'best[height<=1080]' 
      : 'best[height<=720]';

    // Progress tracking variables
    let audioProgress = 0;
    let videoProgress = 0;
    let audioError = '';
    let videoError = '';
    let audioCompleted = false;
    let videoCompleted = false;

    const socket = socketId ? io.to(socketId) : io;

    // Emit initial progress
    socket.emit('extraction-progress', {
      stage: 'starting',
      audioProgress: 0,
      videoProgress: 0,
      message: 'Starting video extraction...'
    });

    const ytDlpAudio = spawn('yt-dlp', [
      '-f', 'bestaudio/best',
      '-o', audioPath,
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '192K',
      '--extractor-args', 'youtube:player_skip=configs',
      '--no-warnings',
      '--progress',
      url
    ]);

    const ytDlpVideo = spawn('yt-dlp', [
      '-f', formatSelector,
      '-o', videoPath,
      '--extractor-args', 'youtube:player_skip=configs',
      '--no-warnings',
      '--progress',
      url
    ]);

    // Audio progress tracking
    ytDlpAudio.stdout.on('data', (data) => {
      const line = data.toString();
      const progress = parseProgress(line);
      if (progress) {
        audioProgress = progress.percentage;
        socket.emit('extraction-progress', {
          stage: 'extracting',
          audioProgress,
          videoProgress,
          message: `Extracting audio: ${progress.percentage.toFixed(1)}%`,
          speed: progress.speed,
          eta: progress.eta
        });
      }
    });

    ytDlpAudio.stderr.on('data', (data) => {
      audioError += data.toString();
    });

    // Video progress tracking
    ytDlpVideo.stdout.on('data', (data) => {
      const line = data.toString();
      const progress = parseProgress(line);
      if (progress) {
        videoProgress = progress.percentage;
        socket.emit('extraction-progress', {
          stage: 'extracting',
          audioProgress,
          videoProgress,
          message: `Extracting video: ${progress.percentage.toFixed(1)}%`,
          speed: progress.speed,
          eta: progress.eta
        });
      }
    });

    ytDlpVideo.stderr.on('data', (data) => {
      videoError += data.toString();
    });

    ytDlpAudio.on('close', (code) => {
      audioCompleted = true;
      if (code !== 0) {
        console.error('Audio extraction error:', audioError);
        const errorInfo = classifyYouTubeError(audioError);
        socket.emit('extraction-error', {
          type: 'audio',
          error: errorInfo.userMessage,
          errorType: errorInfo.type,
          suggestion: errorInfo.suggestion
        });
      } else {
        audioProgress = 100;
        socket.emit('extraction-progress', {
          stage: 'extracting',
          audioProgress: 100,
          videoProgress,
          message: 'Audio extraction completed'
        });
      }
      checkCompletion();
    });

    ytDlpVideo.on('close', (code) => {
      videoCompleted = true;
      if (code !== 0) {
        console.error('Video extraction error:', videoError);
        const errorInfo = classifyYouTubeError(videoError);
        socket.emit('extraction-error', {
          type: 'video',
          error: errorInfo.userMessage,
          errorType: errorInfo.type,
          suggestion: errorInfo.suggestion
        });
      } else {
        videoProgress = 100;
        socket.emit('extraction-progress', {
          stage: 'extracting',
          audioProgress,
          videoProgress: 100,
          message: 'Video extraction completed'
        });
      }
      checkCompletion();
    });

    function checkCompletion() {
      if (audioCompleted && videoCompleted) {
        // Check for errors
        if (audioError || videoError) {
          const combinedError = audioError + videoError;
          const errorInfo = classifyYouTubeError(combinedError);
          
          socket.emit('extraction-complete', {
            success: false,
            error: errorInfo.userMessage,
            errorType: errorInfo.type,
            suggestion: errorInfo.suggestion
          });
          
          return res.status(400).json({
            error: errorInfo.userMessage,
            type: errorInfo.type,
            suggestion: errorInfo.suggestion,
            technical: errorInfo.message
          });
        }

        // Find the actual downloaded files
        const files = fs.readdirSync(downloadsDir);
        const audioFile = files.find(f => f.startsWith(videoId) && f.includes('audio'));
        const videoFile = files.find(f => f.startsWith(videoId) && !f.includes('audio'));

        if (!audioFile || !videoFile) {
          socket.emit('extraction-complete', {
            success: false,
            error: 'Failed to extract video/audio files',
            errorType: 'EXTRACTION_FAILED'
          });
          return res.status(500).json({ 
            error: 'Failed to extract video/audio files',
            type: 'EXTRACTION_FAILED',
            userMessage: 'Video extraction failed. Please try a different video.'
          });
        }

        const result = {
          videoId,
          audioUrl: `/downloads/${audioFile}`,
          videoUrl: `/downloads/${videoFile}`,
          quality
        };

        socket.emit('extraction-complete', {
          success: true,
          result,
          message: 'Video extraction completed successfully!'
        });

        cache.set(cacheKey, result);
        res.json(result);
      }
    }

  } catch (error) {
    console.error('Extraction error:', error);
    const socket = req.body.socketId ? io.to(req.body.socketId) : io;
    socket.emit('extraction-complete', {
      success: false,
      error: 'Server error during extraction',
      errorType: 'SERVER_ERROR'
    });
    res.status(500).json({ 
      error: 'Failed to extract video',
      type: 'SERVER_ERROR',
      userMessage: 'Server error occurred during video extraction. Please try again.'
    });
  }
});

// Demo endpoint for testing without YouTube
app.post('/api/demo/video', (req, res) => {
  try {
    // Simulate a successful video extraction
    const demoVideo = {
      videoId: 'demo_video_001',
      audioUrl: '/downloads/demo_audio.mp3',
      videoUrl: '/downloads/demo_video.mp4',
      quality: '720p'
    };
    
    // Create a demo video info response
    const demoInfo = {
      id: 'demo_video_001',
      title: 'Demo Video - Piano Melody (30 seconds)',
      duration: 30,
      thumbnail: 'https://via.placeholder.com/480x360.png?text=Demo+Video',
      uploader: 'YouTube Cue Point Player Demo',
      upload_date: '20240101',
      view_count: 12345
    };
    
    res.json({ 
      success: true, 
      message: 'Demo mode - using test video',
      videoInfo: demoInfo,
      extraction: demoVideo 
    });
    
  } catch (error) {
    console.error('Demo endpoint error:', error);
    res.status(500).json({ error: 'Demo endpoint failed' });
  }
});

// Session management endpoints
app.post('/api/sessions/save', (req, res) => {
  try {
    const { videoUrl, videoTitle, videoDuration, cuePoints } = req.body;
    const sessionId = uuidv4();
    
    db.run(
      `INSERT INTO sessions (id, video_url, video_title, video_duration, cue_points) 
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, videoUrl, videoTitle, videoDuration, JSON.stringify(cuePoints)],
      function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to save session' });
        }
        res.json({ sessionId, success: true });
      }
    );
  } catch (error) {
    console.error('Save session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/sessions/load/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    
    db.get(
      'SELECT * FROM sessions WHERE id = ?',
      [sessionId],
      (err, row) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to load session' });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'Session not found' });
        }
        
        const session = {
          id: row.id,
          videoUrl: row.video_url,
          videoTitle: row.video_title,
          videoDuration: row.video_duration,
          cuePoints: JSON.parse(row.cue_points || '[]'),
          createdAt: row.created_at,
          lastModified: row.last_modified
        };
        
        res.json(session);
      }
    );
  } catch (error) {
    console.error('Load session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/sessions/list', (req, res) => {
  try {
    db.all(
      'SELECT id, video_url, video_title, video_duration, created_at, last_modified FROM sessions ORDER BY last_modified DESC LIMIT 20',
      (err, rows) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Failed to list sessions' });
        }
        
        const sessions = rows.map(row => ({
          id: row.id,
          videoUrl: row.video_url,
          videoTitle: row.video_title,
          videoDuration: row.video_duration,
          createdAt: row.created_at,
          lastModified: row.last_modified
        }));
        
        res.json(sessions);
      }
    );
  } catch (error) {
    console.error('List sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

server.listen(PORT, () => {
  console.log(`YouTube Cue Point Backend running on port ${PORT}`);
  console.log(`Downloads directory: ${downloadsDir}`);
  console.log('WebSocket support enabled for progress tracking');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close();
  process.exit(0);
});