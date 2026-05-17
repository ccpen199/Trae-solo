const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS translation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      source_text TEXT NOT NULL,
      target_text TEXT NOT NULL,
      source_lang TEXT NOT NULL,
      target_lang TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS favorite_translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      source_text TEXT NOT NULL,
      target_text TEXT NOT NULL,
      source_lang TEXT NOT NULL,
      target_lang TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, source_text, source_lang, target_lang)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS speaking_practice (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      original_text TEXT NOT NULL,
      user_audio TEXT,
      score REAL,
      feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS world_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT,
      likes_count INTEGER DEFAULT 0,
      language TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS simultaneous_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      session_id TEXT UNIQUE NOT NULL,
      source_lang TEXT NOT NULL,
      target_lang TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ended_at DATETIME
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS simultaneous_translations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      source_text TEXT NOT NULL,
      target_text TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const stmt = db.prepare('SELECT COUNT(*) as count FROM world_posts');
  const result = stmt.get();
  if (result.count === 0) {
    const insertStmt = db.prepare(`
      INSERT INTO world_posts (title, content, language, likes_count) VALUES (?, ?, ?, ?)
    `);
    insertStmt.run('日常英语表达', '学习日常交流中常用的英语表达方式，让你的口语更加地道自然。', 'en', 128);
    insertStmt.run('旅游英语必备', '出国旅游必备的英语句子，包括机场、酒店、餐厅等场景。', 'en', 89);
    insertStmt.run('商务邮件写作', '商务邮件的写作技巧，常用句型和格式规范。', 'en', 256);
    insertStmt.run('日语入门词汇', '学习日语最基础的词汇，为日语学习打下坚实基础。', 'ja', 67);
    insertStmt.run('韩语日常对话', '韩语日常对话常用表达，轻松应对韩国旅行。', 'ko', 145);
  }

  console.log('Database tables created successfully');
} catch (err) {
  console.error('Error:', err);
} finally {
  db.close();
}
