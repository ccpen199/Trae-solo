import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db: Database.Database = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS videos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      duration INTEGER NOT NULL DEFAULT 0,
      url TEXT NOT NULL,
      thumbnail TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      is_vip BOOLEAN NOT NULL DEFAULT 0,
      album_id INTEGER,
      episode_no INTEGER,
      aspect_ratio TEXT DEFAULT '16:9',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      cover TEXT,
      total_episodes INTEGER DEFAULT 0,
      is_vip BOOLEAN NOT NULL DEFAULT 0,
      auto_play BOOLEAN NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      is_vip BOOLEAN NOT NULL DEFAULT 0,
      vip_expire_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS advertisements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      video_url TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 5,
      target_url TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      position INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS play_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      video_id INTEGER NOT NULL,
      progress INTEGER DEFAULT 0,
      duration INTEGER DEFAULT 0,
      is_complete BOOLEAN DEFAULT 0,
      client_ip TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ad_impressions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad_id INTEGER NOT NULL,
      user_id INTEGER,
      type TEXT NOT NULL,
      is_clicked BOOLEAN DEFAULT 0,
      client_ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS video_quality (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id INTEGER NOT NULL,
      quality TEXT NOT NULL,
      url TEXT NOT NULL,
      bandwidth INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, is_vip) VALUES (?, ?, 1)').run('admin', hash);
  }

  insertSampleData();
}

function insertSampleData() {
  const videoCount = db.prepare('SELECT COUNT(*) as count FROM videos').get().count;
  if (videoCount === 0) {
    const insertVideo = db.prepare(`
      INSERT INTO videos (title, description, duration, url, thumbnail, is_vip, aspect_ratio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleVideos = [
      { title: '样片视频1-自然风光', description: '美丽的自然风光记录片', duration: 120, url: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: 'https://picsum.photos/640/360?random=1', is_vip: 0, aspect_ratio: '16:9' },
      { title: '样片视频2-VIP专享', description: 'VIP会员专享高清内容', duration: 180, url: 'https://www.w3schools.com/html/movie.mp4', thumbnail: 'https://picsum.photos/640/360?random=2', is_vip: 1, aspect_ratio: '16:9' },
      { title: '4:3比例视频', description: '传统4:3比例视频内容', duration: 90, url: 'https://www.w3schools.com/html/mov_bbb.mp4', thumbnail: 'https://picsum.photos/640/480?random=3', is_vip: 0, aspect_ratio: '4:3' },
    ];

    sampleVideos.forEach(v => {
      insertVideo.run(v.title, v.description, v.duration, v.url, v.thumbnail, v.is_vip, v.aspect_ratio);
    });

    const insertAd = db.prepare(`
      INSERT INTO advertisements (type, title, video_url, duration, position)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertAd.run('pre', '前贴广告1', 'https://www.w3schools.com/html/mov_bbb.mp4', 5, 1);
    insertAd.run('pause', '暂停广告', 'https://www.w3schools.com/html/mov_bbb.mp4', 10, 1);
    insertAd.run('mid', '中插广告', 'https://www.w3schools.com/html/mov_bbb.mp4', 5, 60);

    const insertQuality = db.prepare(`
      INSERT INTO video_quality (video_id, quality, url, bandwidth)
      VALUES (?, ?, ?, ?)
    `);

    for (let i = 1; i <= 3; i++) {
      insertQuality.run(i, '480p', 'https://www.w3schools.com/html/mov_bbb.mp4', 1000);
      insertQuality.run(i, '720p', 'https://www.w3schools.com/html/mov_bbb.mp4', 2500);
      insertQuality.run(i, '1080p', 'https://www.w3schools.com/html/mov_bbb.mp4', 5000);
    }

    db.prepare(`
      INSERT INTO settings (key, value) VALUES 
      ('auto_play', '1'),
      ('default_quality', '720p')
    `).run();
  }
}

export default db;
