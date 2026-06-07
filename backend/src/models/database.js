const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'app.sqlite'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT,
    avatar TEXT,
    bio TEXT,
    city TEXT,
    role TEXT DEFAULT 'user' CHECK(role IN ('user','author','admin')),
    creator_level INTEGER DEFAULT 0,
    creator_score INTEGER DEFAULT 0,
    is_certified INTEGER DEFAULT 0,
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    content_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    total_earnings REAL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','banned','muted')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS topics (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    cover_image TEXT,
    category TEXT,
    post_count INTEGER DEFAULT 0,
    follow_count INTEGER DEFAULT 0,
    is_hot INTEGER DEFAULT 0,
    is_official INTEGER DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS contents (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    body TEXT NOT NULL,
    content_type TEXT DEFAULT 'note' CHECK(content_type IN ('note','article','post')),
    summary TEXT,
    cover_image TEXT,
    media_urls TEXT DEFAULT '[]',
    topic_ids TEXT DEFAULT '[]',
    city TEXT,
    tags TEXT DEFAULT '[]',
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    collect_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    tip_earnings REAL DEFAULT 0,
    ad_earnings REAL DEFAULT 0,
    review_status TEXT DEFAULT 'pending' CHECK(review_status IN ('pending','ai_approved','approved','rejected','appealing')),
    review_note TEXT,
    reviewer_id TEXT,
    reviewed_at TEXT,
    is_featured INTEGER DEFAULT 0,
    is_pinned INTEGER DEFAULT 0,
    collection_id TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','deleted','draft','archived')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    parent_id TEXT,
    reply_to_id TEXT,
    body TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (content_id) REFERENCES contents(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS likes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('content','comment')),
    target_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, target_type, target_id)
  );

  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    content_count INTEGER DEFAULT 0,
    is_public INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS collection_items (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(collection_id, content_id),
    FOREIGN KEY (collection_id) REFERENCES collections(id),
    FOREIGN KEY (content_id) REFERENCES contents(id)
  );

  CREATE TABLE IF NOT EXISTS follows (
    id TEXT PRIMARY KEY,
    follower_id TEXT NOT NULL,
    following_type TEXT NOT NULL CHECK(following_type IN ('user','topic')),
    following_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(follower_id, following_type, following_id)
  );

  CREATE TABLE IF NOT EXISTS tips (
    id TEXT PRIMARY KEY,
    from_user_id TEXT NOT NULL,
    to_user_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    amount REAL NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'completed',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (from_user_id) REFERENCES users(id),
    FOREIGN KEY (to_user_id) REFERENCES users(id),
    FOREIGN KEY (content_id) REFERENCES contents(id)
  );

  CREATE TABLE IF NOT EXISTS ad_revenues (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    ad_type TEXT NOT NULL,
    revenue REAL NOT NULL,
    period_start TEXT,
    period_end TEXT,
    status TEXT DEFAULT 'settled',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (content_id) REFERENCES contents(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS review_logs (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    reviewer_id TEXT,
    review_type TEXT NOT NULL CHECK(review_type IN ('ai','manual')),
    action TEXT NOT NULL CHECK(action IN ('approve','reject','flag')),
    note TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (content_id) REFERENCES contents(id)
  );

  CREATE TABLE IF NOT EXISTS sensitive_words (
    id TEXT PRIMARY KEY,
    word TEXT UNIQUE NOT NULL,
    category TEXT DEFAULT 'general',
    severity TEXT DEFAULT 'medium' CHECK(severity IN ('low','medium','high')),
    is_enabled INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS hot_list (
    id TEXT PRIMARY KEY,
    content_id TEXT NOT NULL,
    rank_position INTEGER,
    is_pinned INTEGER DEFAULT 0,
    boosted_score REAL DEFAULT 0,
    reason TEXT,
    operated_by TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (content_id) REFERENCES contents(id)
  );

  CREATE TABLE IF NOT EXISTS reading_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    read_duration INTEGER DEFAULT 0,
    read_percent REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (content_id) REFERENCES contents(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT,
    body TEXT,
    related_id TEXT,
    is_read INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS creator_levels (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    min_score INTEGER NOT NULL,
    max_score INTEGER,
    ad_share_rate REAL NOT NULL,
    tip_share_rate REAL NOT NULL,
    perks TEXT DEFAULT '[]',
    icon TEXT
  );
`);

const insertCreatorLevels = db.transaction(() => {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM creator_levels').get();
  if (count.cnt > 0) return;

  const insert = db.prepare(
    'INSERT INTO creator_levels (id, name, min_score, max_score, ad_share_rate, tip_share_rate, perks, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  insert.run(1, '新手创作者', 0, 99, 0.3, 0.7, '[]', '🌟');
  insert.run(2, '活跃创作者', 100, 499, 0.5, 0.8, '[]', '⭐');
  insert.run(3, '优质创作者', 500, 1999, 0.65, 0.85, '[]', '💎');
  insert.run(4, '精品创作者', 2000, 9999, 0.75, 0.9, '[]', '👑');
  insert.run(5, '顶级创作者', 10000, null, 0.85, 0.95, '[]', '🏆');
});

const insertSensitiveWords = db.transaction(() => {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM sensitive_words').get();
  if (count.cnt > 0) return;

  const insert = db.prepare(
    'INSERT INTO sensitive_words (id, word, category, severity, is_enabled) VALUES (?, ?, ?, ?, ?)'
  );

  const words = [
    ['sw1', '赌博', 'illegal', 'high', 1],
    ['sw2', '色情', 'illegal', 'high', 1],
    ['sw3', '毒品', 'illegal', 'high', 1],
    ['sw4', '诈骗', 'illegal', 'high', 1],
    ['sw5', '枪支', 'illegal', 'high', 1],
    ['sw6', '代购', 'ad', 'medium', 1],
    ['sw7', '刷单', 'ad', 'medium', 1],
    ['sw8', '加微信', 'ad', 'medium', 1],
    ['sw9', '撕逼', 'abuse', 'low', 1],
    ['sw10', '脑残', 'abuse', 'medium', 1]
  ];

  words.forEach(w => insert.run(...w));
});

const insertTopics = db.transaction(() => {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM topics').get();
  if (count.cnt > 0) return;

  const insert = db.prepare(
    'INSERT INTO topics (id, name, slug, description, category, is_hot, is_official, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const topics = [
    ['t1', '美食探店', 'food', '发现城市中的美味餐厅和小吃', 'lifestyle', 1, 1, 1],
    ['t2', '城市漫步', 'citywalk', '用脚步丈量城市的每一个角落', 'lifestyle', 1, 1, 2],
    ['t3', '咖啡与茶', 'coffee', '城市中的咖啡馆与茶空间', 'lifestyle', 1, 0, 3],
    ['t4', '文艺空间', 'culture', '美术馆、书店、剧场与展览', 'culture', 1, 1, 4],
    ['t5', '户外运动', 'outdoor', '骑行、跑步、徒步与更多', 'sports', 0, 1, 5],
    ['t6', '市集与夜市', 'market', '逛市集、淘好物、品夜市', 'lifestyle', 1, 0, 6],
    ['t7', '家居生活', 'home', '打造理想中的居住空间', 'lifestyle', 0, 0, 7],
    ['t8', '宠物日常', 'pets', '与毛孩子一起的城市生活', 'lifestyle', 0, 0, 8],
    ['t9', '摄影打卡', 'photography', '记录城市的美丽瞬间', 'culture', 0, 0, 9],
    ['t10', '本地攻略', 'guide', '最地道的城市生活指南', 'guide', 1, 1, 10]
  ];

  topics.forEach(t => insert.run(...t));
});

insertCreatorLevels();
insertSensitiveWords();
insertTopics();

module.exports = db;
