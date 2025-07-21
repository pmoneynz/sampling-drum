import React from 'react';
import { Loader2, Download, Music, Video } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

interface LoadingOverlayProps {
  isVisible: boolean;
  stage: 'starting' | 'extracting' | 'processing' | 'complete';
  audioProgress: number;
  videoProgress: number;
  message: string;
  speed?: string;
  eta?: string;
  onCancel?: () => void;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  stage,
  audioProgress,
  videoProgress,
  message,
  speed,
  eta,
  onCancel,
}) => {
  if (!isVisible) return null;

  const getStageIcon = () => {
    switch (stage) {
      case 'starting':
        return <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />;
      case 'extracting':
        return <Download className="w-8 h-8 text-orange-500" />;
      case 'processing':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
      case 'complete':
        return <div className="w-8 h-8 text-green-500">✓</div>;
      default:
        return <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />;
    }
  };

  const getStageMessage = () => {
    switch (stage) {
      case 'starting':
        return 'Initializing video extraction...';
      case 'extracting':
        return 'Downloading video and audio streams...';
      case 'processing':
        return 'Processing files for playback...';
      case 'complete':
        return 'Extraction completed successfully!';
      default:
        return message;
    }
  };

  const overallProgress = Math.round((audioProgress + videoProgress) / 2);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            {getStageIcon()}
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Processing YouTube Video
          </h3>
          <p className="text-gray-400 text-sm">
            {getStageMessage()}
          </p>
        </div>

        {stage === 'extracting' && (
          <div className="space-y-4 mb-6">
            {/* Overall Progress */}
            <ProgressBar
              progress={overallProgress}
              label="Overall Progress"
              color="orange"
              size="lg"
              animated={overallProgress < 100}
            />

            {/* Audio Progress */}
            <div className="flex items-center space-x-3">
              <Music className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <ProgressBar
                progress={audioProgress}
                label="Audio Extraction"
                color="orange"
                size="md"
                showPercentage={false}
                className="flex-1"
              />
              <span className="text-sm text-gray-400 w-12 text-right">
                {audioProgress.toFixed(0)}%
              </span>
            </div>

            {/* Video Progress */}
            <div className="flex items-center space-x-3">
              <Video className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <ProgressBar
                progress={videoProgress}
                label="Video Extraction"
                color="blue"
                size="md"
                showPercentage={false}
                className="flex-1"
              />
              <span className="text-sm text-gray-400 w-12 text-right">
                {videoProgress.toFixed(0)}%
              </span>
            </div>

            {/* Speed and ETA */}
            {(speed || eta) && (
              <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-700">
                {speed && <span>Speed: {speed}</span>}
                {eta && <span>ETA: {eta}</span>}
              </div>
            )}
          </div>
        )}

        {stage === 'starting' && (
          <div className="mb-6">
            <ProgressBar
              progress={25}
              label="Initializing"
              color="orange"
              size="md"
              animated={true}
            />
          </div>
        )}

        {stage === 'processing' && (
          <div className="mb-6">
            <ProgressBar
              progress={90}
              label="Processing"
              color="blue"
              size="md"
              animated={true}
            />
          </div>
        )}

        {/* Current Message */}
        <div className="bg-gray-800 rounded-lg p-3 mb-6">
          <p className="text-sm text-gray-300 text-center">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-3">
          {onCancel && stage !== 'complete' && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          )}
          
          {stage === 'complete' && (
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Continue
            </button>
          )}
        </div>

        {/* Technical Details */}
        <div className="mt-4 p-3 bg-gray-800 rounded-lg">
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex justify-between">
              <span>Audio Quality:</span>
              <span>192K MP3</span>
            </div>
            <div className="flex justify-between">
              <span>Video Quality:</span>
              <span>720p/1080p</span>
            </div>
            <div className="flex justify-between">
              <span>Processing:</span>
              <span>Local Buffer</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};