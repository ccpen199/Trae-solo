const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS warranty_products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      coverage_scope TEXT NOT NULL,
      duration_months INTEGER NOT NULL,
      price DECIMAL(10,2) NOT NULL,
      deductible DECIMAL(10,2) DEFAULT 0,
      max_service_count INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL UNIQUE,
      email TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      address TEXT,
      contact TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      contact_person TEXT,
      phone TEXT,
      rating DECIMAL(3,2) DEFAULT 5.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_no TEXT NOT NULL UNIQUE,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      store_id INTEGER,
      device_serial TEXT NOT NULL,
      device_model TEXT,
      device_brand TEXT,
      purchase_date DATE NOT NULL,
      purchase_proof TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TEXT DEFAULT 'active',
      channel TEXT,
      service_count_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES warranty_products(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (store_id) REFERENCES stores(id)
    );

    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_no TEXT NOT NULL UNIQUE,
      policy_id INTEGER NOT NULL,
      fault_type TEXT NOT NULL,
      fault_description TEXT,
      status TEXT DEFAULT 'pending',
      reject_reason TEXT,
      reject_clause TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (policy_id) REFERENCES policies(id)
    );

    CREATE TABLE IF NOT EXISTS service_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT NOT NULL UNIQUE,
      claim_id INTEGER NOT NULL,
      provider_id INTEGER,
      status TEXT DEFAULT 'assigned',
      inspection_report TEXT,
      repair_date DATE,
      user_confirmed INTEGER DEFAULT 0,
      settled INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (claim_id) REFERENCES claims(id),
      FOREIGN KEY (provider_id) REFERENCES service_providers(id)
    );

    CREATE TABLE IF NOT EXISTS repair_parts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      part_name TEXT NOT NULL,
      part_code TEXT,
      quantity INTEGER DEFAULT 1,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES service_orders(id)
    );

    CREATE TABLE IF NOT EXISTS repair_fees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      fee_type TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES service_orders(id)
    );

    CREATE INDEX IF NOT EXISTS idx_policies_serial ON policies(device_serial);
    CREATE INDEX IF NOT EXISTS idx_policies_user ON policies(user_id);
    CREATE INDEX IF NOT EXISTS idx_claims_policy ON claims(policy_id);
    CREATE INDEX IF NOT EXISTS idx_service_orders_claim ON service_orders(claim_id);
  `);

  const productCount = db.prepare('SELECT COUNT(*) as count FROM warranty_products').get().count;
  if (productCount === 0) {
    const insertProduct = db.prepare('INSERT INTO warranty_products (name, description, category, coverage_scope, duration_months, price, deductible, max_service_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    [
      { name: '家电核心部件延保2年', description: '覆盖核心部件故障维修', category: '大家电', coverage_scope: '压缩机、电机、电路板等核心部件', duration_months: 24, price: 299.00, deductible: 0, max_service_count: 3 },
      { name: '冰箱全保延保3年', description: '冰箱整机全范围保修', category: '冰箱', coverage_scope: '整机所有部件，含人工上门', duration_months: 36, price: 499.00, deductible: 50, max_service_count: 5 },
      { name: '空调延保1年', description: '空调基础延保服务', category: '空调', coverage_scope: '压缩机、电控系统', duration_months: 12, price: 199.00, deductible: 0, max_service_count: 2 },
      { name: '洗衣机全保2年', description: '洗衣机整机保修', category: '洗衣机', coverage_scope: '整机所有部件，含配件更换', duration_months: 24, price: 259.00, deductible: 30, max_service_count: 3 },
      { name: '电视屏碎保1年', description: '电视屏幕碎裂专项保障', category: '电视', coverage_scope: '屏幕碎裂更换服务', duration_months: 12, price: 399.00, deductible: 100, max_service_count: 1 }
    ].forEach(p => insertProduct.run(p.name, p.description, p.category, p.coverage_scope, p.duration_months, p.price, p.deductible, p.max_service_count));

    const insertStore = db.prepare('INSERT INTO stores (name, code, address, contact) VALUES (?, ?, ?, ?)');
    insertStore.run('北京朝阳店', 'BJCY001', '北京市朝阳区建国路88号', '张经理 13800138001');
    insertStore.run('上海浦东店', 'SHPD001', '上海市浦东新区陆家嘴环路1000号', '李经理 13800138002');
    insertStore.run('广州天河店', 'GZTH001', '广州市天河区珠江新城', '王经理 13800138003');

    const insertProvider = db.prepare('INSERT INTO service_providers (name, code, contact_person, phone, rating) VALUES (?, ?, ?, ?, ?)');
    insertProvider.run('快修家电服务', 'KXJD001', '陈师傅', '13900139001', 4.8);
    insertProvider.run('诚信维修中心', 'CXWX001', '刘师傅', '13900139002', 4.6);
    insertProvider.run('专业家电医院', 'ZYJD001', '赵师傅', '13900139003', 4.9);

    const insertUser = db.prepare('INSERT INTO users (name, phone, email, address) VALUES (?, ?, ?, ?)');
    insertUser.run('王建国', '13800001001', 'wang@example.com', '北京市朝阳区望京街道');
    insertUser.run('李秀英', '13800001002', 'li@example.com', '上海市浦东新区张江镇');
    insertUser.run('张伟', '13800001003', 'zhang@example.com', '广州市天河区天河北路');
    insertUser.run('陈丽华', '13800001004', 'chenlh@example.com', '北京市海淀区中关村');
    insertUser.run('刘明远', '13800001005', 'liumy@example.com', '上海市徐汇区漕河泾');
    insertUser.run('赵小芳', '13800001006', 'zhaoxf@example.com', '广州市越秀区北京路');
    insertUser.run('周大勇', '13800001007', 'zhoudy@example.com', '深圳市南山区科技园');
    insertUser.run('孙美玲', '13800001008', 'sunml@example.com', '北京市东城区王府井');

    const insertPolicy = db.prepare('INSERT INTO policies (policy_no, product_id, user_id, store_id, device_serial, device_model, device_brand, purchase_date, purchase_proof, start_date, end_date, status, channel, service_count_used, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertPolicy.run('W2601A0001', 1, 1, 1, 'SN-BJ-2025-0001', 'BCD-456WDVM', '海尔', '2025-06-15', '发票BJ20250615001', '2025-06-15', '2027-06-15', 'active', '门店', 1, '2025-06-15 10:30:00');
    insertPolicy.run('W2601A0002', 2, 2, 2, 'SN-SH-2025-0002', 'BCD-649WADV', '美的', '2025-07-20', '发票SH20250720002', '2025-07-20', '2028-07-20', 'active', '门店', 1, '2025-07-20 14:20:00');
    insertPolicy.run('W2601A0003', 3, 3, 3, 'SN-GZ-2025-0003', 'KFR-72LW', '格力', '2025-08-10', '发票GZ20250810003', '2025-08-10', '2026-08-10', 'active', '门店', 1, '2025-08-10 09:15:00');
    insertPolicy.run('W2601A0004', 4, 4, 1, 'SN-BJ-2025-0004', 'XQG100-BX', '小天鹅', '2025-09-05', '发票BJ20250905004', '2025-09-05', '2027-09-05', 'active', '门店', 1, '2025-09-05 16:45:00');
    insertPolicy.run('W2601A0005', 5, 5, 2, 'SN-SH-2025-0005', '65A8H', 'TCL', '2025-10-01', '发票SH20251001005', '2025-10-01', '2026-10-01', 'active', '在线', 0, '2025-10-01 11:00:00');
    insertPolicy.run('W2601A0006', 1, 6, 3, 'SN-GZ-2025-0006', 'BCD-510WDM', '容声', '2025-11-15', '发票GZ20251115006', '2025-11-15', '2027-11-15', 'active', '门店', 0, '2025-11-15 13:30:00');
    insertPolicy.run('W2601A0007', 2, 7, 1, 'SN-BJ-2025-0007', 'BCD-550WK', '西门子', '2025-12-20', '发票BJ20251220007', '2025-12-20', '2028-12-20', 'active', '在线', 0, '2025-12-20 10:00:00');
    insertPolicy.run('W2601A0008', 3, 8, 2, 'SN-SH-2026-0008', 'KFR-50GW', '大金', '2026-01-10', '发票SH20260110008', '2026-01-10', '2027-01-10', 'active', '门店', 0, '2026-01-10 15:20:00');
    insertPolicy.run('W2601A0009', 1, 1, 3, 'SN-GZ-2026-0009', 'BCD-320W', '松下', '2024-03-01', '发票GZ20240301009', '2024-03-01', '2026-03-01', 'expired', '门店', 1, '2024-03-01 09:00:00');
    insertPolicy.run('W2601A0010', 4, 2, 1, 'SN-BJ-2026-0010', 'XQG80-BX', '海尔', '2024-06-15', '发票BJ20240615010', '2024-06-15', '2026-06-15', 'expired', '门店', 0, '2024-06-15 11:30:00');

    const insertClaim = db.prepare('INSERT INTO claims (claim_no, policy_id, fault_type, fault_description, status, reject_reason, reject_clause, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    insertClaim.run('C2601B0001', 1, '无法开机', '冰箱通电后无任何反应，指示灯不亮', 'approved', null, null, '2025-12-01 08:30:00');
    insertClaim.run('C2601B0002', 2, '运行异常', '冰箱制冷效果差，冷藏室温度偏高至15度', 'approved', null, null, '2026-01-15 10:00:00');
    insertClaim.run('C2601B0003', 3, '异响/异味', '空调运行时外机发出金属摩擦异响', 'approved', null, null, '2026-02-20 14:30:00');
    insertClaim.run('C2601B0004', 4, '漏液/漏气', '洗衣机底部漏水，排水管接口处渗水严重', 'approved', null, null, '2026-03-10 09:45:00');
    insertClaim.run('C2601B0005', 5, '显示故障', '电视屏幕出现横纹闪烁，偶尔黑屏', 'rejected', '人为损坏', '条款第4.2条：因外力撞击导致屏幕损伤不在保障范围内，经检测屏幕有受外力冲击痕迹', '2026-03-20 16:00:00');
    insertClaim.run('C2601B0006', 9, '无法开机', '冰箱完全无法启动', 'rejected', '保单已过期', '条款第3.1条：保单有效期至2026-03-01，报修日期2026-04-01已超出保障期限', '2026-04-01 11:00:00');
    insertClaim.run('C2601B0007', 1, '按键失灵', '冰箱控制面板部分按键无响应', 'pending', null, null, '2026-05-15 10:20:00');

    const insertOrder = db.prepare('INSERT INTO service_orders (order_no, claim_id, provider_id, status, inspection_report, repair_date, user_confirmed, settled, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertOrder.run('O2601C0001', 1, 1, 'completed', '经检测为压缩机继电器故障，更换继电器后恢复正常运行', '2025-12-03', 1, 1, '2025-12-01 09:00:00');
    insertOrder.run('O2601C0002', 2, 2, 'completed', '冷藏室温控传感器失灵导致制冷不足，更换传感器并补充制冷剂', '2026-01-18', 1, 1, '2026-01-15 11:00:00');
    insertOrder.run('O2601C0003', 3, 3, 'completed', '外机风扇轴承磨损导致异响，更换风扇轴承组件', '2026-02-22', 1, 1, '2026-02-20 15:00:00');
    insertOrder.run('O2601C0004', 4, 1, 'completed', '排水管密封圈老化破裂，更换密封圈及排水软管', '2026-03-12', 1, 0, '2026-03-10 10:30:00');
    insertOrder.run('O2601C0007', 7, 2, 'assigned', null, null, 0, 0, '2026-05-15 11:00:00');

    const insertPart = db.prepare('INSERT INTO repair_parts (order_id, part_name, part_code, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)');
    insertPart.run(1, '压缩机继电器', 'RELAY-220V-01', 1, 85.00, 85.00);
    insertPart.run(2, '温控传感器', 'SENSOR-NTC-02', 1, 120.00, 120.00);
    insertPart.run(2, '制冷剂R600a', 'REFR-R600a-01', 1, 65.00, 65.00);
    insertPart.run(3, '风扇轴承组件', 'BEAR-FAN-03', 1, 150.00, 150.00);
    insertPart.run(4, '排水管密封圈', 'SEAL-DRAIN-04', 2, 15.00, 30.00);
    insertPart.run(4, '排水软管', 'HOSE-DRAIN-05', 1, 35.00, 35.00);

    const insertFee = db.prepare('INSERT INTO repair_fees (order_id, fee_type, amount, description) VALUES (?, ?, ?, ?)');
    insertFee.run(1, '上门费', 80.00, '北京市内上门服务费');
    insertFee.run(1, '人工费', 120.00, '继电器更换人工费');
    insertFee.run(2, '上门费', 80.00, '上海市内上门服务费');
    insertFee.run(2, '人工费', 180.00, '传感器更换及加氟人工费');
    insertFee.run(3, '上门费', 100.00, '广州市内上门服务费（高空作业加收）');
    insertFee.run(3, '人工费', 200.00, '外机维修高空作业人工费');
    insertFee.run(4, '上门费', 80.00, '北京市内上门服务费');
    insertFee.run(4, '人工费', 100.00, '密封圈及排水管更换人工费');
  }
}

initDatabase();

module.exports = db;
