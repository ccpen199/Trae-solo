import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '46792');
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '56792');
const DATABASE_PATH = process.env.DATABASE_PATH || './data/app.sqlite';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: `http://127.0.0.1:${FRONTEND_PORT}`,
    methods: ['GET', 'POST']
  }
});

app.use(helmet({
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: `http://127.0.0.1:${FRONTEND_PORT}`,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const dbPath = join(__dirname, '..', DATABASE_PATH);
const dbDir = join(__dirname, '..', 'data');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

import deviceRoutes from './routes/devices.js';
import panelRoutes from './routes/panels.js';
import epgRoutes from './routes/epg.js';
import analyticsRoutes from './routes/analytics.js';
import sdkRoutes from './routes/sdk.js';
import authRoutes from './routes/auth.js';
import controlRoutes from './routes/control.js';

app.use('/api/devices', deviceRoutes(db));
app.use('/api/panels', panelRoutes(db));
app.use('/api/epg', epgRoutes(db));
app.use('/api/analytics', analyticsRoutes(db));
app.use('/api/sdk', sdkRoutes(db));
app.use('/api/auth', authRoutes(db));
app.use('/api/control', controlRoutes(db, io));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: BACKEND_PORT
  });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('device:control', (data) => {
    console.log('Device control request:', data);
    io.emit('device:status', { deviceId: data.deviceId, status: 'online' });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

httpServer.listen(BACKEND_PORT, '127.0.0.1', () => {
  console.log(`Server running on http://127.0.0.1:${BACKEND_PORT}`);
  console.log(`Database: ${dbPath}`);
  console.log(`PID: ${process.pid}`);
});

export { app, io, db };
