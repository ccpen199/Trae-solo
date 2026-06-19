import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { getDb } from './db';
import authRoutes from './routes/auth';
import deviceRoutes from './routes/devices';
import orderRoutes from './routes/orders';
import reservationRoutes from './routes/reservations';
import workOrderRoutes from './routes/workorders';
import analyticsRoutes from './routes/analytics';
import rewardsRoutes from './routes/rewards';
import adminRoutes from './routes/admin';

const PORT = 3001;

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

getDb();

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join:device', (deviceId: string) => {
    socket.join(`device:${deviceId}`);
    console.log(`Socket ${socket.id} joined device:${deviceId}`);
  });

  socket.on('leave:device', (deviceId: string) => {
    socket.leave(`device:${deviceId}`);
    console.log(`Socket ${socket.id} left device:${deviceId}`);
  });

  socket.on('join:user', (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined user:${userId}`);
  });

  socket.on('leave:user', (userId: string) => {
    socket.leave(`user:${userId}`);
    console.log(`Socket ${socket.id} left user:${userId}`);
  });

  socket.on('device:command', (data) => {
    io.to(`device:${data.deviceId}`).emit('device:command', data);
  });

  socket.on('device:status', (data) => {
    io.to(`device:${data.deviceId}`).emit('device:status', data);
    io.emit('devices:update', data);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.use((req, res, next) => {
  req.app.set('io', io);
  next();
});

app.get('/api/health', (req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'IoT Platform Server is running',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/workorders', workOrderRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/admin', adminRoutes);

app.use((req: Request, res: Response): void => {
  res.status(404).json({ error: 'API端点不存在', path: req.path });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('[Server Error]', err);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : '请稍后重试',
  });
});

server.listen(PORT, () => {
  console.log(`IoT Platform Server running on http://localhost:${PORT}`);
  console.log(`API Base URL: http://localhost:${PORT}/api`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);
  console.log(`Socket.IO server enabled`);
});

export { app, server, io };
