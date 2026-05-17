const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new sqlite3.Database(dbPath);

function initTables() {
  const tables = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      nickname TEXT NOT NULL,
      avatar TEXT,
      password TEXT NOT NULL,
      bio TEXT,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('cat', 'dog')),
      breed TEXT,
      age INTEGER,
      avatar TEXT,
      description TEXT,
      for_adoption INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      media_type TEXT CHECK(media_type IN ('image', 'video')),
      media_url TEXT,
      location TEXT,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      parent_id INTEGER,
      like_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT,
      agree_count INTEGER DEFAULT 0,
      disagree_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS question_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      vote_type INTEGER NOT NULL CHECK(vote_type IN (1, -1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(question_id, user_id),
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      agree_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
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

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL CHECK(target_type IN ('post', 'question')),
      target_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, target_type, target_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id),
      FOREIGN KEY (to_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS adoptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      pet_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (pet_id) REFERENCES pets(id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_id INTEGER NOT NULL,
      target_type TEXT NOT NULL CHECK(target_type IN ('post', 'user', 'comment')),
      target_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS browse_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      target_type TEXT NOT NULL CHECK(target_type IN ('post', 'question', 'user')),
      target_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `;

  return new Promise((resolve, reject) => {
    db.exec(tables, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function initMockData() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row.count === 0) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = bcrypt.hashSync('123456', 10);

        db.serialize(() => {
          const stmtUser = db.prepare(`
            INSERT INTO users (phone, nickname, avatar, password, bio, location)
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          
          stmtUser.run('13800138001', '铲屎官小王', 'https://loremflickr.com/100/100/cat', hashedPassword, '家有两只布偶猫', '北京市朝阳区');
          stmtUser.run('13800138002', '狗狗爱好者', 'https://loremflickr.com/100/100/dog', hashedPassword, '金毛铲屎官一枚', '上海市浦东新区');
          stmtUser.run('13800138003', '喵星人', 'https://loremflickr.com/100/100/kitten', hashedPassword, '猫咪就是天使', '广州市天河区');
          stmtUser.finalize();

          const stmtPet = db.prepare(`
            INSERT INTO pets (user_id, name, type, breed, age, avatar, description, for_adoption)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          stmtPet.run(1, '团团', 'cat', '布偶', 2, 'https://loremflickr.com/200/200/ragdoll', '温柔的布偶猫妹妹', 0);
          stmtPet.run(1, '圆圆', 'cat', '布偶', 1, 'https://loremflickr.com/200/200/cute', '活泼的布偶弟弟', 1);
          stmtPet.run(2, '旺财', 'dog', '金毛', 3, 'https://loremflickr.com/200/200/golden', '暖男金毛大宝宝', 0);
          stmtPet.finalize();

          const stmtPost = db.prepare(`
            INSERT INTO posts (user_id, content, media_type, media_url, location, like_count, comment_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          
          stmtPost.run(1, '今天团团又在晒太阳，真是惬意啊～布偶猫的颜值真的太高了！', 'image', 'https://loremflickr.com/600/400/cat,sun', '北京市朝阳区', 128, 23);
          stmtPost.run(2, '旺财今天在公园玩得超开心！金毛真是精力旺盛，遛完我也累了😂', 'image', 'https://loremflickr.com/600/400/dog,park', '上海市浦东新区', 89, 15);
          stmtPost.run(3, '分享一下我家猫咪的日常，每天早上都会叫我起床～真的是小闹钟⏰', 'image', 'https://loremflickr.com/600/400/kitten,cute', '广州市天河区', 256, 42);
          stmtPost.run(1, '圆圆今天学会了握手！太聪明了我的宝贝～', 'image', 'https://loremflickr.com/600/400/cat,play', '北京市朝阳区', 67, 8);
          stmtPost.run(2, '金毛真的是天使狗狗，每次我难过的时候都会过来安慰我❤️', 'image', 'https://loremflickr.com/600/400/golden,retriever', '上海市浦东新区', 198, 31);
          stmtPost.finalize();

          const stmtQuestion = db.prepare(`
            INSERT INTO questions (user_id, title, content, category, agree_count, disagree_count, view_count)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `);
          
          stmtQuestion.run(1, '猫咪突然不吃猫粮怎么办？', '我家猫咪最近突然不吃猫粮了，但是精神状态还不错，有没有懂的朋友？', '健康', 45, 2, 892);
          stmtQuestion.run(2, '金毛每天需要遛多久？', '刚养了一只小金毛，请问每天需要遛多长时间比较合适？', '饲养', 78, 1, 1256);
          stmtQuestion.run(3, '如何让猫咪不抓沙发？', '家里的沙发已经被抓得惨不忍睹了，求各位大神支支招！', '行为', 123, 5, 2341);
          stmtQuestion.finalize();

          db.run('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)', [2, 1]);
          db.run('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)', [3, 1]);
          db.run('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)', [1, 2]);
          db.run('INSERT OR IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)', [3, 2], (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      } else {
        resolve();
      }
    });
  });
}

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function runGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function runRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

module.exports = {
  db,
  initTables,
  initMockData,
  runQuery,
  runGet,
  runRun
};
