require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

require('./database/db');

const app = express();
const PORT = process.env.BACKEND_PORT || 58832;

app.use(cors({
  origin: ['http://127.0.0.1:48832', 'http://localhost:48832'],
  credentials: true
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({ 
    message: '学生综合素质评价系统后端 API',
    docs: '请访问前端页面: http://127.0.0.1:48832',
    health: '/api/health'
  });
});

const userRoutes = require('./routes/users');
const studentRoutes = require('./routes/students');
const dimensionRoutes = require('./routes/dimensions');
const recordRoutes = require('./routes/records');
const appealRoutes = require('./routes/appeals');
const archiveRoutes = require('./routes/archives');
const statsRoutes = require('./routes/stats');

app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/dimensions', dimensionRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/appeals', appealRoutes);
app.use('/api/archives', archiveRoutes);
app.use('/api/stats', statsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`后端服务运行在 http://127.0.0.1:${PORT}`);
  console.log(`健康检查: http://127.0.0.1:${PORT}/api/health`);
});

module.exports = app;
