import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../data/app.sqlite');
const dbDir = join(__dirname, '../../data');

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_type TEXT NOT NULL,
    name TEXT NOT NULL,
    protocol TEXT CHECK(protocol IN ('IR', 'WIFI', 'BLUETOOTH_MESH')) NOT NULL,
    manufacturer TEXT,
    model TEXT,
    fingerprint TEXT,
    status TEXT CHECK(status IN ('online', 'offline', 'error')) DEFAULT 'offline',
    last_control_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ir_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    code_type TEXT NOT NULL,
    key_name TEXT NOT NULL,
    code_data TEXT NOT NULL,
    frequency INTEGER,
    format TEXT,
    event_type TEXT CHECK(event_type IN ('short', 'long')) DEFAULT 'short',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS remote_panels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    layout_data TEXT NOT NULL,
    theme TEXT DEFAULT 'light',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS control_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    command TEXT NOT NULL,
    watermark TEXT,
    result TEXT CHECK(result IN ('success', 'failure', 'timeout')) NOT NULL,
    response_time INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS epg_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT UNIQUE NOT NULL,
    channel_name TEXT NOT NULL,
    channel_number INTEGER,
    logo_url TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS epg_programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT REFERENCES epg_channels(channel_id) ON DELETE CASCADE,
    program_name TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    description TEXT,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recording_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    program_id INTEGER REFERENCES epg_programs(id) ON DELETE CASCADE,
    channel_id TEXT,
    program_name TEXT,
    scheduled_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status TEXT CHECK(status IN ('pending', 'recording', 'completed', 'failed')) DEFAULT 'pending',
    completed_time DATETIME,
    file_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS watch_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT NOT NULL,
    program_id INTEGER REFERENCES epg_programs(id) ON DELETE SET NULL,
    watch_duration INTEGER NOT NULL,
    skip_count INTEGER DEFAULT 0,
    category TEXT,
    watched_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS device_capabilities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_type TEXT UNIQUE NOT NULL,
    capabilities TEXT NOT NULL,
    version TEXT NOT NULL,
    status TEXT CHECK(status IN ('draft', 'testing', 'published', 'deprecated')) DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sdk_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    package_name TEXT NOT NULL,
    version TEXT NOT NULL,
    device_type TEXT NOT NULL,
    package_data TEXT NOT NULL,
    test_result TEXT,
    status TEXT CHECK(status IN ('pending', 'testing', 'approved', 'rejected')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS usage_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    total_duration INTEGER DEFAULT 0,
    control_count INTEGER DEFAULT 0,
    avg_power_level REAL,
    metadata TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('user', 'admin', 'vendor')) DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS learning_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
    key_name TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'success', 'failed', 'confirmed')) DEFAULT 'pending',
    user_confirmed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const defaultUser = db.prepare('SELECT * FROM users WHERE username = ?').get('admin');
if (!defaultUser) {
  const hashedPassword = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'admin');
  console.log('Default admin user created: admin/admin123');
}

const defaultCapabilities = [
  {
    device_type: 'air_conditioner',
    capabilities: JSON.stringify({
      temperature_control: { type: 'range', min: 16, max: 30, unit: 'celsius' },
      mode_switch: { type: 'enum', options: ['cool', 'heat', 'fan', 'auto', 'dry'] },
      fan_speed: { type: 'enum', options: ['low', 'medium', 'high', 'auto'] }
    }),
    version: '1.0.0',
    status: 'published'
  },
  {
    device_type: 'television',
    capabilities: JSON.stringify({
      power: { type: 'boolean' },
      volume: { type: 'range', min: 0, max: 100 },
      channel: { type: 'range', min: 1, max: 999 },
      input_source: { type: 'enum', options: ['tv', 'hdmi1', 'hdmi2', 'usb', 'av'] }
    }),
    version: '1.0.0',
    status: 'published'
  },
  {
    device_type: 'fan',
    capabilities: JSON.stringify({
      power: { type: 'boolean' },
      speed: { type: 'enum', options: ['low', 'medium', 'high'] },
      oscillation: { type: 'boolean' },
      timer: { type: 'range', min: 0, max: 12, unit: 'hours' }
    }),
    version: '1.0.0',
    status: 'published'
  }
];

for (const cap of defaultCapabilities) {
  const existing = db.prepare('SELECT * FROM device_capabilities WHERE device_type = ?').get(cap.device_type);
  if (!existing) {
    db.prepare('INSERT INTO device_capabilities (device_type, capabilities, version, status) VALUES (?, ?, ?, ?)').run(
      cap.device_type,
      cap.capabilities,
      cap.version,
      cap.status
    );
  }
}

console.log('Database initialized successfully');
console.log(`Database path: ${dbPath}`);

db.close();
