# DAW Dan

A professional cross-platform Digital Audio Workstation with advanced features, built with Electron and React.

## 🎵 Features

### Core Professional Features
- **32-bit/96kHz+ Audio Engine** - Professional-grade audio processing
- **Multi-track Audio Recording** - Low-latency simultaneous recording
- **Advanced MIDI Sequencing** - Professional piano roll with velocity control
- **Session View** - Non-linear clip-based arranging (Ableton-style)
- **Advanced Audio Warping** - 6 warp modes including Complex Pro
- **Professional Mixing Console** - VCA faders, sends, returns, and busses
- **Automatic Delay Compensation** - Perfect timing synchronization
- **VST3/AU/AAX Plugin Support** - Native bridge for third-party plugins

### Advanced Workflow Features
- **Advanced Audio Editing Suite** - Professional editing with pitch correction
- **Macro Controls** - Workflow automation and customization
- **Native Capture Functionality** - Retrospective MIDI/audio recording
- **Video Scoring Tools** - SMPTE timecode and video integration
- **Cloud Collaboration** - Real-time project sharing and collaboration
- **Score Editor** - Professional music notation with MusicXML

### Cross-Platform Support
- **Windows** - ASIO, WASAPI, DirectSound drivers
- **macOS** - CoreAudio, Aggregate Device support
- **Linux** - JACK, PulseAudio, ALSA drivers
- **Native Installers** - Platform-specific installation packages

## Architecture

### Core Components

- **AudioEngine**: Core audio processing engine
- **PluginAPI**: Plugin system interface and management
- **ProjectStore**: State management for projects, tracks, and plugins
- **UI Components**: React components for the interface

### Plugin System

DAW Dan supports a custom plugin API that allows you to create:

- **Audio Effects** (reverb, delay, compression, etc.)
- **Virtual Instruments** (synthesizers, samplers)
- **Utility Plugins** (analyzers, meters, etc.)

#### Creating a Plugin

```javascript
import { BasePlugin } from './core/PluginAPI.js';

export default class MyReverb extends BasePlugin {
  constructor() {
    super();
    this.id = 'my-reverb';
    this.name = 'My Reverb';
    this.version = '1.0.0';
    this.author = 'Your Name';
    this.type = 'effect';
  }

  init(audioContext, sampleRate) {
    // Initialize your plugin
    return super.init(audioContext, sampleRate);
  }

  process(inputBuffer, outputBuffer, parameters) {
    // Process audio
    // Apply reverb algorithm here
    return super.process(inputBuffer, outputBuffer, parameters);
  }

  getParameters() {
    return [
      { id: 'roomSize', name: 'Room Size', type: 'float', min: 0, max: 1, defaultValue: 0.5 },
      { id: 'damping', name: 'Damping', type: 'float', min: 0, max: 1, defaultValue: 0.5 },
      { id: 'wetLevel', name: 'Wet Level', type: 'float', min: 0, max: 1, defaultValue: 0.3 }
    ];
  }
}
```

## 🚀 Installation

### System Requirements

- **Windows**: Windows 10/11 (64-bit), 4GB RAM (8GB recommended)
- **macOS**: macOS 10.15+ (Intel/Apple Silicon), 4GB RAM (8GB recommended)
- **Linux**: Ubuntu 20.04+ or equivalent, 4GB RAM (8GB recommended)

### Quick Install

#### Windows
1. Download `DAW Dan Setup.exe` from releases
2. Run the installer and follow the setup wizard
3. Launch DAW Dan from Start Menu or desktop shortcut

#### macOS
1. Download `DAW Dan-*.dmg` from releases
2. Open the DMG file
3. Drag DAW Dan to Applications folder
4. Launch from Applications folder

#### Linux
1. Download `DAW Dan-*.AppImage` for universal binary
2. Make executable: `chmod +x DAW Dan-*.AppImage`
3. Run: `./DAW Dan-*.AppImage`

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/dawdan/daw-dan.git
cd daw-dan
```

2. Install dependencies:
```bash
npm install
```

3. Start development:
```bash
npm run dev
```

### Cross-Platform Building

#### Build for current platform:
```bash
npm run build:cross
```

#### Build for specific platforms:
```bash
npm run build:win      # Windows
npm run build:mac      # macOS
npm run build:linux    # Linux
```

#### Build for all platforms:
```bash
npm run build:all
```

#### Create release packages:
```bash
npm run release
```

The built applications will be in the `dist/` directory.

## Development

### Running the Application

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm run dist
```

## Project Structure

```
daw-dan/
src/
  components/          # React UI components
    TrackList.jsx     # Track management panel
    Timeline.jsx      # Timeline and waveform display
    TransportControls.jsx # Playback controls
    PluginManager.jsx # Plugin management interface
  core/
    AudioEngine.js    # Core audio processing
    PluginAPI.js      # Plugin system interface
  stores/
    projectStore.js   # Zustand state management
  main.jsx           # React app entry point
  index.css          # Global styles
main.js              # Electron main process
preload.js           # Electron preload script
```

## Plugin Development

### Supported Plugin Types

1. **Effects**: Process audio input and output modified audio
2. **Instruments**: Generate audio from MIDI input
3. **Utilities**: Analyze or modify audio without changing the signal

### Plugin API

All plugins must implement the following interface:

- `init(audioContext, sampleRate)`: Initialize the plugin
- `process(inputBuffer, outputBuffer, parameters)`: Process audio
- `getParameters()`: Return parameter definitions
- `setParameter(id, value)`: Set parameter values
- `dispose()`: Clean up resources

### Third-Party Plugin Support

DAW Dan is designed to support third-party plugins through:

- **Custom API**: JavaScript-based plugins
- **VST/AU**: Native plugin support (planned)
- **LV2**: Linux plugin support (planned)

## Audio Features

- **Low-latency audio processing**
- **Multi-track recording and playback**
- **Real-time effects processing**
- **Automatable parameters**
- **BPM-synced effects**
- **Sample rate support** (44.1kHz, 48kHz, 96kHz)

## System Requirements

- **macOS**: 10.14 or later
- **Windows**: Windows 10 or later
- **Linux**: Ubuntu 18.04 or later
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 500MB for application, additional space for projects

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Roadmap

- [ ] MIDI recording and playback
- [ ] VST/AU plugin support
- [ ] Audio quantization
- [ ] Advanced editing tools
- [ ] Mixer with sends and returns
- [ ] Automation lanes
- [ ] Score/piano roll editor
- [ ] Video sync support
- [ ] Export to various formats (WAV, MP3, etc.)

## Support

For issues, feature requests, or questions:
- Create an issue on GitHub
- Check the documentation
- Join the community forum
