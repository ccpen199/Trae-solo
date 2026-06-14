import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_PATH = process.env.DB_PATH || './data/app.sqlite';
const resolvedPath = path.resolve(process.cwd(), '..', DB_PATH);

let db;

export function initDB() {
  const dbDir = path.dirname(resolvedPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  seedInitialData();

  console.log(`Database initialized at ${resolvedPath}`);
  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('inventor', 'enterprise', 'lawfirm', 'agency')),
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      manager_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      industry TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manager_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS trademarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      client_id INTEGER,
      trademark_name TEXT NOT NULL,
      registration_number TEXT,
      application_number TEXT,
      category TEXT,
      status TEXT DEFAULT 'pending',
      application_date DATE,
      registration_date DATE,
      expiry_date DATE,
      risk_score INTEGER DEFAULT 0,
      risk_level TEXT DEFAULT 'low',
      owner TEXT,
      attorney TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS trademark_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      keyword TEXT NOT NULL,
      category TEXT,
      results_count INTEGER DEFAULT 0,
      risk_assessment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS trademark_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trademark_id INTEGER NOT NULL,
      assignor_id INTEGER NOT NULL,
      assignee_id INTEGER,
      assignee_name TEXT,
      transfer_price REAL,
      status TEXT DEFAULT 'pending',
      agreement_date DATE,
      completion_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trademark_id) REFERENCES trademarks(id),
      FOREIGN KEY (assignor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS patents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      client_id INTEGER,
      patent_name TEXT NOT NULL,
      patent_number TEXT,
      application_number TEXT,
      patent_type TEXT CHECK(patent_type IN ('invention', 'utility', 'design')),
      legal_status TEXT DEFAULT 'pending',
      application_date DATE,
      grant_date DATE,
      expiry_date DATE,
      next_fee_due_date DATE,
      value_estimation REAL,
      inventor TEXT,
      attorney TEXT,
      abstract TEXT,
      claims_count INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS patent_fee_reminders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patent_id INTEGER NOT NULL,
      fee_type TEXT NOT NULL,
      due_date DATE NOT NULL,
      amount REAL,
      status TEXT DEFAULT 'pending',
      reminder_sent BOOLEAN DEFAULT 0,
      paid_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patent_id) REFERENCES patents(id)
    );

    CREATE TABLE IF NOT EXISTS copyrights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      client_id INTEGER,
      work_name TEXT NOT NULL,
      work_type TEXT,
      registration_number TEXT,
      registration_date DATE,
      creation_date DATE,
      author TEXT,
      copyright_owner TEXT,
      evidence_hash TEXT,
      evidence_url TEXT,
      status TEXT DEFAULT 'registered',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS copyright_bulk_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      batch_name TEXT NOT NULL,
      total_count INTEGER DEFAULT 0,
      success_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'processing',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      client_id INTEGER,
      case_number TEXT UNIQUE NOT NULL,
      case_name TEXT NOT NULL,
      case_type TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      priority TEXT DEFAULT 'normal',
      filing_date DATE,
      close_date DATE,
      court TEXT,
      judge TEXT,
      opposing_party TEXT,
      opposing_counsel TEXT,
      case_value REAL,
      description TEXT,
      outcome TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS case_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      event_date DATE NOT NULL,
      description TEXT NOT NULL,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      client_id INTEGER,
      contract_number TEXT UNIQUE NOT NULL,
      contract_name TEXT NOT NULL,
      contract_type TEXT,
      package_type TEXT,
      start_date DATE,
      end_date DATE,
      total_amount REAL,
      paid_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      terms TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (client_id) REFERENCES clients(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      related_type TEXT,
      related_id INTEGER,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_trademarks_user ON trademarks(user_id);
    CREATE INDEX IF NOT EXISTS idx_trademarks_client ON trademarks(client_id);
    CREATE INDEX IF NOT EXISTS idx_patents_user ON patents(user_id);
    CREATE INDEX IF NOT EXISTS idx_patents_client ON patents(client_id);
    CREATE INDEX IF NOT EXISTS idx_copyrights_user ON copyrights(user_id);
    CREATE INDEX IF NOT EXISTS idx_cases_user ON cases(user_id);
    CREATE INDEX IF NOT EXISTS idx_cases_client ON cases(client_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  `);
}

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

  const saltRounds = 10;

  const users = [
    { username: 'inventor', password: '123456', name: '张三发明人', role: 'inventor', email: 'inventor@example.com', phone: '13800138001' },
    { username: 'enterprise', password: '123456', name: '创新科技有限公司', role: 'enterprise', email: 'enterprise@example.com', phone: '13800138002' },
    { username: 'lawfirm', password: '123456', name: '李明律师', role: 'lawfirm', email: 'lawfirm@example.com', phone: '13800138003' },
    { username: 'agency', password: '123456', name: '诚信代理机构', role: 'agency', email: 'agency@example.com', phone: '13800138004' }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, name, email, phone, role)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  if (userCount === 0) {
    for (const user of users) {
      const hashedPassword = bcrypt.hashSync(user.password, saltRounds);
      insertUser.run(user.username, hashedPassword, user.name, user.email, user.phone, user.role);
    }
  }

  const existingUsers = db.prepare('SELECT id, role FROM users').all();
  for (const user of existingUsers) {
    if (user.role === 'lawfirm' || user.role === 'agency') {
      const clientCount = db.prepare('SELECT COUNT(*) as count FROM clients WHERE manager_id = ?').get(user.id).count;
      if (clientCount === 0) seedClients(user.id);

      const caseCount = db.prepare('SELECT COUNT(*) as count FROM cases WHERE user_id = ?').get(user.id).count;
      if (caseCount === 0) seedCases(user.id);

      const contractCount = db.prepare('SELECT COUNT(*) as count FROM contracts WHERE user_id = ?').get(user.id).count;
      if (contractCount === 0) seedContracts(user.id);
    }

    const trademarkCount = db.prepare('SELECT COUNT(*) as count FROM trademarks WHERE user_id = ?').get(user.id).count;
    if (trademarkCount === 0) seedTrademarks(user.id);

    const patentCount = db.prepare('SELECT COUNT(*) as count FROM patents WHERE user_id = ?').get(user.id).count;
    if (patentCount === 0) seedPatents(user.id);

    const copyrightCount = db.prepare('SELECT COUNT(*) as count FROM copyrights WHERE user_id = ?').get(user.id).count;
    if (copyrightCount === 0) seedCopyrights(user.id);
  }

  const notificationCount = db.prepare('SELECT COUNT(*) as count FROM notifications').get().count;
  if (notificationCount === 0) seedNotifications();
}

function seedClients(managerId) {
  const insertClient = db.prepare(`
    INSERT INTO clients (manager_id, name, contact_person, phone, email, industry)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const clients = [
    { name: '未来科技有限公司', contact_person: '王总', phone: '13900139001', email: 'wang@future.com', industry: '人工智能' },
    { name: '绿色生态农业公司', contact_person: '刘经理', phone: '13900139002', email: 'liu@green.com', industry: '农业科技' },
    { name: '智慧城市研究院', contact_person: '陈院长', phone: '13900139003', email: 'chen@smartcity.com', industry: '智慧城市' }
  ];

  for (const client of clients) {
    insertClient.run(managerId, client.name, client.contact_person, client.phone, client.email, client.industry);
  }
}

function seedTrademarks(userId) {
  const client = db.prepare('SELECT id FROM clients WHERE manager_id = ? LIMIT 1').get(userId);
  const clientId = client ? client.id : null;

  const insertTrademark = db.prepare(`
    INSERT INTO trademarks (user_id, client_id, trademark_name, registration_number, application_number, category, status, application_date, registration_date, expiry_date, risk_score, risk_level, owner, attorney, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const trademarks = [
    { name: '创新达', regNo: '第12345678号', appNo: 'A2023001234', category: '第42类-技术服务', status: 'registered', riskScore: 15, riskLevel: 'low', owner: '创新科技' },
    { name: '绿源宝', regNo: '第12345679号', appNo: 'A2023001235', category: '第1类-化学原料', status: 'pending', riskScore: 45, riskLevel: 'medium', owner: '绿色生态' },
    { name: '智城通', regNo: '', appNo: 'A2023001236', category: '第9类-科学仪器', status: 'examination', riskScore: 75, riskLevel: 'high', owner: '智慧城市' },
    { name: '云联享', regNo: '第12345680号', appNo: 'A2023001237', category: '第35类-广告销售', status: 'registered', riskScore: 10, riskLevel: 'low', owner: '创新科技' },
    { name: '康益佳', regNo: '', appNo: 'A2023001238', category: '第5类-医药', status: 'rejected', riskScore: 90, riskLevel: 'high', owner: '未来科技' }
  ];

  for (const tm of trademarks) {
    insertTrademark.run(userId, clientId, tm.name, tm.regNo, tm.appNo, tm.category, tm.status,
      '2023-01-15', tm.status === 'registered' ? '2023-07-20' : null,
      tm.status === 'registered' ? '2033-07-19' : null,
      tm.riskScore, tm.riskLevel, tm.owner, '专业代理人', tm.notes || '');
  }
}

function seedPatents(userId) {
  const client = db.prepare('SELECT id FROM clients WHERE manager_id = ? LIMIT 1').get(userId);
  const clientId = client ? client.id : null;

  const insertPatent = db.prepare(`
    INSERT INTO patents (user_id, client_id, patent_name, patent_number, application_number, patent_type, legal_status, application_date, grant_date, expiry_date, next_fee_due_date, value_estimation, inventor, attorney, abstract, claims_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const patents = [
    { name: '一种基于AI的智能诊断系统', patentNo: 'ZL202210123456.7', appNo: '202210123456.7', type: 'invention', status: 'granted', value: 500000, claims: 15 },
    { name: '可折叠太阳能充电装置', patentNo: 'ZL202220123456.8', appNo: '202220123456.8', type: 'utility', status: 'granted', value: 150000, claims: 8 },
    { name: '智能城市交通信号灯', patentNo: '', appNo: '202330123456.9', type: 'design', status: 'pending', value: 80000, claims: 0 },
    { name: '区块链数据存证方法', patentNo: '', appNo: '202310123457.0', type: 'invention', status: 'examination', value: 800000, claims: 20 },
    { name: '生物降解环保包装材料', patentNo: 'ZL202110123457.1', appNo: '202110123457.1', type: 'invention', status: 'lapsed', value: 200000, claims: 12 }
  ];

  for (const p of patents) {
    insertPatent.run(userId, clientId, p.name, p.patentNo, p.appNo, p.type, p.status,
      '2023-03-20', p.status === 'granted' ? '2023-09-15' : null,
      p.status === 'granted' ? '2043-03-19' : null,
      '2026-03-20', p.value, '张发明人', '王律师',
      '本发明涉及' + p.name + '技术领域，公开了一种高效解决方案。',
      p.claims);
  }

  const patentIds = db.prepare('SELECT id FROM patents WHERE user_id = ?').all(userId);
  const insertFeeReminder = db.prepare(`
    INSERT INTO patent_fee_reminders (patent_id, fee_type, due_date, amount, status, reminder_sent)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const p of patentIds) {
    insertFeeReminder.run(p.id, '年费', '2026-03-20', 800, 'pending', 0);
    insertFeeReminder.run(p.id, '年费', '2027-03-20', 1200, 'pending', 0);
  }
}

function seedCopyrights(userId) {
  const client = db.prepare('SELECT id FROM clients WHERE manager_id = ? LIMIT 1').get(userId);
  const clientId = client ? client.id : null;

  const insertCopyright = db.prepare(`
    INSERT INTO copyrights (user_id, client_id, work_name, work_type, registration_number, registration_date, creation_date, author, copyright_owner, evidence_hash, evidence_url, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const copyrights = [
    { name: '智能管家系统V1.0', type: '软件著作权', regNo: '软著登字第1234567号', hash: '0x1234567890abcdef1234567890abcdef12345678' },
    { name: '企业文化宣传片', type: '视听作品', regNo: '国作登字-2023-I-00123456', hash: '0xabcdef1234567890abcdef1234567890abcdef12' },
    { name: 'AI算法模型设计文档', type: '文字作品', regNo: '', hash: '0x7890abcdef1234567890abcdef1234567890abcd' },
    { name: '产品外观设计图册', type: '美术作品', regNo: '国作登字-2023-F-00123457', hash: '0xdef1234567890abcdef1234567890abcdef12345' }
  ];

  for (const c of copyrights) {
    insertCopyright.run(userId, clientId, c.name, c.type, c.regNo, '2023-05-10', '2023-04-01',
      '创作团队', '版权所有方', c.hash, 'https://evidence.example.com/' + c.hash.slice(0, 16),
      c.regNo ? 'registered' : 'pending', '');
  }

  const insertBulk = db.prepare(`
    INSERT INTO copyright_bulk_registrations (user_id, batch_name, total_count, success_count, failed_count, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertBulk.run(userId, '2023Q4软件著作权批量登记', 50, 45, 5, 'completed');
  insertBulk.run(userId, '2024Q1美术作品批量存证', 100, 100, 0, 'completed');
  insertBulk.run(userId, '2024Q2文字作品登记', 30, 12, 0, 'processing');
}

function seedCases(userId) {
  const clients = db.prepare('SELECT id FROM clients WHERE manager_id = ?').all(userId);
  const clientIds = clients.map(c => c.id);

  const insertCase = db.prepare(`
    INSERT INTO cases (user_id, client_id, case_number, case_name, case_type, status, priority, filing_date, court, opposing_party, case_value, description, outcome)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTimeline = db.prepare(`
    INSERT INTO case_timeline (case_id, event_type, event_date, description, created_by)
    VALUES (?, ?, ?, ?, ?)
  `);

  const cases = [
    { no: 'CASE2024001', name: '创新达商标侵权纠纷案', type: 'trademark_infringement', status: 'active', priority: 'high', value: 500000, outcome: null },
    { no: 'CASE2024002', name: '智能诊断系统专利无效宣告', type: 'patent_invalidation', status: 'active', priority: 'high', value: 800000, outcome: null },
    { no: 'CASE2024003', name: '软件著作权侵权诉讼', type: 'copyright_infringement', status: 'closed', priority: 'medium', value: 200000, outcome: '胜诉' },
    { no: 'CASE2024004', name: '商业秘密侵权纠纷', type: 'trade_secret', status: 'active', priority: 'high', value: 1200000, outcome: null },
    { no: 'CASE2024005', name: '专利许可合同争议', type: 'contract_dispute', status: 'closed', priority: 'low', value: 300000, outcome: '调解' }
  ];

  for (const c of cases) {
    const existingCase = db.prepare('SELECT id FROM cases WHERE case_number = ?').get(c.no);
    if (existingCase) {
      continue;
    }
    const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
    const caseId = insertCase.run(userId, clientId, c.no, c.name, c.type, c.status, c.priority,
      '2024-01-10', '北京市知识产权法院', '某侵权公司', c.value,
      '原告拥有合法知识产权，被告未经许可实施侵权行为。', c.outcome).lastInsertRowid;

    insertTimeline.run(caseId, 'filing', '2024-01-10', '案件立案，法院受理通知书已送达', userId);
    insertTimeline.run(caseId, 'evidence', '2024-02-15', '完成证据交换，原告提交侵权证据32份', userId);
    insertTimeline.run(caseId, 'hearing', '2024-03-20', '第一次开庭审理，双方进行质证辩论', userId);
    if (c.status === 'closed') {
      insertTimeline.run(caseId, 'judgment', '2024-05-10', '法院作出判决，' + c.outcome, userId);
    }
  }
}

function seedContracts(userId) {
  const clients = db.prepare('SELECT id FROM clients WHERE manager_id = ?').all(userId);
  const clientIds = clients.map(c => c.id);

  const insertContract = db.prepare(`
    INSERT INTO contracts (user_id, client_id, contract_number, contract_name, contract_type, package_type, start_date, end_date, total_amount, paid_amount, status, terms)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const contracts = [
    { no: 'CT2024001', name: '2024年度知识产权管家服务合同', type: 'service', package: 'enterprise_premium', amount: 180000, paid: 90000, status: 'active' },
    { no: 'CT2024002', name: '专利申请代理服务合同', type: 'agency', package: 'patent_full', amount: 80000, paid: 80000, status: 'completed' },
    { no: 'CT2024003', name: '商标国际注册服务合同', type: 'agency', package: 'trademark_intl', amount: 120000, paid: 60000, status: 'active' },
    { no: 'CT2024004', name: '常年知识产权法律顾问合同', type: 'legal', package: 'yearly_retainer', amount: 200000, paid: 100000, status: 'active' }
  ];

  for (const c of contracts) {
    const existingContract = db.prepare('SELECT id FROM contracts WHERE contract_number = ?').get(c.no);
    if (existingContract) {
      continue;
    }
    const clientId = clientIds[Math.floor(Math.random() * clientIds.length)];
    insertContract.run(userId, clientId, c.no, c.name, c.type, c.package,
      '2024-01-01', '2024-12-31', c.amount, c.paid, c.status,
      '服务范围包括：商标、专利、版权的申请、维护、维权等全流程服务。');
  }
}

function seedNotifications() {
  const users = db.prepare('SELECT id FROM users').all();
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, related_type, related_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const user of users) {
    insertNotif.run(user.id, 'fee_reminder', '年费提醒', '您有3项专利年费将于30日内到期，请及时处理', 'patent', 1);
    insertNotif.run(user.id, 'case_update', '案件进度更新', 'CASE2024001商标侵权案将于下周开庭', 'case', 1);
    insertNotif.run(user.id, 'trademark_alert', '商标风险预警', '"绿源宝"商标检测到近似申请，风险等级: 中', 'trademark', 2);
  }
}

export function getDB() {
  if (!db) {
    initDB();
  }
  return db;
}

export { db };
