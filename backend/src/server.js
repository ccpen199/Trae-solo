require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

const roomsRouter = require('./routes/rooms');
const usersRouter = require('./routes/users');
const matchesRouter = require('./routes/matches');
const storiesRouter = require('./routes/stories');
const messagesRouter = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 47721;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:47722',
  credentials: true
}));

app.use(express.json());

initDatabase();

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use('/api/rooms', roomsRouter);
app.use('/api/users', usersRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/stories', storiesRouter);
app.use('/api/messages', messagesRouter);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 海龟汤后端服务已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
});
