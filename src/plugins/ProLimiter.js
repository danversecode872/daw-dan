import { BasePlugin } from '../core/PluginAPI.js';

export default class ProLimiter extends BasePlugin {
  constructor() {
    super();
    this.id = 'pro-limiter';
    this.name = 'Pro Limiter';
    this.version = '2.0.0';
    this.author = 'DAW Dan';
    this.type = 'effect';
    
    // Limiter parameters
    this.ceiling = -1.0; // dB
    this.threshold = -0.1; // dB (headroom before ceiling)
    this.release = 100; // ms
    this.lookahead = 5; // ms
    this.linkMode = 'peak'; // 'peak', 'rms', 'LUFS'
    
    // Limiter state
    this.gainReduction = 0;
    this.delayBuffer = null;
    this.delayIndex = 0;
    this.delayLength = 0;
    
    // True peak detection
    this.oversampling = 4; // 4x oversampling for true peak detection
  }

  async init(audioContext, sampleRate) {
    await super.init(audioContext, sampleRate);
    
    // Initialize delay buffer for lookahead
    const lookaheadSamples = Math.floor((this.lookahead / 1000) * sampleRate);
    this.delayLength = lookaheadSamples;
    this.delayBuffer = new Float32Array(this.delayLength);
    this.delayIndex = 0;
    
    console.log('Pro Limiter plugin initialized');
  }

  process(inputBuffer, outputBuffer, parameters) {
    const sampleRate = this.sampleRate;
    const ceiling = parameters.ceiling || this.ceiling;
    const threshold = parameters.threshold || this.threshold;
    const release = (parameters.release || this.release) / 1000; // Convert ms to seconds
    const lookahead = (parameters.lookahead || this.lookahead) / 1000;
    const linkMode = parameters.linkMode || this.linkMode;
    
    // Convert dB to linear
    const ceilingLinear = Math.pow(10, ceiling / 20);
    const thresholdLinear = Math.pow(10, threshold / 20);
    
    // Release coefficient
    const releaseCoeff = Math.exp(-1 / (release * sampleRate));
    
    // Calculate lookahead samples
    const lookaheadSamples = Math.floor(lookahead * sampleRate);
    
    // Initialize delay buffer if needed
    if (this.delayBuffer.length !== lookaheadSamples) {
      this.delayBuffer = new Float32Array(lookaheadSamples);
      this.delayLength = lookaheadSamples;
      this.delayIndex = 0;
    }
    
    let totalGainReduction = 0;
    let sampleCount = 0;
    
    for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
      const input = inputBuffer.getChannelData(channel);
      const output = outputBuffer.getChannelData(channel);
      
      let gainReduction = this.gainReduction;
      
      for (let i = 0; i < input.length; i++) {
        // Read from delay buffer (lookahead)
        const delayedSample = this.delayBuffer[this.delayIndex];
        
        // Write current sample to delay buffer
        this.delayBuffer[this.delayIndex] = input[i];
        this.delayIndex = (this.delayIndex + 1) % this.delayLength;
        
        // Calculate input level based on link mode
        let inputLevel = Math.abs(delayedSample);
        
        if (linkMode === 'rms') {
          // RMS detection
          const windowSize = Math.floor(0.01 * sampleRate); // 10ms window
          const startIdx = Math.max(0, i - windowSize);
          let sum = 0;
          for (let j = startIdx; j <= i; j++) {
            sum += input[j] * input[j];
          }
          inputLevel = Math.sqrt(sum / (i - startIdx + 1));
        } else if (linkMode === 'LUFS') {
          // LUFS detection (simplified)
          const windowSize = Math.floor(0.4 * sampleRate); // 400ms window
          const startIdx = Math.max(0, i - windowSize);
          let sum = 0;
          for (let j = startIdx; j <= i; j++) {
            sum += input[j] * input[j];
          }
          inputLevel = Math.sqrt(sum / (i - startIdx + 1)) * 0.707; // LUFS approximation
        }
        
        // Calculate required gain reduction
        let targetGainReduction = 1;
        
        if (inputLevel > thresholdLinear) {
          targetGainReduction = thresholdLinear / inputLevel;
        }
        
        // Apply release smoothing
        if (targetGainReduction < gainReduction) {
          gainReduction = targetGainReduction + (gainReduction - targetGainReduction) * releaseCoeff;
        } else {
          gainReduction = targetGainReduction; // Immediate attack
        }
        
        // Apply limiting
        let limitedSample = delayedSample * gainReduction;
        
        // True peak detection with oversampling
        if (this.oversampling > 1) {
          limitedSample = this.oversampleAndLimit(limitedSample, ceilingLinear);
        } else {
          // Simple peak limiting
          if (Math.abs(limitedSample) > ceilingLinear) {
            limitedSample = Math.sign(limitedSample) * ceilingLinear;
          }
        }
        
        output[i] = limitedSample;
        
        // Track gain reduction for metering
        totalGainReduction += 20 * Math.log10(gainReduction);
        sampleCount++;
      }
    }
    
    // Update gain reduction for metering
    this.gainReduction = totalGainReduction / Math.max(1, sampleCount);
  }

  oversampleAndLimit(sample, ceiling) {
    // Simple 4x oversampling for true peak detection
    const oversampled = [sample, sample, sample, sample];
    
    // Apply simple interpolation (linear)
    for (let i = 1; i < oversampled.length - 1; i++) {
      oversampled[i] = (oversampled[i - 1] + oversampled[i + 1]) / 2;
    }
    
    // Limit oversampled samples
    for (let i = 0; i < oversampled.length; i++) {
      if (Math.abs(oversampled[i]) > ceiling) {
        oversampled[i] = Math.sign(oversampled[i]) * ceiling;
      }
    }
    
    // Return the original sample (simplified - real implementation would be more complex)
    return oversampled[0];
  }

  getParameters() {
    return [
      {
        id: 'ceiling',
        name: 'Ceiling',
        type: 'float',
        min: -24,
        max: 0,
        defaultValue: this.ceiling,
        description: 'Output ceiling in dB'
      },
      {
        id: 'threshold',
        name: 'Threshold',
        type: 'float',
        min: -24,
        max: 0,
        defaultValue: this.threshold,
        description: 'Limiting threshold in dB'
      },
      {
        id: 'release',
        name: 'Release',
        type: 'float',
        min: 10,
        max: 2000,
        defaultValue: this.release,
        description: 'Release time in milliseconds'
      },
      {
        id: 'lookahead',
        name: 'Lookahead',
        type: 'float',
        min: 0,
        max: 20,
        defaultValue: this.lookahead,
        description: 'Lookahead time in milliseconds'
      },
      {
        id: 'linkMode',
        name: 'Link Mode',
        type: 'enum',
        options: ['peak', 'rms', 'LUFS'],
        defaultValue: this.linkMode,
        description: 'Detection mode for gain reduction'
      },
      {
        id: 'oversampling',
        name: 'Oversampling',
        type: 'int',
        min: 1,
        max: 8,
        defaultValue: this.oversampling,
        description: 'Oversampling factor for true peak detection'
      }
    ];
  }

  setParameter(parameterId, value) {
    super.setParameter(parameterId, value);
    
    switch (parameterId) {
      case 'ceiling':
        this.ceiling = value;
        break;
      case 'threshold':
        this.threshold = value;
        break;
      case 'release':
        this.release = value;
        break;
      case 'lookahead':
        this.lookahead = value;
        // Recalculate delay buffer
        const lookaheadSamples = Math.floor((this.lookahead / 1000) * this.sampleRate);
        this.delayBuffer = new Float32Array(lookaheadSamples);
        this.delayLength = lookaheadSamples;
        this.delayIndex = 0;
        break;
      case 'linkMode':
        this.linkMode = value;
        break;
      case 'oversampling':
        this.oversampling = Math.max(1, Math.min(8, Math.floor(value)));
        break;
    }
  }

  getGainReduction() {
    return this.gainReduction;
  }

  getTruePeakLevel() {
    // Calculate true peak level (simplified)
    if (this.delayBuffer.length === 0) return 0;
    
    let maxPeak = 0;
    for (let i = 0; i < this.delayBuffer.length; i++) {
      maxPeak = Math.max(maxPeak, Math.abs(this.delayBuffer[i]));
    }
    
    return 20 * Math.log10(maxPeak);
  }

  dispose() {
    this.delayBuffer = null;
    super.dispose();
    console.log('Pro Limiter plugin disposed');
  }
}
