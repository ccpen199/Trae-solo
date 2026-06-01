require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./database');

const authRoutes = require('./routes/auth');
const newsRoutes = require('./routes/news');

const app = express();
const PORT = process.env.PORT || 54867;
const HOST = process.env.HOST || '127.0.0.1';

app.use(cors({
  origin: ['http://127.0.0.1:44867', 'http://localhost:44867'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/news', newsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

initDatabase();

app.listen(PORT, HOST, () => {
  console.log(`🚀 Backend server running at http://${HOST}:${PORT}`);
  console.log(`📊 API base: http://${HOST}:${PORT}/api`);
});
