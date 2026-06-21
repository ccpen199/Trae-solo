const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config');
const fs = require('fs');

const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(100),
      nickname VARCHAR(50),
      role VARCHAR(20) NOT NULL DEFAULT 'member',
      avatar VARCHAR(255),
      status INTEGER DEFAULT 1,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS login_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username VARCHAR(50),
      ip VARCHAR(50),
      user_agent TEXT,
      location VARCHAR(255),
      status INTEGER DEFAULT 1,
      risk_level VARCHAR(20) DEFAULT 'low',
      fail_reason VARCHAR(255),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS device_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      owner_id INTEGER NOT NULL,
      description VARCHAR(255),
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_sn VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      model VARCHAR(100),
      firmware_version VARCHAR(50),
      protocol VARCHAR(20) DEFAULT 'ONVIF',
      stream_url VARCHAR(500),
      rtsp_url VARCHAR(500),
      rtmp_url VARCHAR(500),
      video_codec VARCHAR(20) DEFAULT 'H.264',
      audio_codec VARCHAR(20) DEFAULT 'G.711A',
      resolution VARCHAR(20),
      owner_id INTEGER NOT NULL,
      group_id INTEGER,
      imei VARCHAR(50),
      status INTEGER DEFAULT 0,
      online_status INTEGER DEFAULT 0,
      last_online_at DATETIME,
      last_heartbeat_at DATETIME,
      ip_address VARCHAR(50),
      mac_address VARCHAR(50),
      support_ptz INTEGER DEFAULT 0,
      support_audio INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (group_id) REFERENCES device_groups(id)
    );

    CREATE TABLE IF NOT EXISTS device_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      share_from_user_id INTEGER NOT NULL,
      share_to_user_id INTEGER,
      share_to_phone VARCHAR(20),
      permission_level VARCHAR(20) NOT NULL DEFAULT 'view',
      expire_at DATETIME,
      temporary_token VARCHAR(255),
      temporary_token_expire DATETIME,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (share_from_user_id) REFERENCES users(id),
      FOREIGN KEY (share_to_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS storage_policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      owner_id INTEGER NOT NULL,
      device_id INTEGER,
      group_id INTEGER,
      policy_type VARCHAR(20) NOT NULL,
      retention_days INTEGER DEFAULT 7,
      schedule_config TEXT,
      smart_tags TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (group_id) REFERENCES device_groups(id)
    );

    CREATE TABLE IF NOT EXISTS recordings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_name VARCHAR(255),
      file_size BIGINT,
      duration INTEGER,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      record_type VARCHAR(20) DEFAULT 'schedule',
      event_id INTEGER,
      smart_tags TEXT,
      encrypted INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS ai_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      event_type VARCHAR(50) NOT NULL,
      event_level VARCHAR(20) DEFAULT 'normal',
      confidence REAL DEFAULT 0,
      snapshot_path VARCHAR(500),
      video_path VARCHAR(500),
      location_x INTEGER,
      location_y INTEGER,
      location_w INTEGER,
      location_h INTEGER,
      description TEXT,
      processed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER,
      device_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      alert_type VARCHAR(20) NOT NULL,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      channels TEXT,
      sent_channels TEXT,
      status INTEGER DEFAULT 0,
      read_status INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES ai_events(id),
      FOREIGN KEY (device_id) REFERENCES devices(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS alert_audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id INTEGER NOT NULL,
      user_id INTEGER,
      action VARCHAR(50) NOT NULL,
      action_detail TEXT,
      ip VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (alert_id) REFERENCES alerts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      imei VARCHAR(50),
      device_model VARCHAR(100),
      last_login_at DATETIME,
      is_trusted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_devices_owner ON devices(owner_id);
    CREATE INDEX IF NOT EXISTS idx_devices_sn ON devices(device_sn);
    CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);
    CREATE INDEX IF NOT EXISTS idx_events_device ON ai_events(device_id);
    CREATE INDEX IF NOT EXISTS idx_events_time ON ai_events(created_at);
    CREATE INDEX IF NOT EXISTS idx_recordings_device ON recordings(device_id);
    CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_shares_device ON device_shares(device_id);
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const defaultPwd = bcrypt.hashSync('admin123456', 10);
    db.prepare(`
      INSERT INTO users (username, password, nickname, role, phone, email, status)
      VALUES (?, ?, ?, 'owner', ?, ?, 1)
    `).run('admin', defaultPwd, '超级管理员', '13800138000', 'admin@example.com');

    console.log('默认管理员账号: admin / admin123456');
  }
}

initDatabase();

module.exports = db;
