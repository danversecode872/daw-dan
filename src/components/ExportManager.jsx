import React, { useState, useEffect } from 'react';
import { Download, Settings, Music, Film, FileAudio, Save, Play, Info } from 'lucide-react';
import useProjectStore from '../stores/projectStore';

const ExportManager = () => {
  const { currentProject, tracks, bpm } = useProjectStore();
  const [exportSettings, setExportSettings] = useState({
    format: 'wav',
    bitDepth: '24',
    sampleRate: '48000',
    channels: 'stereo',
    quality: 'high',
    normalize: true,
    dither: false,
    tail: true,
    range: 'all', // all, selection, loop
    startMarker: 0,
    endMarker: 0
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [exportHistory, setExportHistory] = useState([]);
  
  // Export formats and their capabilities
  const exportFormats = {
    wav: {
      name: 'WAV',
      description: 'Uncompressed audio',
      bitDepths: ['16', '24', '32'],
      sampleRates: ['44100', '48000', '88200', '96000'],
      channels: ['mono', 'stereo'],
      supportsDither: false
    },
    aiff: {
      name: 'AIFF',
      description: 'Uncompressed audio (Apple)',
      bitDepths: ['16', '24', '32'],
      sampleRates: ['44100', '48000', '88200', '96000'],
      channels: ['mono', 'stereo'],
      supportsDither: false
    },
    mp3: {
      name: 'MP3',
      description: 'Compressed audio',
      bitDepths: ['16'],
      sampleRates: ['44100', '48000'],
      channels: ['mono', 'stereo'],
      supportsDither: true,
      quality: ['low', 'medium', 'high', 'insane']
    },
    flac: {
      name: 'FLAC',
      description: 'Lossless compression',
      bitDepths: ['16', '24'],
      sampleRates: ['44100', '48000', '88200', '96000'],
      channels: ['mono', 'stereo'],
      supportsDither: true
    },
    m4a: {
      name: 'M4A/AAC',
      description: 'Apple compressed audio',
      bitDepths: ['16'],
      sampleRates: ['44100', '48000'],
      channels: ['mono', 'stereo'],
      supportsDither: true,
      quality: ['low', 'medium', 'high']
    },
    ogg: {
      name: 'OGG Vorbis',
      description: 'Open source compression',
      bitDepths: ['16', '24'],
      sampleRates: ['44100', '48000'],
      channels: ['mono', 'stereo'],
      supportsDither: true,
      quality: ['low', 'medium', 'high']
    }
  };
  
  const currentFormat = exportFormats[exportSettings.format];
  
  useEffect(() => {
    calculateExportTime();
  }, [exportSettings, tracks]);
  
  const calculateExportTime = () => {
    // Estimate export time based on project complexity
    const totalDuration = calculateTotalDuration();
    const processingFactor = getProcessingFactor(exportSettings.format);
    const estimatedSeconds = totalDuration * processingFactor;
    
    setEstimatedTime(estimatedSeconds);
  };
  
  const calculateTotalDuration = () => {
    let maxDuration = 0;
    
    tracks.forEach(track => {
      track.clips.forEach(clip => {
        const clipEnd = clip.startTime + clip.duration;
        maxDuration = Math.max(maxDuration, clipEnd);
      });
    });
    
    return maxDuration;
  };
  
  const getProcessingFactor = (format) => {
    // Processing time multiplier based on format complexity
    const factors = {
      wav: 1.0,
      aiff: 1.0,
      mp3: 2.5,
      flac: 1.8,
      m4a: 3.0,
      ogg: 2.2
    };
    
    return factors[format] || 1.0;
  };
  
  const handleSettingChange = (setting, value) => {
    setExportSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  const startExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Simulate export process
      const totalSteps = 100;
      
      for (let step = 0; step <= totalSteps; step++) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setExportProgress(step);
      }
      
      // Add to export history
      const exportRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        settings: { ...exportSettings },
        filename: generateFilename(),
        size: estimateFileSize(),
        duration: calculateTotalDuration()
      };
      
      setExportHistory(prev => [exportRecord, ...prev].slice(0, 10));
      
      // Download file (in real implementation)
      await downloadExportFile(exportRecord);
      
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };
  
  const generateFilename = () => {
    const projectName = currentProject?.name || 'Untitled';
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const extension = exportSettings.format;
    
    return `${projectName}_${timestamp}.${extension}`;
  };
  
  const estimateFileSize = () => {
    const duration = calculateTotalDuration();
    const sampleRate = parseInt(exportSettings.sampleRate);
    const bitDepth = parseInt(exportSettings.bitDepth);
    const channels = exportSettings.channels === 'stereo' ? 2 : 1;
    
    // Calculate uncompressed size
    const bytesPerSecond = sampleRate * (bitDepth / 8) * channels;
    const uncompressedSize = duration * bytesPerSecond;
    
    // Apply compression ratio for compressed formats
    const compressionRatios = {
      wav: 1.0,
      aiff: 1.0,
      mp3: 0.1,
      flac: 0.6,
      m4a: 0.15,
      ogg: 0.12
    };
    
    const compressionRatio = compressionRatios[exportSettings.format] || 1.0;
    const finalSize = uncompressedSize * compressionRatio;
    
    return formatFileSize(finalSize);
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes.toFixed(0) + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };
  
  const downloadExportFile = async (exportRecord) => {
    // In real implementation, this would create and download the actual audio file
    console.log('Downloading export file:', exportRecord);
  };
  
  const createPreset = (name) => {
    const preset = {
      name,
      settings: { ...exportSettings },
      timestamp: new Date().toISOString()
    };
    
    console.log('Creating preset:', preset);
    // This would save the preset to storage
  };
  
  const loadPreset = (preset) => {
    setExportSettings(preset.settings);
  };
  
  const exportStems = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      const audioTracks = tracks.filter(track => track.type === 'audio');
      const totalTracks = audioTracks.length;
      
      for (let i = 0; i < totalTracks; i++) {
        const track = audioTracks[i];
        
        // Export individual track
        await exportTrack(track);
        
        setExportProgress(((i + 1) / totalTracks) * 100);
      }
      
      // Create ZIP file with all stems
      await createStemZip(audioTracks);
      
    } catch (error) {
      console.error('Stem export failed:', error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };
  
  const exportTrack = async (track) => {
    // Export individual track
    console.log('Exporting track:', track.name);
    await new Promise(resolve => setTimeout(resolve, 100));
  };
  
  const createStemZip = async (tracks) => {
    // Create ZIP file containing all exported tracks
    console.log('Creating stem ZIP with tracks:', tracks.map(t => t.name));
    await new Promise(resolve => setTimeout(resolve, 200));
  };
  
  return (
    <div className="h-full w-full bg-gray-900 text-white flex flex-col">
      {/* Export Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <h2 className="text-xl font-bold mb-2">Export Project</h2>
        <div className="flex items-center space-x-4 text-sm text-gray-400">
          <span>Project: {currentProject?.name || 'Untitled'}</span>
          <span>Duration: {calculateTotalDuration().toFixed(2)}s</span>
          <span>Tracks: {tracks.length}</span>
        </div>
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Export Settings */}
        <div className="w-1/2 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Format</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(exportFormats).map(([key, format]) => (
                  <button
                    key={key}
                    onClick={() => handleSettingChange('format', key)}
                    className={`p-3 rounded border-2 transition-colors ${
                      exportSettings.format === key
                        ? 'border-blue-500 bg-blue-900'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold">{format.name}</div>
                    <div className="text-xs text-gray-400">{format.description}</div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Audio Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Audio Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Sample Rate</label>
                  <select
                    value={exportSettings.sampleRate}
                    onChange={(e) => handleSettingChange('sampleRate', e.target.value)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  >
                    {currentFormat.sampleRates.map(rate => (
                      <option key={rate} value={rate}>{rate} Hz</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Bit Depth</label>
                  <select
                    value={exportSettings.bitDepth}
                    onChange={(e) => handleSettingChange('bitDepth', e.target.value)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  >
                    {currentFormat.bitDepths.map(depth => (
                      <option key={depth} value={depth}>{depth} bit</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Channels</label>
                  <select
                    value={exportSettings.channels}
                    onChange={(e) => handleSettingChange('channels', e.target.value)}
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  >
                    {currentFormat.channels.map(channels => (
                      <option key={channels} value={channels}>
                        {channels === 'mono' ? 'Mono' : 'Stereo'}
                      </option>
                    ))}
                  </select>
                </div>
                
                {currentFormat.quality && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Quality</label>
                    <select
                      value={exportSettings.quality}
                      onChange={(e) => handleSettingChange('quality', e.target.value)}
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                    >
                      {currentFormat.quality.map(quality => (
                        <option key={quality} value={quality}>
                          {quality.charAt(0).toUpperCase() + quality.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
            
            {/* Processing Options */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Processing</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportSettings.normalize}
                    onChange={(e) => handleSettingChange('normalize', e.target.checked)}
                    className="rounded"
                  />
                  <span>Normalize to -0.1 dB</span>
                </label>
                
                {currentFormat.supportsDither && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportSettings.dither}
                      onChange={(e) => handleSettingChange('dither', e.target.checked)}
                      className="rounded"
                    />
                    <span>Apply dithering</span>
                  </label>
                )}
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={exportSettings.tail}
                    onChange={(e) => handleSettingChange('tail', e.target.checked)}
                    className="rounded"
                  />
                  <span>Include reverb tail</span>
                </label>
              </div>
            </div>
            
            {/* Export Range */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Range</h3>
              <div className="space-y-2">
                <select
                  value={exportSettings.range}
                  onChange={(e) => handleSettingChange('range', e.target.value)}
                  className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                >
                  <option value="all">Entire Project</option>
                  <option value="selection">Selection</option>
                  <option value="loop">Loop Region</option>
                  <option value="custom">Custom Range</option>
                </select>
                
                {exportSettings.range === 'custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Start (s)</label>
                      <input
                        type="number"
                        value={exportSettings.startMarker}
                        onChange={(e) => handleSettingChange('startMarker', parseFloat(e.target.value))}
                        className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">End (s)</label>
                      <input
                        type="number"
                        value={exportSettings.endMarker}
                        onChange={(e) => handleSettingChange('endMarker', parseFloat(e.target.value))}
                        className="w-full bg-gray-700 text-white px-2 py-1 rounded text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Export Preview & Actions */}
        <div className="w-1/2 bg-gray-850 p-4 flex flex-col">
          {/* Export Info */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-3 flex items-center space-x-2">
              <Info size={16} />
              <span>Export Information</span>
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Format:</span>
                <span>{currentFormat.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sample Rate:</span>
                <span>{exportSettings.sampleRate} Hz</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Bit Depth:</span>
                <span>{exportSettings.bitDepth} bit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Channels:</span>
                <span>{exportSettings.channels === 'mono' ? 'Mono' : 'Stereo'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estimated Size:</span>
                <span>{estimateFileSize()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estimated Time:</span>
                <span>{estimatedTime.toFixed(1)}s</span>
              </div>
            </div>
          </div>
          
          {/* Export Progress */}
          {isExporting && (
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-3">Exporting...</h3>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-400">
                {exportProgress.toFixed(0)}% complete
              </div>
            </div>
          )}
          
          {/* Export Actions */}
          <div className="space-y-3 mb-4">
            <button
              onClick={startExport}
              disabled={isExporting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded font-semibold flex items-center justify-center space-x-2"
            >
              <Download size={16} />
              <span>{isExporting ? 'Exporting...' : 'Export Project'}</span>
            </button>
            
            <button
              onClick={exportStems}
              disabled={isExporting}
              className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded flex items-center justify-center space-x-2"
            >
              <FileAudio size={16} />
              <span>Export Stems</span>
            </button>
            
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => createPreset('Current Settings')}
                className="py-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center space-x-1"
              >
                <Save size={14} />
                <span>Save Preset</span>
              </button>
              
              <button
                onClick={() => console.log('Load preset dialog')}
                className="py-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center space-x-1"
              >
                <Settings size={14} />
                <span>Load Preset</span>
              </button>
            </div>
          </div>
          
          {/* Export History */}
          <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-y-auto">
            <h3 className="font-semibold mb-3">Export History</h3>
            {exportHistory.length === 0 ? (
              <div className="text-gray-400 text-sm">No exports yet</div>
            ) : (
              <div className="space-y-2">
                {exportHistory.map(record => (
                  <div key={record.id} className="bg-gray-700 rounded p-2 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{record.filename}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(record.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs">{record.size}</div>
                        <div className="text-xs text-gray-400">{record.duration.toFixed(2)}s</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportManager;
