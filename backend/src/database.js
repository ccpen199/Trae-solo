import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/appointment.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

function migrateDatabase() {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(t => t.name);

  const needsMigration = tables.includes('users') || tables.includes('store_services') || tables.includes('staff_services') || tables.includes('evaluations') || tables.includes('audit_logs');

  if (needsMigration) {
    db.exec(`
      DROP TABLE IF EXISTS audit_logs;
      DROP TABLE IF EXISTS evaluations;
      DROP TABLE IF EXISTS service_records;
      DROP TABLE IF EXISTS reminders;
      DROP TABLE IF EXISTS reviews;
      DROP TABLE IF EXISTS schedules;
      DROP TABLE IF EXISTS appointments;
      DROP TABLE IF EXISTS staff_services;
      DROP TABLE IF EXISTS service_staff;
      DROP TABLE IF EXISTS store_services;
      DROP TABLE IF EXISTS service_stores;
      DROP TABLE IF EXISTS customers;
      DROP TABLE IF EXISTS services;
      DROP TABLE IF EXISTS staff;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS stores;
    `);
  }
}

function initDatabase() {
  migrateDatabase();

  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      phone TEXT,
      capacity INTEGER DEFAULT 10,
      opening_time TEXT DEFAULT '09:00',
      closing_time TEXT DEFAULT '21:00',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('consultant', 'technician', 'manager')),
      store_id INTEGER REFERENCES stores(id),
      phone TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      duration INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      description TEXT,
      preparation TEXT,
      cancellation_rule TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_stores (
      service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
      store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
      PRIMARY KEY (service_id, store_id)
    );

    CREATE TABLE IF NOT EXISTS service_staff (
      service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
      staff_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
      PRIMARY KEY (service_id, staff_id)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER REFERENCES customers(id),
      service_id INTEGER REFERENCES services(id),
      store_id INTEGER REFERENCES stores(id),
      staff_id INTEGER REFERENCES staff(id),
      appointment_date DATE NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'checked_in', 'in_service', 'completed', 'rescheduled', 'cancelled', 'no_show', 'late')),
      notes TEXT,
      total_price DECIMAL(10,2),
      arrived_at DATETIME,
      completed_at DATETIME,
      cancelled_at DATETIME,
      cancel_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER REFERENCES appointments(id),
      content TEXT,
      materials TEXT,
      photos TEXT,
      additional_services TEXT,
      additional_price DECIMAL(10,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER REFERENCES appointments(id),
      rating INTEGER CHECK(rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER REFERENCES staff(id),
      date DATE NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      type TEXT DEFAULT 'work' CHECK(type IN ('work', 'break', 'leave')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(staff_id, date, start_time)
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id INTEGER REFERENCES appointments(id),
      type TEXT NOT NULL,
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const storeCount = db.prepare('SELECT COUNT(*) as count FROM stores').get().count;
  if (storeCount === 0) {
    const insertStore = db.prepare('INSERT INTO stores (name, address, phone, capacity, opening_time, closing_time) VALUES (?, ?, ?, ?, ?, ?)');
    insertStore.run('旗舰店', '北京市朝阳区建国路88号', '010-88888888', 15, '09:00', '21:00');
    insertStore.run('中关村店', '北京市海淀区中关村大街1号', '010-66666666', 10, '09:00', '21:00');

    const insertStaff = db.prepare('INSERT INTO staff (name, role, store_id, phone) VALUES (?, ?, ?, ?)');
    insertStaff.run('张顾问', 'consultant', 1, '13800000001');
    insertStaff.run('李技师', 'technician', 1, '13800000002');
    insertStaff.run('王店长', 'manager', 1, '13800000003');
    insertStaff.run('赵技师', 'technician', 2, '13800000004');
    insertStaff.run('孙技师', 'technician', 1, '13800000005');

    const insertService = db.prepare('INSERT INTO services (name, duration, price, description, preparation, cancellation_rule) VALUES (?, ?, ?, ?, ?, ?)');
    insertService.run('基础护理', 60, 198.00, '基础皮肤护理服务', '请提前清洁面部', '提前24小时可免费取消，24小时内取消收取50%费用');
    insertService.run('深层清洁', 90, 298.00, '深层毛孔清洁护理', '请提前1天预约，避免化妆', '提前48小时可免费取消');
    insertService.run('SPA按摩', 120, 598.00, '全身放松SPA按摩', '请提前淋浴，穿着舒适衣物', '提前24小时可免费取消');

    const insertServiceStore = db.prepare('INSERT INTO service_stores (service_id, store_id) VALUES (?, ?)');
    insertServiceStore.run(1, 1);
    insertServiceStore.run(1, 2);
    insertServiceStore.run(2, 1);
    insertServiceStore.run(3, 1);
    insertServiceStore.run(3, 2);

    const insertServiceStaff = db.prepare('INSERT INTO service_staff (service_id, staff_id) VALUES (?, ?)');
    insertServiceStaff.run(1, 2);
    insertServiceStaff.run(1, 4);
    insertServiceStaff.run(1, 5);
    insertServiceStaff.run(2, 2);
    insertServiceStaff.run(2, 5);
    insertServiceStaff.run(3, 2);
    insertServiceStaff.run(3, 4);
    insertServiceStaff.run(3, 5);

    const insertCustomer = db.prepare('INSERT INTO customers (name, phone) VALUES (?, ?)');
    insertCustomer.run('测试顾客', '13900000001');
    insertCustomer.run('张三', '13900000002');
    insertCustomer.run('李四', '13900000003');

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const insertAppt = db.prepare(`
      INSERT INTO appointments (customer_id, service_id, store_id, staff_id, appointment_date, start_time, end_time, status, total_price, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAppt.run(1, 1, 1, 2, today, '10:00', '11:00', 'confirmed', 198.00, '首次到店');
    insertAppt.run(2, 2, 1, 2, today, '11:00', '12:30', 'checked_in', 298.00, '');
    insertAppt.run(3, 3, 1, 5, today, '14:00', '16:00', 'in_service', 598.00, '需要特别关注肩颈');
    insertAppt.run(1, 1, 2, 4, tomorrow, '10:00', '11:00', 'confirmed', 198.00, '');
    insertAppt.run(2, 3, 1, 2, tomorrow, '14:00', '16:00', 'pending', 598.00, '');

    db.prepare('INSERT INTO reminders (appointment_id, type) VALUES (?, ?)').run(1, 'booking');
    db.prepare('INSERT INTO reminders (appointment_id, type) VALUES (?, ?)').run(4, 'booking');
  }
}

initDatabase();

export default db;
