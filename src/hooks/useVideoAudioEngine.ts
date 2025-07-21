import { useRef, useEffect, useState, useCallback } from 'react';
import { VideoAudioEngine } from '../audio/VideoAudioEngine';
import { YouTubeVideoExtraction } from '../types/youtube';
import { CuePoint, PlaybackState } from '../types/cuepoints';

export const useVideoAudioEngine = () => {
  const engineRef = useRef<VideoAudioEngine | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLooping: false,
  });
  const [cuePoints, setCuePoints] = useState<CuePoint[]>([]);
  const [currentCuePoint, setCurrentCuePoint] = useState<number | undefined>();

  // Initialize engine
  useEffect(() => {
    const engine = new VideoAudioEngine();
    engineRef.current = engine;

    const initEngine = async () => {
      try {
        await engine.init();
        setIsInitialized(true);
        
        // Set up event listeners
        engine.onTimeUpdate((time) => {
          setPlaybackState(prev => ({ ...prev, currentTime: time }));
        });

        engine.onCuePointTrigger((cuePointIndex) => {
          setCurrentCuePoint(cuePointIndex);
        });

      } catch (error) {
        console.error('Failed to initialize video audio engine:', error);
      }
    };

    initEngine();

    // Cleanup on unmount
    return () => {
      engine.destroy();
    };
  }, []);

  const loadVideo = useCallback(async (extraction: YouTubeVideoExtraction) => {
    if (!engineRef.current) throw new Error('Engine not initialized');
    
    await engineRef.current.loadVideo(extraction);
    const newPlaybackState = engineRef.current.getPlaybackState();
    setPlaybackState(newPlaybackState);
    setCuePoints([]);
    setCurrentCuePoint(undefined);
  }, []);

  const play = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.play();
    setPlaybackState(prev => ({ ...prev, isPlaying: true }));
  }, []);

  const pause = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.pause();
    setPlaybackState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const togglePlayback = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.togglePlayback();
    setPlaybackState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  const seekTo = useCallback((time: number) => {
    if (!engineRef.current) return;
    engineRef.current.seekTo(time);
    setPlaybackState(prev => ({ ...prev, currentTime: time }));
  }, []);

  const seekForward = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.seekForward();
  }, []);

  const seekBackward = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.seekBackward();
  }, []);

  const addCuePoint = useCallback((position: number, buttonIndex?: number) => {
    if (!engineRef.current) return null;
    
    const cuePoint = engineRef.current.addCuePoint(position, buttonIndex);
    const updatedCuePoints = engineRef.current.getCuePoints();
    setCuePoints(updatedCuePoints);
    return cuePoint;
  }, []);

  const removeCuePoint = useCallback((cuePointId: string) => {
    if (!engineRef.current) return;
    
    engineRef.current.removeCuePoint(cuePointId);
    const updatedCuePoints = engineRef.current.getCuePoints();
    setCuePoints(updatedCuePoints);
  }, []);

  const updateCuePointPosition = useCallback((cuePointId: string, newPosition: number) => {
    if (!engineRef.current) return;
    
    engineRef.current.updateCuePointPosition(cuePointId, newPosition);
    const updatedCuePoints = engineRef.current.getCuePoints();
    setCuePoints(updatedCuePoints);
  }, []);

  const triggerCuePoint = useCallback((buttonIndex: number) => {
    if (!engineRef.current) return;
    engineRef.current.triggerCuePoint(buttonIndex);
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (!engineRef.current) return;
    engineRef.current.setVolume(volume);
  }, []);

  const getVideoElement = useCallback(() => {
    if (!engineRef.current) return null;
    return engineRef.current.getVideoElement();
  }, []);

  const getFrequencyData = useCallback(() => {
    if (!engineRef.current) return new Uint8Array(0);
    return engineRef.current.getFrequencyData();
  }, []);

  const getTimeDomainData = useCallback(() => {
    if (!engineRef.current) return new Uint8Array(0);
    return engineRef.current.getTimeDomainData();
  }, []);

  return {
    // State
    isInitialized,
    playbackState,
    cuePoints,
    currentCuePoint,
    
    // Actions
    loadVideo,
    play,
    pause,
    togglePlayback,
    seekTo,
    seekForward,
    seekBackward,
    addCuePoint,
    removeCuePoint,
    updateCuePointPosition,
    triggerCuePoint,
    setVolume,
    
    // Getters
    getVideoElement,
    getFrequencyData,
    getTimeDomainData,
  };
};