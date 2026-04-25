import { BasePlugin } from '../src/core/PluginAPI.js';

export default class SampleReverb extends BasePlugin {
  constructor() {
    super();
    this.id = 'sample-reverb';
    this.name = 'Sample Reverb';
    this.version = '1.0.0';
    this.author = 'DAW Dan';
    this.type = 'effect';
    
    this.convolver = null;
    this.wetGain = null;
    this.dryGain = null;
    this.impulseResponse = null;
  }

  async init(audioContext, sampleRate) {
    await super.init(audioContext, sampleRate);
    
    // Create audio nodes
    this.convolver = audioContext.createConvolver();
    this.wetGain = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    
    // Create impulse response for reverb
    this.impulseResponse = this.createImpulseResponse(2.0, sampleRate);
    this.convolver.buffer = this.impulseResponse;
    
    // Set default parameter values
    this.setParameter('roomSize', 0.5);
    this.setParameter('damping', 0.5);
    this.setParameter('wetLevel', 0.3);
    
    console.log('Sample Reverb plugin initialized');
  }

  createImpulseResponse(duration, sampleRate) {
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Create reverb tail with exponential decay
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    return impulse;
  }

  process(inputBuffer, outputBuffer, parameters) {
    if (!this.convolver || !this.wetGain || !this.dryGain) {
      // Fallback to passthrough if not initialized
      return super.process(inputBuffer, outputBuffer, parameters);
    }

    // For simplicity, we'll apply a basic reverb effect
    // In a real implementation, you'd process through the convolver node
    const roomSize = parameters.roomSize || this.getParameter('roomSize');
    const wetLevel = parameters.wetLevel || this.getParameter('wetLevel');
    
    // Apply basic reverb simulation (delay + feedback)
    for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
      const input = inputBuffer.getChannelData(channel);
      const output = outputBuffer.getChannelData(channel);
      
      const delayTime = Math.floor(roomSize * 0.1 * this.sampleRate); // 0-100ms delay
      const feedback = 0.3;
      
      for (let i = 0; i < input.length; i++) {
        let delayedSample = 0;
        
        if (i >= delayTime) {
          delayedSample = output[i - delayTime] * feedback;
        }
        
        output[i] = input[i] * (1 - wetLevel) + (input[i] + delayedSample) * wetLevel;
      }
    }
  }

  getParameters() {
    return [
      {
        id: 'roomSize',
        name: 'Room Size',
        type: 'float',
        min: 0,
        max: 1,
        defaultValue: 0.5,
        description: 'Size of the reverb space'
      },
      {
        id: 'damping',
        name: 'Damping',
        type: 'float',
        min: 0,
        max: 1,
        defaultValue: 0.5,
        description: 'High frequency damping'
      },
      {
        id: 'wetLevel',
        name: 'Wet Level',
        type: 'float',
        min: 0,
        max: 1,
        defaultValue: 0.3,
        description: 'Amount of reverb effect'
      }
    ];
  }

  setParameter(parameterId, value) {
    super.setParameter(parameterId, value);
    
    switch (parameterId) {
      case 'wetLevel':
        if (this.wetGain) {
          this.wetGain.gain.value = value;
        }
        if (this.dryGain) {
          this.dryGain.gain.value = 1 - value;
        }
        break;
      case 'roomSize':
        // Regenerate impulse response with new room size
        if (this.convolver && this.audioContext) {
          const duration = 0.5 + value * 2.5; // 0.5s to 3s
          this.impulseResponse = this.createImpulseResponse(duration, this.sampleRate);
          this.convolver.buffer = this.impulseResponse;
        }
        break;
    }
  }

  dispose() {
    if (this.convolver) {
      this.convolver.disconnect();
    }
    if (this.wetGain) {
      this.wetGain.disconnect();
    }
    if (this.dryGain) {
      this.dryGain.disconnect();
    }
    
    super.dispose();
    console.log('Sample Reverb plugin disposed');
  }
}
