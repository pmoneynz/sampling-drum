export interface YouTubeVideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  uploader: string;
  upload_date: string;
  view_count: number;
  formats?: Array<{
    format_id: string;
    ext: string;
    acodec: string;
    abr?: number;
  }>;
}

export interface YouTubeVideoExtraction {
  videoId: string;
  audioUrl: string;
  videoUrl: string;
  quality: '720p' | '1080p';
}

export interface YouTubeApiResponse<T> {
  data?: T;
  error?: string;
}

export type VideoQuality = '720p' | '1080p';