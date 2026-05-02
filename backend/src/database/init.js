require('dotenv').config();
const db = require('./config');

const initDatabase = () => {
  db.exec(`
    -- 用户表
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('consignor', 'forwarder', 'shipping_company', 'port', 'customs_broker')),
      email TEXT,
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 船期表
    CREATE TABLE IF NOT EXISTS shipping_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_code TEXT NOT NULL UNIQUE,
      vessel_name TEXT NOT NULL,
      voyage_number TEXT NOT NULL,
      departure_port TEXT NOT NULL,
      arrival_port TEXT NOT NULL,
      departure_date TEXT NOT NULL,
      arrival_date TEXT NOT NULL,
      shipping_company TEXT,
      status TEXT DEFAULT 'available',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- 订舱单主表
    CREATE TABLE IF NOT EXISTS booking_mains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_order_no TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'pending_booking',
      consignor_id INTEGER,
      forwarder_id INTEGER,
      shipping_company_id INTEGER,
      schedule_id INTEGER,
      cargo_name TEXT NOT NULL,
      cargo_weight REAL,
      cargo_volume REAL,
      container_count INTEGER DEFAULT 0,
      container_type TEXT,
      departure_port TEXT,
      arrival_port TEXT,
      expected_departure_date TEXT,
      expected_arrival_date TEXT,
      deadline TEXT,
      responsible_person TEXT,
      attachments TEXT,
      remark TEXT,
      is_deleted INTEGER DEFAULT 0,
      created_by INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consignor_id) REFERENCES users(id),
      FOREIGN KEY (forwarder_id) REFERENCES users(id),
      FOREIGN KEY (shipping_company_id) REFERENCES users(id),
      FOREIGN KEY (schedule_id) REFERENCES shipping_schedules(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    -- 订舱单明细表
    CREATE TABLE IF NOT EXISTS booking_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_id INTEGER NOT NULL,
      detail_no TEXT NOT NULL,
      container_no TEXT,
      container_type TEXT,
      seal_no TEXT,
      weight REAL,
      volume REAL,
      cargo_description TEXT,
      status TEXT DEFAULT 'pending',
      is_checked INTEGER DEFAULT 0,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_id) REFERENCES booking_mains(id)
    );

    -- 费用表
    CREATE TABLE IF NOT EXISTS fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_id INTEGER NOT NULL,
      detail_id INTEGER,
      fee_type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      payer TEXT,
      payee TEXT,
      payment_status TEXT DEFAULT 'pending',
      due_date TEXT,
      paid_date TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_id) REFERENCES booking_mains(id),
      FOREIGN KEY (detail_id) REFERENCES booking_details(id)
    );

    -- 提单表
    CREATE TABLE IF NOT EXISTS bills_of_lading (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_id INTEGER NOT NULL,
      bill_no TEXT NOT NULL UNIQUE,
      bill_type TEXT DEFAULT 'sea',
      consignor TEXT,
      consignee TEXT,
      notify_party TEXT,
      port_of_loading TEXT,
      port_of_discharge TEXT,
      vessel_name TEXT,
      voyage_number TEXT,
      container_count INTEGER,
      gross_weight REAL,
      measurement REAL,
      status TEXT DEFAULT 'pending',
      is_locked INTEGER DEFAULT 0,
      lock_by INTEGER,
      locked_at TEXT,
      release_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_id) REFERENCES booking_mains(id),
      FOREIGN KEY (lock_by) REFERENCES users(id)
    );

    -- 状态流转历史表
    CREATE TABLE IF NOT EXISTS status_transitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_id INTEGER NOT NULL,
      detail_id INTEGER,
      from_status TEXT NOT NULL,
      to_status TEXT NOT NULL,
      transition_type TEXT,
      operator_id INTEGER,
      operator_role TEXT,
      reason TEXT,
      comment TEXT,
      attachments TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_id) REFERENCES booking_mains(id),
      FOREIGN KEY (detail_id) REFERENCES booking_details(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    -- 待办消息表
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_id INTEGER NOT NULL,
      detail_id INTEGER,
      message_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      assigned_to INTEGER,
      assigned_role TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'normal',
      deadline TEXT,
      read_at TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_id) REFERENCES booking_mains(id),
      FOREIGN KEY (detail_id) REFERENCES booking_details(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    -- 审计日志表
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_id INTEGER,
      detail_id INTEGER,
      user_id INTEGER,
      user_role TEXT,
      action TEXT NOT NULL,
      table_name TEXT,
      record_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      user_agent TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_id) REFERENCES booking_mains(id),
      FOREIGN KEY (detail_id) REFERENCES booking_details(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- 异常队列表
    CREATE TABLE IF NOT EXISTS exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      main_id INTEGER,
      detail_id INTEGER,
      exception_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      original_data TEXT,
      compensation_data TEXT,
      status TEXT DEFAULT 'pending',
      priority TEXT DEFAULT 'high',
      assigned_to INTEGER,
      handled_at TEXT,
      handler_comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (main_id) REFERENCES booking_mains(id),
      FOREIGN KEY (detail_id) REFERENCES booking_details(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    );

    -- 港口状态表
    CREATE TABLE IF NOT EXISTS port_statuses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      detail_id INTEGER NOT NULL,
      status_code TEXT NOT NULL,
      status_name TEXT NOT NULL,
      port_name TEXT,
      location TEXT,
      recorded_at TEXT,
      operator TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (detail_id) REFERENCES booking_details(id)
    );

    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_booking_mains_status ON booking_mains(status);
    CREATE INDEX IF NOT EXISTS idx_booking_mains_main_order_no ON booking_mains(main_order_no);
    CREATE INDEX IF NOT EXISTS idx_booking_details_main_id ON booking_details(main_id);
    CREATE INDEX IF NOT EXISTS idx_status_transitions_main_id ON status_transitions(main_id);
    CREATE INDEX IF NOT EXISTS idx_messages_assigned_to ON messages(assigned_to);
    CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_main_id ON audit_logs(main_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_exceptions_main_id ON exceptions(main_id);
    CREATE INDEX IF NOT EXISTS idx_exceptions_status ON exceptions(status);
    CREATE INDEX IF NOT EXISTS idx_bills_of_lading_main_id ON bills_of_lading(main_id);
    CREATE INDEX IF NOT EXISTS idx_fees_main_id ON fees(main_id);
  `);

  const checkUser = db.prepare('SELECT COUNT(*) as count FROM users WHERE username = ?');
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, name, role, email, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const defaultUsers = [
    { username: 'consignor1', password: '123456', name: '货主小王', role: 'consignor', email: 'consignor1@example.com', phone: '13800138001' },
    { username: 'forwarder1', password: '123456', name: '货代小李', role: 'forwarder', email: 'forwarder1@example.com', phone: '13800138002' },
    { username: 'shipping1', password: '123456', name: '船公司小张', role: 'shipping_company', email: 'shipping1@example.com', phone: '13800138003' },
    { username: 'port1', password: '123456', name: '港口小刘', role: 'port', email: 'port1@example.com', phone: '13800138004' },
    { username: 'customs1', password: '123456', name: '报关行小陈', role: 'customs_broker', email: 'customs1@example.com', phone: '13800138005' },
  ];

  const checkSchedule = db.prepare('SELECT COUNT(*) as count FROM shipping_schedules WHERE schedule_code = ?');
  const insertSchedule = db.prepare(`
    INSERT INTO shipping_schedules (schedule_code, vessel_name, voyage_number, departure_port, arrival_port, departure_date, arrival_date, shipping_company, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const defaultSchedules = [
    { schedule_code: 'SCH20260501001', vessel_name: '东方明珠号', voyage_number: 'VM-2026-0501', departure_port: '上海港', arrival_port: '洛杉矶港', departure_date: '2026-05-10', arrival_date: '2026-05-25', shipping_company: '中远海运', status: 'available' },
    { schedule_code: 'SCH20260501002', vessel_name: '新时代号', voyage_number: 'VM-2026-0502', departure_port: '宁波港', arrival_port: '长滩港', departure_date: '2026-05-12', arrival_date: '2026-05-28', shipping_company: '中海集运', status: 'available' },
    { schedule_code: 'SCH20260501003', vessel_name: '丝路号', voyage_number: 'VM-2026-0503', departure_port: '深圳港', arrival_port: '奥克兰港', departure_date: '2026-05-15', arrival_date: '2026-06-01', shipping_company: '马士基', status: 'available' },
  ];

  const transaction = db.transaction(() => {
    for (const user of defaultUsers) {
      const result = checkUser.get(user.username);
      if (result.count === 0) {
        insertUser.run(user.username, user.password, user.name, user.role, user.email, user.phone);
      }
    }
    for (const schedule of defaultSchedules) {
      const result = checkSchedule.get(schedule.schedule_code);
      if (result.count === 0) {
        insertSchedule.run(schedule.schedule_code, schedule.vessel_name, schedule.voyage_number, schedule.departure_port, schedule.arrival_port, schedule.departure_date, schedule.arrival_date, schedule.shipping_company, schedule.status);
      }
    }
  });

  transaction();

  console.log('数据库初始化完成！');
  console.log('默认用户:');
  console.log('- 货主: consignor1 / 123456');
  console.log('- 货代: forwarder1 / 123456');
  console.log('- 船公司: shipping1 / 123456');
  console.log('- 港口: port1 / 123456');
  console.log('- 报关行: customs1 / 123456');
};

initDatabase();

db.close();
