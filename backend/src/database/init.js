const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    phone TEXT,
    role TEXT DEFAULT 'user',
    keep_coins INTEGER DEFAULT 0,
    total_training_minutes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS streamer_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    streamer_type TEXT NOT NULL,
    real_name TEXT NOT NULL,
    id_card TEXT NOT NULL,
    certifications TEXT,
    experience TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS live_streams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    streamer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    scheduled_time DATETIME,
    start_time DATETIME,
    end_time DATETIME,
    status TEXT DEFAULT 'scheduled',
    viewer_count INTEGER DEFAULT 0,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (streamer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS stream_reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stream_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (stream_id) REFERENCES live_streams(id),
    UNIQUE(user_id, stream_id)
  );

  CREATE TABLE IF NOT EXISTS stream_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stream_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stream_id) REFERENCES live_streams(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS offline_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    gym_name TEXT NOT NULL,
    address TEXT NOT NULL,
    activity_time DATETIME NOT NULL,
    max_participants INTEGER DEFAULT 50,
    participant_count INTEGER DEFAULT 0,
    cover_image TEXT,
    status TEXT DEFAULT 'upcoming',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (activity_id) REFERENCES offline_activities(id),
    UNIQUE(user_id, activity_id)
  );

  CREATE TABLE IF NOT EXISTS music_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    duration INTEGER NOT NULL,
    category TEXT NOT NULL,
    cover_url TEXT,
    audio_url TEXT,
    play_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS music_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS user_playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    cover_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS playlist_songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER NOT NULL,
    music_id INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES user_playlists(id),
    FOREIGN KEY (music_id) REFERENCES music_library(id),
    UNIQUE(playlist_id, music_id)
  );

  CREATE TABLE IF NOT EXISTS training_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    activity_type TEXT NOT NULL,
    duration INTEGER NOT NULL,
    calories INTEGER NOT NULL,
    distance REAL,
    training_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS coin_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount INTEGER NOT NULL,
    description TEXT,
    related_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS stream_replays (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stream_id INTEGER NOT NULL,
    video_url TEXT NOT NULL,
    view_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stream_id) REFERENCES live_streams(id)
  );
`);

const insertMusicCategory = db.prepare('INSERT OR IGNORE INTO music_categories (name, icon, sort_order) VALUES (?, ?, ?)');
const categories = [
  ['跑步音乐', '🏃', 1],
  ['骑行音乐', '🚴', 2],
  ['力量训练', '💪', 3],
  ['瑜伽冥想', '🧘', 4],
  ['HIIT燃脂', '🔥', 5],
  ['热身放松', '🎵', 6]
];
categories.forEach(cat => insertMusicCategory.run(cat[0], cat[1], cat[2]));

const insertMusic = db.prepare('INSERT OR IGNORE INTO music_library (title, artist, duration, category, audio_url) VALUES (?, ?, ?, ?, ?)');
const sampleMusic = [
  ['Eye of the Tiger', 'Survivor', 245, '跑步音乐', '/static/music/sample1.mp3'],
  ['Stronger', 'Kanye West', 312, '力量训练', '/static/music/sample2.mp3'],
  ['Titanium', 'David Guetta', 245, 'HIIT燃脂', '/static/music/sample3.mp3'],
  ['Weightless', 'Marconi Union', 480, '瑜伽冥想', '/static/music/sample4.mp3'],
  ['Uptown Funk', 'Bruno Mars', 270, '热身放松', '/static/music/sample5.mp3']
];
sampleMusic.forEach(m => insertMusic.run(m[0], m[1], m[2], m[3], m[4]));

console.log('数据库初始化完成！');
db.close();
