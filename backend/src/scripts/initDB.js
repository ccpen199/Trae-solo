const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

const tables = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    gender INTEGER DEFAULT 0,
    birthday TEXT,
    signature TEXT,
    is_vip INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS third_party_auth (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    platform TEXT NOT NULL,
    openid TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE(platform, openid)
  )`,
  `CREATE TABLE IF NOT EXISTS artists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar TEXT,
    description TEXT,
    followers INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cover TEXT,
    artist_id INTEGER NOT NULL,
    release_date TEXT,
    description TEXT,
    play_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists (id)
  )`,
  `CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cover TEXT,
    artist_id INTEGER NOT NULL,
    album_id INTEGER,
    duration INTEGER NOT NULL DEFAULT 180,
    url TEXT NOT NULL,
    lyrics TEXT,
    is_free INTEGER DEFAULT 1,
    is_vip INTEGER DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artist_id) REFERENCES artists (id),
    FOREIGN KEY (album_id) REFERENCES albums (id)
  )`,
  `CREATE TABLE IF NOT EXISTS playlists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cover TEXT,
    user_id INTEGER NOT NULL,
    description TEXT,
    play_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_public INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS playlist_songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    playlist_id INTEGER NOT NULL,
    song_id INTEGER NOT NULL,
    added_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES playlists (id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE,
    UNIQUE(playlist_id, song_id)
  )`,
  `CREATE TABLE IF NOT EXISTS user_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    song_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE,
    UNIQUE(user_id, song_id)
  )`,
  `CREATE TABLE IF NOT EXISTS user_downloads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    song_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE,
    UNIQUE(user_id, song_id)
  )`,
  `CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    song_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    parent_id INTEGER,
    like_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs (id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments (id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS comment_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    comment_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (comment_id) REFERENCES comments (id) ON DELETE CASCADE,
    UNIQUE(user_id, comment_id)
  )`,
  `CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    keyword TEXT NOT NULL,
    search_count INTEGER DEFAULT 1,
    last_searched_at TEXT DEFAULT CURRENT_TIMESTAMP,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS hot_keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL UNIQUE,
    search_count INTEGER DEFAULT 0,
    is_hot INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    image TEXT NOT NULL,
    link TEXT,
    duration INTEGER DEFAULT 5,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS radios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    cover TEXT,
    description TEXT,
    stream_url TEXT NOT NULL,
    listener_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    cover TEXT,
    content TEXT NOT NULL,
    author TEXT,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    cover TEXT,
    url TEXT NOT NULL,
    duration INTEGER,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`
];

tables.forEach(sql => db.exec(sql));

const insertArtist = db.prepare('INSERT INTO artists (name, avatar, description) VALUES (?, ?, ?)');
insertArtist.run('周杰伦', 'https://picsum.photos/seed/jay/200', '华语流行天王');
insertArtist.run('林俊杰', 'https://picsum.photos/seed/jj/200', '金曲歌王');
insertArtist.run('邓紫棋', 'https://picsum.photos/seed/gem/200', '实力派女歌手');

const insertAlbum = db.prepare('INSERT INTO albums (name, cover, artist_id, release_date) VALUES (?, ?, ?, ?)');
insertAlbum.run('周杰伦的床边故事', 'https://picsum.photos/seed/album1/200', 1, '2016-06-24');
insertAlbum.run('伟大的渺小', 'https://picsum.photos/seed/album2/200', 2, '2017-12-29');
insertAlbum.run('摩天动物园', 'https://picsum.photos/seed/album3/200', 3, '2019-12-27');

const lyrics1 = `[00:00.00]告白气球
[00:05.00]作词：方文山
[00:10.00]作曲：周杰伦
[00:15.00]
[00:20.00]塞纳河畔 左岸的咖啡
[00:25.00]我手一杯 品尝你的美
[00:30.00]留下唇印的嘴`;

const lyrics2 = `[00:00.00]江南
[00:05.00]作词：李瑞洵
[00:10.00]作曲：林俊杰
[00:15.00]
[00:20.00]风到这里就是粘
[00:25.00]粘住过客的思念
[00:30.00]雨到了这里缠成线`;

const lyrics3 = `[00:00.00]光年之外
[00:05.00]作词：邓紫棋
[00:10.00]作曲：邓紫棋
[00:15.00]
[00:20.00]感受停在我发端的指尖
[00:25.00]如何瞬间 冻结时间`;

const insertSong = db.prepare('INSERT INTO songs (name, cover, artist_id, album_id, duration, url, lyrics, is_free) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
insertSong.run('告白气球', 'https://picsum.photos/seed/song1/200', 1, 1, 215, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', lyrics1, 1);
insertSong.run('晴天', 'https://picsum.photos/seed/song2/200', 1, 1, 269, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', lyrics1, 1);
insertSong.run('稻香', 'https://picsum.photos/seed/song3/200', 1, 1, 223, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', lyrics1, 1);
insertSong.run('江南', 'https://picsum.photos/seed/song4/200', 2, 2, 248, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', lyrics2, 1);
insertSong.run('修炼爱情', 'https://picsum.photos/seed/song5/200', 2, 2, 295, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', lyrics2, 1);
insertSong.run('光年之外', 'https://picsum.photos/seed/song6/200', 3, 3, 235, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', lyrics3, 1);
insertSong.run('泡沫', 'https://picsum.photos/seed/song7/200', 3, 3, 258, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3', lyrics3, 1);
insertSong.run('夜曲', 'https://picsum.photos/seed/song8/200', 1, 1, 226, 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3', lyrics1, 0);

const insertAd = db.prepare('INSERT INTO ads (title, image, link, duration) VALUES (?, ?, ?, ?)');
insertAd.run('VIP会员限时优惠', 'https://picsum.photos/seed/ad1/800/400', 'https://example.com/vip', 5);
insertAd.run('新专辑首发', 'https://picsum.photos/seed/ad2/800/400', 'https://example.com/album', 5);

const insertRadio = db.prepare('INSERT INTO radios (name, cover, description, stream_url) VALUES (?, ?, ?, ?)');
insertRadio.run('流行音乐台', 'https://picsum.photos/seed/radio1/200', '24小时流行音乐不间断', 'https://stream.example.com/pop');
insertRadio.run('经典老歌台', 'https://picsum.photos/seed/radio2/200', '重温经典老歌', 'https://stream.example.com/classic');

const insertArticle = db.prepare('INSERT INTO articles (title, cover, content, author) VALUES (?, ?, ?, ?)');
insertArticle.run('2024年华语乐坛回顾', 'https://picsum.photos/seed/article1/800/400', '2024年是华语乐坛丰收的一年...', '音乐编辑部');
insertArticle.run('如何培养音乐品味', 'https://picsum.photos/seed/article2/800/400', '音乐品味的培养需要时间和积累...', '音乐专栏');

const insertVideo = db.prepare('INSERT INTO videos (title, cover, url, duration) VALUES (?, ?, ?, ?)');
insertVideo.run('告白气球 MV', 'https://picsum.photos/seed/video1/400/225', 'https://example.com/mv1.mp4', 280);
insertVideo.run('江南 MV', 'https://picsum.photos/seed/video2/400/225', 'https://example.com/mv2.mp4', 320);

const insertHotKeyword = db.prepare('INSERT INTO hot_keywords (keyword, search_count, is_hot) VALUES (?, ?, ?)');
insertHotKeyword.run('周杰伦', 15234, 1);
insertHotKeyword.run('告白气球', 12456, 1);
insertHotKeyword.run('林俊杰', 9876, 1);
insertHotKeyword.run('邓紫棋', 8765, 1);
insertHotKeyword.run('光年之外', 7654, 1);
insertHotKeyword.run('晴天', 6543, 0);
insertHotKeyword.run('江南', 5432, 0);
insertHotKeyword.run('流行音乐', 4321, 0);

const password = bcrypt.hashSync('123456', 10);
const insertUser = db.prepare('INSERT INTO users (phone, nickname, password) VALUES (?, ?, ?)');
insertUser.run('13800138000', '音乐爱好者', password);

console.log('数据库初始化完成！');
db.close();