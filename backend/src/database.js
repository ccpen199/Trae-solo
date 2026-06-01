const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite'
const dbDir = path.dirname(dbPath)

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      source TEXT NOT NULL,
      principal TEXT NOT NULL,
      department TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TEXT DEFAULT 'active',
      total_budget DECIMAL(15,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS budget_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      subject_code TEXT NOT NULL,
      subject_name TEXT NOT NULL,
      budget_amount DECIMAL(15,2) NOT NULL,
      used_amount DECIMAL(15,2) DEFAULT 0,
      frozen_amount DECIMAL(15,2) DEFAULT 0,
      version INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, subject_code)
    );

    CREATE TABLE IF NOT EXISTS budget_adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      budget_item_id INTEGER NOT NULL,
      old_amount DECIMAL(15,2) NOT NULL,
      new_amount DECIMAL(15,2) NOT NULL,
      reason TEXT,
      approver TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (budget_item_id) REFERENCES budget_items(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      contract_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      party_a TEXT,
      party_b TEXT,
      amount DECIMAL(15,2) NOT NULL,
      sign_date DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reimbursements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      budget_item_id INTEGER,
      contract_id INTEGER,
      reimbursement_no TEXT UNIQUE NOT NULL,
      applicant TEXT NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      description TEXT,
      invoice_count INTEGER DEFAULT 0,
      has_acceptance BOOLEAN DEFAULT 0,
      status TEXT DEFAULT 'pending',
      approver TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (budget_item_id) REFERENCES budget_items(id),
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reimbursement_id INTEGER,
      invoice_no TEXT UNIQUE NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      invoice_date DATE,
      vendor TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reimbursement_id) REFERENCES reimbursements(id)
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      budget_item_id INTEGER,
      contract_id INTEGER,
      purchase_no TEXT UNIQUE NOT NULL,
      applicant TEXT NOT NULL,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(15,2) NOT NULL,
      total_amount DECIMAL(15,2) NOT NULL,
      status TEXT DEFAULT 'pending',
      approver TEXT,
      has_acceptance BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (budget_item_id) REFERENCES budget_items(id),
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    );

    CREATE TABLE IF NOT EXISTS fund_receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      receipt_no TEXT UNIQUE NOT NULL,
      batch_no TEXT,
      amount DECIMAL(15,2) NOT NULL,
      matching_funds DECIMAL(15,2) DEFAULT 0,
      receipt_date DATE NOT NULL,
      source TEXT,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS project_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER UNIQUE NOT NULL,
      completion_date DATE,
      remaining_funds DECIMAL(15,2) DEFAULT 0,
      materials TEXT,
      audit_opinion TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS approval_flows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_type TEXT NOT NULL,
      business_id INTEGER NOT NULL,
      applicant TEXT NOT NULL,
      approver TEXT,
      status TEXT DEFAULT 'pending',
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fund_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      permission_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(project_id, user_id, permission_type)
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_type TEXT NOT NULL,
      business_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      file_type TEXT,
      uploader TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  const countStmt = db.prepare("SELECT COUNT(*) as count FROM projects")
  const countResult = countStmt.get()
  if (countResult.count === 0) {
    const insertProject = db.prepare(`
      INSERT INTO projects (project_no, name, source, principal, department, start_date, end_date, total_budget, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    insertProject.run(
      'KY2024001',
      '人工智能在医疗影像诊断中的应用研究',
      '国家自然科学基金',
      '张教授',
      '计算机学院',
      '2024-01-01',
      '2026-12-31',
      500000.00,
      'active'
    )

    const insertBudget = db.prepare(`
      INSERT INTO budget_items (project_id, subject_code, subject_name, budget_amount)
      VALUES (?, ?, ?, ?)
    `)
    
    insertBudget.run(1, '01', '设备费', 200000.00)
    insertBudget.run(1, '02', '材料费', 100000.00)
    insertBudget.run(1, '03', '差旅费', 50000.00)
    insertBudget.run(1, '04', '会议费', 50000.00)
    insertBudget.run(1, '05', '劳务费', 80000.00)
    insertBudget.run(1, '06', '其他费用', 20000.00)

    const insertContract = db.prepare(`
      INSERT INTO contracts (project_id, contract_no, name, party_a, party_b, amount, sign_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    insertContract.run(1, 'HT2024001', '高性能服务器采购合同', 'XX大学', '科技公司', 150000.00, '2024-02-15')

    const insertReceipt = db.prepare(`
      INSERT INTO fund_receipts (project_id, receipt_no, batch_no, amount, matching_funds, receipt_date, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    insertReceipt.run(1, 'DK2024001', '第一批', 250000.00, 50000.00, '2024-03-01', '国家自然科学基金委')
  }
}

initDatabase()

module.exports = db
