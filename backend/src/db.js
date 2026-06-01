const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  avatar TEXT,
  nickname TEXT,
  bio TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS beauty_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE,
  smooth_level REAL DEFAULT 0.5,
  whiten_level REAL DEFAULT 0.5,
  slim_face_level REAL DEFAULT 0.3,
  big_eye_level REAL DEFAULT 0.3,
  nose_level REAL DEFAULT 0.2,
  lip_level REAL DEFAULT 0.2,
  last_used_filter TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  original_url TEXT NOT NULL,
  edited_url TEXT,
  thumbnail_url TEXT,
  beauty_settings TEXT,
  filter_used TEXT,
  scene_type TEXT,
  is_public INTEGER DEFAULT 1,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS virtual_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  device_id TEXT UNIQUE NOT NULL,
  device_name TEXT,
  device_type TEXT DEFAULT 'camera',
  status TEXT DEFAULT 'idle',
  last_action TEXT,
  last_result TEXT,
  user_confirmed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS device_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER,
  action_type TEXT NOT NULL,
  action_params TEXT,
  result TEXT,
  success INTEGER DEFAULT 0,
  user_confirmed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES virtual_devices(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  photo_id INTEGER,
  caption TEXT,
  location TEXT,
  tags TEXT,
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (photo_id) REFERENCES photos(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER,
  user_id INTEGER,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  post_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (post_id) REFERENCES posts(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS follows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_id INTEGER,
  following_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(follower_id, following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id),
  FOREIGN KEY (following_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS filters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'normal',
  params TEXT NOT NULL,
  thumbnail TEXT,
  is_premium INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.exec(`CREATE TABLE IF NOT EXISTS edit_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  photo_id INTEGER,
  session_data TEXT,
  status TEXT DEFAULT 'editing',
  network_status TEXT DEFAULT 'online',
  ai_enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (photo_id) REFERENCES photos(id)
)`);

const filterStmt = db.prepare('SELECT id FROM filters WHERE name = ?');
const insertFilterStmt = db.prepare('INSERT INTO filters (name, category, params) VALUES (?, ?, ?)');

const filters = [
  { name: '原图', category: 'normal', params: JSON.stringify({ brightness: 0, contrast: 0, saturation: 0, warmth: 0 }) },
  { name: '清新', category: 'normal', params: JSON.stringify({ brightness: 0.1, contrast: 0.05, saturation: 0.1, warmth: -0.05 }) },
  { name: '日系', category: 'normal', params: JSON.stringify({ brightness: 0.15, contrast: -0.1, saturation: -0.1, warmth: 0.05 }) },
  { name: '胶片', category: 'vintage', params: JSON.stringify({ brightness: -0.05, contrast: 0.15, saturation: 0.05, warmth: 0.1 }) },
  { name: '黑白', category: 'artistic', params: JSON.stringify({ brightness: 0, contrast: 0.1, saturation: -1, warmth: 0 }) },
  { name: '冷调', category: 'normal', params: JSON.stringify({ brightness: 0.05, contrast: 0.05, saturation: 0, warmth: -0.15 }) },
  { name: '暖阳', category: 'normal', params: JSON.stringify({ brightness: 0.1, contrast: 0, saturation: 0.1, warmth: 0.15 }) },
  { name: 'ins风', category: 'trending', params: JSON.stringify({ brightness: 0.08, contrast: 0.08, saturation: -0.05, warmth: 0.02 }) }
];

filters.forEach(filter => {
  const existing = filterStmt.get(filter.name);
  if (!existing) {
    insertFilterStmt.run(filter.name, filter.category, filter.params);
  }
});

module.exports = db;