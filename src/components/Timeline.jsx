import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Move, Scissors, Copy, Trash2 } from 'lucide-react';
import useProjectStore from '../stores/projectStore';

const Timeline = () => {
  const { tracks, currentTime, isPlaying, setCurrentTime } = useProjectStore();
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const pixelsPerSecond = 50 * zoom;
  const timelineWidth = 1200; // Approximate width
  const timelineDuration = timelineWidth / pixelsPerSecond;

  useEffect(() => {
    drawTimeline();
  }, [tracks, zoom, currentTime]);

  const drawTimeline = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;

    // Vertical lines (time markers)
    for (let x = 0; x < width; x += pixelsPerSecond) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines (track separators)
    const trackHeight = 60;
    for (let i = 0; i <= tracks.length; i++) {
      const y = i * trackHeight;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw time markers
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px monospace';
    for (let i = 0; i <= timelineDuration; i++) {
      const x = i * pixelsPerSecond;
      if (x < width) {
        const timeStr = `${Math.floor(i / 60)}:${(i % 60).toString().padStart(2, '0')}`;
        ctx.fillText(timeStr, x + 2, 12);
      }
    }

    // Draw playhead
    const playheadX = currentTime * pixelsPerSecond;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();

    // Draw clips
    tracks.forEach((track, trackIndex) => {
      const y = trackIndex * trackHeight + 20;
      
      track.clips.forEach((clip) => {
        const clipX = clip.startTime * pixelsPerSecond;
        const clipWidth = clip.duration * pixelsPerSecond;
        
        // Clip background
        ctx.fillStyle = clip.color || '#3b82f6';
        ctx.fillRect(clipX, y, clipWidth, 30);
        
        // Clip border
        ctx.strokeStyle = '#1e40af';
        ctx.lineWidth = 1;
        ctx.strokeRect(clipX, y, clipWidth, 30);
        
        // Clip name
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px sans-serif';
        const text = clip.name || 'Audio Clip';
        const textWidth = ctx.measureText(text).width;
        if (textWidth < clipWidth - 4) {
          ctx.fillText(text, clipX + 2, y + 18);
        }
      });
    });
  };

  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = x / pixelsPerSecond;
    setCurrentTime(Math.max(0, newTime));
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  return (
    <div className="h-full w-full overflow-hidden relative">
      {/* Timeline Header */}
      <div className="h-8 bg-gray-800 border-b border-gray-700 flex items-center px-2">
        <div className="flex items-center space-x-4 text-xs">
          <button
            onClick={() => setZoom(prev => Math.max(0.1, prev * 0.5))}
            className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
          >
            Zoom Out
          </button>
          <span className="text-gray-400">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(prev => Math.min(5, prev * 2))}
            className="px-2 py-1 bg-gray-700 rounded hover:bg-gray-600"
          >
            Zoom In
          </button>
        </div>
      </div>

      {/* Timeline Canvas */}
      <div className="flex-1 overflow-auto timeline-grid">
        <canvas
          ref={canvasRef}
          width={1200}
          height={tracks.length * 60 + 40}
          className="cursor-pointer"
          onClick={handleCanvasClick}
          onWheel={handleWheel}
        />
      </div>

      {/* Timeline Controls */}
      <div className="absolute bottom-4 right-4 bg-gray-800 rounded-lg p-2 shadow-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="p-1 hover:bg-gray-700 rounded"
            title="Zoom Out"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-gray-400 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(4, zoom + 0.25))}
            className="p-1 hover:bg-gray-700 rounded"
            title="Zoom In"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1 hover:bg-gray-700 rounded"
            title="Fit to View"
          >
            <Maximize2 size={14} />
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Click to seek • Scroll to zoom
        </div>
      </div>
    </div>
  );
};

export default Timeline;
