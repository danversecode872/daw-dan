#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Platform detection
const platform = process.platform;
const isWindows = platform === 'win32';
const isMac = platform === 'darwin';
const isLinux = platform === 'linux';

console.log(`🎵 Building DAW Dan for ${platform}...`);

// Build configuration
const buildConfig = {
  windows: {
    script: 'npm run dist:win',
    output: 'dist/DAW Dan Setup *.exe',
    portable: 'dist/DAW Dan *.exe'
  },
  darwin: {
    script: 'npm run dist:mac',
    output: 'dist/DAW Dan-*.dmg',
    zip: 'dist/DAW Dan-*.zip'
  },
  macos: {
    script: 'npm run dist:mac',
    output: 'dist/DAW Dan-*.dmg',
    zip: 'dist/DAW Dan-*.zip'
  },
  linux: {
    script: 'npm run dist:linux',
    appimage: 'dist/DAW Dan-*.AppImage',
    deb: 'dist/DAW Dan-*.deb',
    rpm: 'dist/DAW Dan-*.rpm'
  }
};

// Clean previous builds
function clean() {
  console.log('🧹 Cleaning previous builds...');
  
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  
  if (fs.existsSync('build')) {
    // Keep build directory but clean specific files
    const buildFiles = fs.readdirSync('build');
    buildFiles.forEach(file => {
      if (file.endsWith('.exe') || file.endsWith('.dmg') || file.endsWith('.AppImage')) {
        fs.unlinkSync(path.join('build', file));
      }
    });
  }
  
  console.log('✅ Clean completed');
}

// Install dependencies
function installDependencies() {
  console.log('📦 Installing dependencies...');
  
  try {
    execSync('npm ci', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.error('❌ Failed to install dependencies:', error.message);
    process.exit(1);
  }
}

// Build React app
function buildApp() {
  console.log('🔨 Building React app...');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ React app built');
  } catch (error) {
    console.error('❌ Failed to build React app:', error.message);
    process.exit(1);
  }
}

// Create icons and resources
function createResources() {
  console.log('🎨 Creating resources...');
  
  // Create build directory if it doesn't exist
  if (!fs.existsSync('build')) {
    fs.mkdirSync('build', { recursive: true });
  }
  
  // Create placeholder icons (in production, these would be actual icon files)
  if (isWindows && !fs.existsSync('build/icon.ico')) {
    console.log('⚠️  Windows icon not found. Please add build/icon.ico');
  }
  
  if (isMac && !fs.existsSync('build/icon.icns')) {
    console.log('⚠️  macOS icon not found. Please add build/icon.icns');
  }
  
  if (isLinux && !fs.existsSync('build/icon.png')) {
    console.log('⚠️  Linux icon not found. Please add build/icon.png');
  }
  
  // Create DMG background for macOS
  if (isMac && !fs.existsSync('build/dmg-background.png')) {
    console.log('⚠️  DMG background not found. Please add build/dmg-background.png');
  }
  
  console.log('✅ Resources checked');
}

// Build for specific platform
function buildForPlatform(targetPlatform) {
  const config = buildConfig[targetPlatform];
  
  if (!config) {
    console.error(`❌ Unsupported platform: ${targetPlatform}`);
    process.exit(1);
  }
  
  console.log(`🚀 Building for ${targetPlatform}...`);
  
  try {
    execSync(config.script, { stdio: 'inherit' });
    console.log(`✅ ${targetPlatform} build completed`);
    
    // List output files
    if (fs.existsSync('dist')) {
      const files = fs.readdirSync('dist');
      console.log('\n📦 Generated files:');
      files.forEach(file => {
        console.log(`   dist/${file}`);
      });
    }
    
  } catch (error) {
    console.error(`❌ Failed to build for ${targetPlatform}:`, error.message);
    process.exit(1);
  }
}

// Build for all platforms
function buildAll() {
  console.log('🌍 Building for all platforms...');
  
  const platforms = ['windows', 'mac', 'linux'];
  
  platforms.forEach(p => {
    if (platform === p || platform === 'all') {
      buildForPlatform(p);
    }
  });
}

// Create release package
function createRelease() {
  console.log('📋 Creating release package...');
  
  const releaseDir = 'release';
  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
  }
  
  // Copy built files to release directory
  if (fs.existsSync('dist')) {
    const files = fs.readdirSync('dist');
    files.forEach(file => {
      const src = path.join('dist', file);
      const dest = path.join(releaseDir, file);
      fs.copyFileSync(src, dest);
    });
  }
  
  // Create README for release
  const readme = `# DAW Dan v1.0.0

Professional Cross-Platform Digital Audio Workstation

## Installation

### Windows
- Run \`DAW Dan Setup.exe\` for installer version
- Use \`DAW Dan.exe\` for portable version

### macOS
- Open \`DAW Dan-*.dmg\` and drag to Applications
- Or use the \`DAW Dan-*.zip\` archive

### Linux
- Use \`DAW Dan-*.AppImage\` for universal binary
- Install \`DAW Dan-*.deb\` on Debian/Ubuntu
- Install \`DAW Dan-*.rpm\` on RedHat/Fedora

## System Requirements

- Windows 10/11 (64-bit)
- macOS 10.15+ (Intel/Apple Silicon)
- Linux (Ubuntu 20.04+, equivalent distributions)

- 4GB RAM minimum (8GB recommended)
- 2GB free disk space
- Audio interface or built-in audio device

## Features

- Professional 32-bit/96kHz audio engine
- Advanced MIDI piano roll editor
- Session View for non-linear arranging
- Professional mixing console with VCA faders
- VST3/AU/AAX plugin support
- Automatic Delay Compensation
- Advanced audio warping algorithms
- Real-time cloud collaboration
- Video scoring and SMPTE sync
- Macro controls and workflow automation

## Support

- Documentation: https://docs.dawdan.com
- Issues: https://github.com/dawdan/daw-dan/issues
- Community: https://community.dawdan.com

© 2024 DAW Dan. All rights reserved.
`;
  
  fs.writeFileSync(path.join(releaseDir, 'README.md'), readme);
  
  console.log('✅ Release package created');
}

// Main build process
function main() {
  const args = process.argv.slice(2);
  const target = args[0] || platform;
  
  console.log('🎵 DAW Dan Cross-Platform Build System');
  console.log('=====================================\n');
  
  // Clean previous builds
  clean();
  
  // Install dependencies
  installDependencies();
  
  // Build React app
  buildApp();
  
  // Create resources
  createResources();
  
  // Build for target platform(s)
  if (target === 'all') {
    buildAll();
  } else {
    buildForPlatform(target);
  }
  
  // Create release package
  if (args.includes('--release')) {
    createRelease();
  }
  
  console.log('\n🎉 Build completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Test the built application');
  console.log('2. Run automated tests if available');
  console.log('3. Create release notes');
  console.log('4. Upload to distribution platform');
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run main function
if (require.main === module) {
  main();
}

module.exports = {
  clean,
  installDependencies,
  buildApp,
  createResources,
  buildForPlatform,
  buildAll,
  createRelease
};
