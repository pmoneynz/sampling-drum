import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import NodeCache from 'node-cache';
import { v4 as uuidv4 } from 'uuid';
import sqlite3 from 'sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
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
      return res.status(400).json({ error: 'Invalid YouTube URL' });
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
        return res.status(500).json({ error: 'Failed to fetch video info' });
      }

      try {
        const info = JSON.parse(output);
        
        // Check duration limit (10 minutes = 600 seconds)
        if (info.duration > 600) {
          return res.status(400).json({ 
            error: 'Video exceeds 10-minute limit',
            duration: info.duration 
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
          formats: info.formats?.filter(f => f.acodec !== 'none').slice(0, 3) // Audio formats
        };

        cache.set(cacheKey, videoInfo);
        res.json(videoInfo);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        res.status(500).json({ error: 'Failed to parse video info' });
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Extract audio from YouTube video
app.post('/api/youtube/extract', async (req, res) => {
  try {
    const { url, quality = '720p' } = req.body;
    
    if (!url || !isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
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

    const ytDlpAudio = spawn('yt-dlp', [
      '-f', 'bestaudio/best',
      '-o', audioPath,
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '192K',
      url
    ]);

    const ytDlpVideo = spawn('yt-dlp', [
      '-f', formatSelector,
      '-o', videoPath,
      url
    ]);

    let audioError = '';
    let videoError = '';
    let audioCompleted = false;
    let videoCompleted = false;

    ytDlpAudio.stderr.on('data', (data) => {
      audioError += data.toString();
    });

    ytDlpVideo.stderr.on('data', (data) => {
      videoError += data.toString();
    });

    ytDlpAudio.on('close', (code) => {
      audioCompleted = true;
      if (code !== 0) {
        console.error('Audio extraction error:', audioError);
      }
      checkCompletion();
    });

    ytDlpVideo.on('close', (code) => {
      videoCompleted = true;
      if (code !== 0) {
        console.error('Video extraction error:', videoError);
      }
      checkCompletion();
    });

    function checkCompletion() {
      if (audioCompleted && videoCompleted) {
        // Find the actual downloaded files
        const files = fs.readdirSync(downloadsDir);
        const audioFile = files.find(f => f.startsWith(videoId) && f.includes('audio'));
        const videoFile = files.find(f => f.startsWith(videoId) && !f.includes('audio'));

        if (!audioFile || !videoFile) {
          return res.status(500).json({ error: 'Failed to extract video/audio files' });
        }

        const result = {
          videoId,
          audioUrl: `/downloads/${audioFile}`,
          videoUrl: `/downloads/${videoFile}`,
          quality
        };

        cache.set(cacheKey, result);
        res.json(result);
      }
    }

  } catch (error) {
    console.error('Extraction error:', error);
    res.status(500).json({ error: 'Failed to extract video' });
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

app.listen(PORT, () => {
  console.log(`YouTube Cue Point Backend running on port ${PORT}`);
  console.log(`Downloads directory: ${downloadsDir}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close();
  process.exit(0);
});