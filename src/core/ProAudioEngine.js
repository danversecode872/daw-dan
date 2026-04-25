class ProAudioEngine {
  constructor() {
    this.audioContext = null;
    this.workletContext = null;
    this.masterGain = null;
    this.tracks = new Map();
    this.busses = new Map();
    this.returns = new Map();
    this.plugins = new Map();
    this.isPlaying = false;
    this.currentTime = 0;
    this.startTime = 0;
    this.bpm = 120;
    this.sampleRate = 44100;
    this.bitDepth = 32; // Professional 32-bit float
    this.bufferSize = 512; // Low latency buffer size
    this.audioWorkletAvailable = false;
    
    // Professional audio settings
    this.supportedSampleRates = [44100, 48000, 88200, 96000];
    this.supportedBufferSizes = [64, 128, 256, 512, 1024, 2048];
    
    this.initializeAudio();
  }

  async initializeAudio() {
    try {
      // Initialize Web Audio API with professional settings
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive', // Lowest possible latency
        sampleRate: 96000 // Start with highest sample rate
      });
      
      this.sampleRate = this.audioContext.sampleRate;
      
      // Check for AudioWorklet support (professional audio processing)
      if (this.audioContext.audioWorklet) {
        this.audioWorkletAvailable = true;
        await this.setupAudioWorklets();
      }
      
      // Create professional audio routing
      this.setupAudioRouting();
      
      // Set up professional monitoring
      this.setupMonitoring();
      
      console.log(`Professional audio engine initialized at ${this.sampleRate}Hz, ${this.bitDepth}-bit float`);
      
    } catch (error) {
      console.error('Failed to initialize professional audio engine:', error);
      throw error;
    }
  }

  async setupAudioWorklets() {
    try {
      // Register professional audio worklet processors
      await this.audioContext.audioWorklet.addModule('/worklets/pro-track-processor.js');
      await this.audioContext.audioWorklet.addModule('/worklets/pro-mixer-processor.js');
      await this.audioContext.audioWorklet.addModule('/worklets/pro-effects-processor.js');
      
      // Create worklet node for professional audio processing
      this.workletNode = new AudioWorkletNode(this.audioContext, 'pro-track-processor', {
        outputChannelCount: [2], // Stereo output
        processorOptions: {
          sampleRate: this.sampleRate,
          bufferSize: this.bufferSize,
          bitDepth: this.bitDepth
        }
      });
      
      console.log('Professional audio worklets registered');
    } catch (error) {
      console.log('Audio worklets not available, using regular nodes');
      this.audioWorkletAvailable = false;
    }
  }

  setupAudioRouting() {
    // Create master gain with professional metering
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.8; // -2dB default headroom
    
    // Create professional metering nodes
    this.inputMeter = this.audioContext.createAnalyser();
    this.inputMeter.fftSize = 2048;
    this.inputMeter.smoothingTimeConstant = 0.8;
    
    this.outputMeter = this.audioContext.createAnalyser();
    this.outputMeter.fftSize = 2048;
    this.outputMeter.smoothingTimeConstant = 0.8;
    
    // Create limiter for professional output protection
    this.limiter = this.audioContext.createDynamicsCompressor();
    this.limiter.threshold.value = -1; // -1dB threshold
    this.limiter.ratio.value = 20; // 20:1 ratio for limiting
    this.limiter.attack.value = 0.003; // 3ms attack
    this.limiter.release.value = 0.1; // 100ms release
    
    // Connect professional signal chain
    if (this.workletNode) {
      this.workletNode.connect(this.inputMeter);
      this.inputMeter.connect(this.masterGain);
    } else {
      // Fallback routing
      this.createFallbackRouting();
    }
    
    this.masterGain.connect(this.limiter);
    this.limiter.connect(this.outputMeter);
    this.outputMeter.connect(this.audioContext.destination);
  }

  createFallbackRouting() {
    // Create professional routing without worklets
    this.trackSummingBus = this.audioContext.createGain();
    this.trackSummingBus.connect(this.inputMeter);
  }

  setupMonitoring() {
    // Create professional monitoring features
    this.monitoring = {
      soloBus: this.audioContext.createGain(),
      auditionBus: this.audioContext.createGain(),
      clickTrack: this.audioContext.createGain(),
      talkback: this.audioContext.createGain()
    };
    
    // Set up click track generation
    this.setupClickTrack();
  }

  setupClickTrack() {
    // Create metronome click sounds
    this.clickOscillator = this.audioContext.createOscillator();
    this.clickGain = this.audioContext.createGain();
    
    this.clickOscillator.type = 'sine';
    this.clickOscillator.frequency.value = 1000; // 1kHz click
    this.clickGain.gain.value = 0;
    
    this.clickOscillator.connect(this.clickGain);
    this.clickGain.connect(this.monitoring.clickTrack);
    this.monitoring.clickTrack.connect(this.audioContext.destination);
    
    this.clickOscillator.start();
  }

  createTrack(trackData) {
    const track = {
      id: trackData.id || Date.now(),
      name: trackData.name || `Track ${this.tracks.size + 1}`,
      type: trackData.type || 'audio',
      
      // Professional audio nodes
      inputGain: this.audioContext.createGain(),
      preEffects: this.audioContext.createGain(),
      effects: [],
      postEffects: this.audioContext.createGain(),
      panNode: this.audioContext.createStereoPanner(),
      sendGains: new Map(),
      
      // Professional track parameters
      volume: trackData.volume || 0.8,
      pan: trackData.pan || 0,
      muted: false,
      solo: false,
      recordArmed: false,
      inputChannel: trackData.inputChannel || 0,
      outputChannel: trackData.outputChannel || 0,
      
      // Professional features
      clips: [],
      automation: new Map(),
      plugins: [],
      sends: new Map(),
      
      // Professional metering
      trackMeter: this.audioContext.createAnalyser(),
      
      // Phase and polarity
      phaseInverted: false,
      polarityReversed: false
    };

    // Set up professional track routing
    this.setupTrackRouting(track);
    
    // Set track meter properties
    track.trackMeter.fftSize = 1024;
    
    // Store track
    this.tracks.set(track.id, track);
    
    return track;
  }

  setupTrackRouting(track) {
    // Connect professional signal chain
    track.inputGain.connect(track.preEffects);
    track.preEffects.connect(track.trackMeter);
    
    // Effects chain will be connected dynamically
    track.postEffects.connect(track.panNode);
    track.panNode.connect(this.trackSummingBus || this.masterGain);
    
    // Set initial values
    track.inputGain.gain.value = track.volume;
    track.panNode.pan.value = track.pan;
    
    // Create send effects
    this.createTrackSends(track);
  }

  createTrackSends(track) {
    // Create professional send effects (reverb, delay, etc.)
    const sendTypes = ['reverb', 'delay', 'chorus'];
    
    sendTypes.forEach(sendType => {
      const sendGain = this.audioContext.createGain();
      sendGain.gain.value = 0; // Sends start at 0
      track.sends.set(sendType, sendGain);
    });
  }

  createBus(busData) {
    const bus = {
      id: busData.id || Date.now(),
      name: busData.name || `Bus ${this.busses.size + 1}`,
      type: busData.type || 'aux',
      
      // Bus audio nodes
      inputGain: this.audioContext.createGain(),
      effects: [],
      outputGain: this.audioContext.createGain(),
      
      // Bus parameters
      volume: busData.volume || 0.8,
      muted: false,
      solo: false,
      
      // Bus features
      plugins: [],
      tracks: new Set(), // Tracks routed to this bus
      
      // Bus metering
      busMeter: this.audioContext.createAnalyser(),
    };

    // Set bus meter properties
    bus.busMeter.fftSize = 1024;
    
    // Connect bus routing
    bus.inputGain.connect(bus.busMeter);
    bus.outputGain.connect(this.masterGain);
    
    this.busses.set(bus.id, bus);
    return bus;
  }

  createReturn(returnData) {
    const returnTrack = {
      id: returnData.id || Date.now(),
      name: returnData.name || `Return ${this.returns.size + 1}`,
      type: 'return',
      
      // Return audio nodes
      inputGain: this.audioContext.createGain(),
      effects: [],
      outputGain: this.audioContext.createGain(),
      
      // Return parameters
      volume: returnData.volume || 0.8,
      muted: false,
      
      // Return features
      plugins: [],
      
      // Return metering
      returnMeter: this.audioContext.createAnalyser(),
    };

    // Set return meter properties
    returnTrack.returnMeter.fftSize = 1024;
    
    // Connect return routing
    returnTrack.inputGain.connect(returnTrack.returnMeter);
    returnTrack.outputGain.connect(this.masterGain);
    
    this.returns.set(returnTrack.id, returnTrack);
    return returnTrack;
  }

  updateTrack(trackId, updates) {
    const track = this.tracks.get(trackId);
    if (!track) return;

    // Update professional parameters
    if (updates.volume !== undefined) {
      track.volume = updates.volume;
      track.inputGain.gain.setValueAtTime(track.volume, this.audioContext.currentTime);
    }

    if (updates.pan !== undefined) {
      track.pan = updates.pan;
      track.panNode.pan.setValueAtTime(track.pan, this.audioContext.currentTime);
    }

    if (updates.muted !== undefined) {
      track.muted = updates.muted;
      if (track.muted) {
        track.inputGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      } else {
        track.inputGain.gain.setValueAtTime(track.volume, this.audioContext.currentTime);
      }
    }

    if (updates.solo !== undefined) {
      track.solo = updates.solo;
      this.updateSoloStates();
    }

    // Handle automation
    if (updates.automation) {
      this.updateAutomation(track, updates.automation);
    }

    Object.assign(track, updates);
  }

  updateAutomation(track, automationData) {
    // Professional automation system
    automationData.forEach(param => {
      const { parameterId, points, interpolationType } = param;
      
      // Create automation curve
      const automationCurve = this.createAutomationCurve(points, interpolationType);
      track.automation.set(parameterId, automationCurve);
    });
  }

  createAutomationCurve(points, interpolationType = 'linear') {
    return {
      points,
      interpolationType,
      getValueAtTime: (time) => {
        // Calculate interpolated value at given time
        const sortedPoints = points.sort((a, b) => a.time - b.time);
        
        for (let i = 0; i < sortedPoints.length - 1; i++) {
          const point1 = sortedPoints[i];
          const point2 = sortedPoints[i + 1];
          
          if (time >= point1.time && time <= point2.time) {
            const progress = (time - point1.time) / (point2.time - point1.time);
            
            switch (interpolationType) {
              case 'linear':
                return point1.value + (point2.value - point1.value) * progress;
              case 'exponential':
                return point1.value * Math.pow(point2.value / point1.value, progress);
              case 'step':
                return point1.value;
              default:
                return point1.value;
            }
          }
        }
        
        return sortedPoints[sortedPoints.length - 1]?.value || 0;
      }
    };
  }

  updateSoloStates() {
    const hasSolo = Array.from(this.tracks.values()).some(track => track.solo);
    
    this.tracks.forEach(track => {
      if (hasSolo) {
        if (track.solo) {
          track.panNode.connect(this.masterGain);
        } else {
          track.panNode.disconnect();
        }
      } else {
        track.panNode.disconnect();
        track.panNode.connect(this.masterGain);
      }
    });
  }

  async loadAudioFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Convert to professional 32-bit float if needed
      if (audioBuffer.sampleRate !== this.sampleRate) {
        return this.resampleAudioBuffer(audioBuffer, this.sampleRate);
      }
      
      return audioBuffer;
    } catch (error) {
      console.error('Failed to load audio file:', error);
      throw error;
    }
  }

  resampleAudioBuffer(audioBuffer, targetSampleRate) {
    // Professional sample rate conversion
    const ratio = targetSampleRate / audioBuffer.sampleRate;
    const newLength = Math.floor(audioBuffer.length * ratio);
    
    const resampledBuffer = this.audioContext.createBuffer(
      audioBuffer.numberOfChannels,
      newLength,
      targetSampleRate
    );
    
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = resampledBuffer.getChannelData(channel);
      
      // Linear interpolation resampling
      for (let i = 0; i < newLength; i++) {
        const sourceIndex = i / ratio;
        const index = Math.floor(sourceIndex);
        const fraction = sourceIndex - index;
        
        if (index < inputData.length - 1) {
          outputData[i] = inputData[index] * (1 - fraction) + inputData[index + 1] * fraction;
        } else {
          outputData[i] = inputData[index] || 0;
        }
      }
    }
    
    return resampledBuffer;
  }

  play(currentTime = 0) {
    if (this.isPlaying) return;

    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime - currentTime;

    // Start professional playback with automation
    this.startPlaybackWithAutomation();
  }

  startPlaybackWithAutomation() {
    // Schedule all clips with automation
    this.tracks.forEach(track => {
      track.clips.forEach(clip => {
        if (clip.startTime <= this.getCurrentTime()) {
          this.scheduleClipWithAutomation(track, clip);
        }
      });
    });

    this.scheduleFutureClips();
  }

  scheduleClipWithAutomation(track, clip) {
    // Schedule clip with professional automation
    const offset = this.getCurrentTime() - clip.startTime;
    
    // Apply automation at clip start
    this.applyTrackAutomation(track, this.getCurrentTime());
    
    // Schedule clip playback
    this.playClip(track.id, clip.id, offset);
  }

  applyTrackAutomation(track, time) {
    // Apply all automated parameters
    track.automation.forEach((automation, parameterId) => {
      const value = automation.getValueAtTime(time);
      
      switch (parameterId) {
        case 'volume':
          track.inputGain.gain.setValueAtTime(value, this.audioContext.currentTime);
          break;
        case 'pan':
          track.panNode.pan.setValueAtTime(value, this.audioContext.currentTime);
          break;
        case 'send_reverb':
          track.sends.get('reverb').gain.setValueAtTime(value, this.audioContext.currentTime);
          break;
        case 'send_delay':
          track.sends.get('delay').gain.setValueAtTime(value, this.audioContext.currentTime);
          break;
      }
    });
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

  getCurrentTime() {
    if (!this.isPlaying) return 0;
    return this.audioContext.currentTime - this.startTime;
  }

  getAudioLevels() {
    // Professional audio level monitoring
    const inputLevels = this.getLevelsFromAnalyser(this.inputMeter);
    const outputLevels = this.getLevelsFromAnalyser(this.outputMeter);
    
    return {
      input: inputLevels,
      output: outputLevels,
      peak: Math.max(...inputLevels, ...outputLevels),
      rms: this.calculateRMS(outputLevels)
    };
  }

  getLevelsFromAnalyser(analyser) {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(dataArray);
    
    let peak = 0;
    for (let i = 0; i < bufferLength; i++) {
      peak = Math.max(peak, Math.abs(dataArray[i]));
    }
    
    return [peak, peak]; // Left and right channels (simplified)
  }

  calculateRMS(levels) {
    const sum = levels.reduce((acc, level) => acc + level * level, 0);
    return Math.sqrt(sum / levels.length);
  }

  setSampleRate(sampleRate) {
    if (!this.supportedSampleRates.includes(sampleRate)) {
      throw new Error(`Unsupported sample rate: ${sampleRate}`);
    }
    
    // Reinitialize audio context with new sample rate
    this.dispose();
    this.sampleRate = sampleRate;
    this.initializeAudio();
  }

  setBufferSize(bufferSize) {
    if (!this.supportedBufferSizes.includes(bufferSize)) {
      throw new Error(`Unsupported buffer size: ${bufferSize}`);
    }
    
    this.bufferSize = bufferSize;
    
    if (this.workletNode) {
      // Update worklet processor buffer size
      this.workletNode.port.postMessage({
        type: 'bufferSize',
        value: bufferSize
      });
    }
  }

  dispose() {
    this.stop();
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    this.tracks.clear();
    this.busses.clear();
    this.returns.clear();
    this.plugins.clear();
  }
}

export default ProAudioEngine;
