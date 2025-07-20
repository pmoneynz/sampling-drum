import * as Tone from 'tone';
import { CuePoint, PlaybackState } from '../types/cuepoints';
import { YouTubeVideoExtraction } from '../types/youtube';
import { youtubeService } from '../services/youtubeService';

export class VideoAudioEngine {
  private audioElement: HTMLAudioElement | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private audioNode: MediaElementAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private isInitialized = false;
  
  // Playback state
  private playbackState: PlaybackState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLooping: false,
  };

  // Cue points
  private cuePoints: CuePoint[] = [];
  
  // Callbacks
  private onTimeUpdateCallback?: (time: number) => void;
  private onCuePointTriggerCallback?: (cuePointIndex: number) => void;
  
  constructor() {
    this.setupEventListeners();
  }

  async init(): Promise<void> {
    try {
      // Ensure audio context is started
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
      }
      
      this.isInitialized = true;
      console.log('🎥 Video Audio Engine initialized');
    } catch (error) {
      console.error('❌ Failed to initialize video audio engine:', error);
      throw error;
    }
  }

  async loadVideo(extraction: YouTubeVideoExtraction): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      // Clean up previous video/audio
      this.cleanup();

      // Create video element
      this.videoElement = document.createElement('video');
      this.videoElement.src = `http://localhost:3001${extraction.videoUrl}`;
      this.videoElement.crossOrigin = 'anonymous';
      this.videoElement.preload = 'metadata';

      // Create audio element for higher quality audio processing
      this.audioElement = document.createElement('audio');
      this.audioElement.src = `http://localhost:3001${extraction.audioUrl}`;
      this.audioElement.crossOrigin = 'anonymous';
      this.audioElement.preload = 'metadata';

      // Connect audio to Web Audio API
      const audioContext = Tone.getContext().rawContext as AudioContext;
      this.audioNode = audioContext.createMediaElementSource(this.audioElement);
      
      // Create gain node for volume control
      this.gainNode = audioContext.createGain();
      this.gainNode.gain.value = 1.0;

      // Create analyser for waveform visualization
      this.analyser = audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect audio chain: source -> gain -> analyser -> destination
      this.audioNode.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      this.analyser.connect(audioContext.destination);

      // Sync video and audio
      this.setupVideoAudioSync();

      // Wait for metadata to load
      await Promise.all([
        new Promise((resolve, reject) => {
          const handleLoadedMetadata = () => {
            this.videoElement!.removeEventListener('loadedmetadata', handleLoadedMetadata);
            resolve(void 0);
          };
          const handleError = () => {
            this.videoElement!.removeEventListener('error', handleError);
            reject(new Error('Failed to load video'));
          };
          this.videoElement!.addEventListener('loadedmetadata', handleLoadedMetadata);
          this.videoElement!.addEventListener('error', handleError);
        }),
        new Promise((resolve, reject) => {
          const handleLoadedMetadata = () => {
            this.audioElement!.removeEventListener('loadedmetadata', handleLoadedMetadata);
            resolve(void 0);
          };
          const handleError = () => {
            this.audioElement!.removeEventListener('error', handleError);
            reject(new Error('Failed to load audio'));
          };
          this.audioElement!.addEventListener('loadedmetadata', handleLoadedMetadata);
          this.audioElement!.addEventListener('error', handleError);
        })
      ]);

      // Update playback state
      this.playbackState.duration = this.audioElement.duration;
      
      console.log('🎥 Video loaded successfully');
      console.log('📊 Duration:', this.playbackState.duration);
      
    } catch (error) {
      console.error('❌ Failed to load video:', error);
      throw error;
    }
  }

  private setupVideoAudioSync(): void {
    if (!this.videoElement || !this.audioElement) return;

    // Keep video and audio in sync
    const syncInterval = setInterval(() => {
      if (!this.videoElement || !this.audioElement) {
        clearInterval(syncInterval);
        return;
      }

      const timeDiff = Math.abs(this.videoElement.currentTime - this.audioElement.currentTime);
      
      // If they're more than 100ms out of sync, resync
      if (timeDiff > 0.1) {
        this.videoElement.currentTime = this.audioElement.currentTime;
      }
    }, 100);
  }

  private setupEventListeners(): void {
    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with form inputs
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.togglePlayback();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.seekBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.seekForward();
          break;
        // Cue point triggers
        case 'Digit1':
        case 'Digit2':
        case 'Digit3':
        case 'Digit4':
        case 'Digit5':
        case 'Digit6':
        case 'Digit7':
        case 'Digit8':
        case 'Digit9':
        case 'Digit0':
          e.preventDefault();
          const cueIndex = e.code === 'Digit0' ? 9 : parseInt(e.code.slice(-1)) - 1;
          this.triggerCuePoint(cueIndex);
          break;
      }

      // Handle Shift + number for cue points 11-16
      if (e.shiftKey && e.code.startsWith('Digit')) {
        e.preventDefault();
        const digit = parseInt(e.code.slice(-1));
        if (digit >= 1 && digit <= 6) {
          this.triggerCuePoint(digit + 9);
        }
      }
    });
  }

  play(): void {
    if (!this.audioElement || !this.videoElement) return;

    Promise.all([
      this.audioElement.play(),
      this.videoElement.play()
    ]).then(() => {
      this.playbackState.isPlaying = true;
      console.log('▶️ Playback started');
    }).catch(error => {
      console.error('❌ Failed to start playback:', error);
    });
  }

  pause(): void {
    if (!this.audioElement || !this.videoElement) return;

    this.audioElement.pause();
    this.videoElement.pause();
    this.playbackState.isPlaying = false;
    console.log('⏸️ Playback paused');
  }

  togglePlayback(): void {
    if (this.playbackState.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  seekTo(time: number): void {
    if (!this.audioElement || !this.videoElement) return;

    time = Math.max(0, Math.min(time, this.playbackState.duration));
    
    this.audioElement.currentTime = time;
    this.videoElement.currentTime = time;
    this.playbackState.currentTime = time;
    
    this.onTimeUpdateCallback?.(time);
  }

  seekForward(): void {
    this.seekTo(this.playbackState.currentTime + 10);
  }

  seekBackward(): void {
    this.seekTo(this.playbackState.currentTime - 10);
  }

  addCuePoint(position: number, buttonIndex?: number): CuePoint {
    // Find next available button index if not specified
    if (buttonIndex === undefined) {
      buttonIndex = this.getNextAvailableButtonIndex();
    }

    // Remove existing cue point at this button index
    this.cuePoints = this.cuePoints.filter(cp => cp.buttonIndex !== buttonIndex);

    const cuePoint: CuePoint = {
      id: `cue-${Date.now()}`,
      position,
      timestamp: youtubeService.formatTimestamp(position),
      isActive: true,
      buttonIndex,
    };

    this.cuePoints.push(cuePoint);
    this.cuePoints.sort((a, b) => a.position - b.position);

    console.log(`🎯 Added cue point at ${cuePoint.timestamp} (Button ${buttonIndex + 1})`);
    return cuePoint;
  }

  removeCuePoint(cuePointId: string): void {
    this.cuePoints = this.cuePoints.filter(cp => cp.id !== cuePointId);
  }

  updateCuePointPosition(cuePointId: string, newPosition: number): void {
    const cuePoint = this.cuePoints.find(cp => cp.id === cuePointId);
    if (cuePoint) {
      cuePoint.position = newPosition;
      cuePoint.timestamp = youtubeService.formatTimestamp(newPosition);
      this.cuePoints.sort((a, b) => a.position - b.position);
    }
  }

  triggerCuePoint(buttonIndex: number): void {
    const cuePoint = this.cuePoints.find(cp => cp.buttonIndex === buttonIndex);
    if (cuePoint) {
      this.seekTo(cuePoint.position);
      this.onCuePointTriggerCallback?.(buttonIndex);
      
      // Auto-play if not already playing
      if (!this.playbackState.isPlaying) {
        this.play();
      }
      
      console.log(`🎯 Triggered cue point ${buttonIndex + 1} at ${cuePoint.timestamp}`);
    }
  }

  private getNextAvailableButtonIndex(): number {
    for (let i = 0; i < 16; i++) {
      if (!this.cuePoints.find(cp => cp.buttonIndex === i)) {
        return i;
      }
    }
    // If all slots are full, replace the first one
    return 0;
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // Waveform data for visualization
  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  getTimeDomainData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  // Getters
  getPlaybackState(): PlaybackState {
    if (this.audioElement) {
      this.playbackState.currentTime = this.audioElement.currentTime;
    }
    return { ...this.playbackState };
  }

  getCuePoints(): CuePoint[] {
    return [...this.cuePoints];
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }

  // Event callbacks
  onTimeUpdate(callback: (time: number) => void): void {
    this.onTimeUpdateCallback = callback;
    
    if (this.audioElement) {
      this.audioElement.addEventListener('timeupdate', () => {
        this.playbackState.currentTime = this.audioElement!.currentTime;
        callback(this.audioElement!.currentTime);
      });
    }
  }

  onCuePointTrigger(callback: (cuePointIndex: number) => void): void {
    this.onCuePointTriggerCallback = callback;
  }

  private cleanup(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = '';
      this.audioElement = null;
    }

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
      this.videoElement = null;
    }

    if (this.audioNode) {
      this.audioNode.disconnect();
      this.audioNode = null;
    }

    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    this.cuePoints = [];
    this.playbackState = {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isLooping: false,
    };
  }

  destroy(): void {
    this.cleanup();
    console.log('🎥 Video Audio Engine destroyed');
  }
}