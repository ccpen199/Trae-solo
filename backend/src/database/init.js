const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initTables = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      real_name TEXT,
      id_card TEXT,
      role TEXT NOT NULL DEFAULT 'tenant',
      avatar TEXT,
      credit_score INTEGER DEFAULT 100,
      zhima_credit_score INTEGER,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      property_type TEXT NOT NULL,
      rent_mode TEXT NOT NULL,
      price REAL NOT NULL,
      deposit REAL,
      area REAL,
      rooms INTEGER,
      bathrooms INTEGER,
      floor TEXT,
      total_floors INTEGER,
      orientation TEXT,
      decoration TEXT,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      district TEXT,
      community TEXT,
      longitude REAL,
      latitude REAL,
      facilities TEXT,
      tags TEXT,
      vr_url TEXT,
      images TEXT,
      status TEXT DEFAULT 'pending',
      verification_stage INTEGER DEFAULT 0,
      is_verified INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS property_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      verifier_id INTEGER,
      stage INTEGER NOT NULL,
      stage_name TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      evidence TEXT,
      notes TEXT,
      verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (verifier_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS favorite_properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, property_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS view_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      landlord_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL,
      contract_type TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      monthly_rent REAL NOT NULL,
      deposit REAL NOT NULL,
      payment_cycle TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      signed_landlord INTEGER DEFAULT 0,
      signed_tenant INTEGER DEFAULT 0,
      signed_at DATETIME,
      contract_content TEXT,
      evidence_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (landlord_id) REFERENCES users(id),
      FOREIGN KEY (tenant_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      payment_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      transaction_id TEXT,
      paid_at DATETIME,
      evidence_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS escrow_funds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'held',
      released_at DATETIME,
      evidence_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (payment_id) REFERENCES payments(id)
    );

    CREATE TABLE IF NOT EXISTS insurance_policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL,
      policy_type TEXT NOT NULL,
      premium REAL NOT NULL,
      coverage_amount REAL,
      status TEXT DEFAULT 'active',
      start_date DATE,
      end_date DATE,
      policy_number TEXT,
      evidence_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    );

    CREATE TABLE IF NOT EXISTS quality_inspections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      inspector_id INTEGER,
      status TEXT DEFAULT 'pending',
      inspection_type TEXT NOT NULL,
      issues TEXT,
      report TEXT,
      scheduled_at DATETIME,
      completed_at DATETIME,
      evidence_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (inspector_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS disputes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL,
      complainant_id INTEGER NOT NULL,
      respondent_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      mediator_id INTEGER,
      resolution TEXT,
      evidence_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (contract_id) REFERENCES contracts(id),
      FOREIGN KEY (complainant_id) REFERENCES users(id),
      FOREIGN KEY (respondent_id) REFERENCES users(id),
      FOREIGN KEY (mediator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS dispute_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dispute_id INTEGER NOT NULL,
      sender_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dispute_id) REFERENCES disputes(id),
      FOREIGN KEY (sender_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS rent_index (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city TEXT NOT NULL,
      district TEXT,
      avg_rent_per_sqm REAL,
      avg_transaction_days INTEGER,
      transaction_count INTEGER,
      record_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER,
      service_type TEXT NOT NULL,
      service_name TEXT NOT NULL,
      price REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      paid_at DATETIME,
      completed_at DATETIME,
      transaction_id TEXT,
      rating INTEGER,
      review TEXT,
      evidence_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE TABLE IF NOT EXISTS match_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      min_budget REAL,
      max_budget REAL,
      cities TEXT,
      property_types TEXT,
      rent_modes TEXT,
      min_area REAL,
      rooms TEXT,
      commute_location TEXT,
      commute_radius INTEGER,
      facilities_weight TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      property_id INTEGER,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id),
      FOREIGN KEY (property_id) REFERENCES properties(id)
    );

    CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
    CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
    CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
    CREATE INDEX IF NOT EXISTS idx_contracts_tenant ON contracts(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_contracts_landlord ON contracts(landlord_id);
  `);

  console.log('数据库表初始化完成');
};

const seedData = () => {
  const checkAdmin = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?');
  const adminCount = checkAdmin.get('admin').count;

  if (adminCount === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const insertAdmin = db.prepare(`
      INSERT INTO users (username, phone, password, real_name, role, is_verified, credit_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertAdmin.run('admin', '13800000000', hashedPassword, '系统管理员', 'admin', 1, 100);
    console.log('管理员账号创建完成: admin / admin123');
  }

  const checkUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE role IN (?, ?)');
  const userCount = checkUsers.get('landlord', 'tenant').count;

  if (userCount < 5) {
    const hashedPassword = bcrypt.hashSync('123456', 10);
    const insertUser = db.prepare(`
      INSERT INTO users (username, phone, password, real_name, role, is_verified, credit_score, zhima_credit_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('zhangsan', '13800000001', hashedPassword, '张三', 'landlord', 1, 95, 720);
    insertUser.run('lisi', '13800000002', hashedPassword, '李四', 'tenant', 1, 90, 680);
    insertUser.run('wangwu', '13800000003', hashedPassword, '王五', 'landlord', 1, 88, 650);
    insertUser.run('zhaoliu', '13800000004', hashedPassword, '赵六', 'tenant', 1, 92, 700);
    insertUser.run('sunqi', '13800000005', hashedPassword, '孙七', 'tenant', 0, 85, 620);
    console.log('测试用户账号创建完成，密码均为: 123456');
  }

  const checkProperties = db.prepare('SELECT COUNT(*) as count FROM properties');
  const propertyCount = checkProperties.get().count;

  if (propertyCount < 5) {
    const insertProperty = db.prepare(`
      INSERT INTO properties (owner_id, title, description, property_type, rent_mode, price, deposit, area, rooms, bathrooms, floor, total_floors, orientation, decoration, address, city, district, community, facilities, tags, vr_url, images, status, verification_stage, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const sampleProperties = [
      [1, '朝阳区精装两居室', '阳光充足，南北通透，拎包入住', 'apartment', 'whole', 5500, 5500, 85, 2, 1, '中层', 18, '南北', '精装', '北京市朝阳区建国路88号', '北京', '朝阳区', '阳光花园', '空调,洗衣机,冰箱,热水器,WiFi', '近地铁,学区房,有电梯', '', JSON.stringify(['/images/house1.jpg', '/images/house2.jpg']), 'verified', 4, 1],
      [1, '海淀区温馨单间', '独立卫浴，交通便利，适合单身白领', 'apartment', 'share', 2200, 2200, 18, 1, 1, '高层', 25, '南', '简装', '北京市海淀区中关村大街1号', '北京', '海淀区', '科技苑', '空调,WiFi,热水器', '近地铁,独立卫浴', '', JSON.stringify(['/images/room1.jpg']), 'verified', 4, 1],
      [3, '西城区大三居', '学区房，小区环境优美，配套完善', 'apartment', 'whole', 8500, 17000, 120, 3, 2, '低层', 6, '南北', '豪装', '北京市西城区金融街10号', '北京', '西城区', '金茂府', '中央空调,洗衣机,冰箱,热水器,WiFi,车位,储物间', '学区房,近公园,有车位', '', JSON.stringify(['/images/house3.jpg']), 'verified', 4, 1],
      [3, '东城区loft公寓', '时尚loft，挑高设计，适合年轻人', 'apartment', 'whole', 4800, 4800, 55, 1, 1, '中层', 12, '东南', '精装', '北京市东城区东直门内大街', '北京', '东城区', '东方银座', '空调,洗衣机,冰箱,热水器,WiFi', '近地铁,loft', '', JSON.stringify(['/images/house4.jpg']), 'verifying', 2, 0],
      [1, '丰台区两室一厅', '性价比高，生活便利，适合家庭', 'apartment', 'whole', 3800, 3800, 70, 2, 1, '中层', 8, '南北', '简装', '北京市丰台区南三环西路', '北京', '丰台区', '万年花城', '空调,洗衣机,冰箱,热水器,WiFi,天然气', '性价比高', '', JSON.stringify(['/images/house5.jpg']), 'pending', 0, 0]
    ];

    sampleProperties.forEach(p => insertProperty.run(...p));
    console.log('测试房源数据创建完成');
  }

  const checkRentIndex = db.prepare('SELECT COUNT(*) as count FROM rent_index');
  const rentIndexCount = checkRentIndex.get().count;

  if (rentIndexCount < 10) {
    const insertRentIndex = db.prepare(`
      INSERT INTO rent_index (city, district, avg_rent_per_sqm, avg_transaction_days, transaction_count, record_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const districts = ['朝阳区', '海淀区', '西城区', '东城区', '丰台区'];
    const today = new Date().toISOString().split('T')[0];
    
    districts.forEach((district, i) => {
      insertRentIndex.run('北京', district, 65 + i * 10, 12 + i * 2, 150 + i * 30, today);
    });
    console.log('租金指数数据创建完成');
  }

  const checkVerifications = db.prepare('SELECT COUNT(*) as count FROM property_verifications');
  const verificationCount = checkVerifications.get().count;

  if (verificationCount === 0) {
    const insertVerification = db.prepare(`
      INSERT INTO property_verifications (property_id, verifier_id, stage, stage_name, status, evidence, notes, verified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const verificationStages = [
      { stage: 1, name: '产权核验', evidence: '房产证照片', notes: '产权人信息与系统一致' },
      { stage: 2, name: '实地打卡', evidence: 'GPS定位+现场照片', notes: '房源真实存在' },
      { stage: 3, name: '人脸识别', evidence: '房东人脸照片', notes: '房东身份核验通过' },
      { stage: 4, name: '邻居验证', evidence: '邻居确认录音', notes: '邻居交叉验证通过' }
    ];

    const now = new Date().toISOString();
    for (let pid = 1; pid <= 3; pid++) {
      verificationStages.forEach((vs, i) => {
        const verifyTime = new Date(Date.now() - (3 - i) * 86400000).toISOString();
        insertVerification.run(pid, 1, vs.stage, vs.name, 'verified', vs.evidence, vs.notes, verifyTime);
      });
    }

    insertVerification.run(4, 1, 1, '产权核验', 'verified', '房产证照片', '产权核验通过', new Date(Date.now() - 86400000).toISOString());
    insertVerification.run(4, 1, 2, '实地打卡', 'verified', 'GPS定位', '实地打卡通过', new Date(Date.now() - 43200000).toISOString());

    console.log('房源验证记录创建完成');
  }

  const checkServiceOrders = db.prepare('SELECT COUNT(*) as count FROM service_orders');
  const serviceOrderCount = checkServiceOrders.get().count;

  if (serviceOrderCount === 0) {
    const insertServiceOrder = db.prepare(`
      INSERT INTO service_orders (user_id, property_id, service_type, service_name, price, status, paid_at, completed_at, transaction_id, rating, review, evidence_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 86400000).toISOString();
    const twoDaysAgo = new Date(now.getTime() - 86400000 * 2).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 86400000 * 3).toISOString();
    const nowStr = now.toISOString();
    const fiveHoursAgo = new Date(now.getTime() - 18000000).toISOString();
    const twoHoursAgo = new Date(now.getTime() - 7200000).toISOString();

    const generateHash = () => {
      return '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    };

    insertServiceOrder.run(
      2, 1, 'inspection', '标准验房', 599, 'completed',
      threeDaysAgo, twoDaysAgo,
      'TXN' + Date.now(),
      5, '验房师很专业，报告详细，发现了几处小问题都标注清楚了，非常满意！',
      generateHash()
    );
    insertServiceOrder.run(
      2, 1, 'legal', '合同审核', 199, 'pending',
      null, null, null, null, null, null
    );
    insertServiceOrder.run(
      3, 3, 'inspection', '深度验房', 999, 'processing',
      fiveHoursAgo, null,
      'TXN' + (Date.now() - 18000000),
      null, null, null
    );
    insertServiceOrder.run(
      4, 2, 'legal', '合同定制', 499, 'paid',
      twoHoursAgo, null,
      'TXN' + (Date.now() - 7200000),
      null, null, null
    );
    insertServiceOrder.run(
      2, null, 'loan', '贷款咨询', 99, 'completed',
      twoDaysAgo, oneDayAgo,
      'TXN' + (Date.now() - 86400000),
      4, '顾问很专业，给出的方案很实用',
      generateHash()
    );

    console.log('服务订单数据创建完成');
  }

  const generateHash = () => {
    return '0x' + [...Array(64)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const checkContracts = db.prepare('SELECT COUNT(*) as count FROM contracts');
  const contractCount = checkContracts.get().count;

  if (contractCount === 0) {
    const insertContract = db.prepare(`
      INSERT INTO contracts (property_id, landlord_id, tenant_id, contract_type, start_date, end_date, monthly_rent, deposit, payment_cycle, status, signed_landlord, signed_tenant, signed_at, contract_content, evidence_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];

    insertContract.run(1, 1, 2, 'rent', startDate, endDate, 5500, 5500, 'monthly', 'active', 1, 1, new Date().toISOString(), '标准租赁合同', generateHash());
    insertContract.run(3, 3, 4, 'rent', startDate, endDate, 8500, 17000, 'quarterly', 'pending', 1, 0, null, '标准租赁合同', null);

    console.log('合约数据创建完成');
  }

  const checkPayments = db.prepare('SELECT COUNT(*) as count FROM payments');
  const paymentCount = checkPayments.get().count;

  if (paymentCount === 0) {
    const insertPayment = db.prepare(`
      INSERT INTO payments (contract_id, user_id, amount, payment_type, status, transaction_id, paid_at, evidence_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    insertPayment.run(1, 2, 5500, 'rent', 'completed', 'TXN' + Date.now(), now, generateHash());
    insertPayment.run(1, 2, 5500, 'deposit', 'completed', 'TXN' + (Date.now() + 1), now, generateHash());

    console.log('支付记录创建完成');
  }

  const checkDisputes = db.prepare('SELECT COUNT(*) as count FROM disputes');
  const disputeCount = checkDisputes.get().count;

  if (disputeCount === 0) {
    const insertDispute = db.prepare(`
      INSERT INTO disputes (contract_id, complainant_id, respondent_id, title, description, status, mediator_id, resolution, created_at, resolved_at, evidence_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    insertDispute.run(1, 2, 1, '维修责任争议', '热水器损坏，房东拒绝维修', 'mediating', null, null, now, null, null);

    console.log('纠纷数据创建完成');
  }

  const checkInspections = db.prepare('SELECT COUNT(*) as count FROM quality_inspections');
  const inspectionCount = checkInspections.get().count;

  if (inspectionCount === 0) {
    const insertInspection = db.prepare(`
      INSERT INTO quality_inspections (property_id, inspector_id, status, inspection_type, issues, report, scheduled_at, completed_at, evidence_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    insertInspection.run(1, 1, 'completed', 'verification', '[]', '房源质量合格，水电设施正常', now, now, generateHash());
    insertInspection.run(4, null, 'pending', 'verification', null, null, new Date(Date.now() + 86400000).toISOString(), null, null);

    console.log('质检工单数据创建完成');
  }

  const checkInsurance = db.prepare('SELECT COUNT(*) as count FROM insurance_policies');
  const insuranceCount = checkInsurance.get().count;

  if (insuranceCount === 0) {
    const insertInsurance = db.prepare(`
      INSERT INTO insurance_policies (contract_id, policy_type, premium, coverage_amount, status, start_date, end_date, policy_number, evidence_hash)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const today = new Date().toISOString().split('T')[0];
    const endDate = new Date(new Date().getFullYear() + 1, new Date().getMonth(), new Date().getDate()).toISOString().split('T')[0];
    insertInsurance.run(1, 'property', 299, 50000, 'active', today, endDate, 'INS' + Date.now(), generateHash());

    console.log('保险数据创建完成');
  }

  console.log('种子数据初始化完成');
};

try {
  initTables();
  seedData();
  console.log('数据库初始化成功!');
} catch (error) {
  console.error('数据库初始化失败:', error);
  process.exit(1);
} finally {
  db.close();
}
