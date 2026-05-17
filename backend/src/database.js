const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new sqlite3.Database(dbPath);

const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`PRAGMA foreign_keys = ON`);

      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE,
        username TEXT UNIQUE,
        password TEXT,
        avatar TEXT,
        nickname TEXT,
        bio TEXT,
        follower_count INTEGER DEFAULT 0,
        following_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        title TEXT,
        description TEXT,
        video_url TEXT,
        cover_url TEXT,
        music TEXT,
        location TEXT,
        latitude REAL,
        longitude REAL,
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        share_count INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 15,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER,
        user_id INTEGER,
        content TEXT,
        like_count INTEGER DEFAULT 0,
        parent_id INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (video_id) REFERENCES videos(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER,
        user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(video_id, user_id),
        FOREIGN KEY (video_id) REFERENCES videos(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id INTEGER,
        following_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, following_id),
        FOREIGN KEY (follower_id) REFERENCES users(id),
        FOREIGN KEY (following_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS hashtags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        video_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS video_hashtags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id INTEGER,
        hashtag_id INTEGER,
        FOREIGN KEY (video_id) REFERENCES videos(id),
        FOREIGN KEY (hashtag_id) REFERENCES hashtags(id),
        UNIQUE(video_id, hashtag_id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS hot_searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        keyword TEXT UNIQUE,
        search_count INTEGER DEFAULT 0,
        is_hot INTEGER DEFAULT 0,
        rank INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        image_url TEXT,
        link_url TEXT,
        position INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS musics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        artist TEXT,
        cover_url TEXT,
        audio_url TEXT,
        duration INTEGER,
        use_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      resolve();
    });
  });
};

const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  db,
  initDatabase,
  runQuery,
  getQuery,
  allQuery
};
