import React from 'react';
import { AlertCircle, Shield, Globe, Clock, Wifi, HelpCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string;
  errorType?: string;
  suggestion?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  errorType,
  suggestion,
  onRetry,
  onDismiss,
  className = '',
}) => {
  const getErrorIcon = () => {
    switch (errorType) {
      case 'BOT_DETECTION':
        return <Shield className="w-6 h-6 text-yellow-500" />;
      case 'VIDEO_UNAVAILABLE':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      case 'AGE_RESTRICTED':
        return <Shield className="w-6 h-6 text-orange-500" />;
      case 'GEO_BLOCKED':
        return <Globe className="w-6 h-6 text-blue-500" />;
      case 'DURATION_LIMIT':
        return <Clock className="w-6 h-6 text-purple-500" />;
      case 'NETWORK_ERROR':
        return <Wifi className="w-6 h-6 text-red-500" />;
      default:
        return <HelpCircle className="w-6 h-6 text-gray-500" />;
    }
  };

  const getErrorColor = () => {
    switch (errorType) {
      case 'BOT_DETECTION':
        return 'border-yellow-500 bg-yellow-900/20';
      case 'VIDEO_UNAVAILABLE':
        return 'border-red-500 bg-red-900/20';
      case 'AGE_RESTRICTED':
        return 'border-orange-500 bg-orange-900/20';
      case 'GEO_BLOCKED':
        return 'border-blue-500 bg-blue-900/20';
      case 'DURATION_LIMIT':
        return 'border-purple-500 bg-purple-900/20';
      case 'NETWORK_ERROR':
        return 'border-red-500 bg-red-900/20';
      default:
        return 'border-gray-500 bg-gray-900/20';
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'BOT_DETECTION':
        return 'YouTube Access Restricted';
      case 'VIDEO_UNAVAILABLE':
        return 'Video Not Available';
      case 'AGE_RESTRICTED':
        return 'Age-Restricted Content';
      case 'GEO_BLOCKED':
        return 'Geographic Restriction';
      case 'DURATION_LIMIT':
        return 'Video Too Long';
      case 'NETWORK_ERROR':
        return 'Connection Issue';
      case 'INVALID_URL':
        return 'Invalid URL';
      default:
        return 'Error';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getErrorColor()} ${className}`}>
      <div className="flex items-start space-x-3">
        {getErrorIcon()}
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-2">
            {getErrorTitle()}
          </h3>
          <p className="text-gray-300 mb-3">{error}</p>
          
          {suggestion && (
            <div className="bg-gray-800 rounded-lg p-3 mb-3">
              <h4 className="text-sm font-medium text-gray-300 mb-1">💡 Suggestion:</h4>
              <p className="text-sm text-gray-400">{suggestion}</p>
            </div>
          )}

          {errorType === 'BOT_DETECTION' && (
            <div className="bg-gray-800 rounded-lg p-3 mb-3">
              <h4 className="text-sm font-medium text-gray-300 mb-2">🔧 Solutions:</h4>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Try a different YouTube video</li>
                <li>• Use the demo mode for testing</li>
                <li>• Set up cookie authentication (see docs)</li>
                <li>• Try again later</li>
              </ul>
            </div>
          )}

          {errorType === 'DURATION_LIMIT' && (
            <div className="bg-gray-800 rounded-lg p-3 mb-3">
              <h4 className="text-sm font-medium text-gray-300 mb-1">📏 Limit Details:</h4>
              <p className="text-sm text-gray-400">
                The application is optimized for videos under 10 minutes for best performance and user experience.
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            )}
            
            <button
              onClick={() => window.open('/YOUTUBE_ISSUES.md', '_blank')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              View Solutions
            </button>
            
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};