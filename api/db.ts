import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'app.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('company','store','team')),
    parent_id INTEGER REFERENCES organizations(id),
    director_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK(role IN ('director','manager','agent','admin','platform','ops')) DEFAULT 'agent',
    org_id INTEGER REFERENCES organizations(id),
    cert_status TEXT DEFAULT 'pending' CHECK(cert_status IN ('pending','certified','rejected')),
    real_name TEXT,
    id_card TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS houses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    address TEXT NOT NULL,
    lng REAL,
    lat REAL,
    price DECIMAL(12,2),
    unit_type TEXT CHECK(unit_type IN ('sell','rent')) DEFAULT 'sell',
    house_type TEXT,
    area REAL,
    floor_info TEXT,
    orientation TEXT,
    decoration TEXT,
    status TEXT DEFAULT 'available' CHECK(status IN ('available','reserved','sold','rented','offline')),
    agent_id INTEGER REFERENCES users(id),
    cert_no TEXT,
    cert_status TEXT DEFAULT 'pending' CHECK(cert_status IN ('pending','verified','failed')),
    images TEXT DEFAULT '[]',
    description TEXT,
    community TEXT,
    built_year INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    intent_type TEXT CHECK(intent_type IN ('buy','rent')) DEFAULT 'buy',
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    preferred_area TEXT,
    house_type_pref TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','dealing','closed')),
    agent_id INTEGER REFERENCES users(id),
    source TEXT,
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS followups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    agent_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    type TEXT DEFAULT 'other' CHECK(type IN ('call','visit','wechat','other')),
    next_followup DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_id INTEGER NOT NULL REFERENCES users(id),
    house_id INTEGER NOT NULL REFERENCES houses(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled','completed','cancelled')),
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    house_id INTEGER NOT NULL REFERENCES houses(id),
    client_id INTEGER NOT NULL REFERENCES clients(id),
    agent_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT DEFAULT 'contract' CHECK(status IN ('contract','loan','transfer','completed')),
    total_amount DECIMAL(14,2),
    commission_rate DECIMAL(5,4) DEFAULT 0.0250,
    commission_amount DECIMAL(14,2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transaction_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id),
    node_type TEXT NOT NULL CHECK(node_type IN ('contract','loan','transfer')),
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','processing','completed')),
    documents TEXT DEFAULT '[]',
    remark TEXT,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS commission_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    org_id INTEGER NOT NULL REFERENCES organizations(id),
    role TEXT NOT NULL CHECK(role IN ('director','manager','agent','admin','platform','ops')),
    rate DECIMAL(5,4) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS commissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id),
    agent_id INTEGER NOT NULL REFERENCES users(id),
    amount DECIMAL(14,2) NOT NULL,
    rate DECIMAL(5,4) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','paid')),
    paid_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id INTEGER,
    detail TEXT DEFAULT '{}',
    ip TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_houses_agent ON houses(agent_id);
  CREATE INDEX IF NOT EXISTS idx_houses_status ON houses(status);
  CREATE INDEX IF NOT EXISTS idx_houses_lng_lat ON houses(lng, lat);
  CREATE INDEX IF NOT EXISTS idx_clients_agent ON clients(agent_id);
  CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
  CREATE INDEX IF NOT EXISTS idx_schedules_agent ON schedules(agent_id);
  CREATE INDEX IF NOT EXISTS idx_schedules_time ON schedules(start_time, end_time);
  CREATE INDEX IF NOT EXISTS idx_transactions_agent ON transactions(agent_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
  CREATE INDEX IF NOT EXISTS idx_commissions_agent ON commissions(agent_id);
  CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
`)

function seed() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  const saltRounds = 10
  const defaultPassword = bcrypt.hashSync('123456', saltRounds)

  const insertOrg = db.prepare(
    'INSERT INTO organizations (name, type, parent_id, director_id) VALUES (?, ?, ?, ?)'
  )
  const company = insertOrg.run('鼎信地产', 'company', null, null)
  const store = insertOrg.run('鼎信·朝阳门店', 'store', company.lastInsertRowid, null)

  const insertUser = db.prepare(
    `INSERT INTO users (username, password_hash, name, phone, role, org_id, cert_status, real_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const director = insertUser.run('director', defaultPassword, '张总监', '13800000001', 'director', company.lastInsertRowid, 'certified', '张总监')
  const manager = insertUser.run('manager', defaultPassword, '李经理', '13800000002', 'manager', store.lastInsertRowid, 'certified', '李经理')
  const agent1 = insertUser.run('agent1', defaultPassword, '王经纪', '13800000003', 'agent', store.lastInsertRowid, 'certified', '王经纪')
  const agent2 = insertUser.run('agent2', defaultPassword, '赵经纪', '13800000004', 'agent', store.lastInsertRowid, 'pending', '赵经纪')
  const admin = insertUser.run('admin', defaultPassword, '系统管理员', '13800000005', 'admin', company.lastInsertRowid, 'certified', '系统管理员')
  const platform = insertUser.run('platform', defaultPassword, '平台运营', '13800000006', 'platform', company.lastInsertRowid, 'certified', '平台运营')
  const ops = insertUser.run('ops', defaultPassword, '运维工程师', '13800000007', 'ops', company.lastInsertRowid, 'certified', '运维工程师')

  db.prepare('UPDATE organizations SET director_id = ? WHERE id = ?').run(director.lastInsertRowid, company.lastInsertRowid)

  const insertCommissionRule = db.prepare(
    'INSERT INTO commission_rules (org_id, role, rate) VALUES (?, ?, ?)'
  )
  insertCommissionRule.run(company.lastInsertRowid, 'director', 0.0050)
  insertCommissionRule.run(company.lastInsertRowid, 'manager', 0.0100)
  insertCommissionRule.run(company.lastInsertRowid, 'agent', 0.0250)
  insertCommissionRule.run(company.lastInsertRowid, 'admin', 0.0000)
  insertCommissionRule.run(company.lastInsertRowid, 'platform', 0.0000)
  insertCommissionRule.run(company.lastInsertRowid, 'ops', 0.0000)

  const insertHouse = db.prepare(
    `INSERT INTO houses (title, address, lng, lat, price, unit_type, house_type, area, floor_info, orientation, decoration, status, agent_id, cert_no, cert_status, images, description, community, built_year)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const houses = [
    ['朝阳区望京SOHO精装两居', '北京市朝阳区望京SOHO T1', 116.4805, 39.9978, 5800000, 'sell', '两室一厅', 89.5, '15/28层', '南北通透', '精装修', 'available', agent1.lastInsertRowid, 'BJ-CQ-2024-0001', 'verified', '[]', '望京核心地段，紧邻地铁站，采光充足，户型方正', '望京SOHO', 2018],
    ['朝阳区三元桥温馨一居', '北京市朝阳区三元桥曙光西里', 116.4535, 39.9608, 3200000, 'sell', '一室一厅', 58.0, '8/22层', '朝南', '简装修', 'available', agent1.lastInsertRowid, 'BJ-CQ-2024-0002', 'verified', '[]', '三元桥商圈，交通便捷，适合刚需上车', '曙光西里', 2010],
    ['朝阳区国贸CBD豪华三居', '北京市朝阳区国贸CBD建外SOHO', 116.4612, 39.9085, 12500000, 'sell', '三室两厅', 156.0, '25/35层', '南北通透', '豪装', 'available', agent2.lastInsertRowid, 'BJ-CQ-2024-0003', 'verified', '[]', '国贸核心商圈，俯瞰CBD全景，品质生活', '建外SOHO', 2015],
    ['朝阳区朝外大街精装两居出租', '北京市朝阳区朝外大街丰联广场', 116.4432, 39.9216, 8500, 'rent', '两室一厅', 95.0, '12/20层', '朝南', '精装修', 'available', agent2.lastInsertRowid, 'BJ-CQ-2024-0004', 'verified', '[]', '朝外核心地段，紧邻悠唐购物中心，拎包入住', '丰联广场', 2012],
    ['朝阳区大望路现代一居', '北京市朝阳区大望路万达广场', 116.4732, 39.9085, 2900000, 'sell', '一室一厅', 52.0, '6/18层', '朝东', '简装修', 'reserved', agent1.lastInsertRowid, 'BJ-CQ-2024-0005', 'pending', '[]', '大望路地铁旁，投资自住两相宜', '万达广场', 2016],
    ['朝阳区劲松温馨两居出租', '北京市朝阳区劲松南路', 116.4600, 39.8780, 6800, 'rent', '两室一厅', 78.0, '5/16层', '朝南', '中装修', 'available', agent2.lastInsertRowid, null, 'pending', '[]', '劲松片区成熟社区，生活便利，近十号线', '劲松南路社区', 2008],
  ]
  const insertHouses = db.transaction((rows: any[][]) => {
    for (const row of rows) {
      insertHouse.run(...row)
    }
  })
  insertHouses(houses)

  const insertClient = db.prepare(
    `INSERT INTO clients (name, phone, intent_type, budget_min, budget_max, preferred_area, house_type_pref, status, agent_id, source, remark)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const clients = [
    ['刘先生', '13900000001', 'buy', 3000000, 6000000, '朝阳区', '两室一厅', 'active', agent1.lastInsertRowid, '线上咨询', '预算充足，偏好南北通透户型'],
    ['陈女士', '13900000002', 'rent', 5000, 10000, '朝阳区', '两室一厅', 'active', agent1.lastInsertRowid, '老客户推荐', '希望拎包入住，近地铁'],
    ['周先生', '13900000003', 'buy', 8000000, 15000000, '朝阳区', '三室两厅', 'active', agent2.lastInsertRowid, '门店来访', '改善型需求，偏好高端社区'],
    ['吴女士', '13900000004', 'rent', 4000, 8000, '朝阳区', '一室一厅', 'active', agent2.lastInsertRowid, '线上咨询', '单身白领，通勤便利优先'],
  ]
  const insertClients = db.transaction((rows: any[][]) => {
    for (const row of rows) {
      insertClient.run(...row)
    }
  })
  insertClients(clients)
}

function ensureDemoBusinessData() {
  const agent = db.prepare("SELECT id, org_id FROM users WHERE username = 'agent1'").get() as any
  const director = db.prepare("SELECT id FROM users WHERE username = 'director'").get() as any
  const house = db.prepare(
    "SELECT id, title, price FROM houses WHERE status != 'offline' ORDER BY CASE cert_status WHEN 'verified' THEN 0 ELSE 1 END, id LIMIT 1"
  ).get() as any
  const client = db.prepare('SELECT id, name FROM clients ORDER BY id LIMIT 1').get() as any

  if (!agent || !house || !client) return

  const ensureNodes = (transactionId: number, completed: boolean) => {
    const nodeTypes: Array<'contract' | 'loan' | 'transfer'> = ['contract', 'loan', 'transfer']
    for (const [index, nodeType] of nodeTypes.entries()) {
      const existing = db.prepare(
        'SELECT id FROM transaction_nodes WHERE transaction_id = ? AND node_type = ?'
      ).get(transactionId, nodeType) as any

      if (existing) {
        if (completed) {
          db.prepare(
            "UPDATE transaction_nodes SET status = 'completed', completed_at = COALESCE(completed_at, CURRENT_TIMESTAMP) WHERE id = ?"
          ).run(existing.id)
        }
        continue
      }

      const status = completed ? 'completed' : index === 0 ? 'processing' : 'pending'
      db.prepare(
        `INSERT INTO transaction_nodes (transaction_id, node_type, status, completed_at)
         VALUES (?, ?, ?, ?)`
      ).run(transactionId, nodeType, status, completed ? new Date().toISOString() : null)
    }
  }

  const createTransaction = (
    title: string,
    status: 'contract' | 'completed',
    totalAmount: number,
  ): number => {
    const rate = 0.025
    const existing = db.prepare('SELECT id FROM transactions WHERE title = ?').get(title) as any
    if (existing) return Number(existing.id)

    const result = db.prepare(
      `INSERT INTO transactions
       (title, house_id, client_id, agent_id, status, total_amount, commission_rate, commission_amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(title, house.id, client.id, agent.id, status, totalAmount, rate, totalAmount * rate)

    return Number(result.lastInsertRowid)
  }

  const activeTxId = createTransaction(
    '望京SOHO两居签约交易',
    'contract',
    Number(house.price || 5800000),
  )
  ensureNodes(activeTxId, false)

  const todayScheduleCount = db.prepare(
    "SELECT COUNT(*) as count FROM schedules WHERE DATE(start_time) = DATE('now')"
  ).get() as { count: number }

  if (todayScheduleCount.count === 0) {
    const start = new Date()
    start.setHours(15, 0, 0, 0)
    const end = new Date(start)
    end.setHours(16, 0, 0, 0)
    db.prepare(
      `INSERT INTO schedules (agent_id, house_id, client_id, start_time, end_time, status, remark)
       VALUES (?, ?, ?, ?, ?, 'scheduled', ?)`
    ).run(
      agent.id,
      house.id,
      client.id,
      start.toISOString(),
      end.toISOString(),
      '今日带看：系统演示数据用于工作台统计闭环',
    )
  }

  let completedTx = db.prepare(
    "SELECT id, total_amount, commission_rate, commission_amount, agent_id FROM transactions WHERE status = 'completed' ORDER BY id LIMIT 1"
  ).get() as any

  if (!completedTx) {
    const completedTxId = createTransaction('国贸CBD成交结算交易', 'completed', 12500000)
    ensureNodes(completedTxId, true)
    completedTx = db.prepare(
      'SELECT id, total_amount, commission_rate, commission_amount, agent_id FROM transactions WHERE id = ?'
    ).get(completedTxId) as any
  }

  const completedTransactions = db.prepare(
    "SELECT id, total_amount, commission_rate, commission_amount, agent_id FROM transactions WHERE status = 'completed'"
  ).all() as any[]

  for (const transaction of completedTransactions) {
    ensureNodes(Number(transaction.id), true)
    const commissionCount = db.prepare(
      'SELECT COUNT(*) as count FROM commissions WHERE transaction_id = ?'
    ).get(transaction.id) as { count: number }

    if (commissionCount.count === 0) {
      db.prepare(
        `INSERT INTO commissions (transaction_id, agent_id, amount, rate, status)
         VALUES (?, ?, ?, ?, 'pending')`
      ).run(
        transaction.id,
        transaction.agent_id || agent.id,
        transaction.commission_amount || Number(transaction.total_amount || 0) * Number(transaction.commission_rate || 0.025),
        transaction.commission_rate || 0.025,
      )
    }
  }

  const demoAuditCount = db.prepare(
    "SELECT COUNT(*) as count FROM audit_logs WHERE action = 'demo_seed'"
  ).get() as { count: number }

  if (director && demoAuditCount.count === 0) {
    const insertAudit = db.prepare(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, detail, ip)
       VALUES (?, 'demo_seed', ?, ?, ?, '127.0.0.1')`
    )
    insertAudit.run(director.id, 'transaction', completedTx?.id || activeTxId, JSON.stringify({ status: 'completed', source: 'ensureDemoBusinessData' }))
    insertAudit.run(director.id, 'commission', null, JSON.stringify({ status: 'pending', source: 'ensureDemoBusinessData' }))
    insertAudit.run(director.id, 'organization', agent.org_id || null, JSON.stringify({ action: 'verify_admin_routes' }))
  }
}

seed()
ensureDemoBusinessData()

export default db
