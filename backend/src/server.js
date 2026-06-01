require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const net = require('net');
const { authenticate } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const domainRoutes = require('./routes/domains');
const certRoutes = require('./routes/certificates');
const taskRoutes = require('./routes/tasks');
const logRoutes = require('./routes/logs');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.SERVER_PORT || 5174;
const HOST = process.env.SERVER_HOST || '0.0.0.0';

app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

const checkPort = (port, host) => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`端口 ${port} 已被占用`));
      } else {
        reject(err);
      }
    });
    server.once('listening', () => {
      server.close();
      resolve();
    });
    server.listen(port, host);
  });
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/domains', authenticate, domainRoutes);
app.use('/api/certificates', authenticate, certRoutes);
app.use('/api/tasks', authenticate, taskRoutes);
app.use('/api/logs', authenticate, logRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

const startServer = async () => {
  try {
    await checkPort(PORT, HOST);
    console.log(`端口 ${PORT} 可用`);
    
    app.listen(PORT, HOST, () => {
      console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   SSL 证书管理系统 - 后端服务                            ║
║                                                          ║
║   服务地址: http://${HOST}:${PORT}                        ║
║   健康检查: http://${HOST}:${PORT}/api/health             ║
║   API 前缀: /api                                         ║
║                                                          ║
║   默认账号: admin / admin123                             ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error(`启动失败: ${error.message}`);
    process.exit(1);
  }
};

startServer();
