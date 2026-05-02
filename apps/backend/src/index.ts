import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';

import authRoutes from './routes/auth';
import packageRoutes from './routes/packages';
import reservationRoutes from './routes/reservations';
import examinationRoutes from './routes/examinations';
import reportRoutes from './routes/reports';
import patientRoutes from './routes/patients';
import notificationRoutes from './routes/notifications';
import followupRoutes from './routes/followup';
import syncRoutes from './routes/sync';
import auditRoutes from './routes/audit';

import { createTables } from './database/migrations';
import { seedData } from './database/seed';
import { redis } from './database/redis';

const app = express();
const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: [
      `http://localhost:${config.ports.client}`,
      `http://localhost:${config.ports.reception}`,
      `http://localhost:${config.ports.doctor}`,
      `http://localhost:${config.ports.dashboard}`,
    ],
    methods: ['GET', 'POST'],
  },
});

app.use(helmet());
app.use(cors({
  origin: [
    `http://localhost:${config.ports.client}`,
    `http://localhost:${config.ports.reception}`,
    `http://localhost:${config.ports.doctor}`,
    `http://localhost:${config.ports.dashboard}`,
  ],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: '请求过于频繁，请稍后再试',
});

app.use('/api/', apiLimiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    ports: {
      api: config.ports.api,
      socket: config.ports.socket,
    },
    environment: config.env,
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/examinations', examinationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/followup', followupRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/audit', auditRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ message: '请求体格式错误' });
  }

  res.status(500).json({ 
    message: config.isDevelopment ? err.message : '服务器内部错误',
  });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join:department', (departmentId: string) => {
    socket.join(`department:${departmentId}`);
    console.log(`Socket ${socket.id} joined department:${departmentId}`);
  });

  socket.on('leave:department', (departmentId: string) => {
    socket.leave(`department:${departmentId}`);
    console.log(`Socket ${socket.id} left department:${departmentId}`);
  });

  socket.on('join:patient', (patientId: string) => {
    socket.join(`patient:${patientId}`);
  });

  socket.on('leave:patient', (patientId: string) => {
    socket.leave(`patient:${patientId}`);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

export const broadcastQueueUpdate = (departmentId: string, data: unknown) => {
  io.to(`department:${departmentId}`).emit('queue:update', data);
};

export const broadcastPatientUpdate = (patientId: string, data: unknown) => {
  io.to(`patient:${patientId}`).emit('patient:update', data);
};

export const broadcastCrisisAlert = (data: unknown) => {
  io.emit('crisis:alert', data);
};

const startServer = async () => {
  try {
    console.log('Initializing database...');
    await createTables();
    console.log('Database tables created');

    console.log('Seeding initial data...');
    await seedData();
    console.log('Initial data seeded');

    console.log('Connecting to Redis...');
    await redis.ping();
    console.log('Redis connected');

    httpServer.listen(config.ports.api, () => {
      console.log(`\n========================================`);
      console.log(`  体检中心管理系统 - 后端服务`);
      console.log(`========================================`);
      console.log(`  API Port:      ${config.ports.api}`);
      console.log(`  Socket Port:   ${config.ports.socket}`);
      console.log(`  Environment:   ${config.env}`);
      console.log(`========================================\n`);
      
      console.log(`默认账号信息:`);
      console.log(`  管理员:  admin / Admin123!`);
      console.log(`  前台:    reception1 / Admin123!`);
      console.log(`  医生:    doctor1 / Admin123!`);
      console.log(`  总检:    chief1 / Admin123!\n`);
    });

    const redisSubscriber = redis.duplicate();
    
    await redisSubscriber.psubscribe('queue:*:updates', (err, count) => {
      if (err) {
        console.error('Redis subscription error:', err);
      } else {
        console.log(`Subscribed to ${count} Redis channels`);
      }
    });

    redisSubscriber.on('pmessage', (pattern, channel, message) => {
      try {
        const data = JSON.parse(message);
        const departmentId = channel.split(':')[1];
        broadcastQueueUpdate(departmentId, data);
      } catch (error) {
        console.error('Error parsing Redis message:', error);
      }
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { app, httpServer, io };
