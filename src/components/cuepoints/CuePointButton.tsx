import React from 'react';
import { CuePoint } from '../../types/cuepoints';
import { youtubeService } from '../../services/youtubeService';

interface CuePointButtonProps {
  index: number;
  cuePoint?: CuePoint;
  isCurrentlyPlaying: boolean;
  onTrigger: () => void;
  className?: string;
}

export const CuePointButton: React.FC<CuePointButtonProps> = ({
  index,
  cuePoint,
  isCurrentlyPlaying,
  onTrigger,
  className = '',
}) => {
  const isActive = !!cuePoint;
  const buttonNumber = index + 1;

  const getKeyboardShortcut = () => {
    if (buttonNumber <= 10) {
      return buttonNumber === 10 ? '0' : buttonNumber.toString();
    } else {
      return `Shift+${buttonNumber - 10}`;
    }
  };

  return (
    <button
      onClick={onTrigger}
      disabled={!isActive}
      className={`
        relative flex flex-col items-center justify-center
        w-16 h-16 rounded-lg border-2 transition-all duration-150
        font-mono text-sm font-semibold
        ${isActive
          ? isCurrentlyPlaying
            ? 'bg-orange-500 border-orange-400 text-white shadow-lg shadow-orange-500/25 animate-pulse'
            : 'bg-orange-600 border-orange-500 text-white hover:bg-orange-500 hover:shadow-lg hover:shadow-orange-500/25 active:scale-95'
          : 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed'
        }
        ${className}
      `}
      title={
        isActive
          ? `Cue Point ${buttonNumber} - ${youtubeService.formatTimestamp(cuePoint!.position)} (${getKeyboardShortcut()})`
          : `Empty Cue Point ${buttonNumber} (${getKeyboardShortcut()})`
      }
    >
      <span className="text-lg font-bold">{buttonNumber}</span>
      
      {isActive && (
        <span className="text-xs opacity-75 mt-1">
          {youtubeService.formatTimestamp(cuePoint!.position)}
        </span>
      )}
      
      {/* Keyboard shortcut indicator */}
      <div className="absolute -top-2 -right-2 bg-gray-700 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
        {getKeyboardShortcut()}
      </div>
      
      {/* Active indicator dot */}
      {isActive && (
        <div className={`
          absolute -top-1 -left-1 w-3 h-3 rounded-full border-2 border-gray-900
          ${isCurrentlyPlaying ? 'bg-green-400' : 'bg-orange-400'}
        `} />
      )}
    </button>
  );
};