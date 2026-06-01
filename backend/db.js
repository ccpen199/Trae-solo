import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH || './data/app.sqlite';
const resolvedPath = path.resolve(__dirname, '..', dbPath);

const dir = path.dirname(resolvedPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const db = new Database(resolvedPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS streamers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  union_id INTEGER,
  account TEXT UNIQUE NOT NULL,
  phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (union_id) REFERENCES unions(id)
);

CREATE TABLE IF NOT EXISTS unions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  contact TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL,
  account TEXT UNIQUE NOT NULL,
  is_minor INTEGER DEFAULT 0,
  balance INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS gifts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  coin_value INTEGER NOT NULL,
  icon TEXT,
  category TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  streamer_id INTEGER NOT NULL,
  status TEXT DEFAULT 'offline',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (streamer_id) REFERENCES streamers(id)
);

CREATE TABLE IF NOT EXISTS live_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  streamer_id INTEGER NOT NULL,
  room_id INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  peak_viewers INTEGER DEFAULT 0,
  total_viewers INTEGER DEFAULT 0,
  gift_coin_income INTEGER DEFAULT 0,
  refund_amount INTEGER DEFAULT 0,
  exception_flag INTEGER DEFAULT 0,
  exception_reason TEXT,
  status TEXT DEFAULT 'ongoing',
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (streamer_id) REFERENCES streamers(id),
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE IF NOT EXISTS gift_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,
  gift_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  coin_amount INTEGER NOT NULL,
  payment_channel TEXT,
  session_id INTEGER,
  status TEXT DEFAULT 'pending',
  settle_status TEXT DEFAULT 'unsettled',
  refunded INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (gift_id) REFERENCES gifts(id),
  FOREIGN KEY (session_id) REFERENCES live_sessions(id)
);

CREATE TABLE IF NOT EXISTS sharing_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  streamer_ratio REAL DEFAULT 0.5,
  union_ratio REAL DEFAULT 0.2,
  platform_ratio REAL DEFAULT 0.25,
  activity_ratio REAL DEFAULT 0,
  tax_ratio REAL DEFAULT 0.05,
  effective_from TEXT,
  effective_to TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS risk_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  transaction_id INTEGER,
  amount INTEGER DEFAULT 0,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  operator TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS frozen_funds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  streamer_id INTEGER,
  union_id INTEGER,
  transaction_id INTEGER,
  risk_record_id INTEGER,
  amount INTEGER NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'frozen',
  unfreeze_reason TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime')),
  unfrozen_at TEXT
);

CREATE TABLE IF NOT EXISTS penalty_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  streamer_id INTEGER,
  union_id INTEGER,
  risk_record_id INTEGER,
  amount INTEGER NOT NULL,
  reason TEXT,
  operator TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS settlements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  total_income INTEGER DEFAULT 0,
  frozen_amount INTEGER DEFAULT 0,
  penalty_amount INTEGER DEFAULT 0,
  paid_amount INTEGER DEFAULT 0,
  net_amount INTEGER DEFAULT 0,
  difference_reason TEXT,
  status TEXT DEFAULT 'pending',
  operator TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS settlement_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  settlement_id INTEGER NOT NULL,
  transaction_id INTEGER,
  session_id INTEGER,
  coin_amount INTEGER,
  sharing_amount INTEGER,
  FOREIGN KEY (settlement_id) REFERENCES settlements(id)
);

CREATE TABLE IF NOT EXISTS admin_ops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operator TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id INTEGER,
  detail TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS payment_channels (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  streamer_id INTEGER,
  session_id INTEGER,
  type TEXT,
  content TEXT,
  status TEXT DEFAULT 'pending',
  handler TEXT,
  created_at TEXT DEFAULT (datetime('now','localtime'))
);
`);

function seedIfEmpty() {
  const existingUnions = db.prepare('SELECT COUNT(*) as cnt FROM unions').get().cnt;
  if (existingUnions > 0) return;

  const insertUnion = db.prepare('INSERT INTO unions (name, contact, phone) VALUES (?, ?, ?)');
  const union1 = insertUnion.run('星耀工会', '张经理', '13800138001');
  const union2 = insertUnion.run('盛世工会', '李总监', '13800138002');

  const insertStreamer = db.prepare('INSERT INTO streamers (name, union_id, account, phone) VALUES (?, ?, ?, ?)');
  insertStreamer.run('小鹿同学', union1.lastInsertRowid, 'xiaolu', '13900139001');
  insertStreamer.run('大白主播', union1.lastInsertRowid, 'dabai', '13900139002');
  insertStreamer.run('阿K老师', union2.lastInsertRowid, 'ak', '13900139003');
  insertStreamer.run('柠檬不萌', null, 'ningmeng', '13900139004');

  const insertUser = db.prepare('INSERT INTO users (nickname, account, is_minor, balance) VALUES (?, ?, ?, ?)');
  insertUser.run('土豪哥', 'tuhao', 0, 1000000);
  insertUser.run('小明同学', 'xiaoming', 1, 50000);
  insertUser.run('路人甲', 'lurenjia', 0, 200000);
  insertUser.run('榜一大姐', 'bangyi', 0, 800000);

  const insertGift = db.prepare('INSERT INTO gifts (name, coin_value, icon, category) VALUES (?, ?, ?, ?)');
  insertGift.run('小心心', 10, '❤️', 'basic');
  insertGift.run('棒棒糖', 50, '🍭', 'basic');
  insertGift.run('跑车', 1000, '🏎️', 'premium');
  insertGift.run('火箭', 5000, '🚀', 'premium');
  insertGift.run('城堡', 10000, '🏰', 'luxury');
  insertGift.run('嘉年华', 50000, '🎡', 'luxury');

  const insertRoom = db.prepare('INSERT INTO rooms (name, streamer_id, status) VALUES (?, ?, ?)');
  const rooms = db.prepare('SELECT id FROM streamers').all();
  const streamerNames = ['小鹿直播间', '大白聊天室', '阿K游戏厅', '柠檬秀场'];
  rooms.forEach((r, i) => insertRoom.run(streamerNames[i], r.id, 'offline'));

  const insertChannel = db.prepare('INSERT INTO payment_channels (name, code) VALUES (?, ?)');
  insertChannel.run('支付宝', 'alipay');
  insertChannel.run('微信支付', 'wechat');
  insertChannel.run('苹果内购', 'apple');

  const insertRule = db.prepare(`
    INSERT INTO sharing_rules (version, name, description, streamer_ratio, union_ratio, platform_ratio, activity_ratio, tax_ratio, effective_from)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertRule.run(1, '默认分账规则 v1', '初始分账规则', 0.50, 0.20, 0.25, 0, 0.05, '2025-01-01');

  const insertRuleV2 = db.prepare(`
    INSERT INTO sharing_rules (version, name, description, streamer_ratio, union_ratio, platform_ratio, activity_ratio, tax_ratio, effective_from, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertRuleV2.run(2, '春节活动规则 v2', '春节活动期间提高主播分成', 0.55, 0.18, 0.22, 0.05, 0.05, '2026-01-20', 1);

  const updateRule = db.prepare('UPDATE sharing_rules SET is_active = 0 WHERE version = 1');
  updateRule.run();

  const insertSession = db.prepare(`
    INSERT INTO live_sessions (streamer_id, room_id, start_time, end_time, peak_viewers, total_viewers, gift_coin_income, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const now = new Date();
  const sessions = [
    [1, 1, '2026-05-25 20:00:00', '2026-05-25 23:30:00', 5800, 12000, 850000, 'ended'],
    [2, 2, '2026-05-25 19:00:00', '2026-05-25 22:00:00', 3200, 8500, 420000, 'ended'],
    [3, 3, '2026-05-26 14:00:00', null, 1500, 3200, 180000, 'ongoing'],
    [4, 4, '2026-05-26 10:00:00', '2026-05-26 12:30:00', 800, 2100, 95000, 'ended'],
    [1, 1, '2026-05-26 19:30:00', null, 4200, 6800, 520000, 'ongoing'],
  ];
  sessions.forEach(s => insertSession.run(...s));

  const insertTx = db.prepare(`
    INSERT INTO gift_transactions (order_no, user_id, gift_id, quantity, coin_amount, payment_channel, session_id, status, settle_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const txs = [
    ['TX2026052500001', 1, 4, 5, 25000, 'alipay', 1, 'received', 'unsettled'],
    ['TX2026052500002', 2, 2, 10, 500, 'wechat', 1, 'received', 'unsettled'],
    ['TX2026052500003', 1, 6, 1, 50000, 'alipay', 1, 'received', 'unsettled'],
    ['TX2026052500004', 3, 3, 3, 3000, 'apple', 2, 'received', 'unsettled'],
    ['TX2026052500005', 4, 5, 2, 20000, 'alipay', 2, 'received', 'unsettled'],
    ['TX2026052500006', 1, 1, 100, 1000, 'wechat', 1, 'received', 'unsettled'],
    ['TX2026052500007', 2, 2, 50, 2500, 'wechat', 1, 'received', 'unsettled'],
    ['TX2026052500008', 3, 4, 2, 10000, 'alipay', 4, 'received', 'unsettled'],
    ['TX2026052500009', 4, 3, 10, 10000, 'wechat', 4, 'received', 'unsettled'],
    ['TX2026052600001', 1, 6, 2, 100000, 'alipay', 5, 'received', 'unsettled'],
    ['TX2026052600002', 2, 1, 200, 2000, 'wechat', 3, 'pending', 'unsettled'],
    ['TX2026052600003', 3, 4, 1, 5000, 'alipay', 3, 'received', 'unsettled'],
    ['TX2026052600004', 1, 5, 3, 30000, 'alipay', 5, 'received', 'unsettled'],
    ['TX2026052600005', 2, 2, 20, 1000, 'apple', 3, 'received', 'unsettled'],
  ];
  txs.forEach(t => insertTx.run(...t));

  const insertRisk = db.prepare(`
    INSERT INTO risk_records (type, target_type, target_id, transaction_id, amount, reason, status, operator)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertRisk.run('minor_refund', 'user', 2, 2, 500, '未成年用户充值退款申请', 'pending', null);
  insertRisk.run('brush_gift', 'streamer', 1, null, 50000, '疑似刷礼物异常行为', 'investigating', '风控-小王');
  insertRisk.run('violation', 'streamer', 2, null, 0, '直播间违规内容', 'resolved', '运营-小李');
  insertRisk.run('abnormal_recharge', 'user', 1, null, 100000, '大额异常充值', 'monitoring', '风控-小王');
  insertRisk.run('complaint', 'streamer', 3, null, 0, '用户投诉主播态度问题', 'pending', null);

  const insertFrozen = db.prepare(`
    INSERT INTO frozen_funds (streamer_id, union_id, transaction_id, risk_record_id, amount, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertFrozen.run(1, null, null, 2, 50000, '疑似刷礼物异常冻结', 'frozen');
  insertFrozen.run(3, null, 3, 1, 5000, '未成年退款关联冻结', 'frozen');

  const insertPenalty = db.prepare(`
    INSERT INTO penalty_records (streamer_id, union_id, risk_record_id, amount, reason, operator)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertPenalty.run(2, null, 3, 10000, '直播间违规扣罚', '运营-小李');

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (user_id, streamer_id, session_id, type, content, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertComplaint.run(2, 3, 3, 'attitude', '主播回复态度冷淡，要求退款', 'pending');
  insertComplaint.run(3, 1, 1, 'content', '直播间内容涉及敏感话题', 'resolved');
}

seedIfEmpty();

export default db;
