const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plate_number TEXT UNIQUE NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER,
      color TEXT,
      mileage INTEGER DEFAULT 0,
      store_id INTEGER,
      status TEXT DEFAULT 'available',
      insurance_expire_date DATE,
      inspection_expire_date DATE,
      maintenance_cycle_km INTEGER DEFAULT 5000,
      last_maintenance_date DATE,
      last_maintenance_km INTEGER DEFAULT 0,
      daily_rate REAL DEFAULT 200,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      id_card TEXT,
      license_number TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      vehicle_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      pickup_store_id INTEGER NOT NULL,
      return_store_id INTEGER NOT NULL,
      pickup_date DATETIME NOT NULL,
      return_date DATETIME NOT NULL,
      actual_pickup_date DATETIME,
      actual_return_date DATETIME,
      deposit REAL DEFAULT 0,
      daily_rate REAL NOT NULL,
      discount REAL DEFAULT 0,
      additional_services TEXT,
      additional_fee REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'confirmed',
      damage_fee REAL DEFAULT 0,
      violation_fee REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (pickup_store_id) REFERENCES stores(id),
      FOREIGN KEY (return_store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS pickup_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      fuel_level INTEGER NOT NULL,
      mileage INTEGER NOT NULL,
      damages TEXT,
      photos TEXT,
      customer_signature TEXT,
      operator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS return_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      fuel_level INTEGER NOT NULL,
      mileage INTEGER NOT NULL,
      new_damages TEXT,
      photos TEXT,
      damage_fee REAL DEFAULT 0,
      customer_signature TEXT,
      operator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS maintenances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      mileage INTEGER,
      cost REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      scheduled_date DATE,
      started_date DATETIME,
      completed_date DATETIME,
      inspector_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS violations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      vehicle_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      occur_date DATE,
      fine_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      vehicle_id INTEGER NOT NULL,
      check_duplicate_dispatch BOOLEAN DEFAULT 0,
      check_cross_city_return BOOLEAN DEFAULT 0,
      check_violations BOOLEAN DEFAULT 0,
      check_damage_fee BOOLEAN DEFAULT 0,
      check_maintenance_overdue BOOLEAN DEFAULT 0,
      vehicle_status_match BOOLEAN DEFAULT 0,
      notes TEXT,
      inspector_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS financial_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      payment_method TEXT,
      transaction_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get().count;
  if (storeCount === 0) {
    const insertStore = db.prepare('INSERT INTO stores (name, address, phone) VALUES (?, ?, ?)');
    insertStore.run('总部旗舰店', '北京市朝阳区建国路88号', '400-888-0001');
    insertStore.run('海淀分店', '北京市海淀区中关村大街1号', '400-888-0002');
    insertStore.run('浦东分店', '上海市浦东新区陆家嘴环路1000号', '400-888-0003');
  }

  const vehicleCount = db.prepare('SELECT COUNT(*) as count FROM vehicles').get().count;
  if (vehicleCount === 0) {
    const insertVehicle = db.prepare(`
      INSERT INTO vehicles (plate_number, brand, model, year, color, mileage, store_id, status, 
                            insurance_expire_date, inspection_expire_date, daily_rate)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const vehicles = [
      ['京A12345', '丰田', '凯美瑞', 2022, '黑色', 15000, 1, 'available', '2025-12-31', '2025-06-30', 280],
      ['京B67890', '大众', '帕萨特', 2023, '白色', 8000, 1, 'available', '2026-03-15', '2025-09-20', 260],
      ['京C11111', '本田', '雅阁', 2022, '银色', 22000, 2, 'available', '2025-10-01', '2025-08-15', 270],
      ['沪A22222', '奔驰', 'E级', 2023, '黑色', 5000, 3, 'available', '2026-05-20', '2026-01-10', 580],
      ['沪B33333', '宝马', '3系', 2022, '蓝色', 18000, 3, 'maintenance', '2025-11-30', '2025-07-25', 450],
    ];
    vehicles.forEach(v => insertVehicle.run(...v));
  }

  const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
  if (customerCount === 0) {
    const insertCustomer = db.prepare(
      'INSERT INTO customers (name, phone, id_card, license_number) VALUES (?, ?, ?, ?)'
    );
    insertCustomer.run('张三', '13800138001', '110101199001011234', '110101199001011234');
    insertCustomer.run('李四', '13800138002', '110101199002022345', '110101199002022345');
    insertCustomer.run('王五', '13800138003', '310101198803033456', '310101198803033456');
  }
}

initDatabase();

module.exports = db;
