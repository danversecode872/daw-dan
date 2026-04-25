import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Piano, Play, Pause, Grid, Snap, Music, Edit3 } from 'lucide-react';
import useProjectStore from '../stores/projectStore';

const PianoRoll = () => {
  const canvasRef = useRef(null);
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartNote, setDrawStartNote] = useState(null);
  const [currentTool, setCurrentTool] = useState('pencil'); // pencil, eraser, select, razor
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridResolution, setGridResolution] = useState('1/16'); // 1/4, 1/8, 1/16, 1/32
  const [zoomLevel, setZoomLevel] = useState(1);
  const [velocity, setVelocity] = useState(80);
  const [quantizeEnabled, setQuantizeEnabled] = useState(true);
  
  const { currentProject, tracks, bpm } = useProjectStore();
  
  // Piano roll dimensions
  const pianoKeys = 128; // MIDI standard
  const keyHeight = 12;
  const pixelsPerBeat = 60 * zoomLevel;
  const beatsPerBar = 4; // 4/4 time signature
  
  // Note frequencies and positions
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const whiteKeys = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
  
  useEffect(() => {
    drawPianoRoll();
  }, [tracks, zoomLevel, snapToGrid, gridResolution, selectedNotes]);
  
  const drawPianoRoll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw piano keys
    drawPianoKeys(ctx, width, height);
    
    // Draw grid
    drawGrid(ctx, width, height);
    
    // Draw notes
    drawNotes(ctx, width, height);
    
    // Draw playhead
    drawPlayhead(ctx, width, height);
  };
  
  const drawPianoKeys = (ctx, width, height) => {
    const pianoWidth = 60;
    
    for (let i = 0; i < pianoKeys; i++) {
      const y = i * keyHeight;
      const noteIndex = i % 12;
      const isWhiteKey = whiteKeys.includes(noteIndex);
      
      if (y < height) {
        // Draw key
        ctx.fillStyle = isWhiteKey ? '#2d2d2d' : '#1a1a1a';
        ctx.fillRect(0, y, pianoWidth, keyHeight);
        
        // Draw key border
        ctx.strokeStyle = '#404040';
        ctx.strokeRect(0, y, pianoWidth, keyHeight);
        
        // Draw note name for C notes
        if (noteIndex === 0 && i < 10) {
          ctx.fillStyle = '#666';
          ctx.font = '10px monospace';
          const octave = Math.floor(i / 12);
          ctx.fillText(`C${octave}`, 5, y + keyHeight - 2);
        }
      }
    }
  };
  
  const drawGrid = (ctx, width, height) => {
    const pianoWidth = 60;
    const gridWidth = width - pianoWidth;
    
    // Calculate grid spacing based on resolution
    const beatsPerGrid = getBeatsPerGrid(gridResolution);
    const gridSpacing = pixelsPerBeat * beatsPerGrid;
    
    // Draw vertical grid lines (time)
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    for (let x = pianoWidth; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Draw bar lines (thicker)
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2;
    
    for (let bar = 0; bar < 16; bar++) {
      const x = pianoWidth + (bar * beatsPerBar * pixelsPerBeat);
      if (x < width) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }
    
    // Draw horizontal lines (notes)
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < pianoKeys; i++) {
      const y = i * keyHeight;
      if (y < height) {
        ctx.beginPath();
        ctx.moveTo(pianoWidth, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
  };
  
  const drawNotes = (ctx, width, height) => {
    const pianoWidth = 60;
    
    tracks.forEach(track => {
      if (track.type === 'midi') {
        track.clips.forEach(clip => {
          clip.notes?.forEach(note => {
            const x = pianoWidth + (note.startTime * pixelsPerBeat);
            const noteWidth = note.duration * pixelsPerBeat;
            const y = (127 - note.midiNote) * keyHeight; // Invert for proper piano layout
            
            // Note color based on velocity
            const velocityColor = getVelocityColor(note.velocity);
            ctx.fillStyle = velocityColor;
            
            // Draw note rectangle
            ctx.fillRect(x, y, noteWidth, keyHeight - 1);
            
            // Draw note border
            ctx.strokeStyle = selectedNotes.has(note.id) ? '#60a5fa' : '#1f2937';
            ctx.lineWidth = selectedNotes.has(note.id) ? 2 : 1;
            ctx.strokeRect(x, y, noteWidth, keyHeight - 1);
            
            // Draw note velocity indicator
            if (noteWidth > 20) {
              ctx.fillStyle = '#fff';
              ctx.font = '8px monospace';
              ctx.fillText(note.velocity.toString(), x + 2, y + keyHeight - 2);
            }
          });
        });
      }
    });
  };
  
  const drawPlayhead = (ctx, width, height) => {
    // This would get the current playback position from the audio engine
    const currentTime = 0; // Placeholder
    const pianoWidth = 60;
    const playheadX = pianoWidth + (currentTime * pixelsPerBeat);
    
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  };
  
  const getVelocityColor = (velocity) => {
    // Color gradient based on velocity (0-127)
    const intensity = velocity / 127;
    const r = Math.floor(59 + intensity * (147 - 59));
    const g = Math.floor(130 + intensity * (197 - 130));
    const b = Math.floor(246 - intensity * (246 - 125));
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  const getBeatsPerGrid = (resolution) => {
    switch (resolution) {
      case '1/4': return 1;
      case '1/8': return 0.5;
      case '1/16': return 0.25;
      case '1/32': return 0.125;
      default: return 0.25;
    }
  };
  
  const snapToGridValue = (value) => {
    if (!snapToGrid) return value;
    
    const beatsPerGrid = getBeatsPerGrid(gridResolution);
    const gridSpacing = beatsPerGrid;
    return Math.round(value / gridSpacing) * gridSpacing;
  };
  
  const getNoteFromPosition = (x, y) => {
    const pianoWidth = 60;
    const time = (x - pianoWidth) / pixelsPerBeat;
    const midiNote = 127 - Math.floor(y / keyHeight);
    
    return {
      time: snapToGridValue(Math.max(0, time)),
      midiNote: Math.max(0, Math.min(127, midiNote))
    };
  };
  
  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (currentTool === 'pencil') {
      setIsDrawing(true);
      const note = getNoteFromPosition(x, y);
      setDrawStartNote(note);
      
      // Create new note
      const newNote = {
        id: Date.now(),
        startTime: note.time,
        duration: 0.25, // Default 1/4 note
        midiNote: note.midiNote,
        velocity: velocity
      };
      
      // Add note to current MIDI track
      // This would integrate with the project store
      console.log('Creating note:', newNote);
      
    } else if (currentTool === 'eraser') {
      // Find and delete note at position
      const note = getNoteFromPosition(x, y);
      console.log('Erasing note at:', note);
      
    } else if (currentTool === 'select') {
      // Select note at position
      const note = getNoteFromPosition(x, y);
      console.log('Selecting note at:', note);
    }
  };
  
  const handleCanvasMouseMove = (e) => {
    if (!isDrawing || currentTool !== 'pencil') return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const note = getNoteFromPosition(x, y);
    
    // Update note duration as we drag
    if (drawStartNote) {
      const duration = Math.max(0.0625, note.time - drawStartNote.time); // Minimum 1/64 note
      console.log('Note duration:', duration);
    }
  };
  
  const handleCanvasMouseUp = () => {
    setIsDrawing(false);
    setDrawStartNote(null);
  };
  
  const handleCanvasDoubleClick = (e) => {
    // Open note editor on double click
    console.log('Open note editor');
  };
  
  const quantizeNotes = () => {
    if (!quantizeEnabled) return;
    
    // Quantize all selected notes to grid
    console.log('Quantizing notes to grid:', gridResolution);
  };
  
  const transposeNotes = (semitones) => {
    // Transpose selected notes
    console.log('Transposing notes by:', semitones);
  };
  
  const randomizeVelocity = () => {
    // Add humanization to velocity
    console.log('Randomizing velocity');
  };
  
  return (
    <div className="h-full w-full bg-gray-900 flex flex-col">
      {/* Piano Roll Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center space-x-2">
        {/* Tool Selection */}
        <div className="flex items-center space-x-1 bg-gray-700 rounded p-1">
          <button
            onClick={() => setCurrentTool('pencil')}
            className={`p-1 rounded ${currentTool === 'pencil' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
            title="Draw Tool"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={() => setCurrentTool('eraser')}
            className={`p-1 rounded ${currentTool === 'eraser' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
            title="Eraser Tool"
          >
            <div className="w-3 h-3 bg-red-500 rounded"></div>
          </button>
          <button
            onClick={() => setCurrentTool('select')}
            className={`p-1 rounded ${currentTool === 'select' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
            title="Select Tool"
          >
            <Grid size={14} />
          </button>
          <button
            onClick={() => setCurrentTool('razor')}
            className={`p-1 rounded ${currentTool === 'razor' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
            title="Razor Tool"
          >
            <div className="w-3 h-0.5 bg-white transform rotate-45"></div>
          </button>
        </div>
        
        {/* Grid Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-1 rounded flex items-center space-x-1 ${snapToGrid ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <Snap size={14} />
            <span className="text-xs">Snap</span>
          </button>
          
          <select
            value={gridResolution}
            onChange={(e) => setGridResolution(e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
          >
            <option value="1/4">1/4</option>
            <option value="1/8">1/8</option>
            <option value="1/16">1/16</option>
            <option value="1/32">1/32</option>
          </select>
        </div>
        
        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
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
        
        {/* Velocity Control */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-gray-400">Velocity:</label>
          <input
            type="range"
            min="0"
            max="127"
            value={velocity}
            onChange={(e) => setVelocity(parseInt(e.target.value))}
            className="w-20"
          />
          <span className="text-xs text-gray-400 w-8">{velocity}</span>
        </div>
        
        {/* Quantize */}
        <button
          onClick={quantizeNotes}
          className={`px-2 py-1 rounded text-xs ${quantizeEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          Quantize
        </button>
        
        {/* Note Operations */}
        <div className="flex items-center space-x-1">
          <button
            onClick={() => transposeNotes(1)}
            className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
          >
            Transpose +
          </button>
          <button
            onClick={() => transposeNotes(-1)}
            className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
          >
            Transpose -
          </button>
          <button
            onClick={randomizeVelocity}
            className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
          >
            Humanize
          </button>
        </div>
      </div>
      
      {/* Piano Roll Canvas */}
      <div className="flex-1 overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={1200}
          height={pianoKeys * keyHeight}
          className="cursor-crosshair"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onDoubleClick={handleCanvasDoubleClick}
        />
        
        {/* Piano Keyboard */}
        <div className="absolute left-0 top-0 w-15 h-full bg-gray-800 border-r border-gray-700">
          {/* Mini piano keyboard would go here */}
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-2 py-1 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Tool: {currentTool}</span>
          <span>Grid: {gridResolution}</span>
          <span>Zoom: {Math.round(zoomLevel * 100)}%</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>BPM: {bpm}</span>
          <span>Selected Notes: {selectedNotes.size}</span>
        </div>
      </div>
    </div>
  );
};

export default PianoRoll;
