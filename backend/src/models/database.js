const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let db;

function init() {
  const dbPath = path.join(__dirname, '../../data/app.sqlite');
  const dbDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  initSeedData();
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      id_card TEXT UNIQUE,
      phone TEXT,
      email TEXT,
      type TEXT DEFAULT 'personal',
      avatar TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS legal_entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      company_name TEXT NOT NULL,
      credit_code TEXT UNIQUE NOT NULL,
      legal_representative TEXT NOT NULL,
      business_license TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS authorization_chains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      legal_id INTEGER REFERENCES legal_entities(id),
      authorizer_id INTEGER REFERENCES users(id),
      authorized_id INTEGER REFERENCES users(id),
      permissions TEXT,
      valid_from DATETIME,
      valid_to DATETIME,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      cert_type TEXT NOT NULL,
      cert_number TEXT UNIQUE NOT NULL,
      cert_name TEXT NOT NULL,
      issuer TEXT NOT NULL,
      issue_date DATE,
      expire_date DATE,
      status TEXT DEFAULT 'active',
      qr_code TEXT,
      verify_code TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cert_verify_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cert_id INTEGER REFERENCES certificates(id),
      verifier_id INTEGER REFERENCES users(id),
      verify_result TEXT,
      verify_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      client_info TEXT
    );

    CREATE TABLE IF NOT EXISTS service_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      department TEXT,
      description TEXT,
      parent_id INTEGER,
      sort_order INTEGER DEFAULT 0,
      icon TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES service_categories(id),
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      department TEXT NOT NULL,
      description TEXT,
      handling_time TEXT,
      required_materials TEXT,
      process_flow TEXT,
      form_schema TEXT,
      status TEXT DEFAULT 'active',
      is_hot INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      service_id INTEGER REFERENCES service_items(id),
      service_name TEXT NOT NULL,
      application_no TEXT UNIQUE NOT NULL,
      form_data TEXT,
      materials TEXT,
      status TEXT DEFAULT 'pending',
      current_step INTEGER DEFAULT 0,
      assignee_id INTEGER REFERENCES users(id),
      submit_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_time DATETIME,
      rating INTEGER,
      feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS application_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER REFERENCES applications(id),
      step_no INTEGER,
      step_name TEXT,
      handler TEXT,
      status TEXT DEFAULT 'pending',
      remark TEXT,
      handle_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS policy_news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      department TEXT,
      publish_date DATE,
      category TEXT,
      is_top INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      module TEXT,
      resource_id INTEGER,
      ip_address TEXT,
      user_agent TEXT,
      result TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weather_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT NOT NULL,
      temperature REAL,
      weather TEXT,
      humidity INTEGER,
      wind_direction TEXT,
      wind_speed REAL,
      update_time DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function initSeedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  
  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const password = bcrypt.hashSync('123456', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (username, password, name, id_card, phone, type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('admin', password, '系统管理员', '110101199001011234', '13800138000', 'admin');
    insertUser.run('user1', password, '张三', '110101199001011235', '13800138001', 'personal');
    insertUser.run('company1', password, '李四（法人）', '110101199001011236', '13800138002', 'legal');
  }

  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM service_categories').get().count;
  
  if (categoryCount === 0) {
    const categories = [
      { name: '公安服务', code: 'police', department: '公安厅', icon: 'shield' },
      { name: '人社服务', code: 'hrss', department: '人力资源和社会保障厅', icon: 'user' },
      { name: '医保服务', code: 'medical', department: '医疗保障局', icon: 'heart' },
      { name: '教育服务', code: 'education', department: '教育厅', icon: 'book' },
      { name: '民政服务', code: 'civil', department: '民政厅', icon: 'home' },
      { name: '税务服务', code: 'tax', department: '税务局', icon: 'calculator' },
      { name: '住房服务', code: 'housing', department: '住房和城乡建设厅', icon: 'building' },
      { name: '交通服务', code: 'transport', department: '交通运输厅', icon: 'car' }
    ];

    const insertCategory = db.prepare(`
      INSERT INTO service_categories (name, code, department, icon, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `);

    categories.forEach((cat, idx) => {
      insertCategory.run(cat.name, cat.code, cat.department, cat.icon, idx);
    });

    const services = [
      { category: 1, name: '身份证办理', code: 'id_card_apply', handling_time: '15个工作日' },
      { category: 1, name: '居住证申领', code: 'residence_permit', handling_time: '7个工作日' },
      { category: 2, name: '社保查询', code: 'social_security_query', handling_time: '即时办理' },
      { category: 2, name: '养老保险转移', code: 'pension_transfer', handling_time: '30个工作日' },
      { category: 3, name: '医保报销', code: 'medical_reimbursement', handling_time: '15个工作日' },
      { category: 3, name: '异地就医备案', code: 'remote_medical_record', handling_time: '3个工作日' },
      { category: 4, name: '学历认证', code: 'degree_verification', handling_time: '7个工作日' },
      { category: 4, name: '教师资格认定', code: 'teacher_cert', handling_time: '20个工作日' },
      { category: 5, name: '婚姻登记预约', code: 'marriage_registration', handling_time: '预约办理' },
      { category: 5, name: '低保申请', code: 'subsidy_apply', handling_time: '30个工作日' },
      { category: 6, name: '个人所得税申报', code: 'personal_tax', handling_time: '即时办理' },
      { category: 6, name: '发票申领', code: 'invoice_apply', handling_time: '5个工作日' },
      { category: 7, name: '公积金提取', code: 'housing_fund', handling_time: '7个工作日' },
      { category: 7, name: '不动产登记', code: 'real_estate_reg', handling_time: '20个工作日' },
      { category: 8, name: '驾驶证换证', code: 'driver_license_renew', handling_time: '3个工作日' },
      { category: 8, name: '机动车上牌', code: 'vehicle_registration', handling_time: '5个工作日' }
    ];

    const insertService = db.prepare(`
      INSERT INTO service_items (category_id, name, code, department, handling_time, is_hot)
      VALUES (?, ?, ?, (SELECT department FROM service_categories WHERE id = ?), ?, ?)
    `);

    services.forEach((srv, idx) => {
      insertService.run(srv.category, srv.name, srv.code, srv.category, srv.handling_time, idx < 6 ? 1 : 0);
    });
  }

  const certCount = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;
  
  if (certCount === 0) {
    const certs = [
      { userId: 2, type: '身份证', number: '110101199001011235', name: '居民身份证', issuer: '北京市公安局' },
      { userId: 2, type: '社保卡', number: 'B11010120230001', name: '社会保障卡', issuer: '北京市人力资源和社会保障局' },
      { userId: 2, type: '医保卡', number: 'Y11010120230001', name: '医疗保险卡', issuer: '北京市医疗保障局' },
      { userId: 3, type: '营业执照', number: '91110000MA00ABCD12', name: '企业法人营业执照', issuer: '北京市市场监督管理局' }
    ];

    const insertCert = db.prepare(`
      INSERT INTO certificates (user_id, cert_type, cert_number, cert_name, issuer, issue_date, expire_date, qr_code, verify_code)
      VALUES (?, ?, ?, ?, ?, DATE('now'), DATE('now', '+10 years'), ?, ?)
    `);

    certs.forEach(cert => {
      const qrCode = `QR-${cert.number}-${Date.now()}`;
      const verifyCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      insertCert.run(cert.userId, cert.type, cert.number, cert.name, cert.issuer, qrCode, verifyCode);
    });
  }

  const newsCount = db.prepare('SELECT COUNT(*) as count FROM policy_news').get().count;
  
  if (newsCount === 0) {
    const news = [
      { title: '关于优化营商环境的若干政策措施', department: '省政府办公厅', category: '政策法规' },
      { title: '2024年度社保缴费基数调整通知', department: '人力资源和社会保障厅', category: '通知公告' },
      { title: '医保跨省异地就医直接结算政策解读', department: '医疗保障局', category: '政策解读' },
      { title: '关于加强政务服务"一网通办"的实施意见', department: '政务服务管理局', category: '政策法规' },
      { title: '居民身份证电子证照全面推广应用', department: '公安厅', category: '工作动态' }
    ];

    const insertNews = db.prepare(`
      INSERT INTO policy_news (title, content, department, publish_date, category, is_top)
      VALUES (?, ?, ?, DATE('now'), ?, ?)
    `);

    news.forEach((item, idx) => {
      insertNews.run(item.title, `${item.title}的详细内容...`, item.department, item.category, idx === 0 ? 1 : 0);
    });
  }
}

function getDb() {
  return db;
}

module.exports = { init, getDb };
