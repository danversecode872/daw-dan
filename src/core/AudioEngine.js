class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.tracks = new Map();
    this.plugins = new Map();
    this.isPlaying = false;
    this.currentTime = 0;
    this.startTime = 0;
    this.bpm = 120;
    this.sampleRate = 44100;
    
    this.initializeAudio();
  }

  async initializeAudio() {
    try {
      // Try to get audio context for desktop (if available)
      if (typeof window !== 'undefined' && window.require) {
        // Electron environment - try native audio
        try {
          const { desktopCapturer } = window.require('electron');
          // Native audio initialization would go here
          console.log('Native audio initialization attempted');
        } catch (error) {
          console.log('Native audio not available, falling back to Web Audio API');
        }
      }

      // Fallback to Web Audio API
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.sampleRate = this.audioContext.sampleRate;
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      
      // Set up worklet processor for low-latency audio processing
      await this.setupAudioWorklets();
      
      console.log('Audio engine initialized with sample rate:', this.sampleRate);
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      throw error;
    }
  }

  async setupAudioWorklets() {
    try {
      // Register audio worklet processors
      await this.audioContext.audioWorklet.addModule('/worklets/track-processor.js');
      await this.audioContext.audioWorklet.addModule('/worklets/effect-processor.js');
      console.log('Audio worklets registered');
    } catch (error) {
      console.log('Audio worklets not available, using regular nodes');
    }
  }

  createTrack(trackId, trackData) {
    const track = {
      id: trackId,
      type: trackData.type || 'audio',
      gainNode: this.audioContext.createGain(),
      panNode: this.audioContext.createStereoPanner(),
      muted: false,
      solo: false,
      volume: trackData.volume || 0.8,
      pan: trackData.pan || 0,
      clips: [],
      effects: []
    };

    // Connect nodes
    track.gainNode.connect(track.panNode);
    track.panNode.connect(this.masterGain);

    // Set initial values
    track.gainNode.gain.value = track.volume;
    track.panNode.pan.value = track.pan;

    this.tracks.set(trackId, track);
    return track;
  }

  removeTrack(trackId) {
    const track = this.tracks.get(trackId);
    if (track) {
      track.gainNode.disconnect();
      track.panNode.disconnect();
      this.tracks.delete(trackId);
    }
  }

  updateTrack(trackId, updates) {
    const track = this.tracks.get(trackId);
    if (!track) return;

    if (updates.volume !== undefined) {
      track.volume = updates.volume;
      track.gainNode.gain.value = track.volume;
    }

    if (updates.pan !== undefined) {
      track.pan = updates.pan;
      track.panNode.pan.value = track.pan;
    }

    if (updates.muted !== undefined) {
      track.muted = updates.muted;
      if (track.muted) {
        track.gainNode.gain.value = 0;
      } else {
        track.gainNode.gain.value = track.volume;
      }
    }

    if (updates.solo !== undefined) {
      track.solo = updates.solo;
      this.updateSoloStates();
    }

    Object.assign(track, updates);
  }

  updateSoloStates() {
    const hasSolo = Array.from(this.tracks.values()).some(track => track.solo);
    
    this.tracks.forEach(track => {
      if (hasSolo) {
        if (track.solo) {
          track.panNode.connect(this.masterGain);
        } else {
          track.panNode.disconnect();
          track.panNode.connect(this.audioContext.createGain()); // Connect to dummy node
        }
      } else {
        track.panNode.disconnect();
        track.panNode.connect(this.masterGain);
      }
    });
  }

  async loadAudioClip(trackId, audioBuffer) {
    const track = this.tracks.get(trackId);
    if (!track) return null;

    const clip = {
      id: Date.now(),
      buffer: audioBuffer,
      startTime: 0,
      duration: audioBuffer.duration,
      sourceNode: null
    };

    track.clips.push(clip);
    return clip;
  }

  async loadAudioFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      return audioBuffer;
    } catch (error) {
      console.error('Failed to load audio file:', error);
      throw error;
    }
  }

  play(currentTime = 0) {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime - currentTime;

    // Start playback for all clips
    this.tracks.forEach(track => {
      track.clips.forEach(clip => {
        if (clip.startTime <= currentTime) {
          const offset = currentTime - clip.startTime;
          this.playClip(track.id, clip.id, offset);
        }
      });
    });

    this.scheduleFutureClips();
  }

  stop() {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    // Stop all clip sources
    this.tracks.forEach(track => {
      track.clips.forEach(clip => {
        if (clip.sourceNode) {
          clip.sourceNode.stop();
          clip.sourceNode = null;
        }
      });
    });
  }

  playClip(trackId, clipId, offset = 0) {
    const track = this.tracks.get(trackId);
    if (!track) return;

    const clip = track.clips.find(c => c.id === clipId);
    if (!clip || !clip.buffer) return;

    const sourceNode = this.audioContext.createBufferSource();
    sourceNode.buffer = clip.buffer;
    sourceNode.connect(track.gainNode);
    
    const when = this.audioContext.currentTime;
    const duration = clip.buffer.duration - offset;
    
    sourceNode.start(when, offset, duration);
    sourceNode.onended = () => {
      clip.sourceNode = null;
    };

    clip.sourceNode = sourceNode;
  }

  scheduleFutureClips() {
    if (!this.isPlaying) return;

    // Schedule clips that will start in the next second
    const lookAheadTime = 1.0;
    const currentEngineTime = this.getCurrentTime();

    this.tracks.forEach(track => {
      track.clips.forEach(clip => {
        const clipStartTime = clip.startTime;
        const timeUntilClip = clipStartTime - currentEngineTime;

        if (timeUntilClip > 0 && timeUntilClip <= lookAheadTime) {
          setTimeout(() => {
            if (this.isPlaying) {
              this.playClip(track.id, clip.id);
            }
          }, timeUntilClip * 1000);
        }
      });
    });

    // Continue scheduling
    if (this.isPlaying) {
      setTimeout(() => this.scheduleFutureClips(), 100);
    }
  }

  getCurrentTime() {
    if (!this.isPlaying) return 0;
    return this.audioContext.currentTime - this.startTime;
  }

  setCurrentTime(time) {
    const wasPlaying = this.isPlaying;
    
    if (wasPlaying) {
      this.stop();
    }

    // Reset and restart from new position
    this.startTime = this.audioContext.currentTime - time;
    
    if (wasPlaying) {
      this.play(time);
    }
  }

  setBPM(bpm) {
    this.bpm = bpm;
    // Update tempo-dependent calculations
  }

  addPlugin(pluginId, pluginData) {
    const plugin = {
      id: pluginId,
      name: pluginData.name,
      type: pluginData.type,
      parameters: pluginData.parameters || {},
      audioNode: null
    };

    // Create audio node based on plugin type
    if (plugin.type === 'effect') {
      // Create effect node
      plugin.audioNode = this.createEffectNode(pluginData);
    }

    this.plugins.set(pluginId, plugin);
    return plugin;
  }

  createEffectNode(effectData) {
    // Create different effect types
    switch (effectData.effectType) {
      case 'reverb':
        return this.createReverbEffect(effectData);
      case 'delay':
        return this.createDelayEffect(effectData);
      case 'compressor':
        return this.audioContext.createDynamicsCompressor();
      default:
        return this.audioContext.createGain();
    }
  }

  createReverbEffect(options = {}) {
    const convolver = this.audioContext.createConvolver();
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();

    // Create impulse response for reverb
    const length = this.audioContext.sampleRate * 2; // 2 seconds
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }

    convolver.buffer = impulse;
    wetGain.gain.value = options.wetLevel || 0.5;
    dryGain.gain.value = 1 - (options.wetLevel || 0.5);

    return { convolver, wetGain, dryGain };
  }

  createDelayEffect(options = {}) {
    const delay = this.audioContext.createDelay(options.maxDelayTime || 1.0);
    const feedback = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    const dryGain = this.audioContext.createGain();

    delay.delayTime.value = options.delayTime || 0.3;
    feedback.gain.value = options.feedback || 0.4;
    wetGain.gain.value = options.mix || 0.3;
    dryGain.gain.value = 1 - (options.mix || 0.3);

    return { delay, feedback, wetGain, dryGain };
  }

  connectEffectToTrack(trackId, pluginId) {
    const track = this.tracks.get(trackId);
    const plugin = this.plugins.get(pluginId);
    
    if (!track || !plugin || !plugin.audioNode) return;

    // Disconnect existing connection
    track.panNode.disconnect();

    // Create effect chain
    let lastNode = track.panNode;
    
    if (plugin.audioNode.convolver) {
      // Reverb effect
      lastNode.connect(plugin.audioNode.dryGain);
      lastNode.connect(plugin.audioNode.convolver);
      plugin.audioNode.convolver.connect(plugin.audioNode.wetGain);
      plugin.audioNode.dryGain.connect(this.masterGain);
      plugin.audioNode.wetGain.connect(this.masterGain);
    } else if (plugin.audioNode.delay) {
      // Delay effect
      lastNode.connect(plugin.audioNode.dryGain);
      lastNode.connect(plugin.audioNode.delay);
      plugin.audioNode.delay.connect(plugin.audioNode.feedback);
      plugin.audioNode.feedback.connect(plugin.audioNode.delay);
      plugin.audioNode.delay.connect(plugin.audioNode.wetGain);
      plugin.audioNode.dryGain.connect(this.masterGain);
      plugin.audioNode.wetGain.connect(this.masterGain);
    } else {
      // Simple effect
      lastNode.connect(plugin.audioNode);
      plugin.audioNode.connect(this.masterGain);
    }
  }

  dispose() {
    this.stop();
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.tracks.clear();
    this.plugins.clear();
  }
}

export default AudioEngine;
