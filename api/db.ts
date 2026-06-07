import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.resolve(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const uploadsDir = path.resolve(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'app.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('taxpayer','admin','agent')),
      real_name TEXT NOT NULL,
      id_number TEXT,
      phone TEXT,
      digital_cert TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS taxpayers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('enterprise','individual','natural_person')),
      unified_code TEXT,
      id_number TEXT,
      legal_person TEXT,
      address TEXT,
      industry TEXT,
      scale TEXT,
      region TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tax_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      default_rate REAL NOT NULL,
      scope TEXT,
      period_type TEXT NOT NULL CHECK(period_type IN ('monthly','quarterly','yearly'))
    );

    CREATE TABLE IF NOT EXISTS declarations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taxpayer_id INTEGER NOT NULL REFERENCES taxpayers(id),
      tax_type_id INTEGER NOT NULL REFERENCES tax_types(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      period TEXT NOT NULL,
      decl_type TEXT NOT NULL CHECK(decl_type IN ('regular','zero','correction')),
      form_data TEXT DEFAULT '{}',
      tax_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft','submitted','approved','rejected','sealed')),
      risk_check TEXT DEFAULT '{}',
      seal_data TEXT,
      submitted_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      declaration_id INTEGER REFERENCES declarations(id),
      taxpayer_id INTEGER NOT NULL REFERENCES taxpayers(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','failed','refunded')),
      pay_method TEXT,
      transaction_id TEXT,
      voucher_no TEXT,
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taxpayer_id INTEGER NOT NULL REFERENCES taxpayers(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      invoice_no TEXT UNIQUE,
      invoice_type TEXT NOT NULL CHECK(invoice_type IN ('normal','special','agency','red_flush')),
      amount REAL NOT NULL,
      buyer_name TEXT,
      buyer_code TEXT,
      seller_name TEXT,
      seller_code TEXT,
      items TEXT DEFAULT '[]',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','issued','red_flushed','verified')),
      ocr_data TEXT,
      issued_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taxpayer_id INTEGER NOT NULL REFERENCES taxpayers(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      cert_type TEXT NOT NULL CHECK(cert_type IN ('tax_paid','no_debt')),
      cert_no TEXT UNIQUE,
      content TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','issued','rejected')),
      issued_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      source TEXT,
      level TEXT CHECK(level IN ('national','provincial','municipal')),
      industry_tags TEXT DEFAULT '[]',
      scale_tags TEXT DEFAULT '[]',
      region_tags TEXT DEFAULT '[]',
      content TEXT,
      summary TEXT,
      publish_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      taxpayer_id INTEGER REFERENCES taxpayers(id),
      title TEXT NOT NULL,
      category TEXT,
      status TEXT DEFAULT 'open' CHECK(status IN ('open','processing','replied','closed')),
      priority INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ticket_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL REFERENCES tickets(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      content TEXT NOT NULL,
      attachments TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      detail TEXT,
      ip TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS digital_certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taxpayer_id INTEGER NOT NULL REFERENCES taxpayers(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      cert_no TEXT UNIQUE,
      cert_type TEXT NOT NULL CHECK(cert_type IN ('ukey','ca','usbkey')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','expired','revoked')),
      issued_at TEXT,
      expired_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agent_authorizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taxpayer_id INTEGER NOT NULL REFERENCES taxpayers(id),
      agent_user_id INTEGER NOT NULL REFERENCES users(id),
      auth_type TEXT NOT NULL CHECK(auth_type IN ('declaration','payment','invoice','certificate','all')),
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','expired')),
      start_date TEXT,
      end_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS taxpayer_tax_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      taxpayer_id INTEGER NOT NULL REFERENCES taxpayers(id),
      tax_type_id INTEGER NOT NULL REFERENCES tax_types(id),
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','exempt')),
      effective_date TEXT,
      expiry_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(taxpayer_id, tax_type_id)
    );

    CREATE INDEX IF NOT EXISTS idx_taxpayers_user ON taxpayers(user_id);
    CREATE INDEX IF NOT EXISTS idx_declarations_taxpayer ON declarations(taxpayer_id);
    CREATE INDEX IF NOT EXISTS idx_declarations_status ON declarations(status);
    CREATE INDEX IF NOT EXISTS idx_payments_declaration ON payments(declaration_id);
    CREATE INDEX IF NOT EXISTS idx_invoices_taxpayer ON invoices(taxpayer_id);
    CREATE INDEX IF NOT EXISTS idx_certificates_taxpayer ON certificates(taxpayer_id);
    CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_policies_level ON policies(level);
    CREATE INDEX IF NOT EXISTS idx_digital_certificates_taxpayer ON digital_certificates(taxpayer_id);
    CREATE INDEX IF NOT EXISTS idx_agent_authorizations_taxpayer ON agent_authorizations(taxpayer_id);
    CREATE INDEX IF NOT EXISTS idx_taxpayer_tax_types_taxpayer ON taxpayer_tax_types(taxpayer_id);
  `)

  seedData()
  ensureBusinessData()
  ensureExtendedTaxpayerData()
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  const hash = bcrypt.hashSync('admin123', 10)

  db.prepare(`
    INSERT INTO users (username, password_hash, role, real_name, id_number, phone) VALUES
    ('admin', ?, 'admin', '系统管理员', '110101199001011234', '13800138000'),
    ('taxpayer1', ?, 'taxpayer', '张三', '310101199203154567', '13900139001'),
    ('agent1', ?, 'agent', '李代理', '440101198805206789', '13700137001')
  `).run(hash, hash, hash)

  db.prepare(`
    INSERT INTO taxpayers (user_id, name, type, unified_code, id_number, legal_person, address, industry, scale, region) VALUES
    (2, '上海某某科技有限公司', 'enterprise', '91310000MA1FL8XX3J', '310101199203154567', '张三', '上海市浦东新区张江路100号', '信息技术', '小型', '上海'),
    (1, '测试企业', 'enterprise', '91110108MA01XXXX5K', '110101199001011234', '管理员', '北京市海淀区中关村大街1号', '科技服务', '中型', '北京')
  `).run()

  db.prepare(`
    INSERT INTO tax_types (name, code, category, default_rate, scope, period_type) VALUES
    ('增值税', 'VAT', '流转税', 0.13, '货物销售、加工修理修配、进口货物等', 'monthly'),
    ('企业所得税', 'CIT', '所得税', 0.25, '企业生产经营所得和其他所得', 'quarterly'),
    ('个人所得税', 'PIT', '所得税', 0.03, '工资薪金、劳务报酬、稿酬等', 'monthly'),
    ('城市维护建设税', 'UMCT', '附加税', 0.07, '增值税、消费税实缴税额', 'monthly'),
    ('教育费附加', 'ES', '附加税', 0.03, '增值税、消费税实缴税额', 'monthly'),
    ('地方教育附加', 'LES', '附加税', 0.02, '增值税、消费税实缴税额', 'monthly'),
    ('印花税', 'ST', '财产行为税', 0.0003, '购销合同、技术合同等', 'quarterly'),
    ('房产税', 'PT', '财产行为税', 0.012, '房产原值或租金收入', 'yearly')
  `).run()

  db.prepare(`
    INSERT INTO policies (title, source, level, industry_tags, scale_tags, region_tags, content, summary, publish_date) VALUES
    ('小微企业增值税减免政策', '国家税务总局', 'national', '["制造业","信息技术","批发零售"]', '["小型","微型"]', '[]', '对月销售额10万元以下（含本数）的增值税小规模纳税人，免征增值税。', '月销售额10万元以下小规模纳税人免征增值税', '2025-01-15'),
    ('高新技术企业税收优惠', '国家税务总局', 'national', '["信息技术","生物医药","新材料"]', '["小型","中型"]', '[]', '国家需要重点扶持的高新技术企业，减按15%的税率征收企业所得税。', '高新技术企业企业所得税减按15%征收', '2025-03-01'),
    ('上海市科技创新奖补政策', '上海市科学技术委员会', 'provincial', '["信息技术","人工智能","集成电路"]', '["小型","微型"]', '["上海"]', '对符合条件的科技创新企业，给予最高200万元的研发费用补贴。', '上海科创企业最高200万研发补贴', '2025-02-20'),
    ('研发费用加计扣除政策', '国家税务总局', 'national', '["制造业","信息技术","科学研究"]', '["大型","中型","小型"]', '[]', '企业开展研发活动中实际发生的研发费用，未形成无形资产计入当期损益的，在按规定据实扣除的基础上，自2023年1月1日起，再按照实际发生额的100%在税前加计扣除。', '研发费用100%加计扣除', '2025-01-01'),
    ('个体工商户个税优惠', '国家税务总局', 'national', '[]', '["微型"]', '[]', '对个体工商户年应纳税所得额不超过200万元的部分，减半征收个人所得税。', '个体户年应纳税所得200万以内减半征个税', '2025-04-01')
  `).run()

  console.log('Database seeded with initial data')
}

function ensureBusinessData() {
  const declarationCount = db.prepare('SELECT COUNT(*) as count FROM declarations').get() as { count: number }
  if (declarationCount.count > 0) return

  const admin = db.prepare("SELECT id FROM users WHERE username = 'admin'").get() as { id: number } | undefined
  const taxpayer = db.prepare('SELECT id, user_id FROM taxpayers ORDER BY id LIMIT 1').get() as { id: number; user_id: number } | undefined
  const vat = db.prepare("SELECT id FROM tax_types WHERE code = 'VAT'").get() as { id: number } | undefined
  const cit = db.prepare("SELECT id FROM tax_types WHERE code = 'CIT'").get() as { id: number } | undefined
  const pit = db.prepare("SELECT id FROM tax_types WHERE code = 'PIT'").get() as { id: number } | undefined
  if (!admin || !taxpayer || !vat || !cit || !pit) return

  const insertDeclaration = db.prepare(`
    INSERT INTO declarations (taxpayer_id, tax_type_id, user_id, period, decl_type, form_data, tax_amount, status, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertPayment = db.prepare(`
    INSERT INTO payments (declaration_id, taxpayer_id, user_id, amount, status, pay_method, transaction_id, voucher_no, paid_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertInvoice = db.prepare(`
    INSERT INTO invoices (taxpayer_id, user_id, invoice_no, invoice_type, amount, buyer_name, buyer_code, seller_name, seller_code, items, status, issued_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertTicket = db.prepare(`
    INSERT INTO tickets (user_id, taxpayer_id, title, category, status, priority)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const now = new Date().toISOString()
  const lastMonth = '2026-05'
  const currentQuarter = '2026-Q2'
  const submittedVat = insertDeclaration.run(
    taxpayer.id,
    vat.id,
    taxpayer.user_id,
    lastMonth,
    'regular',
    JSON.stringify({ sales: 386000, inputTax: 21800, outputTax: 50180 }),
    28380,
    'submitted',
    now,
  ).lastInsertRowid as number
  const approvedCit = insertDeclaration.run(
    taxpayer.id,
    cit.id,
    admin.id,
    currentQuarter,
    'regular',
    JSON.stringify({ revenue: 1260000, cost: 920000, profit: 340000 }),
    85000,
    'approved',
    now,
  ).lastInsertRowid as number
  insertDeclaration.run(
    taxpayer.id,
    pit.id,
    taxpayer.user_id,
    lastMonth,
    'zero',
    JSON.stringify({ salaryTax: 0, laborTax: 0 }),
    0,
    'draft',
    null,
  )

  insertPayment.run(submittedVat, taxpayer.id, taxpayer.user_id, 28380, 'pending', null, null, 'PAY-202606-0001', null)
  insertPayment.run(approvedCit, taxpayer.id, admin.id, 85000, 'paid', 'bank', 'TX-202606050001', 'PAY-202606-0002', now)
  insertInvoice.run(
    taxpayer.id,
    taxpayer.user_id,
    'INV-202606050001',
    'normal',
    12800,
    '上海某某科技有限公司',
    '91310000MA1FL8XX3J',
    '测试企业',
    '91110108MA01XXXX5K',
    JSON.stringify([{ name: '技术服务费', amount: 12800 }]),
    'issued',
    now,
  )
  insertTicket.run(taxpayer.user_id, taxpayer.id, '申报表数据口径咨询', 'declaration', 'processing', 2)
  insertTicket.run(admin.id, taxpayer.id, '发票验真结果复核', 'invoice', 'open', 1)
}

function ensureExtendedTaxpayerData() {
  const certCount = db.prepare('SELECT COUNT(*) as count FROM digital_certificates').get() as { count: number }
  if (certCount.count > 0) return

  const taxpayers = db.prepare('SELECT id, user_id FROM taxpayers').all() as { id: number; user_id: number }[]
  const taxTypes = db.prepare('SELECT id FROM tax_types').all() as { id: number }[]
  const agentUser = db.prepare("SELECT id FROM users WHERE username = 'agent1'").get() as { id: number } | undefined

  for (const tp of taxpayers) {
    db.prepare(`
      INSERT INTO digital_certificates (taxpayer_id, user_id, cert_no, cert_type, status, issued_at, expired_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      tp.id,
      tp.user_id,
      `CERT-${tp.id}-${Date.now()}`,
      'ukey',
      'active',
      new Date().toISOString(),
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    )

    for (const tt of taxTypes.slice(0, 5)) {
      db.prepare(`
        INSERT OR IGNORE INTO taxpayer_tax_types (taxpayer_id, tax_type_id, status, effective_date)
        VALUES (?, ?, ?, ?)
      `).run(tp.id, tt.id, 'active', new Date().toISOString())
    }

    if (agentUser && tp.id === 1) {
      db.prepare(`
        INSERT INTO agent_authorizations (taxpayer_id, agent_user_id, auth_type, status, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        tp.id,
        agentUser.id,
        'all',
        'active',
        new Date().toISOString(),
        new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
      )
    }
  }

  console.log('Extended taxpayer data seeded')
}

export default db
