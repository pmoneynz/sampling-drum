import { useState, useEffect } from 'react';
import { PadGrid } from './components/PadGrid';
import { Sequencer } from './components/Sequencer';
import { WaveformEditor } from './components/WaveformEditor';
import { Mixer } from './components/Mixer';
import { Transport } from './components/Transport';
import { FileManager } from './components/FileManager';
import { Header } from './components/Header';
import { useAudioEngine } from './hooks/useAudioEngine';

export type View = 'pads' | 'sequencer' | 'waveform' | 'mixer';

function App() {
  const [currentView, setCurrentView] = useState<View>('pads');
  const [selectedPad, setSelectedPad] = useState<number>(0);
  const audioEngine = useAudioEngine();

  useEffect(() => {
    // Initialize audio engine
    const initAudio = async () => {
      try {
        await audioEngine.init();
      } catch (error) {
        console.error('Audio initialization failed:', error);
      }
    };
    
    initAudio();
    
    return () => {
      audioEngine.dispose();
    };
  }, [audioEngine]);

  // Monitor audio context state
  useEffect(() => {
    const checkAudioState = () => {
      const state = (window as any).Tone?.getContext()?.state;
      console.log('Audio context state:', state);
    };
    
    const interval = setInterval(checkAudioState, 5000);
    return () => clearInterval(interval);
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'pads':
        return (
          <PadGrid
            audioEngine={audioEngine}
            selectedPad={selectedPad}
            onPadSelect={setSelectedPad}
          />
        );
      case 'sequencer':
        return (
          <Sequencer
            audioEngine={audioEngine}
            selectedPad={selectedPad}
          />
        );
      case 'waveform':
        return (
          <WaveformEditor
            audioEngine={audioEngine}
            selectedPad={selectedPad}
          />
        );
      case 'mixer':
        return (
          <Mixer
            audioEngine={audioEngine}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-mpc-dark text-white">
      <Header 
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4">
          {renderCurrentView()}
        </div>
        
        <div className="border-t border-mpc-light">
          <Transport audioEngine={audioEngine} />
        </div>
      </div>
      
      <FileManager audioEngine={audioEngine} />
    </div>
  );
}

export default App; 