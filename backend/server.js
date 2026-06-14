
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const crypto = require('crypto');

const app = express();
const PORT = process.env.BACKEND_PORT || 58783;

app.use(cors({ origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48783}` }));
app.use(express.json());

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const hashPassword = (password) =>
  crypto.createHash('sha256').update(`may-88783:${String(password || '')}`).digest('hex');

const publicUser = (user) => {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

function ensurePortalUsers() {
  const users = [
    { username: 'admin', password: 'Admin@123', displayName: '省级管理员', role: 'admin', phone: '13800138000' },
    { username: 'staff', password: 'Staff@123', displayName: '经办人员', role: 'caseworker', phone: '13800138001' },
    { username: 'user', password: 'User@123', displayName: '参保用户', role: 'applicant', phone: '13800138002' }
  ];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO portal_users (username, password_hash, display_name, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const user of users) {
    insert.run(user.username, hashPassword(user.password), user.displayName, user.role, user.phone);
  }
}

const safeAlter = (sql) => {
  try { db.exec(sql); } catch (_) {}
};

const initSchema = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS insured_persons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_card_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      gender TEXT,
      birth_date TEXT,
      identity_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      business_status TEXT DEFAULT 'registered',
      certification_expire_date TEXT,
      benefit_type TEXT,
      address TEXT,
      phone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS social_security_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      insured_person_id INTEGER NOT NULL,
      account_type TEXT NOT NULL,
      balance REAL DEFAULT 0,
      personal_in REAL DEFAULT 0,
      personal_out REAL DEFAULT 0,
      pooled_in REAL DEFAULT 0,
      pooled_out REAL DEFAULT 0,
      total_contribution_years INTEGER DEFAULT 0,
      total_contribution_months INTEGER DEFAULT 0,
      base_amount REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id)
    );

    CREATE TABLE IF NOT EXISTS business_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      required_materials TEXT,
      flow_steps TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      insured_person_id INTEGER NOT NULL,
      business_item_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      current_step TEXT,
      materials TEXT,
      face_verified INTEGER DEFAULT 0,
      material_checked INTEGER DEFAULT 0,
      cross_dept_checked INTEGER DEFAULT 0,
      cross_dept_result TEXT,
      reject_reason TEXT,
      withdraw_reason TEXT,
      result TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id),
      FOREIGN KEY (business_item_id) REFERENCES business_items(id)
    );

    CREATE TABLE IF NOT EXISTS service_record_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_record_id INTEGER NOT NULL,
      step_name TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      operator TEXT,
      operator_role TEXT,
      result TEXT,
      detail TEXT,
      started_at TEXT,
      completed_at TEXT,
      FOREIGN KEY (service_record_id) REFERENCES service_records(id)
    );

    CREATE TABLE IF NOT EXISTS electronic_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      insured_person_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT,
      data TEXT NOT NULL,
      digital_signature TEXT,
      related_record_id INTEGER,
      issued_at TEXT DEFAULT CURRENT_TIMESTAMP,
      expires_at TEXT,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id)
    );

    CREATE TABLE IF NOT EXISTS payment_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      insured_person_id INTEGER NOT NULL,
      account_id INTEGER,
      payment_amount REAL DEFAULT 0,
      payment_date TEXT,
      payment_type TEXT,
      payment_month TEXT,
      base_amount REAL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (insured_person_id) REFERENCES insured_persons(id)
    );

    CREATE TABLE IF NOT EXISTS policy_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_code TEXT UNIQUE NOT NULL,
      rule_name TEXT NOT NULL,
      policy_source TEXT,
      effective_date TEXT,
      rule_content TEXT,
      business_nodes TEXT,
      mapped_flows TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      operator TEXT,
      detail TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS portal_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'applicant',
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  safeAlter(`ALTER TABLE insured_persons ADD COLUMN business_status TEXT DEFAULT 'registered'`);
  safeAlter(`ALTER TABLE insured_persons ADD COLUMN certification_expire_date TEXT`);
  safeAlter(`ALTER TABLE insured_persons ADD COLUMN benefit_type TEXT`);
  safeAlter(`ALTER TABLE social_security_accounts ADD COLUMN personal_in REAL DEFAULT 0`);
  safeAlter(`ALTER TABLE social_security_accounts ADD COLUMN personal_out REAL DEFAULT 0`);
  safeAlter(`ALTER TABLE social_security_accounts ADD COLUMN pooled_in REAL DEFAULT 0`);
  safeAlter(`ALTER TABLE social_security_accounts ADD COLUMN pooled_out REAL DEFAULT 0`);
  safeAlter(`ALTER TABLE social_security_accounts ADD COLUMN total_contribution_months INTEGER DEFAULT 0`);
  safeAlter(`ALTER TABLE social_security_accounts ADD COLUMN base_amount REAL DEFAULT 0`);
  safeAlter(`ALTER TABLE business_items ADD COLUMN flow_steps TEXT`);
  safeAlter(`ALTER TABLE service_records ADD COLUMN current_step TEXT`);
  safeAlter(`ALTER TABLE service_records ADD COLUMN face_verified INTEGER DEFAULT 0`);
  safeAlter(`ALTER TABLE service_records ADD COLUMN material_checked INTEGER DEFAULT 0`);
  safeAlter(`ALTER TABLE service_records ADD COLUMN cross_dept_checked INTEGER DEFAULT 0`);
  safeAlter(`ALTER TABLE service_records ADD COLUMN cross_dept_result TEXT`);
  safeAlter(`ALTER TABLE service_records ADD COLUMN reject_reason TEXT`);
  safeAlter(`ALTER TABLE service_records ADD COLUMN withdraw_reason TEXT`);
  safeAlter(`ALTER TABLE payment_records ADD COLUMN base_amount REAL DEFAULT 0`);
  safeAlter(`ALTER TABLE policy_rules ADD COLUMN mapped_flows TEXT`);
  safeAlter(`ALTER TABLE electronic_credentials ADD COLUMN title TEXT`);
  safeAlter(`ALTER TABLE electronic_credentials ADD COLUMN related_record_id INTEGER`);
  safeAlter(`ALTER TABLE electronic_credentials ADD COLUMN service_record_id INTEGER`);
  safeAlter(`ALTER TABLE service_records ADD COLUMN item_name TEXT`);
  safeAlter(`ALTER TABLE service_records ADD COLUMN item_category TEXT`);
  safeAlter(`ALTER TABLE service_record_steps ADD COLUMN step_label TEXT`);
  safeAlter(`ALTER TABLE portal_users ADD COLUMN phone TEXT`);
  safeAlter(`ALTER TABLE portal_users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'`);

  insertSampleData();
  ensurePortalUsers();
};

const insertSampleData = db.transaction(() => {
  const personCount = db.prepare('SELECT COUNT(*) as c FROM insured_persons').get().c;
  if (personCount >= 3) return;

  const existingCards = new Set(
    db.prepare('SELECT id_card_number FROM insured_persons').all().map(r => r.id_card_number)
  );

  const insertPerson = db.prepare(`
    INSERT INTO insured_persons (id_card_number, name, gender, birth_date, identity_type, status, business_status, certification_expire_date, benefit_type, address, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const persons = [
    { card: '110101199001011234', name: '张三', gender: '男', birth: '1990-01-01', type: 'employee', status: 'active', bstatus: 'receiving_benefits', cert_expire: '2026-08-15', benefit: '养老待遇', addr: '北京市朝阳区建国路88号', phone: '13800138000' },
    { card: '310102198505150022', name: '李四', gender: '男', birth: '1985-05-15', type: 'resident', status: 'suspended', bstatus: 'suspended', cert_expire: null, benefit: null, addr: '上海市黄浦区南京东路100号', phone: '13900139001' },
    { card: '440103197812250033', name: '王五', gender: '女', birth: '1978-12-25', type: 'institution', status: 'active', bstatus: 'certification_expiring', cert_expire: '2026-07-01', benefit: '机关养老待遇', addr: '广州市越秀区中山三路33号', phone: '13700137002' }
  ];

  const personIds = {};
  for (const p of persons) {
    if (!existingCards.has(p.card)) {
      const r = insertPerson.run(p.card, p.name, p.gender, p.birth, p.type, p.status, p.bstatus, p.cert_expire, p.benefit, p.addr, p.phone);
      personIds[p.name] = Number(r.lastInsertRowid);
    } else {
      const row = db.prepare('SELECT id FROM insured_persons WHERE id_card_number = ?').get(p.card);
      personIds[p.name] = row.id;
    }
  }

  const insertAccount = db.prepare(`
    INSERT INTO social_security_accounts (insured_person_id, account_type, balance, personal_in, personal_out, pooled_in, pooled_out, total_contribution_years, total_contribution_months, base_amount)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const acctCount = db.prepare('SELECT COUNT(*) as c FROM social_security_accounts').get().c;
  if (acctCount < 9) {
    const zhangId = personIds['张三'];
    insertAccount.run(zhangId, 'individual', 52380.50, 8200.00, 1200.00, 0, 0, 10, 6, 8500);
    insertAccount.run(zhangId, 'pooled', 0, 0, 0, 156000.00, 48000.00, 10, 6, 8500);
    insertAccount.run(zhangId, 'medical', 8650.30, 2400.00, 350.00, 0, 0, 10, 6, 8500);

    const liId = personIds['李四'];
    insertAccount.run(liId, 'individual', 18720.00, 3600.00, 0, 0, 0, 5, 3, 6000);
    insertAccount.run(liId, 'pooled', 0, 0, 0, 42000.00, 0, 5, 3, 6000);
    insertAccount.run(liId, 'medical', 3210.50, 960.00, 120.00, 0, 0, 5, 3, 6000);

    const wangId = personIds['王五'];
    insertAccount.run(wangId, 'individual', 78900.00, 12000.00, 0, 0, 0, 15, 0, 12000);
    insertAccount.run(wangId, 'pooled', 0, 0, 0, 234000.00, 56000.00, 15, 0, 12000);
    insertAccount.run(wangId, 'medical', 15200.00, 4800.00, 600.00, 0, 0, 15, 0, 12000);
  }

  const itemCount = db.prepare('SELECT COUNT(*) as c FROM business_items').get().c;
  if (itemCount < 5) {
    const insertItem = db.prepare(`
      INSERT INTO business_items (code, name, description, category, required_materials, flow_steps)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const flowSteps = JSON.stringify([
      { name: 'face_verify', label: '人脸核验' },
      { name: 'material_check', label: '材料预检' },
      { name: 'cross_dept_verify', label: '跨部门比对' },
      { name: 'review', label: '审核' },
      { name: 'approve', label: '审批' }
    ]);
    insertItem.run('REG-001', '参保登记', '办理社会保险参保登记手续', 'registration', JSON.stringify(['身份证', '户口本', '照片']), flowSteps);
    insertItem.run('BEN-001', '待遇申领', '申领社会保险待遇', 'benefit', JSON.stringify(['身份证', '银行卡', '申请表']), flowSteps);
    insertItem.run('CER-001', '资格认证', '进行社会保险待遇资格认证', 'certification', JSON.stringify(['身份证', '人脸识别']), flowSteps);
    insertItem.run('QRY-001', '缴费查询', '查询社会保险缴费记录', 'query', JSON.stringify(['身份证']), flowSteps);
    insertItem.run('PRF-001', '参保证明开具', '开具社会保险参保证明', 'proof', JSON.stringify(['身份证']), flowSteps);
  }

  const payCount = db.prepare('SELECT COUNT(*) as c FROM payment_records').get().c;
  if (payCount < 12) {
    const insertPay = db.prepare(`
      INSERT INTO payment_records (insured_person_id, account_id, payment_amount, payment_date, payment_type, payment_month, base_amount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const zhangId = personIds['张三'];
    const zhangAccts = db.prepare('SELECT id, account_type FROM social_security_accounts WHERE insured_person_id = ?').all(zhangId);
    const zhangInd = zhangAccts.find(a => a.account_type === 'individual')?.id;
    const zhangMed = zhangAccts.find(a => a.account_type === 'medical')?.id;
    if (zhangInd) {
      insertPay.run(zhangId, zhangInd, 680.00, '2026-05-15', '个人缴纳', '2026-05', 8500);
      insertPay.run(zhangId, zhangInd, 680.00, '2026-04-15', '个人缴纳', '2026-04', 8500);
      insertPay.run(zhangId, zhangInd, 680.00, '2026-03-15', '个人缴纳', '2026-03', 8500);
    }
    if (zhangMed) {
      insertPay.run(zhangId, zhangMed, 170.00, '2026-05-15', '个人缴纳', '2026-05', 8500);
      insertPay.run(zhangId, zhangMed, 170.00, '2026-04-15', '个人缴纳', '2026-04', 8500);
    }
    const liId = personIds['李四'];
    const liAccts = db.prepare('SELECT id, account_type FROM social_security_accounts WHERE insured_person_id = ?').all(liId);
    const liInd = liAccts.find(a => a.account_type === 'individual')?.id;
    if (liInd) {
      insertPay.run(liId, liInd, 360.00, '2026-02-15', '个人缴纳', '2026-02', 6000);
      insertPay.run(liId, liInd, 360.00, '2026-01-15', '个人缴纳', '2026-01', 6000);
    }
    const wangId = personIds['王五'];
    const wangAccts = db.prepare('SELECT id, account_type FROM social_security_accounts WHERE insured_person_id = ?').all(wangId);
    const wangInd = wangAccts.find(a => a.account_type === 'individual')?.id;
    const wangMed = wangAccts.find(a => a.account_type === 'medical')?.id;
    if (wangInd) {
      insertPay.run(wangId, wangInd, 960.00, '2026-05-15', '个人缴纳', '2026-05', 12000);
      insertPay.run(wangId, wangInd, 960.00, '2026-04-15', '个人缴纳', '2026-04', 12000);
    }
    if (wangMed) {
      insertPay.run(wangId, wangMed, 240.00, '2026-05-15', '个人缴纳', '2026-05', 12000);
    }
  }

  const ruleCount = db.prepare('SELECT COUNT(*) as c FROM policy_rules').get().c;
  if (ruleCount < 4) {
    const insertRule = db.prepare(`
      INSERT INTO policy_rules (rule_code, rule_name, policy_source, effective_date, rule_content, business_nodes, mapped_flows)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertRule.run(
      'POL-2026-001', '灵活就业人员参保登记简化', '人社部发〔2026〕12号', '2026-03-01',
      '取消灵活就业人员参保登记户籍限制，凭居住证即可在就业地参保登记，精简材料至身份证和居住证。',
      JSON.stringify(['参保登记']),
      JSON.stringify([{ flow: '参保登记', change: '材料精简', detail: '取消户口本要求，新增居住证替代' }])
    );
    insertRule.run(
      'POL-2026-002', '养老保险待遇资格认证周期调整', '人社部发〔2026〕18号', '2026-04-15',
      '领取养老保险待遇人员资格认证周期从12个月调整为6个月，支持静默认证和数据比对认证方式。',
      JSON.stringify(['资格认证']),
      JSON.stringify([{ flow: '资格认证', change: '周期缩短', detail: '认证周期由12个月调整为6个月，新增静默认证通道' }])
    );
    insertRule.run(
      'POL-2026-003', '跨省社保转移接续优化', '人社部发〔2026〕25号', '2026-06-01',
      '跨省社保关系转移全程线上办理，取消纸质材料，15个工作日内完成，支持医保、养老同步转移。',
      JSON.stringify(['参保登记', '待遇申领']),
      JSON.stringify([
        { flow: '参保登记', change: '流程优化', detail: '新增跨省转入快速通道，取消纸质证明' },
        { flow: '待遇申领', change: '条件放宽', detail: '转移接续期间待遇不中断' }
      ])
    );
    insertRule.run(
      'POL-2026-004', '社保卡虚拟化与电子凭证互通', '人社厅发〔2026〕08号', '2026-05-01',
      '全面推行社保卡虚拟化，电子社保卡与医保电子凭证互通互认，支持在线开具参保证明并数字签名。',
      JSON.stringify(['参保证明开具', '缴费查询']),
      JSON.stringify([
        { flow: '参保证明开具', change: '新增电子凭证', detail: '支持PDF数字签名，在线验证真伪' },
        { flow: '缴费查询', change: '数据打通', detail: '对接税务缴费数据，实时同步' }
      ])
    );
  }

  const credCount = db.prepare('SELECT COUNT(*) as c FROM electronic_credentials').get().c;
  if (credCount < 3) {
    const recordStmt = db.prepare('SELECT id FROM service_records WHERE insured_person_id = ? ORDER BY id DESC LIMIT 1');
    const insertCred = db.prepare(`
      INSERT INTO electronic_credentials (insured_person_id, type, title, data, digital_signature, service_record_id, issued_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const sign = (payload) => crypto.createHash('sha256').update(JSON.stringify(payload) + Date.now()).digest('hex').slice(0, 32);
    const zhangId = personIds['张三'];
    const zhangRecord = recordStmt.get(zhangId);
    insertCred.run(zhangId, 'virtual_card', '电子社保卡', JSON.stringify({ card_no: 'SB110101199001011234', status: 'active', issuer: '北京市人社局' }), sign({ person: zhangId, type: 'virtual_card' }), zhangRecord?.id || null, '2025-06-01T00:00:00', '2030-06-01T00:00:00');
    insertCred.run(zhangId, 'proof_pdf', '参保证明', JSON.stringify({ proof_no: 'PRF-2026-00123', content: '兹证明张三，身份证号110101199001011234，自2016年1月起参加社会保险，累计缴费10年6个月。', issue_unit: '北京市社保中心' }), sign({ person: zhangId, type: 'proof_pdf' }), zhangRecord?.id || null, '2026-05-20T10:30:00', '2026-11-20T00:00:00');

    const wangId = personIds['王五'];
    const wangRecord = recordStmt.get(wangId);
    insertCred.run(wangId, 'virtual_card', '电子社保卡', JSON.stringify({ card_no: 'SB440103197812250033', status: 'active', issuer: '广东省人社厅' }), sign({ person: wangId, type: 'virtual_card' }), wangRecord?.id || null, '2025-08-01T00:00:00', '2030-08-01T00:00:00');
  }
});

initSchema();

const personFields = `
  id, id_card_number, name, gender, birth_date, identity_type, status,
  business_status, certification_expire_date, benefit_type,
  address, phone, created_at, updated_at
`;

const accountFields = `
  id, insured_person_id, account_type,
  balance, personal_in, personal_out, pooled_in, pooled_out,
  total_contribution_years, total_contribution_months, base_amount,
  created_at, updated_at
`;

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    const cleanUsername = String(username || '').trim();
    if (!cleanUsername || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const user = db.prepare('SELECT * FROM portal_users WHERE username = ? AND status = ?')
      .get(cleanUsername, 'active');
    if (!user || user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE portal_users SET updated_at = ? WHERE id = ?
    `).run(now, user.id);

    res.json({
      token: crypto.createHash('sha256').update(`${user.id}|${cleanUsername}|${now}`).digest('hex'),
      user: publicUser({ ...user, updated_at: now }),
      message: '登录成功'
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, display_name, phone } = req.body || {};
    const cleanUsername = String(username || '').trim();
    const cleanPassword = String(password || '').trim();
    if (cleanUsername.length < 3 || cleanPassword.length < 6) {
      return res.status(400).json({ error: 'username must be at least 3 chars and password at least 6 chars' });
    }

    const exists = db.prepare('SELECT id FROM portal_users WHERE username = ?').get(cleanUsername);
    if (exists) return res.status(409).json({ error: 'username already exists' });

    const result = db.prepare(`
      INSERT INTO portal_users (username, password_hash, display_name, role, phone)
      VALUES (?, ?, ?, 'applicant', ?)
    `).run(cleanUsername, hashPassword(cleanPassword), display_name || cleanUsername, phone || '');

    const user = db.prepare('SELECT * FROM portal_users WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json({
      token: crypto.createHash('sha256').update(`${user.id}|${cleanUsername}|${Date.now()}`).digest('hex'),
      user: publicUser(user),
      message: '注册成功'
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const username = req.get('x-demo-user') || 'admin';
    const user = db.prepare('SELECT * FROM portal_users WHERE username = ?').get(username);
    res.json({ user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

const profileHandler = (req, res) => {
  try {
    const username = req.get('x-demo-user') || 'admin';
    const user = db.prepare('SELECT * FROM portal_users WHERE username = ?').get(username);
    const primaryPerson = db.prepare(`SELECT ${personFields} FROM insured_persons ORDER BY id LIMIT 1`).get();
    res.json({
      user: publicUser(user),
      profile: primaryPerson,
      permissions: ['auth:login', 'search:read', 'admin:overview', 'discover:read']
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
};

app.get('/api/users/profile', profileHandler);
app.get('/api/user/profile', profileHandler);

app.get('/api/summary', (req, res) => {
  try {
    const count = (table, where = '1=1') => {
      try { return db.prepare(`SELECT COUNT(*) AS c FROM ${table} WHERE ${where}`).get().c; } catch (_) { return 0; }
    };
    res.json({
      insuredPersons: count('insured_persons'),
      activePersons: count('insured_persons', "status IN ('active','normal')"),
      businessItems: count('business_items', 'is_active = 1'),
      serviceRecords: count('service_records'),
      paymentRecords: count('payment_records'),
      policyRules: count('policy_rules', 'is_active = 1'),
      credentials: count('electronic_credentials'),
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/insured-persons', (req, res) => {
  try {
    const persons = db.prepare(`SELECT ${personFields} FROM insured_persons`).all();
    res.json(persons);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/persons', (req, res) => {
  try {
    const persons = db.prepare(`SELECT ${personFields} FROM insured_persons`).all();
    res.json(persons);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/insured-persons/:id', (req, res) => {
  try {
    const person = db.prepare(`SELECT ${personFields} FROM insured_persons WHERE id = ?`).get(req.params.id);
    if (!person) return res.status(404).json({ error: 'Person not found' });
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/persons/:id', (req, res) => {
  try {
    const person = db.prepare(`SELECT ${personFields} FROM insured_persons WHERE id = ?`).get(req.params.id);
    if (!person) return res.status(404).json({ error: 'Person not found' });
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/insured-persons/:id/accounts', (req, res) => {
  try {
    const accounts = db.prepare(`SELECT ${accountFields} FROM social_security_accounts WHERE insured_person_id = ?`).all(req.params.id);
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/persons/:id/accounts', (req, res) => {
  try {
    const accounts = db.prepare(`SELECT ${accountFields} FROM social_security_accounts WHERE insured_person_id = ?`).all(req.params.id);
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/business-items', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM business_items WHERE is_active = 1').all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/service-records', (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const records = db.prepare(`
      SELECT sr.*, ip.name as person_name, bi.name as item_name, bi.category as item_category
      FROM service_records sr
      JOIN insured_persons ip ON sr.insured_person_id = ip.id
      JOIN business_items bi ON sr.business_item_id = bi.id
      ORDER BY sr.created_at DESC, sr.id DESC
      LIMIT ?
    `).all(limit);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/service-records/:id', (req, res) => {
  try {
    const record = db.prepare(`
      SELECT sr.*, ip.name as person_name, bi.name as item_name, bi.category as item_category
      FROM service_records sr
      JOIN insured_persons ip ON sr.insured_person_id = ip.id
      JOIN business_items bi ON sr.business_item_id = bi.id
      WHERE sr.id = ?
    `).get(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const steps = db.prepare(`
      SELECT * FROM service_record_steps
      WHERE service_record_id = ?
      ORDER BY step_order
    `).all(req.params.id);
    const audit_logs = db.prepare(`
      SELECT * FROM audit_logs
      WHERE entity_type = 'service_record' AND entity_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).all(req.params.id);

    res.json({ ...record, steps, audit_logs });
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/service-records/:id/steps', (req, res) => {
  try {
    const steps = db.prepare(`
      SELECT * FROM service_record_steps
      WHERE service_record_id = ?
      ORDER BY step_order
    `).all(req.params.id);
    res.json(steps);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.post('/api/service-records', (req, res) => {
  try {
    const { insured_person_id, business_item_id, materials } = req.body;
    if (!insured_person_id || !business_item_id) {
      return res.status(400).json({ error: 'insured_person_id and business_item_id are required' });
    }

    const person = db.prepare('SELECT id FROM insured_persons WHERE id = ?').get(insured_person_id);
    const item = db.prepare('SELECT * FROM business_items WHERE id = ?').get(business_item_id);
    if (!person || !item) {
      return res.status(400).json({ error: 'Invalid insured person or business item' });
    }

    let flowSteps = [];
    try { flowSteps = JSON.parse(item.flow_steps || '[]'); } catch (_) {}

    const stepNames = flowSteps.length ? flowSteps : [
      { name: 'face_verify', label: '人脸核验' },
      { name: 'material_check', label: '材料预检' },
      { name: 'cross_dept_verify', label: '跨部门比对' },
      { name: 'review', label: '审核' },
      { name: 'approve', label: '审批' }
    ];

    const firstStep = stepNames[0]?.name || 'face_verify';

    const insertRecord = db.transaction(() => {
      const result = db.prepare(`
        INSERT INTO service_records (insured_person_id, business_item_id, status, current_step, materials, face_verified, material_checked, cross_dept_checked)
        VALUES (?, ?, 'pending', ?, ?, 0, 0, 0)
      `).run(insured_person_id, business_item_id, firstStep, JSON.stringify(materials || {}));

      const recordId = Number(result.lastInsertRowid);

      const insertStep = db.prepare(`
        INSERT INTO service_record_steps (service_record_id, step_name, step_order, status, started_at)
        VALUES (?, ?, ?, 'pending', ?)
      `);

      stepNames.forEach((step, i) => {
        insertStep.run(recordId, step.name, i + 1, i === 0 ? new Date().toISOString() : null);
      });

      db.prepare(`
        INSERT INTO audit_logs (entity_type, entity_id, action, operator, detail)
        VALUES ('service_record', ?, 'create', 'system', ?)
      `).run(recordId, `创建业务办理记录: ${item.name}`);

      return recordId;
    })();

    const newRecord = db.prepare(`
      SELECT sr.*, ip.name as person_name, bi.name as item_name, bi.category as item_category
      FROM service_records sr
      JOIN insured_persons ip ON sr.insured_person_id = ip.id
      JOIN business_items bi ON sr.business_item_id = bi.id
      WHERE sr.id = ?
    `).get(insertRecord);

    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.post('/api/service-records/:id/advance-step', (req, res) => {
  try {
    const record = db.prepare('SELECT * FROM service_records WHERE id = ?').get(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });

    const { step_result, operator, operator_role, detail } = req.body;
    const action = req.body.action || 'pass';

    const advance = db.transaction(() => {
      const currentStepRow = db.prepare(`
        SELECT * FROM service_record_steps
        WHERE service_record_id = ? AND status = 'pending'
        ORDER BY step_order
        LIMIT 1
      `).get(record.id);

      if (!currentStepRow) {
        return { error: 'No pending step found' };
      }

      const now = new Date().toISOString();

      if (action === 'reject') {
        db.prepare(`
          UPDATE service_record_steps SET status = 'rejected', result = ?, completed_at = ?, operator = ?
          WHERE id = ?
        `).run(step_result || '不通过', now, operator || 'system', currentStepRow.id);

        db.prepare(`
          UPDATE service_records SET status = 'rejected', reject_reason = ?, updated_at = ?
          WHERE id = ?
        `).run(detail || step_result || '审核不通过', now, record.id);

        db.prepare(`
          INSERT INTO audit_logs (entity_type, entity_id, action, operator, detail)
          VALUES ('service_record', ?, 'reject', ?, ?)
        `).run(record.id, operator || 'system', `步骤${currentStepRow.step_name}拒绝: ${detail || step_result || ''}`);

        return { status: 'rejected' };
      }

      db.prepare(`
        UPDATE service_record_steps SET status = 'completed', result = ?, completed_at = ?, operator = ?, detail = ?
        WHERE id = ?
      `).run(step_result || '通过', now, operator || 'system', detail || '', currentStepRow.id);

      const stepFlags = {
        face_verify: 'face_verified',
        material_check: 'material_checked',
        cross_dept_verify: 'cross_dept_checked'
      };

      if (stepFlags[currentStepRow.step_name]) {
        db.prepare(`
          UPDATE service_records SET ${stepFlags[currentStepRow.step_name]} = 1, updated_at = ? WHERE id = ?
        `).run(now, record.id);
      }

      if (currentStepRow.step_name === 'cross_dept_verify' && detail) {
        db.prepare(`
          UPDATE service_records SET cross_dept_result = ?, updated_at = ? WHERE id = ?
        `).run(detail, now, record.id);
      }

      const nextStep = db.prepare(`
        SELECT * FROM service_record_steps
        WHERE service_record_id = ? AND step_order > ? AND status = 'pending'
        ORDER BY step_order
        LIMIT 1
      `).get(record.id, currentStepRow.step_order);

      if (nextStep) {
        db.prepare(`
          UPDATE service_record_steps SET started_at = ? WHERE id = ?
        `).run(now, nextStep.id);

        db.prepare(`
          UPDATE service_records SET current_step = ?, status = 'processing', updated_at = ? WHERE id = ?
        `).run(nextStep.step_name, now, record.id);

        db.prepare(`
          INSERT INTO audit_logs (entity_type, entity_id, action, operator, detail)
          VALUES ('service_record', ?, 'advance', ?, ?)
        `).run(record.id, operator || 'system', `步骤${currentStepRow.step_name}通过，进入${nextStep.step_name}`);
      } else {
        db.prepare(`
          UPDATE service_records SET status = 'completed', current_step = NULL, updated_at = ? WHERE id = ?
        `).run(now, record.id);

        db.prepare(`
          INSERT INTO audit_logs (entity_type, entity_id, action, operator, detail)
          VALUES ('service_record', ?, 'complete', ?, ?)
        `).run(record.id, operator || 'system', '所有步骤完成，业务办理成功');

        if (record.business_item_id) {
          const item = db.prepare('SELECT * FROM business_items WHERE id = ?').get(record.business_item_id);
          if (item && (item.category === 'proof' || item.category === 'certification')) {
            const sign = crypto.createHash('sha256').update(`${record.id}-${Date.now()}`).digest('hex').slice(0, 32);
            const person = db.prepare('SELECT * FROM insured_persons WHERE id = ?').get(record.insured_person_id);
            db.prepare(`
              INSERT INTO electronic_credentials (insured_person_id, type, title, data, digital_signature, related_record_id, service_record_id, issued_at, expires_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              record.insured_person_id,
              item.category === 'proof' ? 'proof_pdf' : 'certification_record',
              item.category === 'proof' ? '参保证明' : '资格认证记录',
              JSON.stringify({
                record_id: record.id,
                item_name: item.name,
                person_name: person?.name,
                id_card: person?.id_card_number,
                issue_unit: '省级社保中心',
                detail: item.category === 'proof'
                  ? `兹证明${person?.name}，身份证号${person?.id_card_number}，当前参保状态正常。`
                  : `${person?.name}已完成${item.name}，认证通过。`
              }),
              sign,
              record.id,
              record.id,
              now,
              new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString()
            );
          }
        }
      }

      return { status: nextStep ? 'processing' : 'completed' };
    })();

    if (advance.error) {
      return res.status(400).json({ error: advance.error });
    }

    const updatedRecord = db.prepare(`
      SELECT sr.*, ip.name as person_name, bi.name as item_name, bi.category as item_category
      FROM service_records sr
      JOIN insured_persons ip ON sr.insured_person_id = ip.id
      JOIN business_items bi ON sr.business_item_id = bi.id
      WHERE sr.id = ?
    `).get(record.id);

    const steps = db.prepare(`
      SELECT * FROM service_record_steps WHERE service_record_id = ? ORDER BY step_order
    `).all(record.id);

    res.json({ record: updatedRecord, steps, advanceResult: advance });
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.post('/api/service-records/:id/withdraw', (req, res) => {
  try {
    const record = db.prepare('SELECT * FROM service_records WHERE id = ?').get(req.params.id);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    const { reason } = req.body;
    const now = new Date().toISOString();

    db.prepare(`UPDATE service_records SET status = 'withdrawn', withdraw_reason = ?, updated_at = ? WHERE id = ?`)
      .run(reason || '申请人主动撤回', now, record.id);

    db.prepare(`
      INSERT INTO audit_logs (entity_type, entity_id, action, operator, detail)
      VALUES ('service_record', ?, 'withdraw', 'applicant', ?)
    `).run(record.id, reason || '申请人主动撤回');

    const updated = db.prepare(`
      SELECT sr.*, ip.name as person_name, bi.name as item_name, bi.category as item_category
      FROM service_records sr
      JOIN insured_persons ip ON sr.insured_person_id = ip.id
      JOIN business_items bi ON sr.business_item_id = bi.id
      WHERE sr.id = ?
    `).get(record.id);

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/payment-records', (req, res) => {
  try {
    const personId = req.query.personId || null;
    const records = db.prepare(`
      SELECT pr.*, ip.name as person_name, ssa.account_type
      FROM payment_records pr
      JOIN insured_persons ip ON pr.insured_person_id = ip.id
      LEFT JOIN social_security_accounts ssa ON pr.account_id = ssa.id
      WHERE (? IS NULL OR pr.insured_person_id = ?)
      ORDER BY pr.payment_date DESC
      LIMIT 50
    `).all(personId, personId);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/electronic-credentials', (req, res) => {
  try {
    const personId = req.query.personId || null;
    const creds = db.prepare(`
      SELECT * FROM electronic_credentials
      WHERE (? IS NULL OR insured_person_id = ?)
      ORDER BY issued_at DESC
    `).all(personId, personId);
    res.json(creds);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.post('/api/electronic-credentials', (req, res) => {
  try {
    const { insured_person_id, type, title, data, related_record_id, service_record_id } = req.body;
    if (!insured_person_id || !type) {
      return res.status(400).json({ error: 'insured_person_id and type are required' });
    }
    const sign = crypto.createHash('sha256').update(JSON.stringify(data) + Date.now()).digest('hex').slice(0, 32);
    const now = new Date().toISOString();
    const expires = new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString();

    const result = db.prepare(`
      INSERT INTO electronic_credentials (insured_person_id, type, title, data, digital_signature, related_record_id, service_record_id, issued_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(insured_person_id, type, title || type, JSON.stringify(data || {}), sign, related_record_id || null, service_record_id || related_record_id || null, now, expires);

    const cred = db.prepare('SELECT * FROM electronic_credentials WHERE id = ?').get(Number(result.lastInsertRowid));
    res.status(201).json(cred);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/policy-rules', (req, res) => {
  try {
    const rules = db.prepare(`
      SELECT * FROM policy_rules WHERE is_active = 1 ORDER BY effective_date DESC
    `).all();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/search', (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || 'all').trim();
    const like = `%${q}%`;
    const hasQuery = q.length > 0;

    const persons = hasQuery
      ? db.prepare(`
        SELECT ${personFields} FROM insured_persons
        WHERE name LIKE ? OR id_card_number LIKE ? OR phone LIKE ? OR identity_type LIKE ? OR business_status LIKE ?
        LIMIT 20
      `).all(like, like, like, like, like)
      : db.prepare(`SELECT ${personFields} FROM insured_persons LIMIT 10`).all();

    const businessItems = db.prepare(`
      SELECT * FROM business_items
      WHERE is_active = 1
        AND (? = 'all' OR category = ?)
        AND (? = 0 OR name LIKE ? OR description LIKE ? OR category LIKE ?)
      ORDER BY id
      LIMIT 30
    `).all(category, category, hasQuery ? 1 : 0, like, like, like);

    const policyRules = db.prepare(`
      SELECT * FROM policy_rules
      WHERE is_active = 1
        AND (? = 0 OR rule_name LIKE ? OR policy_source LIKE ? OR rule_content LIKE ? OR business_nodes LIKE ?)
      ORDER BY effective_date DESC
      LIMIT 30
    `).all(hasQuery ? 1 : 0, like, like, like, like);

    res.json({
      query: q,
      category,
      counts: {
        persons: persons.length,
        businessItems: businessItems.length,
        policyRules: policyRules.length
      },
      persons,
      businessItems,
      policyRules
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/admin/overview', (req, res) => {
  try {
    const byStatus = db.prepare(`
      SELECT status, COUNT(*) as count FROM service_records GROUP BY status ORDER BY count DESC
    `).all();
    const byCategory = db.prepare(`
      SELECT bi.category, bi.name, COUNT(sr.id) as count
      FROM business_items bi
      LEFT JOIN service_records sr ON sr.business_item_id = bi.id
      WHERE bi.is_active = 1
      GROUP BY bi.id
      ORDER BY count DESC, bi.id ASC
    `).all();
    const recentRecords = db.prepare(`
      SELECT sr.*, ip.name as person_name, bi.name as item_name, bi.category as item_category
      FROM service_records sr
      JOIN insured_persons ip ON sr.insured_person_id = ip.id
      JOIN business_items bi ON sr.business_item_id = bi.id
      ORDER BY sr.created_at DESC, sr.id DESC
      LIMIT 8
    `).all();
    const users = db.prepare(`
      SELECT id, username, display_name, role, phone, status, created_at
      FROM portal_users
      ORDER BY id
      LIMIT 20
    `).all();

    res.json({
      dataOverview: {
        insuredPersons: db.prepare('SELECT COUNT(*) as c FROM insured_persons').get().c,
        activePersons: db.prepare("SELECT COUNT(*) as c FROM insured_persons WHERE status IN ('active','normal')").get().c,
        businessItems: db.prepare('SELECT COUNT(*) as c FROM business_items WHERE is_active = 1').get().c,
        serviceRecords: db.prepare('SELECT COUNT(*) as c FROM service_records').get().c,
        credentials: db.prepare('SELECT COUNT(*) as c FROM electronic_credentials').get().c
      },
      byStatus,
      byCategory,
      recentRecords,
      users,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/admin/stats', (req, res) => {
  try {
    const stats = {
      insuredPersons: db.prepare('SELECT COUNT(*) as c FROM insured_persons').get().c,
      activePersons: db.prepare("SELECT COUNT(*) as c FROM insured_persons WHERE status IN ('active','normal')").get().c,
      businessItems: db.prepare('SELECT COUNT(*) as c FROM business_items WHERE is_active = 1').get().c,
      serviceRecords: db.prepare('SELECT COUNT(*) as c FROM service_records').get().c,
      pendingRecords: db.prepare("SELECT COUNT(*) as c FROM service_records WHERE status IN ('pending','processing','reviewing')").get().c,
      credentials: db.prepare('SELECT COUNT(*) as c FROM electronic_credentials').get().c,
      portalUsers: db.prepare('SELECT COUNT(*) as c FROM portal_users WHERE status = ?').get('active').c
    };
    const statuses = db.prepare(`
      SELECT status, COUNT(*) as count FROM service_records GROUP BY status ORDER BY count DESC
    `).all();
    res.json({ stats, statuses, generatedAt: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/discover-categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT category, COUNT(*) as item_count
      FROM business_items
      WHERE is_active = 1
      GROUP BY category
      ORDER BY item_count DESC, category ASC
    `).all();
    const recommended = db.prepare(`
      SELECT bi.*, COUNT(sr.id) as record_count
      FROM business_items bi
      LEFT JOIN service_records sr ON sr.business_item_id = bi.id
      WHERE bi.is_active = 1
      GROUP BY bi.id
      ORDER BY record_count DESC, bi.id ASC
      LIMIT 8
    `).all();
    const policyChannels = db.prepare(`
      SELECT rule_code, rule_name, policy_source, effective_date, business_nodes, mapped_flows
      FROM policy_rules
      WHERE is_active = 1
      ORDER BY effective_date DESC
      LIMIT 8
    `).all();

    res.json({
      categories,
      recommended,
      policyChannels,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.get('/api/audit-logs', (req, res) => {
  try {
    const entityId = req.query.entityId || null;
    const entityType = req.query.entityType || null;
    const logs = db.prepare(`
      SELECT * FROM audit_logs
      WHERE (? IS NULL OR entity_id = ?) AND (? IS NULL OR entity_type = ?)
      ORDER BY created_at DESC
      LIMIT 50
    `).all(entityId, entityId, entityType, entityType);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Database error', detail: error.message });
  }
});

app.post('/api/face-verify', (req, res) => {
  const { person_id, service_record_id } = req.body;
  const person = db.prepare('SELECT * FROM insured_persons WHERE id = ?').get(person_id);
  if (!person) return res.status(404).json({ error: 'Person not found' });

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  let finalRecordId = service_record_id;
  if (!finalRecordId) {
    const certificationItem = db.prepare('SELECT * FROM business_items WHERE category = ? OR name = ?').get('certification', '资格认证');
    if (certificationItem) {
      const insert = db.prepare(`
        INSERT INTO service_records (insured_person_id, business_item_id, item_name, item_category, status, current_step, face_verified, material_checked, cross_dept_checked, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
      `);
      const result = insert.run(
        person_id,
        certificationItem.id,
        certificationItem.name,
        certificationItem.category,
        'processing',
        'face_verify',
        now,
        now
      );
      finalRecordId = result.lastInsertRowid;
      
      const steps = [
        { name: 'face_verify', label: '人脸核验' },
        { name: 'material_check', label: '材料预检' },
        { name: 'cross_dept_verify', label: '跨部门比对' },
        { name: 'review', label: '审核' },
        { name: 'approve', label: '审批' }
      ];
      const stepInsert = db.prepare(`
        INSERT INTO service_record_steps (service_record_id, step_name, step_label, step_order, status, started_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      steps.forEach((s, i) => {
        stepInsert.run(finalRecordId, s.name, s.label, i + 1, i === 0 ? 'processing' : 'pending', i === 0 ? now : null);
      });
    }
  }

  const passed = Math.random() > 0.15;
  const method = passed ? (Math.random() > 0.3 ? 'live_face' : 'silent_verify') : 'live_face';
  const confidence = passed ? (0.85 + Math.random() * 0.14).toFixed(4) : (0.3 + Math.random() * 0.3).toFixed(4);

  const failureReasons = [];
  if (!passed) {
    const possibleReasons = [
      { code: 'LIVENESS_FAIL', reason: '活体检测失败', suggestion: '请确保是本人操作，保持面部正对摄像头，完成眨眼、张嘴等动作' },
      { code: 'QUALITY_LOW', reason: '图像质量过低', suggestion: '请调整光线，确保面部清晰，避免逆光或暗光环境' },
      { code: 'FACE_ANGLE', reason: '人脸角度异常', suggestion: '请保持面部正对摄像头，不要侧转或低头抬头幅度过大' },
      { code: 'POLICE_MISMATCH', reason: '公安库比对不通过', suggestion: '请确认身份证照片是否为近照，如有容貌变化请更新身份证照片' },
      { code: 'MOTION_FAIL', reason: '动作检测未完成', suggestion: '请按照提示完成指定动作，动作要自然流畅' }
    ];
    const failCount = 1 + Math.floor(Math.random() * 2);
    for (let i = 0; i < failCount; i++) {
      failureReasons.push(possibleReasons[Math.floor(Math.random() * possibleReasons.length)]);
    }
  }

  const reviewSuggestion = passed ? null :
    `您可在24小时内重试${3 - failureReasons.length + 1}次，如多次失败请携带有效身份证件前往就近社保经办机构柜台办理。本次核验记录已留存，可作为复查依据。`;

  const liveFaceDetails = {
    detection_method: method === 'live_face' ? '动作活体检测' : '静默活体检测',
    liveness_score: passed ? (0.88 + Math.random() * 0.11).toFixed(4) : (0.25 + Math.random() * 0.3).toFixed(4),
    blink_detected: passed || !failureReasons.some(r => r.code === 'MOTION_FAIL'),
    mouth_movement_detected: passed || !failureReasons.some(r => r.code === 'MOTION_FAIL'),
    head_pose_detected: passed || !failureReasons.some(r => r.code === 'FACE_ANGLE'),
    quality_score: passed ? (0.92 + Math.random() * 0.07).toFixed(4) : (0.3 + Math.random() * 0.3).toFixed(4),
    lighting_condition: passed ? '充足' : (Math.random() > 0.5 ? '偏暗' : '逆光'),
    face_angle: passed ? '正视' : (failureReasons.some(r => r.code === 'FACE_ANGLE') ? '偏转' : '正视'),
    capture_time: now,
    failure_reasons: passed ? [] : failureReasons.map(r => r.reason)
  };

  const policeMatchDetails = {
    matched: passed,
    source_db: '全国人口信息库（公安部）',
    query_id: 'POL-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
    match_score: passed ? (0.91 + Math.random() * 0.08).toFixed(4) : (0.35 + Math.random() * 0.25).toFixed(4),
    id_card_verified: true,
    photo_compared: passed ? '1:1比对通过' : '1:1比对未通过',
    query_time: now,
    response_time: (120 + Math.floor(Math.random() * 380)) + 'ms',
    query_org: '北京市公安局人口管理总队',
    mismatch_reason: passed ? null : (failureReasons.some(r => r.code === 'POLICE_MISMATCH') ?
      '人脸特征与公安库照片匹配度低于阈值' : null)
  };

  const silentVerifyRecords = [];
  if (method === 'silent_verify' && passed) {
    for (let i = 0; i < 3; i++) {
      const days = i * 30 + Math.floor(Math.random() * 10);
      const verifyDate = new Date(Date.now() - days * 24 * 3600 * 1000);
      silentVerifyRecords.push({
        verify_time: verifyDate.toISOString().slice(0, 19).replace('T', ' '),
        method: '静默认证',
        channel: i === 0 ? '医保结算' : i === 1 ? '交通出行' : '民政服务',
        location: i === 0 ? '北京市海淀医院' : i === 1 ? '北京地铁10号线' : '海淀区民政局',
        result: '通过',
        confidence: (0.88 + Math.random() * 0.1).toFixed(4)
      });
    }
  }
  
  const currentVerifyRecord = {
    verify_time: now,
    method: method === 'silent_verify' ? '静默认证' : '活体检测',
    channel: '统一数字入口',
    location: '线上办理',
    result: passed ? '通过' : '失败',
    confidence,
    failure_reasons: !passed ? failureReasons.map(r => r.reason) : null
  };
  silentVerifyRecords.push(currentVerifyRecord);

  let personUpdate = null;
  if (passed) {
    const newExpireDate = new Date();
    newExpireDate.setMonth(newExpireDate.getMonth() + 6);
    const expireStr = newExpireDate.toISOString().slice(0, 10);

    db.prepare(`
      UPDATE insured_persons
      SET business_status = ?,
          certification_expire_date = ?,
          updated_at = ?
      WHERE id = ?
    `).run('active', expireStr, now, person_id);

    personUpdate = {
      old_status: person.business_status,
      new_status: 'active',
      new_cert_expire: expireStr
    };

    db.prepare(`
      INSERT INTO audit_logs (entity_type, entity_id, action, operator, detail, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('insured_person', person_id, '人脸核验通过', 'system',
      JSON.stringify({
        method,
        confidence,
        police_match: true,
        new_cert_expire: expireStr,
        old_status: person.business_status,
        new_status: 'active',
        query_id: policeMatchDetails.query_id
      }), now);
  } else {
    db.prepare(`
      INSERT INTO audit_logs (entity_type, entity_id, action, operator, detail, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('insured_person', person_id, '人脸核验失败', 'system',
      JSON.stringify({
        method,
        confidence,
        police_match: false,
        failure_reasons: failureReasons,
        query_id: policeMatchDetails.query_id,
        review_suggestion: reviewSuggestion
      }), now);
  }

  if (finalRecordId) {
    db.prepare(`
      UPDATE service_records SET face_verified = ?, updated_at = ? WHERE id = ?
    `).run(passed ? 1 : 0, now, finalRecordId);

    const pendingStep = db.prepare(`
      SELECT * FROM service_record_steps
      WHERE service_record_id = ? AND step_name = 'face_verify' AND status IN ('pending', 'processing')
      ORDER BY step_order LIMIT 1
    `).get(finalRecordId);

    if (pendingStep) {
      db.prepare(`
        UPDATE service_record_steps
        SET status = ?, result = ?, completed_at = ?, operator = 'system', detail = ?
        WHERE id = ?
      `).run(
        passed ? 'completed' : 'rejected',
        passed ? '通过' : '核验失败',
        now,
        passed ?
          `人脸核验通过，置信度${confidence}，公安比对匹配，认证有效期至${personUpdate?.new_cert_expire}` :
          `核验失败：${failureReasons.map(r => r.reason).join('；')}`,
        pendingStep.id
      );
    }

    if (finalRecordId) {
      db.prepare(`
        INSERT INTO audit_logs (entity_type, entity_id, action, operator, detail, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('service_record', finalRecordId, '人脸核验完成', 'system',
        JSON.stringify({
          passed,
          confidence,
          method,
          query_id: policeMatchDetails.query_id,
          failure_reasons: failureReasons.map(r => r.reason),
          person_update: personUpdate
        }), now);
    }
  }

  const reviewRecord = {
    verify_id: 'FACE-' + Date.now(),
    query_id: policeMatchDetails.query_id,
    verify_time: now,
    channel: '统一数字入口',
    operator: 'system',
    result: passed ? '通过' : '失败',
    confidence,
    reviewable: true,
    review_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
    remaining_attempts: passed ? 0 : 3
  };

  res.json({
    verified: passed,
    method,
    confidence,
    police_match: passed,
    service_record_id: finalRecordId,
    message: passed ?
      '人脸核验通过，资格认证有效期已更新至6个月后' :
      `人脸核验未通过：${failureReasons[0]?.reason || '未知原因'}，请根据建议调整后重试`,
    live_face_details: liveFaceDetails,
    police_match_details: policeMatchDetails,
    silent_verify_records: silentVerifyRecords,
    person_update: personUpdate,
    failure_reasons: failureReasons,
    review_suggestion: reviewSuggestion,
    review_record: reviewRecord,
    record_updated: !!finalRecordId
  });
});

app.post('/api/material-check', (req, res) => {
  const { business_item_id, materials, person_id, service_record_id } = req.body;
  const item = db.prepare('SELECT * FROM business_items WHERE id = ?').get(business_item_id);
  if (!item) return res.status(404).json({ error: 'Business item not found' });

  let person = null;
  let identityType = null;
  let location = null;
  if (person_id) {
    person = db.prepare('SELECT * FROM insured_persons WHERE id = ?').get(person_id);
    if (person) {
      identityType = person.identity_type;
      location = person.address ? person.address.slice(0, 3) : '北京';
    }
  }

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentSeason = currentMonth <= 3 ? '春季' : currentMonth <= 6 ? '夏季' : currentMonth <= 9 ? '秋季' : '冬季';
  const currentYear = now.getFullYear();

  let required = [];
  try { required = JSON.parse(item.required_materials || '[]'); } catch (_) {}

  const identityExtra = {
    employee: ['在职证明', '工资流水'],
    resident: ['居住证', '居民户口簿'],
    institution: ['单位介绍信', '编制证明']
  };

  const locationExtra = {
    '北京': ['北京市居住证明'],
    '上海': ['上海市居住证明'],
    '广州': ['广州市居住证明']
  };

  const itemExtra = {
    '参保登记': ['参保登记表', '一寸免冠照片'],
    '待遇申领': ['待遇申请表', '银行账户信息'],
    '资格认证': ['资格认证表', '生存证明材料'],
    '缴费查询': [],
    '参保证明开具': []
  };

  const timeExtra = [];
  if (item.name === '待遇申领' && currentMonth >= 12) {
    timeExtra.push(`${currentYear}年度收入证明`);
  }
  if (item.name === '资格认证') {
    timeExtra.push(`${currentYear}年度生存验证材料`);
  }
  if (currentSeason === '春季' && item.name === '参保登记') {
    timeExtra.push('春季用工备案表');
  }

  const allRequired = [...required];
  if (identityType && identityExtra[identityType]) {
    allRequired.push(...identityExtra[identityType]);
  }
  if (location && locationExtra[location]) {
    allRequired.push(...locationExtra[location]);
  }
  if (item.name && itemExtra[item.name]) {
    allRequired.push(...itemExtra[item.name]);
  }
  allRequired.push(...timeExtra);

  const submitted = Array.isArray(materials) ? materials : [];
  const missing = allRequired.filter(r => !submitted.includes(r));
  const needCorrection = [];
  const passed = missing.length === 0 && needCorrection.length === 0;
  const rejectReasons = [];

  if (person) {
    if (person.business_status === 'suspended') {
      const corr = {
        item: '参保状态',
        issue: '当前为停保状态',
        correction: '需先办理续保手续或提供停保期间的情况说明',
        reject_reason: '参保状态异常，暂停办理'
      };
      needCorrection.push(corr);
      rejectReasons.push(corr.reject_reason);
    }
    if (person.certification_expire_date && new Date(person.certification_expire_date) < new Date()) {
      const corr = {
        item: '资格认证',
        issue: `资格认证已于 ${person.certification_expire_date} 过期`,
        correction: '需先完成人脸核验或资格认证，认证有效期6个月',
        reject_reason: '资格认证已过期，需重新认证'
      };
      needCorrection.push(corr);
      rejectReasons.push(corr.reject_reason);
    }
    if (person.birth_date) {
      const birthYear = parseInt(person.birth_date.slice(0, 4));
      const age = currentYear - birthYear;
      if (item.name === '待遇申领' && age < 60) {
        const corr = {
          item: '待遇申领条件',
          issue: `当前年龄 ${age} 岁，未达到法定退休年龄`,
          correction: '请确认是否符合提前退休或特殊工种退休条件，并提供相关证明材料',
          reject_reason: '未达到法定退休年龄，不符合待遇申领条件'
        };
        needCorrection.push(corr);
        rejectReasons.push(corr.reject_reason);
      }
    }
  }

  const submittedStatus = allRequired.map(r => ({
    material: r,
    status: submitted.includes(r) ? '已提交' : '未提交',
    required: true,
    source: required.includes(r) ? '通用' :
            identityExtra[identityType]?.includes(r) ? '身份' :
            locationExtra[location]?.includes(r) ? '地域' :
            itemExtra[item.name]?.includes(r) ? '事项' : '时间'
  }));

  const checkTime = now.toISOString().slice(0, 19).replace('T', ' ');

  if (service_record_id) {
    db.prepare(`
      UPDATE service_records SET material_checked = ?, updated_at = ? WHERE id = ?
    `).run(passed ? 1 : 0, checkTime, service_record_id);

    const pendingStep = db.prepare(`
      SELECT * FROM service_record_steps
      WHERE service_record_id = ? AND step_name = 'material_check' AND status = 'pending'
      ORDER BY step_order LIMIT 1
    `).get(service_record_id);

    if (pendingStep) {
      db.prepare(`
        UPDATE service_record_steps
        SET status = ?, result = ?, completed_at = ?, operator = 'system', detail = ?
        WHERE id = ?
      `).run(
        passed ? 'completed' : 'rejected',
        passed ? '通过' : '材料不齐全',
        checkTime,
        passed ? '所有材料齐全有效' : `缺少 ${missing.length} 项，需补正 ${needCorrection.length} 项`,
        pendingStep.id
      );
    }

    db.prepare(`
      INSERT INTO audit_logs (entity_type, entity_id, action, operator, detail, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('service_record', service_record_id, '材料预检完成', 'system',
      JSON.stringify({
        passed,
        missing_count: missing.length,
        correction_count: needCorrection.length,
        missing,
        reject_reasons: rejectReasons,
        check_time: checkTime
      }), checkTime);
  }

  res.json({
    passed,
    required: allRequired,
    submitted,
    missing,
    need_correction: needCorrection,
    submitted_status: submittedStatus,
    identity_type: identityType,
    location,
    item_name: item.name,
    identity_required: identityExtra[identityType] || [],
    location_required: locationExtra[location] || [],
    item_required: itemExtra[item.name] || [],
    time_required: timeExtra,
    check_time: checkTime,
    current_context: {
      season: currentSeason,
      month: currentMonth,
      year: currentYear,
      age: person && person.birth_date ? currentYear - parseInt(person.birth_date.slice(0, 4)) : null
    },
    reject_reasons: rejectReasons,
    pass_reason: passed ? '所有材料齐全有效，身份、地域、时间条件均符合要求' : null,
    record_updated: !!service_record_id,
    message: passed ?
      (needCorrection.length > 0 ? '材料齐全但需补正信息' : '材料预检通过') :
      (missing.length > 0
        ? `缺少 ${missing.length} 项材料: ${missing.slice(0, 3).join('、')}${missing.length > 3 ? '...' : ''}`
        : `需补正 ${needCorrection.length} 项信息`)
  });
});

app.post('/api/cross-dept-verify', (req, res) => {
  const { person_id, verify_types, business_item_id, service_record_id } = req.body;
  const person = db.prepare('SELECT * FROM insured_persons WHERE id = ?').get(person_id);
  if (!person) return res.status(404).json({ error: 'Person not found' });

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  let finalRecordId = service_record_id;
  if (!finalRecordId) {
    const targetItemId = business_item_id || 3;
    const item = db.prepare('SELECT * FROM business_items WHERE id = ?').get(targetItemId);
    if (item) {
      const insert = db.prepare(`
        INSERT INTO service_records (insured_person_id, business_item_id, item_name, item_category, status, current_step, face_verified, material_checked, cross_dept_checked, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
      `);
      const result = insert.run(
        person_id,
        item.id,
        item.name,
        item.category,
        'processing',
        'cross_dept_verify',
        now,
        now
      );
      finalRecordId = result.lastInsertRowid;
      
      const steps = [
        { name: 'face_verify', label: '人脸核验' },
        { name: 'material_check', label: '材料预检' },
        { name: 'cross_dept_verify', label: '跨部门比对' },
        { name: 'review', label: '审核' },
        { name: 'approve', label: '审批' }
      ];
      const stepInsert = db.prepare(`
        INSERT INTO service_record_steps (service_record_id, step_name, step_label, step_order, status, started_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      steps.forEach((s, i) => {
        stepInsert.run(finalRecordId, s.name, s.label, i + 1, i === 2 ? 'processing' : 'pending', i === 2 ? now : null);
      });
    }
  }

  const types = Array.isArray(verify_types) ? verify_types : ['medical', 'tax', 'civil'];
  const results = {};

  for (const t of types) {
    if (t === 'medical') {
      const medicalMatched = Math.random() > 0.1;
      results.medical = {
        status: medicalMatched ? 'matched' : 'mismatch',
        source: '国家医保信息平台',
        source_dept: '医疗保障局',
        query_id: 'MED-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
        query_time: now,
        response_time: (180 + Math.floor(Math.random() * 320)) + 'ms',
        matched_fields: {
          id_card: medicalMatched,
          name: medicalMatched,
          insured_status: medicalMatched ? '正常参保' : '参保状态异常',
          payment_months: medicalMatched ? '一致' : '存在差异',
          medical_insurance_type: medicalMatched ? '职工医保' : '类型不符'
        },
        hit_records: medicalMatched ? [
          { time: '2026-05-15', location: '北京大学第三医院', type: '门诊就医', amount: 356.80 },
          { time: '2026-04-20', location: '北京市海淀医院', type: '住院结算', amount: 12580.00 },
          { time: '2026-03-10', location: '金象大药房', type: '药店购药', amount: 156.50 }
        ] : [],
        detail: medicalMatched ? '医保参保状态正常，缴费记录一致' : '医保缴费记录存在差异，2025年10-12月缴费未同步',
        exception_handling: medicalMatched ? null : '需人工核实医保缴费明细，或联系参保地医保经办机构处理',
        auto_review_basis: medicalMatched ? '符合待遇申领/资格认证的医保条件' : '不符合自动审核条件，需人工复核'
      };
    } else if (t === 'tax') {
      const taxMatched = Math.random() > 0.15;
      results.tax = {
        status: taxMatched ? 'matched' : 'mismatch',
        source: '自然人电子税务局',
        source_dept: '税务局',
        query_id: 'TAX-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
        query_time: now,
        response_time: (220 + Math.floor(Math.random() * 280)) + 'ms',
        matched_fields: {
          id_card: taxMatched,
          name: taxMatched,
          tax_payment_status: taxMatched ? '正常' : '欠缴',
          social_security_base: taxMatched ? '一致' : '申报基数与社保基数不符',
          individual_income_tax: taxMatched ? '正常申报' : '未申报'
        },
        hit_records: taxMatched ? [
          { period: '2026-05', social_security: 2040.00, tax: 156.80, employer: '北京科技有限公司' },
          { period: '2026-04', social_security: 2040.00, tax: 156.80, employer: '北京科技有限公司' },
          { period: '2026-03', social_security: 2040.00, tax: 156.80, employer: '北京科技有限公司' }
        ] : [],
        detail: taxMatched ? '税务缴费数据一致，申报基数匹配' : '税务申报基数与社保缴费基数存在差异',
        exception_handling: taxMatched ? null : '需提供工资发放明细、劳动合同等证明材料，或到税务部门更正申报',
        auto_review_basis: taxMatched ? '缴费基数符合要求，可自动审核通过' : '存在基数差异，需人工复核并要求补正材料'
      };
    } else if (t === 'civil') {
      const civilMatched = Math.random() > 0.05;
      results.civil = {
        status: civilMatched ? 'matched' : 'mismatch',
        source: '全国民政业务数据共享交换平台',
        source_dept: '民政厅',
        query_id: 'CIV-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
        query_time: now,
        response_time: (150 + Math.floor(Math.random() * 250)) + 'ms',
        matched_fields: {
          id_card: civilMatched,
          name: civilMatched,
          marital_status: civilMatched ? '已婚' : '状态不符',
          survival_status: civilMatched ? '健在' : '疑似异常',
          social_assistance: civilMatched ? '无' : '享受低保'
        },
        hit_records: civilMatched ? [
          { type: '婚姻登记', time: '2015-10-01', location: '北京市朝阳区民政局', status: '正常' },
          { type: '生存验证', time: '2026-03-15', location: '社区服务中心', status: '通过' }
        ] : [],
        detail: civilMatched ? '婚姻/殡葬数据无异常，待遇资格有效' : '民政数据存在异常标记，可能影响待遇资格',
        exception_handling: civilMatched ? null : '需本人携带有效身份证件到社区服务中心或民政部门核实信息',
        auto_review_basis: civilMatched ? '待遇资格有效，可自动审核通过' : '存在资格异常，需人工核实并暂停相关待遇'
      };
    }
  }

  const allMatched = Object.values(results).every(r => r.status === 'matched');
  const autoApprove = allMatched && person.business_status !== 'suspended';

  if (business_item_id) {
    const item = db.prepare('SELECT * FROM business_items WHERE id = ?').get(business_item_id);
    if (item && (item.code === 'BEN-001' || item.code === 'CER-001')) {
      db.prepare(`
        INSERT INTO audit_logs (entity_type, entity_id, action, operator, detail, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run('insured_person', person_id, '跨部门比对', 'system',
        JSON.stringify({
          item_code: item.code,
          item_name: item.name,
          all_matched: allMatched,
          auto_approve: autoApprove,
          results: Object.keys(results).map(k => ({ dept: k, status: results[k].status }))
        }), now);
    }
  }

  if (finalRecordId) {
    const crossDeptResult = allMatched ?
      (autoApprove ? '三部门比对全部通过，可自动审核' : '三部门比对通过，但参保状态需核实') :
      `部门比对存在差异: ${Object.values(results).filter(r => r.status !== 'matched').map(r => r.source_dept).join('、')}`;
    db.prepare(`
      UPDATE service_records
      SET cross_dept_checked = 1, cross_dept_result = ?, updated_at = ?
      WHERE id = ?
    `).run(crossDeptResult, now, finalRecordId);

    const pendingStep = db.prepare(`
      SELECT * FROM service_record_steps
      WHERE service_record_id = ? AND step_name = 'cross_dept_verify' AND status IN ('pending', 'processing')
      ORDER BY step_order LIMIT 1
    `).get(finalRecordId);

    if (pendingStep) {
      db.prepare(`
        UPDATE service_record_steps
        SET status = 'completed', result = ?, completed_at = ?, operator = 'system', detail = ?
        WHERE id = ?
      `).run(allMatched ? '通过' : '存在差异', now, crossDeptResult, pendingStep.id);
    }

    db.prepare(`
      INSERT INTO audit_logs (entity_type, entity_id, action, operator, detail, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('service_record', finalRecordId, '跨部门比对完成', 'system',
      JSON.stringify({
        all_matched: allMatched,
        auto_approve: autoApprove,
        result: crossDeptResult,
        results: Object.keys(results).map(k => ({ dept: k, status: results[k].status }))
      }), now);
  }

  res.json({
    person_id,
    service_record_id: finalRecordId,
    verified: allMatched,
    results,
    auto_approve: autoApprove,
    review_basis: autoApprove ? '所有部门数据比对通过，符合自动审核条件' :
      '部分部门数据比对存在差异，需人工复核后确定是否通过',
    exception_items: Object.values(results).filter(r => r.status !== 'matched').map(r => ({
      dept: r.source_dept,
      issue: r.detail,
      handling: r.exception_handling
    })),
    message: allMatched ?
      (autoApprove ? '跨部门数据比对全部通过，可自动审核' : '跨部门数据比对全部通过，但参保状态异常需处理') :
      '部分部门数据比对存在差异，需人工核实',
    record_updated: !!finalRecordId
  });
});

app.get('/api/verify-credential/:id', (req, res) => {
  const { id } = req.params;
  const cred = db.prepare('SELECT * FROM electronic_credentials WHERE id = ?').get(id);
  if (!cred) return res.status(404).json({ error: '凭证不存在' });

  const payloadStr = [
    cred.insured_person_id,
    cred.type,
    cred.title,
    cred.data,
    cred.related_record_id,
    cred.service_record_id,
    cred.issued_at
  ].join('|');
  const computedSig = crypto.createHash('sha256').update(payloadStr).digest('hex');
  const valid = computedSig === cred.digital_signature;
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

  db.prepare(`
    INSERT INTO audit_logs (entity_type, entity_id, action, operator, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('credential', id, '凭证校验', 'system', JSON.stringify({
    valid,
    original_signature: cred.digital_signature,
    computed_signature: computedSig
  }), now);

  res.json({
    valid,
    original_signature: cred.digital_signature,
    computed_signature: computedSig,
    verify_time: now,
    message: valid ? '数字签名校验通过，凭证完整有效，未被篡改' : '数字签名校验失败，凭证可能已被篡改或损坏'
  });
});

app.get('/api/credential-trace/:id', (req, res) => {
  const { id } = req.params;
  const cred = db.prepare('SELECT * FROM electronic_credentials WHERE id = ?').get(id);
  if (!cred) return res.status(404).json({ error: '凭证不存在' });

  let serviceRecord = null;
  let steps = [];
  let auditLogs = [];

  if (cred.service_record_id) {
    serviceRecord = db.prepare('SELECT * FROM service_records WHERE id = ?').get(cred.service_record_id);
    steps = db.prepare('SELECT * FROM service_record_steps WHERE service_record_id = ? ORDER BY step_order').all(cred.service_record_id);
    auditLogs = db.prepare(`
      SELECT * FROM audit_logs
      WHERE (entity_type = 'service_record' AND entity_id = ?)
         OR (entity_type = 'credential' AND entity_id = ?)
      ORDER BY created_at DESC
    `).all(cred.service_record_id, id);
  } else {
    auditLogs = db.prepare(`
      SELECT * FROM audit_logs WHERE entity_type = 'credential' AND entity_id = ?
      ORDER BY created_at DESC
    `).all(id);
  }

  const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const chainTxId = 'CHAIN-' + crypto.createHash('sha256').update(id + '|' + now).digest('hex').slice(0, 16).toUpperCase();
  const blockHeight = Math.floor(Date.now() / 1000000) + 18000000;

  db.prepare(`
    INSERT INTO audit_logs (entity_type, entity_id, action, operator, detail, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run('credential', id, '凭证追溯查询', 'system', JSON.stringify({
    trace_time: now,
    chain_tx_id: chainTxId,
    block_height: blockHeight
  }), now);

  res.json({
    credential: cred,
    service_record: serviceRecord || null,
    steps: steps,
    audit_logs: auditLogs,
    chain_info: {
      tx_id: chainTxId,
      block_height: blockHeight,
      timestamp: now,
      data_hash: crypto.createHash('sha256').update(JSON.stringify({
        cred, serviceRecord, steps, auditLogs
      })).digest('hex')
    },
    message: '追溯链路已生成，包含办理记录、审核节点、操作日志和存证信息'
  });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Backend server running on http://127.0.0.1:${PORT}`);
});
