import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.')
  }
  return db
}

export function initDb(): void {
  const dbPath = process.env.DB_PATH || 'data/app.sqlite'
  const resolvedPath = path.resolve(__dirname, '..', dbPath)
  const dir = path.dirname(resolvedPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(resolvedPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  createTables(db)
  seedData(db)
}

function createTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_number TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('personal', 'enterprise', 'admin')),
      credit_code TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','reviewing','approved','rejected','completed')),
      form_data TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      contract_type TEXT NOT NULL,
      party_a TEXT NOT NULL,
      party_b TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      terms TEXT NOT NULL,
      employer_sign TEXT,
      employee_sign TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','signed','archived')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      target TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      evidence TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','accepted','investigating','resolved','closed')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      file_path TEXT NOT NULL,
      recognized_text TEXT,
      reusable_for TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS insurance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      insurance_type TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active','suspended','ceased')),
      base_amount REAL NOT NULL DEFAULT 0,
      unit_name TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payment_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      insurance_type TEXT NOT NULL,
      period TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      paid_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS status_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL REFERENCES applications(id),
      step_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','done','rejected')),
      operator TEXT,
      remark TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS monitor_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      detail TEXT NOT NULL,
      severity INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS policy_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL,
      keywords TEXT NOT NULL DEFAULT '[]',
      published_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sync_conflicts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      local_data TEXT NOT NULL,
      remote_data TEXT NOT NULL,
      resolution TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS business_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      business_type TEXT NOT NULL,
      business_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);
    CREATE INDEX IF NOT EXISTS idx_applications_type_status ON applications(type, status);
    CREATE INDEX IF NOT EXISTS idx_contracts_user ON contracts(user_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_user ON complaints(user_id);
    CREATE INDEX IF NOT EXISTS idx_materials_user ON materials(user_id);
    CREATE INDEX IF NOT EXISTS idx_insurance_user ON insurance_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user_period ON payment_records(user_id, period);
    CREATE INDEX IF NOT EXISTS idx_status_steps_app ON status_steps(application_id);
    CREATE INDEX IF NOT EXISTS idx_monitor_type ON monitor_events(type);
    CREATE INDEX IF NOT EXISTS idx_policy_category ON policy_articles(category);
    CREATE INDEX IF NOT EXISTS idx_sync_conflicts_user ON sync_conflicts(user_id);
    CREATE INDEX IF NOT EXISTS idx_business_records_user ON business_records(user_id);
  `)
}

function seedData(db: Database.Database): void {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  const insertUser = db.prepare('INSERT INTO users (id_number, name, password_hash, role, credit_code) VALUES (?, ?, ?, ?, ?)')
  insertUser.run('110101199001011234', '张三', 'hashed_123456', 'personal', null)
  insertUser.run('91110000MA01ABCDEF', '北京示例科技有限公司', 'hashed_enterprise', 'enterprise', '91110000MA01ABCDEF')
  insertUser.run('admin001', '监管员', 'hashed_admin', 'admin', null)

  const insertInsurance = db.prepare('INSERT INTO insurance_records (user_id, insurance_type, status, base_amount, unit_name) VALUES (?, ?, ?, ?, ?)')
  insertInsurance.run(1, '养老保险', 'active', 6326.00, '北京示例科技有限公司')
  insertInsurance.run(1, '医疗保险', 'active', 6326.00, '北京示例科技有限公司')
  insertInsurance.run(1, '失业保险', 'active', 6326.00, '北京示例科技有限公司')
  insertInsurance.run(1, '工伤保险', 'active', 6326.00, '北京示例科技有限公司')
  insertInsurance.run(1, '生育保险', 'active', 6326.00, '北京示例科技有限公司')

  const insertPayment = db.prepare('INSERT INTO payment_records (user_id, insurance_type, period, amount, paid_at) VALUES (?, ?, ?, ?, ?)')
  insertPayment.run(1, '养老保险', '2025-05', 506.08, '2025-05-15')
  insertPayment.run(1, '医疗保险', '2025-05', 126.52, '2025-05-15')
  insertPayment.run(1, '失业保险', '2025-05', 37.96, '2025-05-15')
  insertPayment.run(1, '工伤保险', '2025-05', 25.30, '2025-05-15')
  insertPayment.run(1, '生育保险', '2025-05', 25.30, '2025-05-15')

  const insertPolicy = db.prepare('INSERT INTO policy_articles (title, content, category, keywords) VALUES (?, ?, ?, ?)')
  insertPolicy.run('失业保险金申领办法', '符合条件的人员可在线申领失业保险金，需提供解除劳动关系证明、银行账户信息等材料。', '社保', '["失业","申领","保险金"]')
  insertPolicy.run('职称评审管理办法', '申报职称需按系列和级别提交业绩成果及佐证材料，通过后颁发相应职称证书。', '人才', '["职称","申报","评审"]')
  insertPolicy.run('劳动合同电子签署规范', '用人单位与劳动者可通过平台完成劳动合同电子签署，签署后合同具有法律效力。', '劳动关系', '["劳动合同","电子签署","签约"]')

  const insertMonitor = db.prepare('INSERT INTO monitor_events (type, category, detail, severity) VALUES (?, ?, ?, ?)')
  insertMonitor.run('timeout', '失业金申领', '张三的失业金申领已超时3天', 2)
  insertMonitor.run('timeout', '职称申报', '李四的职称申报已超时1天', 1)
  insertMonitor.run('rejection', '参保查询', '因信息不完整退件5件', 2)
  insertMonitor.run('hotspot', '社保', '近期社保转移咨询量增长30%', 1)
}
