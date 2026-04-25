import { create } from 'zustand';

const useProjectStore = create((set, get) => ({
  currentProject: null,
  tracks: [],
  plugins: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  bpm: 120,
  sampleRate: 44100,

  createNewProject: () => {
    const newProject = {
      id: Date.now(),
      name: 'Untitled Project',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      settings: {
        bpm: 120,
        sampleRate: 44100,
        timeSignature: [4, 4]
      }
    };

    set({
      currentProject: newProject,
      tracks: [],
      plugins: [],
      isPlaying: false,
      currentTime: 0,
      bpm: 120
    });
  },

  saveProject: async () => {
    const { currentProject, tracks, plugins } = get();
    if (!currentProject) return;

    const projectData = {
      ...currentProject,
      modified: new Date().toISOString(),
      tracks,
      plugins
    };

    if (window.electronAPI) {
      const result = await window.electronAPI.saveProjectDialog();
      if (!result.canceled) {
        // In a real implementation, this would save to the file
        console.log('Saving project to:', result.filePath, projectData);
      }
    }
  },

  loadProject: async (filePath) => {
    // In a real implementation, this would load from the file
    console.log('Loading project from:', filePath);
    
    const mockProject = {
      id: Date.now(),
      name: 'Loaded Project',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      settings: {
        bpm: 140,
        sampleRate: 44100,
        timeSignature: [4, 4]
      }
    };

    set({
      currentProject: mockProject,
      tracks: [],
      plugins: [],
      isPlaying: false,
      currentTime: 0,
      bpm: 140
    });
  },

  addTrack: (type = 'audio') => {
    const newTrack = {
      id: Date.now(),
      name: `Track ${get().tracks.length + 1}`,
      type, // 'audio', 'midi', 'instrument'
      muted: false,
      solo: false,
      recordArmed: false,
      volume: 0.8,
      pan: 0,
      clips: [],
      effects: []
    };

    set(state => ({
      tracks: [...state.tracks, newTrack]
    }));

    return newTrack.id;
  },

  removeTrack: (trackId) => {
    set(state => ({
      tracks: state.tracks.filter(track => track.id !== trackId)
    }));
  },

  updateTrack: (trackId, updates) => {
    set(state => ({
      tracks: state.tracks.map(track =>
        track.id === trackId ? { ...track, ...updates } : track
      )
    }));
  },

  addClip: (trackId, clipData) => {
    const newClip = {
      id: Date.now(),
      ...clipData,
      trackId
    };

    set(state => ({
      tracks: state.tracks.map(track =>
        track.id === trackId
          ? { ...track, clips: [...track.clips, newClip] }
          : track
      )
    }));

    return newClip.id;
  },

  removeClip: (trackId, clipId) => {
    set(state => ({
      tracks: state.tracks.map(track =>
        track.id === trackId
          ? { ...track, clips: track.clips.filter(clip => clip.id !== clipId) }
          : track
      )
    }));
  },

  setPlaybackState: (isPlaying) => {
    set({ isPlaying });
  },

  setCurrentTime: (time) => {
    set({ currentTime: time });
  },

  setBPM: (bpm) => {
    set({ bpm });
    if (get().currentProject) {
      set(state => ({
        currentProject: {
          ...state.currentProject,
          settings: {
            ...state.currentProject.settings,
            bpm
          }
        }
      }));
    }
  },

  addPlugin: (plugin) => {
    set(state => ({
      plugins: [...state.plugins, plugin]
    }));
  },

  removePlugin: (pluginId) => {
    set(state => ({
      plugins: state.plugins.filter(plugin => plugin.id !== pluginId)
    }));
  },

  addTrackEffect: (trackId, effect) => {
    set(state => ({
      tracks: state.tracks.map(track =>
        track.id === trackId
          ? { ...track, effects: [...track.effects, effect] }
          : track
      )
    }));
  },

  removeTrackEffect: (trackId, effectId) => {
    set(state => ({
      tracks: state.tracks.map(track =>
        track.id === trackId
          ? { ...track, effects: track.effects.filter(effect => effect.id !== effectId) }
          : track
      )
    }));
  }
}));

export default useProjectStore;
