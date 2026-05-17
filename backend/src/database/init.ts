
import db from './index';
import bcrypt from 'bcryptjs';

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone VARCHAR(20) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      nickname VARCHAR(50),
      avatar VARCHAR(255),
      role VARCHAR(20) DEFAULT 'parent',
      storage_used BIGINT DEFAULT 0,
      storage_limit BIGINT DEFAULT 10737418240,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS babies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name VARCHAR(50) NOT NULL,
      gender VARCHAR(10),
      birthday DATE,
      avatar VARCHAR(255),
      birth_weight DECIMAL,
      birth_height DECIMAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS family_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      family_id INTEGER NOT NULL,
      relation VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (family_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, family_id)
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      baby_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      type VARCHAR(10) NOT NULL,
      file_path VARCHAR(255) NOT NULL,
      thumbnail_path VARCHAR(255),
      file_size BIGINT,
      width INTEGER,
      height INTEGER,
      duration INTEGER,
      caption TEXT,
      taken_at DATETIME,
      location VARCHAR(255),
      is_favorite BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (baby_id) REFERENCES babies(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS moments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT,
      media_ids TEXT,
      like_count INTEGER DEFAULT 0,
      comment_count INTEGER DEFAULT 0,
      visibility VARCHAR(20) DEFAULT 'family',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS moment_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      moment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(moment_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      moment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      reply_to INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (moment_id) REFERENCES moments(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reply_to) REFERENCES comments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      cover_image VARCHAR(255),
      instructor VARCHAR(100),
      price DECIMAL DEFAULT 0,
      lesson_count INTEGER DEFAULT 0,
      status VARCHAR(20) DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title VARCHAR(200) NOT NULL,
      content TEXT,
      video_url VARCHAR(255),
      duration INTEGER,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_id INTEGER NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      due_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      price DECIMAL NOT NULL,
      status VARCHAR(20) DEFAULT 'completed',
      purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      UNIQUE(user_id, course_id)
    );

    CREATE TABLE IF NOT EXISTS learning_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      progress INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT 0,
      last_watched_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
      UNIQUE(user_id, lesson_id)
    );

    CREATE INDEX IF NOT EXISTS idx_media_baby_id ON media(baby_id);
    CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_moments_created_at ON moments(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_comments_moment_id ON comments(moment_id);
  `);

  console.log('数据库表创建完成');
}

function initAdmin() {
  const adminPhone = '13800138000';
  const existingAdmin = db.prepare('SELECT id FROM users WHERE phone = ?').get(adminPhone);
  
  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (phone, password_hash, nickname, role, storage_limit)
      VALUES (?, ?, ?, ?, ?)
    `).run(adminPhone, passwordHash, '管理员', 'admin', 10995116277760);
    
    console.log('管理员账号创建完成: 13800138000 / admin123');
  } else {
    console.log('管理员账号已存在');
  }
}

function initDemoData() {
  const demoUser = db.prepare('SELECT id FROM users WHERE phone = ?').get('13800000001');
  
  if (!demoUser) {
    const passwordHash = bcrypt.hashSync('123456', 10);
    const userId = db.prepare(`
      INSERT INTO users (phone, password_hash, nickname, role)
      VALUES (?, ?, ?, ?)
    `).run('13800000001', passwordHash, '宝爸小明', 'parent').lastInsertRowid;

    const babyId = db.prepare(`
      INSERT INTO babies (user_id, name, gender, birthday, birth_weight, birth_height)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, '小天使', 'female', '2023-06-01', 3.5, 50).lastInsertRowid;

    for (let i = 1; i <= 10; i++) {
      db.prepare(`
        INSERT INTO media (baby_id, user_id, type, file_path, caption, taken_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        babyId,
        userId,
        i % 3 === 0 ? 'video' : 'photo',
        `/uploads/demo/photo${i}.jpg`,
        `第${i}张照片记录美好时光`,
        `2023-0${6 + Math.floor(i / 3)}-${10 + i} 10:00:00`
      );
    }

    console.log('演示数据创建完成: 13800000001 / 123456');
  }
}

function init() {
  try {
    initTables();
    initAdmin();
    initDemoData();
    console.log('数据库初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  }
}

init();
