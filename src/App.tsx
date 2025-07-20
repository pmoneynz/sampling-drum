import { useState, useRef, useEffect } from 'react';
import { YouTubeInput } from './components/video/YouTubeInput';
import { CuePointGrid } from './components/cuepoints/CuePointGrid';
import { useVideoAudioEngine } from './hooks/useVideoAudioEngine';
import { youtubeService } from './services/youtubeService';
import { YouTubeVideoInfo, VideoQuality } from './types/youtube';
import { Play, Pause, SkipBack, SkipForward, Volume2, ZoomIn, ZoomOut, Save, Download } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';

function App() {
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentQuality, setCurrentQuality] = useState<VideoQuality>('720p');
  const [volume, setVolume] = useState(1);
  const [zoom, setZoom] = useState(1);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const {
    playbackState,
    cuePoints,
    currentCuePoint,
    loadVideo,
    togglePlayback,
    seekTo,
    seekForward,
    seekBackward,
    addCuePoint,
    triggerCuePoint,
    setVolume: setEngineVolume,
    getVideoElement,
  } = useVideoAudioEngine();

  const handleVideoLoad = async (info: YouTubeVideoInfo, quality: VideoQuality) => {
    setIsLoading(true);
    setError('');
    
    try {
      // First get video info
      setVideoInfo(info);
      setCurrentQuality(quality);
      
      // Extract video/audio
      const extraction = await youtubeService.extractVideo(
        `https://www.youtube.com/watch?v=${info.id}`,
        quality
      );
      
      // Load into our audio engine
      await loadVideo(extraction);
      
      // Set up video element
      const videoElement = getVideoElement();
      if (videoElement && videoRef.current) {
        // Clone the video element's content to our ref
        videoRef.current.src = videoElement.src;
        videoRef.current.currentTime = 0;
      }

      // Initialize WaveSurfer for waveform visualization
      if (waveformRef.current) {
        // Destroy existing instance
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
        }

        wavesurferRef.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: '#fb923c', // Orange
          progressColor: '#ea580c', // Darker orange
          cursorColor: '#ffffff',
          barWidth: 2,
          barRadius: 1,
          height: 80,
          normalize: true,
        });

        // Load the audio for waveform visualization
        const audioUrl = `http://localhost:3001${extraction.audioUrl}`;
        await wavesurferRef.current.load(audioUrl);

        // Set up waveform event listeners
        wavesurferRef.current.on('click', (progress: number) => {
          const time = progress * playbackState.duration;
          addCuePoint(time);
        });

        wavesurferRef.current.on('timeupdate', (progress: number) => {
          const time = progress * playbackState.duration;
          seekTo(time);
        });
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load video');
    } finally {
      setIsLoading(false);
    }
  };

  // Update waveform cursor position
  useEffect(() => {
    if (wavesurferRef.current && playbackState.duration > 0) {
      const progress = playbackState.currentTime / playbackState.duration;
      wavesurferRef.current.seekTo(progress);
    }
  }, [playbackState.currentTime, playbackState.duration]);

  // Handle volume changes
  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setEngineVolume(newVolume);
  };

  // Handle zoom changes
  const handleZoom = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in' ? Math.min(zoom * 2, 32) : Math.max(zoom / 2, 1);
    setZoom(newZoom);
    
    if (wavesurferRef.current) {
      wavesurferRef.current.zoom(newZoom * 50); // WaveSurfer zoom factor
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">YouTube Cue Point Player</h1>
          <p className="text-gray-400 text-center">
            Load YouTube videos and create precise audio cue points for musical analysis
          </p>
        </header>

        {/* YouTube Input */}
        <div className="mb-8">
          <YouTubeInput onVideoLoad={handleVideoLoad} isLoading={isLoading} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-lg">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Main Content */}
        {videoInfo && (
          <div className="space-y-6">
            {/* Video Info */}
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
              <h2 className="text-xl font-semibold mb-2">{videoInfo.title}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>By {videoInfo.uploader}</span>
                <span>•</span>
                <span>{youtubeService.formatDuration(videoInfo.duration)}</span>
                <span>•</span>
                <span>{currentQuality}</span>
              </div>
            </div>

            {/* Video Player and Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Video Player */}
              <div className="lg:col-span-2">
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <div className="aspect-video bg-black rounded mb-4">
                    <video
                      ref={videoRef}
                      className="w-full h-full rounded"
                      controls={false}
                      muted={true} // Video is muted, audio comes through our engine
                    />
                  </div>
                  
                  {/* Transport Controls */}
                  <div className="flex items-center justify-center space-x-4 mb-4">
                    <button
                      onClick={seekBackward}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Seek backward 10s (←)"
                    >
                      <SkipBack className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={togglePlayback}
                      className="p-3 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                      title="Play/Pause (Space)"
                    >
                      {playbackState.isPlaying ? (
                        <Pause className="w-6 h-6" />
                      ) : (
                        <Play className="w-6 h-6" />
                      )}
                    </button>
                    
                    <button
                      onClick={seekForward}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Seek forward 10s (→)"
                    >
                      <SkipForward className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center space-x-3">
                    <Volume2 className="w-5 h-5 text-gray-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-gray-400 w-12">
                      {Math.round(volume * 100)}%
                    </span>
                  </div>
                </div>

                {/* Waveform Timeline */}
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Audio Timeline</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleZoom('out')}
                        className="p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                        title="Zoom out"
                      >
                        <ZoomOut className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-400 px-2">{zoom}x</span>
                      <button
                        onClick={() => handleZoom('in')}
                        className="p-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                        title="Zoom in"
                      >
                        <ZoomIn className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div ref={waveformRef} className="w-full" />
                  
                  <div className="mt-3 text-xs text-gray-400">
                    <p>Click on the waveform to place cue points • Drag to seek • Resolution: 44.1kHz</p>
                  </div>
                </div>
              </div>

              {/* Cue Points */}
              <div className="lg:col-span-1">
                <CuePointGrid
                  cuePoints={cuePoints}
                  currentCuePoint={currentCuePoint}
                  onCuePointTrigger={triggerCuePoint}
                />
                
                {/* Session Controls */}
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mt-4">
                  <h3 className="text-lg font-semibold mb-3">Session</h3>
                  <div className="space-y-2">
                    <button className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                      <Save className="w-4 h-4" />
                      <span>Save Session</span>
                    </button>
                    <button className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                      <Download className="w-4 h-4" />
                      <span>Export Cue Points</span>
                    </button>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Session Info</h4>
                    <div className="text-xs text-gray-400 space-y-1">
                      <div>Active Cue Points: {cuePoints.length}/16</div>
                      <div>Current Time: {youtubeService.formatTimestamp(playbackState.currentTime)}</div>
                      <div>Duration: {youtubeService.formatDuration(playbackState.duration)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">Processing Video</h3>
                <p className="text-gray-400 text-sm">
                  Extracting audio and video streams from YouTube...
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 