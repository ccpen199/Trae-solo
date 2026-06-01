require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./database');
const { authMiddleware } = require('./middleware');

const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const environmentRoutes = require('./routes/environments');
const taskRoutes = require('./routes/tasks');
const versionRoutes = require('./routes/versions');
const alertRoutes = require('./routes/alerts');
const configRoutes = require('./routes/config');

const app = express();
const PORT = process.env.PORT || 56381;
const HOST = process.env.HOST || '127.0.0.1';

app.use(cors({
  origin: ['http://127.0.0.1:49381', 'http://localhost:49381'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);

app.use(authMiddleware);

app.use('/api/applications', applicationRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/versions', versionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/config', configRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.listen(PORT, HOST, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   数据库迁移工具后端服务已启动                              ║
║                                                            ║
║   地址: http://${HOST}:${PORT}/api                             ║
║   健康检查: http://${HOST}:${PORT}/api/health                 ║
║   数据库: ${db.name}                                        ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
