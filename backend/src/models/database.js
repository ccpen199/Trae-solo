const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      nickname TEXT,
      avatar TEXT,
      gender TEXT,
      age INTEGER,
      graduation_status TEXT,
      industry TEXT,
      profession TEXT,
      hometown TEXT,
      current_city TEXT,
      wechat_openid TEXT UNIQUE,
      is_profile_complete INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.exec(createUsersTable);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const seedUsers = [
      { phone: '13800000001', nickname: '小雨', gender: '女', age: 24, graduation_status: '已毕业', industry: '互联网/科技', profession: '产品', hometown: '杭州', current_city: '北京', avatar: 'https://picsum.photos/seed/girl1/400/400', is_profile_complete: 1 },
      { phone: '13800000002', nickname: '阿杰', gender: '男', age: 26, graduation_status: '已毕业', industry: '互联网/科技', profession: '技术', hometown: '成都', current_city: '上海', avatar: 'https://picsum.photos/seed/boy1/400/400', is_profile_complete: 1 },
      { phone: '13800000003', nickname: '思琪', gender: '女', age: 23, graduation_status: '在校', industry: '文化传媒', profession: '设计', hometown: '南京', current_city: '南京', avatar: 'https://picsum.photos/seed/girl2/400/400', is_profile_complete: 1 },
      { phone: '13800000004', nickname: '宇辰', gender: '男', age: 25, graduation_status: '已毕业', industry: '金融', profession: '运营', hometown: '武汉', current_city: '深圳', avatar: 'https://picsum.photos/seed/boy2/400/400', is_profile_complete: 1 },
      { phone: '13800000005', nickname: '晓彤', gender: '女', age: 22, graduation_status: '在校', industry: '教育', profession: '其他', hometown: '西安', current_city: '北京', avatar: 'https://picsum.photos/seed/girl3/400/400', is_profile_complete: 1 },
      { phone: '13800000006', nickname: '子轩', gender: '男', age: 27, graduation_status: '已毕业', industry: '医疗健康', profession: '市场', hometown: '广州', current_city: '广州', avatar: 'https://picsum.photos/seed/boy3/400/400', is_profile_complete: 1 },
    ];

    const insertUser = db.prepare(`
      INSERT INTO users (phone, nickname, gender, age, graduation_status, industry, profession, hometown, current_city, avatar, is_profile_complete)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    seedUsers.forEach(user => {
      insertUser.run(user.phone, user.nickname, user.gender, user.age, user.graduation_status, user.industry, user.profession, user.hometown, user.current_city, user.avatar, user.is_profile_complete);
    });

    const insertQuestion = db.prepare('INSERT INTO questions (user_id, content) VALUES (?, ?)');
    const questions = [
      { userId: 1, content: '你理想的周末是怎样度过的？' },
      { userId: 2, content: '你最喜欢的一本书是什么？为什么？' },
      { userId: 3, content: '如果能穿越，你想去哪个时代？' },
      { userId: 4, content: '你人生中最有成就感的一件事是？' },
      { userId: 5, content: '你觉得两个人相处最重要的是什么？' },
      { userId: 6, content: '如果你有超能力，你希望是什么？' },
    ];

    questions.forEach(q => {
      insertQuestion.run(q.userId, q.content);
    });
  }

  const createQuestionsTable = `
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.exec(createQuestionsTable);

  const createMatchesTable = `
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id_1 INTEGER NOT NULL,
      user_id_2 INTEGER NOT NULL,
      matched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      UNIQUE(user_id_1, user_id_2),
      FOREIGN KEY (user_id_1) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id_2) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.exec(createMatchesTable);

  const createFriendRequestsTable = `
    CREATE TABLE IF NOT EXISTS friend_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      question_id INTEGER,
      answer_type TEXT NOT NULL,
      answer_content TEXT,
      voice_duration INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE SET NULL
    )
  `;
  db.exec(createFriendRequestsTable);

  const createFriendsTable = `
    CREATE TABLE IF NOT EXISTS friends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id_1 INTEGER NOT NULL,
      user_id_2 INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id_1, user_id_2),
      FOREIGN KEY (user_id_1) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id_2) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.exec(createFriendsTable);

  const createPostsTable = `
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT,
      images TEXT,
      video TEXT,
      location TEXT,
      topics TEXT,
      visibility TEXT DEFAULT 'public',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.exec(createPostsTable);

  const createNotificationsTable = `
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      from_user_id INTEGER,
      content TEXT,
      related_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `;
  db.exec(createNotificationsTable);

  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id TEXT NOT NULL,
      from_user_id INTEGER NOT NULL,
      to_user_id INTEGER NOT NULL,
      type TEXT DEFAULT 'text',
      content TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `;
  db.exec(createMessagesTable);
};

initDatabase();

module.exports = db;
