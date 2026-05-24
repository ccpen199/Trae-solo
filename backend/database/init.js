const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nickname TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  level INTEGER DEFAULT 3,
  credit_score INTEGER DEFAULT 100,
  avatar TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS venues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  manager_id INTEGER,
  description TEXT,
  business_hours TEXT,
  lighting TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS courts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venue_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  sport_type TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  price_per_hour REAL NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (venue_id) REFERENCES venues(id)
);

CREATE TABLE IF NOT EXISTS time_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  court_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  booking_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (court_id) REFERENCES courts(id)
);

CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organizer_id INTEGER NOT NULL,
  court_id INTEGER NOT NULL,
  time_slot_id INTEGER NOT NULL,
  sport_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  level_required INTEGER DEFAULT 3,
  max_players INTEGER NOT NULL,
  min_players INTEGER NOT NULL,
  aa_rule TEXT NOT NULL,
  deposit_amount REAL DEFAULT 0,
  allow_waitlist INTEGER DEFAULT 1,
  cancel_deadline DATETIME,
  status TEXT DEFAULT 'recruiting',
  total_fee REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id),
  FOREIGN KEY (court_id) REFERENCES courts(id),
  FOREIGN KEY (time_slot_id) REFERENCES time_slots(id)
);

CREATE TABLE IF NOT EXISTS game_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  role TEXT DEFAULT 'player',
  status TEXT DEFAULT 'registered',
  deposit_paid REAL DEFAULT 0,
  actual_fee REAL DEFAULT 0,
  checked_in INTEGER DEFAULT 0,
  checkin_time DATETIME,
  no_show INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(game_id, user_id)
);

CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  status TEXT DEFAULT 'waiting',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(game_id, user_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER,
  user_id INTEGER NOT NULL,
  amount REAL NOT NULL,
  payment_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  transaction_id TEXT,
  refunded_amount REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS game_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  score TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL,
  reviewer_id INTEGER NOT NULL,
  target_user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  credit_impact INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  FOREIGN KEY (target_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id INTEGER,
  details TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exceptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  game_id INTEGER,
  user_id INTEGER,
  description TEXT,
  status TEXT DEFAULT 'pending',
  handled_by INTEGER,
  handled_at DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (handled_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`);

const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, password, nickname, role, level, credit_score)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertUser.run('admin', bcrypt.hashSync('admin123', salt), '系统管理员', 'admin', 5, 100);
insertUser.run('operator', bcrypt.hashSync('operator123', salt), '运营人员', 'operator', 5, 100);
insertUser.run('cs1', bcrypt.hashSync('cs123', salt), '客服小王', 'customer_service', 3, 100);
insertUser.run('venue1', bcrypt.hashSync('venue123', salt), '球馆张经理', 'venue_manager', 3, 100);
insertUser.run('organizer1', bcrypt.hashSync('org123', salt), '羽毛球达人', 'organizer', 4, 95);
insertUser.run('user1', bcrypt.hashSync('user123', salt), '羽毛球爱好者', 'user', 3, 90);
insertUser.run('user2', bcrypt.hashSync('user123', salt), '网球新手', 'user', 2, 85);
insertUser.run('user3', bcrypt.hashSync('user123', salt), '篮球高手', 'user', 5, 98);

const insertVenue = db.prepare(`
  INSERT OR IGNORE INTO venues (id, name, address, phone, manager_id, description, business_hours, lighting)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
insertVenue.run(1, '阳光运动中心', '朝阳区建国路88号', '010-88888888', 4, '综合性运动场馆，拥有羽毛球、网球、篮球场地', '08:00-22:00', '专业LED照明');
insertVenue.run(2, '飞翔体育馆', '海淀区中关村大街100号', '010-66666666', 4, '专业羽毛球场馆，12片标准场地', '09:00-23:00', '国际比赛级照明');

const insertCourt = db.prepare(`
  INSERT OR IGNORE INTO courts (id, venue_id, name, sport_type, capacity, price_per_hour, description)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
insertCourt.run(1, 1, '羽毛球1号场', 'badminton', 4, 80, '标准双打场地');
insertCourt.run(2, 1, '羽毛球2号场', 'badminton', 4, 80, '标准双打场地');
insertCourt.run(3, 1, '网球1号场', 'tennis', 4, 150, '硬地网球场');
insertCourt.run(4, 1, '篮球1号场', 'basketball', 10, 200, '室内篮球场');
insertCourt.run(5, 2, '羽毛球场A1', 'badminton', 4, 100, 'VIP场地');
insertCourt.run(6, 2, '羽毛球场A2', 'badminton', 4, 100, 'VIP场地');

const insertTimeSlot = db.prepare(`
  INSERT OR IGNORE INTO time_slots (id, court_id, date, start_time, end_time, status)
  VALUES (?, ?, ?, ?, ?, ?)
`);
const today = new Date();
for (let i = 0; i < 7; i++) {
  const date = new Date(today);
  date.setDate(date.getDate() + i);
  const dateStr = date.toISOString().split('T')[0];
  for (let hour = 8; hour < 22; hour++) {
    const slotId = i * 14 + hour - 7;
    insertTimeSlot.run(slotId, 1, dateStr, `${hour.toString().padStart(2, '0')}:00`, `${(hour + 1).toString().padStart(2, '0')}:00`, 'available');
    insertTimeSlot.run(slotId + 100, 5, dateStr, `${hour.toString().padStart(2, '0')}:00`, `${(hour + 1).toString().padStart(2, '0')}:00`, 'available');
  }
}

console.log('Database initialized successfully');
db.close();
