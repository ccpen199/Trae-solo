const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_card TEXT UNIQUE,
      phone TEXT UNIQUE,
      name TEXT,
      gender TEXT,
      birth_date TEXT,
      address TEXT,
      avatar TEXT,
      yuesheng_code TEXT UNIQUE,
      face_verified INTEGER DEFAULT 0,
      business_license TEXT,
      user_type TEXT DEFAULT 'personal',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      token TEXT UNIQUE,
      auth_type TEXT,
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      cert_type TEXT,
      cert_number TEXT,
      cert_name TEXT,
      issue_authority TEXT,
      issue_date TEXT,
      expire_date TEXT,
      cert_data TEXT,
      status TEXT DEFAULT 'valid',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS service_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE,
      name TEXT,
      category TEXT,
      department TEXT,
      description TEXT,
      materials TEXT,
      process_steps TEXT,
      handling_time TEXT,
      fee TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_no TEXT UNIQUE,
      user_id INTEGER,
      service_item_id INTEGER,
      service_name TEXT,
      form_data TEXT,
      materials_uploaded TEXT,
      status TEXT DEFAULT 'pending',
      current_step INTEGER DEFAULT 0,
      submit_time TEXT,
      handling_deadline TEXT,
      handler TEXT,
      handler_department TEXT,
      result TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (service_item_id) REFERENCES service_items(id)
    );

    CREATE TABLE IF NOT EXISTS application_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER,
      action TEXT,
      operator TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id)
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE,
      user_id INTEGER,
      user_name TEXT,
      phone TEXT,
      title TEXT,
      content TEXT,
      category TEXT,
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'pending',
      assigned_to TEXT,
      assigned_department TEXT,
      source TEXT DEFAULT '12345',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS system_health (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department TEXT,
      system_name TEXT,
      status TEXT,
      response_time INTEGER,
      last_check TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      name TEXT,
      department TEXT,
      role TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS trusted_evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      evidence_type TEXT,
      evidence_hash TEXT,
      evidence_data TEXT,
      blockchain_txid TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get();
  if (adminCount.count === 0) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO admin_users (username, password, name, department, role) VALUES (?, ?, ?, ?, ?)').run(
      'admin', hash, '系统管理员', '省政务服务中心', 'super_admin'
    );
  }

  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM service_items').get();
  if (serviceCount.count === 0) {
    const services = [
      { code: 'SB-001', name: '社保查询', category: '社保', department: '省人力资源社会保障厅', description: '查询个人社会保险参保缴费信息', materials: '身份证', process_steps: '身份认证->查询->结果展示', handling_time: '即时', fee: '免费' },
      { code: 'YB-001', name: '医保报销', category: '医保', department: '省医疗保障局', description: '医疗保险费用报销申请', materials: '身份证、医疗发票、费用清单', process_steps: '提交申请->材料审核->费用核算->报销打款', handling_time: '15个工作日', fee: '免费' },
      { code: 'HZ-001', name: '新生儿入户', category: '户政', department: '省公安厅', description: '新生儿户口登记办理', materials: '出生医学证明、父母结婚证、父母户口簿', process_steps: '在线填报->预审核->窗口核验->办理完成', handling_time: '7个工作日', fee: '免费' },
      { code: 'BDC-001', name: '不动产登记', category: '不动产', department: '省自然资源厅', description: '不动产权证书登记办理', materials: '身份证、购房合同、完税证明', process_steps: '申请受理->权属审核->登簿缮证->领证', handling_time: '5个工作日', fee: '按规定收取' },
    ];
    const insertService = db.prepare('INSERT INTO service_items (code, name, category, department, description, materials, process_steps, handling_time, fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    services.forEach(s => {
      insertService.run(s.code, s.name, s.category, s.department, s.description, s.materials, s.process_steps, s.handling_time, s.fee);
    });
  }

  const healthCount = db.prepare('SELECT COUNT(*) as count FROM system_health').get();
  if (healthCount.count === 0) {
    const systems = [
      { department: '省人力资源社会保障厅', system_name: '社保业务系统' },
      { department: '省医疗保障局', system_name: '医保信息平台' },
      { department: '省公安厅', system_name: '人口信息管理系统' },
      { department: '省自然资源厅', system_name: '不动产登记系统' },
      { department: '省市场监督管理局', system_name: '企业信用信息公示系统' },
      { department: '省政务服务中心', system_name: '统一身份认证平台' },
    ];
    const insertHealth = db.prepare('INSERT INTO system_health (department, system_name, status, response_time, last_check) VALUES (?, ?, ?, ?, ?)');
    systems.forEach(s => {
      insertHealth.run(s.department, s.system_name, 'online', Math.floor(Math.random() * 100) + 50, new Date().toISOString());
    });
  }
}

initDatabase();

try {
  db.prepare('ALTER TABLE users ADD COLUMN user_type TEXT DEFAULT "personal"').run();
} catch (e) {
}

module.exports = db;
