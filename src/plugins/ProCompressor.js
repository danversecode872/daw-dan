import { BasePlugin } from '../core/PluginAPI.js';

export default class ProCompressor extends BasePlugin {
  constructor() {
    super();
    this.id = 'pro-compressor';
    this.name = 'Pro Compressor';
    this.version = '2.0.0';
    this.author = 'DAW Dan';
    this.type = 'effect';
    
    // Compressor parameters
    this.threshold = -20; // dB
    this.ratio = 4; // 4:1
    this.attack = 2; // ms
    this.release = 100; // ms
    this.knee = 2; // dB
    this.makeupGain = 0; // dB
    this.autoMakeup = true;
    
    // Compressor state
    this.envelopeFollower = 0;
    this.gainReduction = 0;
    
    // Sidechain filter
    this.sidechainFilter = null;
    this.sidechainEnabled = false;
  }

  async init(audioContext, sampleRate) {
    await super.init(audioContext, sampleRate);
    
    // Create sidechain filter for frequency-dependent compression
    this.sidechainFilter = audioContext.createBiquadFilter();
    this.sidechainFilter.type = 'highpass';
    this.sidechainFilter.frequency.value = 200; // Focus on mid-high frequencies
    
    console.log('Pro Compressor plugin initialized');
  }

  process(inputBuffer, outputBuffer, parameters) {
    const sampleRate = this.sampleRate;
    const threshold = parameters.threshold || this.threshold;
    const ratio = parameters.ratio || this.ratio;
    const attack = (parameters.attack || this.attack) / 1000; // Convert ms to seconds
    const release = (parameters.release || this.release) / 1000;
    const knee = parameters.knee || this.knee;
    const makeupGain = parameters.makeupGain || this.makeupGain;
    const autoMakeup = parameters.autoMakeup !== false ? this.autoMakeup : parameters.autoMakeup;
    
    // Convert dB to linear
    const thresholdLinear = Math.pow(10, threshold / 20);
    const makeupLinear = Math.pow(10, makeupGain / 20);
    const kneeWidth = knee;
    const kneeStart = thresholdLinear * Math.pow(10, -kneeWidth / 20);
    const kneeEnd = thresholdLinear * Math.pow(10, kneeWidth / 20);
    
    // Attack and release coefficients
    const attackCoeff = Math.exp(-1 / (attack * sampleRate));
    const releaseCoeff = Math.exp(-1 / (release * sampleRate));
    
    let totalGainReduction = 0;
    let sampleCount = 0;
    
    for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
      const input = inputBuffer.getChannelData(channel);
      const output = outputBuffer.getChannelData(channel);
      
      let envelopeFollower = this.envelopeFollower;
      
      for (let i = 0; i < input.length; i++) {
        const inputSample = input[i];
        
        // Calculate input level (RMS)
        const inputLevel = Math.abs(inputSample);
        
        // Envelope follower
        const targetEnvelope = inputLevel;
        if (targetEnvelope > envelopeFollower) {
          envelopeFollower = targetEnvelope + (envelopeFollower - targetEnvelope) * attackCoeff;
        } else {
          envelopeFollower = targetEnvelope + (envelopeFollower - targetEnvelope) * releaseCoeff;
        }
        
        // Calculate gain reduction
        let gainReduction = 1;
        
        if (envelopeFollower > kneeStart) {
          if (envelopeFollower < kneeEnd) {
            // Soft knee region
            const kneeRatio = (envelopeFollower - kneeStart) / (kneeEnd - kneeStart);
            const softKneeRatio = 1 + (ratio - 1) * kneeRatio;
            gainReduction = Math.pow(envelopeFollower / thresholdLinear, 1 / softKneeRatio) / (envelopeFollower / thresholdLinear);
          } else {
            // Hard compression region
            gainReduction = Math.pow(envelopeFollower / thresholdLinear, 1 / ratio) / (envelopeFollower / thresholdLinear);
          }
        }
        
        // Apply gain reduction
        let processedSample = inputSample * gainReduction;
        
        // Apply makeup gain
        if (autoMakeup) {
          // Auto makeup gain based on average gain reduction
          const avgGainReduction = totalGainReduction / Math.max(1, sampleCount);
          const autoMakeupGain = Math.min(12, Math.abs(avgGainReduction) * 0.5); // Max 12dB auto makeup
          processedSample *= Math.pow(10, autoMakeupGain / 20);
        } else {
          processedSample *= makeupLinear;
        }
        
        // Apply soft clipping to prevent distortion
        processedSample = this.softClip(processedSample);
        
        output[i] = processedSample;
        
        // Track gain reduction for metering
        totalGainReduction += 20 * Math.log10(gainReduction);
        sampleCount++;
      }
    }
    
    // Update envelope follower for next block
    this.envelopeFollower = envelopeFollower;
    this.gainReduction = totalGainReduction / Math.max(1, sampleCount);
  }

  softClip(sample) {
    // Soft clipping function to prevent harsh distortion
    const threshold = 0.95;
    const ratio = 10;
    
    if (Math.abs(sample) > threshold) {
      const sign = sample > 0 ? 1 : -1;
      const excess = Math.abs(sample) - threshold;
      return sign * (threshold + excess / ratio);
    }
    
    return sample;
  }

  getParameters() {
    return [
      {
        id: 'threshold',
        name: 'Threshold',
        type: 'float',
        min: -60,
        max: 0,
        defaultValue: this.threshold,
        description: 'Compression threshold in dB'
      },
      {
        id: 'ratio',
        name: 'Ratio',
        type: 'float',
        min: 1,
        max: 20,
        defaultValue: this.ratio,
        description: 'Compression ratio (1:inf)'
      },
      {
        id: 'attack',
        name: 'Attack',
        type: 'float',
        min: 0.1,
        max: 100,
        defaultValue: this.attack,
        description: 'Attack time in milliseconds'
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
        id: 'knee',
        name: 'Knee',
        type: 'float',
        min: 0,
        max: 10,
        defaultValue: this.knee,
        description: 'Knee width in dB'
      },
      {
        id: 'makeupGain',
        name: 'Makeup Gain',
        type: 'float',
        min: -24,
        max: 24,
        defaultValue: this.makeupGain,
        description: 'Makeup gain in dB'
      },
      {
        id: 'autoMakeup',
        name: 'Auto Makeup',
        type: 'bool',
        defaultValue: this.autoMakeup,
        description: 'Automatic makeup gain'
      },
      {
        id: 'sidechainEnabled',
        name: 'Sidechain',
        type: 'bool',
        defaultValue: this.sidechainEnabled,
        description: 'Enable sidechain filtering'
      },
      {
        id: 'sidechainFreq',
        name: 'Sidechain Freq',
        type: 'float',
        min: 20,
        max: 20000,
        defaultValue: 200,
        description: 'Sidechain filter frequency'
      }
    ];
  }

  setParameter(parameterId, value) {
    super.setParameter(parameterId, value);
    
    switch (parameterId) {
      case 'threshold':
        this.threshold = value;
        break;
      case 'ratio':
        this.ratio = value;
        break;
      case 'attack':
        this.attack = value;
        break;
      case 'release':
        this.release = value;
        break;
      case 'knee':
        this.knee = value;
        break;
      case 'makeupGain':
        this.makeupGain = value;
        break;
      case 'autoMakeup':
        this.autoMakeup = value;
        break;
      case 'sidechainEnabled':
        this.sidechainEnabled = value;
        break;
      case 'sidechainFreq':
        if (this.sidechainFilter) {
          this.sidechainFilter.frequency.value = value;
        }
        break;
    }
  }

  getGainReduction() {
    return this.gainReduction;
  }

  getEnvelopeFollower() {
    return this.envelopeFollower;
  }

  dispose() {
    if (this.sidechainFilter) {
      this.sidechainFilter.disconnect();
    }
    
    super.dispose();
    console.log('Pro Compressor plugin disposed');
  }
}
