class QuantizationEngine {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.bpm = 120;
    this.timeSignature = [4, 4]; // [numerator, denominator]
    this.quantizeStrength = 1.0; // 0 = no quantization, 1 = full quantization
    this.quantizeGrid = '1/16'; // Quantization grid resolution
    this.grooveTemplates = new Map();
    this.currentGroove = null;
    
    this.initializeGrooveTemplates();
  }
  
  initializeGrooveTemplates() {
    // Pre-defined groove templates
    this.grooveTemplates.set('straight', {
      name: 'Straight',
      timing: [0, 0, 0, 0], // No timing offset
      velocity: [1, 1, 1, 1], // No velocity variation
      swing: 0
    });
    
    this.grooveTemplates.set('swing', {
      name: 'Swing',
      timing: [0, 0.05, 0, 0.05], // 16th note swing
      velocity: [1, 0.8, 1, 0.8], // Velocity variation
      swing: 0.33
    });
    
    this.grooveTemplates.set('triplet', {
      name: 'Triplet Feel',
      timing: [0, 0.033, 0.067, 0], // Triplet timing
      velocity: [1, 0.9, 0.8, 1],
      swing: 0.5
    });
    
    this.grooveTemplates.set('human', {
      name: 'Human Feel',
      timing: [0, -0.01, 0.02, -0.01], // Subtle timing variations
      velocity: [1, 0.95, 1.05, 0.98], // Natural velocity variations
      swing: 0.1
    });
    
    this.grooveTemplates.set('hiphop', {
      name: 'Hip Hop',
      timing: [0, 0.08, 0, 0.08], // Heavy swing
      velocity: [1, 0.7, 1, 0.7],
      swing: 0.6
    });
    
    this.grooveTemplates.set('latin', {
      name: 'Latin',
      timing: [0, 0.02, 0.04, 0.02], // Latin feel
      velocity: [1, 0.85, 0.7, 0.85],
      swing: 0.25
    });
  }
  
  setBPM(bpm) {
    this.bpm = bpm;
  }
  
  setTimeSignature(numerator, denominator) {
    this.timeSignature = [numerator, denominator];
  }
  
  setQuantizeGrid(grid) {
    this.quantizeGrid = grid;
  }
  
  setQuantizeStrength(strength) {
    this.quantizeStrength = Math.max(0, Math.min(1, strength));
  }
  
  setCurrentGroove(grooveName) {
    this.currentGroove = this.grooveTemplates.get(grooveName);
  }
  
  getBeatDuration() {
    return 60 / this.bpm; // Duration of one beat in seconds
  }
  
  getGridDuration() {
    const beatDuration = this.getBeatDuration();
    
    switch (this.quantizeGrid) {
      case '1/4': return beatDuration;
      case '1/8': return beatDuration / 2;
      case '1/16': return beatDuration / 4;
      case '1/32': return beatDuration / 8;
      case '1/64': return beatDuration / 16;
      case '1/8T': return beatDuration / 3; // Eighth note triplet
      case '1/16T': return beatDuration / 6; // Sixteenth note triplet
      default: return beatDuration / 4;
    }
  }
  
  quantizePosition(time) {
    if (this.quantizeStrength === 0) return time;
    
    const gridDuration = this.getGridDuration();
    const nearestGrid = Math.round(time / gridDuration) * gridDuration;
    
    // Apply quantization strength
    const quantizedTime = time + (nearestGrid - time) * this.quantizeStrength;
    
    // Apply groove template
    if (this.currentGroove) {
      return this.applyGrooveTiming(quantizedTime, gridDuration);
    }
    
    return quantizedTime;
  }
  
  applyGrooveTiming(time, gridDuration) {
    if (!this.currentGroove) return time;
    
    const beatPosition = (time / this.getBeatDuration()) % 1;
    const subdivisionIndex = Math.floor(beatPosition * 4) % 4; // 16th note subdivisions
    
    if (subdivisionIndex < this.currentGroove.timing.length) {
      const timingOffset = this.currentGroove.timing[subdivisionIndex];
      return time + (timingOffset * gridDuration);
    }
    
    return time;
  }
  
  quantizeVelocity(velocity, notePosition) {
    if (!this.currentGroove || this.quantizeStrength === 0) return velocity;
    
    const beatPosition = (notePosition / this.getBeatDuration()) % 1;
    const subdivisionIndex = Math.floor(beatPosition * 4) % 4;
    
    if (subdivisionIndex < this.currentGroove.velocity.length) {
      const grooveVelocity = this.currentGroove.velocity[subdivisionIndex];
      const targetVelocity = velocity * grooveVelocity;
      
      // Apply quantization strength
      return velocity + (targetVelocity - velocity) * this.quantizeStrength;
    }
    
    return velocity;
  }
  
  quantizeMIDINotes(notes) {
    return notes.map(note => ({
      ...note,
      startTime: this.quantizePosition(note.startTime),
      velocity: this.quantizeVelocity(note.velocity, note.startTime)
    }));
  }
  
  quantizeAudioClip(clip) {
    // For audio clips, we can only quantize the start position
    return {
      ...clip,
      startTime: this.quantizePosition(clip.startTime)
    };
  }
  
  createCustomGroove(name, timingOffsets, velocityVariations, swingAmount) {
    this.grooveTemplates.set(name, {
      name,
      timing: timingOffsets,
      velocity: velocityVariations,
      swing: swingAmount
    });
  }
  
  extractGrooveFromPerformance(notes) {
    // Analyze timing and velocity patterns from a performance
    const beatDuration = this.getBeatDuration();
    const timingOffsets = [];
    const velocityVariations = [];
    
    // Group notes by beat position
    const notesByPosition = {};
    
    notes.forEach(note => {
      const beatPosition = Math.floor(note.startTime / beatDuration);
      const subdivision = Math.floor((note.startTime % beatDuration) / (beatDuration / 4));
      const key = `${beatPosition}_${subdivision}`;
      
      if (!notesByPosition[key]) {
        notesByPosition[key] = [];
      }
      notesByPosition[key].push(note);
    });
    
    // Calculate average timing offsets and velocities
    Object.keys(notesByPosition).forEach(key => {
      const positionNotes = notesByPosition[key];
      const subdivision = parseInt(key.split('_')[1]);
      
      if (positionNotes.length > 0) {
        // Calculate average timing offset
        const expectedTime = subdivision * (beatDuration / 4);
        const avgActualTime = positionNotes.reduce((sum, note) => sum + note.startTime, 0) / positionNotes.length;
        const timingOffset = (avgActualTime % beatDuration) - expectedTime;
        
        // Calculate average velocity
        const avgVelocity = positionNotes.reduce((sum, note) => sum + note.velocity, 0) / positionNotes.length;
        const velocityVariation = avgVelocity / 127; // Normalize to 0-1
        
        timingOffsets[subdivision] = timingOffset / beatDuration;
        velocityVariations[subdivision] = velocityVariation;
      }
    });
    
    // Fill missing subdivisions with defaults
    for (let i = 0; i < 4; i++) {
      if (timingOffsets[i] === undefined) timingOffsets[i] = 0;
      if (velocityVariations[i] === undefined) velocityVariations[i] = 1;
    }
    
    return {
      timing: timingOffsets,
      velocity: velocityVariations,
      swing: this.calculateSwingAmount(timingOffsets)
    };
  }
  
  calculateSwingAmount(timingOffsets) {
    // Calculate swing based on timing offsets of off-beat subdivisions
    const offBeatOffsets = timingOffsets.filter((offset, index) => index % 2 === 1);
    
    if (offBeatOffsets.length === 0) return 0;
    
    const avgOffset = offBeatOffsets.reduce((sum, offset) => sum + offset, 0) / offBeatOffsets.length;
    return Math.abs(avgOffset);
  }
  
  applyQuantizationToTrack(track) {
    if (track.type === 'midi') {
      return {
        ...track,
        clips: track.clips.map(clip => ({
          ...clip,
          notes: this.quantizeMIDINotes(clip.notes || [])
        }))
      };
    } else if (track.type === 'audio') {
      return {
        ...track,
        clips: track.clips.map(clip => this.quantizeAudioClip(clip))
      };
    }
    
    return track;
  }
  
  previewQuantization(notes, strength = this.quantizeStrength) {
    const originalStrength = this.quantizeStrength;
    this.quantizeStrength = strength;
    
    const quantized = this.quantizeMIDINotes(notes);
    
    this.quantizeStrength = originalStrength;
    
    return quantized;
  }
  
  getAvailableGrooves() {
    return Array.from(this.grooveTemplates.values()).map(groove => ({
      name: groove.name,
      swing: groove.swing,
      timing: groove.timing,
      velocity: groove.velocity
    }));
  }
  
  exportGrooveTemplate(grooveName) {
    const groove = this.grooveTemplates.get(grooveName);
    if (!groove) return null;
    
    return {
      name: groove.name,
      timing: groove.timing,
      velocity: groove.velocity,
      swing: groove.swing,
      bpm: this.bpm,
      timeSignature: this.timeSignature,
      quantizeGrid: this.quantizeGrid
    };
  }
  
  importGrooveTemplate(grooveData) {
    this.createCustomGroove(
      grooveData.name,
      grooveData.timing,
      grooveData.velocity,
      grooveData.swing
    );
  }
  
  analyzeTimingAccuracy(notes) {
    // Analyze how accurate the timing is compared to the grid
    const gridDuration = this.getGridDuration();
    let totalDeviation = 0;
    let maxDeviation = 0;
    let noteCount = 0;
    
    notes.forEach(note => {
      const nearestGrid = Math.round(note.startTime / gridDuration) * gridDuration;
      const deviation = Math.abs(note.startTime - nearestGrid);
      
      totalDeviation += deviation;
      maxDeviation = Math.max(maxDeviation, deviation);
      noteCount++;
    });
    
    return {
      averageDeviation: totalDeviation / noteCount,
      maxDeviation,
      accuracy: Math.max(0, 100 - (totalDeviation / noteCount) * 1000) // Percentage accuracy
    };
  }
}

export default QuantizationEngine;
