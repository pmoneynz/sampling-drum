# YouTube Cue Point Player

A professional web application for loading YouTube videos and creating precise audio cue points for musical analysis, sampling, and performance. Built with React, TypeScript, Tone.js, and WaveSurfer.js for optimal audio performance.

## Features

### 🎥 YouTube Video Integration
- **URL Input & Validation**: Supports youtube.com, youtu.be, and embed URLs
- **Video Quality Selection**: Choose between 720p (recommended) or 1080p
- **Metadata Extraction**: Displays video title, duration, uploader, and view count
- **10-Minute Limit**: Enforced for optimal performance and user experience

### 🎵 High-Performance Audio Engine
- **Web Audio API**: Precise 44.1kHz audio processing
- **Video/Audio Sync**: Automatic synchronization between video and audio streams
- **Low Latency**: < 10ms cue point triggering for professional use
- **Volume Control**: Real-time audio level adjustment

### 🎯 Advanced Cue Point System
- **16 Cue Point Slots**: Professional-grade cue point management
- **Millisecond Precision**: Accurate to 1ms for tight timing requirements
- **Visual Timeline**: Orange waveform on dark background for optimal visibility
- **Draggable Markers**: Reposition cue points with pixel-perfect accuracy
- **Keyboard Shortcuts**: Full keyboard control (1-9, 0, Shift+1-6)

### 🔍 Waveform Visualization
- **WaveSurfer.js Integration**: Hardware-accelerated canvas rendering
- **Continuous Zoom**: 1x to 32x zoom levels for precise editing
- **44.1kHz Resolution**: Timeline based on audio sample rate, not video framerate
- **Interactive Timeline**: Click to place cue points, drag to seek

### ⌨️ Professional Transport Controls
- **Play/Pause**: Space bar for instant playback control
- **Seek Controls**: 10-second forward/backward seeking (Arrow keys)
- **Cue Point Triggering**: Instant playback from any cue point
- **Auto-Play**: Automatically starts playback when triggering cue points

### 💾 Session Management
- **Save/Load Sessions**: Persistent storage of video URLs and cue points
- **Export Functionality**: Export cue point data as JSON files
- **Local Storage Fallback**: Offline session management capability
- **Recent Videos**: Quick access to recently loaded videos

## Tech Stack

### Frontend
- **React 18**: Modern component-based UI
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Tone.js**: Professional audio engine
- **WaveSurfer.js**: Waveform visualization
- **Lucide React**: Consistent iconography

### Backend
- **Node.js + Express**: RESTful API server
- **yt-dlp**: YouTube video/audio extraction
- **SQLite**: Session data persistence
- **CORS**: Cross-origin resource sharing

### Build Tools
- **Vite**: Fast development and building
- **ESLint**: Code quality enforcement
- **PostCSS**: CSS processing

## Installation & Setup

### Prerequisites
- Node.js 16 or higher
- Python 3.6+ with pip
- Modern web browser (Chrome/Safari recommended)
- yt-dlp package (for YouTube video extraction)

### ⚠️ Important Note About YouTube Access
Due to YouTube's current bot detection mechanisms, direct video extraction may require additional authentication. See [YOUTUBE_ISSUES.md](YOUTUBE_ISSUES.md) for details and solutions.

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install yt-dlp

# Install Node.js dependencies
npm install

# Start development server
npm run dev
```

### Frontend Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build
```bash
# Build frontend
npm run build

# Start backend in production mode
cd backend && npm start
```

## Usage Guide

### 1. Load a YouTube Video
1. Paste a YouTube URL in the input field
2. Select video quality (720p recommended for speed)  
3. Click "Load Video" and wait for processing

**Note**: If YouTube access is restricted, use the demo endpoint at `POST /api/demo/video` or implement cookie authentication as described in [YOUTUBE_ISSUES.md](YOUTUBE_ISSUES.md).

### 2. Navigate the Timeline
- **Zoom**: Use +/- buttons or mouse wheel to zoom waveform
- **Seek**: Click anywhere on the waveform to jump to that position
- **Playback**: Use Space bar or transport controls

### 3. Create Cue Points
1. Click on the waveform timeline where you want to place a cue point
2. The next available cue point button (1-16) will become active
3. Use keyboard shortcuts or click buttons to trigger cue points

### 4. Keyboard Shortcuts
- `Space`: Play/Pause
- `← →`: Seek backward/forward 10 seconds
- `1-9, 0`: Trigger cue points 1-10
- `Shift+1-6`: Trigger cue points 11-16

### 5. Session Management
- **Save Session**: Stores video URL and all cue point positions
- **Export**: Download cue point data as JSON file
- **Load Recent**: Access previously loaded videos

## Performance Specifications

- **Audio Latency**: < 10ms cue point triggering
- **Waveform Rendering**: 60fps during zoom/pan operations
- **Memory Usage**: < 500MB for typical 5-minute video
- **Concurrent Users**: Supports up to 20 simultaneous users
- **Video Processing**: < 30 seconds for 5-minute 720p video

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| Firefox | 84+ | ⚠️ Limited (WebAudio restrictions) |
| Edge | 88+ | ✅ Fully Supported |

## API Documentation

### YouTube Endpoints
- `POST /api/youtube/info` - Extract video metadata
- `POST /api/youtube/extract` - Extract video/audio streams

### Session Endpoints
- `POST /api/sessions/save` - Save cue point session
- `GET /api/sessions/load/:id` - Load saved session
- `GET /api/sessions/list` - List recent sessions

### Health Check
- `GET /api/health` - Server status

## Development

### Project Structure
```
src/
├── audio/              # Audio engine classes
├── components/         # React components
│   ├── video/         # Video-related components
│   ├── cuepoints/     # Cue point management
│   └── ui/            # Reusable UI components
├── hooks/             # Custom React hooks
├── services/          # API services
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

### Key Components
- `VideoAudioEngine`: Core audio processing and cue point management
- `YouTubeInput`: URL validation and video loading
- `CuePointGrid`: 16-button cue point interface
- `WaveformTimeline`: Audio visualization and interaction

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Tone.js** team for the excellent Web Audio API framework
- **WaveSurfer.js** team for the waveform visualization library
- **yt-dlp** developers for YouTube extraction capabilities
- **React** and **TypeScript** communities for the development platform 