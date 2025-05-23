import { useState, useEffect } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { Volume2, VolumeX } from 'lucide-react';

interface MixerProps {
  audioEngine: AudioEngine;
}

export function Mixer({ audioEngine }: MixerProps) {
  const [samples, setSamples] = useState(audioEngine.getSamples());
  const [masterVolume, setMasterVolume] = useState(0.8);

  useEffect(() => {
    const interval = setInterval(() => {
      setSamples(audioEngine.getSamples());
    }, 100);

    return () => clearInterval(interval);
  }, [audioEngine]);

  const handleVolumeChange = (padIndex: number, volume: number) => {
    audioEngine.setSampleProperty(padIndex, 'volume', volume);
    setSamples(audioEngine.getSamples());
  };

  const handlePanChange = (padIndex: number, pan: number) => {
    audioEngine.setSampleProperty(padIndex, 'pan', pan);
    setSamples(audioEngine.getSamples());
  };

  const handleMute = (padIndex: number) => {
    const sample = samples[padIndex];
    const newVolume = sample.volume > 0 ? 0 : 0.8;
    handleVolumeChange(padIndex, newVolume);
  };

  const handleSolo = (padIndex: number) => {
    // Mute all other pads
    samples.forEach((_, index) => {
      if (index !== padIndex) {
        handleVolumeChange(index, 0);
      } else {
        handleVolumeChange(index, 0.8);
      }
    });
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">MIXER</h2>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Volume2 size={20} className="text-gray-400" />
            <span className="text-sm text-gray-400">Master:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="slider w-24"
            />
            <span className="text-sm text-gray-400 w-12">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Mixer channels */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {samples.map((sample, index) => (
          <div key={index} className="bg-mpc-gray p-4 rounded-lg flex flex-col space-y-3">
            {/* Channel header */}
            <div className="text-center">
              <div className="text-sm font-medium">PAD {index + 1}</div>
              <div className="text-xs text-gray-400 truncate" title={sample.name}>
                {sample.name}
              </div>
            </div>

            {/* Volume fader */}
            <div className="flex flex-col items-center space-y-2 flex-1">
              <div className="text-xs text-gray-400">VOL</div>
              <div className="flex flex-col items-center h-32">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={sample.volume}
                  onChange={(e) => handleVolumeChange(index, parseFloat(e.target.value))}
                  className="slider h-24 transform -rotate-90 origin-center"
                  style={{ width: '80px' }}
                />
                <div className="text-xs text-center mt-2">
                  {Math.round(sample.volume * 100)}%
                </div>
              </div>
            </div>

            {/* Pan control */}
            <div className="space-y-2">
              <div className="text-xs text-gray-400 text-center">PAN</div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={sample.pan}
                onChange={(e) => handlePanChange(index, parseFloat(e.target.value))}
                className="slider w-full"
              />
              <div className="text-xs text-center text-gray-400">
                {sample.pan === 0 ? 'C' : sample.pan > 0 ? `R${Math.round(sample.pan * 100)}` : `L${Math.round(Math.abs(sample.pan) * 100)}`}
              </div>
            </div>

            {/* Control buttons */}
            <div className="flex space-x-1">
              <button
                onClick={() => handleMute(index)}
                className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                  sample.volume === 0 
                    ? 'bg-red-600 text-white' 
                    : 'bg-mpc-light hover:bg-red-600 text-white'
                }`}
              >
                {sample.volume === 0 ? <VolumeX size={12} /> : 'MUTE'}
              </button>
              
              <button
                onClick={() => handleSolo(index)}
                className="flex-1 px-2 py-1 text-xs bg-mpc-light hover:bg-yellow-600 text-white rounded transition-colors"
              >
                SOLO
              </button>
            </div>

            {/* Trigger button */}
            <button
              onClick={() => audioEngine.triggerPad(index, sample.volume)}
              className="w-full px-2 py-2 bg-mpc-accent hover:bg-mpc-accent/80 text-white rounded transition-colors"
              disabled={!sample.buffer}
            >
              PLAY
            </button>
          </div>
        ))}
      </div>

      {/* Global controls */}
      <div className="flex justify-center space-x-4 pt-4 border-t border-mpc-light">
        <button
          onClick={() => {
            samples.forEach((_, index) => handleVolumeChange(index, 0.8));
          }}
          className="px-6 py-2 bg-mpc-light hover:bg-mpc-accent text-white rounded transition-colors"
        >
          Reset All Volumes
        </button>
        
        <button
          onClick={() => {
            samples.forEach((_, index) => handlePanChange(index, 0));
          }}
          className="px-6 py-2 bg-mpc-light hover:bg-mpc-accent text-white rounded transition-colors"
        >
          Center All Pans
        </button>
        
        <button
          onClick={() => {
            samples.forEach((_, index) => {
              handleVolumeChange(index, 0);
            });
          }}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          Mute All
        </button>
      </div>

      {/* Instructions */}
      <div className="text-sm text-gray-400 text-center">
        <p>Adjust volume and pan for each pad. Use MUTE/SOLO for quick mixing.</p>
        <p>Click PLAY to test individual samples.</p>
      </div>
    </div>
  );
} 