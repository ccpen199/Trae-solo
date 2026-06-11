const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const authRoutes = require('./routes/auth');
const merchantRoutes = require('./routes/merchants');
const serviceRoutes = require('./routes/services');
const caseRoutes = require('./routes/cases');
const marketingRoutes = require('./routes/marketing');
const coupleRoutes = require('./routes/couple');
const reviewRoutes = require('./routes/reviews');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 59104;
const HOST = '127.0.0.1';

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://127.0.0.1:49104',
    'http://127.0.0.1:49104'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const logStream = fs.createWriteStream(path.join(__dirname, '../../backend.log'), { flags: 'a' });
app.use(morgan('combined', { stream: logStream }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT,
    frontend_url: process.env.FRONTEND_URL,
    backend_url: process.env.BACKEND_URL
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/couple', coupleRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

const checkPort = (port) => {
  return new Promise((resolve, reject) => {
    const { exec } = require('child_process');
    exec(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null | head -n1`, (error, stdout) => {
      if (stdout.trim()) {
        resolve(stdout.trim());
      } else {
        resolve(null);
      }
    });
  });
};

const startServer = async () => {
  const occupied = await checkPort(PORT);
  if (occupied) {
    const { exec } = require('child_process');
    exec(`ps -p ${occupied} -o pid=,ppid=,stat=,cwd=,command=`, (err, stdout) => {
      console.error(`ERROR: Port ${PORT} is already in use by PID ${occupied}`);
      console.error(`Process info: ${stdout.trim()}`);
      console.error(`Please stop the process first or change BACKEND_PORT in .env`);
      process.exit(1);
    });
    return;
  }

  app.listen(PORT, HOST, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║  婚庆服务本地化撮合平台 - 后端API服务已启动                  ║
╠══════════════════════════════════════════════════════════════╣
║  服务地址: http://127.0.0.1:${PORT}                         ║
║  健康检查: http://127.0.0.1:${PORT}/api/health              ║
║  API前缀:  http://127.0.0.1:${PORT}/api                     ║
║  前端地址: ${process.env.FRONTEND_URL}                      ║
╠══════════════════════════════════════════════════════════════╣
║  默认账号:                                                  ║
║  admin / 123456    - 系统管理员                             ║
║  couple1 / 123456  - 新人用户                               ║
║  merchant1 / 123456- 商家用户                               ║
║  manager1 / 123456 - 城市站长                               ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });
};

startServer();
