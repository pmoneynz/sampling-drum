import React, { useState } from 'react';
import { Search, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { youtubeService } from '../../services/youtubeService';
import { YouTubeVideoInfo, VideoQuality } from '../../types/youtube';

interface YouTubeInputProps {
  onVideoLoad: (videoInfo: YouTubeVideoInfo, quality: VideoQuality) => void;
  isLoading: boolean;
}

export const YouTubeInput: React.FC<YouTubeInputProps> = ({ onVideoLoad, isLoading }) => {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState<VideoQuality>('720p');
  const [error, setError] = useState<string>('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!youtubeService.isValidYouTubeUrl(url)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    setIsValidating(true);
    setValidationMessage('Contacting YouTube...');

    try {
      // Add timeout handling for validation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Validation timed out. YouTube may be slow or blocking access.')), 15000);
      });

      setValidationMessage('Checking video availability...');
      
      const videoInfo = await Promise.race([
        youtubeService.getVideoInfo(url),
        timeoutPromise
      ]);
      
      setValidationMessage('Video validated successfully!');
      
      // Small delay to show success message
      setTimeout(() => {
        onVideoLoad(videoInfo, quality);
      }, 500);
      
    } catch (error: any) {
      console.error('Validation error:', error);
      
      // Provide more specific error messages
      if (error.message.includes('timed out')) {
        setError('YouTube is taking too long to respond. The service may be slow or blocking access. Please try again.');
      } else if (error.message.includes('Network error') || error.message.includes('fetch')) {
        setError('Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('private') || error.message.includes('unavailable')) {
        setError('This video is private, unavailable, or has been removed from YouTube.');
      } else if (error.message.includes('age-restricted')) {
        setError('This video is age-restricted and cannot be accessed.');
      } else if (error.message.includes('geo') || error.message.includes('region')) {
        setError('This video is not available in your region.');
      } else if (error.message.includes('duration') || error.message.includes('10 minute')) {
        setError('This video exceeds the 10-minute limit. Please choose a shorter video.');
      } else {
        setError(error?.message || 'Failed to validate video. Please try a different URL.');
      }
    } finally {
      setIsValidating(false);
      setValidationMessage('');
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError('');

    // Show validation feedback as user types
    if (newUrl && !youtubeService.isValidYouTubeUrl(newUrl)) {
      setError('Invalid YouTube URL format');
    }
  };

  const getInputStatus = () => {
    if (error) return 'error';
    if (url && youtubeService.isValidYouTubeUrl(url)) return 'success';
    return 'default';
  };

  const inputStatus = getInputStatus();

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-gray-900 border border-gray-700 rounded-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Load YouTube Video</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label htmlFor="youtube-url" className="text-sm font-medium text-gray-300">
            YouTube URL
          </label>
          
          <div className="relative">
            <input
              id="youtube-url"
              type="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://www.youtube.com/watch?v=..."
              className={`
                w-full px-4 py-3 pr-12 bg-gray-800 border rounded-lg text-white placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
                ${inputStatus === 'error' ? 'border-red-500' : ''}
                ${inputStatus === 'success' ? 'border-green-500' : 'border-gray-600'}
              `}
              disabled={isLoading || isValidating}
            />
            
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isValidating ? (
                <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
              ) : inputStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : inputStatus === 'error' ? (
                <AlertCircle className="w-5 h-5 text-red-500" />
              ) : (
                <Search className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
          
          {/* Show validation progress message */}
          {isValidating && validationMessage && (
            <p className="text-sm text-orange-400 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{validationMessage}</span>
            </p>
          )}
          
          {error && (
            <p className="text-sm text-red-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col space-y-2">
          <label htmlFor="quality" className="text-sm font-medium text-gray-300">
            Video Quality
          </label>
          
          <select
            id="quality"
            value={quality}
            onChange={(e) => setQuality(e.target.value as VideoQuality)}
            className="px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={isLoading || isValidating}
          >
            <option value="720p">720p (Recommended)</option>
            <option value="1080p">1080p (High Quality)</option>
          </select>
          
          <p className="text-xs text-gray-400">
            720p loads faster and uses less bandwidth. Use 1080p only if you need higher video quality.
          </p>
        </div>

        <button
          type="submit"
          disabled={!url || inputStatus === 'error' || isLoading || isValidating}
          className={`
            w-full py-3 px-6 rounded-lg font-medium text-white transition-all duration-200
            ${!url || inputStatus === 'error' || isLoading || isValidating
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-gray-900'
            }
          `}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing Video...</span>
            </div>
          ) : isValidating ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Validating...</span>
            </div>
          ) : (
            'Load Video'
          )}
        </button>
      </form>
      
      <div className="mt-4 p-3 bg-gray-800 rounded-lg">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Supported Formats:</h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• youtube.com/watch?v=VIDEO_ID</li>
          <li>• youtu.be/VIDEO_ID</li>
          <li>• youtube.com/embed/VIDEO_ID</li>
          <li>• Maximum duration: 10 minutes</li>
          <li>• Public videos only</li>
        </ul>
      </div>
      
      {/* Add status information for user testing */}
      {(isValidating || isLoading) && (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <h3 className="text-sm font-medium text-blue-300 mb-2">What's happening:</h3>
          <ul className="text-xs text-blue-200 space-y-1">
            {isValidating && (
              <>
                <li>• Checking video availability on YouTube</li>
                <li>• Verifying video duration (max 10 minutes)</li>
                <li>• Ensuring video is public and accessible</li>
                <li>• This usually takes 3-10 seconds</li>
              </>
            )}
            {isLoading && (
              <>
                <li>• Downloading video and audio files</li>
                <li>• Processing audio waveform</li>
                <li>• Setting up playback engine</li>
                <li>• This may take 30-60 seconds for longer videos</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};