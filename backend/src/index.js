import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initRedis } from './config/redis.js';
import { initDatabase } from './config/database.js';
import { initializeSchema } from './config/initSchema.js';
import authRoutes from './routes/auth.js';
import productsRoutes from './routes/products.js';
import newsRoutes from './routes/news.js';
import messagesRoutes from './routes/messages.js';
import jobsRoutes from './routes/jobs.js';
import membersRoutes from './routes/members.js';
import commonRoutes from './routes/common.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT) || 22351;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:22352';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:22352'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/common', commonRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message 
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

const startServer = async () => {
  try {
    await initDatabase();
    console.log('数据库连接完成');
    
    await initializeSchema();
    console.log('数据库表结构和初始数据初始化完成');
    
    await initRedis();
    console.log('Redis初始化完成');
    
    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`  后端服务已启动`);
      console.log(`  访问地址: http://localhost:${PORT}`);
      console.log(`  API地址: http://localhost:${PORT}/api`);
      console.log(`  环境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`========================================`);
    });
  } catch (err) {
    console.error('服务器启动失败:', err);
    process.exit(1);
  }
};

startServer();
