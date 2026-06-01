require('dotenv').config({ path: '../.env' })
const path = require('path')
const fs = require('fs')
const Database = require('better-sqlite3')

const dbPath = path.join(__dirname, '..', 'data', 'earthquake.db')
const dataDir = path.dirname(dbPath)

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')

db.exec(`
CREATE TABLE IF NOT EXISTS earthquakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  magnitude REAL NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  depth REAL NOT NULL,
  location TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  intensity_estimate TEXT,
  affected_radius REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aftershocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  earthquake_id INTEGER NOT NULL,
  magnitude REAL NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  depth REAL,
  occurred_at TEXT NOT NULL,
  FOREIGN KEY (earthquake_id) REFERENCES earthquakes(id)
);

CREATE TABLE IF NOT EXISTS key_areas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  earthquake_id INTEGER,
  name TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  risk_level TEXT,
  population INTEGER,
  description TEXT,
  FOREIGN KEY (earthquake_id) REFERENCES earthquakes(id)
);

CREATE TABLE IF NOT EXISTS disaster_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_no TEXT UNIQUE NOT NULL,
  report_type TEXT NOT NULL,
  location TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  deaths INTEGER DEFAULT 0,
  injuries INTEGER DEFAULT 0,
  missing INTEGER DEFAULT 0,
  trapped INTEGER DEFAULT 0,
  buildings_destroyed INTEGER DEFAULT 0,
  buildings_damaged INTEGER DEFAULT 0,
  roads_blocked TEXT,
  communication_status TEXT,
  water_supply TEXT,
  power_supply TEXT,
  photo_path TEXT,
  reporter_unit TEXT NOT NULL,
  reporter_name TEXT,
  reporter_phone TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rescue_teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_code TEXT UNIQUE NOT NULL,
  team_name TEXT NOT NULL,
  team_type TEXT,
  person_count INTEGER,
  leader_name TEXT,
  leader_phone TEXT,
  base_location TEXT,
  status TEXT DEFAULT 'standby',
  current_mission_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plate_no TEXT UNIQUE NOT NULL,
  vehicle_type TEXT,
  capacity REAL,
  team_id INTEGER,
  status TEXT DEFAULT 'available',
  current_location TEXT,
  FOREIGN KEY (team_id) REFERENCES rescue_teams(id)
);

CREATE TABLE IF NOT EXISTS missions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_no TEXT UNIQUE NOT NULL,
  mission_type TEXT NOT NULL,
  description TEXT,
  target_location TEXT,
  latitude REAL,
  longitude REAL,
  priority TEXT DEFAULT 'normal',
  team_id INTEGER,
  assigned_resources TEXT,
  departure_time TEXT,
  arrival_time TEXT,
  completion_time TEXT,
  status TEXT DEFAULT 'assigned',
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES rescue_teams(id)
);

CREATE TABLE IF NOT EXISTS mission_tracks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  mission_id INTEGER NOT NULL,
  old_status TEXT,
  new_status TEXT,
  old_team_id INTEGER,
  new_team_id INTEGER,
  change_reason TEXT,
  operator TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (mission_id) REFERENCES missions(id)
);

CREATE TABLE IF NOT EXISTS material_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_code TEXT UNIQUE NOT NULL,
  item_name TEXT NOT NULL,
  category TEXT,
  unit TEXT,
  total_stock REAL DEFAULT 0,
  unit_price REAL,
  specifications TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS material_demands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  demand_no TEXT UNIQUE NOT NULL,
  item_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  demand_location TEXT,
  requester_unit TEXT,
  urgency TEXT DEFAULT 'normal',
  description TEXT,
  status TEXT DEFAULT 'pending',
  allocated_quantity REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES material_items(id)
);

CREATE TABLE IF NOT EXISTS material_allocations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  allocation_no TEXT UNIQUE NOT NULL,
  demand_id INTEGER,
  item_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  from_location TEXT,
  to_location TEXT,
  transporter TEXT,
  dispatch_time TEXT,
  estimated_arrival TEXT,
  actual_arrival TEXT,
  receiver TEXT,
  signoff_time TEXT,
  status TEXT DEFAULT 'dispatched',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (demand_id) REFERENCES material_demands(id),
  FOREIGN KEY (item_id) REFERENCES material_items(id)
);

CREATE TABLE IF NOT EXISTS operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  record_id INTEGER,
  operator TEXT,
  ip_address TEXT,
  details TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_earthquakes_time ON earthquakes(occurred_at);
CREATE INDEX IF NOT EXISTS idx_disaster_reports_status ON disaster_reports(status);
CREATE INDEX IF NOT EXISTS idx_missions_status ON missions(status);
CREATE INDEX IF NOT EXISTS idx_material_allocations_status ON material_allocations(status);
`)

console.log('数据库初始化完成:', dbPath)
db.close()
