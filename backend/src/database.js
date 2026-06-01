const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS hotels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      city TEXT,
      star_rating INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS room_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      bed_type TEXT,
      max_guests INTEGER,
      area INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hotel_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hotel_id INTEGER,
      channel_id INTEGER NOT NULL,
      channel_hotel_id TEXT NOT NULL,
      channel_hotel_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      confidence REAL DEFAULT 0,
      confirmed_by TEXT,
      confirmed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE SET NULL,
      FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
      UNIQUE(channel_id, channel_hotel_id)
    );

    CREATE TABLE IF NOT EXISTS room_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_type_id INTEGER,
      hotel_mapping_id INTEGER NOT NULL,
      channel_room_id TEXT NOT NULL,
      channel_room_name TEXT NOT NULL,
      breakfast TEXT,
      cancellation_policy TEXT,
      bed_type TEXT,
      status TEXT DEFAULT 'pending',
      confidence REAL DEFAULT 0,
      confirmed_by TEXT,
      confirmed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE SET NULL,
      FOREIGN KEY (hotel_mapping_id) REFERENCES hotel_mappings(id) ON DELETE CASCADE,
      UNIQUE(hotel_mapping_id, channel_room_id)
    );

    CREATE TABLE IF NOT EXISTS price_collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_mapping_id INTEGER NOT NULL,
      checkin_date DATE NOT NULL,
      checkout_date DATE NOT NULL,
      price REAL NOT NULL,
      tax REAL DEFAULT 0,
      total_price REAL NOT NULL,
      currency TEXT DEFAULT 'CNY',
      inventory INTEGER DEFAULT 0,
      promotion TEXT,
      promotion_discount REAL,
      collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      collection_status TEXT DEFAULT 'success',
      retry_count INTEGER DEFAULT 0,
      error_message TEXT,
      FOREIGN KEY (room_mapping_id) REFERENCES room_mappings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comparison_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_type_id INTEGER NOT NULL,
      checkin_date DATE NOT NULL,
      our_price REAL NOT NULL,
      our_total_price REAL NOT NULL,
      lowest_price REAL NOT NULL,
      lowest_channel TEXT NOT NULL,
      price_difference REAL NOT NULL,
      price_difference_percent REAL NOT NULL,
      is_price_inverted INTEGER DEFAULT 0,
      is_inventory_anomaly INTEGER DEFAULT 0,
      our_inventory INTEGER,
      lowest_inventory INTEGER,
      compared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS price_strategies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_type_id INTEGER NOT NULL,
      target_price_difference REAL DEFAULT 0,
      target_difference_percent REAL,
      promotion_suggestion TEXT,
      alert_threshold REAL DEFAULT 10,
      alert_threshold_percent REAL DEFAULT 5,
      status TEXT DEFAULT 'pending',
      confirmed_by TEXT,
      confirmed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS price_adjustment_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      strategy_id INTEGER NOT NULL,
      room_type_id INTEGER NOT NULL,
      suggested_price REAL NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'pending',
      executed_at DATETIME,
      executed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (strategy_id) REFERENCES price_strategies(id) ON DELETE CASCADE,
      FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_price_collections_date ON price_collections(checkin_date, collected_at);
    CREATE INDEX IF NOT EXISTS idx_comparison_results_date ON comparison_results(checkin_date, compared_at);
  `);

  const channelCount = db.prepare('SELECT COUNT(*) as count FROM channels').get().count;
  if (channelCount === 0) {
    const channels = [
      { code: 'CTRIP', name: '携程' },
      { code: 'MEITUAN', name: '美团' },
      { code: 'FLIGGY', name: '飞猪' },
      { code: 'QUNAR', name: '去哪儿' },
      { code: 'OWN', name: '自有平台' }
    ];
    
    const stmt = db.prepare('INSERT INTO channels (code, name) VALUES (?, ?)');
    channels.forEach(c => stmt.run(c.code, c.name));
  }
}

initDatabase();

module.exports = db;
