const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    vendor_id TEXT NOT NULL,
    firmware_version TEXT NOT NULL,
    protocol TEXT NOT NULL,
    capability_schema TEXT,
    status TEXT DEFAULT 'offline',
    last_heartbeat INTEGER,
    room_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id)
  );

  CREATE TABLE IF NOT EXISTS device_heartbeats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    status TEXT NOT NULL,
    metrics TEXT,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS homes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    home_id TEXT NOT NULL,
    name TEXT NOT NULL,
    parent_id TEXT,
    topology_order INTEGER DEFAULT 0,
    energy_unit_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (home_id) REFERENCES homes(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES rooms(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS device_groups (
    id TEXT PRIMARY KEY,
    room_id TEXT,
    name TEXT NOT NULL,
    strategy TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS device_group_members (
    group_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    joined_at INTEGER NOT NULL,
    PRIMARY KEY (group_id, device_id),
    FOREIGN KEY (group_id) REFERENCES device_groups(id) ON DELETE CASCADE,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS energy_meters (
    id TEXT PRIMARY KEY,
    room_id TEXT,
    device_id TEXT,
    total_consumption REAL DEFAULT 0,
    last_reading REAL DEFAULT 0,
    last_reading_time INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS energy_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meter_id TEXT NOT NULL,
    consumption REAL NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (meter_id) REFERENCES energy_meters(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS scenes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    trigger_expression TEXT NOT NULL,
    action_queue TEXT NOT NULL,
    fallback_plan TEXT,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS scene_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scene_id TEXT NOT NULL,
    triggered_by TEXT,
    status TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    error_message TEXT,
    action_results TEXT,
    FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS knowledge_graph (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    relation TEXT NOT NULL,
    target_entity_type TEXT NOT NULL,
    target_entity_id TEXT NOT NULL,
    confidence REAL DEFAULT 1.0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auto_detected_scenes (
    id TEXT PRIMARY KEY,
    pattern_name TEXT NOT NULL,
    device_combination TEXT NOT NULL,
    scene_name TEXT NOT NULL,
    confidence REAL NOT NULL,
    detected_at INTEGER NOT NULL,
    confirmed INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS voice_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'default',
    context TEXT,
    last_intent TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS voice_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    command TEXT NOT NULL,
    intent TEXT,
    entities TEXT,
    corrected_intent TEXT,
    success INTEGER DEFAULT 0,
    fuzzy_corrected INTEGER DEFAULT 0,
    multi_turn INTEGER DEFAULT 0,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES voice_sessions(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS content_services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    copyright_holder TEXT NOT NULL,
    license_start INTEGER,
    license_end INTEGER,
    cdn_strategy TEXT,
    content_rating TEXT DEFAULT 'all',
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS shopping_orders (
    id TEXT PRIMARY KEY,
    user_id TEXT DEFAULT 'default',
    tmall_item_id TEXT,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL,
    voice_triggered INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS family_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL,
    balance REAL DEFAULT 0,
    daily_limit REAL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS device_health_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    offline_count INTEGER DEFAULT 0,
    firmware_outdated INTEGER DEFAULT 0,
    health_score REAL DEFAULT 100,
    status_change TEXT,
    resolved INTEGER DEFAULT 0,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS parental_controls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT DEFAULT 'default',
    daily_time_limit INTEGER DEFAULT 120,
    used_time INTEGER DEFAULT 0,
    content_rating TEXT DEFAULT 'all',
    last_reset INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);
  CREATE INDEX IF NOT EXISTS idx_devices_room ON devices(room_id);
  CREATE INDEX IF NOT EXISTS idx_heartbeats_device ON device_heartbeats(device_id, timestamp);
  CREATE INDEX IF NOT EXISTS idx_energy_records_time ON energy_records(timestamp);
  CREATE INDEX IF NOT EXISTS idx_scene_executions_time ON scene_executions(started_at);
`);

const now = Date.now();

const homeStmt = db.prepare('INSERT OR IGNORE INTO homes (id, name, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?)');
homeStmt.run('home-001', '我的家', '幸福小区1号楼', now, now);

const roomStmt = db.prepare('INSERT OR IGNORE INTO rooms (id, home_id, name, parent_id, topology_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
roomStmt.run('room-living', 'home-001', '客厅', null, 1, now, now);
roomStmt.run('room-bedroom', 'home-001', '主卧', null, 2, now, now);
roomStmt.run('room-kitchen', 'home-001', '厨房', null, 3, now, now);
roomStmt.run('room-bathroom', 'home-001', '卫生间', null, 4, now, now);

const deviceStmt = db.prepare('INSERT OR IGNORE INTO devices (id, name, vendor_id, firmware_version, protocol, capability_schema, status, last_heartbeat, room_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

const lightSchema = JSON.stringify({
  type: 'object',
  properties: {
    power: { type: 'boolean' },
    brightness: { type: 'integer', minimum: 0, maximum: 100 },
    color: { type: 'string' }
  }
});

const acSchema = JSON.stringify({
  type: 'object',
  properties: {
    power: { type: 'boolean' },
    mode: { type: 'string', enum: ['cool', 'heat', 'auto', 'fan'] },
    temperature: { type: 'integer', minimum: 16, maximum: 30 }
  }
});

const projectorSchema = JSON.stringify({
  type: 'object',
  properties: {
    power: { type: 'boolean' },
    source: { type: 'string' },
    volume: { type: 'integer', minimum: 0, maximum: 100 }
  }
});

deviceStmt.run('dev-light-001', '客厅主灯', 'vendor-xiaomi', '2.3.1', 'zigbee', lightSchema, 'online', now, 'room-living', now, now);
deviceStmt.run('dev-ac-001', '客厅空调', 'vendor-midea', '3.1.0', 'matter', acSchema, 'online', now, 'room-living', now, now);
deviceStmt.run('dev-projector-001', '客厅投影仪', 'vendor-egate', '1.5.2', 'wifi', projectorSchema, 'online', now, 'room-living', now, now);
deviceStmt.run('dev-light-002', '卧室灯', 'vendor-xiaomi', '2.3.1', 'zigbee', lightSchema, 'online', now, 'room-bedroom', now, now);

const sceneStmt = db.prepare('INSERT OR IGNORE INTO scenes (id, name, description, trigger_expression, action_queue, fallback_plan, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');

const movieActions = JSON.stringify([
  { deviceId: 'dev-light-001', action: { power: false } },
  { deviceId: 'dev-ac-001', action: { power: true, mode: 'cool', temperature: 24 } },
  { deviceId: 'dev-projector-001', action: { power: true, source: 'hdmi1', volume: 50 } }
]);

const fallback = JSON.stringify({
  onFailure: 'stop',
  retryCount: 2,
  alternativeActions: []
});

sceneStmt.run('scene-movie', '观影模式', '自动调节客厅设备为观影状态', 'voice:"看电影" OR button:movie', movieActions, JSON.stringify(fallback), 1, now, now);

const kgStmt = db.prepare('INSERT OR IGNORE INTO knowledge_graph (id, entity_type, entity_id, relation, target_entity_type, target_entity_id, confidence, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
kgStmt.run('kg-001', 'room', 'room-living', 'contains', 'device', 'dev-light-001', 1.0, now);
kgStmt.run('kg-002', 'room', 'room-living', 'contains', 'device', 'dev-ac-001', 1.0, now);
kgStmt.run('kg-003', 'room', 'room-living', 'contains', 'device', 'dev-projector-001', 1.0, now);

const detectedStmt = db.prepare('INSERT OR IGNORE INTO auto_detected_scenes (id, pattern_name, device_combination, scene_name, confidence, detected_at, confirmed) VALUES (?, ?, ?, ?, ?, ?, ?)');
detectedStmt.run('ads-001', 'entertainment-setup', '["dev-light-001","dev-ac-001","dev-projector-001"]', '观影模式', 0.95, now, 1);

const accountStmt = db.prepare('INSERT OR IGNORE INTO family_accounts (id, user_id, balance, daily_limit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
accountStmt.run('acc-001', 'default', 5000.0, 200.0, now, now);

const parentalStmt = db.prepare('INSERT OR IGNORE INTO parental_controls (user_id, daily_time_limit, used_time, content_rating, last_reset) VALUES (?, ?, ?, ?, ?)');
parentalStmt.run('default', 120, 45, 'teen', now);

const energyStmt = db.prepare('INSERT OR IGNORE INTO energy_meters (id, room_id, device_id, total_consumption, last_reading_time, created_at) VALUES (?, ?, ?, ?, ?, ?)');
energyStmt.run('em-001', 'room-living', null, 156.5, now, now);
energyStmt.run('em-002', 'room-bedroom', null, 89.3, now, now);

console.log('Database initialized successfully at:', dbPath);
db.close();
