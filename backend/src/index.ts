import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { config } from './utils/config';
import { setupSocket } from './utils/socket';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import friendRoutes from './routes/friendRoutes';
import messageRoutes from './routes/messageRoutes';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'QQ Chat API is running',
    timestamp: new Date().toISOString(),
    memoryDb: config.useMemoryDb ? 'enabled' : 'disabled',
    memoryRedis: config.useMemoryRedis ? 'enabled' : 'disabled'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API路由不存在',
    code: 404
  });
});

setupSocket(io);

httpServer.listen(config.port, () => {
  console.log(`========================================`);
  console.log(`  QQ Chat Backend Server`);
  console.log(`========================================`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  API URL: http://localhost:${config.port}`);
  console.log(`  Health Check: http://localhost:${config.port}/api/health`);
  console.log(`  Frontend URL: ${config.frontendUrl}`);
  console.log(`========================================`);
  console.log(`  Memory DB: ${config.useMemoryDb ? 'ON (PostgreSQL fallback)' : 'OFF'}`);
  console.log(`  Memory Redis: ${config.useMemoryRedis ? 'ON (Redis fallback)' : 'OFF'}`);
  console.log(`========================================`);
  console.log(`  Server started at: ${new Date().toISOString()}`);
  console.log(`========================================`);
});

export { app, httpServer, io };
