import React, { useEffect, useState, useCallback } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { Upload } from 'lucide-react';

interface PadGridProps {
  audioEngine: AudioEngine;
  selectedPad: number;
  onPadSelect: (padIndex: number) => void;
}

export function PadGrid({ audioEngine, selectedPad, onPadSelect }: PadGridProps) {
  const [activePads, setActivePads] = useState<Set<number>>(new Set());
  const [audioInitialized, setAudioInitialized] = useState(false);

  // Keyboard mapping for pads (QWERTY layout)
  const keyMap: { [key: string]: number } = {
    'q': 0, 'w': 1, 'e': 2, 'r': 3,
    'a': 4, 's': 5, 'd': 6, 'f': 7,
    'z': 8, 'x': 9, 'c': 10, 'v': 11,
    '1': 12, '2': 13, '3': 14, '4': 15
  };

  const ensureAudioActive = async () => {
    if (!audioInitialized) {
      console.log('Activating audio on user interaction...');
      await audioEngine.init();
      setAudioInitialized(true);
    }
  };

  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    await ensureAudioActive();
    
    const padIndex = keyMap[event.key.toLowerCase()];
    if (padIndex !== undefined && !activePads.has(padIndex)) {
      setActivePads(prev => new Set(prev).add(padIndex));
      audioEngine.triggerPad(padIndex, 0.8);
    }
  }, [audioEngine, activePads, keyMap, audioInitialized]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const padIndex = keyMap[event.key.toLowerCase()];
    if (padIndex !== undefined) {
      setActivePads(prev => {
        const newSet = new Set(prev);
        newSet.delete(padIndex);
        return newSet;
      });
    }
  }, [keyMap]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handlePadClick = async (padIndex: number) => {
    await ensureAudioActive();
    
    onPadSelect(padIndex);
    audioEngine.triggerPad(padIndex, 0.8);
    
    // Visual feedback
    setActivePads(prev => new Set(prev).add(padIndex));
    setTimeout(() => {
      setActivePads(prev => {
        const newSet = new Set(prev);
        newSet.delete(padIndex);
        return newSet;
      });
    }, 100);
  };

  const handleUploadClick = async (padIndex: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent pad click
    await ensureAudioActive();
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        audioEngine.loadSample(padIndex, file);
      }
    };
    input.click();
  };

  const getKeyForPad = (padIndex: number): string => {
    const key = Object.keys(keyMap).find(k => keyMap[k] === padIndex);
    return key?.toUpperCase() || '';
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">PAD GRID</h2>
        <p className="text-gray-400">Click pads to trigger samples, use upload button to load samples</p>
        {!audioInitialized && (
          <div className="mt-2 p-2 bg-yellow-600/20 border border-yellow-600 rounded text-yellow-300 text-sm">
            ⚠️ Click any pad to activate audio
          </div>
        )}
        {audioInitialized && (
          <div className="mt-2 p-2 bg-green-600/20 border border-green-600 rounded text-green-300 text-sm">
            ✓ Audio system active
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4 max-w-2xl">
        {Array.from({ length: 16 }, (_, index) => {
          const sample = audioEngine.getSample(index);
          const isActive = activePads.has(index);
          const isSelected = selectedPad === index;
          const hasSample = sample.buffer !== null;
          const keyLabel = getKeyForPad(index);

          return (
            <div key={index} className="relative">
              <div
                className={`pad w-24 h-24 flex flex-col items-center justify-center relative overflow-hidden ${
                  isActive ? 'active' : ''
                } ${isSelected ? 'ring-2 ring-mpc-blue' : ''} ${
                  hasSample ? 'bg-mpc-light' : 'bg-mpc-gray'
                }`}
                onClick={() => handlePadClick(index)}
              >
                {/* Pad number and key */}
                <div className="absolute top-1 left-1 text-xs font-mono">
                  {index + 1}
                </div>
                <div className="absolute top-1 right-1 text-xs font-mono text-mpc-accent">
                  {keyLabel}
                </div>

                {/* Upload button for empty pads */}
                {!hasSample && (
                  <button
                    onClick={(e) => handleUploadClick(index, e)}
                    className="absolute top-1 left-1/2 transform -translate-x-1/2 p-1 bg-mpc-accent hover:bg-mpc-accent/80 rounded text-xs z-10"
                    title="Upload sample"
                  >
                    <Upload size={12} />
                  </button>
                )}

                {/* Sample name or upload prompt */}
                <div className="text-center px-2 mt-4">
                  {hasSample ? (
                    <div className="text-xs font-medium truncate w-full">
                      {sample.name}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 flex flex-col items-center">
                      <span>Click to {audioInitialized ? 'Activate' : 'Start'}</span>
                      <span className="text-mpc-accent">↑ Upload</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Sample info and controls */}
              <div className="mt-2 text-xs text-center space-y-1">
                {hasSample && (
                  <>
                    <div className="text-gray-400">
                      Vol: {Math.round(sample.volume * 100)}%
                    </div>
                    <button
                      onClick={(e) => handleUploadClick(index, e)}
                      className="px-2 py-1 bg-mpc-gray hover:bg-mpc-light rounded text-xs transition-colors"
                      title="Replace sample"
                    >
                      Replace
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center text-sm text-gray-400 max-w-md">
        <p>Click pads to trigger sounds. Use upload buttons to load audio files.</p>
        <p>Keyboard shortcuts: Q-R, A-F, Z-V, 1-4</p>
        {!audioInitialized && (
          <p className="text-yellow-300 mt-2">
            🔊 Audio will activate on first interaction (required by browsers)
          </p>
        )}
        <div className="mt-4">
          <button
            onClick={async () => {
              await ensureAudioActive();
              (audioEngine as any).testBasicAudio();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            🧪 Test Basic Audio (440Hz Tone)
          </button>
        </div>
      </div>
    </div>
  );
} 