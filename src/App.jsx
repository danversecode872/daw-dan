import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Circle, Mic, Save, FolderOpen, Plus, Settings } from 'lucide-react';
import TrackList from './components/TrackList';
import Timeline from './components/Timeline';
import TransportControls from './components/TransportControls';
import PluginManager from './components/PluginManager';
import useProjectStore from './stores/projectStore';

function App() {
  const [isPluginManagerOpen, setIsPluginManagerOpen] = useState(false);
  const { currentProject, createNewProject, saveProject, loadProject } = useProjectStore();

  useEffect(() => {
    // Set up menu event listeners
    if (window.electronAPI) {
      window.electronAPI.onMenuAction((event, action, data) => {
        switch (action) {
          case 'new-project':
            createNewProject();
            break;
          case 'open-project':
            loadProject(data);
            break;
          case 'save-project':
            saveProject();
            break;
          case 'import-audio':
            // Handle audio import
            console.log('Import audio files:', data);
            break;
          case 'plugin-manager':
            setIsPluginManagerOpen(true);
            break;
          case 'scan-plugins':
            // Scan for plugins
            console.log('Scanning for plugins...');
            break;
          default:
            break;
        }
      });
    }
  }, [createNewProject, saveProject, loadProject]);

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-blue-400">DAW Dan</h1>
          <span className="text-sm text-gray-400">
            {currentProject ? currentProject.name : 'No Project'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-700 rounded">
            <FolderOpen size={16} />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded">
            <Save size={16} />
          </button>
          <button 
            className="p-2 hover:bg-gray-700 rounded"
            onClick={() => setIsPluginManagerOpen(true)}
          >
            <Settings size={16} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Transport Controls */}
        <div className="bg-gray-800 border-b border-gray-700 p-4">
          <TransportControls />
        </div>

        {/* Timeline and Tracks */}
        <div className="flex-1 flex overflow-hidden">
          <div className="w-48 bg-gray-800 border-r border-gray-700">
            <TrackList />
          </div>
          
          <div className="flex-1 bg-gray-850 overflow-hidden">
            <Timeline />
          </div>
        </div>

        {/* Bottom Panel for Mixer/Effects */}
        <div className="h-48 bg-gray-800 border-t border-gray-700">
          <div className="p-4">
            <h3 className="text-sm font-semibold mb-2 text-gray-400">Mixer & Effects</h3>
            <div className="flex space-x-4">
              {/* Plugin slots will go here */}
              <div className="bg-gray-700 rounded p-2 w-32 h-20 flex items-center justify-center text-xs text-gray-400">
                Drop Plugin
              </div>
              <div className="bg-gray-700 rounded p-2 w-32 h-20 flex items-center justify-center text-xs text-gray-400">
                Drop Plugin
              </div>
              <div className="bg-gray-700 rounded p-2 w-32 h-20 flex items-center justify-center text-xs text-gray-400">
                Drop Plugin
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Plugin Manager Modal */}
      {isPluginManagerOpen && (
        <PluginManager onClose={() => setIsPluginManagerOpen(false)} />
      )}
    </div>
  );
}

export default App;
