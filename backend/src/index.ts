import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth';
import merchantRoutes from './routes/merchants';
import couponRoutes from './routes/coupons';
import postRoutes from './routes/posts';
import topicRoutes from './routes/topics';
import helpRoutes from './routes/help';
import utilityRoutes from './routes/utilities';
import adminRoutes from './routes/admin';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/utilities', utilityRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
  });

  socket.on('new-message', (data) => {
    io.to(`help:${data.helpRequestId}`).emit('message', data);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59220);
const HOST = process.env.BACKEND_HOST || process.env.HOST || '127.0.0.1';

server.listen(PORT, HOST, () => {
  console.log(`服务器运行在 http://${HOST}:${PORT}`);
  console.log(`WebSocket 运行在 ws://${HOST}:${PORT}`);
});

export default app;
