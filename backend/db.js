const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
const DB_PATH = path.join(DB_DIR, 'app.sqlite');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDB() {
  const db = getDB();

  const tablesToCheck = [
    { name: 'credit_profiles', expectedCols: ['id', 'name', 'id_card', 'type', 'village', 'town', 'county', 'land_area', 'land_cert_no', 'subsidy_total', 'business_income', 'credit_score', 'credit_level', 'status', 'created_at', 'updated_at'] },
    { name: 'payment_orders', expectedCols: ['id', 'order_no', 'user_id_card', 'item_id', 'category', 'item_name', 'account_no', 'pay_type', 'payee_code', 'payee_name', 'payable_amount', 'amount', 'auto_debit', 'remark', 'status', 'paid_at', 'created_at'] },
    { name: 'loan_applications', expectedCols: ['id', 'product_id', 'user_id_card', 'user_name', 'apply_amount', 'apply_periods', 'collateral_type', 'collateral_desc', 'status', 'approved_amount', 'review_remark', 'credit_check_result', 'pboc_report_id', 'pboc_credit_score', 'pboc_overdue_count', 'moa_land_area', 'moa_land_cert_no', 'moa_subsidy_total', 'gov_business_license', 'gov_tax_record', 'model_score', 'model_version', 'model_result', 'model_details', 'auto_decision', 'reviewer', 'created_at', 'updated_at'] },
    { name: 'credit_flows', expectedCols: ['id', 'profile_id', 'flow_type', 'amount', 'description', 'flow_date', 'created_at'] },
    { name: 'payment_items', expectedCols: ['id', 'category', 'name', 'payee_code', 'status', 'created_at'] },
    { name: 'merchants', expectedCols: ['id', 'name', 'contact', 'phone', 'address', 'category', 'license_no', 'status', 'audit_remark', 'created_at', 'updated_at'] },
    { name: 'coupons', expectedCols: ['id', 'merchant_id', 'title', 'discount_type', 'discount_value', 'min_amount', 'total_count', 'used_count', 'status', 'expire_at', 'created_at'] },
    { name: 'installment_applications', expectedCols: ['id', 'user_id_card', 'merchant_id', 'amount', 'periods', 'status', 'approved_at', 'created_at'] },
    { name: 'finance_products', expectedCols: ['id', 'code', 'name', 'product_type', 'max_amount', 'annual_rate', 'max_periods', 'risk_rules', 'status', 'created_at'] },
    { name: 'livestock_mortgages', expectedCols: ['id', 'loan_id', 'livestock_type', 'quantity', 'unit_value', 'total_value', 'ear_tag', 'registration_no', 'status', 'registered_at'] },
    { name: 'coordinator_tasks', expectedCols: ['id', 'coordinator_name', 'village', 'task_type', 'description', 'status', 'offline_flag', 'synced_at', 'created_at', 'updated_at'] },
    { name: 'system_logs', expectedCols: ['id', 'module', 'action', 'operator', 'detail', 'created_at'] },
    { name: 'coupon_verifications', expectedCols: ['id', 'coupon_id', 'user_id_card', 'verify_code', 'status', 'verified_at'] },
  ];

  let needsRecreate = false;
  const existingTables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all().map(r => r.name);

  for (const t of tablesToCheck) {
    if (existingTables.includes(t.name)) {
      const cols = db.prepare(`PRAGMA table_info(${t.name})`).all().map(c => c.name);
      const missing = t.expectedCols.filter(c => !cols.includes(c));
      if (missing.length > 0) {
        console.log(`Table ${t.name} missing cols: ${missing.join(', ')}, will recreate`);
        needsRecreate = true;
        break;
      }
    }
  }

  if (needsRecreate) {
    console.log('Recreating database schema...');
    db.pragma('foreign_keys = OFF');
    for (const t of tablesToCheck) {
      if (existingTables.includes(t.name)) {
        db.exec(`ALTER TABLE ${t.name} RENAME TO ${t.name}_old`);
      }
    }
    db.pragma('foreign_keys = ON');
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS credit_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      id_card TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL DEFAULT 'farmer',
      village TEXT,
      town TEXT,
      county TEXT,
      land_area REAL DEFAULT 0,
      land_cert_no TEXT,
      subsidy_total REAL DEFAULT 0,
      business_income REAL DEFAULT 0,
      credit_score INTEGER DEFAULT 0,
      credit_level TEXT DEFAULT 'C',
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS credit_flows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      flow_type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      flow_date TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (profile_id) REFERENCES credit_profiles(id)
    );

    CREATE TABLE IF NOT EXISTS payment_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      payee_code TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS payment_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      user_id_card TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      category TEXT,
      item_name TEXT,
      account_no TEXT,
      pay_type TEXT DEFAULT 'normal',
      payee_code TEXT,
      payee_name TEXT,
      payable_amount REAL DEFAULT 0,
      amount REAL NOT NULL,
      auto_debit INTEGER DEFAULT 0,
      remark TEXT,
      status TEXT DEFAULT 'pending',
      paid_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (item_id) REFERENCES payment_items(id)
    );

    CREATE TABLE IF NOT EXISTS merchants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact TEXT,
      phone TEXT,
      address TEXT,
      category TEXT,
      license_no TEXT,
      status TEXT DEFAULT 'pending',
      audit_remark TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      merchant_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      discount_type TEXT NOT NULL,
      discount_value REAL NOT NULL,
      min_amount REAL DEFAULT 0,
      total_count INTEGER DEFAULT 0,
      used_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      expire_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS coupon_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL,
      user_id_card TEXT,
      verify_code TEXT,
      status TEXT DEFAULT 'verified',
      verified_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    );

    CREATE TABLE IF NOT EXISTS installment_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id_card TEXT NOT NULL,
      merchant_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      periods INTEGER DEFAULT 12,
      status TEXT DEFAULT 'pending',
      approved_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (merchant_id) REFERENCES merchants(id)
    );

    CREATE TABLE IF NOT EXISTS finance_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      product_type TEXT NOT NULL,
      max_amount REAL DEFAULT 0,
      annual_rate REAL DEFAULT 0,
      max_periods INTEGER DEFAULT 12,
      risk_rules TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS loan_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id_card TEXT NOT NULL,
      user_name TEXT NOT NULL,
      apply_amount REAL NOT NULL,
      apply_periods INTEGER DEFAULT 12,
      collateral_type TEXT,
      collateral_desc TEXT,
      status TEXT DEFAULT 'pending',
      approved_amount REAL,
      review_remark TEXT,
      credit_check_result TEXT,
      pboc_report_id TEXT,
      pboc_credit_score INTEGER,
      pboc_overdue_count INTEGER DEFAULT 0,
      moa_land_area REAL,
      moa_land_cert_no TEXT,
      moa_subsidy_total REAL,
      gov_business_license TEXT,
      gov_tax_record TEXT,
      model_score INTEGER,
      model_version TEXT,
      model_result TEXT,
      model_details TEXT,
      auto_decision TEXT,
      reviewer TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (product_id) REFERENCES finance_products(id)
    );

    CREATE TABLE IF NOT EXISTS livestock_mortgages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      livestock_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_value REAL DEFAULT 0,
      total_value REAL DEFAULT 0,
      ear_tag TEXT,
      registration_no TEXT,
      status TEXT DEFAULT 'registered',
      registered_at TEXT DEFAULT (datetime('now','localtime')),
      FOREIGN KEY (loan_id) REFERENCES loan_applications(id)
    );

    CREATE TABLE IF NOT EXISTS coordinator_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coordinator_name TEXT NOT NULL,
      village TEXT,
      task_type TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      offline_flag INTEGER DEFAULT 0,
      synced_at TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      operator TEXT,
      detail TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
  `);

  seedData(db);
}

function seedData(db) {
  const profileCount = db.prepare('SELECT COUNT(*) as cnt FROM credit_profiles').get().cnt;
  const financeCount = db.prepare('SELECT COUNT(*) as cnt FROM finance_products').get().cnt;
  const paymentOrderCount = db.prepare('SELECT COUNT(*) as cnt FROM payment_orders').get().cnt;
  const loanCount = db.prepare('SELECT COUNT(*) as cnt FROM loan_applications').get().cnt;
  const merchantCount = db.prepare('SELECT COUNT(*) as cnt FROM merchants').get().cnt;
  const couponCount = db.prepare('SELECT COUNT(*) as cnt FROM coupons').get().cnt;
  if (profileCount > 0 && financeCount > 0 && paymentOrderCount > 0 && loanCount > 0 && merchantCount > 0 && couponCount > 0) return;

  const seedTables = [
    'system_logs',
    'coordinator_tasks',
    'livestock_mortgages',
    'loan_applications',
    'finance_products',
    'installment_applications',
    'coupon_verifications',
    'coupons',
    'merchants',
    'payment_orders',
    'payment_items',
    'credit_flows',
    'credit_profiles',
  ];

  if (profileCount > 0 || financeCount > 0 || paymentOrderCount > 0 || loanCount > 0 || merchantCount > 0 || couponCount > 0) {
    db.pragma('foreign_keys = OFF');
    seedTables.forEach((table) => db.prepare(`DELETE FROM ${table}`).run());
    db.prepare(`DELETE FROM sqlite_sequence WHERE name IN (${seedTables.map(() => '?').join(',')})`).run(...seedTables);
    db.pragma('foreign_keys = ON');
  }

  const profiles = [
    { name: '张富根', id_card: '140102196501012345', type: 'farmer', village: '东阳村', town: '清徐镇', county: '清徐县', land_area: 15.5, land_cert_no: 'QX-LD-2023-001', subsidy_total: 23250, business_income: 68000, credit_score: 720, credit_level: 'A' },
    { name: '李秀英', id_card: '140102196803053467', type: 'farmer', village: '南峪村', town: '孟封镇', county: '清徐县', land_area: 8.2, land_cert_no: 'QX-LD-2023-012', subsidy_total: 12300, business_income: 42000, credit_score: 650, credit_level: 'B' },
    { name: '王建国', id_card: '140102197205154589', type: 'merchant', village: '西关街', town: '清徐镇', county: '清徐县', land_area: 0, land_cert_no: '', subsidy_total: 0, business_income: 185000, credit_score: 780, credit_level: 'A' },
    { name: '赵梅花', id_card: '140102197508216789', type: 'farmer', village: '北营村', town: '徐沟镇', county: '清徐县', land_area: 22.0, land_cert_no: 'QX-LD-2023-025', subsidy_total: 33000, business_income: 95000, credit_score: 810, credit_level: 'AA' },
    { name: '陈大庆', id_card: '140102198006037890', type: 'merchant', village: '东湖社区', town: '清徐镇', county: '清徐县', land_area: 0, land_cert_no: '', subsidy_total: 0, business_income: 320000, credit_score: 830, credit_level: 'AA' },
    { name: '刘守义', id_card: '140102195511045612', type: 'farmer', village: '柳杜村', town: '柳杜乡', county: '清徐县', land_area: 5.0, land_cert_no: 'QX-LD-2023-038', subsidy_total: 7500, business_income: 28000, credit_score: 560, credit_level: 'C' },
    { name: '杨春花', id_card: '140102198312092345', type: 'farmer', village: '王答村', town: '王答乡', county: '清徐县', land_area: 12.0, land_cert_no: 'QX-LD-2023-042', subsidy_total: 18000, business_income: 55000, credit_score: 690, credit_level: 'B' },
    { name: '马国强', id_card: '140102197609183456', type: 'merchant', village: '马峪乡', town: '马峪乡', county: '清徐县', land_area: 3.5, land_cert_no: 'QX-LD-2023-055', subsidy_total: 5250, business_income: 150000, credit_score: 710, credit_level: 'A' },
  ];

  const insertProfile = db.prepare(`INSERT INTO credit_profiles (name, id_card, type, village, town, county, land_area, land_cert_no, subsidy_total, business_income, credit_score, credit_level) VALUES (@name, @id_card, @type, @village, @town, @county, @land_area, @land_cert_no, @subsidy_total, @business_income, @credit_score, @credit_level)`);
  const insertFlow = db.prepare(`INSERT INTO credit_flows (profile_id, flow_type, amount, description, flow_date) VALUES (@profile_id, @flow_type, @amount, @description, @flow_date)`);

  const tx = db.transaction(() => {
    for (const p of profiles) {
      const r = insertProfile.run(p);
      const pid = r.lastInsertRowid;
      const flows = [
        { profile_id: pid, flow_type: 'subsidy', amount: p.subsidy_total / 3, description: '耕地地力保护补贴', flow_date: '2025-06-15' },
        { profile_id: pid, flow_type: 'subsidy', amount: p.subsidy_total / 3, description: '农机购置补贴', flow_date: '2025-09-20' },
        { profile_id: pid, flow_type: 'subsidy', amount: p.subsidy_total / 3, description: '种粮大户补贴', flow_date: '2025-12-01' },
        { profile_id: pid, flow_type: 'income', amount: p.business_income * 0.6, description: '农产品销售收入', flow_date: '2025-10-15' },
        { profile_id: pid, flow_type: 'income', amount: p.business_income * 0.4, description: '经营收入', flow_date: '2026-01-20' },
      ];
      for (const f of flows) insertFlow.run(f);
    }
  });
  tx();

  const paymentItems = [
    { category: 'water', name: '自来水费', payee_code: 'SX-WATER-001' },
    { category: 'electricity', name: '居民电费', payee_code: 'SX-ELEC-001' },
    { category: 'gas', name: '天然气费', payee_code: 'SX-GAS-001' },
    { category: 'heating', name: '供暖费', payee_code: 'SX-HEAT-001' },
    { category: 'tuition', name: '学费', payee_code: 'SX-EDU-001' },
    { category: 'party_fee', name: '党费', payee_code: 'SX-PARTY-001' },
    { category: 'social_security', name: '城乡居民社保', payee_code: 'SX-SS-001' },
    { category: 'social_security', name: '新农合医保', payee_code: 'SX-NRC-001' },
  ];
  const insertItem = db.prepare(`INSERT INTO payment_items (category, name, payee_code) VALUES (@category, @name, @payee_code)`);
  const paymentItemIds = {};
  for (const item of paymentItems) {
    const r = insertItem.run(item);
    paymentItemIds[item.name] = Number(r.lastInsertRowid);
  }

  const paymentOrders = [
    { order_no: 'PAY-2026-00001', user_id_card: '140102196501012345', item_name: '自来水费', amount: 45.6, status: 'paid', paid_at: '2026-05-10 09:30:00' },
    { order_no: 'PAY-2026-00002', user_id_card: '140102196501012345', item_name: '居民电费', amount: 128.9, status: 'paid', paid_at: '2026-05-12 14:20:00' },
    { order_no: 'PAY-2026-00003', user_id_card: '140102197508216789', item_name: '城乡居民社保', amount: 1200, status: 'paid', paid_at: '2026-05-15 10:00:00' },
    { order_no: 'PAY-2026-00004', user_id_card: '140102197205154589', item_name: '学费', amount: 4500, status: 'pending' },
    { order_no: 'PAY-2026-00005', user_id_card: '140102198312092345', item_name: '新农合医保', amount: 380, status: 'paid', paid_at: '2026-05-20 08:15:00' },
  ];
  const insertOrder = db.prepare(`INSERT INTO payment_orders (order_no, user_id_card, item_id, amount, status, paid_at) VALUES (@order_no, @user_id_card, @item_id, @amount, @status, @paid_at)`);
  for (const o of paymentOrders) {
    insertOrder.run({ paid_at: null, ...o, item_id: paymentItemIds[o.item_name] });
  }

  const merchants = [
    { name: '清徐农资超市', contact: '王老板', phone: '13934567890', address: '清徐镇东湖路12号', category: '农资', license_no: 'SX-ML-2023-001', status: 'approved' },
    { name: '老陈醋坊', contact: '陈掌柜', phone: '13834567891', address: '清徐镇醋都街28号', category: '食品', license_no: 'SX-ML-2023-002', status: 'approved' },
    { name: '金穗农机制销', contact: '刘经理', phone: '13734567892', address: '徐沟镇工业路5号', category: '农机', license_no: 'SX-ML-2023-003', status: 'approved' },
    { name: '绿源果蔬合作社', contact: '杨社长', phone: '13634567893', address: '王答乡果园路1号', category: '果蔬', license_no: 'SX-ML-2023-004', status: 'pending' },
    { name: '丰收农贸商城', contact: '马总', phone: '13534567894', address: '马峪乡商贸街15号', category: '综合', license_no: 'SX-ML-2023-005', status: 'approved' },
  ];
  const insertMerchant = db.prepare(`INSERT INTO merchants (name, contact, phone, address, category, license_no, status) VALUES (@name, @contact, @phone, @address, @category, @license_no, @status)`);
  const merchantIds = [];
  for (const m of merchants) {
    const r = insertMerchant.run(m);
    merchantIds.push(Number(r.lastInsertRowid));
  }

  const coupons = [
    { merchant_id: merchantIds[0], title: '农资满200减30', discount_type: 'fixed', discount_value: 30, min_amount: 200, total_count: 500, used_count: 234, expire_at: '2026-12-31' },
    { merchant_id: merchantIds[1], title: '陈醋9折优惠', discount_type: 'percent', discount_value: 10, min_amount: 50, total_count: 1000, used_count: 567, expire_at: '2026-12-31' },
    { merchant_id: merchantIds[2], title: '农机分期免息', discount_type: 'percent', discount_value: 0, min_amount: 10000, total_count: 100, used_count: 23, expire_at: '2027-06-30' },
    { merchant_id: merchantIds[4], title: '新店开业满100减15', discount_type: 'fixed', discount_value: 15, min_amount: 100, total_count: 300, used_count: 89, expire_at: '2026-09-30' },
  ];
  const insertCoupon = db.prepare(`INSERT INTO coupons (merchant_id, title, discount_type, discount_value, min_amount, total_count, used_count, expire_at) VALUES (@merchant_id, @title, @discount_type, @discount_value, @min_amount, @total_count, @used_count, @expire_at)`);
  for (const c of coupons) insertCoupon.run(c);

  const installments = [
    { user_id_card: '140102196501012345', merchant_id: merchantIds[2], amount: 35000, periods: 12, status: 'approved', approved_at: '2026-03-15' },
    { user_id_card: '140102197508216789', merchant_id: merchantIds[0], amount: 8000, periods: 6, status: 'pending' },
    { user_id_card: '140102198312092345', merchant_id: merchantIds[1], amount: 2500, periods: 3, status: 'approved', approved_at: '2026-04-20' },
  ];
  const insertInstallment = db.prepare(`INSERT INTO installment_applications (user_id_card, merchant_id, amount, periods, status, approved_at) VALUES (@user_id_card, @merchant_id, @amount, @periods, @status, @approved_at)`);
  for (const i of installments) insertInstallment.run({ approved_at: null, ...i });

  const financeProducts = [
    { code: 'HN-001', name: '惠农贷', product_type: 'huinong', max_amount: 200000, annual_rate: 3.85, max_periods: 36, risk_rules: '{"min_credit_score":600,"max_npl_months":3,"land_area_min":2}' },
    { code: 'NJ-001', name: '农机购置贷', product_type: 'machine', max_amount: 500000, annual_rate: 4.35, max_periods: 48, risk_rules: '{"min_credit_score":650,"collateral_required":true,"machine_invoice_required":true}' },
    { code: 'HT-001', name: '活体抵押贷', product_type: 'livestock', max_amount: 1000000, annual_rate: 4.75, max_periods: 60, risk_rules: '{"min_credit_score":700,"livestock_inspection_required":true,"ear_tag_required":true}' },
    { code: 'XW-001', name: '小微商户贷', product_type: 'merchant', max_amount: 300000, annual_rate: 5.20, max_periods: 24, risk_rules: '{"min_credit_score":620,"business_license_required":true,"min_business_income":50000}' },
  ];
  const insertProduct = db.prepare(`INSERT INTO finance_products (code, name, product_type, max_amount, annual_rate, max_periods, risk_rules) VALUES (@code, @name, @product_type, @max_amount, @annual_rate, @max_periods, @risk_rules)`);
  const productIds = [];
  for (const p of financeProducts) {
    const r = insertProduct.run(p);
    productIds.push(Number(r.lastInsertRowid));
  }

  const loanApps = [
    { product_id: productIds[0], user_id_card: '140102196501012345', user_name: '张富根', apply_amount: 80000, apply_periods: 24, collateral_type: 'land', collateral_desc: '15.5亩耕地经营权', status: 'approved', approved_amount: 80000, review_remark: '信用良好，土地确权清晰',
      credit_check_result: 'pass', pboc_report_id: 'PBOC-2026-001234', pboc_credit_score: 825, pboc_overdue_count: 0,
      moa_land_area: 15.5, moa_land_cert_no: 'SX-NY-2020-00123', moa_subsidy_total: 18600,
      gov_business_license: '-', gov_tax_record: '-',
      model_score: 86, model_version: 'HN-v2.1', model_result: 'approve', model_details: '信用评分825+土地15.5亩+补贴1.86万=额度8.6万',
      auto_decision: 'approve', reviewer: '李信贷' },
    { product_id: productIds[1], user_id_card: '140102197508216789', user_name: '赵梅花', apply_amount: 120000, apply_periods: 36, collateral_type: 'machine', collateral_desc: '联合收割机1台', status: 'approved', approved_amount: 100000, review_remark: '农机发票齐全',
      credit_check_result: 'pass', pboc_report_id: 'PBOC-2026-001235', pboc_credit_score: 780, pboc_overdue_count: 1,
      moa_land_area: 20.0, moa_land_cert_no: 'SX-NY-2020-00456', moa_subsidy_total: 24000,
      gov_business_license: '-', gov_tax_record: '-',
      model_score: 78, model_version: 'NJ-v1.5', model_result: 'approve', model_details: '信用评分780+农机评估15万=额度10万',
      auto_decision: 'approve', reviewer: '王审核' },
    { product_id: productIds[2], user_id_card: '140102197508216789', user_name: '赵梅花', apply_amount: 300000, apply_periods: 48, collateral_type: 'livestock', collateral_desc: '肉牛50头', status: 'pending',
      credit_check_result: 'pending', pboc_report_id: 'PBOC-2026-001236', pboc_credit_score: 780, pboc_overdue_count: 1,
      moa_land_area: 20.0, moa_land_cert_no: 'SX-NY-2020-00456', moa_subsidy_total: 24000,
      gov_business_license: '-', gov_tax_record: '-',
      model_score: 72, model_version: 'HY-v1.2', model_result: 'pending', model_details: '活体评估60万，需人工复核抵押登记',
      auto_decision: 'review', reviewer: null },
    { product_id: productIds[3], user_id_card: '140102197205154589', user_name: '王建国', apply_amount: 150000, apply_periods: 12, collateral_type: 'business', collateral_desc: '商铺经营权', status: 'approved', approved_amount: 150000, review_remark: '经营稳定',
      credit_check_result: 'pass', pboc_report_id: 'PBOC-2026-001237', pboc_credit_score: 760, pboc_overdue_count: 0,
      moa_land_area: 0, moa_land_cert_no: '-', moa_subsidy_total: 0,
      gov_business_license: 'SX-GS-2023-98765', gov_tax_record: '近12个月纳税3.2万',
      model_score: 81, model_version: 'XF-v2.0', model_result: 'approve', model_details: '经营流水年50万+纳税3.2万=额度15万',
      auto_decision: 'approve', reviewer: '张审批' },
    { product_id: productIds[0], user_id_card: '140102195511045612', user_name: '刘守义', apply_amount: 30000, apply_periods: 12, collateral_type: 'land', collateral_desc: '5亩耕地经营权', status: 'rejected', approved_amount: 0, review_remark: '信用评分低于阈值，存在逾期记录',
      credit_check_result: 'reject', pboc_report_id: 'PBOC-2026-001238', pboc_credit_score: 560, pboc_overdue_count: 3,
      moa_land_area: 5.0, moa_land_cert_no: 'SX-NY-2020-00789', moa_subsidy_total: 6000,
      gov_business_license: '-', gov_tax_record: '-',
      model_score: 42, model_version: 'HN-v2.1', model_result: 'reject', model_details: '信用评分560低于阈值600，存在3次逾期记录',
      auto_decision: 'reject', reviewer: '李信贷' },
  ];
  const insertLoan = db.prepare(`INSERT INTO loan_applications (product_id, user_id_card, user_name, apply_amount, apply_periods, collateral_type, collateral_desc, status, approved_amount, review_remark, credit_check_result, pboc_report_id, pboc_credit_score, pboc_overdue_count, moa_land_area, moa_land_cert_no, moa_subsidy_total, gov_business_license, gov_tax_record, model_score, model_version, model_result, model_details, auto_decision, reviewer) VALUES (@product_id, @user_id_card, @user_name, @apply_amount, @apply_periods, @collateral_type, @collateral_desc, @status, @approved_amount, @review_remark, @credit_check_result, @pboc_report_id, @pboc_credit_score, @pboc_overdue_count, @moa_land_area, @moa_land_cert_no, @moa_subsidy_total, @gov_business_license, @gov_tax_record, @model_score, @model_version, @model_result, @model_details, @auto_decision, @reviewer)`);
  const loanIds = [];
  for (const l of loanApps) {
    const r = insertLoan.run({ approved_amount: null, review_remark: null, ...l });
    loanIds.push(Number(r.lastInsertRowid));
  }

  const livestock = [
    { loan_id: loanIds[2], livestock_type: '肉牛', quantity: 50, unit_value: 12000, total_value: 600000, ear_tag: 'ET-2026-001~050', registration_no: 'LH-REG-2026-001', status: 'registered' },
  ];
  const insertLivestock = db.prepare(`INSERT INTO livestock_mortgages (loan_id, livestock_type, quantity, unit_value, total_value, ear_tag, registration_no, status) VALUES (@loan_id, @livestock_type, @quantity, @unit_value, @total_value, @ear_tag, @registration_no, @status)`);
  for (const l of livestock) insertLivestock.run(l);

  const tasks = [
    { coordinator_name: '孙卫东', village: '东阳村', task_type: 'collect', description: '采集张富根农户信息更新', status: 'completed', offline_flag: 1, synced_at: '2026-05-18 16:00:00' },
    { coordinator_name: '孙卫东', village: '东阳村', task_type: 'verify', description: '核实李秀英土地确权信息', status: 'in_progress', offline_flag: 0 },
    { coordinator_name: '周小梅', village: '南峪村', task_type: 'collect', description: '采集南峪村5户农户信息', status: 'pending', offline_flag: 1 },
    { coordinator_name: '周小梅', village: '南峪村', task_type: 'loan_assist', description: '协助赵梅花办理活体抵押贷', status: 'in_progress', offline_flag: 0 },
    { coordinator_name: '吴德才', village: '北营村', task_type: 'verify', description: '核实北营村社保代缴名单', status: 'completed', offline_flag: 0, synced_at: '2026-05-20 10:30:00' },
  ];
  const insertTask = db.prepare(`INSERT INTO coordinator_tasks (coordinator_name, village, task_type, description, status, offline_flag, synced_at) VALUES (@coordinator_name, @village, @task_type, @description, @status, @offline_flag, @synced_at)`);
  for (const t of tasks) insertTask.run({ synced_at: null, ...t });

  const logs = [
    { module: 'credit', action: 'create_profile', operator: 'system', detail: '创建张富根信用画像' },
    { module: 'payment', action: 'pay', operator: '张富根', detail: '缴纳自来水费45.6元' },
    { module: 'business', action: 'audit_merchant', operator: 'admin', detail: '审核通过清徐农资超市入驻' },
    { module: 'finance', action: 'approve_loan', operator: '信贷员李某', detail: '批准张富根惠农贷8万元' },
  ];
  const insertLog = db.prepare(`INSERT INTO system_logs (module, action, operator, detail) VALUES (@module, @action, @operator, @detail)`);
  for (const l of logs) insertLog.run(l);
}

module.exports = { getDB, initDB };
