const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbPath = path.join(__dirname, '../../data/app.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('开始初始化数据库...');

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE,
  nickname TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  gender TEXT CHECK(gender IN ('male', 'female', 'unknown')) DEFAULT 'unknown',
  bio TEXT DEFAULT '',
  login_type TEXT CHECK(login_type IN ('phone', 'qq', 'weibo', 'wechat')) NOT NULL,
  openid TEXT,
  unionid TEXT,
  is_online INTEGER DEFAULT 0,
  last_online_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
console.log('✓ users表创建完成');

db.exec(`CREATE TABLE IF NOT EXISTS user_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  tag TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, tag),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`);
console.log('✓ user_tags表创建完成');

db.exec(`CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content_id INTEGER NOT NULL,
  content_type TEXT DEFAULT 'movie',
  content_title TEXT NOT NULL,
  content_poster TEXT DEFAULT '',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, content_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)`);
console.log('✓ subscriptions表创建完成');

db.exec(`CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_no TEXT UNIQUE NOT NULL,
  room_type TEXT CHECK(room_type IN ('1v1', 'multi')) NOT NULL,
  room_name TEXT NOT NULL,
  is_public INTEGER DEFAULT 1,
  password TEXT,
  owner_id INTEGER NOT NULL,
  current_movie_id INTEGER,
  current_movie_title TEXT,
  current_movie_poster TEXT,
  max_members INTEGER DEFAULT 8,
  member_count INTEGER DEFAULT 1,
  status TEXT CHECK(status IN ('waiting', 'playing', 'closed')) DEFAULT 'waiting',
  filter_gender TEXT CHECK(filter_gender IN ('male', 'female', 'any')) DEFAULT 'any',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
)`);
console.log('✓ rooms表创建完成');

db.exec(`CREATE TABLE IF NOT EXISTS room_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  join_order INTEGER NOT NULL,
  is_owner INTEGER DEFAULT 0,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(room_id, user_id),
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);
console.log('✓ room_members表创建完成');

db.exec(`CREATE TABLE IF NOT EXISTS room_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  message_type TEXT CHECK(message_type IN ('text', 'image', 'system')) DEFAULT 'text',
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);
console.log('✓ room_messages表创建完成');

db.exec(`CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  room_id INTEGER,
  is_mutual INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(from_user_id, to_user_id),
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
)`);
console.log('✓ likes表创建完成');

db.exec(`CREATE TABLE IF NOT EXISTS friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id1 INTEGER NOT NULL,
  user_id2 INTEGER NOT NULL,
  room_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id1, user_id2),
  FOREIGN KEY (user_id1) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id2) REFERENCES users(id) ON DELETE CASCADE
)`);
console.log('✓ friends表创建完成');

db.exec(`CREATE TABLE IF NOT EXISTS private_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user_id INTEGER NOT NULL,
  to_user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE CASCADE
)`);
console.log('✓ private_messages表创建完成');

db.exec(`CREATE TABLE IF NOT EXISTS recent_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  visited_user_id INTEGER NOT NULL,
  visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, visited_user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (visited_user_id) REFERENCES users(id) ON DELETE CASCADE
)`);
console.log('✓ recent_visits表创建完成');

db.exec(`CREATE TABLE IF NOT EXISTS movies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  poster TEXT DEFAULT '',
  description TEXT DEFAULT '',
  tags TEXT DEFAULT '',
  year INTEGER,
  rating REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);
console.log('✓ movies表创建完成');

const insertMovie = db.prepare('INSERT OR IGNORE INTO movies (title, poster, tags, year, rating) VALUES (?, ?, ?, ?, ?)');
const sampleMovies = [
  { title: '肖申克的救赎', poster: '', tags: '剧情,犯罪', year: 1994, rating: 9.7 },
  { title: '霸王别姬', poster: '', tags: '剧情,爱情', year: 1993, rating: 9.6 },
  { title: '阿甘正传', poster: '', tags: '剧情', year: 1994, rating: 9.5 },
  { title: '泰坦尼克号', poster: '', tags: '剧情,爱情,灾难', year: 1997, rating: 9.4 },
  { title: '千与千寻', poster: '', tags: '动画,奇幻', year: 2001, rating: 9.4 },
  { title: '星际穿越', poster: '', tags: '科幻,冒险', year: 2014, rating: 9.4 },
  { title: '盗梦空间', poster: '', tags: '科幻,悬疑', year: 2010, rating: 9.3 },
  { title: '楚门的世界', poster: '', tags: '剧情,科幻', year: 1998, rating: 9.3 }
];

const insertMany = db.transaction((movies) => {
  for (const movie of movies) {
    insertMovie.run(movie.title, movie.poster, movie.tags, movie.year, movie.rating);
  }
});
insertMany(sampleMovies);
console.log('✓ 示例电影数据插入完成');

const insertUser = db.prepare('INSERT OR IGNORE INTO users (nickname, login_type) VALUES (?, ?)');
insertUser.run('示例用户', 'phone');
console.log('✓ 示例用户数据插入完成');

const tags = ['爱情', '科幻', '悬疑', '喜剧', '恐怖', '动作', '动画', '纪录片', '经典', '新片'];
const insertTag = db.prepare('INSERT OR IGNORE INTO user_tags (user_id, tag) VALUES (1, ?)');
const insertTags = db.transaction((tagsList) => {
  for (const tag of tagsList) {
    insertTag.run(tag);
  }
});
insertTags(tags);
console.log('✓ 示例标签数据插入完成');

console.log('\n数据库初始化完成!');
db.close();
