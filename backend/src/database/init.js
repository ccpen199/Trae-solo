const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS homes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    wallpaper TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    homeId TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    sortOrder INTEGER DEFAULT 0,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (homeId) REFERENCES homes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    homeId TEXT NOT NULL,
    roomId TEXT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    icon TEXT,
    status TEXT DEFAULT 'offline',
    capabilities TEXT,
    state TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (homeId) REFERENCES homes(id) ON DELETE CASCADE,
    FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS automations (
    id TEXT PRIMARY KEY,
    homeId TEXT NOT NULL,
    name TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    conditions TEXT NOT NULL,
    actions TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    FOREIGN KEY (homeId) REFERENCES homes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS automation_logs (
    id TEXT PRIMARY KEY,
    automationId TEXT,
    deviceId TEXT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    success INTEGER DEFAULT 1,
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (automationId) REFERENCES automations(id) ON DELETE SET NULL,
    FOREIGN KEY (deviceId) REFERENCES devices(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS voice_commands (
    id TEXT PRIMARY KEY,
    homeId TEXT NOT NULL,
    command TEXT NOT NULL,
    result TEXT,
    success INTEGER DEFAULT 0,
    createdAt INTEGER NOT NULL,
    FOREIGN KEY (homeId) REFERENCES homes(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_rooms_homeId ON rooms(homeId);
  CREATE INDEX IF NOT EXISTS idx_devices_homeId ON devices(homeId);
  CREATE INDEX IF NOT EXISTS idx_devices_roomId ON devices(roomId);
  CREATE INDEX IF NOT EXISTS idx_automations_homeId ON automations(homeId);
  CREATE INDEX IF NOT EXISTS idx_automation_logs_createdAt ON automation_logs(createdAt DESC);
`);

const now = Date.now();

const homeCount = db.prepare('SELECT COUNT(*) as count FROM homes').get().count;

if (homeCount === 0) {
  const insertHome = db.prepare('INSERT INTO homes (id, name, location, wallpaper, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)');
  insertHome.run('home-1', '我的家', '北京市朝阳区', '', now, now);
  insertHome.run('home-2', '父母家', '上海市浦东新区', '', now, now);

  const insertRoom = db.prepare('INSERT INTO rooms (id, homeId, name, icon, sortOrder, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertRoom.run('room-1', 'home-1', '客厅', 'sofa', 0, now, now);
  insertRoom.run('room-2', 'home-1', '卧室', 'bed', 1, now, now);
  insertRoom.run('room-3', 'home-1', '厨房', 'utensils', 2, now, now);
  insertRoom.run('room-4', 'home-2', '客厅', 'sofa', 0, now, now);

  const insertDevice = db.prepare('INSERT INTO devices (id, homeId, roomId, name, type, icon, status, capabilities, state, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  
  const devices = [
    ['dev-1', 'home-1', 'room-1', '客厅灯', 'light', 'lightbulb', 'online', '{"power":true,"brightness":true,"color":true}', '{"power":true,"brightness":80,"color":"#ffffff"}'],
    ['dev-2', 'home-1', 'room-1', '客厅空调', 'ac', 'fan', 'online', '{"power":true,"temp":true,"mode":true}', '{"power":true,"temp":24,"mode":"cool"}'],
    ['dev-3', 'home-1', 'room-2', '卧室灯', 'light', 'lightbulb', 'offline', '{"power":true,"brightness":true}', '{"power":false,"brightness":100}'],
    ['dev-4', 'home-1', 'room-3', '智能插座', 'outlet', 'plug', 'online', '{"power":true}', '{"power":false}'],
    ['dev-5', 'home-2', 'room-4', '电视', 'tv', 'tv', 'online', '{"power":true,"volume":true,"channel":true}', '{"power":false,"volume":50,"channel":1}'],
  ];

  for (const device of devices) {
    insertDevice.run(...device, now, now);
  }

  const insertAutomation = db.prepare('INSERT INTO automations (id, homeId, name, enabled, conditions, actions, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertAutomation.run(
    'auto-1', 'home-1', '回家开灯', 1,
    '[{"type":"time","time":"18:00"}]',
    '[{"type":"device","deviceId":"dev-1","action":"powerOn"}]',
    now, now
  );
}

console.log('数据库初始化完成！');
console.log('数据文件路径:', dbPath);

db.close();
