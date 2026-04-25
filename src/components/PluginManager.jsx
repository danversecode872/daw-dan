import React, { useState, useEffect } from 'react';
import { X, Download, FolderOpen, Settings, Play, Pause, Plus, Search, Filter, Zap, Music, Radio, Volume2 } from 'lucide-react';

const PluginManager = ({ onClose }) => {
  const [plugins, setPlugins] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState(null);

  useEffect(() => {
    loadPlugins();
  }, []);

  const getPluginIcon = (type, name) => {
    switch (type) {
      case 'effect':
        if (name.toLowerCase().includes('reverb')) return <Volume2 size={16} className="text-blue-400" />;
        if (name.toLowerCase().includes('compressor')) return <Settings size={16} className="text-green-400" />;
        if (name.toLowerCase().includes('delay')) return <Radio size={16} className="text-purple-400" />;
        return <Zap size={16} className="text-yellow-400" />;
      case 'instrument':
        if (name.toLowerCase().includes('piano')) return <Music size={16} className="text-blue-400" />;
        if (name.toLowerCase().includes('guitar')) return <Music size={16} className="text-orange-400" />;
        if (name.toLowerCase().includes('drum')) return <Radio size={16} className="text-red-400" />;
        return <Music size={16} className="text-purple-400" />;
      default:
        return <Settings size={16} className="text-gray-400" />;
    }
  };

  const loadPlugins = async () => {
    // Mock plugin data - in real implementation, this would scan directories
    const mockPlugins = [
      {
        id: 'reverb-basic',
        name: 'Basic Reverb',
        type: 'effect',
        version: '1.0.0',
        author: 'DAW Dan',
        description: 'Simple reverb effect',
        enabled: true,
        parameters: ['roomSize', 'damping', 'wetLevel']
      },
      {
        id: 'compressor-pro',
        name: 'Pro Compressor',
        type: 'effect',
        version: '2.1.0',
        author: 'Third Party',
        description: 'Professional compressor with threshold and ratio',
        enabled: false,
        parameters: ['threshold', 'ratio', 'attack', 'release']
      },
      {
        id: 'synth-analog',
        name: 'Analog Synth',
        type: 'instrument',
        version: '1.5.0',
        author: 'DAW Dan',
        description: 'Classic analog synthesizer',
        enabled: true,
        parameters: ['oscillator', 'filter', 'envelope']
      },
      {
        id: 'delay-echo',
        name: 'Echo Delay',
        type: 'effect',
        version: '1.2.0',
        author: 'Third Party',
        description: 'Echo and delay effects',
        enabled: false,
        parameters: ['delayTime', 'feedback', 'mix']
      }
    ];

    setPlugins(mockPlugins);
  };

  const scanForPlugins = async () => {
    setScanning(true);
    
    // Simulate scanning process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real implementation, this would:
    // 1. Check standard plugin directories
    // 2. Look for VST, AU, AAX formats
    // 3. Load plugin manifests
    // 4. Validate plugin compatibility
    
    setScanning(false);
    await loadPlugins();
  };

  const togglePlugin = (pluginId) => {
    setPlugins(prev => 
      prev.map(plugin => 
        plugin.id === pluginId 
          ? { ...plugin, enabled: !plugin.enabled }
          : plugin
      )
    );
  };

  const installPlugin = () => {
    // In real implementation, this would open a file dialog
    // to select plugin files for installation
    console.log('Install plugin clicked');
  };

  
  const getPluginColor = (type) => {
    switch (type) {
      case 'effect':
        return 'bg-blue-600';
      case 'instrument':
        return 'bg-purple-600';
      case 'utility':
        return 'bg-gray-600';
      default:
        return 'bg-green-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold">Plugin Manager</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center space-x-2 p-4 border-b border-gray-700">
          <button
            onClick={scanForPlugins}
            disabled={scanning}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
          >
            {scanning ? (
              <>
                <Pause size={16} />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <FolderOpen size={16} />
                <span>Scan Plugins</span>
              </>
            )}
          </button>
          
          <button
            onClick={installPlugin}
            className="flex items-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
          >
            <Download size={16} />
            <span>Install Plugin</span>
          </button>

          <div className="flex-1"></div>

          <button className="p-2 hover:bg-gray-700 rounded">
            <Settings size={16} />
          </button>
        </div>

        {/* Plugin List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plugins.map((plugin) => (
              <div
                key={plugin.id}
                className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                onClick={() => setSelectedPlugin(plugin)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${getPluginColor(plugin.type)} rounded flex items-center justify-center`}>
                      {getPluginIcon(plugin.type, plugin.name)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{plugin.name}</h3>
                      <p className="text-xs text-gray-400">
                        {plugin.author} v{plugin.version}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePlugin(plugin.id);
                    }}
                    className={`px-2 py-1 text-xs rounded ${
                      plugin.enabled 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  >
                    {plugin.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>

                <p className="text-sm text-gray-300 mb-2">
                  {plugin.description}
                </p>

                <div className="flex flex-wrap gap-1">
                  {plugin.parameters.map((param) => (
                    <span
                      key={param}
                      className="px-2 py-1 bg-gray-600 rounded text-xs text-gray-300"
                    >
                      {param}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plugin Details */}
        {selectedPlugin && (
          <div className="border-t border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{selectedPlugin.name}</h3>
              <button
                onClick={() => setSelectedPlugin(null)}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Type:</span>
                <span className="ml-2 capitalize">{selectedPlugin.type}</span>
              </div>
              <div>
                <span className="text-gray-400">Version:</span>
                <span className="ml-2">{selectedPlugin.version}</span>
              </div>
              <div>
                <span className="text-gray-400">Author:</span>
                <span className="ml-2">{selectedPlugin.author}</span>
              </div>
              <div>
                <span className="text-gray-400">Status:</span>
                <span className="ml-2">
                  {selectedPlugin.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PluginManager;
