require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const port = parseInt(process.env.BACKEND_PORT) || 59008;

const app = express();

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 49008}`,
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

const logDir = path.join(__dirname, '..');
const accessLog = fs.createWriteStream(path.join(logDir, 'backend.log'), { flags: 'a' });

app.use((req, res, next) => {
  const ts = new Date().toISOString();
  accessLog.write(`[${ts}] ${req.method} ${req.url} ${res.statusCode}\n`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: Date.now(),
      uptime: process.uptime()
    }
  });
});

app.use('/api/devices', require('./routes/devices'));
app.use('/api/homes', require('./routes/homes'));
app.use('/api/scenes', require('./routes/scenes'));
app.use('/api/energy', require('./routes/energy'));
app.use('/api/voice', require('./routes/voice'));
app.use('/api/admin', require('./routes/admin'));

const db = require('./database');
app.get('/api/rooms', (req, res) => {
  const rooms = db.prepare(`
    SELECT r.*, 
      (SELECT COUNT(*) FROM devices d WHERE d.room_id = r.id) as device_count,
      (SELECT COALESCE(SUM(total_consumption), 0) FROM energy_meters em WHERE em.room_id = r.id) as energy_usage
    FROM rooms r 
    ORDER BY topology_order ASC
  `).all();
  res.json({ success: true, data: rooms });
});

app.use((err, req, res, next) => {
  console.error('[API Error]', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    path: req.path
  });
});

const server = app.listen(port, '127.0.0.1', () => {
  console.log(`🚀 AIoT Hub Backend running on http://127.0.0.1:${port}`);
  console.log(`📡 API Base URL: http://127.0.0.1:${port}/api`);
  console.log(`💾 Health check: http://127.0.0.1:${port}/api/health`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => process.exit(0));
});
