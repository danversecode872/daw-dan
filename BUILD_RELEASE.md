# Building DAW Dan Release Files

## Quick Build Commands

Once you have Node.js/npm available, run these commands to build all release files:

```bash
# Install dependencies
npm install

# Build for all platforms
npm run build:all

# Or build specific platforms
npm run build:win      # Windows
npm run build:mac      # macOS
npm run build:linux    # Linux

# Create complete release package
npm run release
```

## Release Files Location

After building, you'll find the installers in:
- `dist/DAW Dan Setup *.exe` - Windows installer
- `dist/DAW Dan-*.dmg` - macOS DMG (Intel)
- `dist/DAW Dan-*.arm64.dmg` - macOS DMG (Apple Silicon)
- `dist/DAW Dan-*.AppImage` - Linux universal binary
- `dist/DAW Dan-*.deb` - Linux Debian package
- `dist/DAW Dan-*.rpm` - Linux RedHat package

## GitHub Release Creation

1. Go to: https://github.com/danversecode872/daw-dan/releases/new
2. Tag version: `v1.0.0`
3. Release title: `DAW Dan v1.0.0 - Professional Cross-Platform DAW`
4. Release description: Use the template below
5. Upload all files from the `dist/` directory
6. Click "Publish release"

## Release Description Template

```
🎵 **DAW Dan v1.0.0 - Professional Cross-Platform DAW**

**Professional Features:**
- 32-bit/96kHz+ audio engine with low latency
- Advanced MIDI piano roll with velocity control
- Session View for non-linear arranging (Ableton-style)
- Professional mixing console with VCA faders
- VST3/AU/AAX plugin support
- Automatic Delay Compensation
- Advanced audio warping algorithms
- Macro controls and workflow automation
- Native capture functionality
- Video scoring with SMPTE sync
- Cloud collaboration integration
- Score editor with MusicXML export

**Installation:**
- **Windows**: Download and run `DAW Dan Setup.exe`
- **macOS Intel**: Download and open `DAW Dan-1.0.0.dmg`
- **macOS Apple Silicon**: Download and open `DAW Dan-1.0.0-arm64.dmg`
- **Linux**: Download and run `DAW Dan-1.0.0.AppImage`

**System Requirements:**
- Windows 10/11 (64-bit)
- macOS 10.15+ (Intel/Apple Silicon)
- Linux (Ubuntu 20.04+ or equivalent)
- 4GB RAM minimum (8GB recommended)
- 2GB free disk space
- Audio interface or built-in audio device

**Cross-Platform Support:**
- Windows: ASIO, WASAPI, DirectSound drivers
- macOS: CoreAudio, Aggregate Device support
- Linux: JACK, PulseAudio, ALSA drivers

**Source Code:**
https://github.com/danversecode872/daw-dan

**Documentation:**
See README.md in the repository for detailed setup instructions.
```

## Alternative: Manual Release Without Build Files

If you can't build the installers right now, you can still create a release:

1. Go to: https://github.com/danversecode872/daw-dan/releases/new
2. Tag version: `v1.0.0`
3. Release title: `DAW Dan v1.0.0 - Source Code Release`
4. Description: "Source code release. Build installers with 'npm run build:all'"
5. Publish release

This allows users to clone and build the application themselves.
