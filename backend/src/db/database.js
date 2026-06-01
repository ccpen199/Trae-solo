const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS berths (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      length REAL NOT NULL,
      draft_limit REAL NOT NULL,
      dangerous_goods_allowed INTEGER DEFAULT 0,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS ships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      voyage TEXT NOT NULL,
      eta DATETIME,
      etd DATETIME,
      draft REAL,
      cargo_type TEXT,
      agent TEXT,
      load_volume REAL,
      unload_volume REAL,
      priority INTEGER DEFAULT 5,
      length REAL,
      is_dangerous INTEGER DEFAULT 0,
      data_complete INTEGER DEFAULT 0,
      status TEXT DEFAULT 'planned',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ship_id INTEGER NOT NULL,
      berth_id INTEGER,
      start_time DATETIME,
      end_time DATETIME,
      status TEXT DEFAULT 'pending',
      conflict_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ship_id) REFERENCES ships(id),
      FOREIGN KEY (berth_id) REFERENCES berths(id)
    );

    CREATE TABLE IF NOT EXISTS tides (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      time TEXT NOT NULL,
      height REAL NOT NULL,
      type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      capacity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      resource_id INTEGER NOT NULL,
      start_time DATETIME,
      end_time DATETIME,
      status TEXT DEFAULT 'assigned',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id),
      FOREIGN KEY (resource_id) REFERENCES resources(id)
    );

    CREATE TABLE IF NOT EXISTS adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL,
      adjustment_type TEXT NOT NULL,
      reason TEXT,
      old_value TEXT,
      new_value TEXT,
      notified_roles TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT DEFAULT 'system',
      FOREIGN KEY (schedule_id) REFERENCES schedules(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL,
      message TEXT NOT NULL,
      related_type TEXT,
      related_id INTEGER,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const berthCount = db.prepare('SELECT COUNT(*) as count FROM berths').get().count;
  if (berthCount === 0) {
    const insertBerth = db.prepare(`
      INSERT INTO berths (name, length, draft_limit, dangerous_goods_allowed, status)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertBerth.run('1号泊位', 300, 15, 0, 'available');
    insertBerth.run('2号泊位', 350, 16, 1, 'available');
    insertBerth.run('3号泊位', 280, 14, 0, 'available');
    insertBerth.run('4号泊位', 400, 18, 1, 'available');
  }

  const resourceCount = db.prepare('SELECT COUNT(*) as count FROM resources').get().count;
  if (resourceCount === 0) {
    const insertResource = db.prepare(`
      INSERT INTO resources (type, name, status, capacity)
      VALUES (?, ?, ?, ?)
    `);
    insertResource.run('crane', '桥吊1号', 'available', 1);
    insertResource.run('crane', '桥吊2号', 'available', 1);
    insertResource.run('crane', '桥吊3号', 'available', 1);
    insertResource.run('gang', '白班A组', 'available', 12);
    insertResource.run('gang', '白班B组', 'available', 12);
    insertResource.run('gang', '夜班A组', 'available', 12);
    insertResource.run('yard', 'A区堆场', 'available', 1000);
    insertResource.run('yard', 'B区堆场', 'available', 1000);
    insertResource.run('truck', '拖车1队', 'available', 10);
    insertResource.run('truck', '拖车2队', 'available', 10);
  }

  const tideCount = db.prepare('SELECT COUNT(*) as count FROM tides').get().count;
  if (tideCount === 0) {
    const insertTide = db.prepare(`
      INSERT INTO tides (date, time, height, type)
      VALUES (?, ?, ?, ?)
    `);
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      insertTide.run(dateStr, '02:30', 16.5, 'high');
      insertTide.run(dateStr, '08:45', 8.2, 'low');
      insertTide.run(dateStr, '14:20', 17.1, 'high');
      insertTide.run(dateStr, '20:55', 7.8, 'low');
    }
  }
}

module.exports = { db, initDatabase };
