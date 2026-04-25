const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Serve static files from the web build directory
app.use(express.static(path.join(__dirname, 'web-dist')));
app.use(express.json());

// API routes for DAW functionality
app.get('/api/health', (req, res) => {
  res.json({ status: 'DAW Dan Web Server Running', timestamp: new Date().toISOString() });
});

// File upload routes
app.post('/api/upload-audio', (req, res) => {
  // Handle audio file uploads
  res.json({ message: 'Audio upload endpoint - implement file handling' });
});

app.post('/api/save-project', (req, res) => {
  // Handle project saving
  const projectData = req.body;
  res.json({ message: 'Project saved', projectId: Date.now() });
});

app.get('/api/load-project/:id', (req, res) => {
  // Handle project loading
  const projectId = req.params.id;
  res.json({ message: 'Project loaded', projectId });
});

// WebSocket for real-time collaboration
io.on('connection', (socket) => {
  console.log('User connected to DAW Dan collaboration');
  
  socket.on('join-session', (sessionId) => {
    socket.join(sessionId);
    socket.emit('joined-session', { sessionId });
  });
  
  socket.on('audio-data', (data) => {
    socket.to(data.sessionId).emit('audio-data', data);
  });
  
  socket.on('project-update', (data) => {
    socket.to(data.sessionId).emit('project-update', data);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected from DAW Dan collaboration');
  });
});

// Serve the main web app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'web-dist', 'index.html'));
});

// Start server
server.listen(PORT, () => {
  console.log(`🎵 DAW Dan Web Server running on port ${PORT}`);
  console.log(`🌐 Open http://localhost:${PORT} to start using DAW Dan`);
  console.log(`🚀 Ready for Cascade integration!`);
});

module.exports = { app, server, io };
