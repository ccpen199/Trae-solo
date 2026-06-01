const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      license_number TEXT,
      qualifications TEXT,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_number TEXT NOT NULL,
      vehicle_type TEXT,
      capacity INTEGER,
      status TEXT DEFAULT 'available',
      driver_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (driver_id) REFERENCES drivers(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE,
      customer_id INTEGER,
      container_type TEXT,
      container_count INTEGER,
      pickup_location TEXT,
      loading_address TEXT,
      port TEXT,
      cut_off_time DATETIME,
      contact_person TEXT,
      contact_phone TEXT,
      special_requirements TEXT,
      status TEXT DEFAULT 'pending',
      driver_id INTEGER,
      vehicle_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS order_timelines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      action TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      location TEXT,
      photo_url TEXT,
      remarks TEXT,
      created_by INTEGER,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      fee_type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      customer_approved_by INTEGER,
      finance_approved_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      type TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'open',
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS dispatch_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      action TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
  if (customerCount === 0) {
    const insertCustomer = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)');
    insertCustomer.run('测试客户A', '13800138001');
    insertCustomer.run('测试客户B', '13800138002');
  }

  const driverCount = db.prepare('SELECT COUNT(*) as count FROM drivers').get().count;
  if (driverCount === 0) {
    const insertDriver = db.prepare('INSERT INTO drivers (name, phone, license_number, qualifications) VALUES (?, ?, ?, ?)');
    insertDriver.run('张三', '13900139001', 'A123456', '危化品运输证');
    insertDriver.run('李四', '13900139002', 'A123457', '普通货运证');
    insertDriver.run('王五', '13900139003', 'A123458', '普通货运证');
  }

  const vehicleCount = db.prepare('SELECT COUNT(*) as count FROM vehicles').get().count;
  if (vehicleCount === 0) {
    const insertVehicle = db.prepare('INSERT INTO vehicles (plate_number, vehicle_type, capacity, driver_id) VALUES (?, ?, ?, ?)');
    insertVehicle.run('粤B12345', '拖头', 40, 1);
    insertVehicle.run('粤B12346', '拖头', 40, 2);
    insertVehicle.run('粤B12347', '拖头', 20, 3);
  }
}

initDatabase();

module.exports = db;
