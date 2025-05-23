# Sampling Drum Machine

A browser-based software sampling drum machine inspired by the classic AKAI MPC workflow. Built with React, TypeScript, Tone.js, and Tailwind CSS.

## Features

### 🎵 Core Functionality
- **16 Virtual Pads**: Trigger samples with mouse clicks or keyboard keys
- **Pattern-Based Sequencer**: Create and edit 16-step patterns
- **Real-Time Recording**: Record performances with quantization
- **Waveform Editor**: Visual sample editing with trim controls
- **Mixer**: Individual volume and pan controls for each pad
- **Project Management**: Save/load projects using IndexedDB

### 🎹 Pad Grid
- 16 velocity-sensitive pads mapped to keyboard keys (Q-R, A-F, Z-V, 1-4)
- Drag-and-drop sample loading
- Visual feedback during triggering
- Support for WAV, AIFF, and MP3 files

### 🎛️ Sequencer
- Classic MPC-style 16-step grid
- Click to toggle steps on/off
- Real-time step indicator during playback
- Pattern management (create, duplicate, clear)

### 🌊 Waveform Editor
- Interactive waveform display using wavesurfer.js
- Trim controls (start/end points)
- Volume adjustment
- Sample information display
- Playback controls

### 🎚️ Mixer
- Individual volume faders for each pad
- Pan controls (left/right positioning)
- Mute/Solo functionality
- Master volume control
- Global reset functions

### 💾 File Management
- Save projects to browser storage (IndexedDB)
- Load previously saved projects
- Export projects as JSON files
- Import projects from JSON files

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sampling-drum
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### Loading Samples
1. Navigate to the **PADS** view
2. Click on any pad or drag and drop audio files onto pads
3. Supported formats: WAV, AIFF, MP3

### Creating Patterns
1. Switch to the **SEQUENCER** view
2. Click on steps to toggle them on/off
3. Use the transport controls to play/stop/record

### Editing Samples
1. Select a pad with a loaded sample
2. Switch to the **WAVEFORM** view
3. Adjust trim points, volume, and other parameters

### Mixing
1. Switch to the **MIXER** view
2. Adjust volume and pan for each pad
3. Use mute/solo for quick mixing

### Saving Projects
1. Click the file manager button (bottom right)
2. Enter a project name and click "Save"
3. Projects are stored in your browser's local storage

## Keyboard Shortcuts

### Pad Triggers
- **Q, W, E, R**: Pads 1-4
- **A, S, D, F**: Pads 5-8
- **Z, X, C, V**: Pads 9-12
- **1, 2, 3, 4**: Pads 13-16

### Transport
- **Spacebar**: Play/Pause (when implemented)

## Technical Architecture

### Core Technologies
- **React 18**: UI framework
- **TypeScript**: Type safety and better development experience
- **Tone.js**: Web Audio API wrapper for audio processing
- **Wavesurfer.js**: Waveform visualization and editing
- **Tailwind CSS**: Utility-first CSS framework
- **Vite**: Build tool and development server

### Audio Engine
The `AudioEngine` class manages all audio functionality:
- Sample loading and playback
- Pattern sequencing
- Transport controls
- Project serialization

### Data Storage
- **IndexedDB**: Browser-based storage for projects
- **JSON Export/Import**: Cross-platform project sharing

## Browser Compatibility

- Chrome 66+
- Firefox 60+
- Safari 11.1+
- Edge 79+

*Note: Requires Web Audio API support*

## Development

### Project Structure
```
src/
├── audio/           # Audio engine and related utilities
├── components/      # React components
├── hooks/          # Custom React hooks
├── App.tsx         # Main application component
├── main.tsx        # Application entry point
└── index.css       # Global styles and Tailwind imports
```

### Key Components
- `AudioEngine`: Core audio processing and management
- `PadGrid`: Virtual pad interface
- `Sequencer`: Step sequencer interface
- `WaveformEditor`: Sample editing interface
- `Mixer`: Mixing console interface
- `Transport`: Playback controls
- `FileManager`: Project management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Future Enhancements

- Effects processing (reverb, delay, compression)
- Advanced beat-chopping and slicing
- MIDI support
- Audio recording from microphone
- Pattern chaining and song mode
- Swing and groove templates
- Sample library integration

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by the AKAI MPC series
- Built with modern web technologies
- Thanks to the Tone.js and Wavesurfer.js communities 