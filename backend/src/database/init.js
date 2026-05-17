const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('开始初始化数据库...');

  db.run(`PRAGMA foreign_keys = ON`);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      age INTEGER,
      gender TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sleep_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sleep_date DATE NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      duration REAL,
      deep_sleep_duration REAL,
      light_sleep_duration REAL,
      rem_sleep_duration REAL,
      awake_duration REAL,
      avg_heart_rate INTEGER,
      avg_temperature REAL,
      movement_count INTEGER,
      wake_up_count INTEGER,
      snoring_duration REAL,
      sleep_talking_count INTEGER,
      sleep_quality_score INTEGER,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sleep_music (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      url TEXT NOT NULL,
      duration INTEGER,
      description TEXT,
      cover_image TEXT,
      play_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      preferred_music_categories TEXT,
      sleep_goal_hours REAL DEFAULT 8,
      wake_up_time TEXT,
      bed_time TEXT,
      notifications_enabled INTEGER DEFAULT 1,
      auto_stop_music INTEGER DEFAULT 1,
      smart_device_enabled INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      is_official INTEGER DEFAULT 0,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      views_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      likes_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      device_type TEXT NOT NULL,
      device_name TEXT NOT NULL,
      device_token TEXT,
      is_connected INTEGER DEFAULT 0,
      last_sync_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('数据库表创建完成，开始插入初始数据...');

  const musicData = [
    ['轻柔雨声', 'nature', 'https://example.com/music/rain.mp3', 600, '模拟自然雨声，帮助放松身心'],
    ['森林鸟鸣', 'nature', 'https://example.com/music/forest.mp3', 720, '森林中的鸟鸣声'],
    ['海浪拍岸', 'nature', 'https://example.com/music/ocean.mp3', 900, '轻柔的海浪声'],
    ['冥想钢琴', 'piano', 'https://example.com/music/piano1.mp3', 480, '舒缓的钢琴旋律'],
    ['星空下的琴音', 'piano', 'https://example.com/music/piano2.mp3', 660, '宁静的钢琴音乐'],
    ['深度冥想', 'meditation', 'https://example.com/music/meditation1.mp3', 1200, '专业冥想引导音乐'],
    ['白噪音', 'white-noise', 'https://example.com/music/white-noise.mp3', 1800, '纯净白噪音，屏蔽外界干扰'],
    ['粉红噪音', 'white-noise', 'https://example.com/music/pink-noise.mp3', 1800, '柔和的粉红噪音']
  ];

  const musicStmt = db.prepare('INSERT INTO sleep_music (name, category, url, duration, description) VALUES (?, ?, ?, ?, ?)');
  musicData.forEach(data => musicStmt.run(data));
  musicStmt.finalize();

  console.log('数据库初始化完成！');

  console.log('初始数据插入完成！');
});

db.close((err) => {
  if (err) {
    console.error('关闭数据库失败:', err.message);
  } else {
    console.log('数据库初始化完成！');
  }
});
