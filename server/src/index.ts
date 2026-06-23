import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';

import { AppDataSource } from './data-source';
import { seedData } from './seed';
import { errorHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth';
import communityRoutes from './routes/communities';
import projectRoutes from './routes/projects';
import billRoutes from './routes/bills';
import workOrderRoutes from './routes/workorders';
import announcementRoutes from './routes/announcements';
import postRoutes from './routes/posts';
import merchantProductRoutes from './routes/merchant-products';
import orderRoutes from './routes/orders';
import activityRoutes from './routes/activities';
import messageRoutes from './routes/messages';
import govRoutes from './routes/gov';
import dashboardRoutes from './routes/dashboard';
import uploadRoutes from './routes/upload';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const uploadPath = path.resolve(uploadDir);
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
app.use('/uploads', express.static(uploadPath));

app.use('/api/auth', authRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/communities/:communityId/projects', projectRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/workorders', workOrderRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/merchant', merchantProductRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/gov', govRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);

app.use(errorHandler);

async function bootstrap() {
  try {
    const dataDir = path.resolve('data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    await AppDataSource.initialize();
    console.log('[DB] 数据库连接成功');

    await seedData();

    app.listen(PORT, () => {
      console.log(`[Server] 服务启动成功，端口: ${PORT}`);
      console.log(`[Server] API 地址: http://localhost:${PORT}/api`);
    });
  } catch (err) {
    console.error('[Server] 启动失败:', err);
    process.exit(1);
  }
}

bootstrap();
