
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../data/app.sqlite');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS shippers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      company_name TEXT,
      contact_person TEXT,
      phone TEXT,
      address TEXT,
      role TEXT DEFAULT 'shipper',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT,
      phone TEXT,
      id_card TEXT,
      license_plate TEXT,
      vehicle_type TEXT,
      verified INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      rating_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipper_id INTEGER NOT NULL,
      source_location TEXT NOT NULL,
      destination_location TEXT NOT NULL,
      cargo_description TEXT,
      cargo_weight REAL,
      vehicle_type TEXT NOT NULL,
      service_type TEXT NOT NULL,
      base_price REAL,
      negotiated_price REAL,
      status TEXT DEFAULT 'published',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipper_id) REFERENCES shippers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      driver_id INTEGER,
      pickup_time DATETIME,
      delivery_time DATETIME,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS insurance_claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipment_id INTEGER NOT NULL,
      amount REAL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipment_id INTEGER NOT NULL,
      file_path TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (shipment_id) REFERENCES shipments(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`, ['admin', adminPassword]);

  const shipperPassword = bcrypt.hashSync('shipper123', 10);
  db.run(
    `INSERT OR IGNORE INTO shippers (username, password, company_name, contact_person, phone, address)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['shipper_demo', shipperPassword, '华北制造有限公司', '陈经理', '13800138000', '北京市通州区物流园']
  );

  const driverPassword = bcrypt.hashSync('driver123', 10);
  db.run(
    `INSERT OR IGNORE INTO drivers (username, password, real_name, phone, id_card, license_plate, vehicle_type, verified, rating)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['driver_demo', driverPassword, '李师傅', '13900139000', '110101198801010011', '京A12345', '中型货车', 1, 4.8]
  );

  db.get(`SELECT id FROM shippers WHERE username = ?`, ['shipper_demo'], (err, shipper) => {
    if (err || !shipper) return;

    db.get(`SELECT COUNT(*) as count FROM orders`, [], (countErr, row) => {
      if (countErr || row.count > 0) return;

      db.run(
        `INSERT INTO orders (
          shipper_id,
          source_location,
          destination_location,
          cargo_description,
          cargo_weight,
          vehicle_type,
          service_type,
          base_price,
          status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [shipper.id, '北京通州', '天津滨海新区', '电子元件整车运输', 12.5, '中型货车', '普快', 3200, 'published']
      );
    });
  });
});

module.exports = db;
