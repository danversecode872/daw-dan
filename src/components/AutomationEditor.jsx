import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Bezier, Move, Edit3, Trash2, Plus, Grid, Snap, MousePointer } from 'lucide-react';
import useProjectStore from '../stores/projectStore';

const AutomationEditor = () => {
  const canvasRef = useRef(null);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [selectedParameter, setSelectedParameter] = useState('volume');
  const [automationPoints, setAutomationPoints] = useState([]);
  const [selectedPoints, setSelectedPoints] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPoint, setDraggedPoint] = useState(null);
  const [currentTool, setCurrentTool] = useState('pencil'); // pencil, select, bezier, erase
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridResolution, setGridResolution] = useState('1/16');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [curveType, setCurveType] = useState('linear'); // linear, exponential, logarithmic, bezier
  
  const { tracks, bpm } = useProjectStore();
  
  // Automation parameters available for automation
  const automationParameters = [
    { id: 'volume', name: 'Volume', min: 0, max: 1, color: '#60a5fa' },
    { id: 'pan', name: 'Pan', min: -1, max: 1, color: '#34d399' },
    { id: 'send_reverb', name: 'Reverb Send', min: 0, max: 1, color: '#a78bfa' },
    { id: 'send_delay', name: 'Delay Send', min: 0, max: 1, color: '#f472b6' },
    { id: 'eq_low', name: 'EQ Low', min: -20, max: 20, color: '#fbbf24' },
    { id: 'eq_mid', name: 'EQ Mid', min: -20, max: 20, color: '#fb923c' },
    { id: 'eq_high', name: 'EQ High', min: -20, max: 20, color: '#f87171' }
  ];
  
  const currentParam = automationParameters.find(p => p.id === selectedParameter);
  
  useEffect(() => {
    if (selectedTrack && selectedParameter) {
      loadAutomationData();
    }
  }, [selectedTrack, selectedParameter]);
  
  useEffect(() => {
    drawAutomation();
  }, [automationPoints, selectedPoints, zoomLevel, showGrid, gridResolution, currentParam]);
  
  const loadAutomationData = () => {
    // Load automation data for selected track and parameter
    const track = tracks.find(t => t.id === selectedTrack);
    if (track && track.automation && track.automation[selectedParameter]) {
      setAutomationPoints(track.automation[selectedParameter].points || []);
    } else {
      // Generate some sample automation points for demonstration
      const samplePoints = generateSampleAutomation();
      setAutomationPoints(samplePoints);
    }
  };
  
  const generateSampleAutomation = () => {
    const points = [];
    const duration = 8; // 8 bars
    const pointsPerBar = 4;
    
    for (let bar = 0; bar < duration; bar++) {
      for (let point = 0; point < pointsPerBar; point++) {
        const time = bar + (point / pointsPerBar);
        const value = 0.5 + 0.3 * Math.sin(time * Math.PI / 2);
        points.push({
          id: Date.now() + bar * 100 + point,
          time,
          value,
          curveType: 'linear'
        });
      }
    }
    
    return points;
  };
  
  const drawAutomation = () => {
    const canvas = canvasRef.current;
    if (!canvas || !currentParam) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid
    if (showGrid) {
      drawGrid(ctx, width, height);
    }
    
    // Draw parameter background
    drawParameterBackground(ctx, width, height);
    
    // Draw automation curve
    drawAutomationCurve(ctx, width, height);
    
    // Draw automation points
    drawAutomationPoints(ctx, width, height);
    
    // Draw playhead
    drawPlayhead(ctx, width, height);
  };
  
  const drawGrid = (ctx, width, height) => {
    const pixelsPerBeat = 60 * zoomLevel;
    const beatsPerGrid = getBeatsPerGrid(gridResolution);
    const gridSpacing = pixelsPerBeat * beatsPerGrid;
    
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    // Vertical grid lines (time)
    for (let x = 0; x < width; x += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Bar lines (thicker)
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2;
    
    for (let bar = 0; bar < 16; bar++) {
      const x = bar * 4 * pixelsPerBeat; // 4 beats per bar
      if (x < width) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    }
    
    // Horizontal grid lines (parameter values)
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };
  
  const drawParameterBackground = (ctx, width, height) => {
    // Draw parameter range background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    
    if (currentParam.id === 'pan') {
      // Pan: center line
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      // Volume/other parameters: gradient
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.1)'); // Red for high values
      gradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.1)'); // Yellow for middle
      gradient.addColorStop(1, 'rgba(34, 197, 94, 0.1)'); // Green for low values
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  };
  
  const drawAutomationCurve = (ctx, width, height) => {
    if (automationPoints.length < 2) return;
    
    const sortedPoints = [...automationPoints].sort((a, b) => a.time - b.time);
    
    ctx.strokeStyle = currentParam.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    sortedPoints.forEach((point, index) => {
      const x = timeToX(point.time, width);
      const y = valueToY(point.value, height);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevPoint = sortedPoints[index - 1];
        const prevX = timeToX(prevPoint.time, width);
        const prevY = valueToY(prevPoint.value, height);
        
        if (point.curveType === 'linear') {
          ctx.lineTo(x, y);
        } else if (point.curveType === 'exponential') {
          drawExponentialCurve(ctx, prevX, prevY, x, y);
        } else if (point.curveType === 'logarithmic') {
          drawLogarithmicCurve(ctx, prevX, prevY, x, y);
        } else if (point.curveType === 'bezier') {
          drawBezierCurve(ctx, prevX, prevY, x, y, prevPoint.curveControl, point.curveControl);
        }
      }
    });
    
    ctx.stroke();
  };
  
  const drawExponentialCurve = (ctx, x1, y1, x2, y2) => {
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const progress = t * t; // Exponential curve
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * progress;
      ctx.lineTo(x, y);
    }
  };
  
  const drawLogarithmicCurve = (ctx, x1, y1, x2, y2) => {
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const progress = 1 - Math.pow(1 - t, 2); // Logarithmic curve
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * progress;
      ctx.lineTo(x, y);
    }
  };
  
  const drawBezierCurve = (ctx, x1, y1, x2, y2, cp1, cp2) => {
    ctx.bezierCurveTo(
      cp1?.x || x1 + (x2 - x1) / 3,
      cp1?.y || y1,
      cp2?.x || x2 - (x2 - x1) / 3,
      cp2?.y || y2,
      x2, y2
    );
  };
  
  const drawAutomationPoints = (ctx, width, height) => {
    automationPoints.forEach(point => {
      const x = timeToX(point.time, width);
      const y = valueToY(point.value, height);
      
      // Draw point
      ctx.fillStyle = selectedPoints.has(point.id) ? '#60a5fa' : currentParam.color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw point border
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw value label for selected points
      if (selectedPoints.has(point.id)) {
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        const valueText = point.value.toFixed(3);
        ctx.fillText(valueText, x + 8, y - 8);
      }
    });
  };
  
  const drawPlayhead = (ctx, width, height) => {
    // This would get the current playback position from the audio engine
    const currentTime = 0; // Placeholder
    const playheadX = timeToX(currentTime, width);
    
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  };
  
  const timeToX = (time, width) => {
    const pixelsPerBeat = 60 * zoomLevel;
    return time * pixelsPerBeat;
  };
  
  const valueToY = (value, height) => {
    const normalizedValue = (value - currentParam.min) / (currentParam.max - currentParam.min);
    return height - (normalizedValue * height);
  };
  
  const xToTime = (x) => {
    const pixelsPerBeat = 60 * zoomLevel;
    return x / pixelsPerBeat;
  };
  
  const yToValue = (y, height) => {
    const normalizedValue = 1 - (y / height);
    return currentParam.min + (normalizedValue * (currentParam.max - currentParam.min));
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
    return Math.round(value / beatsPerGrid) * beatsPerGrid;
  };
  
  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const time = xToTime(x);
    const value = yToValue(y, canvas.height);
    
    if (currentTool === 'pencil') {
      // Add new automation point
      const newPoint = {
        id: Date.now(),
        time: snapToGridValue(time),
        value,
        curveType
      };
      
      setAutomationPoints([...automationPoints, newPoint]);
      
    } else if (currentTool === 'select') {
      // Select or drag existing point
      const clickedPoint = findPointAt(x, y, canvas.width, canvas.height);
      if (clickedPoint) {
        if (!e.shiftKey) {
          setSelectedPoints(new Set([clickedPoint.id]));
        } else {
          const newSelection = new Set(selectedPoints);
          if (newSelection.has(clickedPoint.id)) {
            newSelection.delete(clickedPoint.id);
          } else {
            newSelection.add(clickedPoint.id);
          }
          setSelectedPoints(newSelection);
        }
        
        setIsDragging(true);
        setDraggedPoint(clickedPoint);
      } else {
        setSelectedPoints(new Set());
      }
      
    } else if (currentTool === 'erase') {
      // Delete point at position
      const pointToDelete = findPointAt(x, y, canvas.width, canvas.height);
      if (pointToDelete) {
        setAutomationPoints(automationPoints.filter(p => p.id !== pointToDelete.id));
        setSelectedPoints(prev => {
          const newSet = new Set(prev);
          newSet.delete(pointToDelete.id);
          return newSet;
        });
      }
    }
  };
  
  const handleCanvasMouseMove = (e) => {
    if (!isDragging || !draggedPoint) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const time = snapToGridValue(xToTime(x));
    const value = yToValue(y, canvas.height);
    
    // Update dragged point
    setAutomationPoints(prev => prev.map(point => 
      point.id === draggedPoint.id 
        ? { ...point, time, value }
        : point
    ));
  };
  
  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDraggedPoint(null);
  };
  
  const findPointAt = (x, y, width, height) => {
    const threshold = 10; // Pixels
    
    return automationPoints.find(point => {
      const pointX = timeToX(point.time, width);
      const pointY = valueToY(point.value, height);
      const distance = Math.sqrt(Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2));
      return distance <= threshold;
    });
  };
  
  const deleteSelectedPoints = () => {
    setAutomationPoints(prev => prev.filter(point => !selectedPoints.has(point.id)));
    setSelectedPoints(new Set());
  };
  
  const changeCurveType = (type) => {
    setCurveType(type);
    
    // Update selected points with new curve type
    if (selectedPoints.size > 0) {
      setAutomationPoints(prev => prev.map(point => 
        selectedPoints.has(point.id) 
          ? { ...point, curveType: type }
          : point
      ));
    }
  };
  
  const saveAutomation = () => {
    // Save automation data to track
    if (selectedTrack && selectedParameter) {
      const automationData = {
        parameter: selectedParameter,
        points: automationPoints,
        interpolationType: curveType
      };
      
      console.log('Saving automation:', automationData);
      // This would integrate with the project store
    }
  };
  
  return (
    <div className="h-full w-full bg-gray-900 flex flex-col">
      {/* Automation Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 p-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Track and Parameter Selection */}
          <select
            value={selectedTrack || ''}
            onChange={(e) => setSelectedTrack(parseInt(e.target.value))}
            className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
          >
            <option value="">Select Track</option>
            {tracks.map(track => (
              <option key={track.id} value={track.id}>{track.name}</option>
            ))}
          </select>
          
          <select
            value={selectedParameter}
            onChange={(e) => setSelectedParameter(e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
          >
            {automationParameters.map(param => (
              <option key={param.id} value={param.id}>{param.name}</option>
            ))}
          </select>
          
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
              onClick={() => setCurrentTool('select')}
              className={`p-1 rounded ${currentTool === 'select' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
              title="Select Tool"
            >
              <MousePointer size={14} />
            </button>
            <button
              onClick={() => setCurrentTool('erase')}
              className={`p-1 rounded ${currentTool === 'erase' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
              title="Erase Tool"
            >
              <Trash2 size={14} />
            </button>
          </div>
          
          {/* Curve Type */}
          <select
            value={curveType}
            onChange={(e) => changeCurveType(e.target.value)}
            className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
          >
            <option value="linear">Linear</option>
            <option value="exponential">Exponential</option>
            <option value="logarithmic">Logarithmic</option>
            <option value="bezier">Bezier</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Grid Controls */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1 rounded ${showGrid ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            <Grid size={14} />
          </button>
          
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
          
          {/* Zoom */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setZoomLevel(Math.max(0.25, zoomLevel * 0.5))}
              className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
            >
              -
            </button>
            <span className="text-xs text-gray-400">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(4, zoomLevel * 2))}
              className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600 text-xs"
            >
              +
            </button>
          </div>
          
          {/* Actions */}
          <button
            onClick={deleteSelectedPoints}
            disabled={selectedPoints.size === 0}
            className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs disabled:bg-gray-600 disabled:opacity-50"
          >
            Delete Selected
          </button>
          
          <button
            onClick={saveAutomation}
            className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
          >
            Save
          </button>
        </div>
      </div>
      
      {/* Automation Canvas */}
      <div className="flex-1 overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={1200}
          height={400}
          className="cursor-crosshair"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        />
        
        {/* Parameter Info */}
        {currentParam && (
          <div className="absolute top-2 left-2 bg-gray-800 rounded p-2 text-xs">
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded"
                style={{ backgroundColor: currentParam.color }}
              ></div>
              <span>{currentParam.name}</span>
              <span className="text-gray-400">
                ({currentParam.min.toFixed(1)} - {currentParam.max.toFixed(1)})
              </span>
            </div>
          </div>
        )}
        
        {/* Selected Points Info */}
        {selectedPoints.size > 0 && (
          <div className="absolute top-2 right-2 bg-gray-800 rounded p-2 text-xs">
            <div>Selected: {selectedPoints.size} points</div>
            <div className="text-gray-400">
              Hold Shift for multi-select
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomationEditor;
