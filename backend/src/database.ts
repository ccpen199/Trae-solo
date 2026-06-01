import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      model TEXT NOT NULL,
      protocol TEXT NOT NULL DEFAULT 'matter',
      status TEXT NOT NULL DEFAULT 'offline',
      online BOOLEAN NOT NULL DEFAULT 0,
      state TEXT,
      firmware_version TEXT,
      last_seen INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS device_permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      access_level TEXT NOT NULL DEFAULT 'viewer',
      shared_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      expires_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
      UNIQUE(user_id, device_id)
    );

    CREATE TABLE IF NOT EXISTS scenes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      enabled BOOLEAN NOT NULL DEFAULT 1,
      trigger_type TEXT NOT NULL,
      trigger_config TEXT,
      actions TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS scene_logs (
      id TEXT PRIMARY KEY,
      scene_id TEXT NOT NULL,
      triggered_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      success BOOLEAN NOT NULL,
      error TEXT,
      FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS device_logs (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      user_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      device_id TEXT,
      type TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'warning',
      message TEXT NOT NULL,
      resolved BOOLEAN NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      resolved_at INTEGER,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS temporary_access (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      device_id TEXT NOT NULL,
      created_by TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  const demoUsers = [
    { username: 'admin', password: 'admin123', role: 'admin' },
    { username: 'platform', password: 'platform123', role: 'admin' },
    { username: 'ops', password: 'ops123', role: 'admin' },
    { username: 'user1', password: 'user123', role: 'user' },
    { username: 'guest', password: 'guest123', role: 'user' }
  ];

  for (const demoUser of demoUsers) {
    const userExists = db.prepare('SELECT id FROM users WHERE username = ?').get(demoUser.username);
    if (!userExists) {
      const passwordHash = bcrypt.hashSync(demoUser.password, 10);
      db.prepare('INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)').run(
        uuidv4(),
        demoUser.username,
        passwordHash,
        demoUser.role
      );
    }
  }
}

export default db;
