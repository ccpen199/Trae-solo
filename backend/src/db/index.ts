import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database;

export function initDB(dbPath: string): Database.Database {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

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
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'employer',
      avatar TEXT,
      credit_score INTEGER DEFAULT 100,
      balance REAL DEFAULT 0,
      city TEXT,
      address TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS worker_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      skills TEXT,
      service_radius INTEGER DEFAULT 5,
      hourly_rate REAL DEFAULT 50,
      task_rate REAL DEFAULT 200,
      completed_orders INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      bio TEXT,
      id_card_verified INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS driver_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      vehicle_type TEXT,
      vehicle_brand TEXT,
      plate_number TEXT,
      load_capacity REAL DEFAULT 1,
      vehicle_length REAL DEFAULT 4.2,
      insurance_verified INTEGER DEFAULT 0,
      insurance_expiry TEXT,
      completed_orders INTEGER DEFAULT 0,
      rating REAL DEFAULT 5.0,
      bio TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS labor_orders (
      id TEXT PRIMARY KEY,
      employer_id TEXT NOT NULL,
      worker_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT,
      skills_required TEXT,
      pricing_type TEXT DEFAULT 'hourly',
      price_per_hour REAL,
      task_price REAL,
      estimated_hours REAL,
      total_price REAL,
      city TEXT,
      address TEXT,
      latitude REAL,
      longitude REAL,
      start_time TEXT,
      end_time TEXT,
      status TEXT DEFAULT 'pending',
      worker_count INTEGER DEFAULT 1,
      split_enabled INTEGER DEFAULT 0,
      parent_order_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (employer_id) REFERENCES users(id),
      FOREIGN KEY (worker_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS delivery_orders (
      id TEXT PRIMARY KEY,
      employer_id TEXT NOT NULL,
      driver_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      vehicle_type_required TEXT,
      weight REAL,
      volume REAL,
      goods_type TEXT,
      pickup_address TEXT NOT NULL,
      pickup_latitude REAL,
      pickup_longitude REAL,
      delivery_address TEXT NOT NULL,
      delivery_latitude REAL,
      delivery_longitude REAL,
      distance REAL,
      base_price REAL,
      bid_start_price REAL,
      final_price REAL,
      pickup_time TEXT,
      delivery_time TEXT,
      status TEXT DEFAULT 'bidding',
      waybill_no TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (employer_id) REFERENCES users(id),
      FOREIGN KEY (driver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS delivery_bids (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      driver_id TEXT NOT NULL,
      bid_price REAL NOT NULL,
      message TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES delivery_orders(id),
      FOREIGN KEY (driver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS moving_orders (
      id TEXT PRIMARY KEY,
      employer_id TEXT NOT NULL,
      driver_id TEXT,
      worker_ids TEXT,
      title TEXT NOT NULL,
      description TEXT,
      from_address TEXT NOT NULL,
      from_floor INTEGER DEFAULT 1,
      from_elevator INTEGER DEFAULT 1,
      to_address TEXT NOT NULL,
      to_floor INTEGER DEFAULT 1,
      to_elevator INTEGER DEFAULT 1,
      distance REAL,
      vehicle_type TEXT,
      package_list TEXT,
      service_packages TEXT,
      base_price REAL,
      package_price REAL,
      floor_price REAL,
      total_price REAL,
      move_date TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (employer_id) REFERENCES users(id),
      FOREIGN KEY (driver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS gps_tracks (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      order_type TEXT NOT NULL,
      user_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp TEXT DEFAULT (datetime('now')),
      speed REAL,
      heading REAL,
      accuracy REAL
    );

    CREATE TABLE IF NOT EXISTS order_confirmations (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      order_type TEXT NOT NULL,
      employer_confirmed INTEGER DEFAULT 0,
      worker_confirmed INTEGER DEFAULT 0,
      driver_confirmed INTEGER DEFAULT 0,
      platform_confirmed INTEGER DEFAULT 0,
      completion_photos TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      order_type TEXT NOT NULL,
      reviewer_id TEXT NOT NULL,
      reviewee_id TEXT NOT NULL,
      rating REAL NOT NULL,
      content TEXT,
      photos TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      order_type TEXT NOT NULL,
      complainant_id TEXT NOT NULL,
      respondent_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      description TEXT,
      evidence_photos TEXT,
      call_recordings TEXT,
      status TEXT DEFAULT 'pending',
      resolution TEXT,
      arbitrator_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      resolved_at TEXT
    );

    CREATE TABLE IF NOT EXISTS insurance_claims (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      order_type TEXT NOT NULL,
      claimant_id TEXT NOT NULL,
      claim_amount REAL NOT NULL,
      claim_reason TEXT NOT NULL,
      description TEXT,
      evidence TEXT,
      status TEXT DEFAULT 'pending',
      insurance_company TEXT DEFAULT '人保',
      policy_no TEXT,
      payout_amount REAL,
      created_at TEXT DEFAULT (datetime('now')),
      processed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS quality_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      rule_type TEXT NOT NULL,
      threshold REAL,
      action TEXT,
      description TEXT,
      enabled INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      related_id TEXT,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id TEXT PRIMARY KEY,
      city TEXT NOT NULL,
      service_type TEXT NOT NULL,
      category TEXT,
      avg_price REAL,
      sample_count INTEGER,
      date TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_labor_orders_city ON labor_orders(city);
    CREATE INDEX IF NOT EXISTS idx_labor_orders_status ON labor_orders(status);
    CREATE INDEX IF NOT EXISTS idx_delivery_orders_status ON delivery_orders(status);
    CREATE INDEX IF NOT EXISTS idx_gps_tracks_order ON gps_tracks(order_id, order_type);
  `);
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  if (userCount.count > 0) return;

  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password, real_name, phone, role, credit_score, balance, city, address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const adminId = uuidv4();
  insertUser.run(adminId, 'admin', bcrypt.hashSync('admin123', 10), '系统管理员', '13800000000', 'admin', 100, 0, '北京市', '朝阳区');

  const employer1Id = uuidv4();
  insertUser.run(employer1Id, 'employer1', bcrypt.hashSync('123456', 10), '张老板', '13800000001', 'employer', 95, 5000, '北京市', '朝阳区望京SOHO');

  const employer2Id = uuidv4();
  insertUser.run(employer2Id, 'employer2', bcrypt.hashSync('123456', 10), '李经理', '13800000002', 'employer', 92, 3000, '北京市', '海淀区中关村');

  const worker1Id = uuidv4();
  insertUser.run(worker1Id, 'worker1', bcrypt.hashSync('123456', 10), '王师傅', '13800000003', 'worker', 98, 1500, '北京市', '朝阳区');

  const worker2Id = uuidv4();
  insertUser.run(worker2Id, 'worker2', bcrypt.hashSync('123456', 10), '赵师傅', '13800000004', 'worker', 88, 800, '北京市', '海淀区');

  const driver1Id = uuidv4();
  insertUser.run(driver1Id, 'driver1', bcrypt.hashSync('123456', 10), '刘师傅', '13800000005', 'driver', 96, 2000, '北京市', '丰台区');

  const driver2Id = uuidv4();
  insertUser.run(driver2Id, 'driver2', bcrypt.hashSync('123456', 10), '陈师傅', '13800000006', 'driver', 91, 1200, '北京市', '大兴区');

  const insertWorkerProfile = db.prepare(`
    INSERT INTO worker_profiles (id, user_id, skills, service_radius, hourly_rate, task_rate, bio, id_card_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertWorkerProfile.run(uuidv4(), worker1Id, JSON.stringify(['水电工', '木工', '搬运']), 10, 60, 300, '十年装修经验，持证上岗', 1);
  insertWorkerProfile.run(uuidv4(), worker2Id, JSON.stringify(['搬运', '装卸', '家政']), 8, 45, 150, '专业搬家搬运团队', 1);

  const insertDriverProfile = db.prepare(`
    INSERT INTO driver_profiles (id, user_id, vehicle_type, vehicle_brand, plate_number, load_capacity, vehicle_length, insurance_verified, insurance_expiry, bio)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertDriverProfile.run(uuidv4(), driver1Id, '厢式货车', '福田', '京A12345', 3, 4.2, 1, '2025-12-31', '五年货运经验，熟悉北京路况');
  insertDriverProfile.run(uuidv4(), driver2Id, '平板货车', '东风', '京B67890', 5, 6.8, 1, '2025-06-30', '长途短途都能跑，准时高效');

  const insertQualityRule = db.prepare(`
    INSERT INTO quality_rules (id, name, rule_type, threshold, action, description, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertQualityRule.run(uuidv4(), '搬运破损率阈值', 'damage_rate', 0.05, 'auto_compensation', '搬运破损率超过5%自动触发赔付', 1);
  insertQualityRule.run(uuidv4(), '超时服务预警', 'timeout_rate', 0.1, 'warning', '订单超时率超过10%触发预警', 1);
  insertQualityRule.run(uuidv4(), '低分评价处理', 'low_rating', 3.0, 'manual_review', '评价低于3星自动进入人工审核', 1);
  insertQualityRule.run(uuidv4(), '信用分下限', 'credit_score', 60, 'suspend_service', '信用分低于60分暂停服务', 1);
}

export function getDB(): Database.Database {
  return db;
}
