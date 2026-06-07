const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS centers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      province TEXT,
      city TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      id_card TEXT UNIQUE,
      phone TEXT,
      role TEXT NOT NULL,
      center_id INTEGER,
      unit_id INTEGER,
      developer_id INTEGER,
      status TEXT DEFAULT 'active',
      last_login_at DATETIME,
      last_login_ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (center_id) REFERENCES centers(id)
    );

    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      credit_code TEXT,
      center_id INTEGER,
      base_ratio REAL DEFAULT 0.12,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (center_id) REFERENCES centers(id)
    );

    CREATE TABLE IF NOT EXISTS developers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      credit_code TEXT UNIQUE,
      center_id INTEGER,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (center_id) REFERENCES centers(id)
    );

    CREATE TABLE IF NOT EXISTS personal_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      account_no TEXT UNIQUE NOT NULL,
      balance DECIMAL(15,2) DEFAULT 0,
      base_salary DECIMAL(10,2),
      monthly_pay DECIMAL(10,2),
      unit_id INTEGER,
      status TEXT DEFAULT 'normal',
      last_sync_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (unit_id) REFERENCES units(id)
    );

    CREATE TABLE IF NOT EXISTS transaction_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      balance_after DECIMAL(15,2),
      description TEXT,
      source_type TEXT,
      source_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES personal_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      loan_no TEXT UNIQUE NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      term_months INTEGER NOT NULL,
      interest_rate DECIMAL(5,4) NOT NULL,
      monthly_payment DECIMAL(10,2),
      paid_principal DECIMAL(15,2) DEFAULT 0,
      paid_interest DECIMAL(15,2) DEFAULT 0,
      remaining_principal DECIMAL(15,2),
      status TEXT DEFAULT 'repaying',
      start_date DATE,
      end_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS loan_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      developer_name TEXT,
      developer_credit_code TEXT,
      project_name TEXT,
      project_address TEXT,
      risk_level TEXT DEFAULT 'normal',
      risk_note TEXT,
      reviewer_id INTEGER,
      review_status TEXT DEFAULT 'pending',
      review_note TEXT,
      reviewed_at DATETIME,
      FOREIGN KEY (loan_id) REFERENCES loans(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS withdrawal_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      reason TEXT,
      materials TEXT,
      status TEXT DEFAULT 'pending',
      approver_id INTEGER,
      approve_time DATETIME,
      reject_reason TEXT,
      center_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (approver_id) REFERENCES users(id),
      FOREIGN KEY (center_id) REFERENCES centers(id)
    );

    CREATE TABLE IF NOT EXISTS transfer_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      from_center_id INTEGER NOT NULL,
      to_center_id INTEGER NOT NULL,
      amount DECIMAL(15,2),
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (from_center_id) REFERENCES centers(id),
      FOREIGN KEY (to_center_id) REFERENCES centers(id)
    );

    CREATE TABLE IF NOT EXISTS unit_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER NOT NULL,
      period TEXT NOT NULL,
      total_amount DECIMAL(15,2) NOT NULL,
      person_count INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (unit_id) REFERENCES units(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      role TEXT,
      action TEXT NOT NULL,
      module TEXT,
      ip TEXT,
      user_agent TEXT,
      request_data TEXT,
      response_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS center_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      center_id INTEGER NOT NULL,
      config_key TEXT NOT NULL,
      config_value TEXT,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (center_id) REFERENCES centers(id),
      UNIQUE(center_id, config_key)
    );

    CREATE TABLE IF NOT EXISTS risk_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      level TEXT DEFAULT 'warning',
      user_id INTEGER,
      application_id INTEGER,
      description TEXT,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS message_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      center_id INTEGER,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cross_center_sync (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      from_center_id INTEGER NOT NULL,
      to_center_id INTEGER NOT NULL,
      sync_type TEXT NOT NULL,
      sync_status TEXT DEFAULT 'pending',
      diff_amount DECIMAL(15,2),
      diff_detail TEXT,
      synced_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (from_center_id) REFERENCES centers(id),
      FOREIGN KEY (to_center_id) REFERENCES centers(id)
    );

    CREATE TABLE IF NOT EXISTS fund_arrivals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      amount DECIMAL(15,2) NOT NULL,
      expected_date DATE,
      actual_date DATE,
      arrival_status TEXT DEFAULT 'pending',
      source_type TEXT,
      source_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES personal_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS verification_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      application_id INTEGER,
      verification_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      detail TEXT,
      verified_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS unit_payment_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      base_salary DECIMAL(10,2),
      unit_ratio REAL,
      personal_ratio REAL,
      unit_amount DECIMAL(10,2),
      personal_amount DECIMAL(10,2),
      total_amount DECIMAL(10,2),
      status TEXT DEFAULT 'normal',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (payment_id) REFERENCES unit_payments(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS developer_projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      developer_id INTEGER NOT NULL,
      project_name TEXT NOT NULL,
      project_address TEXT,
      presale_permit TEXT,
      total_units INTEGER,
      sold_units INTEGER DEFAULT 0,
      center_id INTEGER,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (developer_id) REFERENCES developers(id),
      FOREIGN KEY (center_id) REFERENCES centers(id)
    );
  `);

  try { db.prepare('ALTER TABLE users ADD COLUMN last_login_at DATETIME').run(); } catch (e) {}
  try { db.prepare('ALTER TABLE users ADD COLUMN last_login_ip TEXT').run(); } catch (e) {}

  const centerCount = db.prepare('SELECT COUNT(*) as count FROM centers').get().count;
  if (centerCount === 0) {
    const insertCenter = db.prepare('INSERT INTO centers (code, name, province, city) VALUES (?, ?, ?, ?)');
    const centers = [
      ['BJ001', '北京住房公积金管理中心', '北京市', '北京市'],
      ['SH001', '上海住房公积金管理中心', '上海市', '上海市'],
      ['GZ001', '广州住房公积金管理中心', '广东省', '广州市'],
      ['SZ001', '深圳住房公积金管理中心', '广东省', '深圳市'],
      ['CQ001', '重庆住房公积金管理中心', '重庆市', '重庆市'],
      ['CD001', '成都住房公积金管理中心', '四川省', '成都市'],
      ['WH001', '武汉住房公积金管理中心', '湖北省', '武汉市'],
      ['HZ001', '杭州住房公积金管理中心', '浙江省', '杭州市'],
      ['NJ001', '南京住房公积金管理中心', '江苏省', '南京市'],
      ['TJ001', '天津住房公积金管理中心', '天津市', '天津市'],
      ['XA001', '西安住房公积金管理中心', '陕西省', '西安市'],
      ['CS001', '长沙住房公积金管理中心', '湖南省', '长沙市']
    ];
    const insertMany = db.transaction((rows) => {
      for (const c of rows) insertCenter.run(c[0], c[1], c[2], c[3]);
    });
    insertMany(centers);
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('123456', 10);

    const insertUser = db.prepare(`
      INSERT INTO users (username, password, name, id_card, phone, role, center_id, unit_id, developer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seed = db.transaction(() => {
      insertUser.run('admin', hashedPassword, '系统管理员', '110101199001011234', '13800138000', 'super_admin', 1, null, null);
      insertUser.run('supervisor_bj', hashedPassword, '北京监管员', '110101199001011235', '13800138001', 'supervisor', 1, null, null);
      insertUser.run('unit_admin', hashedPassword, '单位经办员', '110101199001011236', '13800138002', 'unit_admin', 1, 1, null);
      insertUser.run('developer', hashedPassword, '开发商用户', '110101199001011237', '13800138003', 'developer', 1, null, 1);

      for (let i = 1; i <= 5; i++) {
        const unitId = i === 1 ? 1 : null;
        insertUser.run(
          `person${i}`, hashedPassword, `缴存人${i}`,
          `11010119900101200${i}`, `1380013810${i}`, 'personal',
          i === 2 ? 2 : 1, unitId, null
        );
      }

      db.prepare('INSERT INTO units (code, name, credit_code, center_id, base_ratio) VALUES (?, ?, ?, ?, ?)')
        .run('UNIT001', '示例科技有限公司', '91110000MA001ABC12', 1, 0.12);

      db.prepare('INSERT INTO developers (name, credit_code, center_id) VALUES (?, ?, ?)')
        .run('北京城建开发有限公司', '91110000MA009DEV01', 1);

      for (let i = 1; i <= 5; i++) {
        db.prepare(`
          INSERT INTO personal_accounts (user_id, account_no, balance, base_salary, monthly_pay, unit_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          4 + i,
          `BJ${String(2024000000 + i).padStart(12, '0')}`,
          60000 + i * 15000,
          15000 + i * 1000,
          3600 + i * 200,
          i === 1 ? 1 : null
        );
      }

      db.prepare(`
        INSERT INTO loans (user_id, loan_no, amount, term_months, interest_rate, monthly_payment,
                           paid_principal, paid_interest, remaining_principal, start_date, end_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(5, 'LOAN20240001', 800000, 360, 0.031, 3420, 100000, 60000, 700000, '2020-01-01', '2050-01-01');

      db.prepare(`
        INSERT INTO loan_details (loan_id, developer_name, developer_credit_code, project_name,
          project_address, risk_level, risk_note, reviewer_id, review_status, review_note, reviewed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(1, '北京城建开发有限公司', '91110000MA009DEV01', '城建阳光花园',
        '北京市朝阳区建国路88号', 'normal', '项目合规，风险可控', 2, 'approved',
        '材料齐全，审批通过', '2024-01-15T10:30:00');

      const txTypes = [
        ['deposit', 4800, '月度汇缴-单位'],
        ['deposit', 4800, '月度汇缴-个人'],
        ['interest', 156.80, '年度结息'],
        ['withdrawal', -3600, '租房提取'],
        ['deposit', 4800, '月度汇缴-单位'],
        ['deposit', 4800, '月度汇缴-个人'],
        ['loan_repayment', -3420, '贷款月扣'],
        ['deposit', 4800, '月度汇缴-单位'],
        ['deposit', 4800, '月度汇缴-个人'],
        ['transfer_in', 25000, '异地转入-上海']
      ];
      let runningBalance = 75000;
      const insertTx = db.prepare(`
        INSERT INTO transaction_records (account_id, type, amount, balance_after, description, source_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (let i = 0; i < txTypes.length; i++) {
        const [type, amount, desc] = txTypes[i];
        runningBalance += amount;
        const date = new Date(2024, 0, 1 + i * 15);
        insertTx.run(1, type, Math.abs(amount), runningBalance, desc, type,
          date.toISOString().replace('T', ' ').split('.')[0]);
      }

      db.prepare(`
        INSERT INTO cross_center_sync (user_id, from_center_id, to_center_id, sync_type, sync_status, diff_amount, diff_detail, synced_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(5, 2, 1, 'balance', 'synced', 0, '余额一致，无需调整', '2024-02-01T09:00:00', '2024-01-20T08:00:00');

      db.prepare(`
        INSERT INTO cross_center_sync (user_id, from_center_id, to_center_id, sync_type, sync_status, diff_amount, diff_detail, synced_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(5, 2, 1, 'loan', 'conflict', 5000, '上海中心贷款余额与北京中心不一致，差额5000元', null, '2024-03-01T10:00:00');

      db.prepare(`
        INSERT INTO cross_center_sync (user_id, from_center_id, to_center_id, sync_type, sync_status, diff_amount, diff_detail, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(5, 2, 1, 'transfer', 'pending', null, '待同步转移记录', '2024-03-15T14:00:00');

      const insertFundArrival = db.prepare(`
        INSERT INTO fund_arrivals (account_id, amount, expected_date, actual_date, arrival_status, source_type, source_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertFundArrival.run(1, 4800, '2024-01-15', '2024-01-14', 'arrived', 'unit_payment', 1, '2024-01-10');
      insertFundArrival.run(1, 4800, '2024-02-15', '2024-02-15', 'arrived', 'unit_payment', 1, '2024-02-10');
      insertFundArrival.run(1, 4800, '2024-03-15', null, 'pending', 'unit_payment', 1, '2024-03-10');
      insertFundArrival.run(1, 25000, '2024-02-28', null, 'overdue', 'cross_center', 1, '2024-02-20');
      insertFundArrival.run(1, 4800, '2024-04-15', null, 'pending', 'unit_payment', 1, '2024-04-10');

      const insertVerification = db.prepare(`
        INSERT INTO verification_records (user_id, application_id, verification_type, status, detail, verified_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      insertVerification.run(5, 1, 'ocr_id_card', 'verified', '身份证OCR识别通过，信息一致', '2024-01-10T09:05:00', '2024-01-10T09:00:00');
      insertVerification.run(5, 1, 'face_recognition', 'verified', '人脸比对通过，相似度98.5%', '2024-01-10T09:08:00', '2024-01-10T09:06:00');
      insertVerification.run(5, 2, 'ocr_id_card', 'verified', '身份证OCR识别通过', '2024-02-05T14:05:00', '2024-02-05T14:00:00');
      insertVerification.run(5, 2, 'face_recognition', 'failed', '人脸比对失败，相似度62%', null, '2024-02-05T14:06:00');
      insertVerification.run(5, 3, 'ocr_id_card', 'pending', null, null, '2024-03-01T10:00:00');

      db.prepare(`
        INSERT INTO unit_payments (unit_id, period, total_amount, person_count, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(1, '2024-01', 9600, 1, 'paid');

      db.prepare(`
        INSERT INTO unit_payments (unit_id, period, total_amount, person_count, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(1, '2024-02', 9600, 1, 'paid');

      db.prepare(`
        INSERT INTO unit_payments (unit_id, period, total_amount, person_count, status)
        VALUES (?, ?, ?, ?, ?)
      `).run(1, '2024-03', 9600, 1, 'pending');

      db.prepare(`
        INSERT INTO unit_payment_details (payment_id, user_id, base_salary, unit_ratio, personal_ratio, unit_amount, personal_amount, total_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(1, 5, 20000, 0.12, 0.12, 2400, 2400, 4800, 'normal');
      db.prepare(`
        INSERT INTO unit_payment_details (payment_id, user_id, base_salary, unit_ratio, personal_ratio, unit_amount, personal_amount, total_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(2, 5, 20000, 0.12, 0.12, 2400, 2400, 4800, 'normal');
      db.prepare(`
        INSERT INTO unit_payment_details (payment_id, user_id, base_salary, unit_ratio, personal_ratio, unit_amount, personal_amount, total_amount, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(3, 5, 20000, 0.12, 0.12, 2400, 2400, 4800, 'pending');

      const insertDevProject = db.prepare(`
        INSERT INTO developer_projects (developer_id, project_name, project_address, presale_permit, total_units, sold_units, center_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertDevProject.run(1, '城建阳光花园', '北京市朝阳区建国路88号', '京房售证字(2024)001号', 500, 320, 1, 'active');
      insertDevProject.run(1, '城建翡翠城', '北京市海淀区中关村大街66号', '京房售证字(2024)015号', 800, 560, 1, 'active');
      insertDevProject.run(1, '城建星河湾', '北京市丰台区南三环西路12号', null, 300, 0, 1, 'presale');

      const insertWithdrawal = db.prepare(`
        INSERT INTO withdrawal_applications (user_id, type, amount, reason, materials, status, approver_id, approve_time, reject_reason, center_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      insertWithdrawal.run(5, 'rent', 3600, '租房提取', '["rent_contract","rent_receipt"]', 'approved', 2, '2024-01-12T10:00:00', null, 1, '2024-01-10T09:30:00');
      insertWithdrawal.run(5, 'house_purchase', 100000, '购房首付提取', '["house_contract","invoice"]', 'pending', null, null, null, 1, '2024-03-01T10:00:00');
      insertWithdrawal.run(5, 'renovation', 50000, '房屋装修', '["renovation_contract"]', 'rejected', 2, '2024-02-10T15:00:00', '装修合同不完整，请补充材料', 1, '2024-02-05T14:00:00');
      insertWithdrawal.run(6, 'rent', 18000, '年度租房提取', '["rent_contract"]', 'pending', null, null, null, 2, '2024-03-05T11:00:00');
      insertWithdrawal.run(7, 'serious_illness', 30000, '大病医疗', '["medical_certificate","medical_bill"]', 'approved', 2, '2024-02-20T09:00:00', null, 1, '2024-02-18T16:00:00');

      db.prepare(`
        INSERT INTO risk_alerts (type, level, user_id, application_id, description, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('large_amount', 'high', 5, 2, '大额购房提取申请：100000元', 'open', '2024-03-01T10:05:00');
      db.prepare(`
        INSERT INTO risk_alerts (type, level, user_id, application_id, description, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('frequent_withdrawal', 'warning', 5, 3, '30天内多次提取申请', 'open', '2024-03-01T10:05:00');

      db.prepare(`
        INSERT INTO center_configs (center_id, config_key, config_value, description)
        VALUES (?, ?, ?, ?)
      `).run(1, 'max_withdrawal_ratio', '0.7', '最大提取比例');
      db.prepare(`
        INSERT INTO center_configs (center_id, config_key, config_value, description)
        VALUES (?, ?, ?, ?)
      `).run(1, 'loan_max_term_months', '360', '贷款最长期限（月）');

      db.prepare(`
        INSERT INTO transfer_applications (user_id, from_center_id, to_center_id, amount, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(5, 2, 1, 25000, 'approved', '2024-01-20T08:00:00');
    });

    seed();
  }
}

initDatabase();

module.exports = db;
