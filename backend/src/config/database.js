const sqlite3 = require('sqlite3').verbose();
const path = require('path');

let db;

function initDB() {
  const dbPath = path.resolve(__dirname, '../../data/app.sqlite');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to SQLite database');
    }
  });
  
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      createTables()
        .then(() => seedData())
        .then(() => resolve(db))
        .catch(reject);
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        is_vip INTEGER DEFAULT 0,
        vip_expire_at DATETIME,
        total_meditation_minutes INTEGER DEFAULT 0,
        meditation_days INTEGER DEFAULT 0,
        last_meditation_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS meditation_plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        cover_image TEXT,
        duration INTEGER NOT NULL,
        level TEXT DEFAULT 'beginner',
        category TEXT,
        is_free INTEGER DEFAULT 1,
        total_days INTEGER NOT NULL,
        audio_url TEXT,
        guide_text TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS user_plan_progress (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        plan_id INTEGER NOT NULL,
        current_day INTEGER DEFAULT 1,
        completed_days TEXT DEFAULT '[]',
        total_minutes INTEGER DEFAULT 0,
        last_practice_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, plan_id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (plan_id) REFERENCES meditation_plans(id)
      )`,
      `CREATE TABLE IF NOT EXISTS daily_practices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        plan_id INTEGER,
        practice_date DATE NOT NULL,
        duration INTEGER NOT NULL,
        self_score INTEGER,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (plan_id) REFERENCES meditation_plans(id)
      )`,
      `CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        cover_image TEXT,
        instructor TEXT,
        duration INTEGER,
        is_free INTEGER DEFAULT 1,
        video_url TEXT,
        category TEXT,
        view_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS nowhere_today (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        audio_url TEXT,
        duration INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    let completed = 0;
    tables.forEach((sql) => {
      db.run(sql, (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
          reject(err);
        } else {
          completed++;
          if (completed === tables.length) {
            resolve();
          }
        }
      });
    });
  });
}

function seedData() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM meditation_plans', (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row.count === 0) {
        const plans = [
          ['7天入门冥想', '适合冥想新手的入门课程，每天10分钟，带你进入冥想世界', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400', 10, 'beginner', '入门', 1, 7, '/audio/beginner-7days.mp3', '找一个舒适的位置坐下，闭上眼睛...'],
          ['21天专注力训练', '通过21天的系统训练，提升专注力和觉察能力', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400', 15, 'intermediate', '专注力', 0, 21, '/audio/focus-21days.mp3', '将注意力集中在呼吸上...'],
          ['睡前放松冥想', '帮助放松身心，改善睡眠质量的冥想练习', 'https://images.unsplash.com/photo-1511295742362-92c69b1cf484?w=400', 20, 'beginner', '睡眠', 1, 14, '/audio/sleep-relax.mp3', '深呼吸，感受身体的放松...'],
          ['压力释放课程', '专为高压人群设计，释放压力，找回内心平静', 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=400', 25, 'advanced', '压力管理', 0, 30, '/audio/stress-release.mp3', '觉察压力，接纳当下的感受...']
        ];

        let planCompleted = 0;
        plans.forEach((plan) => {
          db.run(`
            INSERT INTO meditation_plans 
            (title, description, cover_image, duration, level, category, is_free, total_days, audio_url, guide_text)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, plan, (err) => {
            if (err) {
              console.error('Error inserting plan:', err.message);
            }
            planCompleted++;
            if (planCompleted === plans.length) {
              insertCourses(resolve, reject);
            }
          });
        });
      } else {
        insertCourses(resolve, reject);
      }
    });
  });
}

function insertCourses(resolve, reject) {
  db.get('SELECT COUNT(*) as count FROM courses', (err, row) => {
    if (err) {
      reject(err);
      return;
    }

    if (row.count === 0) {
      const courses = [
        ['冥想基础入门', '从零开始学习冥想的核心概念和基本技巧', 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=400', '李明老师', 45, 1, '/video/basics.mp4', '基础理论'],
        ['呼吸法精讲', '深入讲解各种呼吸技巧及其应用', 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=400', '王静导师', 60, 0, '/video/breathing.mp4', '呼吸技巧'],
        ['正念生活实践', '将正念融入日常生活的实用方法', 'https://images.unsplash.com/photo-1593811167562-8cef4f80d821?w=400', '张慧导师', 90, 0, '/video/mindfulness.mp4', '生活应用']
      ];

      let courseCompleted = 0;
      courses.forEach((course) => {
        db.run(`
          INSERT INTO courses 
          (title, description, cover_image, instructor, duration, is_free, video_url, category)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, course, (err) => {
          if (err) {
            console.error('Error inserting course:', err.message);
          }
          courseCompleted++;
          if (courseCompleted === courses.length) {
            insertToday(resolve, reject);
          }
        });
      });
    } else {
      insertToday(resolve, reject);
    }
  });
}

function insertToday(resolve, reject) {
  const today = new Date().toISOString().split('T')[0];
  db.run(`
    INSERT OR IGNORE INTO nowhere_today 
    (date, title, description, audio_url, duration)
    VALUES (?, ?, ?, ?, ?)
  `, [today, '今日冥想：活在当下', '让我们一起觉察当下的每一刻，感受呼吸的流动', '/audio/today-default.mp3', 10], (err) => {
    if (err) {
      console.error('Error inserting today:', err.message);
    }
    resolve();
  });
}

function getDB() {
  return db;
}

module.exports = initDB;
module.exports.getDB = getDB;
