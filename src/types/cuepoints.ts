export interface CuePoint {
  id: string;
  position: number; // in seconds, 44.1kHz precision
  timestamp: string; // human readable (MM:SS.mmm)
  isActive: boolean;
  buttonIndex: number; // 0-15 for the 16 buttons
}

export interface Session {
  id: string;
  videoUrl: string;
  videoTitle: string;
  videoDuration: number;
  cuePoints: CuePoint[];
  createdAt: Date;
  lastModified: Date;
}

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentCuePoint?: number;
  isLooping: boolean;
  loopStart?: number;
  loopEnd?: number;
}

export interface ZoomState {
  level: number; // 1x to 32x
  startTime: number;
  endTime: number;
}

export interface WaveformConfig {
  height: number;
  waveColor: string;
  progressColor: string;
  backgroundColor: string;
  cursorColor: string;
  responsive: boolean;
}