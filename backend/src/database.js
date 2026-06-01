const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'teacher', 'coach', 'admin', 'platform', 'ops')),
      phone TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS training_camps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_days INTEGER NOT NULL,
      max_makeup_days INTEGER DEFAULT 3,
      status TEXT DEFAULT 'active' CHECK(status IN ('draft', 'active', 'completed', 'archived')),
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS daily_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camp_id INTEGER REFERENCES training_camps(id) ON DELETE CASCADE,
      day_number INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      materials TEXT,
      checkin_rule TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(camp_id, day_number)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camp_id INTEGER REFERENCES training_camps(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      teacher_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS camp_enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camp_id INTEGER REFERENCES training_camps(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      group_id INTEGER REFERENCES groups(id),
      points INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      max_streak INTEGER DEFAULT 0,
      makeup_days_used INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'dropped', 'completed')),
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(camp_id, user_id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS checkin_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camp_id INTEGER REFERENCES training_camps(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      task_id INTEGER REFERENCES daily_tasks(id),
      day_number INTEGER NOT NULL,
      content TEXT,
      images TEXT,
      audio_url TEXT,
      video_url TEXT,
      visibility TEXT DEFAULT 'public' CHECK(visibility IN ('public', 'group', 'private', 'teacher')),
      coach_id INTEGER REFERENCES users(id),
      coach_comment TEXT,
      coach_rating INTEGER,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'excellent')),
      is_makeup BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      camp_id INTEGER REFERENCES training_camps(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      approved_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      related_id INTEGER,
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      referrer_id INTEGER REFERENCES users(id),
      referred_name TEXT,
      referred_phone TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'contacted', 'enrolled', 'lost')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS renewal_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      camp_id INTEGER REFERENCES training_camps(id),
      interest_level INTEGER DEFAULT 0,
      intended_camp TEXT,
      notes TEXT,
      status TEXT DEFAULT 'new' CHECK(status IN ('new', 'contacted', 'negotiating', 'converted', 'lost')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
      console.error('Error checking users:', err);
      return;
    }
    
    if (row.count === 0) {
      console.log('Initializing test data...');
      const hash = bcrypt.hashSync('123456', 10);
      
      const insertUserStmt = db.prepare('INSERT INTO users (username, password, name, role, phone) VALUES (?, ?, ?, ?, ?)');
      
      insertUserStmt.run('admin', hash, '系统管理员', 'admin', '13800000001');
      insertUserStmt.run('platform', hash, '平台运营', 'platform', '13800000004');
      insertUserStmt.run('ops', hash, '运营专员', 'ops', '13800000005');
      insertUserStmt.run('teacher1', hash, '张班主任', 'teacher', '13800000002');
      insertUserStmt.run('coach1', hash, '李教练', 'coach', '13800000003');
      insertUserStmt.run('student1', hash, '学员小明', 'student', '13800000011');
      insertUserStmt.run('student2', hash, '学员小红', 'student', '13800000012');
      insertUserStmt.run('student3', hash, '学员小刚', 'student', '13800000013');
      
      insertUserStmt.finalize();

      const insertCampStmt = db.prepare('INSERT INTO training_camps (name, description, start_date, end_date, total_days, max_makeup_days, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
      insertCampStmt.run('21天减脂训练营', '科学减脂，健康生活，21天养成好习惯', '2026-05-01', '2026-05-21', 21, 3, 1, function(err) {
        if (err) {
          console.error('Error inserting camp:', err);
          return;
        }
        const campId = this.lastID;

        const insertGroupStmt = db.prepare('INSERT INTO groups (camp_id, name, teacher_id) VALUES (?, ?, ?)');
        insertGroupStmt.run(campId, '减脂一班', 2, function(err) {
          if (err) return;
          const groupId = this.lastID;

          const insertTaskStmt = db.prepare('INSERT INTO daily_tasks (camp_id, day_number, title, content, materials, checkin_rule) VALUES (?, ?, ?, ?, ?, ?)');
          const taskTitles = ['饮食记录', '有氧训练', '力量训练', '冥想放松', '营养学习'];
          for (let i = 1; i <= 21; i++) {
            insertTaskStmt.run(
              campId, 
              i, 
              `第${i}天：${taskTitles[i % 5]}任务`, 
              `完成第${i}天的训练任务，保持积极心态！\n\n今日重点：\n1. 完成30分钟有氧运动\n2. 记录三餐饮食\n3. 喝水2000ml以上`,
              `["https://example.com/material${i}.pdf"]`,
              '上传运动截图和饮食照片'
            );
          }
          insertTaskStmt.finalize();

          const enrollStmt = db.prepare('INSERT INTO camp_enrollments (camp_id, user_id, group_id) VALUES (?, ?, ?)');
          enrollStmt.run(campId, 4, groupId);
          enrollStmt.run(campId, 5, groupId);
          enrollStmt.run(campId, 6, groupId);
          enrollStmt.finalize();

          console.log('Test data initialized successfully');
        });
        insertGroupStmt.finalize();
      });
      insertCampStmt.finalize();
    }
  });
});

const runAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const getAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allAsync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

module.exports = {
  db,
  runAsync,
  getAsync,
  allAsync
};
