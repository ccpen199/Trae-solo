const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT,
    real_name TEXT,
    id_card TEXT,
    avatar TEXT,
    points INTEGER DEFAULT 0,
    user_type TEXT DEFAULT 'resident',
    province TEXT,
    city TEXT,
    district TEXT,
    address TEXT,
    risk_level INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_number TEXT UNIQUE NOT NULL,
    account_name TEXT,
    address TEXT,
    meter_number TEXT,
    voltage_level TEXT,
    balance REAL DEFAULT 0,
    arrears REAL DEFAULT 0,
    daily_usage REAL DEFAULT 0,
    monthly_usage REAL DEFAULT 0,
    province TEXT,
    city TEXT,
    district TEXT,
    is_default INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS payment_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    payment_method TEXT,
    payment_type TEXT,
    order_no TEXT UNIQUE,
    status TEXT DEFAULT 'success',
    payer_name TEXT,
    payee_name TEXT,
    is_agent INTEGER DEFAULT 0,
    agent_relation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS usage_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    date DATE NOT NULL,
    kwh REAL NOT NULL,
    amount REAL,
    peak_kwh REAL,
    valley_kwh REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    UNIQUE(account_id, date)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    points INTEGER NOT NULL,
    stock INTEGER DEFAULT 0,
    image TEXT,
    status TEXT DEFAULT 'active',
    daily_limit INTEGER DEFAULT 5,
    user_level_limit INTEGER DEFAULT 1,
    is_virtual INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS exchange_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    points INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'success',
    exchange_ip TEXT,
    device_info TEXT,
    risk_flag INTEGER DEFAULT 0,
    risk_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS financial_products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    expected_yield REAL NOT NULL,
    min_amount REAL NOT NULL,
    max_amount REAL,
    term_days INTEGER,
    risk_level INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS investment_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    expected_income REAL,
    actual_income REAL,
    status TEXT DEFAULT 'holding',
    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    redeem_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES financial_products(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS power_outage_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    province TEXT,
    city TEXT,
    district TEXT,
    area TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    reason TEXT,
    affected_accounts TEXT,
    status TEXT DEFAULT 'scheduled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS outage_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    province TEXT,
    city TEXT,
    district TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS local_services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    service_type TEXT,
    province TEXT,
    city TEXT,
    is_active INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS warning_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    account_id INTEGER,
    warning_type TEXT NOT NULL,
    warning_level TEXT DEFAULT 'normal',
    message TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    real_name TEXT,
    role TEXT DEFAULT 'admin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS account_verification_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT,
    meter_number TEXT,
    verify_status TEXT NOT NULL,
    verify_code TEXT,
    verify_response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS binding_vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    voucher_no TEXT UNIQUE NOT NULL,
    verify_status TEXT DEFAULT 'verified',
    binding_status TEXT DEFAULT 'success',
    binding_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    address_confirmed INTEGER DEFAULT 1,
    binding_requirements TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (account_id) REFERENCES accounts(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS exchange_vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    record_id INTEGER NOT NULL,
    voucher_no TEXT UNIQUE NOT NULL,
    product_name TEXT,
    product_category TEXT,
    quantity INTEGER,
    points_used INTEGER,
    benefit_value REAL,
    benefit_code TEXT,
    expiry_date DATE,
    risk_flag INTEGER DEFAULT 0,
    risk_reason TEXT,
    resale_protection TEXT,
    trace_id TEXT,
    status TEXT DEFAULT 'delivered',
    delivered_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (record_id) REFERENCES exchange_records(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS payment_vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    payment_id INTEGER NOT NULL,
    voucher_no TEXT UNIQUE NOT NULL,
    amount REAL,
    payment_method TEXT,
    invoice_status TEXT DEFAULT 'not_issued',
    invoice_no TEXT,
    invoice_url TEXT,
    verification_code TEXT,
    arrival_status TEXT DEFAULT 'confirmed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (payment_id) REFERENCES payment_records(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS business_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_type TEXT NOT NULL,
    report_date DATE NOT NULL,
    province TEXT,
    city TEXT,
    data_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO admin_users (username, password, real_name, role) VALUES (?, ?, ?, ?)`,
    ['admin', adminPassword, '系统管理员', 'super_admin']);

  const userPassword = bcrypt.hashSync('123456', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password, phone, real_name, points, province, city, district, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['user1', userPassword, '13800138001', '张三', 5000, '北京市', '北京市', '朝阳区', '朝阳区建国路88号']);

  db.run(`INSERT OR IGNORE INTO users (username, password, phone, real_name, points, province, city, district, address) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ['user2', userPassword, '13800138002', '李四', 3200, '上海市', '上海市', '浦东新区', '浦东新区陆家嘴']);

  db.run(`INSERT OR IGNORE INTO accounts (user_id, account_number, account_name, address, meter_number, voltage_level, balance, arrears, daily_usage, monthly_usage, province, city, district, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [1, '0101012345678901', '张三', '北京市朝阳区建国路88号', 'M1234567890', '220V', 156.80, 0, 8.5, 215.5, '北京市', '北京市', '朝阳区', 1]);

  db.run(`INSERT OR IGNORE INTO accounts (user_id, account_number, account_name, address, meter_number, voltage_level, balance, arrears, daily_usage, monthly_usage, province, city, district, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [1, '0101012345678902', '张三(父母家)', '北京市海淀区中关村大街1号', 'M1234567891', '220V', 89.50, 35.20, 5.2, 156.8, '北京市', '北京市', '海淀区', 0]);

  db.run(`INSERT OR IGNORE INTO accounts (user_id, account_number, account_name, address, meter_number, voltage_level, balance, arrears, daily_usage, monthly_usage, province, city, district, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [2, '0201012345678901', '李四', '上海市浦东新区陆家嘴金融中心', 'M2234567890', '380V', 520.30, 0, 15.8, 456.2, '上海市', '上海市', '浦东新区', 1]);

  const products = [
    ['10元话费充值卡', '中国移动/联通/电信通用话费充值', 'phone_card', 1000, 100, 5, 1],
    ['30元话费充值卡', '中国移动/联通/电信通用话费充值', 'phone_card', 2800, 50, 3, 1],
    ['50元话费充值卡', '中国移动/联通/电信通用话费充值', 'phone_card', 4500, 30, 2, 1],
    ['腾讯视频会员月卡', '腾讯视频VIP会员月卡', 'membership', 2500, 80, 2, 1],
    ['爱奇艺会员月卡', '爱奇艺黄金VIP会员月卡', 'membership', 2500, 80, 2, 1],
    ['5元电费红包', '可直接抵扣电费使用', 'electricity', 500, 200, 10, 1],
    ['10元电费红包', '可直接抵扣电费使用', 'electricity', 950, 150, 8, 1],
    ['20元电费红包', '可直接抵扣电费使用', 'electricity', 1800, 100, 5, 1],
    ['京东E卡10元', '京东商城通用电子卡', 'shopping', 1200, 50, 2, 2],
    ['星巴克中杯券', '星巴克咖啡中杯饮品券', 'catering', 3000, 40, 1, 2]
  ];

  const productStmt = db.prepare(`INSERT OR IGNORE INTO products (name, description, category, points, stock, daily_limit, user_level_limit) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  products.forEach(p => productStmt.run(p));
  productStmt.finalize();

  const financialProducts = [
    ['电网宝-活期', '随存随取，灵活收益', 2.5, 100, null, null, 1],
    ['电网宝-30天', '30天定期理财产品', 3.2, 1000, 100000, 30, 2],
    ['电网宝-90天', '90天定期理财产品', 3.8, 5000, 500000, 90, 2],
    ['电网宝-180天', '180天定期理财产品', 4.2, 10000, 1000000, 180, 3],
    ['绿电基金', '新能源投资基金', 5.5, 1000, null, null, 3]
  ];

  const fpStmt = db.prepare(`INSERT OR IGNORE INTO financial_products (name, description, expected_yield, min_amount, max_amount, term_days, risk_level) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  financialProducts.forEach(fp => fpStmt.run(fp));
  fpStmt.finalize();

  const localServices = [
    ['煤改电补贴申领', '农村地区煤改电项目补贴申请', '🔥', 'subsidy', '北京市', '北京市', 1],
    ['光伏并网申请', '家庭光伏电站并网服务', '☀️', 'pv_application', '北京市', '北京市', 2],
    ['充电桩报装', '个人充电桩安装申请', '🔌', 'charging_pile', '北京市', '北京市', 3],
    ['能效诊断服务', '企业能效评估与诊断', '📊', 'energy_diagnosis', '上海市', '上海市', 1],
    ['电力扩容申请', '企业用电容量扩容服务', '⚡', 'capacity_expansion', '上海市', '上海市', 2]
  ];

  const lsStmt = db.prepare(`INSERT OR IGNORE INTO local_services (name, description, icon, service_type, province, city, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  localServices.forEach(ls => lsStmt.run(ls));
  lsStmt.finalize();

  const outagePlans = [
    ['北京市', '北京市', '朝阳区', '建国路沿线', '2024-06-10 09:00:00', '2024-06-10 17:00:00', '设备检修'],
    ['北京市', '北京市', '海淀区', '中关村区域', '2024-06-12 08:00:00', '2024-06-12 18:00:00', '线路升级'],
    ['上海市', '上海市', '浦东新区', '陆家嘴片区', '2024-06-15 10:00:00', '2024-06-15 16:00:00', '设备维护']
  ];

  const opStmt = db.prepare(`INSERT OR IGNORE INTO power_outage_plans (province, city, district, area, start_time, end_time, reason) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  outagePlans.forEach(op => opStmt.run(op));
  opStmt.finalize();

  const usageStmt = db.prepare(`INSERT OR IGNORE INTO usage_records (account_id, date, kwh, amount, peak_kwh, valley_kwh) VALUES (?, ?, ?, ?, ?, ?)`);
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const kwh1 = 5 + Math.random() * 10;
    const kwh2 = 3 + Math.random() * 6;
    usageStmt.run([1, dateStr, kwh1, kwh1 * 0.5, kwh1 * 0.6, kwh1 * 0.4]);
    usageStmt.run([2, dateStr, kwh2, kwh2 * 0.5, kwh2 * 0.6, kwh2 * 0.4]);
  }
  usageStmt.finalize();

  console.log('数据库初始化完成！');
  console.log('管理员账号: admin / admin123');
  console.log('测试用户: user1 / 123456');
  console.log('测试用户: user2 / 123456');
});

db.close();
