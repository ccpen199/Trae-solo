import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const resolvedDbPath = path.resolve(path.join(__dirname, '../../'), dbPath);

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = new Database(resolvedDbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function initDatabase(): void {
  const database = getDatabase();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'property', 'resident', 'merchant')),
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      avatar TEXT,
      skills TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS buildings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      total_floors INTEGER NOT NULL DEFAULT 0,
      total_units INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building_id INTEGER NOT NULL,
      unit_number TEXT NOT NULL,
      floor INTEGER NOT NULL,
      area REAL NOT NULL DEFAULT 0,
      owner_name TEXT,
      owner_phone TEXT,
      status TEXT NOT NULL DEFAULT 'vacant' CHECK(status IN ('occupied', 'vacant', 'rented')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER NOT NULL,
      user_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      id_card TEXT,
      relation TEXT NOT NULL CHECK(relation IN ('owner', 'tenant', 'family')),
      move_in_date TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS work_tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('repair', 'complaint', 'suggestion', 'service')),
      priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'assigned', 'processing', 'completed', 'cancelled')),
      reporter_id INTEGER NOT NULL,
      assignee_id INTEGER,
      unit_id INTEGER,
      location TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      scheduled_at TEXT,
      started_at TEXT,
      completed_at TEXT,
      rating INTEGER,
      feedback TEXT,
      skills_required TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      FOREIGN KEY (unit_id) REFERENCES units(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('notice', 'activity', 'news', 'help')),
      author_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
      views INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      description TEXT,
      business_hours TEXT,
      rating REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'suspended')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS market_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      original_price REAL,
      images TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'on_sale' CHECK(status IN ('on_sale', 'off_sale', 'sold_out')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pickup_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      contact_name TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      business_hours TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fee_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER NOT NULL,
      unit_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('property', 'water', 'electricity', 'gas', 'parking', 'other')),
      amount REAL NOT NULL DEFAULT 0,
      billing_month TEXT NOT NULL,
      due_date TEXT NOT NULL,
      paid_at TEXT,
      status TEXT NOT NULL DEFAULT 'unpaid' CHECK(status IN ('unpaid', 'paid', 'overdue', 'cancelled')),
      payment_method TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resident_id) REFERENCES residents(id),
      FOREIGN KEY (unit_id) REFERENCES units(id)
    );

    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      resident_name TEXT,
      phone TEXT,
      access_type TEXT NOT NULL CHECK(access_type IN ('enter', 'exit', 'visitor_enter', 'visitor_exit')),
      location TEXT NOT NULL,
      device TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  seedData(database);
}

function seedData(database: Database.Database): void {
  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const hashPassword = (password: string) => bcrypt.hashSync(password, 10);
  const defaultPassword = hashPassword('123456');

  const insertUser = database.prepare(`
    INSERT INTO users (username, password, role, name, phone, skills, status)
    VALUES (?, ?, ?, ?, ?, ?, 'active')
  `);

  const adminId = insertUser.run('admin', defaultPassword, 'admin', '系统管理员', '13800138000', null).lastInsertRowid;
  const property1Id = insertUser.run('property1', defaultPassword, 'property', '物业张工', '13800138001', '水电维修,管道疏通,家电维修').lastInsertRowid;
  const property2Id = insertUser.run('property2', defaultPassword, 'property', '物业李工', '13800138002', '水电维修,门窗维修,网络维护').lastInsertRowid;
  const property3Id = insertUser.run('property3', defaultPassword, 'property', '物业王工', '13800138003', '保洁服务,绿化养护,公共设施').lastInsertRowid;
  const resident1Id = insertUser.run('resident1', defaultPassword, 'resident', '张三', '13900139001', null).lastInsertRowid;
  const resident2Id = insertUser.run('resident2', defaultPassword, 'resident', '李四', '13900139002', null).lastInsertRowid;
  const merchant1Id = insertUser.run('merchant1', defaultPassword, 'merchant', '便利店老板', '13700137001', null).lastInsertRowid;

  const insertBuilding = database.prepare(`
    INSERT INTO buildings (name, address, total_floors, total_units, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  const building1Id = insertBuilding.run('1号楼', '阳光花园小区1号楼', 25, 100, '高层住宅，两梯四户').lastInsertRowid;
  const building2Id = insertBuilding.run('2号楼', '阳光花园小区2号楼', 18, 72, '小高层住宅，两梯四户').lastInsertRowid;
  const building3Id = insertBuilding.run('3号楼', '阳光花园小区3号楼', 30, 120, '高层住宅，三梯六户').lastInsertRowid;

  const insertUnit = database.prepare(`
    INSERT INTO units (building_id, unit_number, floor, area, owner_name, owner_phone, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const unit1Id = insertUnit.run(building1Id, '1-0101', 1, 95.5, '张三', '13900139001', 'occupied').lastInsertRowid;
  const unit2Id = insertUnit.run(building1Id, '1-0102', 1, 88.0, '李四', '13900139002', 'occupied').lastInsertRowid;
  const unit3Id = insertUnit.run(building1Id, '1-0201', 2, 95.5, null, null, 'vacant').lastInsertRowid;
  const unit4Id = insertUnit.run(building2Id, '2-0503', 5, 102.0, '王五', '13900139003', 'rented').lastInsertRowid;

  const insertResident = database.prepare(`
    INSERT INTO residents (unit_id, user_id, name, phone, id_card, relation, move_in_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertResident.run(unit1Id, resident1Id, '张三', '13900139001', '110101199001011234', 'owner', '2023-01-15');
  insertResident.run(unit2Id, resident2Id, '李四', '13900139002', '110101199002022345', 'owner', '2023-03-20');

  const insertTicket = database.prepare(`
    INSERT INTO work_tickets (title, description, type, priority, status, reporter_id, assignee_id, unit_id, location, contact_name, contact_phone, skills_required, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  insertTicket.run(
    '卫生间水管漏水',
    '卫生间主水管接口处漏水，需要紧急处理。漏水情况比较严重，已经影响到楼下邻居。',
    'repair',
    'urgent',
    'processing',
    resident1Id,
    property1Id,
    unit1Id,
    '1号楼1单元0101',
    '张三',
    '13900139001',
    '管道疏通,水电维修',
    tomorrow.toISOString()
  );

  insertTicket.run(
    '楼道灯不亮',
    '15层楼道的照明灯坏了，晚上上下楼很不方便，希望尽快维修。',
    'repair',
    'medium',
    'pending',
    resident2Id,
    null,
    unit2Id,
    '1号楼2单元15层楼道',
    '李四',
    '13900139002',
    '水电维修',
    null
  );

  insertTicket.run(
    '建议增加健身器材',
    '小区内的健身器材太少了，建议在小广场增加一些健身器材，方便居民锻炼身体。',
    'suggestion',
    'low',
    'completed',
    resident1Id,
    property3Id,
    null,
    '小区小广场',
    '张三',
    '13900139001',
    null,
    yesterday.toISOString()
  );

  insertTicket.run(
    '垃圾分类问题投诉',
    '最近发现有些居民不按规定分类投放垃圾，垃圾桶周围很脏，希望物业加强管理。',
    'complaint',
    'high',
    'assigned',
    resident2Id,
    property3Id,
    null,
    '1号楼垃圾投放点',
    '李四',
    '13900139002',
    '保洁服务',
    tomorrow.toISOString()
  );

  const insertPost = database.prepare(`
    INSERT INTO posts (title, content, category, author_id, status, views)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertPost.run(
    '关于小区停水通知',
    '尊敬的各位业主：\n\n因市政管网维修，本小区将于2024年1月15日9:00-17:00停水，请提前做好储水准备。\n\n给您带来不便，敬请谅解！\n\n物业管理处\n2024年1月14日',
    'notice',
    adminId,
    'published',
    156
  );

  insertPost.run(
    '春节联欢晚会活动通知',
    '亲爱的居民朋友们：\n\n一年一度的春节即将到来，为丰富小区文化生活，增进邻里感情，物业决定举办春节联欢晚会活动。\n\n活动时间：2024年2月8日 19:00-21:00\n活动地点：小区中心广场\n\n欢迎各位业主积极报名参加节目表演！',
    'activity',
    adminId,
    'published',
    234
  );

  insertPost.run(
    '小区获评"市文明小区"称号',
    '热烈祝贺阳光花园小区在2023年度市级文明创建评比中，荣获"市文明小区"荣誉称号！\n\n这一荣誉的取得，离不开全体业主的共同努力和支持。希望大家继续保持，共同维护我们美好的家园。',
    'news',
    adminId,
    'published',
    312
  );

  const insertMerchant = database.prepare(`
    INSERT INTO merchants (user_id, name, category, phone, address, description, business_hours, rating, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const merchantId = insertMerchant.run(
    merchant1Id,
    '阳光便利店',
    '超市零售',
    '13700137001',
    '小区1号楼底商',
    '提供日常生活用品、食品饮料、零食等，24小时营业',
    '24小时营业',
    4.8,
    'approved'
  ).lastInsertRowid;

  insertMerchant.run(
    null,
    '张阿姨家政',
    '家政服务',
    '13600136001',
    '小区2号楼底商',
    '提供保洁、保姆、月嫂等家政服务',
    '周一至周日 8:00-20:00',
    4.6,
    'approved'
  );

  const insertMarketItem = database.prepare(`
    INSERT INTO market_items (merchant_id, title, description, category, price, original_price, stock, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMarketItem.run(
    merchantId,
    '新鲜鸡蛋(30枚)',
    '农家散养土鸡蛋，新鲜营养，每盒30枚',
    '食品生鲜',
    25.8,
    29.8,
    50,
    'on_sale'
  );

  insertMarketItem.run(
    merchantId,
    '5L桶装饮用水',
    '优质桶装饮用水，送货上门',
    '生活用品',
    12.0,
    15.0,
    100,
    'on_sale'
  );

  const insertPickupPoint = database.prepare(`
    INSERT INTO pickup_points (name, address, contact_name, contact_phone, business_hours, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertPickupPoint.run(
    '菜鸟驿站(阳光花园店)',
    '小区3号楼底商',
    '王师傅',
    '13500135001',
    '周一至周日 8:00-21:00',
    'active'
  );

  insertPickupPoint.run(
    '丰巢快递柜',
    '小区1号楼东侧',
    '客服热线',
    '4000633333',
    '24小时',
    'active'
  );

  const insertFeeBill = database.prepare(`
    INSERT INTO fee_bills (resident_id, unit_id, type, amount, billing_month, due_date, paid_at, status, payment_method)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertFeeBill.run(
    1,
    unit1Id,
    'property',
    286.5,
    '2024-01',
    '2024-01-31',
    '2024-01-15',
    'paid',
    '微信支付'
  );

  insertFeeBill.run(
    1,
    unit1Id,
    'water',
    45.0,
    '2024-01',
    '2024-01-31',
    '2024-01-15',
    'paid',
    '微信支付'
  );

  insertFeeBill.run(
    1,
    unit1Id,
    'electricity',
    189.5,
    '2024-01',
    '2024-01-31',
    null,
    'unpaid',
    null
  );

  insertFeeBill.run(
    2,
    unit2Id,
    'property',
    264.0,
    '2024-01',
    '2024-01-31',
    null,
    'unpaid',
    null
  );

  const insertAccessLog = database.prepare(`
    INSERT INTO access_logs (user_id, resident_name, phone, access_type, location, device, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertAccessLog.run(resident1Id, '张三', '13900139001', 'enter', '小区正门', '人脸识别', null);
  insertAccessLog.run(resident1Id, '张三', '13900139001', 'exit', '小区正门', '人脸识别', null);
  insertAccessLog.run(resident2Id, '李四', '13900139002', 'enter', '小区北门', '刷卡', null);
  insertAccessLog.run(null, '快递员', '13000130001', 'visitor_enter', '小区正门', '登记', '派送快递');
}

export default getDatabase;
