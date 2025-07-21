import { YouTubeVideoInfo, YouTubeVideoExtraction, VideoQuality } from '../types/youtube';
import { io, Socket } from 'socket.io-client';

const API_BASE_URL = 'http://localhost:3001/api';

interface ProgressData {
  stage: string;
  audioProgress: number;
  videoProgress: number;
  message: string;
  speed?: string;
  eta?: string;
}

interface ExtractionCallbacks {
  onProgress?: (data: ProgressData) => void;
  onError?: (error: any) => void;
  onComplete?: (result: any) => void;
}

class YouTubeService {
  private socket: Socket | null = null;

  private initSocket(): Socket {
    if (!this.socket) {
      this.socket = io('http://localhost:3001');
    }
    return this.socket;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getVideoInfo(url: string): Promise<YouTubeVideoInfo> {
    return this.makeRequest<YouTubeVideoInfo>('/youtube/info', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });
  }

  async extractVideo(
    url: string, 
    quality: VideoQuality = '720p',
    callbacks?: ExtractionCallbacks
  ): Promise<YouTubeVideoExtraction> {
    const socket = this.initSocket();
    
    // Set up socket listeners if callbacks provided
    if (callbacks) {
      if (callbacks.onProgress) {
        socket.on('extraction-progress', callbacks.onProgress);
      }
      if (callbacks.onError) {
        socket.on('extraction-error', callbacks.onError);
      }
      socket.on('extraction-complete', (data) => {
        if (data.success) {
          callbacks.onComplete?.(data.result);
        } else {
          callbacks.onError?.(data);
        }
      });
    }

    return this.makeRequest<YouTubeVideoExtraction>('/youtube/extract', {
      method: 'POST',
      body: JSON.stringify({ url, quality, socketId: socket.id }),
    });
  }

  disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest<{ status: string; timestamp: string }>('/health');
  }

  // Validate YouTube URL on the client side
  isValidYouTubeUrl(url: string): boolean {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
    ];
    return patterns.some(pattern => pattern.test(url));
  }

  // Extract video ID from URL
  extractVideoId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  }

  // Format duration from seconds to MM:SS
  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Format timestamp with milliseconds for cue points
  formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const wholeSeconds = Math.floor(remainingSeconds);
    const milliseconds = Math.floor((remainingSeconds - wholeSeconds) * 1000);
    
    return `${minutes}:${wholeSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }
}

export const youtubeService = new YouTubeService();