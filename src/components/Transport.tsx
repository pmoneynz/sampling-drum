import React, { useState, useEffect } from 'react';
import { Play, Square, Circle, RotateCcw } from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';

interface TransportProps {
  audioEngine: AudioEngine;
}

export function Transport({ audioEngine }: TransportProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsPlaying(audioEngine.getIsPlaying());
      setIsRecording(audioEngine.getIsRecording());
      setCurrentStep(audioEngine.getCurrentStep());
    }, 50);

    return () => clearInterval(interval);
  }, [audioEngine]);

  const handlePlay = () => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play();
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setCurrentStep(0);
  };

  const handleRecord = () => {
    if (isRecording) {
      audioEngine.stopRecording();
    } else {
      audioEngine.startRecording();
    }
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    audioEngine.setBPM(newBpm);
  };

  return (
    <div className="bg-mpc-gray p-4 flex items-center justify-between">
      {/* Transport Controls */}
      <div className="flex items-center space-x-4">
        <button
          onClick={handlePlay}
          className={`p-3 rounded-lg transition-colors ${
            isPlaying 
              ? 'bg-mpc-green text-black' 
              : 'bg-mpc-light hover:bg-mpc-accent text-white'
          }`}
        >
          <Play size={20} fill={isPlaying ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={handleStop}
          className="p-3 bg-mpc-light hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          <Square size={20} />
        </button>

        <button
          onClick={handleRecord}
          className={`p-3 rounded-lg transition-colors ${
            isRecording 
              ? 'bg-red-600 text-white animate-pulse' 
              : 'bg-mpc-light hover:bg-red-600 text-white'
          }`}
        >
          <Circle size={20} fill={isRecording ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={() => audioEngine.stop()}
          className="p-3 bg-mpc-light hover:bg-mpc-accent text-white rounded-lg transition-colors"
          title="Reset"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-400">STEP:</span>
        <div className="flex space-x-1">
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full border ${
                i === currentStep 
                  ? 'bg-mpc-green border-mpc-green' 
                  : 'border-mpc-light'
              }`}
            />
          ))}
        </div>
      </div>

      {/* BPM Control */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-400">BPM:</label>
          <input
            type="number"
            min="60"
            max="200"
            value={bpm}
            onChange={(e) => handleBpmChange(parseInt(e.target.value))}
            className="w-16 px-2 py-1 bg-mpc-dark border border-mpc-light rounded text-center text-white"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleBpmChange(Math.max(60, bpm - 1))}
            className="px-2 py-1 bg-mpc-light hover:bg-mpc-accent text-white rounded text-sm"
          >
            -
          </button>
          <button
            onClick={() => handleBpmChange(Math.min(200, bpm + 1))}
            className="px-2 py-1 bg-mpc-light hover:bg-mpc-accent text-white rounded text-sm"
          >
            +
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="text-sm text-gray-400">
        {isRecording && <span className="text-red-400 font-medium">● REC</span>}
        {isPlaying && !isRecording && <span className="text-mpc-green font-medium">▶ PLAY</span>}
        {!isPlaying && !isRecording && <span>⏸ STOP</span>}
      </div>
    </div>
  );
} 