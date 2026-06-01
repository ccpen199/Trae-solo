const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '../..');
const ENV_PATH = path.join(PROJECT_ROOT, '.env');
require('dotenv').config({ path: ENV_PATH });

const authRoutes = require('./routes/auth');
const regionRoutes = require('./routes/regions');
const homeRoutes = require('./routes/home');
const jobRoutes = require('./routes/jobs');
const propertyRoutes = require('./routes/properties');
const carRoutes = require('./routes/cars');
const newsRoutes = require('./routes/news');
const adminRoutes = require('./routes/admin');

const app = express();
const HOST = '127.0.0.1';

const logStream = fs.createWriteStream(path.join(PROJECT_ROOT, 'backend.log'), { flags: 'a' });
let activeBackendPort = parseInt(process.env.BACKEND_PORT || 56787, 10);

app.use(helmet());
app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 46787}`,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: logStream }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: activeBackendPort,
    service: 'local-life-platform-backend'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误', message: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

const checkPort = (port, callback) => {
  const net = require('net');
  const server = net.createServer();
  server.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      callback(false);
    } else {
      callback(true);
    }
  });
  server.once('listening', () => {
    server.close();
    callback(true);
  });
  server.listen(port, HOST);
};

const slots = [0, 1, 2, 3, 4, 5];
const tail4 = parseInt(process.env.TAIL4 || 6787);
let slotIndex = parseInt(process.env.PORT_SLOT || 0);

const portsForSlot = (slotIdx) => ({
  frontendPort: 40000 + slotIdx * 1000 + tail4,
  backendPort: 50000 + slotIdx * 1000 + tail4
});

const writeEnvPorts = (slotIdx, backendPort, frontendPort) => {
  let envContent = fs.readFileSync(ENV_PATH, 'utf8');
  const replacements = {
    FRONTEND_PORT: frontendPort,
    BACKEND_PORT: backendPort,
    PORT_SLOT: slotIdx,
    VITE_API_BASE_URL: `http://127.0.0.1:${backendPort}/api`
  };

  Object.entries(replacements).forEach(([key, value]) => {
    const pattern = new RegExp(`^${key}=.*$`, 'm');
    const line = `${key}=${value}`;
    envContent = pattern.test(envContent)
      ? envContent.replace(pattern, line)
      : `${envContent.trimEnd()}\n${line}\n`;
  });

  fs.writeFileSync(ENV_PATH, envContent);
};

const tryStart = (slotIdx) => {
  if (slotIdx >= slots.length) {
    console.error('所有端口槽位均被占用，请检查并释放端口后重试');
    process.exit(1);
  }
  const { frontendPort, backendPort } = portsForSlot(slotIdx);
  checkPort(backendPort, (available) => {
    if (available) {
      activeBackendPort = backendPort;
      if (
        slotIdx !== slotIndex ||
        String(process.env.BACKEND_PORT) !== String(backendPort) ||
        String(process.env.FRONTEND_PORT) !== String(frontendPort) ||
        process.env.VITE_API_BASE_URL !== `http://127.0.0.1:${backendPort}/api`
      ) {
        writeEnvPorts(slotIdx, backendPort, frontendPort);
        console.log(`端口${backendPort}，槽位${slotIdx}`);
      }
      app.listen(backendPort, HOST, () => {
        console.log(`后端服务已启动: http://${HOST}:${backendPort}`);
        console.log(`健康检查: http://${HOST}:${backendPort}/api/health`);
      });
    } else {
      console.log(`端口${backendPort}，尝试下一个槽位...`);
      tryStart(slotIdx + 1);
    }
  });
};

tryStart(slotIndex);

module.exports = app;
