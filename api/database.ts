import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import dayjs from 'dayjs'

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

export function initDatabase(): void {
  const dbPath = process.env.DB_PATH || './data/app.sqlite'
  const resolvedPath = path.resolve(process.cwd(), dbPath)
  const dir = path.dirname(resolvedPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(resolvedPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  createTables()
  seedData()
}

function createTables(): void {
  const d = getDb()

  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      real_name TEXT DEFAULT '',
      role TEXT NOT NULL CHECK(role IN ('admin','operator','user')) DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS cabinets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT DEFAULT '',
      address TEXT DEFAULT '',
      status TEXT NOT NULL CHECK(status IN ('online','offline','maintenance')) DEFAULT 'online',
      total_compartments INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS compartments (
      id TEXT PRIMARY KEY,
      cabinet_id TEXT NOT NULL,
      code TEXT NOT NULL,
      size TEXT NOT NULL CHECK(size IN ('small','medium','large','xlarge')) DEFAULT 'small',
      status TEXT NOT NULL CHECK(status IN ('available','occupied','reserved','fault')) DEFAULT 'available',
      temperature_zone TEXT NOT NULL CHECK(temperature_zone IN ('normal','cold','frozen')) DEFAULT 'normal',
      current_package_id TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (cabinet_id) REFERENCES cabinets(id)
    );

    CREATE TABLE IF NOT EXISTS express_companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      api_url TEXT DEFAULT '',
      freight_template TEXT DEFAULT '{}',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS packages (
      id TEXT PRIMARY KEY,
      tracking_number TEXT NOT NULL,
      user_id TEXT NOT NULL,
      compartment_id TEXT DEFAULT NULL,
      type TEXT NOT NULL CHECK(type IN ('send','receive','store')) DEFAULT 'receive',
      status TEXT NOT NULL CHECK(status IN ('pending','stored','picked_up','transferred','expired')) DEFAULT 'pending',
      sender_name TEXT DEFAULT '',
      sender_phone TEXT DEFAULT '',
      sender_address TEXT DEFAULT '',
      receiver_name TEXT DEFAULT '',
      receiver_phone TEXT DEFAULT '',
      receiver_address TEXT DEFAULT '',
      express_company_id TEXT DEFAULT NULL,
      stored_at TEXT DEFAULT NULL,
      picked_up_at TEXT DEFAULT NULL,
      expiry_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (compartment_id) REFERENCES compartments(id),
      FOREIGN KEY (express_company_id) REFERENCES express_companies(id)
    );

    CREATE TABLE IF NOT EXISTS shipping_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      express_company_id TEXT NOT NULL,
      weight REAL NOT NULL DEFAULT 0,
      freight_amount REAL NOT NULL DEFAULT 0,
      insurance_amount REAL NOT NULL DEFAULT 0,
      insurance_deducted REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('pending','picked_up','in_transit','delivered','stored_in_cabinet')) DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (package_id) REFERENCES packages(id),
      FOREIGN KEY (express_company_id) REFERENCES express_companies(id)
    );

    CREATE TABLE IF NOT EXISTS storage_billings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      compartment_id TEXT NOT NULL,
      package_id TEXT DEFAULT NULL,
      billing_type TEXT NOT NULL CHECK(billing_type IN ('hourly','daily','monthly')) DEFAULT 'hourly',
      rate_per_unit REAL NOT NULL DEFAULT 0,
      start_time TEXT NOT NULL,
      end_time TEXT DEFAULT NULL,
      total_hours REAL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('active','settled','overdue')) DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (compartment_id) REFERENCES compartments(id),
      FOREIGN KEY (package_id) REFERENCES packages(id)
    );

    CREATE TABLE IF NOT EXISTS laundry_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      compartment_id TEXT DEFAULT NULL,
      clothing_type TEXT NOT NULL CHECK(clothing_type IN ('shirt','pants','coat','suit','shoes','other')) DEFAULT 'other',
      process_type TEXT NOT NULL CHECK(process_type IN ('dry_clean','wet_wash','iron','stain_removal','leather_care')) DEFAULT 'wet_wash',
      quantity INTEGER NOT NULL DEFAULT 1,
      pickup_address TEXT DEFAULT '',
      delivery_address TEXT DEFAULT '',
      status TEXT NOT NULL CHECK(status IN ('pending_pickup','picked_up','quality_check','processing','ready_delivery','delivered')) DEFAULT 'pending_pickup',
      quality_note TEXT DEFAULT '',
      estimated_price REAL DEFAULT 0,
      final_price REAL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (compartment_id) REFERENCES compartments(id)
    );

    CREATE TABLE IF NOT EXISTS housekeeping_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      cleaning_type TEXT NOT NULL CHECK(cleaning_type IN ('daily_deep','move_in_out','kitchen','bathroom','floor_windows')) DEFAULT 'daily_deep',
      duration_hours REAL NOT NULL DEFAULT 2,
      scheduled_time TEXT NOT NULL,
      address TEXT DEFAULT '',
      skill_tags TEXT DEFAULT '[]',
      assigned_staff TEXT DEFAULT '',
      staff_rating REAL DEFAULT 0,
      status TEXT NOT NULL CHECK(status IN ('pending','assigned','in_progress','completed','cancelled')) DEFAULT 'pending',
      amount REAL NOT NULL DEFAULT 0,
      review_score INTEGER DEFAULT NULL,
      review_content TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('package_arrival','expiry_warning','transfer_notice','laundry_update','housekeeping_update','coupon','payment')) DEFAULT 'package_arrival',
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cabinet_alerts (
      id TEXT PRIMARY KEY,
      cabinet_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('fault','low_usage','overdue','restock')) DEFAULT 'fault',
      message TEXT NOT NULL DEFAULT '',
      severity TEXT NOT NULL CHECK(severity IN ('low','medium','high','critical')) DEFAULT 'medium',
      is_resolved INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      resolved_at TEXT DEFAULT NULL,
      FOREIGN KEY (cabinet_id) REFERENCES cabinets(id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('laundry_discount','storage_discount','housekeeping_discount','shipping_discount')) DEFAULT 'storage_discount',
      discount_value REAL NOT NULL DEFAULT 0,
      min_order_amount REAL NOT NULL DEFAULT 0,
      valid_from TEXT NOT NULL,
      valid_to TEXT NOT NULL,
      usage_limit INTEGER NOT NULL DEFAULT 1,
      used_count INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS user_coupons (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      coupon_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('available','used','expired')) DEFAULT 'available',
      used_at TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    );

    CREATE TABLE IF NOT EXISTS service_reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      order_type TEXT NOT NULL CHECK(order_type IN ('shipping','storage','laundry','housekeeping')) DEFAULT 'shipping',
      order_id TEXT NOT NULL,
      rating INTEGER NOT NULL DEFAULT 5,
      content TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_compartments_cabinet ON compartments(cabinet_id);
    CREATE INDEX IF NOT EXISTS idx_compartments_status ON compartments(status);
    CREATE INDEX IF NOT EXISTS idx_packages_user ON packages(user_id);
    CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
    CREATE INDEX IF NOT EXISTS idx_packages_compartment ON packages(compartment_id);
    CREATE INDEX IF NOT EXISTS idx_shipping_user ON shipping_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_shipping_status ON shipping_orders(status);
    CREATE INDEX IF NOT EXISTS idx_storage_user ON storage_billings(user_id);
    CREATE INDEX IF NOT EXISTS idx_storage_status ON storage_billings(status);
    CREATE INDEX IF NOT EXISTS idx_laundry_user ON laundry_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_laundry_status ON laundry_orders(status);
    CREATE INDEX IF NOT EXISTS idx_housekeeping_user ON housekeeping_orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_housekeeping_status ON housekeeping_orders(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_cabinet_alerts_cabinet ON cabinet_alerts(cabinet_id);
    CREATE INDEX IF NOT EXISTS idx_cabinet_alerts_resolved ON cabinet_alerts(is_resolved);
    CREATE INDEX IF NOT EXISTS idx_user_coupons_user ON user_coupons(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_coupons_coupon ON user_coupons(coupon_id);
    CREATE INDEX IF NOT EXISTS idx_service_reviews_order ON service_reviews(order_type, order_id);
  `)
}

function seedData(): void {
  const d = getDb()
  const userCount = d.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }
  if (userCount.cnt > 0) return

  const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
  const saltRounds = 10
  const insertUser = d.prepare(`
    INSERT INTO users (id, username, phone, password_hash, real_name, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const adminHash = bcrypt.hashSync('admin123', saltRounds)
  insertUser.run(uuidv4(), 'admin', '13800000000', adminHash, '系统管理员', 'admin', now, now)

  const op1Hash = bcrypt.hashSync('op123456', saltRounds)
  insertUser.run(uuidv4(), 'operator1', '13800000001', op1Hash, '运营员张三', 'operator', now, now)
  const op2Hash = bcrypt.hashSync('op123456', saltRounds)
  insertUser.run(uuidv4(), 'operator2', '13800000002', op2Hash, '运营员李四', 'operator', now, now)

  const userHash = bcrypt.hashSync('user123', saltRounds)
  const userIds: string[] = []
  const userNames = ['王五', '赵六', '孙七', '周八', '吴九']
  const userPhones = ['13800000010', '13800000011', '13800000012', '13800000013', '13800000014']
  for (let i = 0; i < 5; i++) {
    const uid = uuidv4()
    userIds.push(uid)
    insertUser.run(uid, `user${i + 1}`, userPhones[i], userHash, userNames[i], 'user', now, now)
  }

  const insertCabinet = d.prepare(`
    INSERT INTO cabinets (id, name, location, address, status, total_compartments, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const cabinet1Id = uuidv4()
  const cabinet2Id = uuidv4()
  const cabinet3Id = uuidv4()
  insertCabinet.run(cabinet1Id, '朝阳大悦城智能柜', '朝阳区大悦城B1层', '北京市朝阳区朝阳北路101号', 'online', 12, now, now)
  insertCabinet.run(cabinet2Id, '望京SOHO智能柜', '望京SOHO T1大堂', '北京市朝阳区望京街10号', 'online', 9, now, now)
  insertCabinet.run(cabinet3Id, '国贸中心智能柜', '国贸中心B2层', '北京市朝阳区建国门外大街1号', 'maintenance', 6, now, now)

  const insertCompartment = d.prepare(`
    INSERT INTO compartments (id, cabinet_id, code, size, status, temperature_zone, current_package_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?)
  `)

  const sizes: Array<{ size: 'small' | 'medium' | 'large' | 'xlarge'; count: number }> = [
    { size: 'small', count: 5 },
    { size: 'medium', count: 4 },
    { size: 'large', count: 2 },
    { size: 'xlarge', count: 1 },
  ]
  const cabinet1Compartments: string[] = []
  let codeIndex = 1
  for (const { size, count } of sizes) {
    for (let j = 0; j < count; j++) {
      const cid = uuidv4()
      cabinet1Compartments.push(cid)
      const code = `A-${String(codeIndex).padStart(3, '0')}`
      const tempZone = size === 'small' ? 'normal' : size === 'medium' ? 'normal' : size === 'large' ? 'cold' : 'frozen'
      insertCompartment.run(cid, cabinet1Id, code, size, 'available', tempZone, now, now)
      codeIndex++
    }
  }

  const cabinet2Compartments: string[] = []
  const sizes2: Array<{ size: 'small' | 'medium' | 'large' | 'xlarge'; count: number }> = [
    { size: 'small', count: 4 },
    { size: 'medium', count: 3 },
    { size: 'large', count: 1 },
    { size: 'xlarge', count: 1 },
  ]
  codeIndex = 1
  for (const { size, count } of sizes2) {
    for (let j = 0; j < count; j++) {
      const cid = uuidv4()
      cabinet2Compartments.push(cid)
      const code = `B-${String(codeIndex).padStart(3, '0')}`
      const tempZone = size === 'large' ? 'cold' : size === 'xlarge' ? 'frozen' : 'normal'
      insertCompartment.run(cid, cabinet2Id, code, size, 'available', tempZone, now, now)
      codeIndex++
    }
  }

  const cabinet3Compartments: string[] = []
  const sizes3: Array<{ size: 'small' | 'medium' | 'large' | 'xlarge'; count: number }> = [
    { size: 'small', count: 2 },
    { size: 'medium', count: 2 },
    { size: 'large', count: 1 },
    { size: 'xlarge', count: 1 },
  ]
  codeIndex = 1
  for (const { size, count } of sizes3) {
    for (let j = 0; j < count; j++) {
      const cid = uuidv4()
      cabinet3Compartments.push(cid)
      const code = `C-${String(codeIndex).padStart(3, '0')}`
      const tempZone = size === 'xlarge' ? 'frozen' : 'normal'
      insertCompartment.run(cid, cabinet3Id, code, size, 'available', tempZone, now, now)
      codeIndex++
    }
  }

  const insertExpress = d.prepare(`
    INSERT INTO express_companies (id, name, code, api_url, freight_template, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `)

  const sfId = uuidv4()
  const ztId = uuidv4()
  const ytId = uuidv4()
  insertExpress.run(sfId, '顺丰速运', 'SF', 'https://api.sf-express.com', JSON.stringify({ multiplier: 1.3 }), now)
  insertExpress.run(ztId, '中通快递', 'ZTO', 'https://api.zto.com', JSON.stringify({ multiplier: 1.0 }), now)
  insertExpress.run(ytId, '圆通速递', 'YTO', 'https://api.yto.net.cn', JSON.stringify({ multiplier: 0.9 }), now)

  const insertPackage = d.prepare(`
    INSERT INTO packages (id, tracking_number, user_id, compartment_id, type, status,
      sender_name, sender_phone, sender_address, receiver_name, receiver_phone, receiver_address,
      express_company_id, stored_at, picked_up_at, expiry_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const pkg1Id = uuidv4()
  const pkg2Id = uuidv4()
  const pkg3Id = uuidv4()
  const pkg4Id = uuidv4()
  const pkg5Id = uuidv4()

  insertPackage.run(
    pkg1Id, 'SF1234567890', userIds[0], cabinet1Compartments[0], 'receive', 'stored',
    '张明', '13900000001', '上海市浦东新区陆家嘴', '王五', userPhones[0], '北京市朝阳区',
    sfId, now, null, dayjs().add(48, 'hour').format('YYYY-MM-DD HH:mm:ss'), now, now
  )

  insertPackage.run(
    pkg2Id, 'ZTO2345678901', userIds[1], cabinet1Compartments[5], 'receive', 'stored',
    '刘芳', '13900000002', '广州市天河区', '赵六', userPhones[1], '北京市朝阳区',
    ztId, now, null, dayjs().add(48, 'hour').format('YYYY-MM-DD HH:mm:ss'), now, now
  )

  insertPackage.run(
    pkg3Id, 'YTO3456789012', userIds[2], null, 'send', 'pending',
    '孙七', userPhones[2], '北京市海淀区', '陈伟', '13900000003', '深圳市南山区',
    ytId, null, null, dayjs().add(72, 'hour').format('YYYY-MM-DD HH:mm:ss'), now, now
  )

  insertPackage.run(
    pkg4Id, 'SF4567890123', userIds[0], cabinet2Compartments[0], 'receive', 'picked_up',
    '李强', '13900000004', '成都市武侯区', '王五', userPhones[0], '北京市朝阳区',
    sfId, dayjs().add(-24, 'hour').format('YYYY-MM-DD HH:mm:ss'), dayjs().add(-2, 'hour').format('YYYY-MM-DD HH:mm:ss'), null, dayjs().add(-24, 'hour').format('YYYY-MM-DD HH:mm:ss'), now
  )

  insertPackage.run(
    pkg5Id, 'ZTO5678901234', userIds[3], cabinet1Compartments[6], 'store', 'stored',
    '周八', userPhones[3], '', '周八', userPhones[3], '',
    null, now, null, dayjs().add(168, 'hour').format('YYYY-MM-DD HH:mm:ss'), now, now
  )

  d.prepare(`UPDATE compartments SET status = 'occupied', current_package_id = ? WHERE id = ?`).run(pkg1Id, cabinet1Compartments[0])
  d.prepare(`UPDATE compartments SET status = 'occupied', current_package_id = ? WHERE id = ?`).run(pkg2Id, cabinet1Compartments[5])
  d.prepare(`UPDATE compartments SET status = 'occupied', current_package_id = ? WHERE id = ?`).run(pkg5Id, cabinet1Compartments[6])

  const insertShipping = d.prepare(`
    INSERT INTO shipping_orders (id, user_id, package_id, express_company_id, weight, freight_amount, insurance_amount, insurance_deducted, total_amount, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertShipping.run(uuidv4(), userIds[2], pkg3Id, ytId, 2.5, 15, 5, 3, 17, 'pending', now, now)
  insertShipping.run(uuidv4(), userIds[0], pkg4Id, sfId, 1.2, 15.6, 3, 2, 16.6, 'delivered', dayjs().add(-24, 'hour').format('YYYY-MM-DD HH:mm:ss'), now)

  const insertLaundry = d.prepare(`
    INSERT INTO laundry_orders (id, user_id, compartment_id, clothing_type, process_type, quantity, pickup_address, delivery_address, status, quality_note, estimated_price, final_price, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertLaundry.run(uuidv4(), userIds[0], cabinet1Compartments[1], 'coat', 'dry_clean', 2, '北京市朝阳区大悦城附近', '北京市朝阳区大悦城附近', 'processing', '面料良好，无特殊污渍', 120, 0, now, now)
  insertLaundry.run(uuidv4(), userIds[1], cabinet2Compartments[1], 'shirt', 'wet_wash', 3, '北京市望京SOHO', '北京市望京SOHO', 'pending_pickup', '', 90, 0, now, now)
  insertLaundry.run(uuidv4(), userIds[2], null, 'suit', 'dry_clean', 1, '北京市海淀区中关村', '北京市海淀区中关村', 'ready_delivery', '西装保存完好', 200, 200, dayjs().add(-48, 'hour').format('YYYY-MM-DD HH:mm:ss'), now)

  const insertHousekeeping = d.prepare(`
    INSERT INTO housekeeping_orders (id, user_id, cleaning_type, duration_hours, scheduled_time, address, skill_tags, assigned_staff, staff_rating, status, amount, review_score, review_content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertHousekeeping.run(uuidv4(), userIds[0], 'daily_deep', 3, dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss'), '北京市朝阳区朝阳北路101号', JSON.stringify(['daily_deep', 'kitchen']), '保洁阿姨A', 4.8, 'assigned', 240, null, '', now, now)
  insertHousekeeping.run(uuidv4(), userIds[1], 'move_in_out', 8, dayjs().add(2, 'day').format('YYYY-MM-DD HH:mm:ss'), '北京市望京街10号', JSON.stringify(['move_in_out', 'floor_windows']), '', 0, 'pending', 640, null, '', now, now)
  insertHousekeeping.run(uuidv4(), userIds[3], 'kitchen', 2, dayjs().add(-1, 'day').format('YYYY-MM-DD HH:mm:ss'), '北京市朝阳区建国门外大街1号', JSON.stringify(['kitchen']), '保洁阿姨B', 4.5, 'completed', 160, 5, '非常干净，很满意', dayjs().add(-2, 'day').format('YYYY-MM-DD HH:mm:ss'), now)

  const insertNotification = d.prepare(`
    INSERT INTO notifications (id, user_id, type, title, content, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  insertNotification.run(uuidv4(), userIds[0], 'package_arrival', '快递到达通知', '您的快递 SF1234567890 已存入朝阳大悦城智能柜 A-001，请48小时内取件。', 0, now)
  insertNotification.run(uuidv4(), userIds[1], 'package_arrival', '快递到达通知', '您的快递 ZTO2345678901 已存入朝阳大悦城智能柜 A-006，请48小时内取件。', 0, now)
  insertNotification.run(uuidv4(), userIds[0], 'laundry_update', '洗衣服务更新', '您的2件大衣干洗订单正在处理中，预计明日完成。', 0, now)
  insertNotification.run(uuidv4(), userIds[0], 'expiry_warning', '存储到期提醒', '您在朝阳大悦城智能柜的存储物品即将到期，请及时取件。', 1, dayjs().add(-12, 'hour').format('YYYY-MM-DD HH:mm:ss'))
  insertNotification.run(uuidv4(), userIds[3], 'housekeeping_update', '家政服务完成', '您的厨房保洁服务已完成，欢迎评价。', 1, dayjs().add(-1, 'day').format('YYYY-MM-DD HH:mm:ss'))

  const insertAlert = d.prepare(`
    INSERT INTO cabinet_alerts (id, cabinet_id, type, message, severity, is_resolved, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertAlert.run(uuidv4(), cabinet3Id, 'fault', 'C-004格口门锁故障，无法正常开启', 'high', 0, now, null)
  insertAlert.run(uuidv4(), cabinet1Id, 'low_usage', '大号格口使用率低于20%，建议调整格口配置', 'low', 0, now, null)
  insertAlert.run(uuidv4(), cabinet2Id, 'restock', 'B-009格口耗材不足，需要补充取件码打印纸', 'medium', 0, now, null)
  insertAlert.run(uuidv4(), cabinet1Id, 'overdue', '3件快递超过48小时未取件，请联系收件人', 'medium', 0, dayjs().add(-6, 'hour').format('YYYY-MM-DD HH:mm:ss'), null)

  const insertCoupon = d.prepare(`
    INSERT INTO coupons (id, code, type, discount_value, min_order_amount, valid_from, valid_to, usage_limit, used_count, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `)

  const coupon1Id = uuidv4()
  const coupon2Id = uuidv4()
  const coupon3Id = uuidv4()
  const coupon4Id = uuidv4()

  insertCoupon.run(coupon1Id, 'LAUNDRY20', 'laundry_discount', 20, 50, now, dayjs().add(30, 'day').format('YYYY-MM-DD HH:mm:ss'), 100, 0, now)
  insertCoupon.run(coupon2Id, 'STORAGE10', 'storage_discount', 10, 30, now, dayjs().add(30, 'day').format('YYYY-MM-DD HH:mm:ss'), 200, 0, now)
  insertCoupon.run(coupon3Id, 'HOME50', 'housekeeping_discount', 50, 200, now, dayjs().add(15, 'day').format('YYYY-MM-DD HH:mm:ss'), 50, 0, now)
  insertCoupon.run(coupon4Id, 'SHIP5', 'shipping_discount', 5, 10, now, dayjs().add(30, 'day').format('YYYY-MM-DD HH:mm:ss'), 300, 0, now)

  const insertUserCoupon = d.prepare(`
    INSERT INTO user_coupons (id, user_id, coupon_id, status, used_at, created_at)
    VALUES (?, ?, ?, ?, NULL, ?)
  `)

  insertUserCoupon.run(uuidv4(), userIds[0], coupon1Id, 'available', now)
  insertUserCoupon.run(uuidv4(), userIds[0], coupon2Id, 'available', now)
  insertUserCoupon.run(uuidv4(), userIds[1], coupon3Id, 'available', now)
  insertUserCoupon.run(uuidv4(), userIds[2], coupon4Id, 'available', now)
  insertUserCoupon.run(uuidv4(), userIds[3], coupon2Id, 'available', now)

  console.log('Database seeded with initial data.')
}
