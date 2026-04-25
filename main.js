const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const Store = require('electron-store');

let mainWindow;
const isDev = process.argv.includes('--dev');
const isWindows = process.platform === 'win32';
const isMac = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

// Initialize electron-store for app settings
const store = new Store();

function createWindow() {
  // Platform-specific window configuration
  const windowConfig = {
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    },
    show: false,
    icon: getAppIcon()
  };

  // Platform-specific title bar and frame settings
  if (isMac) {
    windowConfig.titleBarStyle = 'hiddenInset';
    windowConfig.frame = true;
  } else if (isWindows) {
    windowConfig.frame = true;
    windowConfig.titleBarStyle = 'default';
  } else {
    windowConfig.frame = true;
  }

  mainWindow = new BrowserWindow(windowConfig);

  if (isDev) {
    mainWindow.loadFile('index.html');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile('build/index.html');
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Restore window position and size
    const windowState = store.get('windowState');
    if (windowState) {
      mainWindow.setBounds(windowState);
    }
  });

  // Save window state on close
  mainWindow.on('close', () => {
    store.set('windowState', mainWindow.getBounds());
  });

  // Handle window state
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state-changed', 'maximized');
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state-changed', 'unmaximized');
  });

  mainWindow.on('focus', () => {
    mainWindow.webContents.send('window-state-changed', 'focused');
  });

  mainWindow.on('blur', () => {
    mainWindow.webContents.send('window-state-changed', 'blurred');
  });

  createMenu();
  setupAutoUpdater();
}

function getAppIcon() {
  if (isMac) {
    return path.join(__dirname, 'build/icon.icns');
  } else if (isWindows) {
    return path.join(__dirname, 'build/icon.ico');
  } else if (isLinux) {
    return path.join(__dirname, 'build/icon.png');
  }
  return null;
}

function setupAutoUpdater() {
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
    
    autoUpdater.on('update-available', () => {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Available',
        message: 'A new version of DAW Dan is available. Would you like to download it now?',
        buttons: ['Yes', 'No']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
    });

    autoUpdater.on('update-downloaded', () => {
      dialog.showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: 'The update has been downloaded. Restart the application to apply the update.',
        buttons: ['Restart Now', 'Later']
      }).then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });
  }
}

function createMenu() {
  const template = getPlatformMenuTemplate();
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function getPlatformMenuTemplate() {
  const baseTemplate = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-project');
          }
        },
        {
          label: 'Open Project',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [{ name: 'DAW Dan Projects', extensions: ['dawdan'] }]
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('menu-open-project', result.filePaths[0]);
            }
          }
        },
        {
          label: 'Save Project',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-project');
          }
        },
        {
          label: 'Save Project As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              filters: [{ name: 'DAW Dan Projects', extensions: ['dawdan'] }]
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('menu-save-project-as', result.filePath);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Import Audio',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile', 'multiSelections'],
              filters: [
                { name: 'Audio Files', extensions: ['wav', 'mp3', 'ogg', 'flac', 'm4a', 'aiff'] }
              ]
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('menu-import-audio', result.filePaths);
            }
          }
        },
        {
          label: 'Import MIDI',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'MIDI Files', extensions: ['mid', 'midi'] }
              ]
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('menu-import-midi', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Export Audio',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-export-audio');
          }
        },
        {
          label: 'Export Stems',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => {
            mainWindow.webContents.send('menu-export-stems');
          }
        },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'Plugins',
      submenu: [
        {
          label: 'Plugin Manager',
          click: () => {
            mainWindow.webContents.send('menu-plugin-manager');
          }
        },
        {
          label: 'Scan for Plugins',
          click: () => {
            mainWindow.webContents.send('menu-scan-plugins');
          }
        },
        { type: 'separator' },
        {
          label: 'Audio Settings',
          click: () => {
            mainWindow.webContents.send('menu-audio-settings');
          }
        },
        {
          label: 'MIDI Settings',
          click: () => {
            mainWindow.webContents.send('menu-midi-settings');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About DAW Dan',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About DAW Dan',
              message: 'DAW Dan',
              detail: 'Professional Cross-Platform Digital Audio Workstation\nVersion 1.0.0\n\n© 2024 DAW Dan. All rights reserved.',
              buttons: ['OK']
            });
          }
        },
        {
          label: 'Check for Updates',
          click: () => {
            autoUpdater.checkForUpdatesAndNotify();
          }
        },
        {
          label: 'Documentation',
          click: () => {
            shell.openExternal('https://docs.dawdan.com');
          }
        },
        {
          label: 'Report Issue',
          click: () => {
            shell.openExternal('https://github.com/dawdan/daw-dan/issues');
          }
        }
      ]
    }
  ];

  // Add platform-specific menu items
  if (isMac) {
    // macOS app menu
    baseTemplate.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    });

    // macOS window menu
    baseTemplate.splice(-2, 0, {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
        { role: 'window' }
      ]
    });
  }

  return baseTemplate;
}

// IPC Handlers
ipcMain.handle('save-project-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'DAW Dan Projects', extensions: ['dawdan'] }]
  });
  return result;
});

ipcMain.handle('get-plugins-path', () => {
  return path.join(app.getPath('userData'), 'plugins');
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
