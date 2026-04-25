import React, { useState, useEffect, useRef } from 'react';
import { Play, Plus, Trash2, Settings, Save, Upload, Download, Keyboard, Mouse, Zap } from 'lucide-react';
import useProjectStore from '../stores/projectStore';

const MacroControls = () => {
  const { tracks, plugins } = useProjectStore();
  const [macros, setMacros] = useState([]);
  const [selectedMacro, setSelectedMacro] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedActions, setRecordedActions] = useState([]);
  const [keyBindings, setKeyBindings] = useState(new Map());
  const [customCommands, setCustomCommands] = useState([]);
  const [showCommandEditor, setShowCommandEditor] = useState(false);
  
  // UI customization
  const [uiLayout, setUiLayout] = useState('default'); // default, compact, expanded
  const [theme, setTheme] = useState('dark'); // dark, light, auto
  const [panelSizes, setPanelSizes] = useState({});
  
  const actionRecorder = useRef(null);
  
  useEffect(() => {
    initializeDefaultMacros();
    loadKeyBindings();
  }, []);
  
  const initializeDefaultMacros = () => {
    const defaultMacros = [
      {
        id: 'mix-snapshot',
        name: 'Mix Snapshot',
        description: 'Save current mix settings',
        icon: '📸',
        actions: [
          { type: 'saveMix', parameters: {} }
        ],
        triggers: ['ctrl+shift+s']
      },
      {
        id: 'panic-button',
        name: 'Panic Button',
        description: 'Stop all playback and reset',
        icon: '🛑',
        actions: [
          { type: 'stopPlayback', parameters: {} },
          { type: 'resetVolumes', parameters: {} },
          { type: 'muteAll', parameters: {} }
        ],
        triggers: ['space']
      },
      {
        id: 'quick-solo',
        name: 'Quick Solo',
        description: 'Solo selected track',
        icon: '🎤',
        actions: [
          { type: 'soloTrack', parameters: { trackId: 'selected' } }
        ],
        triggers: ['s']
      },
      {
        id: 'export-stems',
        name: 'Export Stems',
        description: 'Export all track stems',
        icon: '📤',
        actions: [
          { type: 'exportStems', parameters: { format: 'wav', bitDepth: '24' } }
        ],
        triggers: ['ctrl+e']
      },
      {
        id: 'new-instrument',
        name: 'New Instrument',
        description: 'Create new MIDI instrument track',
        icon: '🎹',
        actions: [
          { type: 'createTrack', parameters: { type: 'midi', instrument: 'default' } }
        ],
        triggers: ['ctrl+shift+i']
      }
    ];
    
    setMacros(defaultMacros);
  };
  
  const loadKeyBindings = () => {
    const defaultBindings = new Map([
      ['space', { action: 'panic-button', context: 'global' }],
      ['s', { action: 'quick-solo', context: 'tracks' }],
      ['ctrl+s', { action: 'save-project', context: 'global' }],
      ['ctrl+shift+s', { action: 'mix-snapshot', context: 'global' }],
      ['ctrl+e', { action: 'export-stems', context: 'global' }],
      ['ctrl+shift+i', { action: 'new-instrument', context: 'global' }],
      ['ctrl+z', { action: 'undo', context: 'global' }],
      ['ctrl+shift+z', { action: 'redo', context: 'global' }],
      ['ctrl+n', { action: 'new-project', context: 'global' }],
      ['ctrl+o', { action: 'open-project', context: 'global' }],
      ['delete', { action: 'delete-selected', context: 'tracks' }],
      ['ctrl+d', { action: 'duplicate', context: 'tracks' }],
      ['ctrl+a', { action: 'select-all', context: 'tracks' }],
      ['ctrl+shift+a', { action: 'deselect-all', context: 'tracks' }],
      ['r', { action: 'record-arm', context: 'tracks' }],
      ['m', { action: 'mute', context: 'tracks' }],
      ['ctrl+m', { action: 'solo', context: 'tracks' }],
      ['1', { action: 'zoom-fit', context: 'timeline' }],
      ['2', { action: 'zoom-in', context: 'timeline' }],
      ['3', { action: 'zoom-out', context: 'timeline' }],
      ['left', { action: 'nudge-left', context: 'timeline' }],
      ['right', { action: 'nudge-right', context: 'timeline' }],
      ['up', { action: 'nudge-up', context: 'piano-roll' }],
      ['down', { action: 'nudge-down', context: 'piano-roll' }],
      ['ctrl+shift+r', { action: 'record-macro', context: 'global' }],
      ['ctrl+shift+p', { action: 'play-macro', context: 'global' }]
    ]);
    
    setKeyBindings(defaultBindings);
  };
  
  const startMacroRecording = () => {
    setIsRecording(true);
    setRecordedActions([]);
    
    // Start action recorder
    actionRecorder.current = {
      startTime: Date.now(),
      actions: []
    };
    
    console.log('Started macro recording');
  };
  
  const stopMacroRecording = () => {
    setIsRecording(false);
    
    if (actionRecorder.current) {
      const recordedMacro = {
        id: `macro-${Date.now()}`,
        name: `Recorded Macro ${macros.length + 1}`,
        description: `Recorded at ${new Date().toLocaleTimeString()}`,
        icon: '🎬',
        actions: actionRecorder.current.actions,
        triggers: []
      };
      
      setMacros([...macros, recordedMacro]);
      setSelectedMacro(recordedMacro.id);
      
      actionRecorder.current = null;
    }
    
    console.log('Stopped macro recording');
  };
  
  const recordAction = (action) => {
    if (isRecording && actionRecorder.current) {
      const recordedAction = {
        type: action.type,
        parameters: { ...action.parameters },
        timestamp: Date.now() - actionRecorder.current.startTime
      };
      
      actionRecorder.current.actions.push(recordedAction);
      setRecordedActions([...recordedActions, recordedAction]);
    }
  };
  
  const executeMacro = (macroId) => {
    const macro = macros.find(m => m.id === macroId);
    if (!macro) return;
    
    console.log(`Executing macro: ${macro.name}`);
    
    // Execute each action in sequence
    macro.actions.forEach((action, index) => {
      setTimeout(() => {
        executeAction(action);
      }, index * 50); // 50ms delay between actions
    });
  };
  
  const executeAction = (action) => {
    switch (action.type) {
      case 'saveMix':
        saveMixSnapshot(action.parameters);
        break;
      case 'stopPlayback':
        stopAllPlayback();
        break;
      case 'resetVolumes':
        resetAllVolumes();
        break;
      case 'muteAll':
        muteAllTracks();
        break;
      case 'soloTrack':
        soloTrack(action.parameters.trackId);
        break;
      case 'createTrack':
        createNewTrack(action.parameters);
        break;
      case 'exportStems':
        exportTrackStems(action.parameters);
        break;
      case 'delete-selected':
        deleteSelectedItems();
        break;
      case 'duplicate':
        duplicateSelectedItems();
        break;
      case 'select-all':
        selectAllItems();
        break;
      case 'deselect-all':
        deselectAllItems();
        break;
      case 'record-arm':
        toggleRecordArm();
        break;
      case 'mute':
        toggleMute();
        break;
      case 'solo':
        toggleSolo();
        break;
      case 'zoom-fit':
        zoomToFit();
        break;
      case 'zoom-in':
        zoomIn();
        break;
      case 'zoom-out':
        zoomOut();
        break;
      case 'nudge-left':
        nudgeLeft();
        break;
      case 'nudge-right':
        nudgeRight();
        break;
      case 'nudge-up':
        nudgeUp();
        break;
      case 'nudge-down':
        nudgeDown();
        break;
      default:
        console.log(`Unknown action type: ${action.type}`);
    }
  };
  
  // Action implementations
  const saveMixSnapshot = (params) => {
    console.log('Saving mix snapshot', params);
  };
  
  const stopAllPlayback = () => {
    console.log('Stopping all playback');
  };
  
  const resetAllVolumes = () => {
    console.log('Resetting all volumes to 0dB');
  };
  
  const muteAllTracks = () => {
    console.log('Muting all tracks');
  };
  
  const soloTrack = (trackId) => {
    console.log('Soloing track:', trackId);
  };
  
  const createNewTrack = (params) => {
    console.log('Creating new track:', params);
  };
  
  const exportTrackStems = (params) => {
    console.log('Exporting stems:', params);
  };
  
  const deleteSelectedItems = () => {
    console.log('Deleting selected items');
  };
  
  const duplicateSelectedItems = () => {
    console.log('Duplicating selected items');
  };
  
  const selectAllItems = () => {
    console.log('Selecting all items');
  };
  
  const deselectAllItems = () => {
    console.log('Deselecting all items');
  };
  
  const toggleRecordArm = () => {
    console.log('Toggling record arm');
  };
  
  const toggleMute = () => {
    console.log('Toggling mute');
  };
  
  const toggleSolo = () => {
    console.log('Toggling solo');
  };
  
  const zoomToFit = () => {
    console.log('Zooming to fit');
  };
  
  const zoomIn = () => {
    console.log('Zooming in');
  };
  
  const zoomOut = () => {
    console.log('Zooming out');
  };
  
  const nudgeLeft = () => {
    console.log('Nudging left');
  };
  
  const nudgeRight = () => {
    console.log('Nudging right');
  };
  
  const nudgeUp = () => {
    console.log('Nudging up');
  };
  
  const nudgeDown = () => {
    console.log('Nudging down');
  };
  
  const createCustomMacro = () => {
    const newMacro = {
      id: `macro-${Date.now()}`,
      name: 'New Macro',
      description: 'Custom macro',
      icon: '⚡',
      actions: [],
      triggers: []
    };
    
    setMacros([...macros, newMacro]);
    setSelectedMacro(newMacro.id);
  };
  
  const deleteMacro = (macroId) => {
    setMacros(macros.filter(m => m.id !== macroId));
    if (selectedMacro === macroId) {
      setSelectedMacro(null);
    }
  };
  
  const updateMacro = (macroId, updates) => {
    setMacros(macros.map(m => 
      m.id === macroId ? { ...m, ...updates } : m
    ));
  };
  
  const addKeyBinding = (macroId, keyCombo) => {
    updateMacro(macroId, {
      triggers: [...(macros.find(m => m.id === macroId)?.triggers || []), keyCombo]
    });
    
    const newBindings = new Map(keyBindings);
    newBindings.set(keyCombo, { action: macroId, context: 'macro' });
    setKeyBindings(newBindings);
  };
  
  const removeKeyBinding = (macroId, keyCombo) => {
    updateMacro(macroId, {
      triggers: macros.find(m => m.id === macroId)?.triggers.filter(t => t !== keyCombo) || []
    });
    
    const newBindings = new Map(keyBindings);
    newBindings.delete(keyCombo);
    setKeyBindings(newBindings);
  };
  
  const exportMacros = () => {
    const macroData = {
      macros,
      keyBindings: Array.from(keyBindings.entries()),
      customCommands,
      uiLayout,
      theme,
      panelSizes,
      exportDate: new Date().toISOString()
    };
    
    console.log('Exporting macros:', macroData);
    // This would download a JSON file
  };
  
  const importMacros = () => {
    console.log('Import macros dialog');
    // This would open a file dialog and load macro data
  };
  
  const resetToDefaults = () => {
    initializeDefaultMacros();
    loadKeyBindings();
    setCustomCommands([]);
    setUiLayout('default');
    setTheme('dark');
    setPanelSizes({});
  };
  
  return (
    <div className="h-full w-full bg-gray-900 text-white flex flex-col">
      {/* Macro Controls Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Zap size={24} />
            <span>Macro Controls & Workflow</span>
          </h2>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={startMacroRecording}
              disabled={isRecording}
              className={`px-4 py-2 rounded flex items-center space-x-2 ${
                isRecording 
                  ? 'bg-red-600 animate-pulse' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Keyboard size={16} />
              <span>{isRecording ? 'Recording...' : 'Record Macro'}</span>
            </button>
            
            {isRecording && (
              <button
                onClick={stopMacroRecording}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
              >
                Stop Recording
              </button>
            )}
            
            <button
              onClick={createCustomMacro}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center space-x-2"
            >
              <Plus size={16} />
              <span>New Macro</span>
            </button>
            
            <div className="flex items-center space-x-1 bg-gray-700 rounded p-1">
              <button
                onClick={exportMacros}
                className="p-2 hover:bg-gray-600 rounded"
                title="Export Macros"
              >
                <Download size={16} />
              </button>
              
              <button
                onClick={importMacros}
                className="p-2 hover:bg-gray-600 rounded"
                title="Import Macros"
              >
                <Upload size={16} />
              </button>
              
              <button
                onClick={resetToDefaults}
                className="p-2 hover:bg-gray-600 rounded"
                title="Reset to Defaults"
              >
                <Settings size={16} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Recording Status */}
        {isRecording && (
          <div className="bg-red-900/20 border border-red-600 rounded p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Recording macro actions...</span>
              </div>
              <div className="text-sm text-gray-400">
                {recordedActions.length} actions recorded
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Macro List */}
        <div className="w-1/3 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Macros</h3>
          
          <div className="space-y-2">
            {macros.map(macro => (
              <div
                key={macro.id}
                className={`bg-gray-700 rounded-lg p-3 cursor-pointer transition-all ${
                  selectedMacro === macro.id ? 'ring-2 ring-blue-500' : 'hover:bg-gray-600'
                }`}
                onClick={() => setSelectedMacro(macro.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">{macro.icon}</span>
                    <span className="font-medium">{macro.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        executeMacro(macro.id);
                      }}
                      className="p-1 bg-green-600 hover:bg-green-700 rounded"
                      title="Execute Macro"
                    >
                      <Play size={12} />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMacro(macro.id);
                      }}
                      className="p-1 bg-red-600 hover:bg-red-700 rounded"
                      title="Delete Macro"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                
                <p className="text-xs text-gray-400 mb-2">{macro.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>{macro.actions.length} actions</span>
                  <span>{macro.triggers.length} triggers</span>
                </div>
                
                {/* Key triggers */}
                {macro.triggers.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {macro.triggers.map((trigger, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-600 rounded text-xs"
                      >
                        {trigger}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Macro Editor */}
        <div className="w-1/3 bg-gray-850 border-r border-gray-700 p-4 overflow-y-auto">
          {selectedMacro ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Edit Macro</h3>
              
              {(() => {
                const macro = macros.find(m => m.id === selectedMacro);
                if (!macro) return null;
                
                return (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input
                        type="text"
                        value={macro.name}
                        onChange={(e) => updateMacro(macro.id, { name: e.target.value })}
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={macro.description}
                        onChange={(e) => updateMacro(macro.id, { description: e.target.value })}
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded h-20 resize-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Icon</label>
                      <input
                        type="text"
                        value={macro.icon}
                        onChange={(e) => updateMacro(macro.id, { icon: e.target.value })}
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                        placeholder="Enter emoji"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Actions ({macro.actions.length})</label>
                      <div className="space-y-1 max-h-40 overflow-y-auto">
                        {macro.actions.map((action, index) => (
                          <div key={index} className="bg-gray-700 rounded p-2 text-xs">
                            <div className="font-medium">{action.type}</div>
                            <div className="text-gray-400">
                              {JSON.stringify(action.parameters)}
                            </div>
                            <div className="text-gray-500">
                              {action.timestamp}ms
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Key Triggers</label>
                      <div className="space-y-2">
                        {macro.triggers.map((trigger, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={trigger}
                              onChange={(e) => {
                                const newTriggers = [...macro.triggers];
                                newTriggers[index] = e.target.value;
                                updateMacro(macro.id, { triggers: newTriggers });
                              }}
                              className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-sm"
                            />
                            <button
                              onClick={() => removeKeyBinding(macro.id, trigger)}
                              className="p-1 bg-red-600 hover:bg-red-700 rounded"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => {
                            const newTrigger = prompt('Enter key combination (e.g., ctrl+shift+a):');
                            if (newTrigger) {
                              addKeyBinding(macro.id, newTrigger);
                            }
                          }}
                          className="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                        >
                          Add Key Trigger
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => executeMacro(macro.id)}
                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded"
                      >
                        Test Macro
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="text-center text-gray-400 mt-8">
              <Zap size={48} className="mx-auto mb-4" />
              <p>Select a macro to edit</p>
            </div>
          )}
        </div>
        
        {/* Key Bindings & Settings */}
        <div className="w-1/3 bg-gray-800 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Key Bindings</h3>
          
          <div className="space-y-4">
            {/* Global Key Bindings */}
            <div>
              <h4 className="font-medium mb-2 text-blue-400">Global</h4>
              <div className="space-y-1">
                {Array.from(keyBindings.entries())
                  .filter(([key, binding]) => binding.context === 'global')
                  .map(([key, binding]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-400">{key}</span>
                      <span>{binding.action}</span>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Track Key Bindings */}
            <div>
              <h4 className="font-medium mb-2 text-green-400">Tracks</h4>
              <div className="space-y-1">
                {Array.from(keyBindings.entries())
                  .filter(([key, binding]) => binding.context === 'tracks')
                  .map(([key, binding]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-400">{key}</span>
                      <span>{binding.action}</span>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* Timeline Key Bindings */}
            <div>
              <h4 className="font-medium mb-2 text-yellow-400">Timeline</h4>
              <div className="space-y-1">
                {Array.from(keyBindings.entries())
                  .filter(([key, binding]) => binding.context === 'timeline')
                  .map(([key, binding]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-400">{key}</span>
                      <span>{binding.action}</span>
                    </div>
                  ))}
              </div>
            </div>
            
            {/* UI Settings */}
            <div>
              <h4 className="font-medium mb-2 text-purple-400">UI Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Layout</label>
                  <select
                    value={uiLayout}
                    onChange={(e) => setUiLayout(e.target.value)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm"
                  >
                    <option value="default">Default</option>
                    <option value="compact">Compact</option>
                    <option value="expanded">Expanded</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Theme</label>
                  <select
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded text-sm"
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Statistics */}
            <div>
              <h4 className="font-medium mb-2 text-orange-400">Statistics</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Macros:</span>
                  <span>{macros.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Key Bindings:</span>
                  <span>{keyBindings.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Actions:</span>
                  <span>{macros.reduce((sum, m) => sum + m.actions.length, 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacroControls;
