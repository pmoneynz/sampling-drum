import React from 'react';
import { CuePointButton } from './CuePointButton';
import { CuePoint } from '../../types/cuepoints';

interface CuePointGridProps {
  cuePoints: CuePoint[];
  currentCuePoint?: number;
  onCuePointTrigger: (index: number) => void;
}

export const CuePointGrid: React.FC<CuePointGridProps> = ({
  cuePoints,
  currentCuePoint,
  onCuePointTrigger,
}) => {
  // Create array of 16 slots for cue points
  const cuePointSlots = Array.from({ length: 16 }, (_, index) => {
    return cuePoints.find(cp => cp.buttonIndex === index);
  });

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Cue Points</h3>
      
      <div className="grid grid-cols-4 gap-3 mb-4">
        {cuePointSlots.map((cuePoint, index) => (
          <CuePointButton
            key={index}
            index={index}
            cuePoint={cuePoint}
            isCurrentlyPlaying={currentCuePoint === index}
            onTrigger={() => onCuePointTrigger(index)}
            className="group"
          />
        ))}
      </div>
      
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Keyboard Shortcuts</h4>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <div>
            <span className="font-mono">1-9, 0</span>: Trigger cue points 1-10
          </div>
          <div>
            <span className="font-mono">Shift+1-6</span>: Trigger cue points 11-16
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-800 rounded-lg">
        <p className="text-xs text-gray-400">
          Click on the waveform timeline to place cue points. Active cue points can be triggered 
          using the buttons above or keyboard shortcuts. Drag markers on the timeline to reposition them.
        </p>
      </div>
    </div>
  );
};