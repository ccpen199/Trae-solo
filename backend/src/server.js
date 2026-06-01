require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { initDatabase } = require('./models/database');
const { initDefaultUsers } = require('./controllers/authController');

const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const environmentRoutes = require('./routes/environments');
const configRoutes = require('./routes/configs');
const taskRoutes = require('./routes/tasks');
const logRoutes = require('./routes/logs');
const operationRoutes = require('./routes/operations');

const app = express();
const PORT = process.env.BACKEND_PORT || 53397;
const HOST = process.env.HOST || '127.0.0.1';

app.use(cors({
  origin: [`http://${HOST}:${process.env.FRONTEND_PORT || 43397}`, `http://127.0.0.1:${process.env.FRONTEND_PORT || 43397}`],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/environments', environmentRoutes);
app.use('/api/configs', configRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/operations', operationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'mfa-system-backend' });
});

app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

async function startServer() {
  try {
    initDatabase();
    initDefaultUsers();
    
    app.listen(PORT, HOST, () => {
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║           多因素认证系统 - 后端服务启动成功                   ║
╠══════════════════════════════════════════════════════════════╣
║  服务地址: http://${HOST}:${PORT}                             ║
║  健康检查: http://${HOST}:${PORT}/api/health                  ║
║  数据库: SQLite (./data/app.sqlite)                          ║
║  启动时间: ${new Date().toLocaleString()}                     ║
╚══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
