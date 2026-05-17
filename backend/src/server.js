const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initDatabase, runQuery } = require('./database');
const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 47781;

app.use(helmet({
  crossOriginResourcePolicy: false
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});
app.use(limiter);

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadDir = path.join(__dirname, '..', 'uploads');
app.use('/uploads', express.static(uploadDir));

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/search', searchRoutes);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

const insertMockData = async () => {
  try {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 10);

    for (let i = 1; i <= 5; i++) {
      await runQuery(
        'INSERT OR IGNORE INTO users (phone, password, nickname, username, follower_count) VALUES (?, ?, ?, ?, ?)',
        [`1380000000${i}`, hashedPassword, `创作者${i}`, `user${i}`, Math.floor(Math.random() * 10000)]
      );
    }

    const sampleVideos = [
      { title: '美丽的日落', desc: '今天的日落太美了 #风景 #日落', music: '原声' },
      { title: '美食探店vlog', desc: '今天去了一家超好吃的餐厅 #美食 #探店', music: '背景音乐1' },
      { title: '猫咪日常', desc: '我家主子的日常 #萌宠 #猫咪', music: '可爱音乐' },
      { title: '健身打卡', desc: '坚持锻炼第30天 #健身 #自律', music: '动感音乐' },
      { title: '旅行日记', desc: '云南之旅，太美了！#旅行 #云南', music: '旅行音乐' }
    ];

    for (let i = 0; i < sampleVideos.length; i++) {
      await runQuery(
        'INSERT OR IGNORE INTO videos (user_id, title, description, video_url, cover_url, music, like_count, view_count, comment_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [(i % 5) + 1, sampleVideos[i].title, sampleVideos[i].desc, 
         'https://www.w3schools.com/html/mov_bbb.mp4', 
         `https://picsum.photos/320/560?random=${i + 1}`,
         sampleVideos[i].music,
         Math.floor(Math.random() * 10000),
         Math.floor(Math.random() * 100000),
         Math.floor(Math.random() * 1000)]
      );
    }

    const hotKeywords = [
      { keyword: '热门挑战', is_hot: 1, rank: 1, count: 1234567 },
      { keyword: '神仙特效', is_hot: 1, rank: 2, count: 987654 },
      { keyword: '美食教程', is_hot: 1, rank: 3, count: 876543 },
      { keyword: '搞笑视频', is_hot: 0, rank: 4, count: 765432 },
      { keyword: '萌宠出道计划', is_hot: 1, rank: 5, count: 654321 }
    ];

    for (const item of hotKeywords) {
      await runQuery(
        'INSERT OR IGNORE INTO hot_searches (keyword, is_hot, rank, search_count) VALUES (?, ?, ?, ?)',
        [item.keyword, item.is_hot, item.rank, item.count]
      );
    }

    const banners = [
      { title: '新春活动', image: 'https://picsum.photos/800/300?random=10', link: '#', position: 1 },
      { title: '创作者计划', image: 'https://picsum.photos/800/300?random=11', link: '#', position: 2 }
    ];

    for (const banner of banners) {
      await runQuery(
        'INSERT OR IGNORE INTO banners (title, image_url, link_url, position) VALUES (?, ?, ?, ?)',
        [banner.title, banner.image, banner.link, banner.position]
      );
    }

    console.log('Mock data inserted successfully');
  } catch (error) {
    console.error('Error inserting mock data:', error);
  }
};

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '服务器内部错误' });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

const startServer = async () => {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
    
    await insertMockData();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
