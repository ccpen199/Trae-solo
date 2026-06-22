import express, { json, urlencoded } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { responseFormatter, errorHandler, notFoundHandler } from './middleware';
import userRoutes from './routes/userRoutes';
import activityRoutes from './routes/activityRoutes';
import matchingRoutes from './routes/matchingRoutes';
import bubbleRoutes from './routes/bubbleRoutes';
import safetyRoutes from './routes/safetyRoutes';
import aiChatRoutes from './routes/aiChatRoutes';
import localServiceRoutes from './routes/localServiceRoutes';
import riskRoutes from './routes/riskRoutes';
import { db } from './data/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(json({ limit: '10mb' }));
app.use(urlencoded({ extended: true }));
app.use(responseFormatter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    stats: {
      users: db.users.size,
      activities: db.activities.size,
      bubbleRooms: db.bubbleRooms.size,
      coupons: db.coupons.size
    }
  });
});

app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/bubble-rooms', bubbleRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/ai-chat', aiChatRoutes);
app.use('/api/local-service', localServiceRoutes);
app.use('/api/risk', riskRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 信用锚点社交平台后端服务已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`👤 默认测试用户 ID: ${Array.from(db.users.keys())[0]}`);
  console.log(`   测试用户列表:`);
  for (const u of db.users.values()) {
    console.log(`     - ${u.id}  ${u.nickname} (${u.gender === 'male' ? '男' : u.gender === 'female' ? '女' : '未知'}, ${u.age}岁, ${u.location.city}, 信用分:${u.creditScore})`);
  }
  console.log('');
});
