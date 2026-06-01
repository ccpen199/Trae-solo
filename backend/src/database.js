const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '../data/app.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      address TEXT,
      billing_method TEXT DEFAULT 'daily',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS temperature_zones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      min_temp REAL NOT NULL,
      max_temp REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      customer_id INTEGER NOT NULL,
      temperature_zone_id INTEGER NOT NULL,
      shelf_life_days INTEGER,
      batch_required INTEGER DEFAULT 1,
      package_type TEXT,
      inspection_required INTEGER DEFAULT 0,
      storage_fee REAL DEFAULT 0,
      handling_fee REAL DEFAULT 0,
      unit TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (temperature_zone_id) REFERENCES temperature_zones(id)
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      temperature_zone_id INTEGER NOT NULL,
      type TEXT DEFAULT 'storage',
      capacity REAL,
      status TEXT DEFAULT 'empty',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (temperature_zone_id) REFERENCES temperature_zones(id)
    );

    CREATE TABLE IF NOT EXISTS inbound_appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_no TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      expected_quantity REAL NOT NULL,
      expected_arrival DATETIME,
      batch_no TEXT,
      production_date DATE,
      expiry_date DATE,
      vehicle_no TEXT,
      driver TEXT,
      status TEXT DEFAULT 'pending',
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS inbound_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_no TEXT UNIQUE NOT NULL,
      appointment_id INTEGER,
      customer_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      location_id INTEGER,
      batch_no TEXT,
      production_date DATE,
      expiry_date DATE,
      quantity REAL NOT NULL,
      weight REAL,
      vehicle_no TEXT,
      arrival_time DATETIME,
      inspection_status TEXT DEFAULT 'pending',
      inspection_result TEXT,
      status TEXT DEFAULT 'receiving',
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      FOREIGN KEY (appointment_id) REFERENCES inbound_appointments(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      location_id INTEGER NOT NULL,
      batch_no TEXT NOT NULL,
      production_date DATE,
      expiry_date DATE,
      quantity REAL NOT NULL,
      available_quantity REAL NOT NULL,
      inbound_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'normal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS temperature_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temperature_zone_id INTEGER NOT NULL,
      location_id INTEGER,
      temperature REAL NOT NULL,
      record_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_alert INTEGER DEFAULT 0,
      alert_type TEXT,
      FOREIGN KEY (temperature_zone_id) REFERENCES temperature_zones(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS temperature_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      temperature_zone_id INTEGER NOT NULL,
      location_id INTEGER,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      max_temp REAL,
      min_temp REAL,
      avg_temp REAL,
      affected_inventory TEXT,
      handling_measures TEXT,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (temperature_zone_id) REFERENCES temperature_zones(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS exception_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exception_no TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      related_type TEXT,
      related_id INTEGER,
      description TEXT,
      quantity REAL,
      status TEXT DEFAULT 'pending',
      handled_by INTEGER,
      handled_at DATETIME,
      handling_result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS outbound_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      requested_quantity REAL NOT NULL,
      actual_quantity REAL,
      batch_strategy TEXT DEFAULT 'fifo',
      status TEXT DEFAULT 'pending',
      outbound_time DATETIME,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS outbound_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      outbound_order_id INTEGER NOT NULL,
      inventory_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      batch_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (outbound_order_id) REFERENCES outbound_orders(id),
      FOREIGN KEY (inventory_id) REFERENCES inventory(id)
    );

    CREATE TABLE IF NOT EXISTS billing_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_no TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      storage_fee REAL DEFAULT 0,
      handling_fee REAL DEFAULT 0,
      other_fee REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'unpaid',
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS billing_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      billing_record_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      quantity REAL,
      unit_price REAL,
      amount REAL,
      related_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (billing_record_id) REFERENCES billing_records(id)
    );

    CREATE INDEX IF NOT EXISTS idx_inventory_batch ON inventory(batch_no);
    CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location_id);
    CREATE INDEX IF NOT EXISTS idx_temp_record_time ON temperature_records(record_time);
    CREATE INDEX IF NOT EXISTS idx_temp_record_zone ON temperature_records(temperature_zone_id);
  `)

  const zoneCount = db.prepare('SELECT COUNT(*) as count FROM temperature_zones').get().count
  if (zoneCount === 0) {
    const zones = [
      { code: 'FROZEN', name: '冷冻区', min_temp: -25, max_temp: -18, description: '深冷冻藏' },
      { code: 'CHILLED', name: '冷藏区', min_temp: 0, max_temp: 8, description: '低温冷藏' },
      { code: 'CONSTANT', name: '恒温区', min_temp: 15, max_temp: 25, description: '常温恒温' }
    ]
    const stmt = db.prepare('INSERT INTO temperature_zones (code, name, min_temp, max_temp, description) VALUES (?, ?, ?, ?, ?)')
    zones.forEach(z => stmt.run(z.code, z.name, z.min_temp, z.max_temp, z.description))

    const locations = []
    for (let z = 1; z <= 3; z++) {
      for (let i = 1; i <= 10; i++) {
        const zoneCode = z === 1 ? 'F' : z === 2 ? 'C' : 'T'
        locations.push({ code: `${zoneCode}-${String(i).padStart(3, '0')}`, name: `${zoneCode}区${i}号位`, zoneId: z })
      }
    }
    const locStmt = db.prepare('INSERT INTO locations (code, name, temperature_zone_id, status) VALUES (?, ?, ?, ?)')
    locations.forEach(l => locStmt.run(l.code, l.name, l.zoneId, 'empty'))
  }
}

module.exports = { db, initDatabase }
