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
      insurance_certificate_no TEXT,
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

    CREATE TABLE IF NOT EXISTS labor_order_bids (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      worker_id TEXT NOT NULL,
      message TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES labor_orders(id),
      FOREIGN KEY (worker_id) REFERENCES users(id)
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
  if (userCount.count > 0) {
    ensureDemoBusinessData();
    return;
  }

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

  ensureDemoBusinessData();
}

function ensureDemoBusinessData() {
  const { v4: uuidv4 } = require('uuid');
  const employer1 = db.prepare("SELECT id, username, real_name, phone FROM users WHERE username = 'employer1'").get() as any;
  const employer2 = db.prepare("SELECT id, username, real_name, phone FROM users WHERE username = 'employer2'").get() as any;
  const worker1 = db.prepare("SELECT id, username, real_name, phone FROM users WHERE username = 'worker1'").get() as any;
  const worker2 = db.prepare("SELECT id, username, real_name, phone FROM users WHERE username = 'worker2'").get() as any;
  const driver1 = db.prepare("SELECT id, username, real_name, phone FROM users WHERE username = 'driver1'").get() as any;
  const driver2 = db.prepare("SELECT id, username, real_name, phone FROM users WHERE username = 'driver2'").get() as any;

  if (!employer1 || !employer2 || !worker1 || !worker2 || !driver1 || !driver2) return;

  const hasTitle = (table: string, title: string) => {
    return (db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE title = ?`).get(title) as any).count > 0;
  };

  const insertLabor = db.prepare(`
    INSERT INTO labor_orders (
      id, employer_id, worker_id, title, description, category, skills_required,
      pricing_type, price_per_hour, task_price, estimated_hours, total_price,
      city, address, latitude, longitude, start_time, end_time, status, worker_count, split_enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  if (!hasTitle('labor_orders', '望京园区水电维修组合用工')) {
    insertLabor.run(
      uuidv4(), employer1.id, null, '望京园区水电维修组合用工',
      '园区配电箱巡检、照明线路维修和水管漏点处理，可拆单分派给多名工人。',
      '水电工', JSON.stringify(['水电维修', '线路排查', '安全巡检']),
      'hourly', 60, 0, 6, 1080, '北京市', '朝阳区望京SOHO',
      39.995, 116.481, '2026-06-16 09:00:00', null, 'pending', 3, 1
    );
  }

  if (!hasTitle('labor_orders', '中关村办公室家具搬运')) {
    const orderId = uuidv4();
    insertLabor.run(
      orderId, employer2.id, worker1.id, '中关村办公室家具搬运',
      '办公桌椅拆装与搬运，需要服务轨迹存证和雇主/工人双向完工确认。',
      '搬运工', JSON.stringify(['家具搬运', '拆装', '现场保护']),
      'hourly', 60, 0, 8, 480, '北京市', '海淀区中关村创业大街',
      39.984, 116.307, '2026-06-15 10:00:00', null, 'in_progress', 1, 0
    );
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, worker_confirmed, completion_photos, notes)
      VALUES (?, ?, 'labor', 1, ?, ?)
    `).run(uuidv4(), orderId, JSON.stringify(['现场完工照片待雇主确认']), '工人已提交完工，等待雇主确认');
    db.prepare(`
      INSERT INTO gps_tracks (id, order_id, order_type, user_id, latitude, longitude, speed, heading, accuracy)
      VALUES (?, ?, 'labor', ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), orderId, worker1.id, 39.984, 116.307, 0, 0, 15);
  }

  if (!hasTitle('labor_orders', '朝阳区家政保洁服务')) {
    const orderId = uuidv4();
    insertLabor.run(
      orderId, employer1.id, worker2.id, '朝阳区家政保洁服务',
      '家庭深度保洁，包含厨房、卫生间、客厅清洁。',
      '家政保洁', JSON.stringify(['深度清洁', '厨房保洁', '卫生间消毒']),
      'task', 0, 350, 4, 350, '北京市', '朝阳区望京西园',
      39.998, 116.478, '2026-06-10 09:00:00', '2026-06-10 13:00:00', 'completed', 1, 0
    );
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, employer_confirmed, worker_confirmed, platform_confirmed, completion_photos, notes)
      VALUES (?, ?, 'labor', 1, 1, 1, ?, ?)
    `).run(confId, orderId, JSON.stringify(['清洁前照片', '清洁后照片']), '三方确认完工，服务质量满意');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'labor', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer1.id, worker2.id, 5, '保洁阿姨非常专业，打扫得很干净，准时到达，服务态度好');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'labor', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, worker2.id, employer1.id, 5, '雇主很客气，家里环境好，付款及时');
    db.prepare(`
      INSERT INTO gps_tracks (id, order_id, order_type, user_id, latitude, longitude, speed, heading, accuracy)
      VALUES (?, ?, 'labor', ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), orderId, worker2.id, 39.998, 116.478, 0, 0, 10);
  }

  if (!hasTitle('labor_orders', '海淀区家电维修服务')) {
    const orderId = uuidv4();
    insertLabor.run(
      orderId, employer2.id, worker1.id, '海淀区家电维修服务',
      '空调不制冷维修，需要检查氟利昂和压缩机。',
      '家电维修', JSON.stringify(['空调维修', '加氟', '故障检测']),
      'hourly', 80, 0, 2, 160, '北京市', '海淀区中关村东路',
      39.986, 116.312, '2026-06-12 14:00:00', '2026-06-12 16:00:00', 'completed', 1, 0
    );
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, employer_confirmed, worker_confirmed, platform_confirmed, completion_photos, notes)
      VALUES (?, ?, 'labor', 1, 1, 1, ?, ?)
    `).run(confId, orderId, JSON.stringify(['维修现场照片', '维修后测试照片']), '三方确认，空调已恢复正常');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'labor', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer2.id, worker1.id, 4, '维修师傅技术不错，空调修好了，但是稍微迟到了10分钟');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'labor', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, worker1.id, employer2.id, 5, '雇主沟通顺畅，现场提供了茶水，非常好');
    db.prepare(`
      INSERT INTO price_history (id, city, service_type, category, avg_price, sample_count, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), '北京市', 'labor', '家电维修', 180, 5, '2026-06-12');
  }

  if (!hasTitle('labor_orders', '西城区装修木工服务')) {
    const orderId = uuidv4();
    insertLabor.run(
      orderId, employer1.id, worker1.id, '西城区装修木工服务',
      '定制衣柜安装，需要熟练木工。',
      '木工', JSON.stringify(['家具安装', '衣柜定制', '五金配件']),
      'task', 0, 800, 8, 800, '北京市', '西城区金融街',
      39.915, 116.356, '2026-06-08 09:00:00', '2026-06-08 17:00:00', 'completed', 1, 0
    );
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, employer_confirmed, worker_confirmed, platform_confirmed, completion_photos, notes)
      VALUES (?, ?, 'labor', 1, 1, 0, ?, ?)
    `).run(confId, orderId, JSON.stringify(['安装完成照片']), '雇主和工人已确认，平台待审核');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'labor', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer1.id, worker1.id, 5, '王师傅手艺精湛，衣柜安装严丝合缝，非常满意');
  }

  const insertDelivery = db.prepare(`
    INSERT INTO delivery_orders (
      id, employer_id, driver_id, title, description, vehicle_type_required, weight, volume, goods_type,
      pickup_address, pickup_latitude, pickup_longitude, delivery_address, delivery_latitude, delivery_longitude,
      distance, base_price, bid_start_price, final_price, pickup_time, delivery_time, status, waybill_no
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBid = db.prepare(`
    INSERT INTO delivery_bids (id, order_id, driver_id, bid_price, message, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  if (!hasTitle('delivery_orders', '朝阳到海淀展会物料运输')) {
    const orderId = uuidv4();
    insertDelivery.run(
      orderId, employer1.id, null, '朝阳到海淀展会物料运输',
      '展架、灯箱和宣传物料同城运输，车型智能匹配后进入司机竞价。',
      '厢式货车', 1.2, 8, '展会物料',
      '朝阳区国贸会展中心', 39.914, 116.461, '海淀区中关村软件园', 40.052, 116.294,
      28, 220, 260, null, '2026-06-16 08:30:00', null, 'bidding', 'WL2026061601'
    );
    insertBid.run(uuidv4(), orderId, driver1.id, 258, '4.2米厢货，可提供电子运单和装车照片', 'pending');
    insertBid.run(uuidv4(), orderId, driver2.id, 246, '平板货车，30分钟内到达装货点', 'pending');
  }

  if (!hasTitle('delivery_orders', '丰台仓库冷链配送')) {
    const orderId = uuidv4();
    insertDelivery.run(
      orderId, employer2.id, driver1.id, '丰台仓库冷链配送',
      '食品样品冷链配送，已选中司机并开始运输，可追踪运单状态。',
      '冷藏车', 0.8, 4, '冷链食品',
      '丰台区总部基地仓库', 39.83, 116.293, '东城区王府井门店', 39.915, 116.411,
      22, 480, 520, 520, '2026-06-15 09:30:00', null, 'in_progress', 'WL2026061502'
    );
    const bidId = uuidv4();
    insertBid.run(bidId, orderId, driver1.id, 520, '冷藏车，全程温控记录，准时送达', 'accepted');
    insertBid.run(uuidv4(), orderId, driver2.id, 550, '平板货车加保温棉，价格实惠', 'rejected');
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, driver_confirmed, completion_photos, notes)
      VALUES (?, ?, 'delivery', 1, ?, ?)
    `).run(uuidv4(), orderId, JSON.stringify(['装车温控照片']), '司机已取货，等待收货确认');
    db.prepare(`
      INSERT INTO gps_tracks (id, order_id, order_type, user_id, latitude, longitude, timestamp, speed, heading, accuracy)
      VALUES (?, ?, 'delivery', ?, ?, ?, datetime('now'), ?, ?, ?)
    `).run(uuidv4(), orderId, driver1.id, 39.881, 116.352, 32, 62, 8);
    db.prepare(`
      INSERT INTO gps_tracks (id, order_id, order_type, user_id, latitude, longitude, timestamp, speed, heading, accuracy)
      VALUES (?, ?, 'delivery', ?, ?, ?, datetime('now'), ?, ?, ?)
    `).run(uuidv4(), orderId, driver1.id, 39.902, 116.385, 28, 85, 10);
  }

  if (!hasTitle('delivery_orders', '通州到顺义家具运输')) {
    const orderId = uuidv4();
    insertDelivery.run(
      orderId, employer1.id, driver2.id, '通州到顺义家具运输',
      '新买的沙发和茶几运输，需要细心搬运。',
      '厢式货车', 0.5, 6, '家具',
      '通州区梨园家具城', 39.902, 116.653, '顺义区后沙峪', 40.125, 116.603,
      35, 280, 320, 310, '2026-06-11 10:00:00', '2026-06-11 12:30:00', 'completed', 'WL2026061103'
    );
    insertBid.run(uuidv4(), orderId, driver2.id, 310, '4.2米厢货，有棉被保护，细心搬运', 'accepted');
    insertBid.run(uuidv4(), orderId, driver1.id, 330, '老司机经验丰富，安全第一', 'rejected');
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, employer_confirmed, driver_confirmed, platform_confirmed, completion_photos, notes)
      VALUES (?, ?, 'delivery', 1, 1, 1, ?, ?)
    `).run(confId, orderId, JSON.stringify(['装车照片', '卸车照片']), '三方确认，货物完好无损');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'delivery', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer1.id, driver2.id, 5, '陈师傅非常细心，家具包装得很好，没有任何磕碰，准时送达');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'delivery', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, driver2.id, employer1.id, 5, '发货人很配合，提前准备好货物，装卸很顺利');
    db.prepare(`
      INSERT INTO gps_tracks (id, order_id, order_type, user_id, latitude, longitude, timestamp, speed, heading, accuracy)
      VALUES (?, ?, 'delivery', ?, ?, ?, datetime('now'), ?, ?, ?)
    `).run(uuidv4(), orderId, driver2.id, 40.012, 116.628, 45, 20, 6);
  }

  if (!hasTitle('delivery_orders', '大兴到昌平建材运输')) {
    const orderId = uuidv4();
    insertDelivery.run(
      orderId, employer2.id, driver1.id, '大兴到昌平建材运输',
      '瓷砖、水泥等建材运输，有一定重量。',
      '平板货车', 3, 10, '建材',
      '大兴区亦庄建材市场', 39.785, 116.512, '昌平区回龙观', 40.068, 116.342,
      45, 350, 400, 380, '2026-06-09 08:00:00', '2026-06-09 11:00:00', 'completed', 'WL2026060904'
    );
    insertBid.run(uuidv4(), orderId, driver1.id, 380, '6.8米平板车，承重5吨，经验丰富', 'accepted');
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, employer_confirmed, driver_confirmed, platform_confirmed, completion_photos, notes)
      VALUES (?, ?, 'delivery', 1, 1, 1, ?, ?)
    `).run(confId, orderId, JSON.stringify(['装车照片']), '三方确认，数量无误');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'delivery', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer2.id, driver1.id, 4, '运输及时，但是卸车时发现有一箱瓷砖边角有点碰损，希望下次注意');
    db.prepare(`
      INSERT INTO insurance_claims (id, order_id, order_type, claimant_id, claim_amount, claim_reason, description, status, insurance_company, policy_no, payout_amount)
      VALUES (?, ?, 'delivery', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer2.id, 200, '货物破损', '运输过程中一箱瓷砖边角碰损，已拍照留证', 'resolved', '人保', 'POLICY2026001', 150);
    db.prepare(`
      INSERT INTO price_history (id, city, service_type, category, avg_price, sample_count, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), '北京市', 'delivery', '平板货车', 360, 8, '2026-06-09');
  }

  if (!hasTitle('delivery_orders', '东城到西城文件快递')) {
    const orderId = uuidv4();
    insertDelivery.run(
      orderId, employer1.id, driver2.id, '东城到西城文件快递',
      '重要合同文件加急配送。',
      '厢式货车', 0.01, 0.1, '文件',
      '东城区建国门', 39.908, 116.432, '西城区复兴门', 39.912, 116.358,
      8, 80, 100, 100, '2026-06-14 14:00:00', '2026-06-14 15:00:00', 'completed', 'WL2026061405'
    );
    insertBid.run(uuidv4(), orderId, driver2.id, 100, '专人专车，1小时内送达，保价服务', 'accepted');
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, employer_confirmed, driver_confirmed, platform_confirmed, completion_photos, notes)
      VALUES (?, ?, 'delivery', 1, 1, 1, ?, ?)
    `).run(confId, orderId, JSON.stringify(['签收单照片']), '三方确认，文件已安全送达');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'delivery', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer1.id, driver2.id, 5, '配送非常及时，45分钟就送到了，文件安全无虞，非常感谢');
  }

  const insertMoving = db.prepare(`
    INSERT INTO moving_orders (
      id, employer_id, driver_id, worker_ids, title, description, from_address, from_floor, from_elevator,
      to_address, to_floor, to_elevator, distance, vehicle_type, package_list, service_packages,
      base_price, package_price, floor_price, total_price, move_date, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  if (!hasTitle('moving_orders', '三里屯公寓标准搬家')) {
    insertMoving.run(
      uuidv4(), employer1.id, null, JSON.stringify([]), '三里屯公寓标准搬家',
      '两居室搬家，含打包清单和楼层电梯识别。',
      '朝阳区三里屯公寓', 8, 1, '朝阳区望京花园', 12, 1, 12,
      '厢式货车', JSON.stringify([{ name: '纸箱', quantity: 18, size: 'medium' }, { name: '双人床', quantity: 1, size: 'large' }]),
      JSON.stringify([{ id: 'standard', name: '标准搬家', base_price: 500, includes: ['运输', '2名搬运工', '基础打包'] }]),
      500, 260, 100, 860, '2026-06-17 09:00:00', 'pending'
    );
  }

  if (!hasTitle('moving_orders', '国贸办公室整体搬迁')) {
    insertMoving.run(
      uuidv4(), employer2.id, driver1.id, JSON.stringify([worker1.id, worker2.id]), '国贸办公室整体搬迁',
      '办公室工位、会议桌和弱电设备搬迁，已完成司机与工人组合派单。',
      '朝阳区国贸写字楼A座', 18, 1, '海淀区上地信息产业基地', 6, 1, 32,
      '厢式货车', JSON.stringify([{ name: '工位', quantity: 24, size: 'large' }, { name: '服务器机柜', quantity: 2, fragile: true }]),
      JSON.stringify([{ id: 'premium', name: '豪华搬家', base_price: 1000, includes: ['专业打包', '家具拆装', '保险'] }]),
      1000, 500, 300, 1800, '2026-06-18 08:00:00', 'accepted'
    );
  }

  if (!hasTitle('moving_orders', '望京到天通苑家庭搬家')) {
    const orderId = uuidv4();
    insertMoving.run(
      orderId, employer1.id, driver2.id, JSON.stringify([worker1.id, worker2.id]), '望京到天通苑家庭搬家',
      '三居室家庭搬家，含钢琴搬运，需要专业团队。',
      '朝阳区望京新城', 6, 1, '昌平区天通苑北', 15, 0, 18,
      '厢式货车', JSON.stringify([{ name: '钢琴', quantity: 1, fragile: true }, { name: '衣柜', quantity: 3 }, { name: '沙发', quantity: 2 }]),
      JSON.stringify([{ id: 'premium', name: '豪华搬家', base_price: 1000, includes: ['专业打包', '家具拆装', '保险'] }, { id: 'piano', name: '钢琴搬运', base_price: 800, includes: ['专业搬运设备', '4名搬运工', '保险'] }]),
      1000, 800, 500, 2300, '2026-06-13 08:00:00', 'completed'
    );
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, employer_confirmed, worker_confirmed, driver_confirmed, platform_confirmed, completion_photos, notes)
      VALUES (?, ?, 'moving', 1, 1, 1, 1, ?, ?)
    `).run(confId, orderId, JSON.stringify(['钢琴装车照片', '卸车后摆放照片']), '三方确认，所有物品完好，钢琴调音测试正常');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'moving', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer1.id, driver2.id, 5, '陈师傅车开得稳，钢琴运输全程没有颠簸，非常专业');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'moving', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer1.id, worker1.id, 5, '王师傅和赵师傅配合默契，钢琴上下楼非常小心，技术过硬');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'moving', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer1.id, worker2.id, 5, '打包非常专业，易碎品都做了特殊保护，没有任何损坏');
    db.prepare(`
      INSERT INTO gps_tracks (id, order_id, order_type, user_id, latitude, longitude, timestamp, speed, heading, accuracy)
      VALUES (?, ?, 'moving', ?, ?, ?, datetime('now'), ?, ?, ?)
    `).run(uuidv4(), orderId, driver2.id, 40.045, 116.412, 38, 35, 7);
  }

  if (!hasTitle('moving_orders', '海淀到朝阳小型搬家')) {
    const orderId = uuidv4();
    insertMoving.run(
      orderId, employer2.id, driver1.id, JSON.stringify([worker2.id]), '海淀到朝阳小型搬家',
      '单身公寓搬家，物品不多，但是有一个保险柜。',
      '海淀区五道口', 3, 1, '朝阳区劲松', 5, 1, 22,
      '厢式货车', JSON.stringify([{ name: '保险柜', quantity: 1, heavy: true }, { name: '行李箱', quantity: 5 }]),
      JSON.stringify([{ id: 'standard', name: '标准搬家', base_price: 500, includes: ['运输', '2名搬运工', '基础打包'] }, { id: 'safe', name: '保险柜搬运', base_price: 600, includes: ['专业设备', '2名搬运工', '保险'] }]),
      500, 600, 0, 1100, '2026-06-07 09:00:00', 'completed'
    );
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, employer_confirmed, worker_confirmed, driver_confirmed, platform_confirmed, completion_photos, notes)
      VALUES (?, ?, 'moving', 1, 1, 1, 1, ?, ?)
    `).run(confId, orderId, JSON.stringify(['保险柜搬运照片', '摆放到位照片']), '三方确认，保险柜搬运到位，门和地板无划痕');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'moving', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer2.id, driver1.id, 5, '刘师傅经验丰富，路线规划得好，避开了拥堵路段，准时到达');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'moving', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer2.id, worker2.id, 4, '保险柜很重，师傅们很辛苦，搬运过程中门有轻微磕碰，已经修复，整体满意');
    db.prepare(`
      INSERT INTO disputes (id, order_id, order_type, complainant_id, respondent_id, reason, description, evidence_photos, status, resolution, arbitrator_id)
      VALUES (?, ?, 'moving', ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer2.id, worker2.id, '物品损坏', '搬运过程中门框有轻微划痕', JSON.stringify(['划痕照片']), 'resolved', '平台介入，给予50元优惠券补偿', (db.prepare("SELECT id FROM users WHERE role = 'admin'").get() as any).id);
    db.prepare(`
      INSERT INTO price_history (id, city, service_type, category, avg_price, sample_count, date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), '北京市', 'moving', '标准搬家', 1050, 6, '2026-06-07');
  }

  if (!hasTitle('moving_orders', '丰台到石景山公司搬家')) {
    const orderId = uuidv4();
    insertMoving.run(
      orderId, employer1.id, driver1.id, JSON.stringify([worker1.id, worker2.id]), '丰台到石景山公司搬家',
      '小型公司搬迁，办公家具和设备。',
      '丰台区丽泽商务区', 10, 1, '石景山区古城', 8, 1, 25,
      '厢式货车', JSON.stringify([{ name: '办公桌', quantity: 10 }, { name: '办公椅', quantity: 10 }, { name: '文件柜', quantity: 5 }]),
      JSON.stringify([{ id: 'premium', name: '豪华搬家', base_price: 1000, includes: ['专业打包', '家具拆装', '保险'] }]),
      1000, 400, 200, 1600, '2026-06-05 08:00:00', 'completed'
    );
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, employer_confirmed, worker_confirmed, driver_confirmed, platform_confirmed, completion_photos, notes)
      VALUES (?, ?, 'moving', 1, 1, 1, 1, ?, ?)
    `).run(confId, orderId, JSON.stringify(['拆装照片', '新办公室摆放照片']), '三方确认，所有物品完好，办公家具安装到位');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'moving', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer1.id, driver1.id, 5, '团队配合默契，一天就完成了搬迁，没有影响公司运营');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'moving', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer1.id, worker1.id, 5, '拆装技术专业，所有家具都完好无损');
    db.prepare(`
      INSERT INTO reviews (id, order_id, order_type, reviewer_id, reviewee_id, rating, content)
      VALUES (?, ?, 'moving', ?, ?, ?, ?)
    `).run(uuidv4(), orderId, employer1.id, worker2.id, 5, '打包仔细，文件都做了编号，方便整理');
  }

  const insertGpsTrack = db.prepare(`
    INSERT INTO gps_tracks (id, order_id, order_type, user_id, latitude, longitude, timestamp, speed, heading, accuracy)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLaborBid = db.prepare(`
    INSERT INTO labor_order_bids (id, order_id, worker_id, message, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const generateGpsTracks = (orderId: string, orderType: string, userId: string, baseLat: number, baseLng: number, count: number, startTime: string) => {
    const tracks: any[] = [];
    let lat = baseLat;
    let lng = baseLng;
    const startDate = new Date(startTime);
    
    for (let i = 0; i < count; i++) {
      lat += (Math.random() - 0.5) * 0.002;
      lng += (Math.random() - 0.5) * 0.002;
      const trackTime = new Date(startDate.getTime() + i * 10 * 60 * 1000);
      tracks.push({
        id: uuidv4(),
        order_id: orderId,
        order_type: orderType,
        user_id: userId,
        latitude: lat,
        longitude: lng,
        timestamp: trackTime.toISOString().replace('T', ' ').substring(0, 19),
        speed: Math.random() * 50,
        heading: Math.random() * 360,
        accuracy: 5 + Math.random() * 10,
      });
    }
    return tracks;
  };

  const laborOrders = db.prepare(`
    SELECT id, worker_id, latitude, longitude, start_time, status 
    FROM labor_orders 
    WHERE status IN ('in_progress', 'completed')
  `).all() as any[];

  laborOrders.forEach((order) => {
    if (order.worker_id) {
      const lat = order.latitude || 39.9042;
      const lng = order.longitude || 116.4074;
      const trackCount = 5 + Math.floor(Math.random() * 4);
      const tracks = generateGpsTracks(
        order.id, 
        'labor', 
        order.worker_id, 
        lat, 
        lng, 
        trackCount,
        order.start_time || '2026-06-10 09:00:00'
      );
      const existingCount = (db.prepare('SELECT COUNT(*) as count FROM gps_tracks WHERE order_id = ? AND order_type = ?').get(order.id, 'labor') as any).count;
      if (existingCount < 5) {
        tracks.forEach(t => insertGpsTrack.run(t.id, t.order_id, t.order_type, t.user_id, t.latitude, t.longitude, t.timestamp, t.speed, t.heading, t.accuracy));
      }
    }
  });

  const deliveryOrders = db.prepare(`
    SELECT id, driver_id, pickup_latitude, pickup_longitude, pickup_time, status 
    FROM delivery_orders 
    WHERE status IN ('in_progress', 'completed')
  `).all() as any[];

  deliveryOrders.forEach((order) => {
    if (order.driver_id) {
      const lat = order.pickup_latitude || 39.9042;
      const lng = order.pickup_longitude || 116.4074;
      const trackCount = 5 + Math.floor(Math.random() * 4);
      const tracks = generateGpsTracks(
        order.id, 
        'delivery', 
        order.driver_id, 
        lat, 
        lng, 
        trackCount,
        order.pickup_time || '2026-06-10 09:00:00'
      );
      const existingCount = (db.prepare('SELECT COUNT(*) as count FROM gps_tracks WHERE order_id = ? AND order_type = ?').get(order.id, 'delivery') as any).count;
      if (existingCount < 5) {
        tracks.forEach(t => insertGpsTrack.run(t.id, t.order_id, t.order_type, t.user_id, t.latitude, t.longitude, t.timestamp, t.speed, t.heading, t.accuracy));
      }
    }
  });

  const movingOrders = db.prepare(`
    SELECT id, driver_id, status 
    FROM moving_orders 
    WHERE status IN ('in_progress', 'accepted', 'completed')
  `).all() as any[];

  movingOrders.forEach((order) => {
    if (order.driver_id) {
      const trackCount = 5 + Math.floor(Math.random() * 4);
      const tracks = generateGpsTracks(
        order.id, 
        'moving', 
        order.driver_id, 
        39.95 + Math.random() * 0.1, 
        116.35 + Math.random() * 0.1, 
        trackCount,
        '2026-06-10 09:00:00'
      );
      const existingCount = (db.prepare('SELECT COUNT(*) as count FROM gps_tracks WHERE order_id = ? AND order_type = ?').get(order.id, 'moving') as any).count;
      if (existingCount < 5) {
        tracks.forEach(t => insertGpsTrack.run(t.id, t.order_id, t.order_type, t.user_id, t.latitude, t.longitude, t.timestamp, t.speed, t.heading, t.accuracy));
      }
    }
  });

  const pendingLaborOrders = db.prepare(`
    SELECT id, employer_id, created_at 
    FROM labor_orders 
    WHERE status = 'pending'
  `).all() as any[];

  const workers = [worker1, worker2];
  pendingLaborOrders.forEach((order) => {
    const existingBids = (db.prepare('SELECT COUNT(*) as count FROM labor_order_bids WHERE order_id = ?').get(order.id) as any).count;
    if (existingBids < 2) {
      const neededBids = 2 - existingBids;
      for (let i = 0; i < neededBids; i++) {
        const worker = workers[i % workers.length];
        const bidStatus = i === 0 ? 'pending' : (Math.random() > 0.5 ? 'rejected' : 'pending');
        const messages = [
          '我有丰富的经验，可以准时完成',
          '专业团队，质量保证',
          '价格合理，服务周到',
          '持证上岗，安全可靠'
        ];
        const bidTime = new Date(new Date(order.created_at).getTime() + (i + 1) * 30 * 60 * 1000);
        insertLaborBid.run(
          uuidv4(),
          order.id,
          worker.id,
          messages[Math.floor(Math.random() * messages.length)],
          bidStatus,
          bidTime.toISOString().replace('T', ' ').substring(0, 19)
        );
      }
    }
  });

  const completedLaborOrders = db.prepare(`
    SELECT lo.id, lo.worker_id, lo.employer_id
    FROM labor_orders lo
    LEFT JOIN order_confirmations oc ON lo.id = oc.order_id AND oc.order_type = 'labor'
    WHERE lo.status = 'completed' AND oc.id IS NULL
  `).all() as any[];

  completedLaborOrders.forEach((order) => {
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, employer_confirmed, worker_confirmed, platform_confirmed, completion_photos, notes)
      VALUES (?, ?, 'labor', 1, 1, 1, ?, ?)
    `).run(confId, order.id, JSON.stringify(['完工照片1', '完工照片2']), '三方确认，服务完成');
  });

  const inProgressLaborOrders = db.prepare(`
    SELECT lo.id, lo.worker_id
    FROM labor_orders lo
    LEFT JOIN order_confirmations oc ON lo.id = oc.order_id AND oc.order_type = 'labor'
    WHERE lo.status = 'in_progress' AND oc.id IS NULL
  `).all() as any[];

  inProgressLaborOrders.forEach((order) => {
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, worker_confirmed, completion_photos, notes)
      VALUES (?, ?, 'labor', 1, ?, ?)
    `).run(confId, order.id, JSON.stringify(['现场照片']), '工人已完工，等待雇主确认');
  });

  const completedDeliveryOrders = db.prepare(`
    SELECT do.id, do.driver_id, do.employer_id
    FROM delivery_orders do
    LEFT JOIN order_confirmations oc ON do.id = oc.order_id AND oc.order_type = 'delivery'
    WHERE do.status = 'completed' AND oc.id IS NULL
  `).all() as any[];

  completedDeliveryOrders.forEach((order) => {
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, employer_confirmed, driver_confirmed, platform_confirmed, completion_photos, notes)
      VALUES (?, ?, 'delivery', 1, 1, 1, ?, ?)
    `).run(confId, order.id, JSON.stringify(['签收单', '货物照片']), '三方确认，货物已送达');
  });

  const inProgressDeliveryOrders = db.prepare(`
    SELECT do.id, do.driver_id
    FROM delivery_orders do
    LEFT JOIN order_confirmations oc ON do.id = oc.order_id AND oc.order_type = 'delivery'
    WHERE do.status = 'in_progress' AND oc.id IS NULL
  `).all() as any[];

  inProgressDeliveryOrders.forEach((order) => {
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, driver_confirmed, completion_photos, notes)
      VALUES (?, ?, 'delivery', 1, ?, ?)
    `).run(confId, order.id, JSON.stringify(['装车照片']), '司机已取货，运输中');
  });

  const completedMovingOrders = db.prepare(`
    SELECT mo.id, mo.driver_id, mo.employer_id, mo.worker_ids
    FROM moving_orders mo
    LEFT JOIN order_confirmations oc ON mo.id = oc.order_id AND oc.order_type = 'moving'
    WHERE mo.status = 'completed' AND oc.id IS NULL
  `).all() as any[];

  completedMovingOrders.forEach((order) => {
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, employer_confirmed, worker_confirmed, driver_confirmed, platform_confirmed, completion_photos, notes)
      VALUES (?, ?, 'moving', 1, 1, 1, 1, ?, ?)
    `).run(confId, order.id, JSON.stringify(['装车照片', '卸车照片', '摆放照片']), '三方确认，搬家完成');
  });

  const inProgressMovingOrders = db.prepare(`
    SELECT mo.id, mo.driver_id
    FROM moving_orders mo
    LEFT JOIN order_confirmations oc ON mo.id = oc.order_id AND oc.order_type = 'moving'
    WHERE mo.status IN ('in_progress', 'accepted') AND oc.id IS NULL
  `).all() as any[];

  inProgressMovingOrders.forEach((order) => {
    const confId = uuidv4();
    db.prepare(`
      INSERT INTO order_confirmations (id, order_id, order_type, driver_confirmed, worker_confirmed, completion_photos, notes)
      VALUES (?, ?, 'moving', 1, 1, ?, ?)
    `).run(confId, order.id, JSON.stringify(['打包照片']), '正在进行中，等待完工确认');
  });

  db.prepare(`
    UPDATE users SET credit_score = 98 WHERE id = ?
  `).run(worker1.id);
  db.prepare(`
    UPDATE users SET credit_score = 95 WHERE id = ?
  `).run(worker2.id);
  db.prepare(`
    UPDATE users SET credit_score = 97 WHERE id = ?
  `).run(driver1.id);
  db.prepare(`
    UPDATE users SET credit_score = 94 WHERE id = ?
  `).run(driver2.id);
  db.prepare(`
    UPDATE users SET credit_score = 96 WHERE id = ?
  `).run(employer1.id);
  db.prepare(`
    UPDATE users SET credit_score = 93 WHERE id = ?
  `).run(employer2.id);

  db.prepare(`
    UPDATE worker_profiles SET completed_orders = 3, rating = 4.8 WHERE user_id = ?
  `).run(worker1.id);
  db.prepare(`
    UPDATE worker_profiles SET completed_orders = 2, rating = 4.9 WHERE user_id = ?
  `).run(worker2.id);

  db.prepare(`
    UPDATE driver_profiles SET completed_orders = 3, rating = 4.7 WHERE user_id = ?
  `).run(driver1.id);
  db.prepare(`
    UPDATE driver_profiles SET completed_orders = 3, rating = 4.9 WHERE user_id = ?
  `).run(driver2.id);
}

export function getDB(): Database.Database {
  return db;
}
