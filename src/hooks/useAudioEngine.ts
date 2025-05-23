import { useMemo } from 'react';
import { AudioEngine } from '../audio/AudioEngine';

export function useAudioEngine() {
  const audioEngine = useMemo(() => new AudioEngine(), []);
  return audioEngine;
} 