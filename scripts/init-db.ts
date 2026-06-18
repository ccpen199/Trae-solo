import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = path.join(__dirname, '..', 'data', 'app.db');

const DB_SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    parent_id INTEGER,
    store_id INTEGER,
    region VARCHAR(100),
    level INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    level VARCHAR(20) DEFAULT 'potential',
    source VARCHAR(50),
    sales_id INTEGER NOT NULL,
    tags TEXT,
    total_purchases DECIMAL(12,2) DEFAULT 0,
    last_purchase_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50),
    price DECIMAL(12,2) NOT NULL,
    original_price DECIMAL(12,2),
    description TEXT,
    image_url VARCHAR(255),
    specs TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    batch_no VARCHAR(50) UNIQUE NOT NULL,
    production_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trace_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_no VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    operator VARCHAR(50) NOT NULL,
    location VARCHAR(200),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    tx_hash VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    batch_no VARCHAR(50) NOT NULL,
    warehouse_id INTEGER NOT NULL,
    warehouse_name VARCHAR(100),
    quantity INTEGER NOT NULL,
    available_quantity INTEGER NOT NULL,
    last_sync_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255) NOT NULL,
    lat DECIMAL(10,6),
    lng DECIMAL(10,6),
    owner_id INTEGER,
    phone VARCHAR(20),
    business_hours VARCHAR(100),
    services TEXT,
    rating DECIMAL(3,2) DEFAULT 5.0,
    status VARCHAR(20) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    customer_name VARCHAR(50),
    store_id INTEGER NOT NULL,
    store_name VARCHAR(100),
    sales_id INTEGER NOT NULL,
    service_type VARCHAR(50),
    appointment_time DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    remark TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER,
    customer_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    service_items TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    operator VARCHAR(50),
    notes TEXT,
    on_chain BOOLEAN DEFAULT 0,
    tx_hash VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_record_id INTEGER NOT NULL,
    customer_id INTEGER NOT NULL,
    customer_name VARCHAR(50),
    store_id INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    content TEXT NOT NULL,
    reply TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promotion_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    promotion_id INTEGER NOT NULL,
    condition_type VARCHAR(20) NOT NULL,
    condition_value DECIMAL(12,2) NOT NULL,
    discount_type VARCHAR(20) NOT NULL,
    discount_value DECIMAL(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    category VARCHAR(50),
    description TEXT,
    content_type VARCHAR(20) NOT NULL,
    content_url VARCHAR(255) NOT NULL,
    duration INTEGER,
    published_by VARCHAR(50),
    publish_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS exams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    course_id INTEGER,
    duration INTEGER NOT NULL,
    total_score INTEGER NOT NULL,
    passing_score INTEGER NOT NULL,
    question_count INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,
    question TEXT NOT NULL,
    options_json TEXT,
    answer_json TEXT NOT NULL,
    score INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS exam_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    exam_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    answers_json TEXT,
    score INTEGER,
    passed BOOLEAN,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type VARCHAR(20) NOT NULL,
    level VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    user_id INTEGER,
    user_name VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    handled_by INTEGER,
    handled_at DATETIME,
    handling_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS withdraw_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    user_name VARCHAR(50),
    amount DECIMAL(12,2) NOT NULL,
    bank_info TEXT NOT NULL,
    risk_level VARCHAR(20) DEFAULT 'normal',
    risk_reasons TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    audited_by INTEGER,
    audited_at DATETIME,
    audit_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS geofences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    region VARCHAR(100),
    coordinates_json TEXT NOT NULL,
    allowed_roles_json TEXT,
    is_active BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS share_links (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    original_url VARCHAR(255) NOT NULL,
    short_code VARCHAR(20) UNIQUE NOT NULL,
    material_type VARCHAR(50),
    view_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS speech_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id VARCHAR(50),
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER,
    content TEXT NOT NULL,
    sensitive_words TEXT,
    risk_score INTEGER DEFAULT 0,
    audit_status VARCHAR(20) DEFAULT 'pending',
    audit_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.exec(DB_SCHEMA);

const hashPassword = (password: string) => bcrypt.hashSync(password, 10);

const insertUsers = db.prepare(`
  INSERT OR IGNORE INTO users (username, real_name, phone, email, role, password_hash, parent_id, store_id, region, level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const usersData = [
  ['admin', '系统管理员', '13800000001', 'admin@example.com', 'admin', hashPassword('admin123'), null, null, '总部', 1],
  ['operator1', '运营专员李娜', '13800000002', 'lina@example.com', 'operator', hashPassword('123456'), null, null, '华北区', 1],
  ['operator2', '运营专员王强', '13800000003', 'wangqiang@example.com', 'operator', hashPassword('123456'), null, null, '华东区', 1],
  ['store1', '生活馆店主张丽', '13800000004', 'zhangli@example.com', 'store_owner', hashPassword('123456'), 1, null, '北京市', 1],
  ['store2', '生活馆店主刘芳', '13800000005', 'liufang@example.com', 'store_owner', hashPassword('123456'), 1, null, '上海市', 1],
  ['sales1', '直销员陈明', '13800000006', 'chenming@example.com', 'sales', hashPassword('123456'), 2, 1, '北京市朝阳区', 2],
  ['sales2', '直销员赵雪', '13800000007', 'zhaoxue@example.com', 'sales', hashPassword('123456'), 2, 1, '北京市海淀区', 2],
  ['sales3', '直销员孙磊', '13800000008', 'sunlei@example.com', 'sales', hashPassword('123456'), 3, 2, '上海市浦东新区', 3],
  ['sales4', '直销员周婷', '13800000009', 'zhouting@example.com', 'sales', hashPassword('123456'), 6, 1, '北京市西城区', 3],
  ['sales5', '直销员吴凯', '13800000010', 'wukai@example.com', 'sales', hashPassword('123456'), 6, 1, '北京市丰台区', 3],
];

const tx = db.transaction(() => {
  for (const user of usersData) {
    insertUsers.run(...user);
  }
});
tx();

const insertProducts = db.prepare(`
  INSERT OR IGNORE INTO products (name, code, category, price, original_price, description, image_url, specs) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const productsData = [
  ['国珍松花粉', 'GZ-SH-001', '保健食品', 398, 498, '精选马尾松花粉，增强免疫力', '/images/product1.jpg', JSON.stringify({规格: '330粒/瓶', 净含量: '33g', 食用方法: '每日3次，每次3粒'})],
  ['国珍牌松花伴侣片', 'GZ-BL-002', '保健食品', 298, 368, '保护肝脏，解酒排毒', '/images/product2.jpg', JSON.stringify({规格: '180片/瓶', 净含量: '54g', 食用方法: '每日3次，每次2粒'})],
  ['国珍牌竹康宁片', 'GZ-ZK-003', '保健食品', 498, 598, '调节血脂，保护心脑血管', '/images/product3.jpg', JSON.stringify({规格: '180片/瓶', 净含量: '90g', 食用方法: '每日2次，每次3粒'})],
  ['国珍牌冷榨亚麻籽油', 'GZ-YY-004', '健康食品', 198, 258, '低温冷榨，富含Omega-3', '/images/product4.jpg', JSON.stringify({规格: '250ml/瓶', 原料: '有机亚麻籽', 产地: '内蒙古'})],
  ['国珍牌破壁松花粉', 'GZ-PO-005', '保健食品', 598, 728, '低温破壁，吸收率更高', '/images/product5.jpg', JSON.stringify({规格: '30袋/盒', 净含量: '3g*30袋'})],
  ['香兰阁系列护肤品套装', 'XLG-HZ-006', '美容护肤', 898, 1098, '天然植物精华，深层滋养', '/images/product6.jpg', JSON.stringify({套装包含: '洁面+水+乳+霜', 适用肤质: '所有肤质'})],
];

const tx2 = db.transaction(() => {
  for (const product of productsData) {
    insertProducts.run(...product);
  }
});
tx2();

const insertBatches = db.prepare(`
  INSERT OR IGNORE INTO product_batches (product_id, batch_no, production_date, expiry_date, quantity) VALUES (?, ?, ?, ?, ?)
`);

const batchesData = [
  [1, 'B202401001', '2024-01-15', '2026-01-14', 5000],
  [1, 'B202402001', '2024-02-20', '2026-02-19', 8000],
  [2, 'B202401002', '2024-01-10', '2026-01-09', 3000],
  [3, 'B202403001', '2024-03-01', '2026-02-28', 4000],
  [4, 'B202402002', '2024-02-15', '2025-08-14', 6000],
  [5, 'B202403002', '2024-03-10', '2026-03-09', 2000],
  [6, 'B202401003', '2024-01-25', '2027-01-24', 1500],
];

const tx3 = db.transaction(() => {
  for (const batch of batchesData) {
    insertBatches.run(...batch);
  }
});
tx3();

const insertTrace = db.prepare(`
  INSERT OR IGNORE INTO trace_records (batch_no, action, operator, location, timestamp, tx_hash) VALUES (?, ?, ?, ?, ?, ?)
`);

const traceData = [
  ['B202401001', '生产入库', '张工', '山东烟台生产基地', '2024-01-15 10:30:00', '0x' + Math.random().toString(16).slice(2, 66)],
  ['B202401001', '发往华北仓', '李主管', '北京物流中心', '2024-01-16 14:20:00', '0x' + Math.random().toString(16).slice(2, 66)],
  ['B202401001', '出库分配', '王经理', '北京朝阳生活馆', '2024-01-18 09:15:00', '0x' + Math.random().toString(16).slice(2, 66)],
  ['B202402001', '生产入库', '张工', '山东烟台生产基地', '2024-02-20 11:00:00', '0x' + Math.random().toString(16).slice(2, 66)],
  ['B202401002', '生产入库', '刘工', '山东烟台生产基地', '2024-01-10 08:30:00', '0x' + Math.random().toString(16).slice(2, 66)],
];

const tx4 = db.transaction(() => {
  for (const record of traceData) {
    insertTrace.run(...record);
  }
});
tx4();

const insertInventory = db.prepare(`
  INSERT OR IGNORE INTO inventory (product_id, batch_no, warehouse_id, warehouse_name, quantity, available_quantity) VALUES (?, ?, ?, ?, ?, ?)
`);

const inventoryData = [
  [1, 'B202401001', 1, '北京中心仓库', 2000, 1850],
  [1, 'B202402001', 1, '北京中心仓库', 5000, 5000],
  [1, 'B202401001', 2, '上海华东仓库', 3000, 2900],
  [2, 'B202401002', 1, '北京中心仓库', 3000, 2800],
  [3, 'B202403001', 2, '上海华东仓库', 4000, 3800],
  [4, 'B202402002', 1, '北京中心仓库', 2000, 1950],
  [5, 'B202403002', 3, '广州华南仓库', 2000, 1900],
  [6, 'B202401003', 2, '上海华东仓库', 1500, 1450],
  [1, 'B202401001', 101, '北京朝阳生活馆', 500, 480],
  [2, 'B202401002', 101, '北京朝阳生活馆', 200, 190],
  [1, 'B202402001', 102, '上海浦东生活馆', 800, 780],
  [3, 'B202403001', 102, '上海浦东生活馆', 200, 195],
];

const tx5 = db.transaction(() => {
  for (const inv of inventoryData) {
    insertInventory.run(...inv);
  }
});
tx5();

const insertStores = db.prepare(`
  INSERT OR IGNORE INTO stores (name, address, lat, lng, owner_id, phone, business_hours, services, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const storesData = [
  ['国珍健康生活馆（北京朝阳店）', '北京市朝阳区建国路88号SOHO现代城A座1层', 39.9087, 116.4600, 4, '010-12345678', '09:00-21:00', JSON.stringify(['健康咨询', '产品体验', '理疗服务']), 4.8],
  ['国珍健康生活馆（上海浦东店）', '上海市浦东新区陆家嘴环路1000号恒生银行大厦1层', 31.2304, 121.5075, 5, '021-87654321', '10:00-22:00', JSON.stringify(['健康检测', '美容护理', '营养咨询']), 4.9],
  ['国珍健康生活馆（广州天河店）', '广州市天河区珠江新城华夏路10号富力中心1层', 23.1291, 113.2644, 4, '020-11112222', '09:30-20:30', JSON.stringify(['养生讲座', '产品体验', '健康管理']), 4.7],
];

const tx6 = db.transaction(() => {
  for (const store of storesData) {
    insertStores.run(...store);
  }
});
tx6();

const updateStoreOwner = db.prepare(`UPDATE users SET store_id = ? WHERE username = ?`);
updateStoreOwner.run(1, 'store1');
updateStoreOwner.run(2, 'store2');

const insertCustomers = db.prepare(`
  INSERT OR IGNORE INTO customers (name, phone, level, source, sales_id, tags, total_purchases, last_purchase_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const customersData = [
  ['王女士', '13900000001', 'vip', '朋友推荐', 6, JSON.stringify(['高端客户', '注重养生']), 12800, '2024-06-10 15:30:00'],
  ['李先生', '13900000002', 'regular', '扫码添加', 6, JSON.stringify(['老客户', '购买频繁']), 5600, '2024-06-08 10:20:00'],
  ['张女士', '13900000003', 'potential', '展会认识', 6, JSON.stringify(['潜在客户']), 0, null],
  ['赵先生', '13900000004', 'regular', '朋友推荐', 7, JSON.stringify(['商务人士', '购买护肝产品']), 8900, '2024-06-12 14:00:00'],
  ['刘女士', '13900000005', 'vip', '老客户转介绍', 7, JSON.stringify(['忠实客户', 'VIP会员']), 25600, '2024-06-05 11:30:00'],
  ['陈先生', '13900000006', 'potential', '线上广告', 8, JSON.stringify(['上海本地']), 0, null],
  ['孙女士', '13900000007', 'regular', '门店体验', 8, JSON.stringify(['护肤产品爱好者']), 6700, '2024-06-09 16:45:00'],
  ['周先生', '13900000008', 'potential', '社区活动', 9, JSON.stringify(['关注心脑血管']), 0, null],
  ['吴女士', '13900000009', 'regular', '朋友推荐', 9, JSON.stringify(['亚麻籽油忠实用户']), 4500, '2024-06-11 09:15:00'],
  ['郑先生', '13900000010', 'vip', '老客户', 10, JSON.stringify(['团队领袖', '高净值']), 38900, '2024-06-07 13:00:00'],
];

const tx7 = db.transaction(() => {
  for (const customer of customersData) {
    insertCustomers.run(...customer);
  }
});
tx7();

const insertAppointments = db.prepare(`
  INSERT OR IGNORE INTO appointments (customer_id, customer_name, store_id, store_name, sales_id, service_type, appointment_time, status, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const appointmentsData = [
  [1, '王女士', 1, '北京朝阳生活馆', 6, '健康检测', '2024-06-15 10:00:00', 'confirmed', '希望做全面体检'],
  [2, '李先生', 1, '北京朝阳生活馆', 6, '产品体验', '2024-06-16 14:30:00', 'pending', '想了解松花粉'],
  [4, '赵先生', 1, '北京朝阳生活馆', 7, '理疗服务', '2024-06-15 15:00:00', 'completed', ''],
  [6, '陈先生', 2, '上海浦东生活馆', 8, '美容护理', '2024-06-17 11:00:00', 'pending', '预约护肤套装体验'],
  [7, '孙女士', 2, '上海浦东生活馆', 8, '营养咨询', '2024-06-18 09:30:00', 'confirmed', ''],
];

const tx8 = db.transaction(() => {
  for (const appt of appointmentsData) {
    insertAppointments.run(...appt);
  }
});
tx8();

const insertServices = db.prepare(`
  INSERT OR IGNORE INTO service_records (appointment_id, customer_id, store_id, service_items, start_time, end_time, operator, notes, on_chain, tx_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const servicesData = [
  [3, 4, 1, JSON.stringify(['血压测量', '血糖检测', '身体成分分析']), '2024-06-15 15:00:00', '2024-06-15 16:30:00', '李医师', '客户血脂略高，建议清淡饮食', 1, '0x' + Math.random().toString(16).slice(2, 66)],
  [null, 1, 1, JSON.stringify(['松花粉产品体验', '养生咨询']), '2024-06-10 10:00:00', '2024-06-10 11:30:00', '王顾问', '客户对产品效果满意，已购买季度套餐', 1, '0x' + Math.random().toString(16).slice(2, 66)],
  [null, 5, 1, JSON.stringify(['VIP专属服务', '深度理疗']), '2024-06-05 14:00:00', '2024-06-05 16:00:00', '张理疗师', 'VIP客户服务记录已上链存证', 1, '0x' + Math.random().toString(16).slice(2, 66)],
  [null, 7, 2, JSON.stringify(['皮肤检测', '护肤体验']), '2024-06-09 16:45:00', '2024-06-09 18:00:00', '陈美容师', '客户购买了护肤套装', 1, '0x' + Math.random().toString(16).slice(2, 66)],
];

const tx9 = db.transaction(() => {
  for (const service of servicesData) {
    insertServices.run(...service);
  }
});
tx9();

const insertReviews = db.prepare(`
  INSERT OR IGNORE INTO reviews (service_record_id, customer_id, customer_name, store_id, rating, content, reply) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const reviewsData = [
  [1, 4, '赵先生', 1, 5, '服务非常专业，医师很耐心地解答了我的疑问，体验很好！', '感谢您的认可，我们会继续努力！'],
  [2, 1, '王女士', 1, 5, '产品效果很好，已经是老顾客了，服务一如既往地好。', '谢谢您的支持，期待您下次光临！'],
  [3, 5, '刘女士', 1, 4, '整体不错，就是等待时间有点长。', '非常抱歉让您久等了，我们会优化预约流程。'],
  [4, 7, '孙女士', 2, 5, '美容师手法很专业，护肤效果明显，推荐！', '感谢您的好评，欢迎常来！'],
];

const tx10 = db.transaction(() => {
  for (const review of reviewsData) {
    insertReviews.run(...review);
  }
});
tx10();

const insertPromotions = db.prepare(`
  INSERT OR IGNORE INTO promotions (name, type, start_time, end_time, status, created_by) VALUES (?, ?, ?, ?, ?, ?)
`);

const insertRules = db.prepare(`
  INSERT OR IGNORE INTO promotion_rules (promotion_id, condition_type, condition_value, discount_type, discount_value) VALUES (?, ?, ?, ?, ?)
`);

const promotionsData = [
  ['618年中大促', 'discount', '2024-06-18 00:00:00', '2024-06-20 23:59:59', 'active', 2],
  ['新会员专享', 'coupon', '2024-06-01 00:00:00', '2024-06-30 23:59:59', 'active', 2],
  ['松花粉买三送一', 'bundle', '2024-06-10 00:00:00', '2024-07-10 23:59:59', 'active', 2],
];

const tx11 = db.transaction(() => {
  for (let i = 0; i < promotionsData.length; i++) {
    const promo = promotionsData[i];
    const info = insertPromotions.run(...promo);
    const promoId = info.lastInsertRowid as number;
    
    if (i === 0) {
      insertRules.run(promoId, 'amount', 500, 'percent', 15);
      insertRules.run(promoId, 'amount', 1000, 'percent', 20);
    } else if (i === 1) {
      insertRules.run(promoId, 'amount', 200, 'fixed', 50);
    } else {
      insertRules.run(promoId, 'quantity', 3, 'points', 100);
    }
  }
});
tx11();

const insertCourses = db.prepare(`
  INSERT OR IGNORE INTO courses (title, category, description, content_type, content_url, duration, published_by, view_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const coursesData = [
  ['产品知识入门', '产品培训', '国珍产品系列产品知识详解', 'video', '/courses/product101.mp4', 45, '培训部', 1256],
  ['销售技巧培训', '销售培训', '如何有效沟通与促成销售', 'video', '/courses/sales101.mp4', 60, '培训部', 2341],
  ['合规展业规范', '合规培训', '直销法规与合规展业要求', 'document', '/courses/compliance.pdf', 30, '法务部', 3567],
  ['团队建设与管理', '领导力培训', '如何打造高绩效团队', 'video', '/courses/team101.mp4', 90, '培训部', 892],
  ['客户服务礼仪', '服务培训', '客户服务沟通与维护技巧', 'video', '/courses/service101.mp4', 40, '客服部', 1678],
  ['新品上市培训', '产品培训', '最新产品知识与销售政策', 'video', '/courses/newproduct.mp4', 50, '产品部', 4521],
];

const tx12 = db.transaction(() => {
  for (const course of coursesData) {
    insertCourses.run(...course);
  }
});
tx12();

const insertExams = db.prepare(`
  INSERT OR IGNORE INTO exams (title, course_id, duration, total_score, passing_score, question_count) VALUES (?, ?, ?, ?, ?, ?)
`);

const insertQuestions = db.prepare(`
  INSERT OR IGNORE INTO exam_questions (exam_id, type, question, options_json, answer_json, score) VALUES (?, ?, ?, ?, ?, ?)
`);

const examsData = [
  ['产品知识考核', 1, 30, 100, 60, 5],
  ['合规知识考核', 3, 20, 100, 80, 5],
];

const questionsData = [
  [1, 'single', '国珍松花粉的主要功效是什么？', JSON.stringify(['美容养颜', '增强免疫力', '改善睡眠']), JSON.stringify(1), 20],
  [1, 'single', '松花粉的食用方法，每日几次？', JSON.stringify(['每日1次', '每日2次', '每日3次']), JSON.stringify(2), 20],
  [1, 'judge', '国珍松花粉适合所有人群食用。', JSON.stringify([]), JSON.stringify(false), 20],
  [1, 'multiple', '以下哪些是国珍的产品系列？', JSON.stringify(['保健食品', '美容护肤', '健康食品', '家用电器']), JSON.stringify([0, 1, 2]), 20],
  [1, 'single', '国珍产品的原料产地主要来自哪里？', JSON.stringify(['云南', '山东烟台', '内蒙古']), JSON.stringify(1), 20],
  [2, 'single', '直销员在展业过程中，以下哪种行为是允许的？', JSON.stringify(['夸大产品功效', '客观介绍产品', '承诺高收益回报']), JSON.stringify(1), 20],
  [2, 'judge', '直销员可以跨区域展业不受限制。', JSON.stringify([]), JSON.stringify(false), 20],
  [2, 'single', '以下哪项属于敏感话术？', JSON.stringify(['这款产品有助于提升免疫力', '包治百病，无效退款', '建议按说明书食用效果更好']), JSON.stringify(1), 20],
  [2, 'multiple', '合规展业要求包括？', JSON.stringify(['持证上岗', '规范宣传', '如实介绍', '夸大宣传']), JSON.stringify([0, 1, 2]), 20],
  [2, 'judge', '提现金额超过5万元需要进行反洗钱核查。', JSON.stringify([]), JSON.stringify(true), 20],
];

const tx13 = db.transaction(() => {
  for (const exam of examsData) {
    const info = insertExams.run(...exam);
    const examId = info.lastInsertRowid as number;
    
    const examQuestions = questionsData.filter(q => q[0] === exam.id);
    for (const q of examQuestions) {
      insertQuestions.run(examId, q[1], q[2], q[3], q[4], q[5]);
    }
  }
});
tx13();

const insertAlerts = db.prepare(`
  INSERT OR IGNORE INTO risk_alerts (type, level, title, description, user_id, user_name, status) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const alertsData = [
  ['speech', 'high', '敏感话术告警', '检测到"包治百病"敏感词，用户陈明在与客户沟通中使用违规话术', 6, '陈明', 'pending'],
  ['speech', 'medium', '话术风险提醒', '检测到"根治"敏感词，建议人工复核', 7, '赵雪', 'pending'],
  ['withdraw', 'high', '大额提现预警', '提现金额150000元，超过风险等级：高风险，需人工审核', 10, '吴凯', 'pending'],
  ['geofence', 'medium', '越界展业告警', '检测到孙磊在非授权区域展业', 8, '孙磊', 'processing'],
  ['abnormal', 'low', '异常登录提醒', '检测到异地登录，建议核实', 9, '周婷', 'resolved'],
  ['withdraw', 'warning', '频繁提现提醒', '用户本周第三次提现，建议关注', 6, '陈明', 'pending'],
  ['speech', 'medium', '夸大宣传告警', '检测到"治愈率98%"数据，涉嫌夸大宣传', 8, '孙磊', 'pending'],
  ['abnormal', 'high', '账户异常交易', '检测到异常交易模式', 7, '赵雪', 'pending'],
];

const tx14 = db.transaction(() => {
  for (const alert of alertsData) {
    insertAlerts.run(...alert);
  }
});
tx14();

const insertWithdraw = db.prepare(`
  INSERT OR IGNORE INTO withdraw_requests (user_id, user_name, amount, bank_info, risk_level, risk_reasons, status) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const withdrawData = [
  [10, '吴凯', 150000.00, '工商银行 6222****8888', 'high_risk', JSON.stringify(['单笔超过10万', '本月累计超过5次']), 'pending'],
  [6, '陈明', 8000.00, '建设银行 6227****6666', 'normal', JSON.stringify([]), 'pending'],
  [7, '赵雪', 12000.00, '农业银行 6228****9999', 'warning', JSON.stringify(['本月第三次提现']), 'approved'],
  [8, '孙磊', 25000.00, '中国银行 6217****3333', 'normal', JSON.stringify([]), 'pending'],
];

const tx15 = db.transaction(() => {
  for (const w of withdrawData) {
    insertWithdraw.run(...w);
  }
});
tx15();

const insertGeofences = db.prepare(`
  INSERT OR IGNORE INTO geofences (name, region, coordinates_json, allowed_roles_json, is_active) VALUES (?, ?, ?, ?, ?)
`);

const geofenceData = [
  ['北京市朝阳区', '北京市', JSON.stringify([{lat: 39.9, lng: 116.4}, {lat: 39.95, lng: 116.4}, {lat: 39.95, lng: 116.5}, {lat: 39.9, lng: 116.5}]), JSON.stringify(['sales', 'store_owner']), 1],
  ['上海市浦东新区', '上海市', JSON.stringify([{lat: 31.2, lng: 121.5}, {lat: 31.25, lng: 121.5}, {lat: 31.25, lng: 121.55}, {lat: 31.2, lng: 121.55}]), JSON.stringify(['sales', 'store_owner']), 1],
  ['广州市天河区', '广东省', JSON.stringify([{lat: 23.1, lng: 113.3}, {lat: 23.15, lng: 113.3}, {lat: 23.15, lng: 113.35}, {lat: 23.1, lng: 113.35}]), JSON.stringify(['sales', 'store_owner']), 1],
];

const tx16 = db.transaction(() => {
  for (const fence of geofenceData) {
    insertGeofences.run(...fence);
  }
});
tx16();

const insertSpeech = db.prepare(`
  INSERT OR IGNORE INTO speech_logs (conversation_id, sender_id, receiver_id, content, sensitive_words, risk_score, audit_status) VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const speechData = [
  ['conv001', 6, 1, '这个产品可以包治百病，什么病都能治好', JSON.stringify(['包治百病']), 95, 'pending'],
  ['conv002', 6, 2, '按我的方法做，保证你月入10万不是梦', JSON.stringify(['保证月入10万']), 90, 'pending'],
  ['conv003', 7, 4, '这款产品效果很好，很多顾客反馈不错', JSON.stringify([]), 0, 'approved'],
  ['conv004', 8, 6, '我们的产品治愈率达到98%，效果非常好', JSON.stringify(['治愈率98%']), 85, 'pending'],
  ['conv005', 10, 10, '产品按照说明食用效果更好', JSON.stringify([]), 5, 'approved'],
];

const tx17 = db.transaction(() => {
  for (const speech of speechData) {
    insertSpeech.run(...speech);
  }
});
tx17();

const insertShareLinks = db.prepare(`
  INSERT OR IGNORE INTO share_links (user_id, original_url, short_code, material_type, view_count, conversion_count) VALUES (?, ?, ?, ?, ?, ?)
`);

const shareLinksData = [
  [6, 'https://example.com/product/1', 'SHRTE5', 'product', 256, 45],
  [6, 'https://example.com/product/2', 'SHRTK9', 'poster', 189, 23],
  [7, 'https://example.com/course/1', 'SHR3F2', 'article', 423, 67],
  [8, 'https://example.com/store/2', 'SHR8M4', 'image', 156, 28],
  [9, 'https://example.com/promo/1', 'SHR7P1', 'promotion', 312, 52],
  [10, 'https://example.com/product/5', 'SHR3Q8', 'product', 567, 89],
];

const tx18 = db.transaction(() => {
  for (const link of shareLinksData) {
    insertShareLinks.run(...link);
  }
});
tx18();

console.log('数据库初始化完成！');
console.log('默认账号：');
console.log('管理员: admin / admin123');
console.log('运营: operator1 / 123456');
console.log('店主: store1 / 123456');
console.log('直销员: sales1 / 123456');

db.close();
