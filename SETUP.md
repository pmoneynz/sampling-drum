# Quick Setup Guide

## Prerequisites
- Node.js 16+ 
- Python 3.6+
- yt-dlp package

## One-Command Setup

Run the development startup script:
```bash
./start-dev.sh
```

This script will:
1. Check for yt-dlp installation
2. Install Node.js dependencies if needed
3. Start both backend (port 3001) and frontend (port 5173)

## Manual Setup

### 1. Install yt-dlp
```bash
pip install yt-dlp --break-system-packages
export PATH=$PATH:/home/ubuntu/.local/bin
```

### 2. Install Dependencies
```bash
# Frontend
npm install

# Backend
cd backend && npm install && cd ..
```

### 3. Start Services
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
npm run dev
```

## Usage

1. Open http://localhost:5173 in your browser
2. Paste a YouTube URL (max 10 minutes)
3. Click "Load Video" 
4. Click on the waveform to place cue points
5. Use keyboard shortcuts (1-9, 0, Shift+1-6) to trigger cue points

## Troubleshooting

**yt-dlp not found**: 
- Install with `pip install yt-dlp --break-system-packages`
- Add to PATH: `export PATH=$PATH:/home/ubuntu/.local/bin`

**Video extraction fails**:
- Ensure video is public and under 10 minutes
- Update yt-dlp: `pip install --upgrade yt-dlp`

**CORS errors**:
- Ensure backend is running on port 3001
- Check browser console for specific errors

## Features

### Keyboard Shortcuts
- `Space`: Play/Pause
- `← →`: Seek backward/forward 10s  
- `1-9, 0`: Trigger cue points 1-10
- `Shift+1-6`: Trigger cue points 11-16

### Waveform Interaction
- Click to place cue points
- Zoom with +/- buttons
- Orange waveform visualization
- 44.1kHz precision

### Session Management
- Save/load sessions
- Export cue point data
- Local storage backup