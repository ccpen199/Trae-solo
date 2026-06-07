import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const dbPath = join(dataDir, 'app.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const schema = `
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'personal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS express_company (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    logo_url VARCHAR(255),
    is_active INTEGER DEFAULT 1,
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS express_order (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    tracking_no VARCHAR(100),
    user_id INTEGER NOT NULL,
    company_id INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    sender_info JSON,
    receiver_info JSON,
    item_info JSON,
    weight REAL DEFAULT 0,
    price REAL DEFAULT 0,
    estimated_delivery DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (company_id) REFERENCES express_company(id)
);
CREATE TABLE IF NOT EXISTS tracking_node (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    status VARCHAR(50),
    location VARCHAR(200),
    description TEXT,
    timestamp DATETIME,
    raw_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES express_order(id)
);
CREATE TABLE IF NOT EXISTS price_quote (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    company_id INTEGER NOT NULL,
    price REAL NOT NULL,
    estimated_days INTEGER,
    service_type VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES express_order(id),
    FOREIGN KEY (company_id) REFERENCES express_company(id)
);
CREATE TABLE IF NOT EXISTS pickup_code (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(20) NOT NULL,
    code VARCHAR(50) NOT NULL,
    station_name VARCHAR(100),
    order_id INTEGER,
    expire_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES express_order(id)
);
CREATE TABLE IF NOT EXISTS intl_order (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_no VARCHAR(50) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    customs_info JSON,
    goods_decl JSON,
    destination_country VARCHAR(100),
    destination_city VARCHAR(100),
    declared_value REAL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
CREATE TABLE IF NOT EXISTS customs_doc (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    doc_type VARCHAR(50),
    file_path VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES intl_order(id)
);
CREATE TABLE IF NOT EXISTS consult_ticket (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    user_id INTEGER NOT NULL,
    subject VARCHAR(200),
    description TEXT,
    status VARCHAR(20) DEFAULT 'open',
    priority VARCHAR(20) DEFAULT 'normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES intl_order(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
);
CREATE TABLE IF NOT EXISTS exception_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    exception_type VARCHAR(50),
    cause TEXT,
    suggestion TEXT,
    handling_status VARCHAR(20) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (order_id) REFERENCES express_order(id)
);
CREATE TABLE IF NOT EXISTS courier (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'available',
    current_location JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES express_company(id)
);
CREATE TABLE IF NOT EXISTS address_book (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    province VARCHAR(50),
    city VARCHAR(50),
    district VARCHAR(50),
    address TEXT,
    is_default INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);
CREATE INDEX IF NOT EXISTS idx_order_tracking_no ON express_order(tracking_no);
CREATE INDEX IF NOT EXISTS idx_order_user_id ON express_order(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_order_id ON tracking_node(order_id);
CREATE INDEX IF NOT EXISTS idx_pickup_phone ON pickup_code(phone);
CREATE INDEX IF NOT EXISTS idx_address_user_id ON address_book(user_id);
`;
db.exec(schema);

const companies = [
  { name: '顺丰速运', code: 'SF', metadata: { fullName: '顺丰速运有限公司', website: 'www.sf-express.com', baseRate: 18 } },
  { name: '中通快递', code: 'ZTO', metadata: { fullName: '中通快递股份有限公司', website: 'www.zto.com', baseRate: 8 } },
  { name: '圆通速递', code: 'YTO', metadata: { fullName: '圆通速递有限公司', website: 'www.yto.net.cn', baseRate: 9 } },
  { name: '韵达快递', code: 'YD', metadata: { fullName: '韵达控股股份有限公司', website: 'www.yundaex.com', baseRate: 8 } },
  { name: '申通快递', code: 'STO', metadata: { fullName: '申通快递有限公司', website: 'www.sto.cn', baseRate: 9 } },
  { name: 'EMS', code: 'EMS', metadata: { fullName: '中国邮政速递物流', website: 'www.ems.com.cn', baseRate: 20 } },
  { name: '京东物流', code: 'JD', metadata: { fullName: '京东物流', website: 'www.jdwl.com', baseRate: 15 } },
  { name: '德邦快递', code: 'DBL', metadata: { fullName: '德邦快递', website: 'www.deppon.com', baseRate: 12 } },
  { name: '极兔速递', code: 'JTSD', metadata: { fullName: '极兔速递', website: 'www.jtexpress.com', baseRate: 7 } },
  { name: '邮政小包', code: 'CHP', metadata: { fullName: '中国邮政小包', website: 'www.ems.com.cn', baseRate: 6 } }
];

const insertCompany = db.prepare('INSERT OR IGNORE INTO express_company (name, code, metadata) VALUES (?, ?, ?)');
companies.forEach(c => insertCompany.run(c.name, c.code, JSON.stringify(c.metadata)));

const insertUser = db.prepare('INSERT OR IGNORE INTO user (id, phone, name, role) VALUES (?, ?, ?, ?)');
insertUser.run(1, '13800138000', '张三', 'personal');
insertUser.run(2, '13900139000', '李商家', 'merchant');
insertUser.run(3, '13700137000', '王快递', 'company');

const insertCourier = db.prepare('INSERT OR IGNORE INTO courier (id, company_id, name, phone, status, current_location) VALUES (?, ?, ?, ?, ?, ?)');
insertCourier.run(1, 1, '张配送', '13911111111', 'available', JSON.stringify({ lat: 39.9042, lng: 116.4074 }));
insertCourier.run(2, 1, '李骑手', '13922222222', 'available', JSON.stringify({ lat: 39.9142, lng: 116.4174 }));
insertCourier.run(3, 2, '王速递', '13933333333', 'available', JSON.stringify({ lat: 39.8942, lng: 116.3974 }));
insertCourier.run(4, 7, '赵达达', '13944444444', 'busy', JSON.stringify({ lat: 39.9242, lng: 116.4274 }));

const insertAddress = db.prepare('INSERT OR IGNORE INTO address_book (id, user_id, name, phone, province, city, district, address, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
insertAddress.run(1, 1, '张三', '13800138000', '北京市', '北京市', '朝阳区', '建国路88号SOHO现代城A座1201', 1);
insertAddress.run(2, 1, '张三', '13800138000', '上海市', '上海市', '浦东新区', '陆家嘴环路1000号恒生银行大厦15层', 0);
insertAddress.run(3, 2, '李商家', '13900139000', '广东省', '深圳市', '南山区', '科技园南路16号创维大厦3楼', 1);

const now = Date.now();
const orders = [
  {
    id: 1, order_no: 'EXP20260530001', tracking_no: 'SF1234567890', user_id: 1, company_id: 1,
    status: 'delivered', weight: 2.5, price: 23,
    sender: { name: '张三', phone: '13800138000', province: '北京市', city: '北京市', district: '朝阳区', address: '建国路88号' },
    receiver: { name: '李四', phone: '13900139001', province: '上海市', city: '上海市', district: '浦东新区', address: '陆家嘴环路1000号' },
    item: { name: '电子产品', description: '手机配件' },
    estimated: new Date(now - 2 * 86400000).toISOString(), created: new Date(now - 5 * 86400000).toISOString(), updated: new Date(now - 2 * 86400000).toISOString()
  },
  {
    id: 2, order_no: 'EXP20260530002', tracking_no: 'ZTO9876543210', user_id: 1, company_id: 2,
    status: 'transit', weight: 1.2, price: 12,
    sender: { name: '张三', phone: '13800138000', province: '北京市', city: '北京市', district: '朝阳区', address: '建国路88号' },
    receiver: { name: '王五', phone: '13900139002', province: '广东省', city: '广州市', district: '天河区', address: '天河路385号太古汇' },
    item: { name: '服装', description: '冬季外套' },
    estimated: new Date(now + 1 * 86400000).toISOString(), created: new Date(now - 2 * 86400000).toISOString(), updated: new Date(now - 1 * 86400000).toISOString()
  },
  {
    id: 3, order_no: 'EXP20260530003', tracking_no: 'YTO5678901234', user_id: 1, company_id: 3,
    status: 'pending', weight: 0.5, price: 8,
    sender: { name: '张三', phone: '13800138000', province: '北京市', city: '北京市', district: '朝阳区', address: '建国路88号' },
    receiver: { name: '赵六', phone: '13900139003', province: '四川省', city: '成都市', district: '武侯区', address: '天府大道999号' },
    item: { name: '书籍', description: '编程入门教程' },
    estimated: new Date(now + 3 * 86400000).toISOString(), created: new Date(now - 0.5 * 86400000).toISOString(), updated: new Date(now - 0.5 * 86400000).toISOString()
  },
  {
    id: 4, order_no: 'EXP20260530004', tracking_no: 'SF9998887776', user_id: 1, company_id: 1,
    status: 'exception', weight: 3.0, price: 28,
    sender: { name: '张三', phone: '13800138000', province: '北京市', city: '北京市', district: '朝阳区', address: '建国路88号' },
    receiver: { name: '钱七', phone: '13900139004', province: '浙江省', city: '杭州市', district: '西湖区', address: '文三路478号华星科技大厦' },
    item: { name: '易碎品', description: '玻璃花瓶' },
    estimated: new Date(now + 2 * 86400000).toISOString(), created: new Date(now - 4 * 86400000).toISOString(), updated: new Date(now - 1 * 86400000).toISOString()
  },
  {
    id: 5, order_no: 'EXP20260530005', tracking_no: 'JD1112223334', user_id: 2, company_id: 7,
    status: 'transit', weight: 5.0, price: 18,
    sender: { name: '李商家', phone: '13900139000', province: '广东省', city: '深圳市', district: '南山区', address: '科技园南路16号' },
    receiver: { name: '孙八', phone: '13900139005', province: '湖北省', city: '武汉市', district: '洪山区', address: '光谷大道77号' },
    item: { name: '办公用品', description: '打印机墨盒x10' },
    estimated: new Date(now + 1 * 86400000).toISOString(), created: new Date(now - 1 * 86400000).toISOString(), updated: new Date(now - 0.5 * 86400000).toISOString()
  }
];

const insertOrder = db.prepare(`INSERT OR IGNORE INTO express_order (id, order_no, tracking_no, user_id, company_id, status, sender_info, receiver_info, item_info, weight, price, estimated_delivery, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
orders.forEach(o => {
  insertOrder.run(o.id, o.order_no, o.tracking_no, o.user_id, o.company_id, o.status,
    JSON.stringify(o.sender), JSON.stringify(o.receiver), JSON.stringify(o.item),
    o.weight, o.price, o.estimated, o.created, o.updated);
});

const trackingNodes = [
  { order_id: 1, status: '已揽收', location: '北京市朝阳区', description: '顺丰快递员已揽收', ts: new Date(now - 5 * 86400000).toISOString() },
  { order_id: 1, status: '运输中', location: '北京转运中心', description: '快件已到达北京转运中心', ts: new Date(now - 4 * 86400000).toISOString() },
  { order_id: 1, status: '运输中', location: '上海转运中心', description: '快件已到达上海转运中心', ts: new Date(now - 3 * 86400000).toISOString() },
  { order_id: 1, status: '派送中', location: '上海市浦东新区', description: '快递员正在派送', ts: new Date(now - 2.5 * 86400000).toISOString() },
  { order_id: 1, status: '已签收', location: '上海市浦东新区', description: '已签收，签收人：本人', ts: new Date(now - 2 * 86400000).toISOString() },

  { order_id: 2, status: '已揽收', location: '北京市朝阳区', description: '中通快递员已揽收', ts: new Date(now - 2 * 86400000).toISOString() },
  { order_id: 2, status: '运输中', location: '北京转运中心', description: '快件已到达北京转运中心', ts: new Date(now - 1.5 * 86400000).toISOString() },
  { order_id: 2, status: '运输中', location: '武汉转运中心', description: '快件已到达武汉转运中心', ts: new Date(now - 1 * 86400000).toISOString() },

  { order_id: 4, status: '已揽收', location: '北京市朝阳区', description: '顺丰快递员已揽收', ts: new Date(now - 4 * 86400000).toISOString() },
  { order_id: 4, status: '运输中', location: '北京转运中心', description: '快件已到达北京转运中心', ts: new Date(now - 3 * 86400000).toISOString() },
  { order_id: 4, status: '异常', location: '杭州转运中心', description: '快件包装破损，正在核实处理', ts: new Date(now - 1 * 86400000).toISOString() },
];

const insertTracking = db.prepare('INSERT INTO tracking_node (order_id, status, location, description, timestamp) VALUES (?, ?, ?, ?, ?)');
trackingNodes.forEach(n => insertTracking.run(n.order_id, n.status, n.location, n.description, n.ts));

const insertPickup = db.prepare('INSERT INTO pickup_code (phone, code, station_name, order_id, expire_time) VALUES (?, ?, ?, ?, ?)');
insertPickup.run('13800138000', '6-8-2031', '菜鸟驿站(朝阳SOHO店)', 1, new Date(now + 3 * 86400000).toISOString());
insertPickup.run('13800138000', 'A3-12', '妈妈驿站(建国路店)', 2, new Date(now + 3 * 86400000).toISOString());

const insertException = db.prepare('INSERT INTO exception_log (order_id, exception_type, cause, suggestion, handling_status) VALUES (?, ?, ?, ?, ?)');
insertException.run(4, '破损', '运输过程中包装破损导致物品损坏', '请在签收前拍照留证，并联系顺丰客服申请理赔', 'pending');

const insertIntl = db.prepare(`INSERT OR IGNORE INTO intl_order (id, order_no, user_id, customs_info, goods_decl, destination_country, destination_city, declared_value, currency) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
insertIntl.run(1, 'INT20260530001', 1,
  JSON.stringify({ shipper_name: 'Zhang San', shipper_address: '88 Jianguo Road, Chaoyang, Beijing', consignee_name: 'John Smith', consignee_address: '123 Main St, New York, NY 10001' }),
  JSON.stringify({ name: 'Electronic Components', quantity: 100, unit_price: 5.00, hs_code: '8542.31.00' }),
  '美国', 'New York', 500, 'USD'
);

const insertTicket = db.prepare('INSERT INTO consult_ticket (order_id, user_id, subject, description, status, priority) VALUES (?, ?, ?, ?, ?, ?)');
insertTicket.run(1, 1, '美国清关被扣，需要协助申报', '我的包裹在纽约海关被扣留，需要补充材料', 'open', 'high');
insertTicket.run(null, 1, '国际运费咨询', '请问寄往美国的运费如何计算？', 'resolved', 'normal');

console.log('Database seeded successfully');
db.close();
