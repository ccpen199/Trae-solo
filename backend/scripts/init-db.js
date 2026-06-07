require('dotenv').config({ path: '../.env' });
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_card VARCHAR(18) UNIQUE NOT NULL,
      name VARCHAR(50) NOT NULL,
      phone VARCHAR(20),
      social_card_no VARCHAR(30) UNIQUE,
      password VARCHAR(255),
      user_type VARCHAR(20) DEFAULT 'citizen',
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name VARCHAR(100) NOT NULL,
      unified_credit_code VARCHAR(18) UNIQUE NOT NULL,
      legal_person VARCHAR(50),
      contact_phone VARCHAR(20),
      hr_id INTEGER REFERENCES users(id),
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS social_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      card_no VARCHAR(30) UNIQUE NOT NULL,
      id_card VARCHAR(18) NOT NULL,
      name VARCHAR(50) NOT NULL,
      bank_name VARCHAR(50),
      bank_account VARCHAR(30),
      status VARCHAR(20) DEFAULT 'active',
      issue_date DATE,
      expire_date DATE,
      loss_reported INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS card_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER REFERENCES social_cards(id),
      user_id INTEGER REFERENCES users(id),
      operation_type VARCHAR(20) NOT NULL,
      reason TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      appointment_date DATE,
      progress INTEGER DEFAULT 0,
      tracking_no VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS qualification_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      id_card VARCHAR(18) NOT NULL,
      name VARCHAR(50) NOT NULL,
      method VARCHAR(20) NOT NULL,
      biometric_score DECIMAL(5,4),
      behavior_score DECIMAL(5,4),
      confidence DECIMAL(5,4),
      result VARCHAR(10) NOT NULL,
      remark TEXT,
      reviewed INTEGER DEFAULT 0,
      reviewer_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS behavior_trajectories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      id_card VARCHAR(18),
      event_type VARCHAR(50),
      location VARCHAR(100),
      event_time DATETIME,
      source VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS insurance_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      social_card_no VARCHAR(30),
      merchant_id INTEGER,
      merchant_name VARCHAR(100),
      merchant_type VARCHAR(20),
      total_amount DECIMAL(12,2),
      insurance_payment DECIMAL(12,2),
      personal_payment DECIMAL(12,2),
      prescription_id VARCHAR(50),
      payment_status VARCHAR(20) DEFAULT 'completed',
      transaction_no VARCHAR(50) UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prescription_no VARCHAR(50) UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id),
      hospital_name VARCHAR(100),
      doctor_name VARCHAR(50),
      diagnosis TEXT,
      drugs TEXT,
      total_amount DECIMAL(12,2),
      status VARCHAR(20) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL,
      address VARCHAR(200),
      contact_phone VARCHAR(20),
      qualification_no VARCHAR(50),
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS insurance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      id_card VARCHAR(18),
      insurance_type VARCHAR(20),
      payment_month VARCHAR(7),
      payment_base DECIMAL(12,2),
      personal_payment DECIMAL(12,2),
      company_payment DECIMAL(12,2),
      status VARCHAR(20) DEFAULT 'paid',
      company_id INTEGER REFERENCES companies(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS insurance_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      from_location VARCHAR(50),
      to_location VARCHAR(50),
      transfer_type VARCHAR(20),
      status VARCHAR(20) DEFAULT 'processing',
      progress INTEGER DEFAULT 0,
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS retirement_estimates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      id_card VARCHAR(18),
      birth_date DATE,
      gender VARCHAR(10),
      retirement_age INTEGER,
      contribution_years INTEGER,
      personal_account_balance DECIMAL(14,2),
      average_salary DECIMAL(12,2),
      estimated_pension DECIMAL(12,2),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hr_declarations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER REFERENCES companies(id),
      hr_id INTEGER REFERENCES users(id),
      declaration_month VARCHAR(7),
      employee_count INTEGER,
      total_base DECIMAL(14,2),
      total_amount DECIMAL(14,2),
      status VARCHAR(20) DEFAULT 'pending',
      remark TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hr_employee_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      declaration_id INTEGER REFERENCES hr_declarations(id),
      company_id INTEGER REFERENCES companies(id),
      employee_id_card VARCHAR(18),
      employee_name VARCHAR(50),
      change_type VARCHAR(20),
      change_date DATE,
      salary DECIMAL(12,2),
      status VARCHAR(20) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fund_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fund_type VARCHAR(20),
      operation_type VARCHAR(10),
      amount DECIMAL(14,2),
      region VARCHAR(50),
      statistics_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fund_warnings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      warning_type VARCHAR(50),
      level VARCHAR(20),
      description TEXT,
      related_data TEXT,
      status VARCHAR(20) DEFAULT 'active',
      handled INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS abnormal_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id INTEGER REFERENCES insurance_payments(id),
      user_id INTEGER REFERENCES users(id),
      abnormal_type VARCHAR(50),
      risk_score DECIMAL(5,4),
      description TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cross_province_settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      from_province VARCHAR(50),
      to_province VARCHAR(50),
      medical_type VARCHAR(20),
      total_amount DECIMAL(12,2),
      reimbursement_amount DECIMAL(12,2),
      submit_date DATE,
      settle_date DATE,
      settlement_days INTEGER,
      status VARCHAR(20) DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS offline_centers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      center_code VARCHAR(20) UNIQUE NOT NULL,
      center_name VARCHAR(100) NOT NULL,
      region VARCHAR(50),
      address VARCHAR(200),
      contact_phone VARCHAR(20),
      last_sync_time DATETIME,
      sync_status VARCHAR(20) DEFAULT 'online',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS offline_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      center_id INTEGER REFERENCES offline_centers(id),
      record_type VARCHAR(50),
      record_data TEXT,
      offline_time DATETIME,
      sync_status VARCHAR(20) DEFAULT 'pending',
      sync_time DATETIME,
      sync_batch_no VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      user_type VARCHAR(20),
      module VARCHAR(50),
      operation VARCHAR(100),
      ip VARCHAR(50),
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_id_card ON users(id_card);
    CREATE INDEX IF NOT EXISTS idx_social_cards_user_id ON social_cards(user_id);
    CREATE INDEX IF NOT EXISTS idx_qual_verifications_user_id ON qualification_verifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_insurance_records_user_id ON insurance_records(user_id);
    CREATE INDEX IF NOT EXISTS idx_insurance_payments_user_id ON insurance_payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_hr_declarations_company_id ON hr_declarations(company_id);
  `);

  console.log('数据库表结构初始化完成');
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('测试数据已存在，跳过初始化');
    return;
  }

  const bcrypt = require('bcryptjs');
  const passwordHash = bcrypt.hashSync('123456', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (id_card, name, phone, social_card_no, password, user_type, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const citizens = [
    ['140101198001011234', '张三', '13800138001', 'SX140101198001010001', passwordHash, 'citizen', 1],
    ['140101197503152345', '李四', '13800138002', 'SX140101197503150002', passwordHash, 'citizen', 1],
    ['140101198807203456', '王五', '13800138003', 'SX140101198807200003', passwordHash, 'citizen', 1],
    ['140101199012254567', '赵六', '13800138004', 'SX140101199012250004', passwordHash, 'citizen', 1],
    ['140101196505105678', '孙七', '13800138005', 'SX140101196505100005', passwordHash, 'citizen', 1],
    ['140101199208156789', 'hr001', '13900139001', null, passwordHash, 'hr', 1],
    ['140101198502287890', 'admin', '13900139002', null, passwordHash, 'admin', 1],
  ];

  const userIds = [];
  citizens.forEach(c => {
    const info = insertUser.run(c[0], c[1], c[2], c[3], c[4], c[5], c[6]);
    userIds.push(info.lastInsertRowid);
  });

  const insertCompany = db.prepare(`
    INSERT INTO companies (company_name, unified_credit_code, legal_person, contact_phone, hr_id, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertCompany.run('山西煤炭工业集团有限公司', '911400001234567890', '张三', '0351-12345678', userIds[5], 1);
  insertCompany.run('太原钢铁集团有限公司', '911400002345678901', '李四', '0351-23456789', userIds[5], 1);
  insertCompany.run('山西杏花村汾酒集团', '911400003456789012', '王五', '0351-34567890', userIds[5], 1);

  const insertCard = db.prepare(`
    INSERT INTO social_cards (user_id, card_no, id_card, name, bank_name, bank_account, status, issue_date, expire_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (let i = 0; i < 5; i++) {
    insertCard.run(
      userIds[i],
      `SX140101198${i}0${i}0${i}000${i + 1}`,
      citizens[i][0],
      citizens[i][1],
      '中国工商银行山西省分行',
      `622202140${i}00${i}${i}${i}${i}${i}${i}`,
      'active',
      '2020-01-01',
      '2030-01-01'
    );
  }

  const insertMerchant = db.prepare(`
    INSERT INTO merchants (name, type, address, contact_phone, qualification_no, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertMerchant.run('山西医科大学第一医院', 'hospital', '太原市迎泽区解放南路85号', '0351-4639114', 'YLJG140001', 1);
  insertMerchant.run('山西省人民医院', 'hospital', '太原市迎泽区双塔东街29号', '0351-4960081', 'YLJG140002', 1);
  insertMerchant.run('益源大药房连锁总店', 'pharmacy', '太原市杏花岭区府东街13号', '0351-3081234', 'YD140001', 1);
  insertMerchant.run('同仁堂药店太原店', 'pharmacy', '太原市迎泽区解放路32号', '0351-4085678', 'YD140002', 1);
  insertMerchant.run('太原市中心医院', 'hospital', '太原市杏花岭区东三道巷5号', '0351-3360752', 'YLJG140003', 1);

  const insertInsuranceRecord = db.prepare(`
    INSERT INTO insurance_records (user_id, id_card, insurance_type, payment_month, payment_base, personal_payment, company_payment, company_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (let y = 2020; y <= 2025; y++) {
    for (let m = 1; m <= 12; m++) {
      const month = `${y}-${String(m).padStart(2, '0')}`;
      for (let i = 0; i < 5; i++) {
        const base = 5000 + Math.floor(Math.random() * 3000);
        insertInsuranceRecord.run(
          userIds[i],
          citizens[i][0],
          'pension',
          month,
          base,
          base * 0.08,
          base * 0.16,
          (i % 3) + 1
        );
        insertInsuranceRecord.run(
          userIds[i],
          citizens[i][0],
          'medical',
          month,
          base,
          base * 0.02,
          base * 0.08,
          (i % 3) + 1
        );
        insertInsuranceRecord.run(
          userIds[i],
          citizens[i][0],
          'unemployment',
          month,
          base,
          base * 0.005,
          base * 0.005,
          (i % 3) + 1
        );
      }
    }
  }

  const insertVerification = db.prepare(`
    INSERT INTO qualification_verifications (user_id, id_card, name, method, biometric_score, behavior_score, confidence, result, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const methods = ['biometric', 'behavior', 'combined'];
  const results = ['pass', 'pass', 'pass', 'fail', 'pass'];
  for (let i = 0; i < 5; i++) {
    const bioScore = 0.85 + Math.random() * 0.15;
    const behScore = 0.80 + Math.random() * 0.20;
    insertVerification.run(
      userIds[i],
      citizens[i][0],
      citizens[i][1],
      methods[i % 3],
      bioScore,
      behScore,
      (bioScore + behScore) / 2,
      results[i],
      results[i] === 'pass' ? '自动静默认证通过' : '置信度不足，需人工复核'
    );
  }

  const insertBehavior = db.prepare(`
    INSERT INTO behavior_trajectories (user_id, id_card, event_type, location, event_time, source)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const eventTypes = ['医院就诊', '药店购药', '养老金领取', '公交出行', '政务服务'];
  const locations = ['太原市', '大同市', '阳泉市', '长治市', '晋城市'];
  for (let i = 0; i < 30; i++) {
    const userIdx = i % 5;
    insertBehavior.run(
      userIds[userIdx],
      citizens[userIdx][0],
      eventTypes[i % 5],
      locations[i % 5],
      `2025-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')} 10:${String(i % 60).padStart(2, '0')}:00`,
      i % 2 === 0 ? '医保结算系统' : '交通出行系统'
    );
  }

  const insertPayment = db.prepare(`
    INSERT INTO insurance_payments (user_id, social_card_no, merchant_id, merchant_name, merchant_type, total_amount, insurance_payment, personal_payment, payment_status, transaction_no)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (let i = 0; i < 10; i++) {
    const userIdx = i % 5;
    const merchantIdx = i % 4;
    const total = 200 + Math.floor(Math.random() * 800);
    const insurance = Math.floor(total * 0.55);
    insertPayment.run(
      userIds[userIdx],
      citizens[userIdx][3],
      merchantIdx + 1,
      ['山西医科大学第一医院', '山西省人民医院', '益源大药房', '同仁堂药店'][merchantIdx],
      merchantIdx < 2 ? 'hospital' : 'pharmacy',
      total,
      insurance,
      total - insurance,
      'completed',
      `PAY${Date.now()}${i}`
    );
  }

  const insertDeclaration = db.prepare(`
    INSERT INTO hr_declarations (company_id, hr_id, declaration_month, employee_count, total_base, total_amount, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (let c = 1; c <= 3; c++) {
    for (let m = 1; m <= 6; m++) {
      const count = 100 + Math.floor(Math.random() * 50);
      const totalBase = count * (5000 + Math.floor(Math.random() * 2000));
      insertDeclaration.run(
        c,
        userIds[5],
        `2025-0${m}`,
        count,
        totalBase,
        totalBase * 0.25,
        m < 5 ? 'approved' : 'pending'
      );
    }
  }

  const insertFundOp = db.prepare(`
    INSERT INTO fund_operations (fund_type, operation_type, amount, region, statistics_date)
    VALUES (?, ?, ?, ?, ?)
  `);
  const regions = ['太原市', '大同市', '阳泉市', '长治市', '晋城市', '朔州市', '晋中市', '运城市', '忻州市', '临汾市', '吕梁市'];
  const fundTypes = ['pension', 'medical', 'unemployment', 'injury', 'maternity'];
  for (let m = 1; m <= 6; m++) {
    regions.forEach(region => {
      fundTypes.forEach(type => {
        insertFundOp.run(type, 'income', Math.floor(10000000 + Math.random() * 5000000), region, `2025-0${m}-01`);
        insertFundOp.run(type, 'expense', Math.floor(8000000 + Math.random() * 4000000), region, `2025-0${m}-01`);
      });
    });
  }

  const insertCrossSettlement = db.prepare(`
    INSERT INTO cross_province_settlements (user_id, from_province, to_province, medical_type, total_amount, reimbursement_amount, submit_date, settle_date, settlement_days, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '河北省', '河南省', '陕西省'];
  for (let i = 0; i < 15; i++) {
    const userIdx = i % 5;
    const days = 1 + Math.floor(Math.random() * 20);
    const total = 5000 + Math.floor(Math.random() * 20000);
    insertCrossSettlement.run(
      userIds[userIdx],
      '山西省',
      provinces[i % 8],
      i % 3 === 0 ? 'outpatient' : 'inpatient',
      total,
      Math.floor(total * 0.6),
      `2025-0${(i % 6) + 1}-10`,
      `2025-0${(i % 6) + 1}-${10 + days}`,
      days,
      'completed'
    );
  }

  const insertCenter = db.prepare(`
    INSERT INTO offline_centers (center_code, center_name, region, address, contact_phone, last_sync_time, sync_status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const towns = [
    ['CZ001', '太原市迎泽区柳巷街道便民中心', '太原市迎泽区', '迎泽区柳巷南路1号', '0351-2021234', '2025-06-01 09:00:00', 'online'],
    ['CZ002', '太原市杏花岭区巨轮街道便民中心', '太原市杏花岭区', '杏花岭区解放北路85号', '0351-3085678', '2025-06-01 10:30:00', 'online'],
    ['CZ003', '大同市平城区古城街道便民中心', '大同市平城区', '平城区永泰街23号', '0352-2051234', '2025-06-01 14:00:00', 'online'],
    ['CZ004', '临汾市尧都区鼓楼街道便民中心', '临汾市尧都区', '尧都区鼓楼东大街45号', '0357-2018765', '2025-05-31 16:00:00', 'offline'],
    ['CZ005', '运城市盐湖区东城街道便民中心', '运城市盐湖区', '盐湖区河东东街32号', '0359-2087654', '2025-06-01 08:30:00', 'online'],
  ];
  towns.forEach(t => insertCenter.run(...t));

  const insertOfflineRecord = db.prepare(`
    INSERT INTO offline_records (center_id, record_type, record_data, offline_time, sync_status)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (let i = 0; i < 20; i++) {
    const centerId = (i % 5) + 1;
    insertOfflineRecord.run(
      centerId,
      i % 3 === 0 ? 'qualification_verify' : i % 3 === 1 ? 'card_apply' : 'payment',
      JSON.stringify({ idCard: `14010119800101${1000 + i}`, name: `测试${i}`, amount: 100 + i * 10 }),
      `2025-06-0${(i % 5) + 1} ${String(8 + (i % 12)).padStart(2, '0')}:30:00`,
      i < 15 ? 'synced' : 'pending'
    );
  }

  const insertLog = db.prepare(`
    INSERT INTO operation_logs (user_id, user_type, module, operation, ip, user_agent)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const modules = ['qualification', 'social_card', 'medical_payment', 'insurance_record', 'hr_service', 'fund_monitor', 'offline_sync'];
  const operations = ['查询', '新增', '修改', '删除', '认证', '支付', '同步'];
  for (let i = 0; i < 30; i++) {
    const userIdx = i % 7;
    insertLog.run(
      userIds[userIdx],
      citizens[userIdx][5],
      modules[i % modules.length],
      operations[i % operations.length],
      `192.168.${i % 255}.${i % 255}`,
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    );
  }

  console.log('测试数据初始化完成');
}

initDatabase();
seedData();
db.close();
console.log('数据库初始化全部完成');
