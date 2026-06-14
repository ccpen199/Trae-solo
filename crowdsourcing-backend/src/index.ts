import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';

import { success, error } from './utils/common';
import { runSeeders } from './seeders';
import db from './database';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import taskRoutes from './routes/tasks';
import taskBidRoutes from './routes/tasks-bids';
import taskSubmissionRoutes from './routes/tasks-submissions';
import taskReviewRoutes from './routes/tasks-reviews';
import providerRoutes from './routes/providers';
import portfolioRoutes from './routes/portfolio';
import matchRoutes from './routes/match';
import messageRoutes from './routes/messages';
import paymentRoutes from './routes/payments';
import ipRoutes from './routes/ip';
import disputeRoutes from './routes/disputes';
import analyticsRoutes from './routes/analytics';
import auditRoutes from './routes/audit';
import publicRoutes from './routes/public';

const app = express();
const server = createServer(app);
const PORT = Number(process.env.BACKEND_PORT || process.env.PORT || 59101);
const HOST = process.env.HOST || process.env.BIND_HOST || '127.0.0.1';
const FRONTEND_PORT = process.env.FRONTEND_PORT || 49101;
const CORS_ORIGIN = process.env.CORS_ORIGIN || `http://127.0.0.1:${FRONTEND_PORT}`;
const allowedOrigins = new Set([
  CORS_ORIGIN,
  CORS_ORIGIN.replace('127.0.0.1', 'localhost'),
  `http://127.0.0.1:${FRONTEND_PORT}`,
  `http://localhost:${FRONTEND_PORT}`
]);

const io = new Server(server, {
  cors: {
    origin: Array.from(allowedOrigins),
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(helmet());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('combined'));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    code: 429,
    message: '请求过于频繁，请稍后再试',
    data: null,
    timestamp: new Date().toISOString()
  }
});
app.use(limiter);

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (req: Request, res: Response) => {
  res.json(success({
    status: 'ok',
    timestamp: new Date().toISOString()
  }, '服务运行正常'));
});

app.get('/api/search', (req: Request, res: Response) => {
  const keyword = `%${String(req.query.q || req.query.keyword || '').trim()}%`;
  const tasks = db.prepare(`
    SELECT t.id, t.title as name, t.title, t.description, t.status, t.budgetMin, t.budgetMax,
           c.name as categoryName, u.name as ownerName
    FROM tasks t
    LEFT JOIN categories c ON c.id = t.categoryId
    LEFT JOIN users u ON u.id = t.employerId
    WHERE t.title LIKE ? OR t.description LIKE ? OR c.name LIKE ? OR u.name LIKE ?
    ORDER BY t.createdAt DESC
    LIMIT 10
  `).all(keyword, keyword, keyword, keyword);
  const providers = db.prepare(`
    SELECT p.id, u.name, p.bio as description, p.skills, p.rating, p.location,
           c.name as categoryName
    FROM providers p
    LEFT JOIN users u ON u.id = p.userId
    LEFT JOIN categories c ON c.id = p.categoryId
    WHERE u.name LIKE ? OR p.bio LIKE ? OR p.skills LIKE ? OR c.name LIKE ?
    ORDER BY p.rating DESC, p.id DESC
    LIMIT 10
  `).all(keyword, keyword, keyword, keyword);

  res.json(success({
    list: [...tasks, ...providers],
    tasks,
    providers,
    total: tasks.length + providers.length
  }, '搜索成功'));
});

app.get(['/api/ip-certificates', '/api/ip/certificates'], (req: Request, res: Response) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10));
  const offset = (page - 1) * pageSize;
  const total = (db.prepare('SELECT COUNT(*) as total FROM ip_certificates').get() as { total: number }).total;
  const list = db.prepare(`
    SELECT ip.*, t.title as taskTitle, u.name as providerName
    FROM ip_certificates ip
    LEFT JOIN tasks t ON t.id = ip.taskId
    LEFT JOIN providers p ON p.id = ip.providerId
    LEFT JOIN users u ON u.id = p.userId
    ORDER BY ip.createdAt DESC
    LIMIT ? OFFSET ?
  `).all(pageSize, offset);

  res.json(success({ list, total, page, pageSize }, '获取知识产权存证成功'));
});

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/bids', taskBidRoutes);
app.use('/api/tasks/:taskId/bids', taskBidRoutes);
app.use('/api/tasks/:taskId/submissions', taskSubmissionRoutes);
app.use('/api/tasks/:taskId/reviews', taskReviewRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ip', ipRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global Error:', err);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json(error('未授权访问，请重新登录', 401));
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json(error(err.message || '参数验证失败', 400));
  }

  if (err.statusCode === 429) {
    return res.status(429).json(error('请求过于频繁，请稍后再试', 429));
  }

  res.status(500).json(error(err.message || '服务器内部错误', 500));
});

app.use((req: Request, res: Response) => {
  res.status(404).json(error('接口不存在', 404));
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined`);
  });

  socket.on('leave', (userId) => {
    socket.leave(`user_${userId}`);
    console.log(`User ${userId} left`);
  });

  socket.on('send_message', (data) => {
    const { receiverId, message } = data;
    socket.to(`user_${receiverId}`).emit('new_message', message);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

const startServer = async () => {
  try {
    await runSeeders();

    server.listen(PORT, HOST, () => {
      console.log(`
      ╔══════════════════════════════════════════════════════════════╗
      ║                                                              ║
      ║   🚀 常州市公共服务聚合平台后端服务已启动                      ║
      ║                                                              ║
      ║   🌐 服务地址: http://${HOST}:${PORT}                        ║
      ║   🔌 Socket.io: ws://${HOST}:${PORT}                         ║
      ║   🏥 健康检查: http://${HOST}:${PORT}/api/health             ║
      ║   📁 上传目录: ${path.join(__dirname, '../uploads')}          ║
      ║   💾 数据库: ${path.join(__dirname, '../data/crowdsourcing.sqlite')}
      ║                                                              ║
      ║   📧 测试账号:                                                ║
      ║      管理员: admin@example.com / admin123456                  ║
      ║      平台运营: platform@example.com / 123456                  ║
      ║      运维专员: ops@example.com / 123456                       ║
      ║                                                              ║
      ╚══════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (err: any) {
    console.error('服务启动失败:', err);
    process.exit(1);
  }
};

startServer();

export { app, server, io };
