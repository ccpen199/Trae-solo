require('dotenv').config({ path: '../.env' });
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'fire_dispatch.db');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('Initializing database...');

db.exec(`
  CREATE TABLE IF NOT EXISTS alarms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alarm_no TEXT UNIQUE NOT NULL,
    caller_name TEXT,
    caller_phone TEXT,
    location TEXT NOT NULL,
    lng REAL,
    lat REAL,
    disaster_type TEXT NOT NULL,
    disaster_level TEXT DEFAULT '一般',
    people_trapped INTEGER DEFAULT 0,
    building_type TEXT,
    hazardous_materials TEXT,
    recording_index TEXT,
    alarm_time DATETIME NOT NULL,
    receiver TEXT,
    status TEXT DEFAULT '待研判',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_code TEXT UNIQUE NOT NULL,
    station_name TEXT NOT NULL,
    address TEXT,
    lng REAL,
    lat REAL,
    status TEXT DEFAULT '在岗',
    capacity INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plate_no TEXT UNIQUE NOT NULL,
    vehicle_type TEXT NOT NULL,
    vehicle_name TEXT,
    station_id INTEGER,
    status TEXT DEFAULT '待命',
    last_maintenance DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id)
  );

  CREATE TABLE IF NOT EXISTS firefighters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staff_no TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    rank TEXT,
    station_id INTEGER,
    status TEXT DEFAULT '在岗',
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (station_id) REFERENCES stations(id)
  );

  CREATE TABLE IF NOT EXISTS dispatches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dispatch_no TEXT UNIQUE NOT NULL,
    alarm_id INTEGER NOT NULL,
    commander TEXT,
    recommend_reason TEXT,
    adjust_reason TEXT,
    dispatch_time DATETIME,
    estimated_arrival_time DATETIME,
    actual_arrival_time DATETIME,
    route_status TEXT DEFAULT '派车中',
    status TEXT DEFAULT '已派警',
    timeout_reminded INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alarm_id) REFERENCES alarms(id)
  );

  CREATE TABLE IF NOT EXISTS dispatch_vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dispatch_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    departure_time DATETIME,
    arrival_time DATETIME,
    return_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispatch_id) REFERENCES dispatches(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
    UNIQUE(dispatch_id, vehicle_id)
  );

  CREATE TABLE IF NOT EXISTS dispatch_firefighters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dispatch_id INTEGER NOT NULL,
    firefighter_id INTEGER NOT NULL,
    role TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (dispatch_id) REFERENCES dispatches(id),
    FOREIGN KEY (firefighter_id) REFERENCES firefighters(id),
    UNIQUE(dispatch_id, firefighter_id)
  );

  CREATE TABLE IF NOT EXISTS scene_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alarm_id INTEGER NOT NULL,
    dispatch_id INTEGER,
    update_type TEXT NOT NULL,
    fire_intensity TEXT,
    rescue_progress TEXT,
    reinforcement_request TEXT,
    casualties TEXT,
    report_time DATETIME NOT NULL,
    reporter TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alarm_id) REFERENCES alarms(id),
    FOREIGN KEY (dispatch_id) REFERENCES dispatches(id)
  );

  CREATE TABLE IF NOT EXISTS timelines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alarm_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    event_content TEXT NOT NULL,
    event_time DATETIME NOT NULL,
    operator TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alarm_id) REFERENCES alarms(id)
  );

  CREATE TABLE IF NOT EXISTS false_alarms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alarm_id INTEGER NOT NULL,
    reason TEXT,
    confirmed_by TEXT,
    confirmed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alarm_id) REFERENCES alarms(id)
  );

  CREATE TABLE IF NOT EXISTS key_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    location_name TEXT NOT NULL,
    address TEXT,
    lng REAL,
    lat REAL,
    risk_level TEXT DEFAULT '一般',
    location_type TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_alarms_status ON alarms(status);
  CREATE INDEX IF NOT EXISTS idx_alarms_time ON alarms(alarm_time);
  CREATE INDEX IF NOT EXISTS idx_dispatches_alarm ON dispatches(alarm_id);
  CREATE INDEX IF NOT EXISTS idx_updates_alarm ON scene_updates(alarm_id);
  CREATE INDEX IF NOT EXISTS idx_timelines_alarm ON timelines(alarm_id);
  CREATE INDEX IF NOT EXISTS idx_vehicles_station ON vehicles(station_id);
  CREATE INDEX IF NOT EXISTS idx_firefighters_station ON firefighters(station_id);
`);

console.log('Database tables created.');

console.log('Seeding initial data...');

const stationData = [
  { code: 'FS001', name: '中心消防站', address: '市中心消防路1号', lng: 116.403874, lat: 39.916666, capacity: 20 },
  { code: 'FS002', name: '东区消防站', address: '东区平安大道88号', lng: 116.453874, lat: 39.916666, capacity: 15 },
  { code: 'FS003', name: '西区消防站', address: '西区科技路56号', lng: 116.353874, lat: 39.916666, capacity: 12 },
  { code: 'FS004', name: '南区消防站', address: '南区工业园23号', lng: 116.403874, lat: 39.866666, capacity: 15 },
  { code: 'FS005', name: '北区消防站', address: '北区高校路99号', lng: 116.403874, lat: 39.966666, capacity: 12 },
];

const insertStation = db.prepare(`
  INSERT OR IGNORE INTO stations (station_code, station_name, address, lng, lat, capacity)
  VALUES (?, ?, ?, ?, ?, ?)
`);

stationData.forEach(s => {
  insertStation.run(s.code, s.name, s.address, s.lng, s.lat, s.capacity);
});

const vehicleData = [
  { plate: 'X12345', type: '水罐消防车', name: '水罐车01', station: 1 },
  { plate: 'X12346', type: '水罐消防车', name: '水罐车02', station: 1 },
  { plate: 'X12347', type: '泡沫消防车', name: '泡沫车01', station: 1 },
  { plate: 'X12348', type: '云梯消防车', name: '云梯车01', station: 1 },
  { plate: 'X12349', type: '抢险救援车', name: '救援车01', station: 1 },
  { plate: 'X22345', type: '水罐消防车', name: '水罐车03', station: 2 },
  { plate: 'X22346', type: '水罐消防车', name: '水罐车04', station: 2 },
  { plate: 'X22347', type: '泡沫消防车', name: '泡沫车02', station: 2 },
  { plate: 'X32345', type: '水罐消防车', name: '水罐车05', station: 3 },
  { plate: 'X32346', type: '抢险救援车', name: '救援车02', station: 3 },
  { plate: 'X42345', type: '水罐消防车', name: '水罐车06', station: 4 },
  { plate: 'X42346', type: '水罐消防车', name: '水罐车07', station: 4 },
  { plate: 'X42347', type: '云梯消防车', name: '云梯车02', station: 4 },
  { plate: 'X52345', type: '水罐消防车', name: '水罐车08', station: 5 },
  { plate: 'X52346', type: '泡沫消防车', name: '泡沫车03', station: 5 },
];

const insertVehicle = db.prepare(`
  INSERT OR IGNORE INTO vehicles (plate_no, vehicle_type, vehicle_name, station_id)
  VALUES (?, ?, ?, ?)
`);

vehicleData.forEach(v => {
  insertVehicle.run(v.plate, v.type, v.name, v.station);
});

const firefighterData = [
  { no: 'FF001', name: '张建国', rank: '中队长', station: 1, phone: '13800138001' },
  { no: 'FF002', name: '李明辉', rank: '指导员', station: 1, phone: '13800138002' },
  { no: 'FF003', name: '王志强', rank: '班长', station: 1, phone: '13800138003' },
  { no: 'FF004', name: '赵伟', rank: '战斗员', station: 1, phone: '13800138004' },
  { no: 'FF005', name: '陈刚', rank: '战斗员', station: 1, phone: '13800138005' },
  { no: 'FF006', name: '刘海峰', rank: '战斗员', station: 1, phone: '13800138006' },
  { no: 'FF007', name: '孙大鹏', rank: '中队长', station: 2, phone: '13800138007' },
  { no: 'FF008', name: '周明', rank: '战斗员', station: 2, phone: '13800138008' },
  { no: 'FF009', name: '吴涛', rank: '战斗员', station: 2, phone: '13800138009' },
  { no: 'FF010', name: '郑浩', rank: '中队长', station: 3, phone: '13800138010' },
  { no: 'FF011', name: '黄磊', rank: '战斗员', station: 3, phone: '13800138011' },
  { no: 'FF012', name: '林勇', rank: '中队长', station: 4, phone: '13800138012' },
  { no: 'FF013', name: '徐峰', rank: '战斗员', station: 4, phone: '13800138013' },
  { no: 'FF014', name: '马超', rank: '战斗员', station: 4, phone: '13800138014' },
  { no: 'FF015', name: '朱杰', rank: '中队长', station: 5, phone: '13800138015' },
  { no: 'FF016', name: '胡军', rank: '战斗员', station: 5, phone: '13800138016' },
];

const insertFirefighter = db.prepare(`
  INSERT OR IGNORE INTO firefighters (staff_no, name, rank, station_id, phone)
  VALUES (?, ?, ?, ?, ?)
`);

firefighterData.forEach(f => {
  insertFirefighter.run(f.no, f.name, f.rank, f.station, f.phone);
});

const keyLocationData = [
  { name: '城市中心广场', address: '市中心人民路100号', lng: 116.403874, lat: 39.916666, risk: '高', type: '人员密集场所' },
  { name: '石化总厂', address: '东区化工路1号', lng: 116.463874, lat: 39.916666, risk: '极高', type: '化工企业' },
  { name: '市第一人民医院', address: '西区健康路200号', lng: 116.353874, lat: 39.926666, risk: '高', type: '医院' },
  { name: '大型购物中心', address: '南区商业街88号', lng: 116.403874, lat: 39.866666, risk: '高', type: '商业综合体' },
  { name: '大学城图书馆', address: '北区学府路50号', lng: 116.403874, lat: 39.966666, risk: '中', type: '文化教育' },
  { name: '天然气门站', address: '郊区能源路1号', lng: 116.503874, lat: 39.856666, risk: '极高', type: '能源设施' },
];

const insertKeyLocation = db.prepare(`
  INSERT OR IGNORE INTO key_locations (location_name, address, lng, lat, risk_level, location_type, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

keyLocationData.forEach(k => {
  insertKeyLocation.run(k.name, k.address, k.lng, k.lat, k.risk, k.type, k.notes);
});

console.log('Database initialization complete.');
console.log('Stations:', db.prepare('SELECT COUNT(*) as cnt FROM stations').get().cnt);
console.log('Vehicles:', db.prepare('SELECT COUNT(*) as cnt FROM vehicles').get().cnt);
console.log('Firefighters:', db.prepare('SELECT COUNT(*) as cnt FROM firefighters').get().cnt);
console.log('Key Locations:', db.prepare('SELECT COUNT(*) as cnt FROM key_locations').get().cnt);

db.close();
