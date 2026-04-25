import React, { useState, useEffect } from 'react';
import { FolderPlus, Save, Download, Upload, Copy, Trash2, Settings, Search, Filter, Grid, List } from 'lucide-react';
import useProjectStore from '../stores/projectStore';

const ProjectOrganizer = () => {
  const { currentProject, tracks, createProject, loadProject, saveProject } = useProjectStore();
  const [projects, setProjects] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name'); // name, date, size, type
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  
  // New project form
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    category: 'music',
    template: 'blank',
    bpm: 120,
    timeSignature: '4/4',
    sampleRate: '48000',
    bitDepth: '24'
  });
  
  // Template form
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'custom',
    includeTracks: true,
    includePlugins: true,
    includeSettings: true,
    includeAudio: false
  });
  
  useEffect(() => {
    loadProjects();
    loadTemplates();
  }, []);
  
  const loadProjects = () => {
    // Load projects from storage
    const mockProjects = [
      {
        id: 1,
        name: 'Rock Song Demo',
        description: 'A rock song with drums, bass, and guitars',
        category: 'music',
        lastModified: new Date('2024-01-15'),
        size: '245 MB',
        duration: '3:45',
        tracks: 12,
        bpm: 140,
        thumbnail: '/thumbnails/rock-song.jpg'
      },
      {
        id: 2,
        name: 'Film Score - Action Scene',
        description: 'Orchestral score for action sequence',
        category: 'film',
        lastModified: new Date('2024-01-20'),
        size: '512 MB',
        duration: '5:20',
        tracks: 24,
        bpm: 120,
        thumbnail: '/thumbnails/film-score.jpg'
      },
      {
        id: 3,
        name: 'Podcast Episode 12',
        description: 'Interview with audio engineer',
        category: 'podcast',
        lastModified: new Date('2024-01-22'),
        size: '128 MB',
        duration: '45:30',
        tracks: 4,
        bpm: 0,
        thumbnail: '/thumbnails/podcast.jpg'
      }
    ];
    
    setProjects(mockProjects);
  };
  
  const loadTemplates = () => {
    // Load templates from storage
    const mockTemplates = [
      {
        id: 'blank',
        name: 'Blank Project',
        description: 'Start with a completely empty project',
        category: 'basic',
        icon: '📄',
        tracks: [],
        settings: { bpm: 120, timeSignature: '4/4' }
      },
      {
        id: 'rock-band',
        name: 'Rock Band',
        description: 'Template for rock band recordings',
        category: 'music',
        icon: '🎸',
        tracks: [
          { name: 'Drums', type: 'audio', color: '#ef4444' },
          { name: 'Bass', type: 'audio', color: '#3b82f6' },
          { name: 'Rhythm Guitar', type: 'audio', color: '#10b981' },
          { name: 'Lead Guitar', type: 'audio', color: '#f59e0b' },
          { name: 'Vocals', type: 'audio', color: '#8b5cf6' },
          { name: 'Backing Vocals', type: 'audio', color: '#ec4899' }
        ],
        settings: { bpm: 120, timeSignature: '4/4' }
      },
      {
        id: 'orchestral',
        name: 'Orchestral',
        description: 'Template for orchestral compositions',
        category: 'film',
        icon: '🎻',
        tracks: [
          { name: 'Strings', type: 'midi', color: '#ef4444' },
          { name: 'Brass', type: 'midi', color: '#f59e0b' },
          { name: 'Woodwinds', type: 'midi', color: '#10b981' },
          { name: 'Percussion', type: 'midi', color: '#3b82f6' },
          { name: 'Harp', type: 'midi', color: '#8b5cf6' },
          { name: 'Choir', type: 'midi', color: '#ec4899' }
        ],
        settings: { bpm: 80, timeSignature: '4/4' }
      },
      {
        id: 'podcast',
        name: 'Podcast',
        description: 'Template for podcast production',
        category: 'podcast',
        icon: '🎙️',
        tracks: [
          { name: 'Host 1', type: 'audio', color: '#ef4444' },
          { name: 'Host 2', type: 'audio', color: '#3b82f6' },
          { name: 'Guest', type: 'audio', color: '#10b981' },
          { name: 'Music Bed', type: 'audio', color: '#8b5cf6' }
        ],
        settings: { bpm: 0, timeSignature: '4/4' }
      },
      {
        id: 'electronic',
        name: 'Electronic Music',
        description: 'Template for electronic music production',
        category: 'music',
        icon: '🎹',
        tracks: [
          { name: 'Kick', type: 'midi', color: '#ef4444' },
          { name: 'Snare', type: 'midi', color: '#f59e0b' },
          { name: 'Hi-Hats', type: 'midi', color: '#10b981' },
          { name: 'Bass', type: 'midi', color: '#3b82f6' },
          { name: 'Synth Lead', type: 'midi', color: '#8b5cf6' },
          { name: 'Synth Pad', type: 'midi', color: '#ec4899' },
          { name: 'FX', type: 'audio', color: '#6b7280' }
        ],
        settings: { bpm: 128, timeSignature: '4/4' }
      }
    ];
    
    setTemplates(mockTemplates);
  };
  
  const createNewProject = () => {
    const template = templates.find(t => t.id === newProject.template);
    const projectData = {
      id: Date.now(),
      name: newProject.name,
      description: newProject.description,
      category: newProject.category,
      created: new Date(),
      lastModified: new Date(),
      settings: {
        bpm: newProject.bpm,
        timeSignature: newProject.timeSignature,
        sampleRate: newProject.sampleRate,
        bitDepth: newProject.bitDepth
      },
      tracks: template ? [...template.tracks] : [],
      plugins: template && template.plugins ? [...template.plugins] : []
    };
    
    createProject(projectData);
    setShowCreateDialog(false);
    
    // Reset form
    setNewProject({
      name: '',
      description: '',
      category: 'music',
      template: 'blank',
      bpm: 120,
      timeSignature: '4/4',
      sampleRate: '48000',
      bitDepth: '24'
    });
  };
  
  const createTemplate = () => {
    if (!currentProject) return;
    
    const templateData = {
      id: Date.now().toString(),
      name: newTemplate.name,
      description: newTemplate.description,
      category: newTemplate.category,
      created: new Date(),
      tracks: newTemplate.includeTracks ? tracks : [],
      settings: newTemplate.includeSettings ? currentProject.settings : {},
      plugins: newTemplate.includePlugins ? currentProject.plugins : []
    };
    
    setTemplates([...templates, templateData]);
    setShowTemplateDialog(false);
    
    // Reset form
    setNewTemplate({
      name: '',
      description: '',
      category: 'custom',
      includeTracks: true,
      includePlugins: true,
      includeSettings: true,
      includeAudio: false
    });
  };
  
  const deleteProject = (projectId) => {
    setProjects(projects.filter(p => p.id !== projectId));
    if (selectedProject === projectId) {
      setSelectedProject(null);
    }
  };
  
  const duplicateProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    const duplicate = {
      ...project,
      id: Date.now(),
      name: `${project.name} (Copy)`,
      lastModified: new Date()
    };
    
    setProjects([...projects, duplicate]);
  };
  
  const exportProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    
    console.log('Exporting project:', project);
    // This would create and download a project file
  };
  
  const importProject = () => {
    console.log('Import project dialog');
    // This would open a file dialog and load a project file
  };
  
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || project.category === filterCategory;
    return matchesSearch && matchesCategory;
  });
  
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return b.lastModified - a.lastModified;
      case 'size':
        return parseInt(b.size) - parseInt(a.size);
      case 'type':
        return a.category.localeCompare(b.category);
      default:
        return 0;
    }
  });
  
  const categories = ['all', 'music', 'film', 'podcast', 'custom'];
  
  return (
    <div className="h-full w-full bg-gray-900 text-white flex flex-col">
      {/* Project Organizer Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Project Organizer</h2>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center space-x-2"
            >
              <FolderPlus size={16} />
              <span>New Project</span>
            </button>
            
            <button
              onClick={() => setShowTemplateDialog(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Create Template</span>
            </button>
            
            <button
              onClick={importProject}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded flex items-center space-x-2"
            >
              <Upload size={16} />
              <span>Import</span>
            </button>
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-gray-700 text-white pl-10 pr-3 py-2 rounded"
            />
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded"
          >
            <option value="name">Sort by Name</option>
            <option value="date">Sort by Date</option>
            <option value="size">Sort by Size</option>
            <option value="type">Sort by Type</option>
          </select>
          
          <div className="flex items-center space-x-1 bg-gray-700 rounded p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-blue-600' : 'hover:bg-gray-600'}`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Projects Display */}
      <div className="flex-1 overflow-auto p-4">
        {sortedProjects.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <FolderPlus size={48} className="mx-auto mb-4" />
            <p>No projects found</p>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            >
              Create New Project
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                selected={selectedProject === project.id}
                onSelect={() => setSelectedProject(project.id)}
                onLoad={() => loadProject(project.id)}
                onDelete={() => deleteProject(project.id)}
                onDuplicate={() => duplicateProject(project.id)}
                onExport={() => exportProject(project.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sortedProjects.map(project => (
              <ProjectListItem
                key={project.id}
                project={project}
                selected={selectedProject === project.id}
                onSelect={() => setSelectedProject(project.id)}
                onLoad={() => loadProject(project.id)}
                onDelete={() => deleteProject(project.id)}
                onDuplicate={() => duplicateProject(project.id)}
                onExport={() => exportProject(project.id)}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Templates Section */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <h3 className="text-lg font-semibold mb-3">Templates</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => {
                setNewProject(prev => ({ ...prev, template: template.id }));
                setShowCreateDialog(true);
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Create Project Dialog */}
      {showCreateDialog && (
        <CreateProjectDialog
          project={newProject}
          templates={templates}
          onChange={setNewProject}
          onSubmit={createNewProject}
          onCancel={() => setShowCreateDialog(false)}
        />
      )}
      
      {/* Create Template Dialog */}
      {showTemplateDialog && (
        <CreateTemplateDialog
          template={newTemplate}
          currentProject={currentProject}
          onChange={setNewTemplate}
          onSubmit={createTemplate}
          onCancel={() => setShowTemplateDialog(false)}
        />
      )}
    </div>
  );
};

const ProjectCard = ({ project, selected, onSelect, onLoad, onDelete, onDuplicate, onExport }) => {
  return (
    <div
      className={`bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all ${
        selected ? 'ring-2 ring-blue-500' : 'hover:bg-gray-700'
      }`}
      onClick={onSelect}
    >
      <div className="h-32 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
        <FolderPlus size={48} className="text-white/50" />
      </div>
      
      <div className="p-3">
        <h4 className="font-semibold truncate">{project.name}</h4>
        <p className="text-xs text-gray-400 truncate mb-2">{project.description}</p>
        
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{project.tracks} tracks</span>
          <span>{project.duration}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
          <span>{project.bpm} BPM</span>
          <span>{project.size}</span>
        </div>
        
        <div className="flex items-center space-x-1 mt-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLoad();
            }}
            className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
          >
            Open
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
          >
            <Copy size={12} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport();
            }}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
          >
            <Download size={12} />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectListItem = ({ project, selected, onSelect, onLoad, onDelete, onDuplicate, onExport }) => {
  return (
    <div
      className={`bg-gray-800 rounded-lg p-3 cursor-pointer transition-all flex items-center space-x-3 ${
        selected ? 'ring-2 ring-blue-500' : 'hover:bg-gray-700'
      }`}
      onClick={onSelect}
    >
      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center">
        <FolderPlus size={24} className="text-white/50" />
      </div>
      
      <div className="flex-1">
        <h4 className="font-semibold">{project.name}</h4>
        <p className="text-xs text-gray-400">{project.description}</p>
        <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
          <span>{project.tracks} tracks</span>
          <span>{project.duration}</span>
          <span>{project.bpm} BPM</span>
          <span>{project.size}</span>
          <span>{project.lastModified.toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLoad();
          }}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
        >
          Open
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
        >
          <Copy size={12} />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExport();
          }}
          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs"
        >
          <Download size={12} />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

const TemplateCard = ({ template, onSelect }) => {
  return (
    <div
      className="bg-gray-800 rounded-lg p-3 cursor-pointer hover:bg-gray-700 transition-all"
      onClick={onSelect}
    >
      <div className="text-2xl mb-2 text-center">{template.icon}</div>
      <h4 className="font-semibold text-center">{template.name}</h4>
      <p className="text-xs text-gray-400 text-center">{template.description}</p>
      <div className="text-xs text-gray-400 text-center mt-1">
        {template.tracks?.length || 0} tracks
      </div>
    </div>
  );
};

const CreateProjectDialog = ({ project, templates, onChange, onSubmit, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Create New Project</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project Name</label>
            <input
              type="text"
              value={project.name}
              onChange={(e) => onChange({ ...project, name: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              placeholder="Enter project name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={project.description}
              onChange={(e) => onChange({ ...project, description: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded h-20 resize-none"
              placeholder="Enter project description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={project.category}
              onChange={(e) => onChange({ ...project, category: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
            >
              <option value="music">Music</option>
              <option value="film">Film/Video</option>
              <option value="podcast">Podcast</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Template</label>
            <select
              value={project.template}
              onChange={(e) => onChange({ ...project, template: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">BPM</label>
              <input
                type="number"
                value={project.bpm}
                onChange={(e) => onChange({ ...project, bpm: parseInt(e.target.value) })}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Time Signature</label>
              <select
                value={project.timeSignature}
                onChange={(e) => onChange({ ...project, timeSignature: e.target.value })}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              >
                <option value="4/4">4/4</option>
                <option value="3/4">3/4</option>
                <option value="6/8">6/8</option>
                <option value="5/4">5/4</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Sample Rate</label>
              <select
                value={project.sampleRate}
                onChange={(e) => onChange({ ...project, sampleRate: e.target.value })}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              >
                <option value="44100">44.1 kHz</option>
                <option value="48000">48 kHz</option>
                <option value="88200">88.2 kHz</option>
                <option value="96000">96 kHz</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Bit Depth</label>
              <select
                value={project.bitDepth}
                onChange={(e) => onChange({ ...project, bitDepth: e.target.value })}
                className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              >
                <option value="16">16 bit</option>
                <option value="24">24 bit</option>
                <option value="32">32 bit</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onSubmit}
            disabled={!project.name}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded"
          >
            Create Project
          </button>
          
          <button
            onClick={onCancel}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateTemplateDialog = ({ template, currentProject, onChange, onSubmit, onCancel }) => {
  if (!currentProject) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <p className="text-gray-400">No project loaded to create template from.</p>
          <button
            onClick={onCancel}
            className="mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Create Template</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Template Name</label>
            <input
              type="text"
              value={template.name}
              onChange={(e) => onChange({ ...template, name: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
              placeholder="Enter template name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={template.description}
              onChange={(e) => onChange({ ...template, description: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded h-20 resize-none"
              placeholder="Enter template description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={template.category}
              onChange={(e) => onChange({ ...template, category: e.target.value })}
              className="w-full bg-gray-700 text-white px-3 py-2 rounded"
            >
              <option value="music">Music</option>
              <option value="film">Film/Video</option>
              <option value="podcast">Podcast</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Include in Template</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={template.includeTracks}
                  onChange={(e) => onChange({ ...template, includeTracks: e.target.checked })}
                  className="rounded"
                />
                <span>Track Configuration</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={template.includePlugins}
                  onChange={(e) => onChange({ ...template, includePlugins: e.target.checked })}
                  className="rounded"
                />
                <span>Plugin Settings</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={template.includeSettings}
                  onChange={(e) => onChange({ ...template, includeSettings: e.target.checked })}
                  className="rounded"
                />
                <span>Project Settings</span>
              </label>
              
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={template.includeAudio}
                  onChange={(e) => onChange({ ...template, includeAudio: e.target.checked })}
                  className="rounded"
                />
                <span>Audio Files (Warning: Large file size)</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="flex space-x-3 mt-6">
          <button
            onClick={onSubmit}
            disabled={!template.name}
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded"
          >
            Create Template
          </button>
          
          <button
            onClick={onCancel}
            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectOrganizer;
