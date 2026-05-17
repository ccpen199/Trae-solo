require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const translationRoutes = require('./routes/translation');
const simultaneousRoutes = require('./routes/simultaneous');
const cameraRoutes = require('./routes/camera');
const speakingRoutes = require('./routes/speaking');
const worldRoutes = require('./routes/world');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 48201;

app.use(cors({
  origin: ['http://localhost:48202', 'http://127.0.0.1:48202'],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(authenticateToken);

app.use('/api/auth', authRoutes);
app.use('/api/translation', translationRoutes);
app.use('/api/simultaneous', simultaneousRoutes);
app.use('/api/camera', cameraRoutes);
app.use('/api/speaking', speakingRoutes);
app.use('/api/world', worldRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Translation API is running', user: req.user });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '接口不存在'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API base URL: http://localhost:${PORT}/api`);
});
