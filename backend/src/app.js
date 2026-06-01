require('dotenv').config({ path: '../.env' });
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { initDatabase, seedData } = require('./database/init');
const { antiBrushMiddleware } = require('./middleware/antibrush');

const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resumes');
const jobRoutes = require('./routes/jobs');
const chatRoutes = require('./routes/chat');
const recRoutes = require('./routes/recommendations');
const liveRoutes = require('./routes/live');
const communityRoutes = require('./routes/communities');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

const BACKEND_PORT = parseInt(process.env.BACKEND_PORT) || 56784;
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT) || 46784;

app.use(cors({
  origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(antiBrushMiddleware);

app.use('/uploads', express.static(path.join(__dirname, '../../data/uploads')));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/recommendations', recRoutes);
app.use('/api/live', liveRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const io = require('socket.io')(server, {
  cors: {
    origin: [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`],
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  socket.on('join_live', (liveId) => {
    socket.join(`live_${liveId}`);
    console.log(`Socket ${socket.id} joined live ${liveId}`);
  });

  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
  });

  socket.on('leave_live', (liveId) => {
    socket.leave(`live_${liveId}`);
  });

  socket.on('typing', ({ chatId, userId, isTyping }) => {
    socket.to(`chat_${chatId}`).emit('user_typing', { userId, isTyping });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

module.exports = { io };

async function startServer() {
  try {
    initDatabase();
    seedData();
    
    server.listen(BACKEND_PORT, '127.0.0.1', () => {
      console.log(`\n========================================`);
      console.log(`🚀 JobMatch Backend Server`);
      console.log(`📡 Address: http://127.0.0.1:${BACKEND_PORT}`);
      console.log(`📊 Health: http://127.0.0.1:${BACKEND_PORT}/api/health`);
      console.log(`💾 Database: ${path.resolve(__dirname, '../../data/app.sqlite')}`);
      console.log(`========================================\n`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}
