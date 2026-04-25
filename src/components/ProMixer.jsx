import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Headphones, Mic, Plus, Settings, Sliders, Send, RotateCw } from 'lucide-react';
import useProjectStore from '../stores/projectStore';

const ProMixer = () => {
  const { tracks, busses, returns, updateTrack, createBus, createReturn } = useProjectStore();
  const [selectedTracks, setSelectedTracks] = useState(new Set());
  const [showBusPanel, setShowBusPanel] = useState(false);
  const [showReturnPanel, setShowReturnPanel] = useState(false);
  const [linkMode, setLinkMode] = useState(false); // Link stereo pairs
  const [showInserts, setShowInserts] = useState(true);
  const [showSends, setShowSends] = useState(true);
  
  // Professional mixer settings
  const sendTypes = [
    { id: 'reverb', name: 'Reverb', color: 'bg-blue-600' },
    { id: 'delay', name: 'Delay', color: 'bg-green-600' },
    { id: 'chorus', name: 'Chorus', color: 'bg-purple-600' },
    { id: 'compressor', name: 'Comp', color: 'bg-orange-600' }
  ];
  
  const [meterPeaks, setMeterPeaks] = useState({});
  const meterIntervalRef = useRef(null);
  
  useEffect(() => {
    // Start metering animation
    meterIntervalRef.current = setInterval(() => {
      updateMeterLevels();
    }, 50);
    
    return () => {
      if (meterIntervalRef.current) {
        clearInterval(meterIntervalRef.current);
      }
    };
  }, [tracks, busses, returns]);
  
  const updateMeterLevels = () => {
    const newPeaks = {};
    
    // Simulate meter peaks (in real implementation, this would come from audio engine)
    [...tracks, ...busses, ...returns].forEach(channel => {
      const peak = Math.random() * 0.8 + Math.random() * 0.2; // Simulated audio level
      newPeaks[channel.id] = {
        left: peak * (0.8 + Math.random() * 0.4),
        right: peak * (0.8 + Math.random() * 0.4),
        peak: Math.max(peak, meterPeaks[channel.id]?.peak || 0) * 0.95 // Peak decay
      };
    });
    
    setMeterPeaks(newPeaks);
  };
  
  const handleVolumeChange = (trackId, value) => {
    const dbValue = value === 0 ? -Infinity : 20 * Math.log10(value);
    updateTrack(trackId, { volume: value, volumeDB: dbValue });
  };
  
  const handlePanChange = (trackId, value) => {
    updateTrack(trackId, { pan: value });
  };
  
  const handleSendChange = (trackId, sendType, value) => {
    updateTrack(trackId, { 
      sends: { 
        ...tracks.find(t => t.id === trackId)?.sends, 
        [sendType]: value 
      } 
    });
  };
  
  const toggleTrackSelection = (trackId) => {
    const newSelection = new Set(selectedTracks);
    if (newSelection.has(trackId)) {
      newSelection.delete(trackId);
    } else {
      newSelection.add(trackId);
    }
    setSelectedTracks(newSelection);
  };
  
  const getMeterColor = (level) => {
    if (level > 0.9) return 'bg-red-500';
    if (level > 0.7) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  const getDBFromLinear = (value) => {
    if (value === 0) return '-inf';
    return (20 * Math.log10(value)).toFixed(1);
  };
  
  const getLinearFromDB = (db) => {
    if (db === -Infinity) return 0;
    return Math.pow(10, db / 20);
  };
  
  return (
    <div className="h-full w-full bg-gray-900 flex flex-col">
      {/* Mixer Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* View Options */}
          <div className="flex items-center space-x-1 bg-gray-700 rounded p-1">
            <button
              onClick={() => setShowInserts(!showInserts)}
              className={`px-2 py-1 rounded text-xs ${showInserts ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
            >
              Inserts
            </button>
            <button
              onClick={() => setShowSends(!showSends)}
              className={`px-2 py-1 rounded text-xs ${showSends ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
            >
              Sends
            </button>
          </div>
          
          {/* Link Mode */}
          <button
            onClick={() => setLinkMode(!linkMode)}
            className={`px-2 py-1 rounded text-xs flex items-center space-x-1 ${linkMode ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <Sliders size={12} />
            <span>Link</span>
          </button>
          
          {/* Bus/Return Panels */}
          <button
            onClick={() => setShowBusPanel(!showBusPanel)}
            className={`px-2 py-1 rounded text-xs ${showBusPanel ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Busses
          </button>
          <button
            onClick={() => setShowReturnPanel(!showReturnPanel)}
            className={`px-2 py-1 rounded text-xs ${showReturnPanel ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            Returns
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => createBus({ type: 'aux' })}
            className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs flex items-center space-x-1"
          >
            <Plus size={12} />
            <span>Bus</span>
          </button>
          <button
            onClick={() => createReturn({})}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs flex items-center space-x-1"
          >
            <Plus size={12} />
            <span>Return</span>
          </button>
        </div>
      </div>
      
      {/* Mixer Channels */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex h-full">
          {/* Track Channels */}
          {[...tracks, ...busses, ...returns].map((channel) => (
            <MixerChannel
              key={channel.id}
              channel={channel}
              channelType={tracks.includes(channel) ? 'track' : busses.includes(channel) ? 'bus' : 'return'}
              selected={selectedTracks.has(channel.id)}
              onSelect={() => toggleTrackSelection(channel.id)}
              onVolumeChange={handleVolumeChange}
              onPanChange={handlePanChange}
              onSendChange={handleSendChange}
              meterData={meterPeaks[channel.id] || { left: 0, right: 0, peak: 0 }}
              showInserts={showInserts}
              showSends={showSends}
              sendTypes={sendTypes}
            />
          ))}
          
          {/* Master Channel */}
          <MasterChannel meterData={meterPeaks['master'] || { left: 0, right: 0, peak: 0 }} />
        </div>
      </div>
    </div>
  );
};

const MixerChannel = ({ 
  channel, 
  channelType, 
  selected, 
  onSelect, 
  onVolumeChange, 
  onPanChange, 
  onSendChange, 
  meterData, 
  showInserts, 
  showSends, 
  sendTypes 
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const getChannelColor = () => {
    switch (channelType) {
      case 'track': return 'bg-gray-700';
      case 'bus': return 'bg-blue-700';
      case 'return': return 'bg-purple-700';
      default: return 'bg-gray-700';
    }
  };
  
  return (
    <div className={`flex-shrink-0 w-20 border-r border-gray-700 flex flex-col ${selected ? 'bg-blue-900' : ''}`}>
      {/* Channel Header */}
      <div className={`${getChannelColor()} p-1 border-b border-gray-600`}>
        <input
          type="text"
          value={channel.name}
          onChange={(e) => {/* Update channel name */}}
          className="w-full bg-transparent text-white text-xs text-center border-b border-transparent hover:border-gray-500 focus:border-blue-500 focus:outline-none px-1"
        />
      </div>
      
      {/* Insert Slots */}
      {showInserts && (
        <div className="bg-gray-800 p-1 space-y-1 border-b border-gray-700">
          {[1, 2, 3, 4].map((slot) => (
            <div
              key={slot}
              className="bg-gray-700 rounded h-6 flex items-center justify-center text-xs text-gray-400 hover:bg-gray-600 cursor-pointer"
              onClick={() => {/* Open plugin selector */}}
            >
              +{slot}
            </div>
          ))}
        </div>
      )}
      
      {/* Send Controls */}
      {showSends && channelType === 'track' && (
        <div className="bg-gray-800 p-1 space-y-1 border-b border-gray-700">
          {sendTypes.map((send) => (
            <div key={send.id} className="flex flex-col items-center">
              <div className={`w-2 h-2 ${send.color} rounded-full mb-1`}></div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={channel.sends?.[send.id] || 0}
                onChange={(e) => onSendChange(channel.id, send.id, parseFloat(e.target.value))}
                className="w-full h-8 transform -rotate-90 origin-center"
                style={{ width: '60px', marginTop: '20px', marginBottom: '20px' }}
              />
              <span className="text-xs text-gray-400">{Math.round((channel.sends?.[send.id] || 0) * 100)}%</span>
            </div>
          ))}
        </div>
      )}
      
      {/* EQ Section */}
      <div className="bg-gray-800 p-1 border-b border-gray-700">
        <div className="grid grid-cols-3 gap-1">
          {['Low', 'Mid', 'High'].map((band) => (
            <div key={band} className="text-center">
              <div className="w-8 h-8 bg-gray-700 rounded mb-1 flex items-center justify-center">
                <div className="w-1 h-4 bg-gray-500 rounded"></div>
              </div>
              <span className="text-xs text-gray-400">{band[0]}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Mute/Solo/Record */}
      <div className="bg-gray-800 p-1 space-y-1 border-b border-gray-700">
        <button
          onClick={() => {/* Toggle mute */}}
          className={`w-full px-1 py-1 text-xs rounded ${channel.muted ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          M
        </button>
        <button
          onClick={() => {/* Toggle solo */}}
          className={`w-full px-1 py-1 text-xs rounded ${channel.solo ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          S
        </button>
        {channelType === 'track' && (
          <button
            onClick={() => {/* Toggle record */}}
            className={`w-full px-1 py-1 text-xs rounded ${channel.recordArmed ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            R
          </button>
        )}
      </div>
      
      {/* Pan Control */}
      <div className="bg-gray-800 p-1 border-b border-gray-700">
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-400 mb-1">Pan</span>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={channel.pan || 0}
            onChange={(e) => onPanChange(channel.id, parseFloat(e.target.value))}
            className="w-16 h-1"
          />
          <span className="text-xs text-gray-400 mt-1">{Math.round((channel.pan || 0) * 100)}</span>
        </div>
      </div>
      
      {/* Volume Fader */}
      <div className="flex-1 bg-gray-800 p-1 flex flex-col items-center justify-end">
        <span className="text-xs text-gray-400 mb-1">
          {channel.volume !== undefined ? getDBFromLinear(channel.volume) : '0.0'}
        </span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={channel.volume || 0.8}
          onChange={(e) => onVolumeChange(channel.id, parseFloat(e.target.value))}
          className="h-32 transform -rotate-90 origin-center"
          style={{ width: '120px', marginBottom: '60px' }}
        />
      </div>
      
      {/* Meter */}
      <div className="bg-gray-800 p-1 border-t border-gray-700">
        <div className="flex space-x-1">
          {/* Left Channel */}
          <div className="flex-1 bg-gray-900 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-50 ${getMeterColor(meterData.left)}`}
              style={{ height: `${meterData.left * 100}%` }}
            ></div>
          </div>
          {/* Right Channel */}
          <div className="flex-1 bg-gray-900 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-50 ${getMeterColor(meterData.right)}`}
              style={{ height: `${meterData.right * 100}%` }}
            ></div>
          </div>
        </div>
        {/* Peak Hold */}
        <div className="flex space-x-1 mt-1">
          <div className="flex-1 h-0.5 bg-gray-900 rounded overflow-hidden">
            <div
              className={`h-full ${getMeterColor(meterData.peak)}`}
              style={{ width: `${meterData.peak * 100}%` }}
            ></div>
          </div>
          <div className="flex-1 h-0.5 bg-gray-900 rounded overflow-hidden">
            <div
              className={`h-full ${getMeterColor(meterData.peak)}`}
              style={{ width: `${meterData.peak * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MasterChannel = ({ meterData }) => {
  return (
    <div className="flex-shrink-0 w-24 border-l-2 border-red-600 flex flex-col bg-gray-800">
      {/* Master Header */}
      <div className="bg-red-700 p-2 border-b border-gray-600">
        <div className="text-white text-sm font-bold text-center">MASTER</div>
      </div>
      
      {/* Master Output */}
      <div className="flex-1 p-2 flex flex-col items-center justify-end">
        <div className="text-xs text-gray-400 mb-2">Output</div>
        
        {/* Stereo Meter */}
        <div className="w-full h-32 bg-gray-900 rounded p-1 mb-4">
          <div className="flex h-full space-x-1">
            {/* Left Meter */}
            <div className="flex-1 bg-gray-800 rounded overflow-hidden relative">
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-50"
                style={{ height: `${meterData.left * 100}%` }}
              ></div>
              {/* Peak indicators */}
              <div className="absolute top-0 w-full h-1 bg-red-500 opacity-50"></div>
              <div className="absolute top-2 w-full h-0.5 bg-yellow-500 opacity-50"></div>
              <div className="absolute top-4 w-full h-0.5 bg-green-500 opacity-50"></div>
            </div>
            {/* Right Meter */}
            <div className="flex-1 bg-gray-800 rounded overflow-hidden relative">
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all duration-50"
                style={{ height: `${meterData.right * 100}%` }}
              ></div>
              {/* Peak indicators */}
              <div className="absolute top-0 w-full h-1 bg-red-500 opacity-50"></div>
              <div className="absolute top-2 w-full h-0.5 bg-yellow-500 opacity-50"></div>
              <div className="absolute top-4 w-full h-0.5 bg-green-500 opacity-50"></div>
            </div>
          </div>
        </div>
        
        {/* Master Volume */}
        <div className="w-full">
          <div className="text-xs text-gray-400 text-center mb-1">0.0 dB</div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            defaultValue="0.8"
            className="w-full h-2"
          />
        </div>
      </div>
      
      {/* Master Controls */}
      <div className="p-2 border-t border-gray-700">
        <div className="flex space-x-2">
          <button className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs">
            Mute
          </button>
          <button className="flex-1 px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs">
            Mono
          </button>
        </div>
      </div>
    </div>
  );
};

const getDBFromLinear = (value) => {
  if (value === 0) return '-inf';
  return (20 * Math.log10(value)).toFixed(1);
};

export default ProMixer;
