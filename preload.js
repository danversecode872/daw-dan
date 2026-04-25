const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveProjectDialog: () => ipcRenderer.invoke('save-project-dialog'),
  getPluginsPath: () => ipcRenderer.invoke('get-plugins-path'),
  
  // Menu events
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-new-project', callback);
    ipcRenderer.on('menu-open-project', (event, filePath) => callback(event, 'open-project', filePath));
    ipcRenderer.on('menu-save-project', (event) => callback(event, 'save-project'));
    ipcRenderer.on('menu-import-audio', (event, filePaths) => callback(event, 'import-audio', filePaths));
    ipcRenderer.on('menu-plugin-manager', (event) => callback(event, 'plugin-manager'));
    ipcRenderer.on('menu-scan-plugins', (event) => callback(event, 'scan-plugins'));
  },
  
  // Audio system
  requestAudioAccess: () => ipcRenderer.invoke('request-audio-access'),
  
  // Plugin system
  loadPlugin: (pluginPath) => ipcRenderer.invoke('load-plugin', pluginPath),
  unloadPlugin: (pluginId) => ipcRenderer.invoke('unload-plugin', pluginId),
  getPluginList: () => ipcRenderer.invoke('get-plugin-list')
});
