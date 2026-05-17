const sqlite3 = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = sqlite3(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS summaries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      source_url TEXT,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      banner TEXT,
      start_date DATETIME,
      end_date DATETIME,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS circles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      avatar TEXT,
      member_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS circle_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      circle_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT DEFAULT 'member',
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (circle_id) REFERENCES circles(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(circle_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      summary_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (summary_id) REFERENCES summaries(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      summary_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (summary_id) REFERENCES summaries(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(summary_id, user_id)
    );
  `);

  const adminExists = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?').get('admin');
  if (adminExists.count === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, password, nickname) VALUES (?, ?, ?)').run('admin', hashedPassword, '管理员');
  }

  const circleCount = db.prepare('SELECT COUNT(*) as count FROM circles').get();
  if (circleCount.count === 0) {
    db.prepare('INSERT INTO circles (name, description, member_count) VALUES (?, ?, ?)').run(
      '科技爱好者',
      '分享科技领域的精彩内容总结',
      128
    );
    db.prepare('INSERT INTO circles (name, description, member_count) VALUES (?, ?, ?)').run(
      '读书交流',
      '读书笔记和书籍摘要分享',
      256
    );
    db.prepare('INSERT INTO circles (name, description, member_count) VALUES (?, ?, ?)').run(
      '影视评论',
      '电影、剧集的精彩解读',
      512
    );
  }

  const activityCount = db.prepare('SELECT COUNT(*) as count FROM activities').get();
  if (activityCount.count === 0) {
    db.prepare('INSERT INTO activities (title, description, status) VALUES (?, ?, ?)').run(
      '2024年度最佳总结',
      '分享你认为最有价值的内容总结，赢取丰厚奖励！',
      'active'
    );
    db.prepare('INSERT INTO activities (title, description, status) VALUES (?, ?, ?)').run(
      '科技新知挑战赛',
      '解读最新科技资讯，成为科技课代表！',
      'active'
    );
  }
}

module.exports = { db, initDatabase };
