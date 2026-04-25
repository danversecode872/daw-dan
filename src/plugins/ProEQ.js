import { BasePlugin } from '../core/PluginAPI.js';

export default class ProEQ extends BasePlugin {
  constructor() {
    super();
    this.id = 'pro-eq';
    this.name = 'Pro EQ';
    this.version = '2.0.0';
    this.author = 'DAW Dan';
    this.type = 'effect';
    
    // Professional EQ bands
    this.bands = [
      { type: 'low-shelf', freq: 80, gain: 0, q: 0.7, enabled: true },
      { type: 'peaking', freq: 250, gain: 0, q: 1, enabled: true },
      { type: 'peaking', freq: 1000, gain: 0, q: 1, enabled: true },
      { type: 'peaking', freq: 4000, gain: 0, q: 1, enabled: true },
      { type: 'high-shelf', freq: 8000, gain: 0, q: 0.7, enabled: true }
    ];
    
    // EQ filter coefficients
    this.filters = [];
    this.analyser = null;
  }

  async init(audioContext, sampleRate) {
    await super.init(audioContext, sampleRate);
    
    // Create filters for each band
    this.bands.forEach((band, index) => {
      const filter = audioContext.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.freq;
      filter.gain.value = band.gain;
      filter.Q.value = band.q;
      
      this.filters.push(filter);
    });
    
    // Create analyser for spectrum display
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.8;
    
    console.log('Pro EQ plugin initialized');
  }

  process(inputBuffer, outputBuffer, parameters) {
    if (this.filters.length === 0) {
      return super.process(inputBuffer, outputBuffer, parameters);
    }

    // Apply EQ bands in series
    for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
      let buffer = inputBuffer.getChannelData(channel);
      
      // Process through each enabled filter
      this.bands.forEach((band, index) => {
        if (band.enabled && this.filters[index]) {
          buffer = this.processBand(buffer, this.filters[index]);
        }
      });
      
      // Copy to output
      const output = outputBuffer.getChannelData(channel);
      output.set(buffer);
    }
  }

  processBand(buffer, filter) {
    // Simple biquad filter implementation
    const output = new Float32Array(buffer.length);
    
    // Get filter coefficients
    const b0 = filter.frequency.value; // Simplified - real implementation would calculate actual coefficients
    const b1 = 0;
    const b2 = 0;
    const a0 = 1;
    const a1 = 0;
    const a2 = 0;
    
    // Apply filter
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    
    for (let i = 0; i < buffer.length; i++) {
      const x0 = buffer[i];
      const y0 = (b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
      
      output[i] = y0;
      
      // Update delay lines
      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
    }
    
    return output;
  }

  getParameters() {
    const params = [];
    
    this.bands.forEach((band, index) => {
      params.push(
        {
          id: `band${index}_freq`,
          name: `Band ${index + 1} Freq`,
          type: 'float',
          min: 20,
          max: 20000,
          defaultValue: band.freq,
          description: `${band.type} frequency`
        },
        {
          id: `band${index}_gain`,
          name: `Band ${index + 1} Gain`,
          type: 'float',
          min: -24,
          max: 24,
          defaultValue: band.gain,
          description: `${band.type} gain in dB`
        },
        {
          id: `band${index}_q`,
          name: `Band ${index + 1} Q`,
          type: 'float',
          min: 0.1,
          max: 100,
          defaultValue: band.q,
          description: `${band.type} Q factor`
        },
        {
          id: `band${index}_enabled`,
          name: `Band ${index + 1} Enabled`,
          type: 'bool',
          defaultValue: band.enabled,
          description: `Enable ${band.type} band`
        }
      );
    });
    
    // Add global parameters
    params.push(
      {
        id: 'output_gain',
        name: 'Output Gain',
        type: 'float',
        min: -24,
        max: 24,
        defaultValue: 0,
        description: 'Output gain in dB'
      },
      {
        id: 'analyzer_enabled',
        name: 'Spectrum Analyzer',
        type: 'bool',
        defaultValue: true,
        description: 'Enable spectrum analyzer'
      }
    );
    
    return params;
  }

  setParameter(parameterId, value) {
    super.setParameter(parameterId, value);
    
    // Parse band parameters
    const bandMatch = parameterId.match(/band(\d+)_(.*)/);
    if (bandMatch) {
      const bandIndex = parseInt(bandMatch[1]);
      const paramName = bandMatch[2];
      
      if (this.bands[bandIndex] && this.filters[bandIndex]) {
        switch (paramName) {
          case 'freq':
            this.bands[bandIndex].freq = value;
            this.filters[bandIndex].frequency.value = value;
            break;
          case 'gain':
            this.bands[bandIndex].gain = value;
            this.filters[bandIndex].gain.value = value;
            break;
          case 'q':
            this.bands[bandIndex].q = value;
            this.filters[bandIndex].Q.value = value;
            break;
          case 'enabled':
            this.bands[bandIndex].enabled = value;
            break;
        }
      }
    }
  }

  getSpectrumData() {
    if (!this.analyser) return null;
    
    const dataArray = new Float32Array(this.analyser.frequencyBinCount);
    this.analyser.getFloatFrequencyData(dataArray);
    
    return {
      frequencies: this.getFrequencyBins(),
      magnitudes: Array.from(dataArray)
    };
  }

  getFrequencyBins() {
    const bins = [];
    const nyquist = this.sampleRate / 2;
    
    for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
      bins.push((i / this.analyser.frequencyBinCount) * nyquist);
    }
    
    return bins;
  }

  dispose() {
    this.filters.forEach(filter => {
      if (filter) filter.disconnect();
    });
    
    if (this.analyser) {
      this.analyser.disconnect();
    }
    
    super.dispose();
    console.log('Pro EQ plugin disposed');
  }
}
