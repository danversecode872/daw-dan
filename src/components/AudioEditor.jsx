import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Scissors, Move, Copy, Trash2, Volume2, Clock, Zap, Layers } from 'lucide-react';
import useProjectStore from '../stores/projectStore';

const AudioEditor = () => {
  const canvasRef = useRef(null);
  const waveformRef = useRef(null);
  const [selectedClip, setSelectedClip] = useState(null);
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [currentTool, setCurrentTool] = useState('select'); // select, cut, copy, fade, timeStretch
  const [zoomLevel, setZoomLevel] = useState(1);
  const [playheadPosition, setPlayheadPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState(null);
  const [fadeType, setFadeType] = useState('linear'); // linear, exponential, logarithmic, s-curve
  const [timeStretchMode, setTimeStretchMode] = useState('pitch'); // pitch, formant, granular
  
  const { tracks, bpm } = useProjectStore();
  
  // Audio editing parameters
  const pixelsPerSecond = 100 * zoomLevel;
  const sampleRate = 44100;
  
  useEffect(() => {
    if (selectedClip) {
      loadWaveform(selectedClip);
    }
  }, [selectedClip, zoomLevel]);
  
  useEffect(() => {
    drawAudioEditor();
  }, [waveformData, selectionStart, selectionEnd, playheadPosition, zoomLevel]);
  
  const loadWaveform = async (clip) => {
    // Generate waveform data (in real implementation, this would decode audio file)
    const waveform = generateWaveformData(clip);
    setWaveformData(waveform);
  };
  
  const generateWaveformData = (clip) => {
    // Generate mock waveform data for demonstration
    const duration = clip.duration || 4; // seconds
    const samples = Math.floor(duration * sampleRate);
    const waveform = {
      peaks: [],
      rms: [],
      duration,
      sampleRate
    };
    
    // Generate peak data (simplified)
    const peakResolution = 1000; // 1000 points per second
    const peakCount = Math.floor(duration * peakResolution);
    
    for (let i = 0; i < peakCount; i++) {
      const time = i / peakResolution;
      const amplitude = Math.sin(time * Math.PI * 2 * 440 / sampleRate) * 
                       (0.5 + Math.random() * 0.5) * 
                       Math.exp(-time * 0.1); // Decay envelope
      
      waveform.peaks.push({
        time,
        max: amplitude,
        min: -amplitude
      });
      
      waveform.rms.push(amplitude * 0.707); // RMS approximation
    }
    
    return waveform;
  };
  
  const drawAudioEditor = () => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    drawGrid(ctx, width, height);
    
    // Draw waveform
    drawWaveform(ctx, width, height);
    
    // Draw selection
    if (selectionStart !== null && selectionEnd !== null) {
      drawSelection(ctx, width, height);
    }
    
    // Draw fades
    drawFades(ctx, width, height);
    
    // Draw playhead
    drawPlayhead(ctx, width, height);
  };
  
  const drawGrid = (ctx, width, height) => {
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    // Vertical grid lines (time)
    const gridInterval = pixelsPerSecond; // 1 second intervals
    for (let x = 0; x < width; x += gridInterval) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal grid lines (amplitude)
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Center line (0 dB)
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
  };
  
  const drawWaveform = (ctx, width, height) => {
    if (!waveformData || !waveformData.peaks) return;
    
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 1;
    
    // Draw waveform peaks
    ctx.beginPath();
    waveformData.peaks.forEach((peak, index) => {
      const x = (peak.time / waveformData.duration) * width;
      const yMax = height / 2 - (peak.max * height / 2);
      const yMin = height / 2 - (peak.min * height / 2);
      
      if (index === 0) {
        ctx.moveTo(x, yMax);
      } else {
        ctx.lineTo(x, yMax);
      }
    });
    
    // Draw bottom half
    for (let i = waveformData.peaks.length - 1; i >= 0; i--) {
      const peak = waveformData.peaks[i];
      const x = (peak.time / waveformData.duration) * width;
      const yMin = height / 2 - (peak.min * height / 2);
      ctx.lineTo(x, yMin);
    }
    
    ctx.closePath();
    ctx.fillStyle = 'rgba(96, 165, 250, 0.3)';
    ctx.fill();
    ctx.stroke();
  };
  
  const drawSelection = (ctx, width, height) => {
    const startX = timeToX(selectionStart, width);
    const endX = timeToX(selectionEnd, width);
    
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.fillRect(startX, 0, endX - startX, height);
    
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, 0, endX - startX, height);
  };
  
  const drawFades = (ctx, width, height) => {
    if (!selectedClip || !selectedClip.fades) return;
    
    const { fadeIn, fadeOut } = selectedClip.fades;
    
    // Draw fade in
    if (fadeIn && fadeIn.duration > 0) {
      const fadeEndX = timeToX(fadeIn.duration, width);
      
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(fadeEndX, 0);
      ctx.stroke();
      
      // Fade area
      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(fadeEndX, 0);
      ctx.lineTo(fadeEndX, height);
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw fade out
    if (fadeOut && fadeOut.duration > 0) {
      const clipDuration = selectedClip.duration;
      const fadeStartX = timeToX(clipDuration - fadeOut.duration, width);
      const clipEndX = timeToX(clipDuration, width);
      
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(fadeStartX, 0);
      ctx.lineTo(clipEndX, height);
      ctx.stroke();
      
      // Fade area
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.beginPath();
      ctx.moveTo(fadeStartX, 0);
      ctx.lineTo(clipEndX, height);
      ctx.lineTo(fadeStartX, height);
      ctx.closePath();
      ctx.fill();
    }
  };
  
  const drawPlayhead = (ctx, width, height) => {
    const x = timeToX(playheadPosition, width);
    
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  };
  
  const timeToX = (time, width) => {
    return (time / (selectedClip?.duration || 4)) * width;
  };
  
  const xToTime = (x, width) => {
    return (x / width) * (selectedClip?.duration || 4);
  };
  
  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = xToTime(x, canvas.width);
    
    if (currentTool === 'select') {
      setSelectionStart(time);
      setSelectionEnd(time);
    } else if (currentTool === 'cut') {
      if (selectionStart !== null && selectionEnd !== null) {
        cutSelection();
      }
    } else if (currentTool === 'fade') {
      // Apply fade to selection
      applyFadeToSelection();
    }
  };
  
  const handleCanvasMouseMove = (e) => {
    if (currentTool === 'select' && selectionStart !== null) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const time = xToTime(x, canvas.width);
      
      setSelectionEnd(time);
    }
  };
  
  const handleCanvasMouseUp = () => {
    // Finalize selection
    if (currentTool === 'select' && selectionStart !== null && selectionEnd !== null) {
      // Ensure selection start is before end
      if (selectionStart > selectionEnd) {
        setSelectionStart(selectionEnd);
        setSelectionEnd(selectionStart);
      }
    }
  };
  
  const cutSelection = () => {
    if (!selectedClip || selectionStart === null || selectionEnd === null) return;
    
    console.log('Cut selection:', { start: selectionStart, end: selectionEnd });
    // This would implement actual audio cutting logic
    
    // Clear selection
    setSelectionStart(null);
    setSelectionEnd(null);
  };
  
  const copySelection = () => {
    if (!selectedClip || selectionStart === null || selectionEnd === null) return;
    
    console.log('Copy selection:', { start: selectionStart, end: selectionEnd });
    // This would implement actual audio copying logic
  };
  
  const pasteSelection = () => {
    console.log('Paste at position:', playheadPosition);
    // This would implement actual audio pasting logic
  };
  
  const deleteSelection = () => {
    if (!selectedClip || selectionStart === null || selectionEnd === null) return;
    
    console.log('Delete selection:', { start: selectionStart, end: selectionEnd });
    // This would implement actual audio deletion logic
    
    setSelectionStart(null);
    setSelectionEnd(null);
  };
  
  const applyFadeToSelection = () => {
    if (!selectedClip || selectionStart === null || selectionEnd === null) return;
    
    const fadeDuration = selectionEnd - selectionStart;
    
    // Determine if this is fade in or fade out
    if (selectionStart < 0.1) { // Near start = fade in
      selectedClip.fades = {
        ...selectedClip.fades,
        fadeIn: {
          duration: fadeDuration,
          type: fadeType
        }
      };
    } else if (selectionEnd > selectedClip.duration - 0.1) { // Near end = fade out
      selectedClip.fades = {
        ...selectedClip.fades,
        fadeOut: {
          duration: fadeDuration,
          type: fadeType
        }
      };
    }
    
    console.log('Applied fade:', { duration: fadeDuration, type: fadeType });
  };
  
  const applyTimeStretch = (ratio) => {
    if (!selectedClip) return;
    
    console.log('Time stretching by ratio:', ratio);
    // This would implement actual time stretching algorithm
    
    switch (timeStretchMode) {
      case 'pitch':
        // Pitch-corrected time stretch
        break;
      case 'formant':
        // Formant-preserving time stretch
        break;
      case 'granular':
        // Granular time stretch
        break;
    }
  };
  
  const normalizeAudio = () => {
    if (!selectedClip) return;
    
    console.log('Normalizing audio');
    // This would implement audio normalization
  };
  
  const reverseAudio = () => {
    if (!selectedClip) return;
    
    console.log('Reversing audio');
    // This would implement audio reversal
  };
  
  return (
    <div className="h-full w-full bg-gray-900 flex flex-col">
      {/* Audio Editor Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Tool Selection */}
          <div className="flex items-center space-x-1 bg-gray-700 rounded p-1">
            <button
              onClick={() => setCurrentTool('select')}
              className={`p-1 rounded ${currentTool === 'select' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
              title="Select Tool"
            >
              <Move size={14} />
            </button>
            <button
              onClick={() => setCurrentTool('cut')}
              className={`p-1 rounded ${currentTool === 'cut' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
              title="Cut Tool"
            >
              <Scissors size={14} />
            </button>
            <button
              onClick={() => setCurrentTool('copy')}
              className={`p-1 rounded ${currentTool === 'copy' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
              title="Copy Tool"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={() => setCurrentTool('fade')}
              className={`p-1 rounded ${currentTool === 'fade' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
              title="Fade Tool"
            >
              <Volume2 size={14} />
            </button>
          </div>
          
          {/* Edit Operations */}
          <div className="flex items-center space-x-1">
            <button
              onClick={cutSelection}
              disabled={selectionStart === null}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs disabled:bg-gray-600 disabled:opacity-50"
            >
              Cut
            </button>
            <button
              onClick={copySelection}
              disabled={selectionStart === null}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs disabled:bg-gray-600 disabled:opacity-50"
            >
              Copy
            </button>
            <button
              onClick={pasteSelection}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            >
              Paste
            </button>
            <button
              onClick={deleteSelection}
              disabled={selectionStart === null}
              className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs disabled:bg-gray-600 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
          
          {/* Fade Controls */}
          <div className="flex items-center space-x-1">
            <select
              value={fadeType}
              onChange={(e) => setFadeType(e.target.value)}
              className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
            >
              <option value="linear">Linear</option>
              <option value="exponential">Exponential</option>
              <option value="logarithmic">Logarithmic</option>
              <option value="s-curve">S-Curve</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Time Stretch */}
          <div className="flex items-center space-x-1">
            <select
              value={timeStretchMode}
              onChange={(e) => setTimeStretchMode(e.target.value)}
              className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
            >
              <option value="pitch">Pitch Correct</option>
              <option value="formant">Formant Preserve</option>
              <option value="granular">Granular</option>
            </select>
            <button
              onClick={() => applyTimeStretch(0.5)}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            >
              50%
            </button>
            <button
              onClick={() => applyTimeStretch(0.75)}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            >
              75%
            </button>
            <button
              onClick={() => applyTimeStretch(1.25)}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            >
              125%
            </button>
            <button
              onClick={() => applyTimeStretch(1.5)}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            >
              150%
            </button>
          </div>
          
          {/* Audio Processing */}
          <div className="flex items-center space-x-1">
            <button
              onClick={normalizeAudio}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            >
              Normalize
            </button>
            <button
              onClick={reverseAudio}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            >
              Reverse
            </button>
          </div>
          
          {/* Zoom */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setZoomLevel(Math.max(0.25, zoomLevel * 0.5))}
              className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
            >
              Zoom -
            </button>
            <span className="text-xs text-gray-400">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(4, zoomLevel * 2))}
              className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
            >
              Zoom +
            </button>
          </div>
        </div>
      </div>
      
      {/* Waveform Display */}
      <div className="flex-1 overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={1200}
          height={300}
          className="cursor-crosshair"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        />
        
        {/* Selection Info */}
        {selectionStart !== null && selectionEnd !== null && (
          <div className="absolute top-2 left-2 bg-gray-800 rounded p-2 text-xs">
            <div>Selection: {selectionStart.toFixed(3)}s - {selectionEnd.toFixed(3)}s</div>
            <div>Duration: {(selectionEnd - selectionStart).toFixed(3)}s</div>
          </div>
        )}
        
        {/* Clip Info */}
        {selectedClip && (
          <div className="absolute top-2 right-2 bg-gray-800 rounded p-2 text-xs">
            <div>Clip: {selectedClip.name || 'Audio Clip'}</div>
            <div>Duration: {selectedClip.duration?.toFixed(3)}s</div>
            <div>Sample Rate: {waveformData?.sampleRate}Hz</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioEditor;
