const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      avatar TEXT,
      bio TEXT,
      followers_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      video_url TEXT NOT NULL,
      cover_url TEXT,
      duration INTEGER,
      view_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      share_count INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      like_count INTEGER DEFAULT 0,
      parent_id INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES videos(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(video_id, user_id),
      FOREIGN KEY (video_id) REFERENCES videos(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
    CREATE INDEX IF NOT EXISTS idx_videos_created ON videos(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_video ON comments(video_id);
    CREATE INDEX IF NOT EXISTS idx_likes_video ON likes(video_id);
  `);
};

const initTestData = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  const insertUser = db.prepare('INSERT INTO users (username, avatar, bio) VALUES (?, ?, ?)');
  const insertVideo = db.prepare('INSERT INTO videos (user_id, title, description, video_url, cover_url, duration) VALUES (?, ?, ?, ?, ?, ?)');

  const users = [
    { username: '美食达人', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop', bio: '分享美食的快乐' },
    { username: '旅行家小王', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop', bio: '走遍世界每个角落' },
    { username: '萌宠乐园', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop', bio: '记录毛孩子的日常' },
    { username: '健身教练', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop', bio: '每天运动一点点' },
    { username: '音乐才子', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop', bio: '用音乐传递情感' }
  ];

  const videosData = [
    { userId: 1, title: '今天做了超好吃的红烧肉！', cover: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=700&fit=crop', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { userId: 1, title: '深夜食堂：一碗治愈的拉面', cover: 'https://images.unsplash.com/photo-1569718212368-1cd6d3fc1c7f?w=400&h=700&fit=crop', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { userId: 2, title: '云南大理的风景真的太美了', cover: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=700&fit=crop', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { userId: 2, title: '西藏之行，心灵的洗礼', cover: 'https://images.unsplash.com/photo-1461823050800-703994098f6a?w=400&h=700&fit=crop', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { userId: 3, title: '我家猫咪今天学会握手啦', cover: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=700&fit=crop', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { userId: 3, title: '狗狗第一次看到雪的反应', cover: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=700&fit=crop', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { userId: 4, title: '健身打卡第100天！', cover: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=700&fit=crop', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { userId: 4, title: '一个月瘦10斤的秘诀', cover: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=700&fit=crop', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { userId: 5, title: '原创歌曲《夏日晚风》送给大家', cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=700&fit=crop', video: 'https://www.w3schools.com/html/mov_bbb.mp4' },
    { userId: 5, title: '吉他弹唱《平凡之路》', cover: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=700&fit=crop', video: 'https://www.w3schools.com/html/mov_bbb.mp4' }
  ];

  users.forEach((user) => {
    insertUser.run(user.username, user.avatar, user.bio);
  });

  videosData.forEach((video) => {
    insertVideo.run(
      video.userId,
      video.title,
      `${video.title}，喜欢的话点赞关注哦！`,
      video.video,
      video.cover,
      10
    );
  });
};

initTables();
initTestData();

module.exports = db;
