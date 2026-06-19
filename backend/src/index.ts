import express from 'express';
import cors from 'cors';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { getDb } from './db';
import { reportRiderLocation, getRiderById } from './services/riderService';
import { dispatchOrder } from './services/dispatchEngine';
import { getRealtimeMetrics } from './services/healthService';

import ridersRouter from './routes/riders';
import ordersRouter from './routes/orders';
import incomeRouter from './routes/income';
import complaintsRouter from './routes/complaints';
import healthRouter from './routes/health';
import predictionRouter from './routes/prediction';
import creditRouter from './routes/credit';

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;

  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    if (!process.env[key]) {
      process.env[key] = valueParts.join('=').replace(/^['"]|['"]$/g, '');
    }
  }
}

loadEnvFile(path.resolve(__dirname, '..', '..', '.env'));
loadEnvFile(path.resolve(__dirname, '..', '.env'));

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const HOST = process.env.HOST || process.env.BACKEND_HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || process.env.BACKEND_PORT || 59245);

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ code: 0, data: { status: 'ok', timestamp: Math.floor(Date.now() / 1000) } });
});

app.use('/api/riders', ridersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/income', incomeRouter);
app.use('/api/complaints', complaintsRouter);
app.use('/api/health-monitor', healthRouter);
app.use('/api/prediction', predictionRouter);
app.use('/api/credit', creditRouter);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('rider:reportLocation', (data) => {
    const { rider_id, lat, lng, speed, heading, accuracy } = data;
    if (!rider_id || lat === undefined || lng === undefined) return;

    const location = reportRiderLocation(rider_id, lat, lng, speed, heading, accuracy);
    io.emit('rider:locationUpdate', { rider_id, location });
  });

  socket.on('rider:goOnline', (data) => {
    const { rider_id, lat, lng } = data;
    const { updateRiderStatus } = require('./services/riderService');
    updateRiderStatus(rider_id, 'online');
    if (lat && lng) {
      reportRiderLocation(rider_id, lat, lng);
    }
    io.emit('rider:statusChange', { rider_id, status: 'online' });
  });

  socket.on('rider:goOffline', (data) => {
    const { rider_id } = data;
    const { updateRiderStatus } = require('./services/riderService');
    updateRiderStatus(rider_id, 'offline');
    io.emit('rider:statusChange', { rider_id, status: 'offline' });
  });

  socket.on('order:new', (data) => {
    io.emit('order:newOrder', data);
    if (data.id) {
      const candidates = dispatchOrder(data.id);
      io.emit('order:dispatchResult', { order_id: data.id, candidates });
    }
  });

  socket.on('order:statusUpdate', (data) => {
    io.emit('order:statusChange', data);
  });

  socket.on('admin:subscribe', () => {
    const metrics = getRealtimeMetrics();
    socket.emit('admin:realtimeMetrics', metrics);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

setInterval(() => {
  const metrics = getRealtimeMetrics();
  io.emit('admin:realtimeMetrics', metrics);
}, 5000);

getDb();

server.listen(PORT, HOST, () => {
  console.log(`Delivery dispatch server running on ${HOST}:${PORT}`);
  console.log(`API: http://${HOST}:${PORT}/api`);
  console.log(`Socket.IO: ws://${HOST}:${PORT}`);
});

export { io };
