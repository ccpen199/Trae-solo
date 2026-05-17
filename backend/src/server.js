const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { initDatabase, runQuery, getQuery } = require('./database');
const { errorHandler } = require('./middleware');
const routes = require('./routes');

const app = express();
const PORT = process.env.BACKEND_PORT || 47742;

app.use(cors({
  origin: [`http://localhost:${process.env.FRONTEND_PORT || 47741}`],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', routes);

app.use(errorHandler);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'ASMR Server is running!' });
});

const seedTestData = async () => {
  try {
    const userCount = await getQuery('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      console.log('Seeding test data...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      const creators = [
        { phone: '13800138001', nickname: 'ASMR小美', bio: '专业耳搔、触发音创作者', avatar: '' },
        { phone: '13800138002', nickname: '雨声大叔', bio: '自然声音、白噪音爱好者', avatar: '' },
        { phone: '13800138003', nickname: '轻语学姐', bio: '温柔轻语、故事哄睡', avatar: '' },
        { phone: '13800138004', nickname: '敲击达人', bio: '各种物品敲击声、解压音', avatar: '' },
      ];
      
      for (const creator of creators) {
        await runQuery(
          'INSERT INTO users (phone, password, nickname, avatar, bio) VALUES (?, ?, ?, ?, ?)',
          [creator.phone, hashedPassword, creator.nickname, creator.avatar, creator.bio]
        );
      }
      
      const contents = [
        { userId: 1, title: '超治愈的耳部按摩 | 双声道立体声', description: '戴上耳机，享受极致的放松体验', coverUrl: '', contentType: 'audio', duration: 1800, tags: '耳搔,放松,治愈' },
        { userId: 2, title: '3小时雨声助眠 | 深度睡眠白噪音', description: '下雨天，适合睡个好觉', coverUrl: '', contentType: 'audio', duration: 10800, tags: '雨声,白噪音,助眠' },
        { userId: 3, title: '温柔姐姐讲故事 | 轻语哄睡', description: '睡前小故事，伴你入眠', coverUrl: '', contentType: 'video', duration: 3600, tags: '轻语,故事,哄睡' },
        { userId: 4, title: '各种敲击声合集 | 解压必备', description: '玻璃杯、木块、键盘...各种敲击声', coverUrl: '', contentType: 'video', duration: 1200, tags: '敲击,解压,触发音' },
        { userId: 1, title: '口腔音合集 | 无人声', description: '纯享版，各种触发音', coverUrl: '', contentType: 'audio', duration: 2400, tags: '口腔音,触发音,纯享' },
        { userId: 2, title: '森林鸟鸣声 | 清晨唤醒', description: '大自然的声音，唤醒美好的一天', coverUrl: '', contentType: 'audio', duration: 7200, tags: '森林,鸟鸣,自然' },
      ];
      
      for (const content of contents) {
        await runQuery(
          'INSERT INTO contents (user_id, title, description, cover_url, content_url, content_type, duration, tags, views, likes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [content.userId, content.title, content.description, content.coverUrl, '', content.contentType, content.duration, content.tags, Math.floor(Math.random() * 10000), Math.floor(Math.random() * 1000)]
        );
      }
      
      const lives = [
        { userId: 1, title: '深夜陪伴直播间 | 一起失眠吧', coverUrl: '', viewerCount: 256 },
        { userId: 3, title: '睡前故事直播间', coverUrl: '', viewerCount: 189 },
      ];
      
      for (const live of lives) {
        await runQuery(
          'INSERT INTO lives (user_id, title, cover_url, stream_url, viewer_count) VALUES (?, ?, ?, ?, ?)',
          [live.userId, live.title, live.coverUrl, '', live.viewerCount]
        );
      }
      
      const products = [
        { name: '高品质睡眠耳塞', description: '专业降噪，舒适佩戴', price: 99, imageUrl: '', category: '助眠', stock: 100, sales: 500 },
        { name: '真丝眼罩', description: '亲肤透气，遮光助眠', price: 129, imageUrl: '', category: '助眠', stock: 80, sales: 320 },
        { name: '香薰蜡烛', description: '天然植物精油，营造氛围', price: 89, imageUrl: '', category: '氛围', stock: 150, sales: 450 },
        { name: '蓝牙睡眠耳机', description: '舒适侧睡，音质清晰', price: 299, imageUrl: '', category: '数码', stock: 60, sales: 280 },
      ];
      
      for (const product of products) {
        await runQuery(
          'INSERT INTO products (name, description, price, image_url, category, stock, sales) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [product.name, product.description, product.price, product.imageUrl, product.category, product.stock, product.sales]
        );
      }
      
      await runQuery('INSERT INTO follows (follower_id, following_id) VALUES (1, 2), (1, 3), (2, 1), (3, 1), (4, 1)');
      
      console.log('Test data seeded successfully!');
      console.log('Test user: 13800138001, password: 123456');
    }
  } catch (error) {
    console.error('Error seeding test data:', error);
  }
};

const startServer = async () => {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
    
    await seedTestData();
    
    app.listen(PORT, () => {
      console.log(`ASMR Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
