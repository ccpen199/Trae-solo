require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/match');
const postRoutes = require('./routes/posts');
const messageRoutes = require('./routes/messages');
require('./models/db');

const app = express();
const PORT = process.env.BACKEND_PORT || 47561;

app.use(helmet({
  contentSecurityPolicy: false
}));

app.use(cors({
  origin: ['http://localhost:47562', 'http://127.0.0.1:47562'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Soul App API is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/messages', messageRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Soul App Backend server is running on port ${PORT}`);
  console.log(`📡 API Base URL: http://localhost:${PORT}/api`);
});
