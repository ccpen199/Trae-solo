import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { mkdirSync } from 'fs';
import { dirname } from 'path';

let db = null;

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function initDb() {
  const dbPath = process.env.DB_PATH || './data/app.sqlite';
  const dir = dirname(dbPath);
  mkdirSync(dir, { recursive: true });

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  seedData();

  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      real_name TEXT,
      phone TEXT,
      id_card TEXT,
      role TEXT DEFAULT 'owner' CHECK(role IN ('owner','fleet_admin','operator','admin','platform')),
      vehicle_plate TEXT,
      fleet_name TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','disabled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS obu_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_sn TEXT UNIQUE NOT NULL,
      model TEXT NOT NULL,
      firmware_version TEXT,
      activation_status TEXT DEFAULT 'inactive' CHECK(activation_status IN ('inactive','active','faulty','deactivated')),
      user_id INTEGER,
      activated_at DATETIME,
      batch_no TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS etc_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_no TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      obu_id INTEGER,
      card_no TEXT,
      balance REAL DEFAULT 0,
      frozen_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'normal' CHECK(status IN ('normal','frozen','closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(obu_id) REFERENCES obu_devices(id)
    );

    CREATE TABLE IF NOT EXISTS toll_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      gantry_id TEXT,
      gantry_name TEXT,
      toll_station_id TEXT,
      toll_station_name TEXT,
      entry_time DATETIME,
      exit_time DATETIME,
      fee REAL DEFAULT 0,
      vehicle_plate TEXT,
      road_segment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(account_id) REFERENCES etc_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS exception_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('deduction_failed','path_missing','duplicate_billing')),
      toll_record_id INTEGER,
      account_id INTEGER,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','resolved')),
      resolved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(toll_record_id) REFERENCES toll_records(id),
      FOREIGN KEY(account_id) REFERENCES etc_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      exception_event_id INTEGER,
      description TEXT NOT NULL,
      evidence_urls TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','resolved','rejected')),
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(exception_event_id) REFERENCES exception_events(id)
    );

    CREATE TABLE IF NOT EXISTS blacklist_vehicles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vehicle_plate TEXT UNIQUE NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS blacklist_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      strategy_type TEXT NOT NULL,
      conditions TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_start DATETIME NOT NULL,
      period_end DATETIME NOT NULL,
      highway_group_amount REAL DEFAULT 0,
      bank_amount REAL DEFAULT 0,
      difference REAL DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','disputed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS data_quality_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric_date DATE NOT NULL,
      missing_rate REAL DEFAULT 0,
      latency_rate REAL DEFAULT 0,
      alert_count INTEGER DEFAULT 0,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS value_added_services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_name TEXT NOT NULL,
      service_type TEXT NOT NULL,
      api_endpoint TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive')),
      config TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
  if (userCount > 0) return;

  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, real_name, phone, id_card, role, vehicle_plate, fleet_name, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const passwordHash = bcrypt.hashSync('admin123', 10);
  insertUser.run('admin', passwordHash, '系统管理员', '13800000000', '110101199001011234', 'admin', null, null, 'active');
  insertUser.run('platform', bcrypt.hashSync('platform123', 10), '运营平台管理员', '13800000010', '110101199001011001', 'platform', null, null, 'active');
  insertUser.run('ops', bcrypt.hashSync('ops123', 10), '运维操作员', '13800000011', '110101199001011002', 'operator', null, null, 'active');
  insertUser.run('zhangsan', bcrypt.hashSync('123456', 10), '张三', '13800000001', '110101199002021234', 'owner', '京A12345', null, 'active');
  insertUser.run('lisi', bcrypt.hashSync('123456', 10), '李四', '13800000002', '110101199003031234', 'owner', '京B67890', null, 'active');
  insertUser.run('wangwu', bcrypt.hashSync('123456', 10), '王五', '13800000003', '110101199004041234', 'fleet_admin', null, '顺达车队', 'active');
  insertUser.run('zhaoliu', bcrypt.hashSync('123456', 10), '赵六', '13800000004', '110101199005051234', 'operator', null, null, 'active');

  const insertObu = db.prepare(`
    INSERT INTO obu_devices (device_sn, model, firmware_version, activation_status, user_id, activated_at, batch_no)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertObu.run('OBU-SN-001', 'JL-2000', 'v2.1.0', 'active', 2, '2026-01-15 10:00:00', 'BATCH-2026-001');
  insertObu.run('OBU-SN-002', 'JL-2000', 'v2.1.0', 'active', 3, '2026-01-16 11:00:00', 'BATCH-2026-001');
  insertObu.run('OBU-SN-003', 'JL-3000', 'v3.0.0', 'inactive', null, null, 'BATCH-2026-002');
  insertObu.run('OBU-SN-004', 'JL-3000', 'v3.0.0', 'inactive', null, null, 'BATCH-2026-002');
  insertObu.run('OBU-SN-005', 'JL-2000', 'v2.0.5', 'faulty', 2, '2026-02-01 09:00:00', 'BATCH-2026-001');

  const insertAccount = db.prepare(`
    INSERT INTO etc_accounts (account_no, user_id, obu_id, card_no, balance, frozen_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertAccount.run('ETC-ACC-001', 2, 1, 'CARD-001', 1580.50, 0, 'normal');
  insertAccount.run('ETC-ACC-002', 3, 2, 'CARD-002', 3200.00, 200.00, 'normal');
  insertAccount.run('ETC-ACC-003', 4, null, 'CARD-003', 5600.00, 0, 'frozen');

  const insertToll = db.prepare(`
    INSERT INTO toll_records (account_id, gantry_id, gantry_name, toll_station_id, toll_station_name, entry_time, exit_time, fee, vehicle_plate, road_segment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertToll.run(1, 'G001', '京沪高速K120门架', 'S001', '北京收费站', '2026-05-01 08:30:00', '2026-05-01 09:15:00', 45.00, '京A12345', '京沪高速北京段');
  insertToll.run(1, 'G002', '京沪高速K180门架', 'S002', '天津收费站', '2026-05-02 10:00:00', '2026-05-02 11:20:00', 68.50, '京A12345', '京沪高速天津段');
  insertToll.run(2, 'G003', '京港澳K90门架', 'S003', '石家庄收费站', '2026-05-03 14:00:00', '2026-05-03 15:30:00', 82.00, '京B67890', '京港澳高速河北段');
  insertToll.run(2, 'G004', '京港澳K150门架', 'S004', '郑州收费站', '2026-05-04 07:45:00', '2026-05-04 10:00:00', 125.00, '京B67890', '京港澳高速河南段');
  insertToll.run(3, 'G005', '连霍高速K200门架', 'S005', '西安收费站', '2026-05-05 16:00:00', '2026-05-05 18:30:00', 95.00, '陕C12345', '连霍高速陕西段');

  const insertException = db.prepare(`
    INSERT INTO exception_events (type, toll_record_id, account_id, description, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertException.run('deduction_failed', 2, 1, '京沪高速K180门架扣费失败，余额不足', 'pending');
  insertException.run('path_missing', 3, 2, '京港澳K90门架路径信息缺失', 'processing');
  insertException.run('duplicate_billing', 4, 2, '京港澳K150门架重复计费', 'resolved');

  const insertDispute = db.prepare(`
    INSERT INTO disputes (user_id, exception_event_id, description, evidence_urls, status, result)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertDispute.run(2, 1, '扣费失败申诉：账户余额充足但系统扣费失败', '["https://example.com/evidence1.jpg"]', 'processing', null);
  insertDispute.run(3, 3, '重复计费申诉：同一通行记录被扣费两次', '["https://example.com/evidence2.jpg","https://example.com/evidence3.jpg"]', 'resolved', '已退还重复扣费金额');

  const insertBlacklist = db.prepare(`
    INSERT INTO blacklist_vehicles (vehicle_plate, reason) VALUES (?, ?)
  `);
  insertBlacklist.run('豫D99999', '欠费逃漏');
  insertBlacklist.run('鲁A88888', '套牌车辆');

  const insertBlacklistConfig = db.prepare(`
    INSERT INTO blacklist_configs (name, strategy_type, conditions, is_active) VALUES (?, ?, ?, ?)
  `);
  insertBlacklistConfig.run('欠费逃漏规则', 'arrears', '{"min_arrears": 500, "overdue_days": 30}', 1);
  insertBlacklistConfig.run('套牌检测规则', 'duplicate_plate', '{"match_threshold": 0.95}', 1);

  const insertSettlement = db.prepare(`
    INSERT INTO settlements (period_start, period_end, highway_group_amount, bank_amount, difference, status) VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertSettlement.run('2026-04-01', '2026-04-30', 1250000.00, 1248500.00, 1500.00, 'confirmed');
  insertSettlement.run('2026-05-01', '2026-05-31', 1380000.00, 1376000.00, 4000.00, 'pending');

  const insertQualityMetric = db.prepare(`
    INSERT INTO data_quality_metrics (metric_date, missing_rate, latency_rate, alert_count, details) VALUES (?, ?, ?, ?, ?)
  `);
  insertQualityMetric.run('2026-05-01', 0.02, 0.01, 3, '{"missing_gantries": 5, "delayed_records": 3}');
  insertQualityMetric.run('2026-05-02', 0.01, 0.03, 5, '{"missing_gantries": 2, "delayed_records": 8}');
  insertQualityMetric.run('2026-05-03', 0.03, 0.02, 7, '{"missing_gantries": 8, "delayed_records": 5}');

  const insertService = db.prepare(`
    INSERT INTO value_added_services (service_name, service_type, api_endpoint, status, config) VALUES (?, ?, ?, ?, ?)
  `);
  insertService.run('短信通知服务', 'notification', 'https://api.example.com/sms', 'active', '{"template_id": "ETC_001"}');
  insertService.run('月结账单推送', 'report', 'https://api.example.com/report', 'active', '{"frequency": "monthly"}');
  insertService.run('违章查询服务', 'query', 'https://api.example.com/violation', 'inactive', '{"provider": "traffic_bureau"}');
}
