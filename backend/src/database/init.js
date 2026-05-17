const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接失败:', err.message);
    process.exit(1);
  }
  console.log('已连接到SQLite数据库');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    nickname TEXT,
    avatar TEXT,
    password TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS verification_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    cover TEXT,
    duration INTEGER,
    file_url TEXT,
    file_size INTEGER,
    is_vip INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS download_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    song_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    file_path TEXT,
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (song_id) REFERENCES songs(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    cover TEXT,
    description TEXT,
    is_public INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS playlist_songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER NOT NULL,
    song_id INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists(id),
    FOREIGN KEY (song_id) REFERENCES songs(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    song_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (song_id) REFERENCES songs(id),
    UNIQUE(user_id, song_id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS play_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    song_id INTEGER NOT NULL,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    play_duration INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (song_id) REFERENCES songs(id)
  )`);

  const sampleSongs = [
    { title: '晴天', artist: '周杰伦', album: '叶惠美', duration: 269, is_vip: 0 },
    { title: '稻香', artist: '周杰伦', album: '魔杰座', duration: 223, is_vip: 0 },
    { title: '七里香', artist: '周杰伦', album: '七里香', duration: 299, is_vip: 1 },
    { title: '夜曲', artist: '周杰伦', album: '十一月的萧邦', duration: 226, is_vip: 0 },
    { title: '青花瓷', artist: '周杰伦', album: '我很忙', duration: 239, is_vip: 1 },
    { title: '告白气球', artist: '周杰伦', album: '周杰伦的床边故事', duration: 215, is_vip: 0 },
    { title: '简单爱', artist: '周杰伦', album: '范特西', duration: 270, is_vip: 0 },
    { title: '搁浅', artist: '周杰伦', album: '七里香', duration: 240, is_vip: 1 },
    { title: '听妈妈的话', artist: '周杰伦', album: '依然范特西', duration: 264, is_vip: 0 },
    { title: '以父之名', artist: '周杰伦', album: '叶惠美', duration: 342, is_vip: 1 },
  ];

  const stmt = db.prepare(`INSERT OR IGNORE INTO songs (title, artist, album, duration, is_vip, play_count, download_count) VALUES (?, ?, ?, ?, ?, 0, 0)`);
  sampleSongs.forEach(song => {
    stmt.run(song.title, song.artist, song.album, song.duration, song.is_vip);
  });
  stmt.finalize();

  console.log('数据库初始化完成');
});

db.close();
