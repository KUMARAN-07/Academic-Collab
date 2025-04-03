require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error'
  });
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/academic-collab', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((error) => {
  console.error('MongoDB connection error:', error);
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('joinProject', (projectId) => {
    socket.join(`project-${projectId}`);
  });

  socket.on('leaveProject', (projectId) => {
    socket.leave(`project-${projectId}`);
  });

  socket.on('projectUpdate', (data) => {
    socket.to(`project-${data.projectId}`).emit('projectUpdated', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});