require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, TreeType, Achievement, Music } = require('./models');

const authRoutes = require('./routes/auth');
const plantingRoutes = require('./routes/planting');
const userRoutes = require('./routes/user');
const shopRoutes = require('./routes/shop');

const app = express();
const PORT = process.env.PORT || 44847;

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:45847',
  credentials: true
}));

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/planting', plantingRoutes);
app.use('/api/user', userRoutes);
app.use('/api/shop', shopRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function initializeData() {
  const treeCount = await TreeType.count();
  if (treeCount === 0) {
    await TreeType.bulkCreate([
      { name: 'oak', displayName: '橡树', icon: '🌳', price: 0, minDuration: 10, isBush: false },
      { name: 'pine', displayName: '松树', icon: '🌲', price: 50, minDuration: 10, isBush: false },
      { name: 'maple', displayName: '枫树', icon: '🍁', price: 100, minDuration: 15, isBush: false },
      { name: 'bamboo', displayName: '竹子', icon: '🎋', price: 150, minDuration: 10, isBush: true },
      { name: 'sakura', displayName: '樱花', icon: '🌸', price: 200, minDuration: 20, isBush: true, isPremium: true },
      { name: 'cactus', displayName: '仙人掌', icon: '🌵', price: 300, minDuration: 25, isBush: true },
      { name: 'redwood', displayName: '红杉', icon: '🌴', price: 500, minDuration: 30, isBush: false, isPremium: true }
    ]);
  }

  const achievementCount = await Achievement.count();
  if (achievementCount === 0) {
    await Achievement.bulkCreate([
      { name: '初出茅庐', description: '种下第一棵树', icon: '🌱', requirement: 1, requirementType: 'trees', coinReward: 10 },
      { name: '小有成就', description: '种下10棵树', icon: '🌲', requirement: 10, requirementType: 'trees', coinReward: 50 },
      { name: '森林守护者', description: '种下50棵树', icon: '🌳', requirement: 50, requirementType: 'trees', coinReward: 200 },
      { name: '专注新手', description: '累计专注100分钟', icon: '⏰', requirement: 100, requirementType: 'time', coinReward: 30 },
      { name: '专注达人', description: '累计专注500分钟', icon: '⏱️', requirement: 500, requirementType: 'time', coinReward: 100 },
      { name: '专注大师', description: '累计专注1000分钟', icon: '🏆', requirement: 1000, requirementType: 'time', coinReward: 300 }
    ]);
  }

  const musicCount = await Music.count();
  if (musicCount === 0) {
    await Music.bulkCreate([
      { name: '雨声', url: '/music/rain.mp3', price: 0 },
      { name: '森林', url: '/music/forest.mp3', price: 100 },
      { name: '海浪', url: '/music/ocean.mp3', price: 150, isPremium: true },
      { name: '篝火', url: '/music/fire.mp3', price: 200 }
    ]);
  }
}

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    await sequelize.sync();
    console.log('数据库同步完成');
    
    await initializeData();
    console.log('初始数据初始化完成');

    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
