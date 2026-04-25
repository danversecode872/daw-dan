import React, { useState, useEffect, useRef } from 'react';
import { Cloud, Users, Download, Upload, Share2, Lock, Unlock, MessageSquare, Video, FileAudio, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import useProjectStore from '../stores/projectStore';

const CollaborationHub = () => {
  const { currentProject, tracks, saveProject, loadProject } = useProjectStore();
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [collaborationSessions, setCollaborationSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [sessionCode, setSessionCode] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sharedStems, setSharedStems] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [cloudProjects, setCloudProjects] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  // WebSocket connection for real-time collaboration
  const wsConnection = useRef(null);
  const localUserId = useRef(`user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  
  useEffect(() => {
    initializeCollaboration();
    loadCloudProjects();
    
    return () => {
      if (wsConnection.current) {
        wsConnection.current.close();
      }
    };
  }, []);
  
  const initializeCollaboration = () => {
    // Initialize WebSocket connection for real-time collaboration
    console.log('Initializing collaboration hub');
    
    // Mock WebSocket connection
    wsConnection.current = {
      send: (data) => {
        console.log('WebSocket send:', JSON.parse(data));
        simulateCollaborationResponse(JSON.parse(data));
      },
      close: () => {
        console.log('WebSocket connection closed');
      }
    };
  };
  
  const simulateCollaborationResponse = (data) => {
    // Simulate server responses for demo purposes
    switch (data.type) {
      case 'create-session':
        const newSession = {
          id: `session-${Date.now()}`,
          code: generateSessionCode(),
          host: localUserId.current,
          participants: [localUserId.current],
          createdAt: new Date().toISOString(),
          projectId: currentProject?.id,
          projectName: currentProject?.name || 'Untitled Project'
        };
        
        setActiveSession(newSession);
        setIsHost(true);
        setSessionCode(newSession.code);
        setCollaborationSessions([...collaborationSessions, newSession]);
        
        // Add host to connected users
        setConnectedUsers([{
          id: localUserId.current,
          name: 'You',
          role: 'host',
          status: 'online',
          cursor: { track: 0, time: 0 },
          color: '#3b82f6'
        }]);
        break;
        
      case 'join-session':
        if (data.sessionCode === sessionCode) {
          const newUser = {
            id: `user-${Date.now()}`,
            name: data.userName || 'Collaborator',
            role: 'participant',
            status: 'online',
            cursor: { track: 0, time: 0 },
            color: generateUserColor()
          };
          
          setConnectedUsers([...connectedUsers, newUser]);
          
          // Notify other users
          broadcastMessage({
            type: 'user-joined',
            user: newUser
          });
        }
        break;
        
      case 'chat-message':
        const message = {
          id: Date.now(),
          userId: localUserId.current,
          userName: 'You',
          content: data.content,
          timestamp: new Date().toISOString()
        };
        
        setChatMessages([...chatMessages, message]);
        broadcastMessage(message);
        break;
        
      case 'cursor-move':
        // Update user cursor position
        setConnectedUsers(users => users.map(user => 
          user.id === localUserId.current 
            ? { ...user, cursor: data.cursor }
            : user
        ));
        break;
        
      case 'track-change':
        // Handle track changes from collaborators
        broadcastMessage({
          type: 'track-updated',
          trackId: data.trackId,
          changes: data.changes,
          userId: localUserId.current
        });
        break;
    }
  };
  
  const loadCloudProjects = () => {
    // Load projects from cloud storage
    const mockCloudProjects = [
      {
        id: 'cloud-1',
        name: 'Rock Song - Collaboration',
        description: 'Rock song with multiple collaborators',
        lastModified: new Date('2024-01-20'),
        size: '245 MB',
        collaborators: 3,
        shared: true,
        ownerId: 'user-123',
        ownerName: 'John Producer'
      },
      {
        id: 'cloud-2',
        name: 'Film Score - Action Scene',
        description: 'Orchestral score for action sequence',
        lastModified: new Date('2024-01-22'),
        size: '512 MB',
        collaborators: 5,
        shared: true,
        ownerId: 'user-456',
        ownerName: 'Sarah Composer'
      },
      {
        id: 'cloud-3',
        name: 'Podcast Episode 12',
        description: 'Interview with audio engineer',
        lastModified: new Date('2024-01-25'),
        size: '128 MB',
        collaborators: 2,
        shared: false,
        ownerId: localUserId.current,
        ownerName: 'You'
      }
    ];
    
    setCloudProjects(mockCloudProjects);
  };
  
  const createCollaborationSession = () => {
    if (!currentProject) {
      alert('Please open a project first');
      return;
    }
    
    wsConnection.current.send(JSON.stringify({
      type: 'create-session',
      projectId: currentProject.id,
      projectName: currentProject.name,
      userId: localUserId.current
    }));
  };
  
  const joinCollaborationSession = (code, userName) => {
    wsConnection.current.send(JSON.stringify({
      type: 'join-session',
      sessionCode: code,
      userName: userName || 'Collaborator',
      userId: localUserId.current
    }));
  };
  
  const leaveCollaborationSession = () => {
    if (activeSession) {
      wsConnection.current.send(JSON.stringify({
        type: 'leave-session',
        sessionId: activeSession.id,
        userId: localUserId.current
      }));
      
      setActiveSession(null);
      setIsHost(false);
      setSessionCode('');
      setConnectedUsers([]);
      setChatMessages([]);
    }
  };
  
  const inviteCollaborator = (email) => {
    const invite = {
      id: Date.now(),
      email,
      sessionCode: sessionCode,
      projectName: currentProject?.name || 'Untitled Project',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    setPendingInvites([...pendingInvites, invite]);
    
    // Send invite (in real implementation, this would send an email)
    console.log('Inviting collaborator:', invite);
  };
  
  const broadcastMessage = (message) => {
    if (wsConnection.current && activeSession) {
      wsConnection.current.send(JSON.stringify({
        ...message,
        sessionId: activeSession.id,
        timestamp: new Date().toISOString()
      }));
    }
  };
  
  const sendChatMessage = () => {
    if (newMessage.trim()) {
      wsConnection.current.send(JSON.stringify({
        type: 'chat-message',
        content: newMessage,
        userId: localUserId.current
      }));
      
      setNewMessage('');
    }
  };
  
  const uploadProjectToCloud = async () => {
    if (!currentProject) return;
    
    setUploadProgress(0);
    
    // Simulate upload progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setUploadProgress(i);
    }
    
    console.log('Project uploaded to cloud');
    setUploadProgress(0);
  };
  
  const downloadProjectFromCloud = async (projectId) => {
    setDownloadProgress(0);
    
    // Simulate download progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setDownloadProgress(i);
    }
    
    console.log('Project downloaded from cloud');
    setDownloadProgress(0);
  };
  
  const exportStems = async () => {
    if (!currentProject) return;
    
    console.log('Exporting stems for collaboration...');
    
    // Simulate stem export
    const stems = tracks.map(track => ({
      trackId: track.id,
      trackName: track.name,
      fileName: `${track.name.replace(/\s+/g, '_')}.wav`,
      size: Math.floor(Math.random() * 50000000) + 10000000, // 10-60MB
      url: `https://cloud.dawdan.com/stems/${track.id}.wav`
    }));
    
    setSharedStems(stems);
    
    // Upload stems to cloud
    for (let i = 0; i <= 100; i += 2) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('Stems uploaded and shared');
  };
  
  const generateSessionCode = () => {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  };
  
  const generateUserColor = () => {
    const colors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes.toFixed(0) + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };
  
  return (
    <div className="h-full w-full bg-gray-900 text-white flex flex-col">
      {/* Collaboration Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center space-x-2">
            <Cloud size={24} />
            <span>Collaboration Hub</span>
          </h2>
          
          <div className="flex items-center space-x-2">
            {activeSession ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Session Active</span>
                </div>
                
                <span className="text-sm font-mono bg-gray-700 px-2 py-1 rounded">
                  {sessionCode}
                </span>
                
                <button
                  onClick={leaveCollaborationSession}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                >
                  Leave Session
                </button>
              </div>
            ) : (
              <button
                onClick={createCollaborationSession}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded flex items-center space-x-2"
              >
                <Users size={16} />
                <span>Create Session</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Active Session Info */}
        {activeSession && (
          <div className="bg-blue-900/20 border border-blue-600 rounded p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-medium">{activeSession.projectName}</span>
                <span className="text-sm text-gray-400">
                  {connectedUsers.length} collaborators
                </span>
                {isHost && (
                  <span className="text-xs bg-blue-600 px-2 py-1 rounded">Host</span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={exportStems}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
                >
                  Share Stems
                </button>
                
                <button
                  onClick={() => {
                    const email = prompt('Enter collaborator email:');
                    if (email) inviteCollaborator(email);
                  }}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm flex items-center space-x-1"
                >
                  <Share2 size={12} />
                  <span>Invite</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Collaboration Panel */}
        <div className="w-1/3 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
          {/* Connected Users */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Users size={16} />
              <span>Connected Users</span>
            </h3>
            
            <div className="space-y-2">
              {connectedUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between bg-gray-700 rounded p-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: user.color }}
                    ></div>
                    <div>
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-xs text-gray-400">{user.role}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-gray-400">Online</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Chat */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <MessageSquare size={16} />
              <span>Chat</span>
            </h3>
            
            <div className="bg-gray-700 rounded p-3 h-64 overflow-y-auto mb-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm">
                  No messages yet
                </div>
              ) : (
                <div className="space-y-2">
                  {chatMessages.map(message => (
                    <div key={message.id} className="text-sm">
                      <div className="font-medium text-blue-400">
                        {message.userName}
                      </div>
                      <div className="text-gray-300">{message.content}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Type a message..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm"
              />
              <button
                onClick={sendChatMessage}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                Send
              </button>
            </div>
          </div>
          
          {/* Shared Stems */}
          {sharedStems.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                <FileAudio size={16} />
                <span>Shared Stems</span>
              </h3>
              
              <div className="space-y-2">
                {sharedStems.map(stem => (
                  <div key={stem.trackId} className="bg-gray-700 rounded p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{stem.trackName}</div>
                        <div className="text-xs text-gray-400">
                          {formatFileSize(stem.size)}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => console.log('Download stem:', stem.url)}
                        className="p-1 bg-blue-600 hover:bg-blue-700 rounded"
                        title="Download Stem"
                      >
                        <Download size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Cloud Projects */}
        <div className="w-1/3 bg-gray-850 border-r border-gray-700 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-3">Cloud Projects</h3>
          
          <div className="mb-4">
            <button
              onClick={uploadProjectToCloud}
              disabled={uploadProgress > 0}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded flex items-center justify-center space-x-2"
            >
              <Upload size={16} />
              <span>{uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : 'Upload Project'}</span>
            </button>
          </div>
          
          {uploadProgress > 0 && (
            <div className="mb-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            {cloudProjects.map(project => (
              <div key={project.id} className="bg-gray-700 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{project.name}</h4>
                  <div className="flex items-center space-x-1">
                    {project.shared ? (
                      <Unlock size={14} className="text-green-400" title="Shared" />
                    ) : (
                      <Lock size={14} className="text-gray-400" title="Private" />
                    )}
                  </div>
                </div>
                
                <p className="text-xs text-gray-400 mb-2">{project.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <span>{project.collaborators} collaborators</span>
                  <span>{project.size}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    by {project.ownerName}
                  </span>
                  
                  <button
                    onClick={() => downloadProjectFromCloud(project.id)}
                    disabled={downloadProgress > 0}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-xs"
                  >
                    {downloadProgress > 0 ? `${downloadProgress}%` : 'Download'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {downloadProgress > 0 && (
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Session Management */}
        <div className="w-1/3 bg-gray-800 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-3">Session Management</h3>
          
          {!activeSession ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Join Session</label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Enter session code"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  />
                  <input
                    type="text"
                    placeholder="Your name"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded"
                  />
                  <button
                    onClick={() => {
                      const code = prompt('Enter session code:');
                      const name = prompt('Enter your name:');
                      if (code && name) {
                        joinCollaborationSession(code, name);
                      }
                    }}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
                  >
                    Join Session
                  </button>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-4">
                <h4 className="font-medium mb-2">Recent Sessions</h4>
                <div className="space-y-2">
                  {collaborationSessions.slice(0, 5).map(session => (
                    <div key={session.id} className="bg-gray-700 rounded p-2">
                      <div className="font-medium text-sm">{session.projectName}</div>
                      <div className="text-xs text-gray-400">
                        {session.participants.length} participants
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-700 rounded p-3">
                <h4 className="font-medium mb-2">Active Session</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Project:</span>
                    <span>{activeSession.projectName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Code:</span>
                    <span className="font-mono">{sessionCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Started:</span>
                    <span>{new Date(activeSession.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Host:</span>
                    <span>{isHost ? 'You' : 'Another user'}</span>
                  </div>
                </div>
              </div>
              
              {isHost && (
                <div>
                  <h4 className="font-medium mb-2">Host Controls</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        const code = prompt('Share this session code:', sessionCode);
                      }}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      Copy Session Code
                    </button>
                    
                    <button
                      onClick={() => {
                        broadcastMessage({
                          type: 'session-lock',
                          locked: true
                        });
                      }}
                      className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-sm"
                    >
                      Lock Session
                    </button>
                    
                    <button
                      onClick={() => {
                        broadcastMessage({
                          type: 'save-project',
                          force: true
                        });
                      }}
                      className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm"
                    >
                      Save Project for All
                    </button>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-medium mb-2">Session Activity</h4>
                <div className="bg-gray-700 rounded p-3 h-32 overflow-y-auto text-xs text-gray-400">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <CheckCircle size={12} className="text-green-400" />
                      <span>Session started</span>
                      <span className="text-gray-500">Just now</span>
                    </div>
                    {connectedUsers.slice(1).map(user => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Users size={12} className="text-blue-400" />
                        <span>{user.name} joined</span>
                        <span className="text-gray-500">Just now</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationHub;
