const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db;
const dbPath = process.env.DB_PATH || './data/personal.db';
const dataDir = path.dirname(dbPath);

async function initDatabase() {
  const SQL = await initSqlJs();
  
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
    initTables();
    initSeedData();
    saveDatabase();
  }
  
  console.log('数据库初始化完成');
  return db;
}

function initTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS profile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      title TEXT,
      avatar TEXT,
      bio TEXT,
      email TEXT,
      phone TEXT,
      location TEXT,
      github TEXT,
      website TEXT,
      interests TEXT,
      experience TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      title TEXT NOT NULL,
      slug TEXT UNIQUE,
      content TEXT,
      summary TEXT,
      cover_image TEXT,
      author TEXT DEFAULT '站长',
      status INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      is_recommended INTEGER DEFAULT 0,
      published_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS albums (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      cover_image TEXT,
      sort_order INTEGER DEFAULT 0,
      is_recommended INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      album_id INTEGER NOT NULL,
      title TEXT,
      description TEXT,
      url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      url TEXT,
      cover_image TEXT,
      artist TEXT,
      year INTEGER,
      rating INTEGER,
      is_recommended INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      content TEXT NOT NULL,
      reply TEXT,
      ip TEXT,
      user_agent TEXT,
      status INTEGER DEFAULT 0,
      is_sensitive INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_photos_album ON photos(album_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status)`);
}

function initSeedData() {
  db.run(`
    INSERT INTO categories (name, slug, description, icon, sort_order) VALUES
    ('日志', 'blog', '个人文章和随笔', '📝', 1),
    ('学习园地', 'learning', '课程、资料和学习心得', '📚', 2),
    ('相册', 'gallery', '个人照片和收藏', '📷', 3),
    ('音乐影视', 'media', '兴趣内容分享', '🎵', 4),
    ('留言板', 'guestbook', '访客留言和反馈', '💬', 5)
  `);

  db.run(`
    INSERT INTO profile (name, title, avatar, bio, email, location, interests, experience) VALUES
    ('张三', '全栈开发者', '', 
    '热爱编程和开源技术，专注于 Web 开发和系统架构。喜欢分享知识，记录成长。',
    'zhangsan@example.com', '北京',
    'JavaScript, Vue, Node.js, 摄影, 音乐, 旅行',
    '5年+ 软件开发经验，参与过多个大型项目的架构设计和开发工作。')
  `);

  db.run(`
    INSERT INTO articles (category_id, title, slug, content, summary, status, is_recommended, published_at) VALUES
    (1, '欢迎来到我的个人网站', 'welcome-to-my-site', 
    '# 欢迎\n\n这是我的个人网站，记录我的学习、生活和思考。\n\n## 关于我\n\n我是一名热爱技术的开发者，喜欢探索新技术和分享知识。',
    '欢迎访问我的个人网站，这里记录着我的学习、生活和思考。',
    1, 1, datetime('now')),
    (1, 'JavaScript 异步编程最佳实践', 'javascript-async-practices',
    '# JavaScript 异步编程\n\n## Promise\n\nPromise 是 JavaScript 处理异步操作的标准方式。\n\n## async/await\n\nasync/await 让异步代码看起来像同步代码一样简洁。',
    '深入探讨 JavaScript 异步编程的最佳实践，包括 Promise 和 async/await。',
    1, 1, datetime('now', '-1 day')),
    (2, 'Vue 3 组合式 API 入门', 'vue3-composition-api',
    '# Vue 3 组合式 API\n\n组合式 API 是 Vue 3 的核心特性之一，让逻辑复用变得更加简单。\n\n## setup 函数\n\nsetup 是组合式 API 的入口点。',
    '学习 Vue 3 组合式 API，掌握现代 Vue 开发方式。',
    1, 1, datetime('now', '-2 days'))
  `);

  db.run(`
    INSERT INTO albums (name, description, cover_image, is_recommended, sort_order) VALUES
    ('日常生活', '记录生活中的美好瞬间', '', 1, 1),
    ('旅行记忆', '世界各地的风景和人文', '', 1, 2),
    ('技术分享', '技术活动和分享会的照片', '', 0, 3)
  `);

  db.run(`
    INSERT INTO media (category, title, description, type, artist, year, rating, is_recommended) VALUES
    ('music', '夜曲', '周杰伦经典歌曲', 'music', '周杰伦', 2004, 5, 1),
    ('movie', '肖申克的救赎', '经典励志电影', 'movie', '弗兰克·德拉邦特', 1994, 5, 1),
    ('music', '晴天', '青春回忆', 'music', '周杰伦', 2003, 5, 0)
  `);

  db.run(`
    INSERT INTO messages (name, email, content, reply, status, created_at) VALUES
    ('访客小明', 'xiaoming@example.com', '网站做得很棒，内容很丰富！', '感谢支持！', 1, datetime('now', '-5 days')),
    ('技术爱好者', 'tech@example.com', '文章写得很好，学到了很多。', '', 0, datetime('now', '-1 day'))
  `);

  db.run(`
    INSERT INTO users (username, password, role) VALUES
    ('admin', 'admin123', 'admin')
  `);
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function getDatabase() {
  return db;
}

function runQuery(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.run(params);
  } else {
    stmt.run();
  }
  const result = {
    lastInsertRowid: db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0],
    changes: db.getRowsModified()
  };
  stmt.free();
  saveDatabase();
  return result;
}

function allQuery(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function getQuery(sql, params = []) {
  const results = allQuery(sql, params);
  return results.length > 0 ? results[0] : null;
}

module.exports = {
  initDatabase,
  getDatabase,
  runQuery,
  allQuery,
  getQuery
};
