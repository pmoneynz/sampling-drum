import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { AudioEngine } from '../audio/AudioEngine';
import { Play, Square, RotateCcw, Volume2 } from 'lucide-react';

interface WaveformEditorProps {
  audioEngine: AudioEngine;
  selectedPad: number;
}

export function WaveformEditor({ audioEngine, selectedPad }: WaveformEditorProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sample, setSample] = useState(audioEngine.getSample(selectedPad));

  useEffect(() => {
    setSample(audioEngine.getSample(selectedPad));
  }, [selectedPad, audioEngine]);

  useEffect(() => {
    // Clean up previous instance
    if (wavesurfer.current) {
      wavesurfer.current.destroy();
      wavesurfer.current = null;
    }

    if (waveformRef.current) {
      // Get audio buffer and peaks for WaveSurfer initialization
      let peaks: Float32Array[] | undefined;
      let duration: number | undefined;

      if (sample.buffer) {
        const audioBuffer = sample.buffer.get();
        if (audioBuffer) {
          peaks = [];
          for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
            peaks.push(audioBuffer.getChannelData(i));
          }
          duration = audioBuffer.duration;
        }
      }

      // Create WaveSurfer instance with peaks and duration if available
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: '#ff6b35',
        progressColor: '#4ade80',
        cursorColor: '#3b82f6',
        barWidth: 2,
        barRadius: 1,
        height: 100,
        normalize: true,
        interact: true,
        // Include peaks and duration if we have them
        ...(peaks && duration ? { peaks, duration } : {})
      });

      wavesurfer.current.on('play', () => setIsPlaying(true));
      wavesurfer.current.on('pause', () => setIsPlaying(false));
      wavesurfer.current.on('finish', () => setIsPlaying(false));
    }

    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
        wavesurfer.current = null;
      }
    };
  }, [sample.buffer]); // Recreate when buffer changes

  const handlePlay = () => {
    if (wavesurfer.current) {
      if (isPlaying) {
        wavesurfer.current.pause();
      } else {
        wavesurfer.current.play();
      }
    }
  };

  const handleStop = () => {
    if (wavesurfer.current) {
      wavesurfer.current.stop();
    }
  };

  const handleNormalize = () => {
    // This would require additional audio processing
    console.log('Normalize function would be implemented here');
  };

  const handleReverse = () => {
    // This would require additional audio processing
    console.log('Reverse function would be implemented here');
  };

  const handleVolumeChange = (volume: number) => {
    audioEngine.setSampleProperty(selectedPad, 'volume', volume);
    setSample(audioEngine.getSample(selectedPad));
  };

  const handleStartTimeChange = (startTime: number) => {
    audioEngine.setSampleProperty(selectedPad, 'startTime', startTime);
    setSample(audioEngine.getSample(selectedPad));
  };

  const handleEndTimeChange = (endTime: number) => {
    audioEngine.setSampleProperty(selectedPad, 'endTime', endTime);
    setSample(audioEngine.getSample(selectedPad));
  };

  if (!sample.buffer) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="text-gray-400 text-center">
          <h2 className="text-2xl font-bold mb-2">WAVEFORM EDITOR</h2>
          <p>No sample loaded for Pad {selectedPad + 1}</p>
          <p className="text-sm mt-2">Load a sample in the Pads view to edit it here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">WAVEFORM EDITOR</h2>
          <p className="text-gray-400">Pad {selectedPad + 1}: {sample.name}</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePlay}
            className={`p-2 rounded transition-colors ${
              isPlaying 
                ? 'bg-mpc-green text-black' 
                : 'bg-mpc-light hover:bg-mpc-accent text-white'
            }`}
          >
            <Play size={16} fill={isPlaying ? 'currentColor' : 'none'} />
          </button>
          
          <button
            onClick={handleStop}
            className="p-2 bg-mpc-light hover:bg-red-600 text-white rounded transition-colors"
          >
            <Square size={16} />
          </button>
        </div>
      </div>

      {/* Waveform display */}
      <div className="bg-mpc-gray p-4 rounded-lg">
        <div ref={waveformRef} className="w-full" />
      </div>

      {/* Sample controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Trim controls */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Trim</h3>
          
          <div className="space-y-2">
            <label className="block text-sm text-gray-400">Start Time</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={sample.startTime}
              onChange={(e) => handleStartTimeChange(parseFloat(e.target.value))}
              className="slider w-full"
            />
            <div className="text-xs text-gray-400">
              {(sample.startTime * (sample.buffer?.duration || 0)).toFixed(2)}s
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-gray-400">End Time</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={sample.endTime}
              onChange={(e) => handleEndTimeChange(parseFloat(e.target.value))}
              className="slider w-full"
            />
            <div className="text-xs text-gray-400">
              {(sample.endTime * (sample.buffer?.duration || 0)).toFixed(2)}s
            </div>
          </div>
        </div>

        {/* Volume control */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Volume</h3>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Volume2 size={16} className="text-gray-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={sample.volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="slider flex-1"
              />
            </div>
            <div className="text-xs text-gray-400 text-center">
              {Math.round(sample.volume * 100)}%
            </div>
          </div>
        </div>

        {/* Processing */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Processing</h3>
          
          <div className="space-y-2">
            <button
              onClick={handleNormalize}
              className="w-full px-4 py-2 bg-mpc-light hover:bg-mpc-accent text-white rounded transition-colors"
            >
              Normalize
            </button>
            
            <button
              onClick={handleReverse}
              className="w-full px-4 py-2 bg-mpc-light hover:bg-mpc-accent text-white rounded transition-colors"
            >
              Reverse
            </button>
            
            <button
              onClick={() => audioEngine.triggerPad(selectedPad, sample.volume)}
              className="w-full px-4 py-2 bg-mpc-accent hover:bg-mpc-accent/80 text-white rounded transition-colors"
            >
              Test Sample
            </button>
          </div>
        </div>
      </div>

      {/* Sample info */}
      <div className="bg-mpc-gray p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Sample Info</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Duration:</span>
            <div>{(sample.buffer?.duration || 0).toFixed(2)}s</div>
          </div>
          <div>
            <span className="text-gray-400">Sample Rate:</span>
            <div>{sample.buffer?.sampleRate || 0} Hz</div>
          </div>
          <div>
            <span className="text-gray-400">Channels:</span>
            <div>{sample.buffer?.numberOfChannels || 0}</div>
          </div>
          <div>
            <span className="text-gray-400">Size:</span>
            <div>{sample.buffer ? Math.round(sample.buffer.length / 1024) : 0} KB</div>
          </div>
        </div>
      </div>
    </div>
  );
} 