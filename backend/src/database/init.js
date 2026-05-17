require('dotenv').config({ path: '../../.env' });
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../../data/app.sqlite');

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const createTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      username TEXT,
      password TEXT,
      avatar TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      cover_url TEXT,
      video_url TEXT,
      duration INTEGER DEFAULT 0,
      play_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      tags TEXT,
      is_horizontal INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      parent_id INTEGER DEFAULT 0,
      reply_to_user_id INTEGER,
      content TEXT NOT NULL,
      like_count INTEGER DEFAULT 0,
      dislike_count INTEGER DEFAULT 0,
      is_top INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES videos(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (reply_to_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS danmakus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      time INTEGER NOT NULL,
      color TEXT DEFAULT '#FFFFFF',
      type INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES videos(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      video_id INTEGER,
      comment_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (video_id) REFERENCES videos(id),
      FOREIGN KEY (comment_id) REFERENCES comments(id),
      UNIQUE(user_id, video_id),
      UNIQUE(user_id, comment_id)
    );

    CREATE TABLE IF NOT EXISTS user_follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follower_id) REFERENCES users(id),
      FOREIGN KEY (following_id) REFERENCES users(id),
      UNIQUE(follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS user_blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      blocked_user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (blocked_user_id) REFERENCES users(id),
      UNIQUE(user_id, blocked_user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      from_user_id INTEGER,
      video_id INTEGER,
      comment_id INTEGER,
      content TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (video_id) REFERENCES videos(id),
      FOREIGN KEY (comment_id) REFERENCES comments(id)
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      image_url TEXT NOT NULL,
      link_url TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#00A1D6',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_videos_user ON videos(user_id);
    CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_video ON comments(video_id);
    CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
    CREATE INDEX IF NOT EXISTS idx_danmakus_video ON danmakus(video_id);
    CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(receiver_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `);
};

const insertSeedData = () => {
  const bcrypt = require('bcryptjs');
  
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const password = bcrypt.hashSync('123456', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (phone, username, avatar, bio) VALUES (?, ?, ?, ?)
    `);
    
    for (let i = 1; i <= 5; i++) {
      insertUser.run(
        `1380000000${i}`,
        `用户${i}`,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
        `这是用户${i}的简介`
      );
    }
    console.log('✓ 测试用户已创建 (手机号: 13800000001-13800000005, 密码: 123456)');
  }

  const videoCount = db.prepare('SELECT COUNT(*) as count FROM videos').get().count;
  if (videoCount === 0) {
    const insertVideo = db.prepare(`
      INSERT INTO videos (user_id, title, description, cover_url, video_url, duration, tags, is_horizontal)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const videoTitles = [
      '【4K】绝美风景延时摄影合集',
      '编程入门教程：JavaScript基础',
      '美食探店：隐藏在巷子里的美味',
      'VLOG：周末的日常记录',
      '音乐分享：治愈系纯音乐',
      '健身教程：10分钟腹肌训练',
      '数码测评：最新手机上手体验',
      '旅行日记：云南大理',
      '猫主子的日常：可爱时刻',
      '学习方法：如何高效记笔记',
      '手绘教程：零基础画动漫人物',
      '电影解说：经典影片深度分析'
    ];
    
    const tagsList = ['娱乐', '知识', '生活', '音乐', '美食', '旅行', '健身', '科技'];
    
    for (let i = 0; i < 12; i++) {
      const isHorizontal = i % 2 === 0 ? 1 : 0;
      insertVideo.run(
        (i % 5) + 1,
        videoTitles[i],
        `这是${videoTitles[i]}的详细描述，欢迎观看！`,
        `https://picsum.photos/seed/vid${i + 1}/${isHorizontal ? 400 : 225}/${isHorizontal ? 225 : 400}`,
        `https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4`,
        120 + Math.floor(Math.random() * 180),
        tagsList[i % tagsList.length],
        isHorizontal
      );
    }
    console.log('✓ 测试视频已创建');
  }

  const bannerCount = db.prepare('SELECT COUNT(*) as count FROM banners').get().count;
  if (bannerCount === 0) {
    const insertBanner = db.prepare(`
      INSERT INTO banners (title, image_url, link_url, sort_order) VALUES (?, ?, ?, ?)
    `);
    
    insertBanner.run('热门活动', 'https://picsum.photos/seed/banner1/800/300', '/video/1', 1);
    insertBanner.run('新人福利', 'https://picsum.photos/seed/banner2/800/300', '/video/2', 2);
    insertBanner.run('创作者计划', 'https://picsum.photos/seed/banner3/800/300', '/video/3', 3);
    console.log('✓ Banner数据已创建');
  }

  const tagCount = db.prepare('SELECT COUNT(*) as count FROM tags').get().count;
  if (tagCount === 0) {
    const insertTag = db.prepare(`
      INSERT INTO tags (name, color, sort_order) VALUES (?, ?, ?)
    `);
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const tagNames = ['推荐', '热门', '动画', '游戏', '科技', '生活', '音乐', '美食', '旅行', '知识', '娱乐', '影视'];
    
    tagNames.forEach((name, i) => {
      insertTag.run(name, colors[i % colors.length], i + 1);
    });
    console.log('✓ 标签数据已创建');
  }

  const commentCount = db.prepare('SELECT COUNT(*) as count FROM comments').get().count;
  if (commentCount === 0) {
    const insertComment = db.prepare(`
      INSERT INTO comments (video_id, user_id, content, like_count) VALUES (?, ?, ?, ?)
    `);
    
    const comments = [
      '这个视频太棒了！',
      '学到了很多，感谢分享',
      '背景音乐是什么？很好听',
      'UP主加油，期待更多作品',
      '画质真清晰，收藏了',
      '看了三遍了，百看不厌'
    ];
    
    for (let i = 1; i <= 3; i++) {
      for (let j = 0; j < comments.length; j++) {
        insertComment.run(i, (j % 5) + 1, comments[j], Math.floor(Math.random() * 100));
      }
    }
    console.log('✓ 评论数据已创建');
  }

  const danmakuCount = db.prepare('SELECT COUNT(*) as count FROM danmakus').get().count;
  if (danmakuCount === 0) {
    const insertDanmaku = db.prepare(`
      INSERT INTO danmakus (video_id, user_id, content, time, color) VALUES (?, ?, ?, ?, ?)
    `);
    
    const danmakus = ['666', '前方高能', '打卡', '好听', '好看', '哈哈哈', '学到了', '厉害'];
    const colors = ['#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00'];
    
    for (let v = 1; v <= 3; v++) {
      for (let i = 0; i < 20; i++) {
        insertDanmaku.run(
          v,
          (i % 5) + 1,
          danmakus[i % danmakus.length],
          (i * 5) + Math.random() * 30,
          colors[i % colors.length]
        );
      }
    }
    console.log('✓ 弹幕数据已创建');
  }
};

try {
  console.log('开始初始化数据库...');
  createTables();
  insertSeedData();
  console.log('✓ 数据库初始化完成！');
} catch (error) {
  console.error('数据库初始化失败:', error);
  process.exit(1);
} finally {
  db.close();
}
