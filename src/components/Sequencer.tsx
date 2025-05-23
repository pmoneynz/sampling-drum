import { useState, useEffect } from 'react';
import { AudioEngine } from '../audio/AudioEngine';

interface SequencerProps {
  audioEngine: AudioEngine;
  selectedPad: number;
}

export function Sequencer({ audioEngine, selectedPad }: SequencerProps) {
  const [currentPattern, setCurrentPattern] = useState(audioEngine.getCurrentPattern());
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPattern(audioEngine.getCurrentPattern());
      setCurrentStep(audioEngine.getCurrentStep());
    }, 50);

    return () => clearInterval(interval);
  }, [audioEngine]);

  const handleStepClick = (padIndex: number, stepIndex: number) => {
    audioEngine.toggleStep(padIndex, stepIndex);
    setCurrentPattern(audioEngine.getCurrentPattern());
  };

  const handleClearPad = (padIndex: number) => {
    const pattern = audioEngine.getCurrentPattern();
    for (let i = 0; i < pattern.length; i++) {
      if (pattern.steps[padIndex][i]) {
        audioEngine.toggleStep(padIndex, i);
      }
    }
    setCurrentPattern(audioEngine.getCurrentPattern());
  };

  const handleClearAll = () => {
    const pattern = audioEngine.getCurrentPattern();
    for (let padIndex = 0; padIndex < 16; padIndex++) {
      for (let stepIndex = 0; stepIndex < pattern.length; stepIndex++) {
        if (pattern.steps[padIndex][stepIndex]) {
          audioEngine.toggleStep(padIndex, stepIndex);
        }
      }
    }
    setCurrentPattern(audioEngine.getCurrentPattern());
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">SEQUENCER</h2>
          <p className="text-gray-400">Pattern: {currentPattern.name}</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => handleClearPad(selectedPad)}
            className="px-4 py-2 bg-mpc-light hover:bg-mpc-accent text-white rounded transition-colors"
          >
            Clear Pad {selectedPad + 1}
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Step numbers */}
      <div className="flex items-center space-x-2">
        <div className="w-20 text-sm text-gray-400 text-center">PAD</div>
        <div className="flex space-x-1">
          {Array.from({ length: currentPattern.length }, (_, i) => (
            <div key={i} className="w-8 text-xs text-center text-gray-400">
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Sequencer grid */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {Array.from({ length: 16 }, (_, padIndex) => {
          const sample = audioEngine.getSample(padIndex);
          const isSelectedPad = padIndex === selectedPad;
          
          return (
            <div key={padIndex} className="flex items-center space-x-2">
              {/* Pad info */}
              <div 
                className={`w-20 p-2 text-xs rounded cursor-pointer transition-colors ${
                  isSelectedPad 
                    ? 'bg-mpc-accent text-white' 
                    : 'bg-mpc-gray text-gray-300 hover:bg-mpc-light'
                }`}
                onClick={() => audioEngine.triggerPad(padIndex, 0.8)}
              >
                <div className="font-medium">{padIndex + 1}</div>
                <div className="truncate">{sample.name}</div>
              </div>

              {/* Steps */}
              <div className="flex space-x-1">
                {Array.from({ length: currentPattern.length }, (_, stepIndex) => {
                  const isActive = currentPattern.steps[padIndex][stepIndex];
                  const isCurrent = stepIndex === currentStep;
                  
                  return (
                    <button
                      key={stepIndex}
                      onClick={() => handleStepClick(padIndex, stepIndex)}
                      className={`step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pattern controls */}
      <div className="flex items-center justify-between pt-4 border-t border-mpc-light">
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-400">
            Pattern Length: {currentPattern.length} steps
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => audioEngine.addPattern()}
            className="px-4 py-2 bg-mpc-light hover:bg-mpc-accent text-white rounded transition-colors"
          >
            New Pattern
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-400 text-center">
        <p>Click steps to toggle them on/off. Click pad names to trigger sounds.</p>
        <p>Green border indicates current playing step.</p>
      </div>
    </div>
  );
} 