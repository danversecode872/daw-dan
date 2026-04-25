class AutomaticDelayCompensation {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.sampleRate = audioEngine.sampleRate;
    this.bufferSize = audioEngine.bufferSize || 128;
    
    // Track delay compensation data
    this.trackDelays = new Map(); // trackId -> delay in samples
    this.pluginDelays = new Map(); // pluginId -> delay in samples
    this.totalDelays = new Map(); // trackId -> total compensated delay
    
    // ADC settings
    this.enabled = true;
    this.compensationMode = 'automatic'; // automatic, manual, off
    this.maxCompensation = this.sampleRate * 2; // 2 seconds max compensation
    this.reporting = true; // Show delay compensation info
    
    // Compensation buffers
    this.compensationBuffers = new Map();
    
    // Initialize with default delays
    this.initializeDelays();
  }
  
  initializeDelays() {
    // Set default plugin delays (in samples)
    // These are typical values for different plugin types
    this.defaultPluginDelays = {
      'eq': 0,
      'compressor': 64,
      'reverb': 512,
      'delay': 256,
      'chorus': 128,
      'limiter': 32,
      'gate': 16,
      'saturation': 8
    };
  }
  
  enable() {
    this.enabled = true;
    console.log('Automatic Delay Compensation enabled');
    this.recalculateCompensation();
  }
  
  disable() {
    this.enabled = false;
    console.log('Automatic Delay Compensation disabled');
    this.clearCompensation();
  }
  
  setCompensationMode(mode) {
    this.compensationMode = mode;
    
    switch (mode) {
      case 'automatic':
        this.enabled = true;
        this.recalculateCompensation();
        break;
      case 'manual':
        this.enabled = false;
        break;
      case 'off':
        this.enabled = false;
        this.clearCompensation();
        break;
    }
  }
  
  addTrack(trackId) {
    if (!this.trackDelays.has(trackId)) {
      this.trackDelays.set(trackId, {
        plugins: [],
        manualDelay: 0,
        totalDelay: 0,
        compensatedDelay: 0,
        bufferSize: 0
      });
      
      // Create compensation buffer for this track
      this.createCompensationBuffer(trackId);
    }
  }
  
  removeTrack(trackId) {
    this.trackDelays.delete(trackId);
    this.totalDelays.delete(trackId);
    
    // Clean up compensation buffer
    const buffer = this.compensationBuffers.get(trackId);
    if (buffer) {
      buffer.disconnect();
      this.compensationBuffers.delete(trackId);
    }
  }
  
  addPlugin(trackId, pluginId, pluginType) {
    const trackData = this.trackDelays.get(trackId);
    if (!trackData) return;
    
    // Get plugin delay based on type
    const pluginDelay = this.defaultPluginDelays[pluginType] || 0;
    
    // Add plugin to track
    trackData.plugins.push({
      id: pluginId,
      type: pluginType,
      delay: pluginDelay,
      enabled: true
    });
    
    // Store plugin delay
    this.pluginDelays.set(pluginId, pluginDelay);
    
    // Recalculate compensation
    this.recalculateCompensation();
  }
  
  removePlugin(trackId, pluginId) {
    const trackData = this.trackDelays.get(trackId);
    if (!trackData) return;
    
    // Remove plugin from track
    trackData.plugins = trackData.plugins.filter(p => p.id !== pluginId);
    
    // Remove plugin delay
    this.pluginDelays.delete(pluginId);
    
    // Recalculate compensation
    this.recalculateCompensation();
  }
  
  setPluginDelay(pluginId, delay) {
    // Manually set plugin delay (for user calibration)
    this.pluginDelays.set(pluginId, delay);
    
    // Update track data
    this.trackDelays.forEach(trackData => {
      const plugin = trackData.plugins.find(p => p.id === pluginId);
      if (plugin) {
        plugin.delay = delay;
      }
    });
    
    this.recalculateCompensation();
  }
  
  setTrackManualDelay(trackId, delay) {
    const trackData = this.trackDelays.get(trackId);
    if (!trackData) return;
    
    trackData.manualDelay = delay;
    this.recalculateCompensation();
  }
  
  recalculateCompensation() {
    if (!this.enabled || this.compensationMode !== 'automatic') return;
    
    // Find the maximum delay across all tracks
    let maxDelay = 0;
    
    this.trackDelays.forEach((trackData, trackId) => {
      const totalDelay = this.calculateTrackDelay(trackData);
      trackData.totalDelay = totalDelay;
      maxDelay = Math.max(maxDelay, totalDelay);
    });
    
    // Calculate compensation for each track
    this.trackDelays.forEach((trackData, trackId) => {
      const compensatedDelay = maxDelay - trackData.totalDelay;
      trackData.compensatedDelay = compensatedDelay;
      this.totalDelays.set(trackId, compensatedDelay);
      
      // Update compensation buffer
      this.updateCompensationBuffer(trackId, compensatedDelay);
    });
    
    if (this.reporting) {
      this.reportCompensation();
    }
  }
  
  calculateTrackDelay(trackData) {
    let totalDelay = trackData.manualDelay;
    
    // Add delays from enabled plugins
    trackData.plugins.forEach(plugin => {
      if (plugin.enabled) {
        totalDelay += plugin.delay;
      }
    });
    
    return Math.min(totalDelay, this.maxCompensation);
  }
  
  createCompensationBuffer(trackId) {
    const audioContext = this.audioEngine.audioContext;
    
    // Create delay node for compensation
    const delayNode = audioContext.createDelay(this.maxCompensation / this.sampleRate);
    delayNode.delayTime.value = 0;
    
    // Create gain node for level compensation
    const gainNode = audioContext.createGain();
    gainNode.gain.value = 1.0;
    
    // Store nodes
    this.compensationBuffers.set(trackId, {
      delayNode,
      gainNode,
      currentDelay: 0
    });
  }
  
  updateCompensationBuffer(trackId, delayInSamples) {
    const buffer = this.compensationBuffers.get(trackId);
    if (!buffer) return;
    
    const delayTime = delayInSamples / this.sampleRate;
    buffer.delayNode.delayTime.setValueAtTime(delayTime, this.audioEngine.audioContext.currentTime);
    buffer.currentDelay = delayInSamples;
  }
  
  clearCompensation() {
    // Reset all compensation delays
    this.compensationBuffers.forEach(buffer => {
      buffer.delayNode.delayTime.setValueAtTime(0, this.audioEngine.audioContext.currentTime);
      buffer.currentDelay = 0;
    });
    
    this.trackDelays.forEach(trackData => {
      trackData.compensatedDelay = 0;
    });
  }
  
  getTrackCompensation(trackId) {
    const trackData = this.trackDelays.get(trackId);
    return trackData ? trackData.compensatedDelay : 0;
  }
  
  getPluginCompensation(pluginId) {
    return this.pluginDelays.get(pluginId) || 0;
  }
  
  getCompensationReport() {
    const report = {
      enabled: this.enabled,
      mode: this.compensationMode,
      maxDelay: 0,
      tracks: []
    };
    
    let maxDelay = 0;
    
    this.trackDelays.forEach((trackData, trackId) => {
      const trackReport = {
        id: trackId,
        totalDelay: trackData.totalDelay,
        compensatedDelay: trackData.compensatedDelay,
        manualDelay: trackData.manualDelay,
        plugins: trackData.plugins.map(plugin => ({
          id: plugin.id,
          type: plugin.type,
          delay: plugin.delay,
          enabled: plugin.enabled
        }))
      };
      
      report.tracks.push(trackReport);
      maxDelay = Math.max(maxDelay, trackData.totalDelay);
    });
    
    report.maxDelay = maxDelay;
    return report;
  }
  
  reportCompensation() {
    const report = this.getCompensationReport();
    
    console.log('=== Automatic Delay Compensation Report ===');
    console.log(`Mode: ${report.mode}`);
    console.log(`Max Delay: ${(report.maxDelay / this.sampleRate * 1000).toFixed(2)}ms`);
    
    report.tracks.forEach(track => {
      const totalMs = (track.totalDelay / this.sampleRate * 1000).toFixed(2);
      const compensatedMs = (track.compensatedDelay / this.sampleRate * 1000).toFixed(2);
      
      console.log(`Track ${track.id}: ${totalMs}ms total, ${compensatedMs}ms compensated`);
      
      track.plugins.forEach(plugin => {
        if (plugin.enabled) {
          const pluginMs = (plugin.delay / this.sampleRate * 1000).toFixed(2);
          console.log(`  - ${plugin.type}: ${pluginMs}ms`);
        }
      });
    });
  }
  
  // Connect compensation buffer to audio chain
  connectTrack(trackId, inputNode, outputNode) {
    const buffer = this.compensationBuffers.get(trackId);
    if (!buffer) return inputNode.connect(outputNode);
    
    // Connect through compensation chain
    inputNode.connect(buffer.delayNode);
    buffer.delayNode.connect(buffer.gainNode);
    buffer.gainNode.connect(outputNode);
  }
  
  // Disconnect compensation buffer
  disconnectTrack(trackId, inputNode, outputNode) {
    const buffer = this.compensationBuffers.get(trackId);
    if (!buffer) return;
    
    // Disconnect compensation chain
    inputNode.disconnect(buffer.delayNode);
    buffer.delayNode.disconnect(buffer.gainNode);
    buffer.gainNode.disconnect(outputNode);
    
    // Connect direct
    inputNode.connect(outputNode);
  }
  
  // Real-time delay measurement
  measurePluginDelay(pluginId) {
    // Implement real-time delay measurement using impulse response
    console.log(`Measuring delay for plugin: ${pluginId}`);
    
    // This would send an impulse through the plugin and measure the delay
    // For now, return estimated delay
    return this.pluginDelays.get(pluginId) || 0;
  }
  
  // Auto-calibrate all plugins
  autoCalibrate() {
    console.log('Auto-calibrating plugin delays...');
    
    this.pluginDelays.forEach((delay, pluginId) => {
      const measuredDelay = this.measurePluginDelay(pluginId);
      if (measuredDelay !== delay) {
        this.setPluginDelay(pluginId, measuredDelay);
        console.log(`Plugin ${pluginId}: ${delay} -> ${measuredDelay} samples`);
      }
    });
    
    this.recalculateCompensation();
  }
  
  // Export compensation settings
  exportSettings() {
    const settings = {
      enabled: this.enabled,
      mode: this.compensationMode,
      maxCompensation: this.maxCompensation,
      tracks: {}
    };
    
    this.trackDelays.forEach((trackData, trackId) => {
      settings.tracks[trackId] = {
        manualDelay: trackData.manualDelay,
        plugins: trackData.plugins.map(plugin => ({
          id: plugin.id,
          delay: plugin.delay
        }))
      };
    });
    
    return settings;
  }
  
  // Import compensation settings
  importSettings(settings) {
    this.enabled = settings.enabled;
    this.compensationMode = settings.mode;
    this.maxCompensation = settings.maxCompensation;
    
    Object.entries(settings.tracks).forEach(([trackId, trackSettings]) => {
      const trackData = this.trackDelays.get(trackId);
      if (trackData) {
        trackData.manualDelay = trackSettings.manualDelay;
        
        trackSettings.plugins.forEach(pluginSettings => {
          const plugin = trackData.plugins.find(p => p.id === pluginSettings.id);
          if (plugin) {
            plugin.delay = pluginSettings.delay;
            this.pluginDelays.set(plugin.id, plugin.delay);
          }
        });
      }
    });
    
    this.recalculateCompensation();
  }
  
  // Get PDC status for UI
  getStatus() {
    return {
      enabled: this.enabled,
      mode: this.compensationMode,
      trackCount: this.trackDelays.size,
      pluginCount: this.pluginDelays.size,
      maxCompensationMs: (this.maxCompensation / this.sampleRate * 1000).toFixed(2)
    };
  }
}

export default AutomaticDelayCompensation;
