require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { initDB, db } = require('./db');
const { fileLogger, consoleLogger } = require('./middleware/logger');
const { auth } = require('./middleware/auth');
const { detectNetworkStatus } = require('./middleware/networkDetector');

const devicesRouter = require('./routes/devices');
const catalogRouter = require('./routes/catalog');
const irRouter = require('./routes/ir');
const scenesRouter = require('./routes/scenes');
const schedulesRouter = require('./routes/schedules');
const statisticsRouter = require('./routes/statistics');
const adminRouter = require('./routes/admin');
const offlineRouter = require('./routes/offline');
const learningRouter = require('./routes/learning');
const bridgeRouter = require('./routes/bridge');

const app = express();
const PORT = process.env.BACKEND_PORT || process.env.PORT || 59081;
const HOST = process.env.HOST || '127.0.0.1';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://127.0.0.1:49081';
const CORS_ORIGINS = [
  CORS_ORIGIN,
  'http://127.0.0.1:49081',
  'http://localhost:49081'
];

initDB();

app.use(cors({
  origin(origin, callback) {
    if (!origin || CORS_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-Network-Status', 'X-Response-Time', 'X-Packet-Loss']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(detectNetworkStatus);
app.use(fileLogger);
app.use(consoleLogger);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    network: req.networkStatus,
    uptime: process.uptime()
  });
});

function getDemoUser() {
  return db.prepare('SELECT id, name, phone FROM users ORDER BY id LIMIT 1').get();
}

function sendDemoAuth(res, statusCode = 200) {
  const user = getDemoUser();
  if (!user) {
    return res.status(500).json({ error: 'Demo user is not initialized' });
  }

  return res.status(statusCode).json({
    token: `demo-token-${user.id}`,
    user,
    profile: user
  });
}

app.post('/api/auth/login', (req, res) => {
  sendDemoAuth(res);
});

app.post('/api/auth/register', (req, res) => {
  sendDemoAuth(res, 201);
});

app.get('/api/auth/me', auth, (req, res) => {
  res.json({ user: req.user });
});

app.get('/api/user/profile', auth, (req, res) => {
  res.json({ user: req.user, profile: req.user });
});

app.get('/api/users/profile', auth, (req, res) => {
  res.json({ user: req.user, profile: req.user });
});

app.get('/api/search', auth, (req, res) => {
  const keyword = String(req.query.q || req.query.keyword || '').trim();
  const like = `%${keyword}%`;
  const devices = db.prepare(`
    SELECT ud.id, ud.name, ud.room, dt.name as device_type, b.name as brand_name
    FROM user_devices ud
    JOIN device_types dt ON ud.device_type_id = dt.id
    JOIN brands b ON ud.brand_id = b.id
    WHERE ud.user_id = ? AND (? = '' OR ud.name LIKE ? OR ud.room LIKE ? OR dt.name LIKE ? OR b.name LIKE ?)
    ORDER BY ud.created_at DESC
    LIMIT 20
  `).all(req.user.id, keyword, like, like, like, like);
  const scenes = db.prepare(`
    SELECT id, name, description, icon, is_active
    FROM scenes
    WHERE user_id = ? AND (? = '' OR name LIKE ? OR description LIKE ?)
    ORDER BY created_at DESC
    LIMIT 20
  `).all(req.user.id, keyword, like, like);

  res.json({
    keyword,
    total: devices.length + scenes.length,
    devices,
    scenes
  });
});

app.use('/api/devices', auth, devicesRouter);
app.use('/api/device-types', catalogRouter);
app.use('/api/brands', catalogRouter);
app.use('/api/ir-code-models', catalogRouter);
app.use('/api/ir', auth, irRouter);
app.use('/api/scenes', auth, scenesRouter);
app.use('/api/schedules', auth, schedulesRouter);
app.use('/api/statistics', auth, statisticsRouter);
app.use('/api/admin', auth, adminRouter);
app.use('/api/offline', auth, offlineRouter);
app.use('/api/learning', auth, learningRouter);
app.use('/api/bridge', auth, bridgeRouter);

app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`IR Remote Backend running on http://${HOST}:${PORT}`);
  console.log(`CORS origin: ${CORS_ORIGIN}`);
  console.log(`Database: ${process.env.DATABASE_PATH}`);
});

function shutdown(signal) {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
