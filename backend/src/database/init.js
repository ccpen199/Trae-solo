const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });

console.log('开始初始化数据库...');

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const tables = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    password TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    bio TEXT,
    gender TEXT DEFAULT 'unknown',
    birthday TEXT,
    location TEXT,
    level INTEGER DEFAULT 1,
    exp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    fish_dried INTEGER DEFAULT 0,
    is_vip INTEGER DEFAULT 0,
    vip_expire TEXT,
    is_anchor INTEGER DEFAULT 0,
    third_party_id TEXT,
    third_party_platform TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
  `CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`,
  `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
  
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    parent_id INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS albums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    cover TEXT,
    description TEXT,
    category_id INTEGER,
    author_id INTEGER,
    author_name TEXT,
    is_free INTEGER DEFAULT 1,
    price REAL DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    subscribe_count INTEGER DEFAULT 0,
    is_published INTEGER DEFAULT 1,
    is_recommend INTEGER DEFAULT 0,
    tags TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_albums_category ON albums(category_id)`,
  `CREATE INDEX IF NOT EXISTS idx_albums_author ON albums(author_id)`,
  
  `CREATE TABLE IF NOT EXISTS episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    cover TEXT,
    duration INTEGER DEFAULT 0,
    audio_url TEXT NOT NULL,
    is_free INTEGER DEFAULT 1,
    price REAL DEFAULT 0,
    play_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    is_published INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_episodes_album ON episodes(album_id)`,
  
  `CREATE TABLE IF NOT EXISTS user_favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    album_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, album_id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS user_subscribes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    album_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, album_id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS user_purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    album_id INTEGER,
    episode_id INTEGER,
    amount REAL NOT NULL,
    purchase_type TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS play_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    album_id INTEGER NOT NULL,
    episode_id INTEGER NOT NULL,
    progress INTEGER DEFAULT 0,
    played_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_history_user ON play_history(user_id)`,
  
  `CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    album_id INTEGER,
    episode_id INTEGER,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    reply_to INTEGER,
    is_deleted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_comments_album ON comments(album_id)`,
  `CREATE INDEX IF NOT EXISTS idx_comments_episode ON comments(episode_id)`,
  
  `CREATE TABLE IF NOT EXISTS danmus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    episode_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    time INTEGER NOT NULL,
    color TEXT DEFAULT '#ffffff',
    style TEXT DEFAULT 'scroll',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS user_follows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(follower_id, following_id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS live_rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    anchor_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    cover TEXT,
    description TEXT,
    category_id INTEGER,
    viewer_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_live INTEGER DEFAULT 0,
    start_time TEXT,
    end_time TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS live_gifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT,
    price INTEGER NOT NULL,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS live_gift_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    gift_id INTEGER NOT NULL,
    gift_name TEXT,
    gift_count INTEGER DEFAULT 1,
    total_price INTEGER,
    message TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS live_chat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS banners (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    image TEXT NOT NULL,
    link TEXT,
    position TEXT DEFAULT 'home',
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS feeds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content TEXT,
    images TEXT,
    audio_url TEXT,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    is_deleted INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  
  `CREATE TABLE IF NOT EXISTS daily_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    task_type TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0,
    reward INTEGER DEFAULT 0,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, task_type, date)
  )`
];

tables.forEach(sql => {
  db.exec(sql);
});

console.log('数据库表创建完成');

const categories = [
  { name: '有声剧', icon: '🎭', sort_order: 1 },
  { name: '广播剧', icon: '📻', sort_order: 2 },
  { name: '有声书', icon: '📚', sort_order: 3 },
  { name: '音乐', icon: '🎵', sort_order: 4 },
  { name: '助眠', icon: '😴', sort_order: 5 },
  { name: '娱乐', icon: '🎪', sort_order: 6 },
  { name: '教育', icon: '📖', sort_order: 7 },
  { name: '直播', icon: '📺', sort_order: 8 }
];

const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, icon, sort_order) VALUES (?, ?, ?)');
categories.forEach(cat => insertCategory.run(cat.name, cat.icon, cat.sort_order));
console.log('分类数据已插入');

const gifts = [
  { name: '小鱼干', icon: '🐟', price: 10, sort_order: 1 },
  { name: '爱心', icon: '❤️', price: 50, sort_order: 2 },
  { name: '棒棒糖', icon: '🍭', price: 100, sort_order: 3 },
  { name: '皇冠', icon: '👑', price: 500, sort_order: 4 },
  { name: '火箭', icon: '🚀', price: 1000, sort_order: 5 }
];

const insertGift = db.prepare('INSERT OR IGNORE INTO live_gifts (name, icon, price, sort_order) VALUES (?, ?, ?, ?)');
gifts.forEach(gift => insertGift.run(gift.name, gift.icon, gift.price, gift.sort_order));
console.log('礼物数据已插入');

const banners = [
  { title: '新人福利', image: 'https://picsum.photos/1200/400?random=601', link: '/promo/new', sort_order: 1 },
  { title: '热门有声剧', image: 'https://picsum.photos/1200/400?random=602', link: '/albums/hot', sort_order: 2 },
  { title: '声优直播', image: 'https://picsum.photos/1200/400?random=603', link: '/live', sort_order: 3 },
  { title: 'VIP会员专享', image: 'https://picsum.photos/1200/400?random=604', link: '/vip', sort_order: 4 }
];

const insertBanner = db.prepare("INSERT OR IGNORE INTO banners (title, image, link, position, sort_order, is_active) VALUES (?, ?, ?, 'home', ?, 1)");
banners.forEach(banner => insertBanner.run(banner.title, banner.image, banner.link, banner.sort_order));
console.log('轮播图数据已插入');

db.close();
console.log('数据库初始化完成！');
