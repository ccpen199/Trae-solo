const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

let db = null;
let encryptionKey = null;

const ENCRYPTION_ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, Buffer.from(encryptionKey, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, Buffer.from(encryptionKey, 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function init() {
  const dbPath = path.resolve(__dirname, '../../data/app.sqlite');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF');

  encryptionKey = crypto.createHash('sha256')
    .update(process.env.ENCRYPTION_KEY || 'antifraud-default-key')
    .digest('hex');

  createTables();
  migrateTables();
  seedInitialData();

  db.pragma('foreign_keys = ON');
}

function migrateTables() {
  db.exec("PRAGMA foreign_keys = OFF");

  function clearTable(name) {
    try {
      db.exec(`DELETE FROM ${name}`);
      db.exec(`DELETE FROM sqlite_sequence WHERE name='${name}'`);
    } catch (e) {}
  }

  function rebuildTable(oldName, newSchema) {
    try {
      const tmpName = oldName + "_tmp_new";
      db.exec(`DROP TABLE IF EXISTS ${tmpName}`);
      db.exec(`CREATE TABLE ${tmpName} (${newSchema})`);
      db.exec(`DROP TABLE IF EXISTS ${oldName}`);
      db.exec(`ALTER TABLE ${tmpName} RENAME TO ${oldName}`);
    } catch (e) {}
  }

  function hasCols(tableName, requiredCols, forbiddenCols = []) {
    try {
      const cols = db.prepare(`PRAGMA table_info(${tableName})`).all();
      const colNames = cols.map(c => c.name);
      for (const rc of requiredCols) {
        if (!colNames.includes(rc)) return false;
      }
      for (const fc of forbiddenCols) {
        if (colNames.includes(fc)) return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  let needReset = false;

  if (!hasCols('agencies', ['region', 'contact', 'online', 'case_count'], ['code'])) {
    rebuildTable('agencies', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      region TEXT,
      contact TEXT,
      online INTEGER DEFAULT 0,
      case_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    `);
    needReset = true;
  }

  if (!hasCols('users', ['password_hash', 'real_name_encrypted', 'id_card_encrypted', 'phone_encrypted', 'role'], ['real_name', 'id_card', 'phone'])) {
    rebuildTable('users', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      real_name_encrypted TEXT,
      id_card_encrypted TEXT,
      phone_encrypted TEXT,
      role TEXT NOT NULL DEFAULT 'public',
      agency_id INTEGER,
      region TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agency_id) REFERENCES agencies(id)
    `);
    needReset = true;
  }

  if (!hasCols('reports', ['report_no', 'reporter_name_encrypted', 'description_encrypted'], ['reporter_name', 'description'])) {
    rebuildTable('reports', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_no TEXT UNIQUE NOT NULL,
      reporter_id INTEGER,
      reporter_name_encrypted TEXT,
      reporter_phone_encrypted TEXT,
      reporter_idcard_encrypted TEXT,
      fraud_type TEXT,
      fraud_number TEXT,
      fraud_amount REAL DEFAULT 0,
      description_encrypted TEXT,
      location TEXT,
      risk_level TEXT DEFAULT '待评估',
      status TEXT DEFAULT '待受理',
      agency_id INTEGER,
      assignee_id INTEGER,
      case_id INTEGER,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (agency_id) REFERENCES agencies(id)
    `);
    needReset = true;
  }

  if (!hasCols('fraud_resources', ['description', 'source', 'status', 'first_seen', 'last_seen'], [])) {
    rebuildTable('fraud_resources', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      risk_level TEXT DEFAULT '高危',
      description TEXT,
      source TEXT,
      status TEXT DEFAULT 'active',
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, value)
    `);
    needReset = true;
  }

  if (!hasCols('cases', ['case_no', 'tags', 'amount'], [])) {
    rebuildTable('cases', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_no TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      location TEXT,
      amount REAL DEFAULT 0,
      risk_level TEXT DEFAULT '中危',
      status TEXT DEFAULT '初筛中',
      agency_id INTEGER,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agency_id) REFERENCES agencies(id)
    `);
    needReset = true;
  }

  if (!hasCols('tasks', ['task_no', 'assignee_name'], [])) {
    rebuildTable('tasks', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_no TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      case_id INTEGER,
      report_id INTEGER,
      assignee_id INTEGER,
      assignee_name TEXT,
      status TEXT DEFAULT '待处理',
      priority TEXT DEFAULT 'medium',
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id),
      FOREIGN KEY (report_id) REFERENCES reports(id)
    `);
    needReset = true;
  }

  if (!hasCols('knowledge_graph', ['node_type', 'title', 'content', 'parent_id', 'metadata'], ['type'])) {
    rebuildTable('knowledge_graph', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      parent_id INTEGER,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    `);
    needReset = true;
  }

  if (!hasCols('quizzes', ['title', 'scenario', 'options', 'correct_answer', 'explanation'], ['question'])) {
    rebuildTable('quizzes', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      scenario TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer INTEGER NOT NULL,
      explanation TEXT,
      difficulty TEXT DEFAULT 'medium',
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    `);
    needReset = true;
  }

  if (!hasCols('warnings', ['user_id', 'type', 'content', 'is_read'], ['title'])) {
    rebuildTable('warnings', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      risk_level TEXT DEFAULT '提示',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    `);
    needReset = true;
  }

  if (needReset) {
    rebuildTable('evidences', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      file_name TEXT,
      file_path TEXT,
      file_hash TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    `);
    rebuildTable('verifications', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      target TEXT NOT NULL,
      target_type TEXT NOT NULL,
      result TEXT NOT NULL,
      risk_score INTEGER DEFAULT 0,
      details TEXT,
      reporter_ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    `);
    rebuildTable('case_tags', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      confidence REAL DEFAULT 1,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    `);
    rebuildTable('case_relations', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      related_case_id INTEGER NOT NULL,
      relation_type TEXT,
      strength REAL DEFAULT 0.5,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
      FOREIGN KEY (related_case_id) REFERENCES cases(id) ON DELETE CASCADE
    `);
    rebuildTable('report_flow', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      operator_id INTEGER,
      operator_name TEXT,
      note TEXT,
      status_from TEXT,
      status_to TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    `);
    rebuildTable('quiz_answers', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      user_id INTEGER,
      user_answer INTEGER,
      is_correct INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    `);
    rebuildTable('audit_logs', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id INTEGER,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    `);
    rebuildTable('operation_logs', `
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      operation TEXT NOT NULL,
      table_name TEXT,
      record_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    `);

    const allTables = [
      'quiz_answers', 'quizzes', 'warnings', 'knowledge_graph',
      'report_flow', 'verifications', 'evidences',
      'case_relations', 'case_tags', 'operation_logs', 'audit_logs',
      'tasks', 'cases', 'reports', 'fraud_resources', 'users', 'agencies'
    ];
    allTables.forEach(t => clearTable(t));
  }

  db.exec("PRAGMA foreign_keys = ON");
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      real_name_encrypted TEXT,
      id_card_encrypted TEXT,
      phone_encrypted TEXT,
      role TEXT NOT NULL DEFAULT 'public',
      agency_id INTEGER,
      region TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS agencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      level TEXT NOT NULL,
      region TEXT,
      contact TEXT,
      online INTEGER DEFAULT 0,
      case_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_no TEXT UNIQUE NOT NULL,
      reporter_id INTEGER,
      reporter_name_encrypted TEXT,
      reporter_phone_encrypted TEXT,
      reporter_idcard_encrypted TEXT,
      fraud_type TEXT,
      fraud_number TEXT,
      fraud_amount REAL DEFAULT 0,
      description_encrypted TEXT,
      location TEXT,
      risk_level TEXT DEFAULT '待评估',
      status TEXT DEFAULT '待受理',
      agency_id INTEGER,
      assignee_id INTEGER,
      case_id INTEGER,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS evidences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      file_name TEXT,
      file_path TEXT,
      file_hash TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      target TEXT NOT NULL,
      target_type TEXT NOT NULL,
      result TEXT NOT NULL,
      risk_score INTEGER DEFAULT 0,
      details TEXT,
      reporter_ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fraud_resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      risk_level TEXT DEFAULT '高危',
      description TEXT,
      source TEXT,
      status TEXT DEFAULT 'active',
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(type, value)
    );

    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_no TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      location TEXT,
      amount REAL DEFAULT 0,
      risk_level TEXT DEFAULT '中危',
      status TEXT DEFAULT '初筛中',
      agency_id INTEGER,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agency_id) REFERENCES agencies(id)
    );

    CREATE TABLE IF NOT EXISTS case_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      tag TEXT NOT NULL,
      confidence REAL DEFAULT 1,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS case_relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_id INTEGER NOT NULL,
      related_case_id INTEGER NOT NULL,
      relation_type TEXT,
      strength REAL DEFAULT 0.5,
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
      FOREIGN KEY (related_case_id) REFERENCES cases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_no TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      case_id INTEGER,
      report_id INTEGER,
      assignee_id INTEGER,
      assignee_name TEXT,
      status TEXT DEFAULT '待处理',
      priority TEXT DEFAULT 'medium',
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (case_id) REFERENCES cases(id),
      FOREIGN KEY (report_id) REFERENCES reports(id)
    );

    CREATE TABLE IF NOT EXISTS report_flow (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      operator_id INTEGER,
      operator_name TEXT,
      note TEXT,
      status_from TEXT,
      status_to TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS knowledge_graph (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      node_type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      parent_id INTEGER,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      risk_level TEXT DEFAULT '提示',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      scenario TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer INTEGER NOT NULL,
      explanation TEXT,
      difficulty TEXT DEFAULT 'medium',
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      user_id INTEGER,
      user_answer INTEGER,
      is_correct INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id INTEGER,
      ip_address TEXT,
      user_agent TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      operation TEXT NOT NULL,
      table_name TEXT,
      record_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_reports_risk ON reports(risk_level);
    CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
    CREATE INDEX IF NOT EXISTS idx_fraud_resources_value ON fraud_resources(value);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
  `);
}

function seedInitialData() {
  const agencyCount = db.prepare('SELECT COUNT(*) as count FROM agencies').get().count;
  if (agencyCount === 0) {
    const insertAgency = db.prepare('INSERT INTO agencies (name, level, region, contact, online, case_count) VALUES (?, ?, ?, ?, ?, ?)');
    const agencies = [
      ['北京市公安局刑侦总队', '省级', '北京市', '010-12345678', 1, 156],
      ['上海市公安局刑侦总队', '省级', '上海市', '021-12345678', 1, 142],
      ['广东省公安厅刑侦局', '省级', '广东省', '020-12345678', 1, 203],
      ['浙江省公安厅刑侦总队', '省级', '浙江省', '0571-12345678', 1, 128],
      ['江苏省公安厅刑侦总队', '省级', '江苏省', '025-12345678', 1, 135],
      ['深圳市公安局刑侦支队', '市级', '广东省深圳市', '0755-12345678', 1, 98],
      ['广州市公安局刑侦支队', '市级', '广东省广州市', '020-87654321', 1, 87],
      ['杭州市公安局刑侦支队', '市级', '浙江省杭州市', '0571-87654321', 1, 76],
      ['南京市公安局刑侦支队', '市级', '江苏省南京市', '025-87654321', 1, 65],
      ['成都市公安局刑侦支队', '市级', '四川省成都市', '028-87654321', 0, 54],
    ];
    agencies.forEach(a => insertAgency.run(...a));
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, real_name_encrypted, role, agency_id, region) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const users = [
      ['admin', hashPassword('admin123'), encrypt('系统管理员'), 'super_admin', null, '全国'],
      ['beijing_admin', hashPassword('123456'), encrypt('北京管理员'), 'admin', 1, '北京市'],
      ['shanghai_admin', hashPassword('123456'), encrypt('上海管理员'), 'admin', 2, '上海市'],
      ['guangdong_admin', hashPassword('123456'), encrypt('广东管理员'), 'admin', 3, '广东省'],
      ['police01', hashPassword('123456'), encrypt('张警官'), 'officer', 1, '北京市'],
      ['police02', hashPassword('123456'), encrypt('李警官'), 'officer', 6, '广东省深圳市'],
    ];
    users.forEach(u => insertUser.run(...u));
  }

  const resourceCount = db.prepare('SELECT COUNT(*) as count FROM fraud_resources').get().count;
  if (resourceCount === 0) {
    const insertResource = db.prepare(`
      INSERT OR IGNORE INTO fraud_resources (type, value, risk_level, description, source) VALUES (?, ?, ?, ?, ?)
    `);
    const resources = [
      ['phone', '+86-13800138000', '高危', '冒充公检法诈骗号码', '群众举报'],
      ['phone', '+86-13900139000', '高危', '刷单返利诈骗号码', '公安通报'],
      ['domain', 'fake-bank.com', '高危', '仿冒银行钓鱼网站', '银行风控'],
      ['domain', 'win-money-2024.com', '高危', '虚假投资诈骗网站', '群众举报'],
      ['url', 'http://fake-taobao.com/login', '高危', '仿冒淘宝钓鱼链接', '阿里风控'],
      ['package', 'com.fake.alipay', '高危', '仿冒支付宝APK', '应用商店'],
      ['package', 'com.fake.bank.icbc', '高危', '仿冒工商银行APP', '银行风控'],
      ['phone', '+86-13700137000', '中危', '疑似杀猪盘号码', '群众举报'],
      ['domain', 'quick-loan-fast.com', '中危', '虚假贷款网站', '银监通报'],
      ['phone', '+86-13600136000', '低危', '骚扰推销号码', '运营商标记'],
    ];
    resources.forEach(r => insertResource.run(...r));
  }

  const reportCount = db.prepare('SELECT COUNT(*) as count FROM reports').get().count;
  if (reportCount === 0) {
    const insertReport = db.prepare(`
      INSERT INTO reports (
        report_no, reporter_name_encrypted, reporter_phone_encrypted,
        fraud_type, fraud_number, fraud_amount, description_encrypted,
        location, risk_level, status, agency_id, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = Date.now();
    const reports = [
      [`JB${now}001`, encrypt('张三'), encrypt('13800000001'), '刷单返利', '13800138000', 50000, encrypt('被诱导在虚假平台刷单，被骗5万元'), '北京市朝阳区', '高危', '核查中', 1, '刷单,虚假平台'],
      [`JB${now}002`, encrypt('李四'), encrypt('13900000002'), '冒充公检法', '13900139000', 200000, encrypt('接到自称公安局电话，要求转账至安全账户'), '上海市浦东新区', '高危', '已立案', 2, '冒充公检法,安全账户'],
      [`JB${now}003`, encrypt('王五'), encrypt('13700000003'), 'AI换脸诈骗', 'unknown', 150000, encrypt('收到亲友视频借钱，后发现是AI换脸'), '广东省广州市', '高危', '待受理', 7, 'AI换脸,视频诈骗'],
      [`JB${now}004`, encrypt('赵六'), encrypt('13600000004'), '虚假投资理财', 'fake-bank.com', 80000, encrypt('在虚假投资平台投资，无法提现'), '浙江省杭州市', '高危', '核查中', 8, '虚假投资,理财诈骗'],
      [`JB${now}005`, encrypt('孙七'), encrypt('13500000005'), '杀猪盘', '13600136000', 300000, encrypt('网恋诱导投资，被骗30万'), '江苏省南京市', '高危', '已立案', 9, '杀猪盘,婚恋诈骗'],
      [`JB${now}006`, encrypt('周八'), encrypt('13400000006'), '冒充客服', '400-123-4567', 12000, encrypt('接到客服电话要求退款被骗'), '深圳市南山区', '中危', '已反馈', 6, '冒充客服,退款诈骗'],
      [`JB${now}007`, encrypt('吴九'), encrypt('13300000007'), '虚假贷款', 'quick-loan-fast.com', 5000, encrypt('在虚假贷款平台缴纳保证金被骗'), '成都市武侯区', '中危', '待受理', 10, '虚假贷款,保证金'],
      [`JB${now}008`, encrypt('郑十'), encrypt('13200000008'), '冒充领导', 'unknown', 80000, encrypt('收到领导微信要求转账'), '广州市天河区', '高危', '核查中', 7, '冒充领导,转账诈骗'],
    ];
    reports.forEach(r => insertReport.run(...r));
  }

  const caseCount = db.prepare('SELECT COUNT(*) as count FROM cases').get().count;
  if (caseCount === 0) {
    const insertCase = db.prepare(`
      INSERT INTO cases (case_no, title, type, location, amount, risk_level, status, agency_id, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = Date.now();
    const cases = [
      [`AJ${now}001`, '特大跨境网络刷单诈骗案', '刷单返利', '全国', 500000, '高危', '侦查中', 1, '刷单,跨境,特大'],
      [`AJ${now}002`, '系列冒充公检法诈骗案', '冒充公检法', '上海市', 200000, '高危', '已破案', 2, '冒充公检法,系列案'],
      [`AJ${now}003`, 'AI换脸诈骗团伙案', 'AI换脸诈骗', '广东省', 150000, '高危', '侦查中', 3, 'AI换脸,团伙'],
      [`AJ${now}004`, '虚假投资理财平台案', '虚假投资理财', '浙江省', 800000, '高危', '已冻结', 4, '虚假投资,平台诈骗'],
    ];
    cases.forEach(c => insertCase.run(...c));
  }

  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
  if (taskCount === 0) {
    const insertTask = db.prepare(`
      INSERT INTO tasks (task_no, title, description, case_id, report_id, assignee_id, assignee_name, status, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const now = Date.now();
    const tasks = [
      [`RW${now}001`, '核查刷单诈骗线索', '核实举报人提供的银行流水', 1, 1, 5, '张警官', '处理中', 'high', '2024-05-30'],
      [`RW${now}002`, '冻结涉案账户', '联系银行冻结涉案账户', 1, 1, 6, '李警官', '待处理', 'high', '2024-05-29'],
      [`RW${now}003`, '调取通话记录', '向运营商调取通话记录', 2, 2, 5, '张警官', '已完成', 'high', '2024-05-28'],
      [`RW${now}004`, 'AI换脸技术分析', '联系技侦部门分析视频', 3, 3, 6, '李警官', '待处理', 'high', '2024-05-31'],
      [`RW${now}005`, '跨境协作请求', '向广东警方发协作函', 1, null, 5, '张警官', '待处理', 'medium', '2024-06-01'],
    ];
    tasks.forEach(t => insertTask.run(...t));
  }

  const quizCount = db.prepare('SELECT COUNT(*) as count FROM quizzes').get().count;
  if (quizCount === 0) {
    const insertQuiz = db.prepare(`
      INSERT INTO quizzes (title, scenario, options, correct_answer, explanation, difficulty, tags) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const quizzes = [
      ['公检法诈骗识别', '你接到自称"北京市公安局"的电话，对方称你涉嫌洗钱案件，要求你将资金转入"安全账户"核查。你应该？', JSON.stringify(['立即按要求转账', '挂断电话并拨打110核实', '提供银行卡密码配合调查', '先转小额资金试探']), 1, '公检法不会要求转账，正确做法是挂断电话并拨打110核实。真正的公检法不会通过电话办案，更不会要求转账到所谓的"安全账户"。', 'easy', '冒充公检法'],
      ['刷单返利识别', '你在微信群看到"足不出户日赚300元的刷单广告，对方称先垫付本金后返佣金。你应该？', JSON.stringify(['立即参与试试', '要求对方先打佣金', '拒绝并举报', '先小额试试水']), 2, '所有要求先垫付的都是诈骗。刷单本身就是违法行为，且所有要求先垫付本金的都是诈骗，不要参与。', 'easy', '刷单返利'],
      ['AI换脸诈骗识别', '你收到亲友的视频通话，画面中是你的亲人，对方称遇到急事需要借钱。你应该？', JSON.stringify(['立即转账', '通过其他方式联系本人核实', '问一些只有你们知道的秘密', '直接挂断']), 1, 'AI换脸可以伪造视频，但无法伪造实时互动。应该通过其他联系方式（电话、微信语音等）联系本人核实。', 'medium', 'AI换脸'],
      ['虚假投资识别', '网友介绍你在一个"内部投资平台，称有内幕消息保证盈利。你应该？', JSON.stringify(['小额投资试试', '要求对方先展示盈利截图', '拒绝并举报', '跟着专家指导投资']), 2, '所谓的内幕消息、保证盈利都是诈骗。虚假投资平台都是后台操纵，先给小额盈利诱导大额投入后卷款跑路。', 'medium', '虚假投资'],
      ['杀猪盘识别', '网恋对象介绍你一个投资赚钱，称有内部渠道。你应该？', JSON.stringify(['相信对方并投资', '要求见面后再投资', '拒绝并举报', '先了解一下']), 2, '网恋诱导投资都是杀猪盘。骗子通过网恋建立信任后诱导投资，最终卷款跑路。', 'medium', '杀猪盘'],
      ['虚假贷款识别', '你收到短信称有低息贷款，点击链接后对方要求先交保证金。你应该？', JSON.stringify(['按要求交保证金', '点击链接了解', '拒绝并举报', '先交少量试试']), 2, '贷款前要求先交费用的都是诈骗。正规贷款不会在放款前收取任何费用。', 'easy', '虚假贷款'],
    ];
    quizzes.forEach(q => insertQuiz.run(...q));
  }

  const kgCount = db.prepare('SELECT COUNT(*) as count FROM knowledge_graph').get().count;
  if (kgCount === 0) {
    const insertKG = db.prepare(`
      INSERT INTO knowledge_graph (node_type, title, content, parent_id, metadata) VALUES (?, ?, ?, ?, ?)
    `);
    const kg = [
      ['category', '刷单返利诈骗', '通过网络刷单返利为诱饵，要求先垫付本金，后以各种理由拒绝返现的诈骗方式', null, '{"risk": "高"}'],
      ['subtype', '淘宝刷单', '冒充淘宝等电商平台刷单', 1, '{"platform": "淘宝"}'],
      ['subtype', '抖音点赞', '冒充抖音点赞刷单', 1, '{"platform": "抖音"}'],
      ['category', '冒充公检法诈骗', '冒充公安、检察院、法院工作人员，以涉嫌案件为由要求转账的诈骗', null, '{"risk": "极高"}'],
      ['subtype', '安全账户', '要求将资金转入安全账户核查', 4, '{"tactic": "恐吓"}'],
      ['subtype', '通缉令', '发送虚假通缉令', 4, '{"tactic": "威慑"}'],
      ['category', 'AI换脸诈骗', '利用AI技术伪造他人面容进行的诈骗', null, '{"risk": "极高"}'],
      ['category', '虚假投资理财', '虚假投资平台、理财产品诈骗', null, '{"risk": "高"}'],
      ['category', '杀猪盘', '通过婚恋交友诱导投资诈骗', null, '{"risk": "极高"}'],
      ['prevention', '不转账', '任何要求转账的都是诈骗', null, '{}'],
      ['prevention', '不透露', '不透露银行卡密码、验证码', null, '{}'],
      ['prevention', '多核实', '遇到可疑情况多核实', null, '{}'],
    ];
    kg.forEach(k => insertKG.run(...k));
  }

  const warningCount = db.prepare('SELECT COUNT(*) as count FROM warnings').get().count;
  if (warningCount === 0) {
    const insertWarning = db.prepare(`
      INSERT INTO warnings (user_id, type, content, risk_level) VALUES (?, ?, ?, ?)
    `);
    const warnings = [
      [null, 'system', '近期刷单返利诈骗高发，请提高警惕', '提示'],
      [null, 'system', 'AI换脸诈骗出现，请核实亲友身份后再转账', '警示'],
      [null, 'system', '虚假投资理财平台诈骗多发，请勿轻信高收益诱惑', '警示'],
      [null, 'system', '杀猪盘诈骗预警：网恋需警惕"内部渠道"投资', '警示'],
    ];
    warnings.forEach(w => insertWarning.run(...w));
  }
}

function info() {
  return { path: db ? db.name : null, tables: db ? db.pragma('table_list') : [] };
}

function getOverview() {
  const metrics = db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM reports WHERE status IN ('待受理', '核查中')) as activeCases,
      (SELECT COUNT(*) FROM reports WHERE risk_level = '高危') as highRiskCases,
      (SELECT COALESCE(SUM(fraud_amount), 0) FROM reports) as blockedAmount,
      (SELECT COUNT(DISTINCT reporter_phone_encrypted) FROM reports) as protectedPeople,
      (SELECT COUNT(*) FROM agencies WHERE online = 1) as onlineAgencies,
      (SELECT COUNT(*) FROM tasks WHERE status = '待处理') as pendingTasks,
      (SELECT COUNT(*) FROM cases) as totalCases
  `).get();

  const cases = db.prepare(`
    SELECT r.id, r.fraud_type as type, r.location, r.fraud_amount as amount,
           r.risk_level, r.status, r.created_at as reported_at
    FROM reports r
    ORDER BY r.created_at DESC
    LIMIT 10
  `).all().map(c => ({
    ...c,
    reported_at: c.reported_at,
    reporter_name: c.reporter_name_encrypted ? decrypt(c.reporter_name_encrypted) : '匿名'
  }));

  const agencies = db.prepare(`
    SELECT id, name, case_count, online
    FROM agencies
    ORDER BY case_count DESC
    LIMIT 8
  `).all();

  const tasks = db.prepare(`
    SELECT id, title, assignee_name as owner, status, due_date
    FROM tasks
    ORDER BY created_at DESC
    LIMIT 5
  `).all();

  return { metrics, cases, agencies, tasks };
}

function listCases(params = {}) {
  const { status = null, risk_level = null, page = 1, pageSize = 20 } = params;
  let sql = 'SELECT * FROM reports WHERE 1=1';
  const args = [];
  if (status) { sql += ' AND status = ?'; args.push(status); }
  if (risk_level) { sql += ' AND risk_level = ?'; args.push(risk_level); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(pageSize, (page - 1) * pageSize);
  return db.prepare(sql).all(...args).map(r => ({
    ...r,
    reporter_name: r.reporter_name_encrypted ? decrypt(r.reporter_name_encrypted) : null,
    reporter_phone: r.reporter_phone_encrypted ? decrypt(r.reporter_phone_encrypted) : null,
    description: r.description_encrypted ? decrypt(r.description_encrypted) : null
  }));
}

function getCase(id) {
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
  if (report) {
    report.reporter_name = report.reporter_name_encrypted ? decrypt(report.reporter_name_encrypted) : null;
    report.reporter_phone = report.reporter_phone_encrypted ? decrypt(report.reporter_phone_encrypted) : null;
    report.reporter_idcard = report.reporter_idcard_encrypted ? decrypt(report.reporter_idcard_encrypted) : null;
    report.description = report.description_encrypted ? decrypt(report.description_encrypted) : null;
    report.evidences = db.prepare('SELECT * FROM evidences WHERE report_id = ?').all(id);
    report.flow = db.prepare('SELECT * FROM report_flow WHERE report_id = ? ORDER BY created_at DESC').all(id);
  }
  return report;
}

function createCase(data) {
  const {
    reporter_name, reporter_phone, reporter_idcard,
    fraud_type, fraud_number, fraud_amount, description,
    location, risk_level = '待评估', agency_id = null
  } = data;

  const report_no = `JB${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  const info = db.prepare(`
    INSERT INTO reports (
      report_no, reporter_name_encrypted, reporter_phone_encrypted, reporter_idcard_encrypted,
      fraud_type, fraud_number, fraud_amount, description_encrypted,
      location, risk_level, status, agency_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    report_no,
    reporter_name ? encrypt(reporter_name) : null,
    reporter_phone ? encrypt(reporter_phone) : null,
    reporter_idcard ? encrypt(reporter_idcard) : null,
    fraud_type, fraud_number, fraud_amount || 0,
    description ? encrypt(description) : null,
    location, risk_level, '待受理', agency_id
  );

  const reportId = info.lastInsertRowid;

  logOperation(null, 'create', 'reports', reportId, null, JSON.stringify(data));
  logAudit(null, 'create_report', 'reports', reportId, null, null, JSON.stringify(data));

  return getCase(reportId);
}

function updateCaseStatus(id, status, operatorId = null, operatorName = null, note = '') {
  const old = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
  if (!old) return null;

  db.prepare('UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, id);

  db.prepare(`
    INSERT INTO report_flow (report_id, action, operator_id, operator_name, note, status_from, status_to)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, 'status_change', operatorId, operatorName, note, old.status, status);

  logOperation(operatorId, 'update_status', 'reports', id, JSON.stringify({ status: old.status }), JSON.stringify({ status }));

  return getCase(id);
}

function addEvidence(reportId, evidence) {
  const { type, file_name, file_path, file_hash, description } = evidence;
  const info = db.prepare(`
    INSERT INTO evidences (report_id, type, file_name, file_path, file_hash, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(reportId, type, file_name, file_path, file_hash, description);

  logOperation(null, 'add_evidence', 'evidences', info.lastInsertRowid, null, JSON.stringify(evidence));

  return { id: info.lastInsertRowid, ...evidence };
}

function verifyResource(type, value, ip = null) {
  const target = db.prepare(`
    SELECT * FROM fraud_resources
    WHERE type = ? AND value = ? AND status = 'active'
  `).get(type, value);

  let result = {
    type, value,
    is_fraud: !!target,
    risk_level: target ? target.risk_level : '安全',
    risk_score: target ? (target.risk_level === '高危' ? 90 : target.risk_level === '中危' ? 60 : 30) : 0,
    description: target ? target.description : '未发现风险',
    source: target ? target.source : null
  };

  db.prepare(`
    INSERT INTO verifications (type, target, target_type, result, risk_score, details, reporter_ip)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run('resource', value, type, result.is_fraud ? '涉诈' : '安全', result.risk_score, JSON.stringify(result), ip);

  logAudit(null, 'verify', 'verifications', null, ip, null, JSON.stringify({ type, value }));

  return result;
}

function listVerifications(params = {}) {
  const { page = 1, pageSize = 20 } = params;
  const sql = `
    SELECT * FROM verifications
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  return db.prepare(sql).all(pageSize, (page - 1) * pageSize);
}

function listFraudResources(params = {}) {
  const { type = null, risk_level = null, page = 1, pageSize = 20 } = params;
  let sql = 'SELECT * FROM fraud_resources WHERE 1=1';
  const args = [];
  if (type) { sql += ' AND type = ?'; args.push(type); }
  if (risk_level) { sql += ' AND risk_level = ?'; args.push(risk_level); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(pageSize, (page - 1) * pageSize);
  return db.prepare(sql).all(...args);
}

function addFraudResource(data) {
  const { type, value, risk_level = '高危', description, source } = data;
  const info = db.prepare(`
    INSERT OR IGNORE INTO fraud_resources (type, value, risk_level, description, source)
    VALUES (?, ?, ?, ?, ?)
  `).run(type, value, risk_level, description, source);

  if (info.changes > 0) {
    logOperation(null, 'create', 'fraud_resources', info.lastInsertRowid, null, JSON.stringify(data));
    return { id: info.lastInsertRowid, ...data };
  }
  return db.prepare('SELECT * FROM fraud_resources WHERE type = ? AND value = ?').get(type, value);
}

function updateFraudResource(id, data) {
  const old = db.prepare('SELECT * FROM fraud_resources WHERE id = ?').get(id);
  if (!old) return null;

  const { risk_level, description, source, status } = data;
  db.prepare(`
    UPDATE fraud_resources
    SET risk_level = ?, description = ?, source = ?, status = ?, last_seen = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(risk_level || old.risk_level, description || old.description, source || old.source, status || old.status, id);

  logOperation(null, 'update', 'fraud_resources', id, JSON.stringify(old), JSON.stringify(data));

  return db.prepare('SELECT * FROM fraud_resources WHERE id = ?').get(id);
}

function listAgencies() {
  return db.prepare('SELECT * FROM agencies ORDER BY case_count DESC').all();
}

function listTasks(params = {}) {
  const { status = null, assignee_id = null, page = 1, pageSize = 20 } = params;
  let sql = 'SELECT * FROM tasks WHERE 1=1';
  const args = [];
  if (status) { sql += ' AND status = ?'; args.push(status); }
  if (assignee_id) { sql += ' AND assignee_id = ?'; args.push(assignee_id); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(pageSize, (page - 1) * pageSize);
  return db.prepare(sql).all(...args);
}

function createTask(data) {
  const { title, description, case_id, report_id, assignee_id, assignee_name, priority = 'medium', due_date } = data;
  const task_no = `RW${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  const info = db.prepare(`
    INSERT INTO tasks (task_no, title, description, case_id, report_id, assignee_id, assignee_name, status, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, '待处理', ?, ?)
  `).run(task_no, title, description, case_id || null, report_id || null, assignee_id || null, assignee_name || null, priority, due_date || null);

  logOperation(null, 'create', 'tasks', info.lastInsertRowid, null, JSON.stringify(data));

  return { id: info.lastInsertRowid, task_no, ...data, status: '待处理' };
}

function updateTaskStatus(id, status) {
  const old = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!old) return null;
  db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run(status, id);
  logOperation(null, 'update_status', 'tasks', id, JSON.stringify({ status: old.status }), JSON.stringify({ status }));
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

function assignTask(id, assignee_id, assignee_name) {
  const old = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!old) return null;
  db.prepare('UPDATE tasks SET assignee_id = ?, assignee_name = ? WHERE id = ?').run(assignee_id, assignee_name, id);
  logOperation(null, 'assign', 'tasks', id, JSON.stringify({ assignee_id: old.assignee_id }), JSON.stringify({ assignee_id, assignee_name }));
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

function getKnowledgeGraph() {
  return db.prepare('SELECT * FROM knowledge_graph ORDER BY id').all();
}

function getPersonalizedWarnings(userId = null) {
  return db.prepare(`
    SELECT * FROM warnings
    WHERE user_id IS NULL OR user_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `).all(userId);
}

function getQuizzes(tags = null, limit = 5) {
  let sql = 'SELECT * FROM quizzes';
  const args = [];
  if (tags) {
    sql += ' WHERE tags LIKE ?';
    args.push(`%${tags}%`);
  }
  sql += ' ORDER BY RANDOM() LIMIT ?';
  args.push(limit);
  return db.prepare(sql).all(...args).map(q => ({
    ...q,
    options: JSON.parse(q.options)
  }));
}

function submitQuizAnswer(quizId, userId, answer) {
  const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId);
  if (!quiz) return null;
  const is_correct = answer === quiz.correct_answer;
  db.prepare(`
    INSERT INTO quiz_answers (quiz_id, user_id, user_answer, is_correct)
    VALUES (?, ?, ?, ?)
  `).run(quizId, userId || null, answer, is_correct ? 1 : 0);
  return {
    is_correct,
    correct_answer: quiz.correct_answer,
    explanation: quiz.explanation,
    options: JSON.parse(quiz.options)
  };
}

function login(username, password) {
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !verifyPassword(password, user.password_hash)) return null;
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    real_name: user.real_name_encrypted ? decrypt(user.real_name_encrypted) : null,
    agency_id: user.agency_id,
    region: user.region
  };
}

function listUsers(role = null) {
  let sql = 'SELECT id, username, role, agency_id, region, status, created_at FROM users';
  const args = [];
  if (role) {
    sql += ' WHERE role = ?';
    args.push(role);
  }
  return db.prepare(sql).all(...args).map(u => ({
    ...u
  }));
}

function getAuditLogs(params = {}) {
  const { user_id = null, page = 1, pageSize = 20 } = params;
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const args = [];
  if (user_id) { sql += ' AND user_id = ?'; args.push(user_id); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(pageSize, (page - 1) * pageSize);
  return db.prepare(sql).all(...args);
}

function getOperationLogs(params = {}) {
  const { table_name = null, page = 1, pageSize = 20 } = params;
  let sql = 'SELECT * FROM operation_logs WHERE 1=1';
  const args = [];
  if (table_name) { sql += ' AND table_name = ?'; args.push(table_name); }
  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(pageSize, (page - 1) * pageSize);
  return db.prepare(sql).all(...args);
}

function logOperation(userId, operation, tableName, recordId, oldValues, newValues) {
  db.prepare(`
    INSERT INTO operation_logs (user_id, operation, table_name, record_id, old_values, new_values)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId || null, operation, tableName, recordId || null, oldValues, newValues);
}

function logAudit(userId, action, resourceType, resourceId, ip, userAgent, details) {
  db.prepare(`
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId || null, action, resourceType, resourceId || null, ip || null, userAgent || null, details || null);
}

function screenReportsByRegion() {
  return db.prepare(`
    SELECT location, COUNT(*) as count, COALESCE(SUM(fraud_amount), 0) as total_amount
    FROM reports
    GROUP BY location
    ORDER BY count DESC
  `).all();
}

function getStats() {
  return {
    reports_by_type: db.prepare(`
      SELECT fraud_type, COUNT(*) as count, COALESCE(SUM(fraud_amount), 0) as amount
      FROM reports
      GROUP BY fraud_type
      ORDER BY count DESC
    `).all(),
    reports_by_status: db.prepare(`
      SELECT status, COUNT(*) as count
      FROM reports
      GROUP BY status
    `).all(),
    reports_by_risk: db.prepare(`
      SELECT risk_level, COUNT(*) as count
      FROM reports
      GROUP BY risk_level
    `).all(),
    monthly_trend: db.prepare(`
      SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
      FROM reports
      GROUP BY month
      ORDER BY month DESC
      LIMIT 6
    `).all()
  };
}

module.exports = {
  init,
  info,
  getOverview,
  listCases,
  getCase,
  createCase,
  updateCaseStatus,
  addEvidence,
  verifyResource,
  listFraudResources,
  addFraudResource,
  updateFraudResource,
  listAgencies,
  listTasks,
  createTask,
  updateTaskStatus,
  assignTask,
  getKnowledgeGraph,
  getPersonalizedWarnings,
  getQuizzes,
  submitQuizAnswer,
  login,
  listUsers,
  getAuditLogs,
  getOperationLogs,
  screenReportsByRegion,
  getStats,
  encrypt,
  decrypt,
  logOperation,
  logAudit
};
