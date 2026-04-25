import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Music, Edit3, Play, Pause, Download, Upload, Settings, Grid3x3 } from 'lucide-react';
import useProjectStore from '../stores/projectStore';

const ScoreEditor = () => {
  const canvasRef = useRef(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [currentMeasure, setCurrentMeasure] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showChordSymbols, setShowChordSymbols] = useState(true);
  const [showLyrics, setShowLyrics] = useState(false);
  const [notationMode, setNotationMode] = useState('concert'); // concert, transposed
  const [keySignature, setKeySignature] = useState('C'); // C, G, D, A, E, B, F#, C#, F, Bb, Eb, Ab, Db, Gb, Cb
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [tempo, setTempo] = useState(120);
  
  // Score notation state
  const [measures, setMeasures] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState(new Set());
  const [currentTool, setCurrentTool] = useState('note'); // note, rest, text, chord, lyric
  
  const { tracks, bpm } = useProjectStore();
  
  // Musical notation constants
  const STAFF_LINES = 5;
  const LINE_SPACING = 10;
  const STAFF_HEIGHT = STAFF_LINES * LINE_SPACING;
  const MEASURE_WIDTH = 200 * zoomLevel;
  const NOTE_HEAD_WIDTH = 8;
  const NOTE_STEM_HEIGHT = 30;
  
  // Note durations and values
  const NOTE_DURATIONS = {
    'whole': { duration: 4, flags: 0, beamCount: 0 },
    'half': { duration: 2, flags: 0, beamCount: 0 },
    'quarter': { duration: 1, flags: 0, beamCount: 0 },
    'eighth': { duration: 0.5, flags: 1, beamCount: 1 },
    'sixteenth': { duration: 0.25, flags: 2, beamCount: 2 },
    'thirtysecond': { duration: 0.125, flags: 3, beamCount: 3 }
  };
  
  useEffect(() => {
    if (selectedTrack) {
      loadScoreData();
    }
  }, [selectedTrack, zoomLevel]);
  
  useEffect(() => {
    drawScore();
  }, [measures, selectedNotes, currentMeasure, zoomLevel, showGrid, showChordSymbols, showLyrics, keySignature, timeSignature]);
  
  const loadScoreData = () => {
    // Convert MIDI data to score notation
    const track = tracks.find(t => t.id === selectedTrack);
    if (!track) return;
    
    const scoreMeasures = convertMIDIToScore(track);
    setMeasures(scoreMeasures);
  };
  
  const convertMIDIToScore = (track) => {
    // Convert MIDI notes to musical notation
    const measures = [];
    const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
    const beatValue = parseInt(timeSignature.split('/')[1]);
    
    // Group MIDI notes by measure
    const notesByMeasure = {};
    
    track.clips.forEach(clip => {
      clip.notes?.forEach(note => {
        const measureIndex = Math.floor(note.startTime / (beatsPerMeasure * 60 / tempo));
        
        if (!notesByMeasure[measureIndex]) {
          notesByMeasure[measureIndex] = [];
        }
        
        notesByMeasure[measureIndex].push({
          ...note,
          pitch: midiNoteToPitch(note.midiNote),
          octave: Math.floor(note.midiNote / 12) - 1,
          noteName: getNoteName(note.midiNote),
          duration: note.duration,
          startTime: note.startTime % (beatsPerMeasure * 60 / tempo)
        });
      });
    });
    
    // Create measures with notes
    Object.keys(notesByMeasure).forEach(measureIndex => {
      measures[parseInt(measureIndex)] = {
        index: parseInt(measureIndex),
        keySignature,
        timeSignature,
        notes: notesByMeasure[measureIndex].sort((a, b) => a.startTime - b.startTime),
        chords: [], // Extract chords from notes
        lyrics: [], // Extract lyrics if available
        tempo
      };
    });
    
    return measures;
  };
  
  const midiNoteToPitch = (midiNote) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = midiNote % 12;
    return noteNames[noteIndex];
  };
  
  const getNoteName = (midiNote) => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const noteIndex = midiNote % 12;
    const octave = Math.floor(midiNote / 12) - 1;
    return noteNames[noteIndex] + octave;
  };
  
  const getStaffPosition = (noteName, octave) => {
    // Calculate position on staff (0 = middle line)
    const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const baseNote = noteName.replace('#', '').replace('b', '');
    const noteIndex = noteNames.indexOf(baseNote);
    
    // Middle C (C4) is on the first ledger line below the staff
    const middleCPosition = -6; // Below staff
    const noteOffset = (octave - 4) * 7 + (noteIndex - 0); // C = 0
    
    return middleCPosition + noteOffset;
  };
  
  const drawScore = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Draw measures
    measures.forEach((measure, index) => {
      const x = index * MEASURE_WIDTH - currentMeasure * MEASURE_WIDTH;
      
      if (x + MEASURE_WIDTH > 0 && x < width) {
        drawMeasure(ctx, measure, x, height);
      }
    });
    
    // Draw selection
    drawSelection(ctx, width, height);
  };
  
  const drawMeasure = (ctx, measure, x, height) => {
    const staffY = height / 2 - STAFF_HEIGHT / 2;
    
    // Draw staff lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < STAFF_LINES; i++) {
      const y = staffY + i * LINE_SPACING;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + MEASURE_WIDTH, y);
      ctx.stroke();
    }
    
    // Draw bar lines
    ctx.beginPath();
    ctx.moveTo(x, staffY);
    ctx.lineTo(x, staffY + STAFF_HEIGHT);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + MEASURE_WIDTH, staffY);
    ctx.lineTo(x + MEASURE_WIDTH, staffY + STAFF_HEIGHT);
    ctx.stroke();
    
    // Draw key signature
    drawKeySignature(ctx, measure.keySignature, x + 10, staffY);
    
    // Draw time signature
    drawTimeSignature(ctx, measure.timeSignature, x + 50, staffY);
    
    // Draw notes
    measure.notes.forEach(note => {
      drawNote(ctx, note, x + 80, staffY);
    });
    
    // Draw chord symbols
    if (showChordSymbols && measure.chords.length > 0) {
      drawChordSymbols(ctx, measure.chords, x, staffY - 30);
    }
    
    // Draw lyrics
    if (showLyrics && measure.lyrics.length > 0) {
      drawLyrics(ctx, measure.lyrics, x, staffY + STAFF_HEIGHT + 20);
    }
  };
  
  const drawKeySignature = (ctx, keySignature, x, staffY) => {
    const accidentals = getKeySignatureAccidentals(keySignature);
    
    accidentals.forEach((accidental, index) => {
      const noteName = accidental.note;
      const type = accidental.type; // '#' or 'b'
      const position = getStaffPosition(noteName, 4); // Use octave 4 for key signature
      
      const y = staffY + STAFF_HEIGHT - (position + 2) * LINE_SPACING / 2;
      
      ctx.font = '12px serif';
      ctx.fillStyle = '#000000';
      ctx.fillText(type, x + index * 8, y);
    });
  };
  
  const getKeySignatureAccidentals = (key) => {
    // Simplified key signature mapping
    const keySignatures = {
      'C': [],
      'G': [{ note: 'F', type: '#' }],
      'D': [{ note: 'F', type: '#' }, { note: 'C', type: '#' }],
      'A': [{ note: 'F', type: '#' }, { note: 'C', type: '#' }, { note: 'G', type: '#' }],
      'E': [{ note: 'F', type: '#' }, { note: 'C', type: '#' }, { note: 'G', type: '#' }, { note: 'D', type: '#' }],
      'B': [{ note: 'F', type: '#' }, { note: 'C', type: '#' }, { note: 'G', type: '#' }, { note: 'D', type: '#' }, { note: 'A', type: '#' }],
      'F#': [{ note: 'F', type: '#' }, { note: 'C', type: '#' }, { note: 'G', type: '#' }, { note: 'D', type: '#' }, { note: 'A', type: '#' }, { note: 'E', type: '#' }],
      'F': [{ note: 'B', type: 'b' }],
      'Bb': [{ note: 'B', type: 'b' }, { note: 'E', type: 'b' }],
      'Eb': [{ note: 'B', type: 'b' }, { note: 'E', type: 'b' }, { note: 'A', type: 'b' }],
      'Ab': [{ note: 'B', type: 'b' }, { note: 'E', type: 'b' }, { note: 'A', type: 'b' }, { note: 'D', type: 'b' }],
      'Db': [{ note: 'B', type: 'b' }, { note: 'E', type: 'b' }, { note: 'A', type: 'b' }, { note: 'D', type: 'b' }, { note: 'G', type: 'b' }],
      'Gb': [{ note: 'B', type: 'b' }, { note: 'E', type: 'b' }, { note: 'A', type: 'b' }, { note: 'D', type: 'b' }, { note: 'G', type: 'b' }, { note: 'C', type: 'b' }]
    };
    
    return keySignatures[key] || [];
  };
  
  const drawTimeSignature = (ctx, timeSignature, x, staffY) => {
    const [numerator, denominator] = timeSignature.split('/');
    
    ctx.font = '16px serif';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    
    // Draw numerator
    ctx.fillText(numerator, x, staffY + LINE_SPACING * 1.5);
    
    // Draw denominator
    ctx.fillText(denominator, x, staffY + LINE_SPACING * 3.5);
  };
  
  const drawNote = (ctx, note, x, staffY) => {
    const notePosition = getStaffPosition(note.noteName, note.octave);
    const noteY = staffY + STAFF_HEIGHT - (notePosition + 2) * LINE_SPACING / 2;
    const noteX = x + note.startTime * MEASURE_WIDTH / 4; // 4 beats per measure
    
    // Determine note head type based on duration
    let noteHeadType = 'quarter'; // Default
    Object.keys(NOTE_DURATIONS).forEach(duration => {
      if (note.duration <= NOTE_DURATIONS[duration].duration) {
        noteHeadType = duration;
      }
    });
    
    // Draw note head
    ctx.fillStyle = '#000000';
    
    if (noteHeadType === 'whole') {
      // Whole note head (hollow)
      ctx.beginPath();
      ctx.ellipse(noteX, noteY, NOTE_HEAD_WIDTH, NOTE_HEAD_WIDTH * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (noteHeadType === 'half') {
      // Half note head (hollow)
      ctx.beginPath();
      ctx.ellipse(noteX, noteY, NOTE_HEAD_WIDTH, NOTE_HEAD_WIDTH * 0.7, -Math.PI / 6, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Filled note head
      ctx.beginPath();
      ctx.ellipse(noteX, noteY, NOTE_HEAD_WIDTH, NOTE_HEAD_WIDTH * 0.7, -Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw stem
    if (noteHeadType !== 'whole') {
      const stemDirection = notePosition >= 0 ? -1 : 1;
      const stemX = noteX + (stemDirection > 0 ? NOTE_HEAD_WIDTH : -NOTE_HEAD_WIDTH);
      const stemY = noteY;
      
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(stemX, stemY);
      ctx.lineTo(stemX, stemY + stemDirection * NOTE_STEM_HEIGHT);
      ctx.stroke();
      
      // Draw flags for eighth notes and shorter
      const flags = NOTE_DURATIONS[noteHeadType]?.flags || 0;
      for (let i = 0; i < flags; i++) {
        const flagY = stemY + stemDirection * (NOTE_STEM_HEIGHT - i * 8);
        ctx.beginPath();
        if (stemDirection > 0) {
          ctx.moveTo(stemX, flagY);
          ctx.quadraticCurveTo(stemX + 8, flagY - 4, stemX + 6, flagY - 8);
        } else {
          ctx.moveTo(stemX, flagY);
          ctx.quadraticCurveTo(stemX - 8, flagY + 4, stemX - 6, flagY + 8);
        }
        ctx.stroke();
      }
    }
    
    // Draw ledger lines if needed
    if (notePosition < -2 || notePosition > 8) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      
      const ledgerCount = Math.abs(notePosition < -2 ? notePosition + 2 : notePosition - 8);
      for (let i = 1; i <= ledgerCount; i++) {
        const ledgerY = notePosition < -2 ? 
          staffY + STAFF_HEIGHT + i * LINE_SPACING :
          staffY - i * LINE_SPACING;
        
        ctx.beginPath();
        ctx.moveTo(noteX - NOTE_HEAD_WIDTH - 2, ledgerY);
        ctx.lineTo(noteX + NOTE_HEAD_WIDTH + 2, ledgerY);
        ctx.stroke();
      }
    }
  };
  
  const drawChordSymbols = (ctx, chords, x, y) => {
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#333333';
    
    chords.forEach(chord => {
      const chordX = x + chord.position * MEASURE_WIDTH / 4;
      ctx.fillText(chord.symbol, chordX, y);
    });
  };
  
  const drawLyrics = (ctx, lyrics, x, y) => {
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#666666';
    
    lyrics.forEach(lyric => {
      const lyricX = x + lyric.position * MEASURE_WIDTH / 4;
      ctx.fillText(lyric.text, lyricX, y);
    });
  };
  
  const drawSelection = (ctx, width, height) => {
    // Draw selection rectangle around selected notes
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    selectedNotes.forEach(noteId => {
      // Find and highlight selected notes
      // This is simplified - would need to track note positions
    });
    
    ctx.setLineDash([]);
  };
  
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Convert click position to musical notation position
    const staffY = canvas.height / 2 - STAFF_HEIGHT / 2;
    const relativeY = y - staffY;
    const linePosition = Math.round(relativeY / LINE_SPACING);
    
    console.log('Clicked at position:', { x, y, linePosition });
  };
  
  const exportScore = () => {
    // Export score to MusicXML or other format
    const scoreData = {
      title: 'DAW Dan Score',
      keySignature,
      timeSignature,
      tempo,
      measures: measures.map(measure => ({
        number: measure.index + 1,
        notes: measure.notes.map(note => ({
          pitch: note.noteName + note.octave,
          duration: note.duration,
          startTime: note.startTime
        }))
      }))
    };
    
    console.log('Exporting score:', scoreData);
    // This would generate and download a MusicXML file
  };
  
  const importScore = () => {
    // Import score from MusicXML or other format
    console.log('Import score dialog');
    // This would open a file dialog and parse MusicXML
  };
  
  const transposeScore = (semitones) => {
    // Transpose all notes by semitones
    console.log('Transposing score by:', semitones);
    // This would update all note pitches
  };
  
  return (
    <div className="h-full w-full bg-white flex flex-col">
      {/* Score Editor Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Track Selection */}
          <select
            value={selectedTrack || ''}
            onChange={(e) => setSelectedTrack(parseInt(e.target.value))}
            className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
          >
            <option value="">Select Track</option>
            {tracks.filter(t => t.type === 'midi').map(track => (
              <option key={track.id} value={track.id}>{track.name}</option>
            ))}
          </select>
          
          {/* Notation Tools */}
          <div className="flex items-center space-x-1 bg-gray-700 rounded p-1">
            <button
              onClick={() => setCurrentTool('note')}
              className={`p-1 rounded ${currentTool === 'note' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
              title="Note Tool"
            >
              <Music size={14} />
            </button>
            <button
              onClick={() => setCurrentTool('text')}
              className={`p-1 rounded ${currentTool === 'text' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
              title="Text Tool"
            >
              <Edit3 size={14} />
            </button>
          </div>
          
          {/* Score Settings */}
          <div className="flex items-center space-x-2">
            <select
              value={keySignature}
              onChange={(e) => setKeySignature(e.target.value)}
              className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
            >
              <option value="C">C Major</option>
              <option value="G">G Major</option>
              <option value="D">D Major</option>
              <option value="A">A Major</option>
              <option value="E">E Major</option>
              <option value="B">B Major</option>
              <option value="F#">F# Major</option>
              <option value="F">F Major</option>
              <option value="Bb">Bb Major</option>
              <option value="Eb">Eb Major</option>
              <option value="Ab">Ab Major</option>
              <option value="Db">Db Major</option>
              <option value="Gb">Gb Major</option>
            </select>
            
            <select
              value={timeSignature}
              onChange={(e) => setTimeSignature(e.target.value)}
              className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
            >
              <option value="4/4">4/4</option>
              <option value="3/4">3/4</option>
              <option value="2/4">2/4</option>
              <option value="6/8">6/8</option>
              <option value="12/8">12/8</option>
            </select>
            
            <input
              type="number"
              value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value))}
              className="bg-gray-700 text-white px-2 py-1 rounded text-xs w-16"
              placeholder="BPM"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Display Options */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowChordSymbols(!showChordSymbols)}
              className={`px-2 py-1 rounded text-xs ${showChordSymbols ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Chords
            </button>
            <button
              onClick={() => setShowLyrics(!showLyrics)}
              className={`px-2 py-1 rounded text-xs ${showLyrics ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Lyrics
            </button>
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`px-2 py-1 rounded text-xs ${showGrid ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              Grid
            </button>
          </div>
          
          {/* Transpose */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => transposeScore(-1)}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            >
              Transpose -
            </button>
            <button
              onClick={() => transposeScore(1)}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
            >
              Transpose +
            </button>
          </div>
          
          {/* Import/Export */}
          <div className="flex items-center space-x-1">
            <button
              onClick={importScore}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center space-x-1"
            >
              <Upload size={12} />
              <span>Import</span>
            </button>
            <button
              onClick={exportScore}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs flex items-center space-x-1"
            >
              <Download size={12} />
              <span>Export</span>
            </button>
          </div>
          
          {/* Zoom */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel * 0.75))}
              className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
            >
              Zoom -
            </button>
            <span className="text-xs text-gray-400">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(2, zoomLevel * 1.25))}
              className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
            >
              Zoom +
            </button>
          </div>
        </div>
      </div>
      
      {/* Score Canvas */}
      <div className="flex-1 overflow-auto bg-gray-50">
        <canvas
          ref={canvasRef}
          width={2000}
          height={400}
          className="cursor-crosshair"
          onClick={handleCanvasClick}
        />
      </div>
      
      {/* Score Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-2 py-1 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <span>Measure: {currentMeasure + 1}</span>
          <span>Key: {keySignature}</span>
          <span>Time: {timeSignature}</span>
          <span>Tempo: {tempo} BPM</span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Tool: {currentTool}</span>
          <span>Notation: {notationMode}</span>
          <span>Measures: {measures.length}</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreEditor;
