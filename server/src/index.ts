import express from 'express';
import cors from 'cors';
import http from 'http';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';

import devicesRouter from './routes/devices';
import alertsRouter from './routes/alerts';
import scenesRouter from './routes/scenes';
import usersRouter from './routes/users';
import storageRouter from './routes/storage';
import otaRouter from './routes/ota';
import auditRouter from './routes/audit';
import healthRouter from './routes/health';

function loadRootEnv() {
  const envPath = path.resolve(__dirname, '../../.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadRootEnv();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

app.use('/api/devices', devicesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/scenes', scenesRouter);
app.use('/api/users', usersRouter);
app.use('/api/storage', storageRouter);
app.use('/api/ota', otaRouter);
app.use('/api/audit', auditRouter);
app.use('/api/health', healthRouter);

app.get('/api/health-check', (req, res) => {
  res.json({ code: 0, message: 'OK', timestamp: new Date().toISOString() });
});

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
  });

  ws.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));

  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        })
      );
    }
  }, 30000);
});

const HOST = process.env.BACKEND_HOST || process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59223);

server.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`API base: http://${HOST}:${PORT}/api`);
  console.log(`WebSocket: ws://${HOST}:${PORT}`);
});
