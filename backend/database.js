const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath, { verbose: console.log });

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT NOT NULL,
      avatar TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      followers INTEGER DEFAULT 0,
      following INTEGER DEFAULT 0,
      balance REAL DEFAULT 0,
      is_anchor INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id)
    );

    CREATE TABLE IF NOT EXISTS live_rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      anchor_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      cover TEXT DEFAULT '',
      category TEXT DEFAULT '',
      viewers INTEGER DEFAULT 0,
      status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      images TEXT DEFAULT '',
      type INTEGER DEFAULT 1,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '',
      price REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gift_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      gift_id INTEGER NOT NULL,
      count INTEGER DEFAULT 1,
      total_price REAL NOT NULL,
      live_room_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS live_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      live_room_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const giftCount = db.prepare('SELECT COUNT(*) as count FROM gifts').get().count;
  if (giftCount === 0) {
    const insertGift = db.prepare('INSERT INTO gifts (name, icon, price) VALUES (?, ?, ?)');
    insertGift.run('小心心', '❤️', 1);
    insertGift.run('玫瑰花', '🌹', 5);
    insertGift.run('火箭', '🚀', 100);
    insertGift.run('城堡', '🏰', 500);
    insertGift.run('皇冠', '👑', 1000);
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    insertMockData();
  }
}

function insertMockData() {
  const md5 = require('md5');
  
  const users = [
    { username: 'demo1', nickname: '文艺主播小雅', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', followers: 12580, is_anchor: 1, is_verified: 1 },
    { username: 'demo2', nickname: '音乐才子阿杰', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', followers: 8920, is_anchor: 1, is_verified: 1 },
    { username: 'demo3', nickname: '书画大师老王', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3', followers: 15600, is_anchor: 1, is_verified: 1 },
    { username: 'demo4', nickname: '诗词达人李清照', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4', followers: 23400, is_anchor: 1, is_verified: 1 },
    { username: 'demo5', nickname: '茶艺师小梦', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5', followers: 6780, is_anchor: 1, is_verified: 1 },
    { username: 'demo6', nickname: '收藏家张先生', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6', followers: 3200, is_anchor: 0, is_verified: 0, balance: 50000 },
    { username: 'demo7', nickname: '企业家李总', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7', followers: 1800, is_anchor: 0, is_verified: 0, balance: 150000 },
    { username: 'demo8', nickname: '投资人王总', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8', followers: 4500, is_anchor: 0, is_verified: 0, balance: 280000 },
  ];

  const insertUser = db.prepare('INSERT INTO users (username, password, nickname, avatar, bio, followers, following, balance, is_anchor, is_verified) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)');
  users.forEach(user => {
    insertUser.run(user.username, md5('123456'), user.nickname, user.avatar, '热爱生活，分享美好', user.followers, user.balance || 0, user.is_anchor, user.is_verified);
  });

  const liveRooms = [
    { anchor_id: 1, title: '古琴演奏 - 高山流水遇知音', cover: 'https://picsum.photos/400/300?random=1', category: '音乐', viewers: 1250, status: 1 },
    { anchor_id: 2, title: '原创音乐分享会', cover: 'https://picsum.photos/400/300?random=2', category: '音乐', viewers: 890, status: 1 },
    { anchor_id: 3, title: '国画技法入门教学', cover: 'https://picsum.photos/400/300?random=3', category: '艺术', viewers: 680, status: 1 },
    { anchor_id: 4, title: '宋词三百首赏析', cover: 'https://picsum.photos/400/300?random=4', category: '文学', viewers: 450, status: 1 },
    { anchor_id: 5, title: '中国茶道文化', cover: 'https://picsum.photos/400/300?random=5', category: '生活', viewers: 320, status: 1 },
  ];

  const insertLiveRoom = db.prepare('INSERT INTO live_rooms (anchor_id, title, cover, category, viewers, status) VALUES (?, ?, ?, ?, ?, ?)');
  liveRooms.forEach(room => {
    insertLiveRoom.run(room.anchor_id, room.title, room.cover, room.category, room.viewers, room.status);
  });

  const posts = [
    { user_id: 1, content: '今天直播弹奏了《广陵散》，感谢大家的聆听！下次直播预告：下周三晚8点，我们聊聊琴道。', images: 'https://picsum.photos/400/300?random=10', type: 2 },
    { user_id: 2, content: '新歌《月下独酌》已经完成编曲，期待在直播间首唱！', images: 'https://picsum.photos/400/300?random=11', type: 1 },
    { user_id: 3, content: '今日画作：《山水情》。笔墨当随时代，意境方显千古。', images: 'https://picsum.photos/400/300?random=12', type: 1 },
    { user_id: 4, content: '重读《漱玉词》，感怀易安居士的才情与风骨。', images: 'https://picsum.photos/400/300?random=13', type: 1 },
    { user_id: 5, content: '春分时节，宜品明前龙井。一芽一叶，皆是春天的味道。', images: 'https://picsum.photos/400/300?random=14', type: 1 },
  ];

  const insertPost = db.prepare('INSERT INTO posts (user_id, content, images, type) VALUES (?, ?, ?, ?)');
  posts.forEach(post => {
    insertPost.run(post.user_id, post.content, post.images, post.type);
  });

  const giftRecords = [
    { sender_id: 6, receiver_id: 1, gift_id: 5, count: 10, total_price: 10000 },
    { sender_id: 7, receiver_id: 1, gift_id: 4, count: 5, total_price: 2500 },
    { sender_id: 8, receiver_id: 2, gift_id: 5, count: 15, total_price: 15000 },
    { sender_id: 6, receiver_id: 3, gift_id: 3, count: 20, total_price: 2000 },
    { sender_id: 7, receiver_id: 4, gift_id: 5, count: 8, total_price: 8000 },
  ];

  const insertGiftRecord = db.prepare('INSERT INTO gift_records (sender_id, receiver_id, gift_id, count, total_price) VALUES (?, ?, ?, ?, ?)');
  giftRecords.forEach(record => {
    insertGiftRecord.run(record.sender_id, record.receiver_id, record.gift_id, record.count, record.total_price);
  });
}

initTables();

module.exports = db;
