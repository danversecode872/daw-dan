import React from 'react';
import { Plus, Volume2, Headphones, Mic, Volume, VolumeX, Radio, Music, Settings, Trash2, Eye, EyeOff } from 'lucide-react';
import useProjectStore from '../stores/projectStore';

const TrackList = () => {
  const { tracks, addTrack, updateTrack, removeTrack } = useProjectStore();

  const handleAddTrack = (type) => {
    addTrack(type);
  };

  const handleToggleMute = (trackId) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, { muted: !track.muted });
    }
  };

  const handleToggleSolo = (trackId) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, { solo: !track.solo });
    }
  };

  const handleToggleRecord = (trackId) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, { recordArmed: !track.recordArmed });
    }
  };

  const handleVolumeChange = (trackId, volume) => {
    updateTrack(trackId, { volume });
  };

  const handlePanChange = (trackId, pan) => {
    updateTrack(trackId, { pan });
  };

  const getTrackIcon = (type) => {
    switch (type) {
      case 'audio':
        return <Volume2 size={16} className="text-blue-400" />;
      case 'midi':
        return <Music size={16} className="text-green-400" />;
      case 'instrument':
        return <Headphones size={16} className="text-purple-400" />;
      case 'drums':
        return <Radio size={16} className="text-orange-400" />;
      case 'bus':
        return <Volume size={16} className="text-yellow-400" />;
      case 'return':
        return <Headphones size={16} className="text-pink-400" />;
      default:
        return <Music size={16} className="text-gray-400" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Add Track Buttons */}
      <div className="p-2 border-b border-gray-700">
        <div className="space-y-1">
          <button
            onClick={() => handleAddTrack('audio')}
            className="w-full flex items-center justify-center space-x-2 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
          >
            <Plus size={14} />
            <span>Audio Track</span>
          </button>
          <button
            onClick={() => handleAddTrack('midi')}
            className="w-full flex items-center justify-center space-x-2 px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
          >
            <Plus size={14} />
            <span>MIDI Track</span>
          </button>
          <button
            onClick={() => handleAddTrack('instrument')}
            className="w-full flex items-center justify-center space-x-2 px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
          >
            <Plus size={14} />
            <span>Instrument</span>
          </button>
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 overflow-y-auto">
        {tracks.map((track) => (
          <div key={track.id} className="track-controls">
            {/* Track Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getTrackIcon(track.type)}
                <input
                  type="text"
                  value={track.name}
                  onChange={(e) => updateTrack(track.id, { name: e.target.value })}
                  className="bg-transparent text-sm text-white border-b border-transparent hover:border-gray-600 focus:border-blue-500 focus:outline-none px-1"
                />
              </div>
              <button
                onClick={() => removeTrack(track.id)}
                className="text-red-500 hover:text-red-400 p-1"
                title="Delete Track"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* Track Controls */}
            <div className="space-y-2">
              {/* Mute/Solo/Record Buttons */}
              <div className="flex space-x-1">
                <button
                  onClick={() => handleToggleMute(track.id)}
                  className={`track-mute flex items-center justify-center ${track.muted ? 'active' : ''}`}
                  title={track.muted ? 'Unmute' : 'Mute'}
                >
                  {track.muted ? <VolumeX size={12} /> : <Volume size={12} />}
                </button>
                <button
                  onClick={() => handleToggleSolo(track.id)}
                  className={`track-solo flex items-center justify-center ${track.solo ? 'active' : ''}`}
                  title={track.solo ? 'Unsolo' : 'Solo'}
                >
                  <Eye size={12} />
                </button>
                <button
                  onClick={() => handleToggleRecord(track.id)}
                  className={`track-record flex items-center justify-center ${track.recordArmed ? 'active' : ''}`}
                  title={track.recordArmed ? 'Disarm Record' : 'Arm Record'}
                >
                  <Radio size={12} />
                </button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <Volume2 size={12} className="text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={track.volume}
                  onChange={(e) => handleVolumeChange(track.id, parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-400 w-8 text-right">
                  {Math.round(track.volume * 100)}
                </span>
              </div>

              {/* Pan Control */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400 w-4">L</span>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={track.pan}
                  onChange={(e) => handlePanChange(track.id, parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-gray-400 w-4 text-right">R</span>
              </div>

              {/* Effect Slots */}
              <div className="space-y-1">
                <div className="plugin-slot rounded p-1 text-xs text-gray-400 text-center">
                  + Effect
                </div>
                <div className="plugin-slot rounded p-1 text-xs text-gray-400 text-center">
                  + Effect
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrackList;
