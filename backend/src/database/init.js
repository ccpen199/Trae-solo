const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      bio TEXT,
      is_admin INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      artist TEXT NOT NULL,
      album TEXT,
      cover TEXT,
      duration INTEGER NOT NULL,
      lyrics TEXT,
      audio_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      song_id INTEGER NOT NULL,
      reason_audio TEXT,
      reason_text TEXT,
      status TEXT DEFAULT 'pending',
      gif_url TEXT,
      play_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      heart_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      recommendation_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      like_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recommendation_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, recommendation_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_hearts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      recommendation_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, recommendation_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (recommendation_id) REFERENCES recommendations(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      comment_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, comment_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
    );
  `);
};

const initMockData = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  
  if (userCount === 0) {
    try {
      db.exec('BEGIN TRANSACTION');
      
      const insertUser = db.prepare(`
        INSERT INTO users (username, password, nickname, avatar, is_admin)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      const bcrypt = require('bcryptjs');
      const adminPassword = bcrypt.hashSync('admin123', 10);
      const userPassword = bcrypt.hashSync('123456', 10);
      
      insertUser.run('admin', adminPassword, '管理员', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', 1);
      insertUser.run('user1', userPassword, '音乐达人', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user1', 0);
      insertUser.run('user2', userPassword, '小众音乐爱好者', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user2', 0);
      insertUser.run('user3', userPassword, '独立音乐推荐官', 'https://api.dicebear.com/7.x/avataaars/svg?seed=user3', 0);

      const insertSong = db.prepare(`
        INSERT INTO songs (title, artist, album, cover, duration, lyrics, audio_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const sampleLyrics = `[00:00.00] 这是一首示例歌曲
[00:05.00] 旋律在空气中飘荡
[00:10.00] 每一个音符都是故事
[00:15.00] 让我们静静聆听
[00:20.00] 音乐连接你我
[00:25.00] 跨越时间和空间
[00:30.00] 这是音乐的力量`;

      const songs = [
        ['夜空中最亮的星', '逃跑计划', '世界', 'https://picsum.photos/seed/song1/300/300', 245, sampleLyrics, ''],
        ['晴天', '周杰伦', '叶惠美', 'https://picsum.photos/seed/song2/300/300', 269, sampleLyrics, ''],
        ['平凡之路', '朴树', '猎户星座', 'https://picsum.photos/seed/song3/300/300', 295, sampleLyrics, ''],
        ['海阔天空', 'Beyond', '乐与怒', 'https://picsum.photos/seed/song4/300/300', 326, sampleLyrics, ''],
      ];

      songs.forEach(song => insertSong.run(...song));

      const insertRecommendation = db.prepare(`
        INSERT INTO recommendations (user_id, song_id, reason_text, status, gif_url, play_count, like_count, heart_count, comment_count, approved_at)
        VALUES (?, ?, ?, 'approved', ?, 150, 45, 32, 18, CURRENT_TIMESTAMP)
      `);

      const reasons = [
        '这首歌陪伴我度过了最难熬的时光，每次听到都会想起那段经历。希望也能治愈你。',
        '发现的一首宝藏歌曲，旋律真的太美了，循环了无数遍！',
        '小众但超好听，推荐给所有喜欢独立音乐的朋友。',
        '第一次听到就爱上了，歌词写得太戳心了，推荐！',
      ];

      for (let i = 1; i <= 4; i++) {
        insertRecommendation.run(2, i, reasons[i - 1], `https://picsum.photos/seed/gif${i}/400/600`);
      }

      const insertComment = db.prepare(`
        INSERT INTO comments (recommendation_id, user_id, content, like_count)
        VALUES (?, ?, ?, ?)
      `);

      const comments = [
        '真的好好听！感谢推荐！',
        '已加入循环歌单',
        '这个理由太好哭了',
      ];

      for (let recId = 1; recId <= 4; recId++) {
        for (let i = 0; i < 3; i++) {
          insertComment.run(recId, 3, comments[i], Math.floor(Math.random() * 20));
        }
      }
      
      db.exec('COMMIT');
    } catch (error) {
      console.error('插入模拟数据错误:', error);
      db.exec('ROLLBACK');
    }
  }
};

const initDatabase = () => {
  initTables();
  initMockData();
};

module.exports = { db, initDatabase };
