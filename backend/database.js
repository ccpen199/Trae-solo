const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
  } else {
    console.log('✅ SQLite数据库连接成功');
  }
});

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initDatabase() {
  try {
    await runQuery(`PRAGMA journal_mode = WAL`);
    await runQuery(`PRAGMA foreign_keys = ON`);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE,
        douyin_id TEXT UNIQUE,
        nickname TEXT NOT NULL DEFAULT '多闪用户',
        avatar TEXT,
        bio TEXT DEFAULT '',
        gender INTEGER DEFAULT 0,
        birthday TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        friend_id INTEGER NOT NULL,
        status INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (friend_id) REFERENCES users(id),
        UNIQUE(user_id, friend_id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type INTEGER DEFAULT 0,
        name TEXT,
        avatar TEXT,
        creator_id INTEGER,
        last_message TEXT,
        last_message_time DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users(id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS chat_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        is_top INTEGER DEFAULT 0,
        is_muted INTEGER DEFAULT 0,
        unread_count INTEGER DEFAULT 0,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(chat_id, user_id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        type INTEGER DEFAULT 0,
        content TEXT,
        media_url TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id),
        FOREIGN KEY (sender_id) REFERENCES users(id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS moments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type INTEGER DEFAULT 0,
        media_url TEXT NOT NULL,
        thumbnail_url TEXT,
        description TEXT,
        likes_count INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        views_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS moment_likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        moment_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (moment_id) REFERENCES moments(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE(moment_id, user_id)
      )
    `);

    await runQuery(`
      CREATE TABLE IF NOT EXISTS moment_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        moment_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (moment_id) REFERENCES moments(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('✅ 数据库表初始化完成');
    
    await createDemoData();
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

async function createDemoData() {
  try {
    const userCount = await getQuery('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      const demoUsers = [
        { phone: '13800138001', nickname: '小明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming', bio: '热爱生活，记录美好' },
        { phone: '13800138002', nickname: '小红', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaohong', bio: '多闪小助手' },
        { phone: '13800138003', nickname: '阿杰', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ajie', bio: '音乐爱好者' },
        { phone: '13800138004', nickname: '小美', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaomei', bio: '旅行达人' },
      ];

      for (const user of demoUsers) {
        await runQuery(
          'INSERT INTO users (phone, nickname, avatar, bio) VALUES (?, ?, ?, ?)',
          [user.phone, user.nickname, user.avatar, user.bio]
        );
      }

      await runQuery(
        'INSERT INTO friends (user_id, friend_id, status) VALUES (1, 2, 1), (1, 3, 1), (1, 4, 1), (2, 1, 1), (3, 1, 1), (4, 1, 1)'
      );

      await runQuery(
        'INSERT INTO chats (type, name, creator_id, last_message, last_message_time) VALUES (0, NULL, 1, ?, ?)',
        ['欢迎来到多闪！', new Date().toISOString()]
      );

      await runQuery(
        'INSERT INTO chat_members (chat_id, user_id) VALUES (1, 1), (1, 2)'
      );

      await runQuery(
        'INSERT INTO moments (user_id, type, media_url, thumbnail_url, description, likes_count, views_count) VALUES (2, 1, ?, ?, ?, 128, 2560)',
        [
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=400&fit=crop',
          '今天天气真好，出来散散步~'
        ]
      );

      console.log('✅ 演示数据创建完成');
    }
  } catch (error) {
    console.error('演示数据创建失败:', error);
  }
}

module.exports = {
  runQuery,
  getQuery,
  allQuery,
  initDatabase
};
