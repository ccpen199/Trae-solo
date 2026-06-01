const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nickname TEXT,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'reader',
  phone TEXT,
  email TEXT,
  balance REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS novels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author_id INTEGER NOT NULL,
  editor_id INTEGER,
  category_id INTEGER,
  tags TEXT,
  description TEXT,
  cover_image TEXT,
  sign_status TEXT DEFAULT 'unsigned',
  serialize_status TEXT DEFAULT 'ongoing',
  word_count INTEGER DEFAULT 0,
  chapter_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  subscribe_count INTEGER DEFAULT 0,
  vote_count INTEGER DEFAULT 0,
  score REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (editor_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  novel_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  word_count INTEGER DEFAULT 0,
  chapter_order INTEGER NOT NULL,
  is_free INTEGER DEFAULT 1,
  price REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  publish_time DATETIME,
  audit_status TEXT DEFAULT 'pending',
  audit_remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chapter_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER NOT NULL,
  title TEXT,
  content TEXT,
  word_count INTEGER,
  modified_by INTEGER,
  modify_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS bookshelves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  last_read_chapter_id INTEGER,
  last_read_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, novel_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'chapter',
  chapter_id INTEGER,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'success',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (novel_id) REFERENCES novels(id),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  novel_id INTEGER,
  chapter_id INTEGER,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  pay_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (novel_id) REFERENCES novels(id),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  chapter_id INTEGER,
  content TEXT NOT NULL,
  parent_id INTEGER,
  like_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (novel_id) REFERENCES novels(id),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

CREATE TABLE IF NOT EXISTS rewards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (novel_id) REFERENCES novels(id)
);

CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  vote_type TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, novel_id, vote_type),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (novel_id) REFERENCES novels(id)
);

CREATE TABLE IF NOT EXISTS reading_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  chapter_id INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, novel_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (novel_id) REFERENCES novels(id),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  novel_id INTEGER NOT NULL,
  position TEXT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (novel_id) REFERENCES novels(id)
);

CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL,
  period TEXT NOT NULL,
  subscribe_income REAL DEFAULT 0,
  reward_income REAL DEFAULT 0,
  activity_bonus REAL DEFAULT 0,
  deduction REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS settlement_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  settlement_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  novel_id INTEGER,
  amount REAL NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (settlement_id) REFERENCES settlements(id) ON DELETE CASCADE,
  FOREIGN KEY (novel_id) REFERENCES novels(id)
);

CREATE TABLE IF NOT EXISTS editor_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  editor_id INTEGER NOT NULL,
  novel_id INTEGER NOT NULL,
  task_type TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (editor_id) REFERENCES users(id),
  FOREIGN KEY (novel_id) REFERENCES novels(id)
);

CREATE TABLE IF NOT EXISTS violation_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  novel_id INTEGER,
  chapter_id INTEGER,
  user_id INTEGER,
  violation_type TEXT NOT NULL,
  description TEXT,
  handler_id INTEGER,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (novel_id) REFERENCES novels(id),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (handler_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`);

const bcrypt = require('bcryptjs');
const saltRounds = 10;

const initData = db.transaction(() => {
  const categories = ['玄幻奇幻', '都市青春', '科幻未来', '历史军事', '游戏竞技', '灵异悬疑', '武侠仙侠', '言情小说'];
  const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name) VALUES (?)');
  categories.forEach(cat => insertCategory.run(cat));

  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, nickname, role, phone) VALUES (?, ?, ?, ?, ?)');
  
  insertUser.run('admin', bcrypt.hashSync('admin123', saltRounds), '管理员', 'admin', '13800000000');
  insertUser.run('editor1', bcrypt.hashSync('editor123', saltRounds), '编辑小王', 'editor', '13800000001');
  insertUser.run('editor2', bcrypt.hashSync('editor123', saltRounds), '编辑老李', 'editor', '13800000002');
  insertUser.run('author1', bcrypt.hashSync('author123', saltRounds), '作家小明', 'author', '13800000003');
  insertUser.run('author2', bcrypt.hashSync('author123', saltRounds), '作家小红', 'author', '13800000004');
  insertUser.run('reader1', bcrypt.hashSync('reader123', saltRounds), '读者张三', 'reader', '13800000005');
  insertUser.run('reader2', bcrypt.hashSync('reader123', saltRounds), '读者李四', 'reader', '13800000006');
  insertUser.run('finance1', bcrypt.hashSync('finance123', saltRounds), '结算员小芳', 'finance', '13800000007');

  const getUserId = db.prepare('SELECT id FROM users WHERE username = ?');
  const author1Id = getUserId.get('author1').id;
  const author2Id = getUserId.get('author2').id;
  const editor1Id = getUserId.get('editor1').id;
  const editor2Id = getUserId.get('editor2').id;

  const insertNovel = db.prepare(`
    INSERT INTO novels (title, author_id, editor_id, category_id, tags, description, sign_status, serialize_status, word_count, chapter_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const novels = [
    ['斗破天穹', author1Id, editor1Id, 1, '玄幻,升级流,热血', '一个少年从废物到巅峰的传奇故事...', 'signed', 'ongoing', 500000, 120],
    ['都市神医', author1Id, editor1Id, 2, '都市,神医,爽文', '小医生混迹都市，妙手回春...', 'signed', 'ongoing', 300000, 85],
    ['星际跃迁', author2Id, editor2Id, 3, '科幻,机甲,星际', '未来世界的星际冒险...', 'signed', 'ongoing', 800000, 200],
    ['大明之崛起', author2Id, editor2Id, 4, '历史,穿越,争霸', '穿越到明朝，开启盛世...', 'unsigned', 'ongoing', 150000, 45],
  ];

  novels.forEach(n => insertNovel.run(...n));

  const insertChapter = db.prepare(`
    INSERT INTO chapters (novel_id, title, content, word_count, chapter_order, is_free, price, status, publish_time, audit_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (let i = 1; i <= 20; i++) {
    insertChapter.run(
      1,
      `第${i}章 标题`,
      `这是第${i}章的内容。${'测试内容 '.repeat(100)}`,
      2000 + i * 50,
      i,
      i <= 5 ? 1 : 0,
      i <= 5 ? 0 : 0.05,
      'published',
      now,
      'approved'
    );
  }

  for (let i = 1; i <= 15; i++) {
    insertChapter.run(
      3,
      `第${i}章 星际篇`,
      `星际冒险第${i}章内容。${'科幻内容 '.repeat(80)}`,
      3000 + i * 30,
      i,
      i <= 3 ? 1 : 0,
      i <= 3 ? 0 : 0.08,
      'published',
      now,
      'approved'
    );
  }
});

initData();

console.log('数据库初始化完成！');
console.log('默认账号:');
console.log('  管理员: admin / admin123');
console.log('  编辑: editor1 / editor123');
console.log('  作者: author1 / author123');
console.log('  读者: reader1 / reader123');
console.log('  结算: finance1 / finance123');

db.close();
