# DAW Dan Plugins

This directory contains plugins for DAW Dan. Plugins are JavaScript modules that implement the PluginAPI interface.

## Plugin Structure

Each plugin must extend the `BasePlugin` class and implement the required methods:

```javascript
import { BasePlugin } from '../src/core/PluginAPI.js';

export default class MyPlugin extends BasePlugin {
  constructor() {
    super();
    this.id = 'my-plugin';
    this.name = 'My Plugin';
    this.version = '1.0.0';
    this.author = 'Your Name';
    this.type = 'effect'; // 'effect', 'instrument', or 'utility'
  }

  async init(audioContext, sampleRate) {
    // Initialize plugin with audio context and sample rate
    await super.init(audioContext, sampleRate);
    // Set up audio nodes and parameters
  }

  process(inputBuffer, outputBuffer, parameters) {
    // Process audio data
    // inputBuffer: AudioBuffer containing input audio
    // outputBuffer: AudioBuffer to fill with processed audio
    // parameters: Object containing current parameter values
  }

  getParameters() {
    // Return array of parameter definitions
    return [
      {
        id: 'parameterId',
        name: 'Parameter Name',
        type: 'float', // 'float', 'int', 'bool', 'string'
        min: 0,
        max: 1,
        defaultValue: 0.5,
        description: 'Parameter description'
      }
    ];
  }

  setParameter(parameterId, value) {
    // Set a parameter value
    super.setParameter(parameterId, value);
    // Apply the parameter change
  }

  dispose() {
    // Clean up resources when plugin is unloaded
    super.dispose();
  }
}
```

## Included Plugins

### Sample Reverb (`sample-reverb.js`)
- **Type**: Effect
- **Description**: Basic reverb effect with adjustable room size, damping, and wet level
- **Parameters**:
  - `roomSize`: Size of the reverb space (0-1)
  - `damping`: High frequency damping (0-1)
  - `wetLevel`: Amount of reverb effect (0-1)

### Simple Delay (`simple-delay.js`)
- **Type**: Effect
- **Description**: Simple delay effect with feedback
- **Parameters**:
  - `delayTime`: Delay time in seconds (0-1)
  - `feedback`: Feedback amount for repeats (0-0.95)
  - `mix`: Wet/Dry mix (0-1)

## Creating Your Own Plugins

1. Create a new JavaScript file in this directory
2. Extend the `BasePlugin` class
3. Implement the required methods
4. Test your plugin in DAW Dan
5. Share your plugin with the community!

## Plugin Types

### Effects
Process audio input and output modified audio. Examples: reverb, delay, compression, EQ.

### Instruments
Generate audio from MIDI input. Examples: synthesizers, samplers, drum machines.

### Utilities
Analyze or modify audio without changing the signal. Examples: spectrum analyzers, meters, tuners.

## Best Practices

- Keep audio processing efficient to maintain low latency
- Use Web Audio API nodes when possible for better performance
- Implement proper parameter validation
- Include helpful descriptions for your parameters
- Test your plugin with various audio sources
- Dispose of resources properly in the `dispose()` method

## Third-Party Plugin Support

DAW Dan is designed to support third-party plugins through:

1. **JavaScript plugins** (current implementation)
2. **VST/AU plugins** (planned for future versions)
3. **LV2 plugins** (planned for Linux support)

## Plugin Development Tools

- Use the browser's developer tools to debug audio processing
- Test with different sample rates and buffer sizes
- Monitor CPU usage to ensure efficient processing
- Use spectrum analyzers to verify your effect's frequency response
