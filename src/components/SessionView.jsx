import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, Circle, Plus, Trash2, Volume2, Headphones, Mic, Layers } from 'lucide-react';
import useProjectStore from '../stores/projectStore';

const SessionView = () => {
  const { tracks, bpm, createTrack, deleteTrack } = useProjectStore();
  const [scenes, setScenes] = useState([]);
  const [selectedScene, setSelectedScene] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [globalQuantize, setGlobalQuantize] = useState('1/4');
  const [launchMode, setLaunchMode] = useState('trigger'); // trigger, gate, toggle
  const [followAction, setFollowAction] = useState('none'); // none, next, previous, first, last, any
  
  // Session state
  const [playingClips, setPlayingClips] = useState(new Set());
  const [armedClips, setArmedClips] = useState(new Set());
  const [clipStates, setClipStates] = useState({});
  const [sessionRecording, setSessionRecording] = useState(false);
  
  // Capture functionality
  const [captureBuffer, setCaptureBuffer] = useState({
    midi: [],
    audio: [],
    timestamp: null
  });
  
  const gridRef = useRef(null);
  
  useEffect(() => {
    initializeSessionGrid();
  }, [tracks]);
  
  useEffect(() => {
    // Start session loop
    if (isPlaying) {
      startSessionLoop();
    } else {
      stopSessionLoop();
    }
  }, [isPlaying]);
  
  const initializeSessionGrid = () => {
    // Create session grid with tracks and scenes
    const initialScenes = [
      { id: 'scene-1', name: 'Intro', color: '#3b82f6', clips: [] },
      { id: 'scene-2', name: 'Verse', color: '#10b981', clips: [] },
      { id: 'scene-3', name: 'Chorus', color: '#f59e0b', clips: [] },
      { id: 'scene-4', name: 'Bridge', color: '#8b5cf6', clips: [] },
      { id: 'scene-5', name: 'Outro', color: '#ef4444', clips: [] }
    ];
    
    // Initialize clip slots for each track
    tracks.forEach(track => {
      initialScenes.forEach(scene => {
        scene.clips.push({
          id: `${track.id}-${scene.id}`,
          trackId: track.id,
          sceneId: scene.id,
          name: '',
          content: null,
          color: track.color || '#6b7280',
          state: 'empty', // empty, loaded, playing, recording, armed
          loop: true,
          quantize: globalQuantize,
          launchMode
        });
      });
    });
    
    setScenes(initialScenes);
  };
  
  const startSessionLoop = () => {
    // Start the session playback loop
    console.log('Starting session loop at', bpm, 'BPM');
    // This would integrate with the audio engine for timing
  };
  
  const stopSessionLoop = () => {
    // Stop the session playback loop
    console.log('Stopping session loop');
  };
  
  const launchClip = (clip) => {
    if (clip.state === 'empty') return;
    
    const newPlayingClips = new Set(playingClips);
    
    // Stop other clips in the same track (unless in legato mode)
    if (launchMode !== 'legato') {
      scenes.forEach(scene => {
        scene.clips.forEach(otherClip => {
          if (otherClip.trackId === clip.trackId && otherClip.state === 'playing') {
            otherClip.state = 'loaded';
            newPlayingClips.delete(otherClip.id);
          }
        });
      });
    }
    
    // Launch the clip
    clip.state = 'playing';
    newPlayingClips.add(clip.id);
    
    setPlayingClips(newPlayingClips);
    updateClipState(clip.id, 'playing');
    
    // Handle follow actions
    handleFollowAction(clip);
  };
  
  const stopClip = (clip) => {
    clip.state = 'loaded';
    const newPlayingClips = new Set(playingClips);
    newPlayingClips.delete(clip.id);
    
    setPlayingClips(newPlayingClips);
    updateClipState(clip.id, 'loaded');
  };
  
  const launchScene = (scene) => {
    // Stop all currently playing clips
    scenes.forEach(s => {
      s.clips.forEach(clip => {
        if (clip.state === 'playing') {
          stopClip(clip);
        }
      });
    });
    
    // Launch all clips in the scene
    scene.clips.forEach(clip => {
      if (clip.state !== 'empty') {
        launchClip(clip);
      }
    });
    
    setSelectedScene(scene.id);
  };
  
  const recordClip = (clip) => {
    if (clip.state === 'empty') {
      // Start recording new clip
      clip.state = 'recording';
      updateClipState(clip.id, 'recording');
      
      // Start capture functionality
      startCapture(clip);
    } else if (clip.state === 'recording') {
      // Stop recording
      clip.state = 'loaded';
      updateClipState(clip.id, 'loaded');
      
      // Stop capture and create clip from buffer
      stopCapture(clip);
    }
  };
  
  const startCapture = (clip) => {
    // Start capturing MIDI/audio for this clip
    setCaptureBuffer({
      midi: [],
      audio: [],
      timestamp: Date.now()
    });
    
    console.log('Starting capture for clip:', clip.id);
  };
  
  const stopCapture = (clip) => {
    // Create clip from captured data
    const capturedData = {
      midi: captureBuffer.midi,
      audio: captureBuffer.audio,
      duration: (Date.now() - captureBuffer.timestamp) / 1000,
      timestamp: captureBuffer.timestamp
    };
    
    // Convert captured data to clip content
    clip.content = capturedData;
    clip.name = `Captured ${new Date().toLocaleTimeString()}`;
    
    console.log('Stopped capture, created clip:', clip);
  };
  
  const handleFollowAction = (clip) => {
    if (followAction === 'none') return;
    
    // Find next clip to launch based on follow action
    const sceneIndex = scenes.findIndex(s => s.id === clip.sceneId);
    
    switch (followAction) {
      case 'next':
        if (sceneIndex < scenes.length - 1) {
          setTimeout(() => launchScene(scenes[sceneIndex + 1]), 1000);
        }
        break;
      case 'previous':
        if (sceneIndex > 0) {
          setTimeout(() => launchScene(scenes[sceneIndex - 1]), 1000);
        }
        break;
      case 'first':
        setTimeout(() => launchScene(scenes[0]), 1000);
        break;
      case 'last':
        setTimeout(() => launchScene(scenes[scenes.length - 1]), 1000);
        break;
      case 'any':
        // Launch random scene
        const randomIndex = Math.floor(Math.random() * scenes.length);
        setTimeout(() => launchScene(scenes[randomIndex]), 1000);
        break;
    }
  };
  
  const updateClipState = (clipId, state) => {
    setClipStates(prev => ({
      ...prev,
      [clipId]: state
    }));
  };
  
  const createNewScene = () => {
    const newScene = {
      id: `scene-${scenes.length + 1}`,
      name: `Scene ${scenes.length + 1}`,
      color: '#6b7280',
      clips: []
    };
    
    // Add clip slots for new scene
    tracks.forEach(track => {
      newScene.clips.push({
        id: `${track.id}-${newScene.id}`,
        trackId: track.id,
        sceneId: newScene.id,
        name: '',
        content: null,
        color: track.color || '#6b7280',
        state: 'empty',
        loop: true,
        quantize: globalQuantize,
        launchMode
      });
    });
    
    setScenes([...scenes, newScene]);
  };
  
  const deleteScene = (sceneId) => {
    setScenes(scenes.filter(s => s.id !== sceneId));
  };
  
  const duplicateScene = (scene) => {
    const duplicatedScene = {
      ...scene,
      id: `scene-${scenes.length + 1}`,
      name: `${scene.name} (Copy)`,
      clips: scene.clips.map(clip => ({
        ...clip,
        id: `${clip.trackId}-scene-${scenes.length + 1}`,
        sceneId: `scene-${scenes.length + 1}`
      }))
    };
    
    setScenes([...scenes, duplicatedScene]);
  };
  
  const getClipIcon = (clip) => {
    switch (clip.state) {
      case 'playing':
        return <Circle size={16} className="text-green-500 fill-current" />;
      case 'recording':
        return <Circle size={16} className="text-red-500 fill-current animate-pulse" />;
      case 'armed':
        return <Circle size={16} className="text-yellow-500" />;
      case 'loaded':
        return <Square size={16} className="text-blue-500" />;
      default:
        return <Plus size={16} className="text-gray-500" />;
    }
  };
  
  const getClipColor = (clip) => {
    switch (clip.state) {
      case 'playing':
        return 'bg-green-500';
      case 'recording':
        return 'bg-red-500';
      case 'armed':
        return 'bg-yellow-500';
      case 'loaded':
        return 'bg-blue-500';
      default:
        return 'bg-gray-700';
    }
  };
  
  return (
    <div className="h-full w-full bg-gray-900 text-white flex flex-col">
      {/* Session View Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-bold">Session View</h2>
          
          {/* Transport Controls */}
          <div className="flex items-center space-x-1 bg-gray-700 rounded p-1">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1 rounded ${isPlaying ? 'bg-red-600' : 'bg-green-600'}`}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            
            <button
              onClick={() => {
                setIsPlaying(false);
                setPlayingClips(new Set());
                scenes.forEach(scene => {
                  scene.clips.forEach(clip => {
                    clip.state = 'loaded';
                  });
                });
              }}
              className="p-1 rounded bg-gray-600 hover:bg-gray-500"
            >
              <Square size={16} />
            </button>
          </div>
          
          {/* Session Recording */}
          <button
            onClick={() => setSessionRecording(!sessionRecording)}
            className={`px-3 py-1 rounded flex items-center space-x-1 ${
              sessionRecording ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Circle size={12} className={sessionRecording ? 'fill-current' : ''} />
            <span>Session Record</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Global Quantize */}
          <select
            value={globalQuantize}
            onChange={(e) => setGlobalQuantize(e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
          >
            <option value="none">No Quantize</option>
            <option value="1/32">1/32</option>
            <option value="1/16">1/16</option>
            <option value="1/8">1/8</option>
            <option value="1/4">1/4</option>
            <option value="1/2">1/2</option>
            <option value="1">1 Bar</option>
          </select>
          
          {/* Launch Mode */}
          <select
            value={launchMode}
            onChange={(e) => setLaunchMode(e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
          >
            <option value="trigger">Trigger</option>
            <option value="gate">Gate</option>
            <option value="toggle">Toggle</option>
            <option value="legato">Legato</option>
          </select>
          
          {/* Follow Action */}
          <select
            value={followAction}
            onChange={(e) => setFollowAction(e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
          >
            <option value="none">No Follow</option>
            <option value="next">Next Scene</option>
            <option value="previous">Previous Scene</option>
            <option value="first">First Scene</option>
            <option value="last">Last Scene</option>
            <option value="any">Any Scene</option>
          </select>
        </div>
      </div>
      
      {/* Session Grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          {/* Scene Headers */}
          <div className="flex border-b border-gray-700">
            <div className="w-32 bg-gray-800 p-2 border-r border-gray-700">
              <div className="text-xs font-semibold">Tracks</div>
            </div>
            
            {scenes.map(scene => (
              <div
                key={scene.id}
                className="flex-1 bg-gray-800 p-2 border-r border-gray-700 min-w-[120px]"
                style={{ backgroundColor: `${scene.color}20` }}
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={scene.name}
                    onChange={(e) => {
                      scene.name = e.target.value;
                      setScenes([...scenes]);
                    }}
                    className="bg-transparent text-xs font-semibold flex-1 border-b border-transparent hover:border-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => duplicateScene(scene)}
                      className="p-1 hover:bg-gray-700 rounded"
                      title="Duplicate Scene"
                    >
                      <Layers size={12} />
                    </button>
                    
                    <button
                      onClick={() => deleteScene(scene.id)}
                      className="p-1 hover:bg-gray-700 rounded"
                      title="Delete Scene"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={() => launchScene(scene)}
                  className={`w-full mt-1 px-2 py-1 rounded text-xs font-medium ${
                    selectedScene === scene.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  Launch
                </button>
              </div>
            ))}
            
            <div className="w-10 bg-gray-800 p-2 flex items-center justify-center">
              <button
                onClick={createNewScene}
                className="p-1 bg-green-600 hover:bg-green-700 rounded"
                title="Add Scene"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
          
          {/* Track Rows */}
          {tracks.map(track => (
            <div key={track.id} className="flex border-b border-gray-700">
              {/* Track Header */}
              <div className="w-32 bg-gray-800 p-2 border-r border-gray-700">
                <div className="flex items-center space-x-1">
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: track.color || '#6b7280' }}
                  ></div>
                  <input
                    type="text"
                    value={track.name}
                    onChange={(e) => {
                      track.name = e.target.value;
                      // Update track in store
                    }}
                    className="bg-transparent text-xs flex-1 border-b border-transparent hover:border-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                
                <div className="flex items-center space-x-1 mt-1">
                  {track.type === 'audio' && <Mic size={10} />}
                  {track.type === 'midi' && <Layers size={10} />}
                  <span className="text-xs text-gray-400">{track.type}</span>
                </div>
              </div>
              
              {/* Clip Slots */}
              {scenes.map(scene => {
                const clip = scene.clips.find(c => c.trackId === track.id);
                
                return (
                  <div
                    key={clip.id}
                    className="flex-1 border-r border-gray-700 min-w-[120px] p-1"
                  >
                    <button
                      onClick={() => {
                        if (clip.state === 'empty') {
                          recordClip(clip);
                        } else if (clip.state === 'playing') {
                          stopClip(clip);
                        } else {
                          launchClip(clip);
                        }
                      }}
                      className={`w-full h-16 rounded flex flex-col items-center justify-center space-y-1 transition-colors ${
                        getClipColor(clip)
                      } hover:opacity-80`}
                    >
                      {getClipIcon(clip)}
                      
                      {clip.name && (
                        <span className="text-xs truncate px-1">
                          {clip.name}
                        </span>
                      )}
                      
                      {clip.state === 'empty' && (
                        <span className="text-xs opacity-50">
                          {track.type === 'audio' ? 'Record' : 'Draw'}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
              
              {/* Add Track Button */}
              <div className="w-10 bg-gray-800 p-1 flex items-center justify-center">
                <button
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Track Settings"
                >
                  <Settings size={10} />
                </button>
              </div>
            </div>
          ))}
          
          {/* Master Track */}
          <div className="flex border-b-2 border-gray-600">
            <div className="w-32 bg-gray-800 p-2 border-r border-gray-700">
              <div className="text-xs font-semibold">Master</div>
            </div>
            
            {scenes.map(scene => (
              <div
                key={`master-${scene.id}`}
                className="flex-1 border-r border-gray-700 min-w-[120px] p-1"
              >
                <button
                  onClick={() => launchScene(scene)}
                  className={`w-full h-8 rounded flex items-center justify-center text-xs font-medium ${
                    selectedScene === scene.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  Launch Scene
                </button>
              </div>
            ))}
            
            <div className="w-10 bg-gray-800 p-1"></div>
          </div>
        </div>
      </div>
      
      {/* Session Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-2 py-1 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Scenes: {scenes.length}</span>
          <span>Playing: {playingClips.size} clips</span>
          <span>BPM: {bpm}</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <span>Quantize: {globalQuantize}</span>
          <span>Launch: {launchMode}</span>
          <span>Follow: {followAction}</span>
          {sessionRecording && (
            <span className="text-red-400 flex items-center space-x-1">
              <Circle size={8} className="fill-current" />
              <span>Recording</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionView;
