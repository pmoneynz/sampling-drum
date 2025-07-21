# YouTube Cue Point Backend

This backend service provides YouTube video extraction and session management for the YouTube Cue Point Player application.

## Requirements

- Node.js 16 or higher
- Python 3.6+ (for yt-dlp)
- yt-dlp package

## Setup

1. **Install Python dependencies:**
```bash
pip install yt-dlp
```

2. **Install Node.js dependencies:**
```bash
npm install
```

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on port 3001 by default.

## API Endpoints

### YouTube Operations

#### POST /api/youtube/info
Extract video information from a YouTube URL.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "id": "VIDEO_ID",
  "title": "Video Title",
  "duration": 180,
  "thumbnail": "https://...",
  "uploader": "Channel Name",
  "upload_date": "20231201",
  "view_count": 1000000
}
```

#### POST /api/youtube/extract
Extract video and audio streams from a YouTube URL.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "quality": "720p"
}
```

**Response:**
```json
{
  "videoId": "VIDEO_ID",
  "audioUrl": "/downloads/VIDEO_ID_audio.mp3",
  "videoUrl": "/downloads/VIDEO_ID_video.mp4",
  "quality": "720p"
}
```

### Session Management

#### POST /api/sessions/save
Save a cue point session.

**Request Body:**
```json
{
  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "videoTitle": "Video Title",
  "videoDuration": 180,
  "cuePoints": [
    {
      "id": "cue-1",
      "position": 30.5,
      "timestamp": "0:30.500",
      "isActive": true,
      "buttonIndex": 0
    }
  ]
}
```

#### GET /api/sessions/load/:sessionId
Load a saved session.

#### GET /api/sessions/list
List recent sessions (last 20).

### Health Check

#### GET /api/health
Server health check.

## Configuration

Environment variables:
- `PORT`: Server port (default: 3001)

## File Structure

```
backend/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── downloads/         # Downloaded video/audio files (auto-created)
├── sessions.db        # SQLite database for sessions (auto-created)
└── README.md         # This file
```

## Limitations

- Maximum video duration: 10 minutes
- Supports public YouTube videos only
- Downloaded files are cached for performance but not automatically cleaned up
- Designed for 20 concurrent users maximum

## Troubleshooting

### yt-dlp Issues
If yt-dlp fails to extract videos:
1. Update yt-dlp: `pip install --upgrade yt-dlp`
2. Check if the video is publicly accessible
3. Verify the video duration is under 10 minutes

### CORS Issues
The server includes CORS headers for local development. For production deployment, configure CORS appropriately for your domain.

### Performance
- Enable caching is enabled for 30 minutes to improve performance
- Downloaded files persist until manually cleaned up
- Consider implementing file cleanup for production use