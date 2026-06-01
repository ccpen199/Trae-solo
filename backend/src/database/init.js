const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dataDir = path.join(__dirname, '../../data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

console.log('开始初始化数据库...');

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nickname TEXT,
  avatar TEXT,
  is_vip INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS daily_quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT UNIQUE NOT NULL,
  quote TEXT NOT NULL,
  author TEXT,
  image_url TEXT,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  color TEXT DEFAULT '#4A90D9'
)`);

db.exec(`CREATE TABLE IF NOT EXISTS focus_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  duration INTEGER NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  mode TEXT DEFAULT 'normal',
  completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS sleep_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  type TEXT NOT NULL,
  duration INTEGER NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  sound TEXT,
  wake_task TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS breath_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  duration INTEGER NOT NULL,
  breaths INTEGER NOT NULL,
  start_time DATETIME NOT NULL,
  sound TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS user_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  focus_duration INTEGER DEFAULT 25,
  break_duration INTEGER DEFAULT 5,
  long_break_duration INTEGER DEFAULT 15,
  daily_reminder TEXT,
  apple_health_enabled INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

const quotes = [
  { date: '2024-01-01', quote: '生活不是等待暴风雨过去，而是学会在雨中跳舞。', author: '维维安·格林', color: '#5B8DEE' },
  { date: '2024-01-02', quote: '成功不是终点，失败也不是终结，唯有继续前进的勇气才是最重要的。', author: '丘吉尔', color: '#E87461' },
  { date: '2024-01-03', quote: '你的时间有限，不要为别人而活。', author: '乔布斯', color: '#6BCB77' },
  { date: '2024-01-04', quote: '千里之行，始于足下。', author: '老子', color: '#FFD93D' },
  { date: '2024-01-05', quote: '知之为知之，不知为不知，是知也。', author: '孔子', color: '#9B59B6' },
];

const insertQuote = db.prepare('INSERT OR IGNORE INTO daily_quotes (date, quote, author, color) VALUES (?, ?, ?, ?)');
const insertMany = db.transaction((quotes) => {
  for (const q of quotes) {
    insertQuote.run(q.date, q.quote, q.author, q.color);
  }
});
insertMany(quotes);

console.log('数据库初始化完成！');

db.close();
