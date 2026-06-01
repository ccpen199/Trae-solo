const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath, { verbose: console.log });

db.exec(`
  CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT UNIQUE NOT NULL,
    username TEXT,
    token TEXT,
    device_type TEXT CHECK(device_type IN ('ios', 'android', 'web')),
    os_version TEXT,
    app_version TEXT,
    push_time DATETIME,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_open_time DATETIME,
    push_status INTEGER DEFAULT 1,
    is_logged_in INTEGER DEFAULT 0,
    has_notification_permission INTEGER DEFAULT 1,
    is_online INTEGER DEFAULT 0,
    app_entry_enabled INTEGER DEFAULT 1,
    version_supported INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tag_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status INTEGER DEFAULT 1,
    creator TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS device_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(device_id, tag_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS push_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    jump_url TEXT,
    image_url TEXT,
    task_type TEXT CHECK(task_type IN ('transaction', 'operation')),
    trigger_type TEXT,
    target_users TEXT,
    send_type TEXT CHECK(send_type IN ('immediate', 'scheduled')),
    scheduled_time DATETIME,
    status TEXT CHECK(status IN ('pending_review', 'approved', 'rejected', 'sending', 'completed', 'failed')),
    reviewer TEXT,
    review_comment TEXT,
    review_time DATETIME,
    creator TEXT,
    total_count INTEGER DEFAULT 0,
    success_count INTEGER DEFAULT 0,
    failed_count INTEGER DEFAULT 0,
    read_count INTEGER DEFAULT 0,
    unread_count INTEGER DEFAULT 0,
    start_time DATETIME,
    end_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS push_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    device_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('pending', 'success', 'failed', 'read')),
    sent_time DATETIME,
    read_time DATETIME,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

const devices = [
  { device_id: 'DEV001', username: '张三', token: 'token_001', device_type: 'ios', os_version: '17.0', app_version: '2.1.0', last_open_time: '2024-01-15 10:30:00', push_status: 1, is_logged_in: 1, is_online: 1 },
  { device_id: 'DEV002', username: '李四', token: 'token_002', device_type: 'android', os_version: '14.0', app_version: '2.1.0', last_open_time: '2024-01-14 15:20:00', push_status: 1, is_logged_in: 1, is_online: 0 },
  { device_id: 'DEV003', username: '王五', token: 'token_003', device_type: 'web', os_version: 'Chrome 120', app_version: '2.0.0', last_open_time: '2024-01-10 09:00:00', push_status: 0, is_logged_in: 0, is_online: 0 },
  { device_id: 'DEV004', username: '赵六', token: 'token_004', device_type: 'android', os_version: '13.0', app_version: '2.1.0', last_open_time: '2024-01-15 08:45:00', push_status: 1, is_logged_in: 1, is_online: 1 },
  { device_id: 'DEV005', username: '钱七', token: 'token_005', device_type: 'ios', os_version: '16.5', app_version: '2.0.5', last_open_time: '2024-01-12 14:30:00', push_status: 1, is_logged_in: 1, is_online: 0 },
];

const insertDevice = db.prepare(`
  INSERT OR IGNORE INTO devices (device_id, username, token, device_type, os_version, app_version, last_open_time, push_status, is_logged_in, is_online)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

devices.forEach(d => {
  insertDevice.run(d.device_id, d.username, d.token, d.device_type, d.os_version, d.app_version, d.last_open_time, d.push_status, d.is_logged_in, d.is_online);
});

const tags = [
  { tag_id: 'TAG001', name: 'VIP用户', creator: 'admin' },
  { tag_id: 'TAG002', name: '新注册用户', creator: 'admin' },
  { tag_id: 'TAG003', name: '活跃用户', creator: 'admin' },
  { tag_id: 'TAG004', name: '沉睡用户', creator: 'admin' },
  { tag_id: 'TAG005', name: 'iOS用户', creator: 'admin' },
];

const insertTag = db.prepare(`
  INSERT OR IGNORE INTO tags (tag_id, name, creator)
  VALUES (?, ?, ?)
`);

tags.forEach(t => {
  insertTag.run(t.tag_id, t.name, t.creator);
});

console.log('数据库初始化完成！');
db.close();
