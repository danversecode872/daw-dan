import React from 'react';
import { Play, Pause, Square, Circle, SkipBack, SkipForward } from 'lucide-react';
import useProjectStore from '../stores/projectStore';

const TransportControls = () => {
  const { 
    isPlaying, 
    currentTime, 
    duration, 
    bpm, 
    setPlaybackState, 
    setCurrentTime, 
    setBPM 
  } = useProjectStore();

  const handlePlayPause = () => {
    setPlaybackState(!isPlaying);
  };

  const handleStop = () => {
    setPlaybackState(false);
    setCurrentTime(0);
  };

  const handleRecord = () => {
    // Implement recording functionality
    console.log('Record pressed');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBPMChange = (e) => {
    const newBPM = parseInt(e.target.value);
    if (newBPM >= 40 && newBPM <= 300) {
      setBPM(newBPM);
    }
  };

  return (
    <div className="flex items-center space-x-6">
      {/* Transport Buttons */}
      <div className="flex items-center space-x-2">
        <button className="transport-button hover:bg-gray-700">
          <SkipBack size={20} />
        </button>
        
        <button 
          className={`transport-button ${isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
          onClick={handlePlayPause}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        
        <button 
          className="transport-button hover:bg-gray-700"
          onClick={handleStop}
        >
          <Square size={20} />
        </button>
        
        <button 
          className="transport-button bg-red-600 hover:bg-red-700"
          onClick={handleRecord}
        >
          <Circle size={20} />
        </button>
        
        <button className="transport-button hover:bg-gray-700">
          <SkipForward size={20} />
        </button>
      </div>

      {/* Time Display */}
      <div className="flex items-center space-x-4">
        <div className="text-sm font-mono bg-gray-700 px-3 py-1 rounded">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* BPM Control */}
      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-400">BPM:</label>
        <input
          type="number"
          value={bpm}
          onChange={handleBPMChange}
          min="40"
          max="300"
          className="w-16 bg-gray-700 text-white px-2 py-1 rounded text-sm text-center"
        />
      </div>

      {/* Time Signature */}
      <div className="flex items-center space-x-2">
        <label className="text-sm text-gray-400">Time:</label>
        <div className="flex items-center bg-gray-700 rounded">
          <input
            type="number"
            defaultValue="4"
            min="1"
            max="16"
            className="w-8 bg-transparent text-white px-1 py-1 text-center text-sm"
          />
          <span className="text-gray-400 mx-1">/</span>
          <input
            type="number"
            defaultValue="4"
            min="1"
            max="16"
            className="w-8 bg-transparent text-white px-1 py-1 text-center text-sm"
          />
        </div>
      </div>

      {/* Loop Control */}
      <div className="flex items-center space-x-2">
        <button className="px-3 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600">
          Loop
        </button>
      </div>

      {/* Metronome */}
      <div className="flex items-center space-x-2">
        <button className="px-3 py-1 text-sm bg-gray-700 rounded hover:bg-gray-600">
          Metronome
        </button>
      </div>
    </div>
  );
};

export default TransportControls;
