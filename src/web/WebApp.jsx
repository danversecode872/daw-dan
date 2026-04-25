import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Circle, Plus, Volume2, Mic, Headphones, Settings, Download, Upload } from 'lucide-react';

// Import web audio engine
import './WebAudioEngine.js';

const WebApp = () => {
  const [audioEngine, setAudioEngine] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tracks, setTracks] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Initialize audio engine
  useEffect(() => {
    const initAudio = async () => {
      try {
        if (window.WebAudioEngine) {
          const engine = new window.WebAudioEngine();
          setAudioEngine(engine);
          setIsLoading(false);
          console.log('🎵 Web Audio Engine initialized');
        } else {
          throw new Error('Web Audio Engine not loaded');
        }
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    };

    initAudio();

    return () => {
      if (audioEngine) {
        audioEngine.dispose();
      }
    };
  }, []);

  // Add new track
  const addTrack = (type = 'audio') => {
    if (!audioEngine) return;
    
    const trackId = `track-${Date.now()}`;
    const track = audioEngine.createTrack(trackId, `${type.charAt(0).toUpperCase() + type.slice(1)} Track`);
    
    setTracks(prev => [...prev, {
      ...track,
      type,
      volume: 0.8,
      pan: 0,
      muted: false,
      solo: false,
      recordArmed: false
    }]);
  };

  // Handle file upload
  const handleFileUpload = async (event, trackId) => {
    const file = event.target.files[0];
    if (!file || !audioEngine) return;

    try {
      await audioEngine.loadAudioFile(trackId, file);
      console.log(`📁 Loaded ${file.name} into track`);
    } catch (err) {
      console.error('Failed to load audio file:', err);
    }
  };

  // Play/pause
  const togglePlayback = async () => {
    if (!audioEngine) return;

    try {
      if (isPlaying) {
        audioEngine.stop();
        setIsPlaying(false);
      } else {
        await audioEngine.start();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('Playback error:', err);
    }
  };

  // Stop
  const stopPlayback = () => {
    if (!audioEngine) return;
    
    audioEngine.stop();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Update track volume
  const updateTrackVolume = (trackId, volume) => {
    if (!audioEngine) return;
    
    audioEngine.setTrackVolume(trackId, volume);
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, volume } : track
    ));
  };

  // Update track pan
  const updateTrackPan = (trackId, pan) => {
    if (!audioEngine) return;
    
    audioEngine.setTrackPan(trackId, pan);
    setTracks(prev => prev.map(track => 
      track.id === trackId ? { ...track, pan } : track
    ));
  };

  // Toggle mute
  const toggleMute = (trackId) => {
    if (!audioEngine) return;
    
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      const newMuted = !track.muted;
      audioEngine.setTrackMute(trackId, newMuted);
      setTracks(prev => prev.map(t => 
        t.id === trackId ? { ...t, muted: newMuted } : t
      ));
    }
  };

  // Toggle solo
  const toggleSolo = (trackId) => {
    if (!audioEngine) return;
    
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      const newSolo = !track.solo;
      audioEngine.setTrackSolo(trackId, newSolo);
      setTracks(prev => prev.map(t => 
        t.id === trackId ? { ...t, solo: newSolo } : t
      ));
    }
  };

  // Toggle record arm
  const toggleRecord = (trackId) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      setTracks(prev => prev.map(t => 
        t.id === trackId ? { ...t, recordArmed: !t.recordArmed } : t
      ));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold">Loading DAW Dan...</h2>
          <p className="text-gray-400 mt-2">Initializing Web Audio Engine</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold mb-2">Audio Engine Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500">
            Please ensure your browser supports Web Audio API and that you've granted microphone permissions if needed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-blue-400">🎵 DAW Dan</h1>
            <span className="text-sm text-gray-400">Web Edition</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-700 rounded" title="Settings">
              <Settings size={20} />
            </button>
            <button className="p-2 hover:bg-gray-700 rounded" title="Export">
              <Download size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Transport Controls */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlayback}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <button
              onClick={stopPlayback}
              className="p-3 bg-red-600 hover:bg-red-700 rounded-full"
              title="Stop"
            >
              <Square size={24} />
            </button>
            <button
              className="p-3 bg-red-600 hover:bg-red-700 rounded-full"
              title="Record"
            >
              <Circle size={24} />
            </button>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">BPM:</label>
              <input
                type="number"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                className="w-16 px-2 py-1 bg-gray-700 rounded text-sm"
                min="60"
                max="200"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Time:</span>
              <span className="font-mono text-sm">
                {Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-screen">
        {/* Track List */}
        <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold mb-3">Tracks</h2>
            <div className="space-y-2">
              <button
                onClick={() => addTrack('audio')}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                <Plus size={16} />
                <span>Add Audio Track</span>
              </button>
              <button
                onClick={() => addTrack('midi')}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
              >
                <Plus size={16} />
                <span>Add MIDI Track</span>
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {tracks.map((track) => (
              <div key={track.id} className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {track.type === 'audio' ? <Volume2 size={16} /> : <Mic size={16} />}
                    <input
                      type="text"
                      value={track.name}
                      onChange={(e) => {
                        setTracks(prev => prev.map(t => 
                          t.id === track.id ? { ...t, name: e.target.value } : t
                        ));
                      }}
                      className="bg-transparent text-sm border-b border-transparent hover:border-gray-600 focus:border-blue-500 focus:outline-none px-1"
                    />
                  </div>
                </div>
                
                {/* Track Controls */}
                <div className="space-y-2">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => toggleMute(track.id)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${
                        track.muted ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    >
                      M
                    </button>
                    <button
                      onClick={() => toggleSolo(track.id)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${
                        track.solo ? 'bg-yellow-600' : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    >
                      S
                    </button>
                    <button
                      onClick={() => toggleRecord(track.id)}
                      className={`flex-1 px-2 py-1 text-xs rounded ${
                        track.recordArmed ? 'bg-red-600' : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    >
                      R
                    </button>
                  </div>
                  
                  {/* Volume */}
                  <div className="flex items-center space-x-2">
                    <Volume2 size={12} className="text-gray-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={track.volume}
                      onChange={(e) => updateTrackVolume(track.id, parseFloat(e.target.value))}
                      className="flex-1 h-1"
                    />
                  </div>
                  
                  {/* Pan */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400 w-3">L</span>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.01"
                      value={track.pan}
                      onChange={(e) => updateTrackPan(track.id, parseFloat(e.target.value))}
                      className="flex-1 h-1"
                    />
                    <span className="text-xs text-gray-400 w-3">R</span>
                  </div>
                  
                  {/* File Upload */}
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={(e) => handleFileUpload(e, track.id)}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-center space-x-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                    >
                      <Upload size={12} />
                      <span>Load Audio</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline/Editor Area */}
        <div className="flex-1 bg-gray-850 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold mb-2">DAW Dan Web Edition</h3>
            <p className="text-gray-400 mb-4">Professional Digital Audio Workstation in your browser</p>
            <div className="text-sm text-gray-500 space-y-1">
              <p>• Add tracks and load audio files</p>
              <p>• Use transport controls for playback</p>
              <p>• Adjust volume and pan for each track</p>
              <p>• Record from your microphone</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebApp;
