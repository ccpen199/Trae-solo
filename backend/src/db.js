const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    DROP TABLE IF EXISTS analytics;
    DROP TABLE IF EXISTS scenes;
    DROP TABLE IF EXISTS device_templates;
    DROP TABLE IF EXISTS virtual_devices;
    DROP TABLE IF EXISTS devices;
    DROP TABLE IF EXISTS user_state;

    CREATE TABLE user_state (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL DEFAULT 'default',
      guide_shown BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id)
    );

    CREATE TABLE devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      is_virtual BOOLEAN NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'offline',
      config TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE virtual_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL UNIQUE,
      template_id TEXT NOT NULL,
      animation_data TEXT,
      last_run_result TEXT,
      is_playing BOOLEAN NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
    );

    CREATE TABLE device_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL,
      animation_duration INTEGER NOT NULL DEFAULT 3,
      default_config TEXT,
      is_enabled BOOLEAN NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE scenes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scene_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      is_recommended BOOLEAN NOT NULL DEFAULT 0,
      devices TEXT,
      config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      device_id TEXT,
      scene_id TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const templates = db.prepare('SELECT COUNT(*) as count FROM device_templates').get();
  if (templates.count === 0) {
    const insertTemplate = db.prepare(`
      INSERT INTO device_templates (template_id, name, type, icon, animation_duration, default_config, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertTemplate.run(
      'virtual-lock',
      '智能门锁',
      'lock',
      '🔒',
      3,
      JSON.stringify({ lockStatus: 'locked', battery: 85, autoLock: true }),
      1
    );

    insertTemplate.run(
      'virtual-purifier',
      '空气净化器 3',
      'purifier',
      '🌬️',
      3,
      JSON.stringify({ pm25: 35, mode: 'auto', fanSpeed: 2, filterLife: 85 }),
      2
    );

    insertTemplate.run(
      'virtual-vacuum',
      '扫地机器人 1S',
      'vacuum',
      '🤖',
      3,
      JSON.stringify({ battery: 75, mode: 'auto', cleaningArea: 0, waterLevel: 2 }),
      3
    );
  }

  const userState = db.prepare('SELECT COUNT(*) as count FROM user_state WHERE user_id = ?').get('default');
  if (userState.count === 0) {
    db.prepare('INSERT INTO user_state (user_id, guide_shown) VALUES (?, ?)').run('default', 0);
  }

  const scenes = db.prepare('SELECT COUNT(*) as count FROM scenes').get();
  if (scenes.count === 0) {
    const insertScene = db.prepare(`
      INSERT INTO scenes (scene_id, name, is_recommended, devices, config)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertScene.run(
      'scene-home',
      '回家模式',
      1,
      JSON.stringify([]),
      JSON.stringify({ description: '开门自动开灯、开净化器' })
    );

    insertScene.run(
      'scene-leave',
      '离家模式',
      1,
      JSON.stringify([]),
      JSON.stringify({ description: '锁门自动关灯、启动扫地机器人' })
    );

    insertScene.run(
      'scene-sleep',
      '睡眠模式',
      1,
      JSON.stringify([]),
      JSON.stringify({ description: '关闭所有设备，开启净化器睡眠模式' })
    );
  }
}

initDatabase();

module.exports = db;
