/**
 * Plugin API for DAW Dan
 * Defines the interface that plugins must implement to work with DAW Dan
 */

class PluginAPI {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.plugins = new Map();
    this.pluginDirectories = [];
  }

  /**
   * Plugin interface that all plugins must implement
   */
  static get PluginInterface() {
    return {
      // Required properties
      id: 'string',
      name: 'string', 
      version: 'string',
      author: 'string',
      type: 'effect|instrument|utility', // Plugin type
      
      // Required methods
      init: function(audioContext, sampleRate) {
        // Initialize plugin with audio context and sample rate
        // Return Promise that resolves when plugin is ready
      },
      
      process: function(inputBuffer, outputBuffer, parameters) {
        // Process audio data
        // inputBuffer: AudioBuffer containing input audio
        // outputBuffer: AudioBuffer to fill with processed audio  
        // parameters: Object containing current parameter values
      },
      
      getParameters: function() {
        // Return array of parameter definitions
        // Each parameter should have: { id, name, type, min, max, defaultValue }
      },
      
      setParameter: function(parameterId, value) {
        // Set a parameter value
      },
      
      getParameter: function(parameterId) {
        // Get current parameter value
      },
      
      dispose: function() {
        // Clean up resources when plugin is unloaded
      }
    };
  }

  /**
   * Load a plugin from a file path
   */
  async loadPlugin(pluginPath) {
    try {
      const pluginModule = await import(pluginPath);
      const plugin = new pluginModule.default();
      
      // Validate plugin interface
      this.validatePlugin(plugin);
      
      // Initialize plugin
      await plugin.init(this.audioEngine.audioContext, this.audioEngine.sampleRate);
      
      // Store plugin
      this.plugins.set(plugin.id, plugin);
      
      console.log(`Plugin loaded: ${plugin.name} v${plugin.version}`);
      return plugin;
      
    } catch (error) {
      console.error(`Failed to load plugin from ${pluginPath}:`, error);
      throw error;
    }
  }

  /**
   * Unload a plugin
   */
  unloadPlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.dispose();
      this.plugins.delete(pluginId);
      console.log(`Plugin unloaded: ${plugin.name}`);
    }
  }

  /**
   * Get list of loaded plugins
   */
  getLoadedPlugins() {
    return Array.from(this.plugins.values()).map(plugin => ({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      author: plugin.author,
      type: plugin.type,
      parameters: plugin.getParameters()
    }));
  }

  /**
   * Scan directories for plugins
   */
  async scanPlugins(directories) {
    const foundPlugins = [];
    
    for (const directory of directories) {
      try {
        const files = await this.getPluginFiles(directory);
        
        for (const file of files) {
          try {
            const plugin = await this.loadPlugin(file);
            foundPlugins.push(plugin);
          } catch (error) {
            console.warn(`Failed to load plugin ${file}:`, error.message);
          }
        }
      } catch (error) {
        console.warn(`Failed to scan directory ${directory}:`, error);
      }
    }
    
    return foundPlugins;
  }

  /**
   * Get plugin files from directory
   */
  async getPluginFiles(directory) {
    // In a real implementation, this would:
    // 1. Use Node.js fs module to read directory
    // 2. Filter for valid plugin file extensions (.js, .json for manifests)
    // 3. Validate plugin manifests
    
    // For now, return mock plugin files
    return [
      `${directory}/reverb-basic.js`,
      `${directory}/compressor-pro.js`, 
      `${directory}/synth-analog.js`,
      `${directory}/delay-echo.js`
    ];
  }

  /**
   * Validate that plugin implements required interface
   */
  validatePlugin(plugin) {
    const required = PluginAPI.PluginInterface;
    
    for (const [key, expected] of Object.entries(required)) {
      if (typeof expected === 'function') {
        if (typeof plugin[key] !== 'function') {
          throw new Error(`Plugin missing required method: ${key}`);
        }
      } else {
        if (!plugin[key] || typeof plugin[key] !== expected) {
          throw new Error(`Plugin missing required property: ${key} (expected ${expected})`);
        }
      }
    }
  }

  /**
   * Create plugin instance for track
   */
  createPluginInstance(pluginId, trackId) {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    const instance = {
      pluginId,
      trackId,
      plugin,
      parameters: {},
      
      // Initialize parameters with defaults
      init() {
        const params = this.plugin.getParameters();
        params.forEach(param => {
          this.parameters[param.id] = param.defaultValue;
        });
      },
      
      // Set parameter value
      setParameter(paramId, value) {
        this.parameters[paramId] = value;
        this.plugin.setParameter(paramId, value);
      },
      
      // Get parameter value  
      getParameter(paramId) {
        return this.parameters[paramId];
      },
      
      // Process audio through plugin
      process(inputBuffer, outputBuffer) {
        return this.plugin.process(inputBuffer, outputBuffer, this.parameters);
      }
    };

    instance.init();
    return instance;
  }
}

/**
 * Base Plugin Class that plugins can extend
 */
class BasePlugin {
  constructor() {
    this.audioContext = null;
    this.sampleRate = null;
    this.parameters = new Map();
  }

  // Subclasses should override these methods
  init(audioContext, sampleRate) {
    this.audioContext = audioContext;
    this.sampleRate = sampleRate;
    return Promise.resolve();
  }

  process(inputBuffer, outputBuffer, parameters) {
    // Default: pass through audio unchanged
    for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
      const input = inputBuffer.getChannelData(channel);
      const output = outputBuffer.getChannelData(channel);
      output.set(input);
    }
  }

  getParameters() {
    return [];
  }

  setParameter(parameterId, value) {
    this.parameters.set(parameterId, value);
  }

  getParameter(parameterId) {
    return this.parameters.get(parameterId);
  }

  dispose() {
    // Default cleanup
    this.parameters.clear();
  }
}

export { PluginAPI, BasePlugin };
