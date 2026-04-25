import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Film, Play, Pause, SkipBack, SkipForward, Volume2, Settings, Clock, Music } from 'lucide-react';
import useProjectStore from '../stores/projectStore';

const VideoScorer = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [syncOffset, setSyncOffset] = useState(0); // Video sync offset in seconds
  const [timecodeFormat, setTimecodeFormat] = useState('SMPTE'); // SMPTE, frames, seconds
  const [frameRate, setFrameRate] = useState(29.97); // Video frame rate
  const [showVideo, setShowVideo] = useState(true);
  const [showWaveform, setShowWaveform] = useState(true);
  const [cuePoints, setCuePoints] = useState([]);
  const [selectedCue, setSelectedCue] = useState(null);
  
  const { tracks, bpm } = useProjectStore();
  
  // Video scoring constants
  const VIDEO_HEIGHT = 360;
  const WAVEFORM_HEIGHT = 100;
  const TIMELINE_HEIGHT = 60;
  
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleTimeUpdate = () => {
        setCurrentTime(video.currentTime - syncOffset);
      };
      
      const handleLoadedMetadata = () => {
        setDuration(video.duration);
        setVideoLoaded(true);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
      };
      
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('ended', handleEnded);
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('ended', handleEnded);
      };
    }
  }, [syncOffset]);
  
  useEffect(() => {
    drawTimeline();
  }, [currentTime, duration, cuePoints, frameRate, timecodeFormat]);
  
  const handleVideoFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setVideoFile(url);
      
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.load();
      }
    }
  };
  
  const togglePlayback = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const seekTo = (time) => {
    if (!videoRef.current) return;
    
    const adjustedTime = Math.max(0, Math.min(duration, time + syncOffset));
    videoRef.current.currentTime = adjustedTime;
    setCurrentTime(time);
  };
  
  const skipToCue = (cueTime) => {
    seekTo(cueTime);
  };
  
  const addCuePoint = () => {
    const newCue = {
      id: Date.now(),
      time: currentTime,
      name: `Cue ${cuePoints.length + 1}`,
      description: '',
      color: '#3b82f6',
      type: 'marker' // marker, hit, transition
    };
    
    setCuePoints([...cuePoints, newCue].sort((a, b) => a.time - b.time));
  };
  
  const deleteCuePoint = (cueId) => {
    setCuePoints(cuePoints.filter(cue => cue.id !== cueId));
    if (selectedCue === cueId) {
      setSelectedCue(null);
    }
  };
  
  const updateCuePoint = (cueId, updates) => {
    setCuePoints(cuePoints.map(cue => 
      cue.id === cueId ? { ...cue, ...updates } : cue
    ));
  };
  
  const formatTimecode = (time) => {
    switch (timecodeFormat) {
      case 'SMPTE':
        return formatSMPTE(time);
      case 'frames':
        return formatFrames(time);
      case 'seconds':
        return formatSeconds(time);
      default:
        return formatSeconds(time);
    }
  };
  
  const formatSMPTE = (time) => {
    const frames = Math.floor(time * frameRate);
    const seconds = Math.floor(time);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    const frameNum = frames % Math.floor(frameRate);
    const secNum = seconds % 60;
    const minNum = minutes % 60;
    const hourNum = hours;
    
    return `${hourNum.toString().padStart(2, '0')}:${minNum.toString().padStart(2, '0')}:${secNum.toString().padStart(2, '0')}:${frameNum.toString().padStart(2, '0')}`;
  };
  
  const formatFrames = (time) => {
    const frames = Math.floor(time * frameRate);
    return `Frame ${frames}`;
  };
  
  const formatSeconds = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = (time % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  };
  
  const drawTimeline = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw time ruler
    drawTimeRuler(ctx, width, height);
    
    // Draw cue points
    drawCuePoints(ctx, width, height);
    
    // Draw playhead
    drawPlayhead(ctx, width, height);
  };
  
  const drawTimeRuler = (ctx, width, height) => {
    ctx.strokeStyle = '#4b5563';
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px monospace';
    
    const pixelsPerSecond = width / duration;
    const majorInterval = timecodeFormat === 'frames' ? frameRate : 1;
    
    // Draw major ticks
    for (let time = 0; time <= duration; time += majorInterval) {
      const x = time * pixelsPerSecond;
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
      
      // Draw timecode
      if (timecodeFormat === 'frames') {
        ctx.fillText(formatFrames(time), x + 2, 12);
      } else {
        ctx.fillText(formatTimecode(time), x + 2, 12);
      }
    }
    
    // Draw minor ticks
    if (timecodeFormat !== 'frames') {
      ctx.strokeStyle = '#374151';
      for (let time = 0; time <= duration; time += 0.25) {
        const x = time * pixelsPerSecond;
        ctx.beginPath();
        ctx.moveTo(x, height - 5);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }
  };
  
  const drawCuePoints = (ctx, width, height) => {
    const pixelsPerSecond = width / duration;
    
    cuePoints.forEach(cue => {
      const x = cue.time * pixelsPerSecond;
      
      // Draw cue marker
      ctx.fillStyle = cue.color;
      ctx.beginPath();
      ctx.moveTo(x, 15);
      ctx.lineTo(x - 5, 5);
      ctx.lineTo(x + 5, 5);
      ctx.closePath();
      ctx.fill();
      
      // Draw cue label
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px sans-serif';
      ctx.fillText(cue.name, x + 8, 12);
      
      // Highlight selected cue
      if (selectedCue === cue.id) {
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    });
  };
  
  const drawPlayhead = (ctx, width, height) => {
    const pixelsPerSecond = width / duration;
    const x = currentTime * pixelsPerSecond;
    
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  };
  
  const handleTimelineClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const time = (x / canvas.width) * duration;
    
    seekTo(time);
  };
  
  const exportCueSheet = () => {
    const cueSheet = {
      title: 'Video Cue Sheet',
      videoFile: videoFile ? videoFile.split('/').pop() : 'None',
      duration,
      frameRate,
      syncOffset,
      cuePoints: cuePoints.map(cue => ({
        ...cue,
        timecode: formatTimecode(cue.time)
      }))
    };
    
    console.log('Exporting cue sheet:', cueSheet);
    // This would download a JSON or CSV file
  };
  
  const importCueSheet = () => {
    console.log('Import cue sheet dialog');
    // This would open a file dialog and parse cue sheet data
  };
  
  const calculateHitPoints = () => {
    // Analyze audio to find hit points that sync with video
    console.log('Calculating hit points...');
    // This would use audio analysis to find transients and beats
  };
  
  return (
    <div className="h-full w-full bg-gray-900 text-white flex flex-col">
      {/* Video Scorer Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Film size={20} />
          <h2 className="text-lg font-semibold">Video Scorer</h2>
          
          {/* Video File Selection */}
          <input
            type="file"
            accept="video/*"
            onChange={handleVideoFileSelect}
            className="hidden"
            id="videoFileInput"
          />
          <label
            htmlFor="videoFileInput"
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm cursor-pointer"
          >
            Load Video
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Timecode Format */}
          <select
            value={timecodeFormat}
            onChange={(e) => setTimecodeFormat(e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
          >
            <option value="SMPTE">SMPTE</option>
            <option value="frames">Frames</option>
            <option value="seconds">Seconds</option>
          </select>
          
          {/* Frame Rate */}
          <select
            value={frameRate}
            onChange={(e) => setFrameRate(parseFloat(e.target.value))}
            className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
          >
            <option value="23.976">23.976 fps</option>
            <option value="24">24 fps</option>
            <option value="25">25 fps</option>
            <option value="29.97">29.97 fps</option>
            <option value="30">30 fps</option>
            <option value="60">60 fps</option>
          </select>
          
          {/* Sync Offset */}
          <div className="flex items-center space-x-1">
            <label className="text-xs">Offset:</label>
            <input
              type="number"
              value={syncOffset}
              onChange={(e) => setSyncOffset(parseFloat(e.target.value))}
              className="bg-gray-700 text-white px-2 py-1 rounded text-xs w-16"
              step="0.01"
            />
            <span className="text-xs text-gray-400">s</span>
          </div>
        </div>
      </div>
      
      {/* Video Display Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Video Player */}
        {showVideo && videoFile && (
          <div className="relative bg-black" style={{ height: VIDEO_HEIGHT }}>
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              controls={false}
            />
            
            {/* Video Overlay Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={togglePlayback}
                    className="p-1 bg-white/20 hover:bg-white/30 rounded"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  
                  <button
                    onClick={() => skipToCue(Math.max(0, currentTime - 1))}
                    className="p-1 bg-white/20 hover:bg-white/30 rounded"
                  >
                    <SkipBack size={16} />
                  </button>
                  
                  <button
                    onClick={() => skipToCue(Math.min(duration, currentTime + 1))}
                    className="p-1 bg-white/20 hover:bg-white/30 rounded"
                  >
                    <SkipForward size={16} />
                  </button>
                </div>
                
                <div className="text-sm font-mono">
                  {formatTimecode(currentTime)} / {formatTimecode(duration)}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Timeline */}
        <div className="bg-gray-800 border-t border-gray-700">
          <canvas
            ref={canvasRef}
            width={1200}
            height={TIMELINE_HEIGHT}
            className="w-full cursor-pointer"
            onClick={handleTimelineClick}
          />
        </div>
        
        {/* Cue Points Panel */}
        <div className="flex-1 flex">
          {/* Cue Points List */}
          <div className="w-1/2 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center space-x-2">
                <Music size={16} />
                <span>Cue Points</span>
              </h3>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={addCuePoint}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                >
                  Add Cue
                </button>
                
                <button
                  onClick={calculateHitPoints}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                >
                  Auto Hit Points
                </button>
              </div>
            </div>
            
            {cuePoints.length === 0 ? (
              <div className="text-gray-400 text-sm">No cue points added</div>
            ) : (
              <div className="space-y-2">
                {cuePoints.map(cue => (
                  <div
                    key={cue.id}
                    className={`bg-gray-700 rounded p-2 cursor-pointer ${
                      selectedCue === cue.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedCue(cue.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: cue.color }}
                        ></div>
                        <span className="font-medium">{cue.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-400">
                          {formatTimecode(cue.time)}
                        </span>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCuePoint(cue.id);
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    
                    {cue.description && (
                      <div className="text-xs text-gray-400 mt-1">
                        {cue.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Cue Point Editor */}
          <div className="w-1/2 bg-gray-850 p-4">
            {selectedCue ? (
              <div className="space-y-4">
                <h3 className="font-semibold">Edit Cue Point</h3>
                
                {(() => {
                  const cue = cuePoints.find(c => c.id === selectedCue);
                  if (!cue) return null;
                  
                  return (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-1">Name</label>
                        <input
                          type="text"
                          value={cue.name}
                          onChange={(e) => updateCuePoint(cue.id, { name: e.target.value })}
                          className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Time</label>
                        <input
                          type="text"
                          value={formatTimecode(cue.time)}
                          onChange={(e) => {
                            // Parse timecode back to seconds
                            const parts = e.target.value.split(':');
                            let time = 0;
                            
                            if (timecodeFormat === 'SMPTE' && parts.length === 4) {
                              const [hours, minutes, seconds, frames] = parts.map(Number);
                                      time = hours * 3600 + minutes * 60 + seconds + frames / frameRate;
                                    } else if (parts.length === 2) {
                                      const [minutes, seconds] = parts.map(Number);
                                      time = minutes * 60 + seconds;
                                    }
                                    
                            updateCuePoint(cue.id, { time });
                          }}
                          className="w-full bg-gray-700 text-white px-3 py-2 rounded font-mono"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <select
                          value={cue.type}
                          onChange={(e) => updateCuePoint(cue.id, { type: e.target.value })}
                          className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                        >
                          <option value="marker">Marker</option>
                          <option value="hit">Hit Point</option>
                          <option value="transition">Transition</option>
                          <option value="scene">Scene Change</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Color</label>
                        <input
                          type="color"
                          value={cue.color}
                          onChange={(e) => updateCuePoint(cue.id, { color: e.target.value })}
                          className="w-full h-10 bg-gray-700 rounded cursor-pointer"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                          value={cue.description || ''}
                          onChange={(e) => updateCuePoint(cue.id, { description: e.target.value })}
                          className="w-full bg-gray-700 text-white px-3 py-2 rounded h-20 resize-none"
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => skipToCue(cue.time)}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                        >
                          Go to Cue
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="text-gray-400 text-center mt-8">
                Select a cue point to edit
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Video Scorer Footer */}
      <div className="bg-gray-800 border-t border-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-sm">
          <span>Duration: {formatTimecode(duration)}</span>
          <span>Cues: {cuePoints.length}</span>
          <span>FPS: {frameRate}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={importCueSheet}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
          >
            Import Cues
          </button>
          
          <button
            onClick={exportCueSheet}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
          >
            Export Cues
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoScorer;
