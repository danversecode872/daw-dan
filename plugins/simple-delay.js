import { BasePlugin } from '../src/core/PluginAPI.js';

export default class SimpleDelay extends BasePlugin {
  constructor() {
    super();
    this.id = 'simple-delay';
    this.name = 'Simple Delay';
    this.version = '1.0.0';
    this.author = 'DAW Dan';
    this.type = 'effect';
    
    this.delayBuffer = null;
    this.bufferIndex = 0;
  }

  async init(audioContext, sampleRate) {
    await super.init(audioContext, sampleRate);
    
    // Initialize delay buffer (1 second max delay)
    const maxDelaySamples = Math.floor(sampleRate * 1.0);
    this.delayBuffer = new Float32Array(maxDelaySamples);
    this.bufferIndex = 0;
    
    // Set default parameters
    this.setParameter('delayTime', 0.3);
    this.setParameter('feedback', 0.4);
    this.setParameter('mix', 0.3);
    
    console.log('Simple Delay plugin initialized');
  }

  process(inputBuffer, outputBuffer, parameters) {
    if (!this.delayBuffer) {
      return super.process(inputBuffer, outputBuffer, parameters);
    }

    const delayTime = parameters.delayTime || this.getParameter('delayTime');
    const feedback = parameters.feedback || this.getParameter('feedback');
    const mix = parameters.mix || this.getParameter('mix');
    
    const delaySamples = Math.floor(delayTime * this.sampleRate);
    
    for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
      const input = inputBuffer.getChannelData(channel);
      const output = outputBuffer.getChannelData(channel);
      
      for (let i = 0; i < input.length; i++) {
        // Read delayed sample
        const readIndex = (this.bufferIndex - delaySamples + this.delayBuffer.length) % this.delayBuffer.length;
        const delayedSample = this.delayBuffer[readIndex];
        
        // Write current sample + feedback to delay buffer
        const currentSample = input[i] + delayedSample * feedback;
        this.delayBuffer[this.bufferIndex] = currentSample;
        
        // Mix dry and wet signals
        output[i] = input[i] * (1 - mix) + delayedSample * mix;
        
        // Advance buffer index
        this.bufferIndex = (this.bufferIndex + 1) % this.delayBuffer.length;
      }
    }
  }

  getParameters() {
    return [
      {
        id: 'delayTime',
        name: 'Delay Time',
        type: 'float',
        min: 0,
        max: 1,
        defaultValue: 0.3,
        description: 'Delay time in seconds'
      },
      {
        id: 'feedback',
        name: 'Feedback',
        type: 'float',
        min: 0,
        max: 0.95,
        defaultValue: 0.4,
        description: 'Feedback amount for repeats'
      },
      {
        id: 'mix',
        name: 'Mix',
        type: 'float',
        min: 0,
        max: 1,
        defaultValue: 0.3,
        description: 'Wet/Dry mix'
      }
    ];
  }

  setParameter(parameterId, value) {
    super.setParameter(parameterId, value);
    // Parameters are applied in real-time during processing
  }

  dispose() {
    this.delayBuffer = null;
    super.dispose();
    console.log('Simple Delay plugin disposed');
  }
}
