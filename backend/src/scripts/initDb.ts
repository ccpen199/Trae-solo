import db from '../config/database';
import bcrypt from 'bcryptjs';

function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('courier', 'admin', 'customer_service')),
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      tracking_number TEXT UNIQUE NOT NULL,
      sender_name TEXT,
      sender_phone TEXT,
      sender_address TEXT,
      receiver_name TEXT NOT NULL,
      receiver_phone TEXT NOT NULL,
      receiver_address TEXT NOT NULL,
      weight REAL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_station', 'sorted', 'notified', 'delivering', 'signed', 'exception')),
      area_id TEXT,
      courier_id TEXT,
      pickup_code TEXT,
      sign_code TEXT,
      sign_type TEXT CHECK(sign_type IN ('home', 'station')),
      sign_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (area_id) REFERENCES areas(id),
      FOREIGN KEY (courier_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS delivery_lists (
      id TEXT PRIMARY KEY,
      courier_id TEXT NOT NULL,
      area_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (courier_id) REFERENCES users(id),
      FOREIGN KEY (area_id) REFERENCES areas(id)
    );

    CREATE TABLE IF NOT EXISTS delivery_list_items (
      id TEXT PRIMARY KEY,
      delivery_list_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'delivering', 'signed', 'exception')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (delivery_list_id) REFERENCES delivery_lists(id),
      FOREIGN KEY (package_id) REFERENCES packages(id)
    );

    CREATE TABLE IF NOT EXISTS exceptions (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('damaged', 'rejected', 'unreachable', 'other')),
      reason TEXT NOT NULL,
      handler_id TEXT,
      handler_name TEXT,
      solution TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'resolved')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES packages(id),
      FOREIGN KEY (handler_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      receiver_phone TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('sms', 'wechat')),
      content TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES packages(id)
    );

    CREATE TABLE IF NOT EXISTS package_trails (
      id TEXT PRIMARY KEY,
      package_id TEXT NOT NULL,
      action TEXT NOT NULL,
      operator_id TEXT,
      operator_name TEXT,
      operator_role TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (package_id) REFERENCES packages(id)
    );

    CREATE TABLE IF NOT EXISTS performance_records (
      id TEXT PRIMARY KEY,
      courier_id TEXT NOT NULL,
      date TEXT NOT NULL,
      total_packages INTEGER DEFAULT 0,
      signed_packages INTEGER DEFAULT 0,
      exception_packages INTEGER DEFAULT 0,
      sign_rate REAL DEFAULT 0,
      exception_rate REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (courier_id) REFERENCES users(id),
      UNIQUE(courier_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_packages_tracking ON packages(tracking_number);
    CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
    CREATE INDEX IF NOT EXISTS idx_packages_courier ON packages(courier_id);
    CREATE INDEX IF NOT EXISTS idx_packages_area ON packages(area_id);
    CREATE INDEX IF NOT EXISTS idx_trails_package ON package_trails(package_id);
    CREATE INDEX IF NOT EXISTS idx_exceptions_package ON exceptions(package_id);
    CREATE INDEX IF NOT EXISTS idx_performance_courier_date ON performance_records(courier_id, date);
  `);

  const passwordHash = bcrypt.hashSync('123456', 10);

  const users = [
    { id: 'user_001', username: 'admin', password: passwordHash, name: '张站长', role: 'admin', phone: '13800138001' },
    { id: 'user_002', username: 'courier1', password: passwordHash, name: '李快递', role: 'courier', phone: '13800138002' },
    { id: 'user_003', username: 'courier2', password: passwordHash, name: '王快递', role: 'courier', phone: '13800138003' },
    { id: 'user_004', username: 'cs1', password: passwordHash, name: '刘客服', role: 'customer_service', phone: '13800138004' },
  ];

  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (id, username, password, name, role, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  users.forEach(user => {
    insertUser.run(user.id, user.username, user.password, user.name, user.role, user.phone);
  });

  const areas = [
    { id: 'area_001', name: '东区', code: 'A01', description: '包含东一至东五街道' },
    { id: 'area_002', name: '西区', code: 'A02', description: '包含西一至西四街道' },
    { id: 'area_003', name: '南区', code: 'A03', description: '包含南一至南三街道' },
    { id: 'area_004', name: '北区', code: 'A04', description: '包含北一至北六街道' },
  ];

  const insertArea = db.prepare(`
    INSERT OR IGNORE INTO areas (id, name, code, description)
    VALUES (?, ?, ?, ?)
  `);

  areas.forEach(area => {
    insertArea.run(area.id, area.name, area.code, area.description);
  });

  console.log('数据库初始化完成！');
  console.log('默认用户账号:');
  console.log('- 管理员: admin / 123456');
  console.log('- 快递员1: courier1 / 123456');
  console.log('- 快递员2: courier2 / 123456');
  console.log('- 客服: cs1 / 123456');
}

initDatabase();
