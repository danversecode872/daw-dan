class WebAudioEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.tracks = new Map();
    this.isPlaying = false;
    this.currentTime = 0;
    this.sampleRate = 48000;
    this.bufferSize = 2048;
    this.analyser = null;
    
    this.initializeAudio();
  }

  async initializeAudio() {
    try {
      // Create audio context with fallback for different browsers
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.sampleRate = this.audioContext.sampleRate;
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.8;
      
      // Create analyser for visualization
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      
      // Connect master gain to analyser and destination
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      
      console.log(`🎵 Web Audio Engine initialized - Sample Rate: ${this.sampleRate}Hz`);
      
      // Resume audio context if suspended (browser policy)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
    } catch (error) {
      console.error('Failed to initialize Web Audio Engine:', error);
      throw new Error('Web Audio API not supported');
    }
  }

  // Create a new track
  createTrack(id, name = 'New Track') {
    const track = {
      id,
      name,
      gainNode: this.audioContext.createGain(),
      panNode: this.audioContext.createStereoPanner(),
      muted: false,
      solo: false,
      recordArmed: false,
      clips: [],
      effects: []
    };
    
    // Connect nodes
    track.panNode.connect(track.gainNode);
    track.gainNode.connect(this.masterGain);
    
    this.tracks.set(id, track);
    return track;
  }

  // Load audio file into track
  async loadAudioFile(trackId, audioFile) {
    try {
      const track = this.tracks.get(trackId);
      if (!track) throw new Error('Track not found');
      
      // Read audio file
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Create clip
      const clip = {
        id: Date.now(),
        name: audioFile.name,
        buffer: audioBuffer,
        startTime: 0,
        duration: audioBuffer.duration,
        source: null
      };
      
      track.clips.push(clip);
      return clip;
      
    } catch (error) {
      console.error('Failed to load audio file:', error);
      throw error;
    }
  }

  // Start playback
  async start() {
    if (this.isPlaying) return;
    
    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.isPlaying = true;
      this.currentTime = 0;
      
      // Schedule all clips
      this.scheduleClips();
      
      console.log('🎵 Playback started');
      
    } catch (error) {
      console.error('Failed to start playback:', error);
      throw error;
    }
  }

  // Stop playback
  stop() {
    if (!this.isPlaying) return;
    
    this.isPlaying = false;
    this.currentTime = 0;
    
    // Stop all sources
    this.tracks.forEach(track => {
      track.clips.forEach(clip => {
        if (clip.source) {
          clip.source.stop();
          clip.source = null;
        }
      });
    });
    
    console.log('⏹️ Playback stopped');
  }

  // Schedule clips for playback
  scheduleClips() {
    const now = this.audioContext.currentTime;
    
    this.tracks.forEach(track => {
      if (!track.muted && (!this.hasSoloTracks() || track.solo)) {
        track.clips.forEach(clip => {
          if (!clip.source && clip.startTime <= this.currentTime) {
            const source = this.audioContext.createBufferSource();
            source.buffer = clip.buffer;
            source.connect(track.panNode);
            
            const startOffset = Math.max(0, this.currentTime - clip.startTime);
            const startTime = now + startOffset;
            const stopTime = startTime + (clip.duration - startOffset);
            
            source.start(startTime, startOffset);
            source.stop(stopTime);
            
            clip.source = source;
            
            // Clean up when finished
            source.onended = () => {
              clip.source = null;
            };
          }
        });
      }
    });
  }

  // Check if any tracks are soloed
  hasSoloTracks() {
    return Array.from(this.tracks.values()).some(track => track.solo);
  }

  // Set track volume
  setTrackVolume(trackId, volume) {
    const track = this.tracks.get(trackId);
    if (track) {
      track.gainNode.gain.value = volume;
    }
  }

  // Set track pan
  setTrackPan(trackId, pan) {
    const track = this.tracks.get(trackId);
    if (track) {
      track.panNode.pan.value = pan;
    }
  }

  // Mute/unmute track
  setTrackMute(trackId, muted) {
    const track = this.tracks.get(trackId);
    if (track) {
      track.muted = muted;
      track.gainNode.gain.value = muted ? 0 : 1;
    }
  }

  // Solo/unsolo track
  setTrackSolo(trackId, solo) {
    const track = this.tracks.get(trackId);
    if (track) {
      track.solo = solo;
      this.updateSoloStates();
    }
  }

  // Update solo states for all tracks
  updateSoloStates() {
    const hasSolo = this.hasSoloTracks();
    
    this.tracks.forEach(track => {
      if (hasSolo) {
        track.gainNode.gain.value = track.solo && !track.muted ? 1 : 0;
      } else {
        track.gainNode.gain.value = track.muted ? 0 : 1;
      }
    });
  }

  // Get audio analysis data
  getAnalysisData() {
    if (!this.analyser) return null;
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    
    return dataArray;
  }

  // Get waveform data
  getWaveformData() {
    if (!this.analyser) return null;
    
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(dataArray);
    
    return dataArray;
  }

  // Record from microphone
  async startRecording(trackId) {
    try {
      const track = this.tracks.get(trackId);
      if (!track) throw new Error('Track not found');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(stream);
      
      // Create recorder node
      const recorder = this.audioContext.createScriptProcessor(this.bufferSize, 1, 1);
      recorder.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        // Process recording data here
        this.processRecordingData(trackId, inputData);
      };
      
      source.connect(recorder);
      recorder.connect(this.audioContext.destination);
      
      track.recording = { source, stream, recorder };
      
      console.log('🎙️ Recording started');
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  // Stop recording
  stopRecording(trackId) {
    const track = this.tracks.get(trackId);
    if (track && track.recording) {
      const { source, stream, recorder } = track.recording;
      
      recorder.disconnect();
      source.disconnect();
      stream.getTracks().forEach(track => track.stop());
      
      delete track.recording;
      
      console.log('⏹️ Recording stopped');
    }
  }

  // Process recording data
  processRecordingData(trackId, inputData) {
    // This would buffer the recording data
    // Implementation depends on your recording strategy
  }

  // Export audio
  async exportAudio(format = 'wav') {
    // Implementation for audio export
    console.log(`📤 Exporting audio as ${format}`);
    return 'audio-data';
  }

  // Clean up
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export for use in web app
window.WebAudioEngine = WebAudioEngine;
