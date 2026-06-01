require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const net = require('net');
const { initDatabase } = require('./database/schema');

const authRoutes = require('./routes/auth');
const credentialRoutes = require('./routes/credentials');
const teamRoutes = require('./routes/teams');
const accessRoutes = require('./routes/access');
const rotationRoutes = require('./routes/rotation');
const incidentRoutes = require('./routes/incidents');

const PORT = parseInt(process.env.BACKEND_PORT) || 3001;

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        reject(err);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

async function startServer() {
  const portAvailable = await checkPort(PORT);
  if (!portAvailable) {
    console.error(`端口 ${PORT} 已被占用，请检查并释放端口或修改 .env 中的 BACKEND_PORT`);
    process.exit(1);
  }

  initDatabase();
  
  const app = express();
  
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/auth', authRoutes);
  app.use('/api/credentials', credentialRoutes);
  app.use('/api/teams', teamRoutes);
  app.use('/api/access', accessRoutes);
  app.use('/api/rotation', rotationRoutes);
  app.use('/api/incidents', incidentRoutes);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
  });

  app.use((req, res) => {
    res.status(404).json({ error: '接口不存在' });
  });

  app.listen(PORT, () => {
    console.log(`🚀 密码保险库后端服务已启动`);
    console.log(`📍 地址: http://localhost:${PORT}`);
    console.log(`🔍 健康检查: http://localhost:${PORT}/api/health`);
  });
}

startServer().catch(err => {
  console.error('启动失败:', err);
  process.exit(1);
});
