const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dataDir = path.join(__dirname, '../../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'app.sqlite')
const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS floors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('desk', 'office', 'meeting_room')),
    name TEXT NOT NULL,
    floor_id INTEGER REFERENCES floors(id),
    capacity INTEGER DEFAULT 1,
    price_hourly REAL,
    price_daily REAL,
    price_monthly REAL,
    status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'maintenance', 'occupied')),
    equipment TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES companies(id),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT UNIQUE,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES companies(id),
    member_count INTEGER DEFAULT 1,
    package_type TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent REAL NOT NULL,
    deposit REAL DEFAULT 0,
    benefits TEXT,
    invoice_info TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'terminated', 'pending_renewal')),
    renewal_reminder_sent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contract_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER REFERENCES contracts(id) ON DELETE CASCADE,
    resource_id INTEGER REFERENCES resources(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resource_id INTEGER REFERENCES resources(id),
    member_id INTEGER REFERENCES members(id),
    title TEXT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    attendees INTEGER DEFAULT 1,
    status TEXT DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'cancelled', 'completed', 'no_show')),
    cancelled_at DATETIME,
    cancelled_reason TEXT,
    actual_end_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER REFERENCES companies(id),
    contract_id INTEGER REFERENCES contracts(id),
    bill_no TEXT UNIQUE NOT NULL,
    bill_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount REAL NOT NULL DEFAULT 0,
    paid_amount REAL DEFAULT 0,
    status TEXT DEFAULT 'unpaid' CHECK(status IN ('unpaid', 'partial', 'paid', 'overdue')),
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('rent', 'meeting_room', 'print', 'parking', 'other')),
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price REAL NOT NULL,
    amount REAL NOT NULL,
    reference_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER REFERENCES bills(id),
    amount REAL NOT NULL,
    payment_method TEXT,
    payment_date DATE NOT NULL,
    transaction_no TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_bookings_resource_time ON bookings(resource_id, start_time, end_time);
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
  CREATE INDEX IF NOT EXISTS idx_bills_company ON bills(company_id);
  CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
  CREATE INDEX IF NOT EXISTS idx_contracts_company ON contracts(company_id);
  CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
  CREATE INDEX IF NOT EXISTS idx_resources_type ON resources(type);
  CREATE INDEX IF NOT EXISTS idx_resources_status ON resources(status);
`)

const floorCount = db.prepare('SELECT COUNT(*) as count FROM floors').get().count
if (floorCount === 0) {
  const floorStmt = db.prepare('INSERT INTO floors (name, description) VALUES (?, ?)')
  floorStmt.run('1F', '一楼大堂及开放办公区')
  floorStmt.run('2F', '二楼独立办公室及会议室')
  floorStmt.run('3F', '三楼VIP专区')
}

const resourceCount = db.prepare('SELECT COUNT(*) as count FROM resources').get().count
if (resourceCount === 0) {
  const resourceStmt = db.prepare(`
    INSERT INTO resources (type, name, floor_id, capacity, price_hourly, price_daily, price_monthly, equipment, description, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  for (let i = 1; i <= 20; i++) {
    resourceStmt.run('desk', `A${String(i).padStart(3, '0')}`, 1, 1, 15, 80, 1200, null, '开放工位', 'available')
  }
  
  resourceStmt.run('office', 'B201', 2, 8, null, null, 12000, null, '8人独立办公室', 'available')
  resourceStmt.run('office', 'B202', 2, 12, null, null, 18000, null, '12人独立办公室', 'available')
  resourceStmt.run('office', 'B203', 2, 6, null, null, 9000, null, '6人独立办公室', 'available')
  
  resourceStmt.run('meeting_room', 'M201-小会议室', 2, 6, 80, 400, null, '投影仪,白板,视频会议', '6人小型会议室', 'available')
  resourceStmt.run('meeting_room', 'M202-中会议室', 2, 12, 150, 800, null, '投影仪,白板,视频会议,电话会议', '12人中型会议室', 'available')
  resourceStmt.run('meeting_room', 'M301-大会议室', 3, 30, 300, 1500, null, '投影仪,白板,视频会议,音响系统', '30人大型培训室', 'maintenance')
}

const companyCount = db.prepare('SELECT COUNT(*) as count FROM companies').get().count
if (companyCount === 0) {
  const companyStmt = db.prepare('INSERT INTO companies (name, contact_person, contact_phone, contact_email) VALUES (?, ?, ?, ?)')
  const companyId = companyStmt.run('科技创新有限公司', '张三', '13800138001', 'zhangsan@tech.com').lastInsertRowid
  
  const memberStmt = db.prepare('INSERT INTO members (company_id, name, phone, email) VALUES (?, ?, ?, ?)')
  memberStmt.run(companyId, '张三', '13800138001', 'zhangsan@tech.com')
  memberStmt.run(companyId, '李四', '13800138002', 'lisi@tech.com')
  
  const today = new Date()
  const endDate = new Date(today)
  endDate.setMonth(endDate.getMonth() + 12)
  
  const contractStmt = db.prepare(`
    INSERT INTO contracts (company_id, member_count, package_type, start_date, end_date, monthly_rent, deposit, benefits)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  contractStmt.run(companyId, 5, '企业套餐', today.toISOString().split('T')[0], endDate.toISOString().split('T')[0], 8000, 16000, '24小时门禁,免费咖啡,打印折扣')
}

console.log('Database initialized successfully')
console.log('Database path:', dbPath)

db.close()
