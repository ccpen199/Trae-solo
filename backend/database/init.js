const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_no TEXT UNIQUE NOT NULL,
    contract_name TEXT NOT NULL,
    owner_unit TEXT,
    construction_unit TEXT,
    supervision_unit TEXT,
    total_amount REAL,
    start_date TEXT,
    end_date TEXT,
    status TEXT DEFAULT 'active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER,
    section_no TEXT NOT NULL,
    section_name TEXT NOT NULL,
    budget_amount REAL,
    FOREIGN KEY (contract_id) REFERENCES contracts(id)
  );

  CREATE TABLE IF NOT EXISTS change_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    change_no TEXT UNIQUE NOT NULL,
    contract_id INTEGER NOT NULL,
    section_id INTEGER,
    title TEXT NOT NULL,
    change_reason TEXT NOT NULL,
    impact_scope TEXT NOT NULL,
    drawing_reference TEXT,
    estimated_amount REAL NOT NULL,
    status TEXT DEFAULT 'draft',
    created_by INTEGER,
    creator_name TEXT,
    submitter_id INTEGER,
    submitted_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id),
    FOREIGN KEY (section_id) REFERENCES sections(id)
  );

  CREATE TABLE IF NOT EXISTS change_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    change_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    attachment_type TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (change_id) REFERENCES change_requests(id)
  );

  CREATE TABLE IF NOT EXISTS visa_forms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visa_no TEXT UNIQUE NOT NULL,
    change_id INTEGER,
    contract_id INTEGER NOT NULL,
    section_id INTEGER,
    project_name TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    unit_price REAL NOT NULL,
    calculation_formula TEXT NOT NULL,
    total_amount REAL NOT NULL,
    responsible_unit TEXT NOT NULL,
    created_by INTEGER,
    creator_name TEXT,
    cost_reviewer_id INTEGER,
    cost_review_status TEXT DEFAULT 'pending',
    cost_review_comment TEXT,
    cost_reviewed_at TEXT,
    status TEXT DEFAULT 'draft',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (change_id) REFERENCES change_requests(id),
    FOREIGN KEY (contract_id) REFERENCES contracts(id)
  );

  CREATE TABLE IF NOT EXISTS visa_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visa_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visa_id) REFERENCES visa_forms(id)
  );

  CREATE TABLE IF NOT EXISTS approval_workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    business_type TEXT NOT NULL,
    business_id INTEGER NOT NULL,
    current_stage TEXT DEFAULT 'construction',
    overall_status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS approval_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id INTEGER NOT NULL,
    stage TEXT NOT NULL,
    approver_id INTEGER,
    approver_role TEXT NOT NULL,
    approver_name TEXT,
    opinion TEXT,
    status TEXT DEFAULT 'pending',
    approval_amount REAL,
    is_escalated INTEGER DEFAULT 0,
    approved_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workflow_id) REFERENCES approval_workflows(id)
  );

  CREATE TABLE IF NOT EXISTS settlement_basis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    settlement_no TEXT UNIQUE NOT NULL,
    visa_id INTEGER NOT NULL,
    change_id INTEGER,
    contract_id INTEGER NOT NULL,
    final_amount REAL NOT NULL,
    adjustment_reason TEXT,
    adjustment_amount REAL DEFAULT 0,
    is_archived INTEGER DEFAULT 0,
    archived_at TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visa_id) REFERENCES visa_forms(id),
    FOREIGN KEY (change_id) REFERENCES change_requests(id),
    FOREIGN KEY (contract_id) REFERENCES contracts(id)
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    operation TEXT NOT NULL,
    business_type TEXT,
    business_id INTEGER,
    ip_address TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, password, name, role, department)
  VALUES (?, ?, ?, ?, ?)
`);

insertUser.run('admin', 'admin123', '系统管理员', 'admin', '系统部');
insertUser.run('construction', '123456', '张施工', 'construction', '施工部');
insertUser.run('supervision', '123456', '李监理', 'supervision', '监理部');
insertUser.run('owner', '123456', '王业主', 'owner', '业主方');
insertUser.run('cost', '123456', '赵造价', 'cost', '成本部');

const insertContract = db.prepare(`
  INSERT OR IGNORE INTO contracts (contract_no, contract_name, owner_unit, construction_unit, supervision_unit, total_amount)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertContract.run('HT-2024-001', 'XX大厦建设工程施工合同', 'XX地产有限公司', 'XX建设集团', 'XX监理公司', 50000000);
insertContract.run('HT-2024-002', 'XX园区道路工程合同', 'XX园区管委会', 'XX市政公司', 'XX监理公司', 8000000);

const insertSection = db.prepare(`
  INSERT OR IGNORE INTO sections (contract_id, section_no, section_name, budget_amount)
  VALUES (?, ?, ?, ?)
`);

insertSection.run(1, 'BD-001', '主体结构工程', 20000000);
insertSection.run(1, 'BD-002', '装饰装修工程', 15000000);
insertSection.run(1, 'BD-003', '机电安装工程', 15000000);

console.log('数据库初始化完成');
db.close();
