import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = dirname(__dirname);

const dbDir = join(projectRoot, 'data');
mkdirSync(dbDir, { recursive: true });

const dbPath = join(projectRoot, 'data', 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('customer','service_agent','dispatcher','engineer','finance')),
    phone TEXT,
    skills TEXT DEFAULT '[]',
    area TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    province TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,
    street TEXT,
    detail TEXT,
    contact_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    is_default INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS work_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no TEXT UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    address_id INTEGER,
    fault_description TEXT NOT NULL,
    photos TEXT DEFAULT '[]',
    expected_time TEXT,
    warranty_type TEXT DEFAULT 'none' CHECK(warranty_type IN ('none','in_warranty','out_warranty')),
    warranty_proof TEXT,
    service_type TEXT,
    priority TEXT DEFAULT 'normal' CHECK(priority IN ('low','normal','high','urgent')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','dispatched','accepted','departed','arrived','repairing','quoting','confirmed','completed','cancelled','exception')),
    sla_deadline TEXT,
    in_service_area INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (address_id) REFERENCES addresses(id)
  );

  CREATE TABLE IF NOT EXISTS dispatch_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    engineer_id INTEGER NOT NULL,
    dispatcher_id INTEGER,
    dispatch_type TEXT DEFAULT 'manual' CHECK(dispatch_type IN ('auto','manual')),
    recommendation_score REAL,
    recommendation_reason TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','cancelled')),
    dispatched_at TEXT DEFAULT (datetime('now')),
    responded_at TEXT,
    FOREIGN KEY (order_id) REFERENCES work_orders(id),
    FOREIGN KEY (engineer_id) REFERENCES users(id),
    FOREIGN KEY (dispatcher_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS service_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    engineer_id INTEGER NOT NULL,
    accepted_at TEXT,
    departed_at TEXT,
    arrived_at TEXT,
    repair_description TEXT,
    repair_photos TEXT DEFAULT '[]',
    completion_at TEXT,
    user_signature TEXT,
    status TEXT,
    FOREIGN KEY (order_id) REFERENCES work_orders(id),
    FOREIGN KEY (engineer_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS parts_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_record_id INTEGER NOT NULL,
    part_name TEXT NOT NULL,
    part_code TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL DEFAULT 0,
    total_price REAL NOT NULL DEFAULT 0,
    FOREIGN KEY (service_record_id) REFERENCES service_records(id)
  );

  CREATE TABLE IF NOT EXISTS cost_quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    service_record_id INTEGER,
    labor_cost REAL DEFAULT 0,
    parts_cost REAL DEFAULT 0,
    travel_cost REAL DEFAULT 0,
    other_cost REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    cost_description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','rejected')),
    confirmed_by INTEGER,
    confirmed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES work_orders(id),
    FOREIGN KEY (service_record_id) REFERENCES service_records(id),
    FOREIGN KEY (confirmed_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS exceptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    engineer_id INTEGER,
    type TEXT NOT NULL CHECK(type IN ('no_contact','wrong_address','out_of_stock','user_refuse','second_visit','other')),
    description TEXT,
    handling_result TEXT,
    handler_id INTEGER,
    handled_at TEXT,
    status TEXT DEFAULT 'open' CHECK(status IN ('open','resolved')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES work_orders(id),
    FOREIGN KEY (engineer_id) REFERENCES users(id),
    FOREIGN KEY (handler_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settlements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    engineer_id INTEGER NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    order_count INTEGER DEFAULT 0,
    labor_income REAL DEFAULT 0,
    parts_income REAL DEFAULT 0,
    travel_subsidy REAL DEFAULT 0,
    other_subsidy REAL DEFAULT 0,
    total_income REAL DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','confirmed','paid')),
    confirmed_by INTEGER,
    confirmed_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (engineer_id) REFERENCES users(id),
    FOREIGN KEY (confirmed_by) REFERENCES users(id)
  );
`);

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, name, role, phone, skills, area, status)
    VALUES (@username, @password, @name, @role, @phone, @skills, @area, @status)
  `);

  const seedUsers = [
    { username: 'customer1', password: '123456', name: '张客户', role: 'customer', phone: '13800000001', skills: '[]', area: '北京市', status: 'active' },
    { username: 'agent1', password: '123456', name: '李客服', role: 'service_agent', phone: '13800000002', skills: '[]', area: '北京市', status: 'active' },
    { username: 'dispatcher1', password: '123456', name: '王调度', role: 'dispatcher', phone: '13800000003', skills: '[]', area: '北京市', status: 'active' },
    { username: 'engineer1', password: '123456', name: '赵工程师', role: 'engineer', phone: '13800000004', skills: '["空调维修","冰箱维修","洗衣机维修"]', area: '北京市/朝阳区', status: 'active' },
    { username: 'finance1', password: '123456', name: '刘财务', role: 'finance', phone: '13800000005', skills: '[]', area: '北京市', status: 'active' },
  ];

  const insertAddress = db.prepare(`
    INSERT INTO addresses (user_id, province, city, district, street, detail, contact_name, contact_phone, is_default)
    VALUES (@user_id, @province, @city, @district, @street, @detail, @contact_name, @contact_phone, @is_default)
  `);

  const insertOrder = db.prepare(`
    INSERT INTO work_orders (order_no, user_id, address_id, fault_description, photos, expected_time, warranty_type, service_type, priority, status, sla_deadline, in_service_area)
    VALUES (@order_no, @user_id, @address_id, @fault_description, @photos, @expected_time, @warranty_type, @service_type, @priority, @status, @sla_deadline, @in_service_area)
  `);

  const transaction = db.transaction(() => {
    for (const u of seedUsers) {
      insertUser.run(u);
    }

    insertAddress.run({
      user_id: 1, province: '北京市', city: '北京市', district: '朝阳区',
      street: '建国路', detail: '88号SOHO现代城A座1201',
      contact_name: '张客户', contact_phone: '13800000001', is_default: 1
    });
    insertAddress.run({
      user_id: 1, province: '北京市', city: '北京市', district: '海淀区',
      street: '中关村大街', detail: '15号中关村科技大厦3层',
      contact_name: '张客户', contact_phone: '13800000001', is_default: 0
    });

    const slaDeadline = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

    insertOrder.run({
      order_no: 'WO202605280001', user_id: 1, address_id: 1,
      fault_description: '空调不制冷，室内机有异响', photos: '[]',
      expected_time: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      warranty_type: 'in_warranty', service_type: '空调维修',
      priority: 'high', status: 'pending', sla_deadline: slaDeadline, in_service_area: 1
    });

    insertOrder.run({
      order_no: 'WO202605280002', user_id: 1, address_id: 2,
      fault_description: '冰箱冷藏室温度过高，无法正常保鲜', photos: '[]',
      expected_time: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      warranty_type: 'out_warranty', service_type: '冰箱维修',
      priority: 'normal', status: 'pending',
      sla_deadline: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
      in_service_area: 1
    });
  });

  transaction();
}

export default db;
