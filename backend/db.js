import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, isAbsolute, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const configuredDbPath = process.env.SQLITE_PATH;
const dbPath = configuredDbPath
  ? (isAbsolute(configuredDbPath) ? configuredDbPath : join(__dirname, '..', configuredDbPath.replace(/^\.\//, '')))
  : join(dataDir, 'app.sqlite');
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
  { name: '顺丰速运', code: 'SF', metadata: JSON.stringify({ fullName: '顺丰速运有限公司', website: 'www.sf-express.com' }) },
  { name: '中通快递', code: 'ZTO', metadata: JSON.stringify({ fullName: '中通快递股份有限公司', website: 'www.zto.com' }) },
  { name: '圆通速递', code: 'YTO', metadata: JSON.stringify({ fullName: '圆通速递有限公司', website: 'www.yto.net.cn' }) },
  { name: '韵达快递', code: 'YD', metadata: JSON.stringify({ fullName: '韵达控股股份有限公司', website: 'www.yundaex.com' }) },
  { name: '申通快递', code: 'STO', metadata: JSON.stringify({ fullName: '申通快递有限公司', website: 'www.sto.cn' }) },
  { name: 'EMS', code: 'EMS', metadata: JSON.stringify({ fullName: '中国邮政速递物流', website: 'www.ems.com.cn' }) },
  { name: '京东物流', code: 'JD', metadata: JSON.stringify({ fullName: '京东物流', website: 'www.jdwl.com' }) },
  { name: '德邦快递', code: 'DBL', metadata: JSON.stringify({ fullName: '德邦快递', website: 'www.deppon.com' }) },
  { name: '极兔速递', code: 'JTSD', metadata: JSON.stringify({ fullName: '极兔速递', website: 'www.jtexpress.com' }) },
  { name: '邮政小包', code: 'CHP', metadata: JSON.stringify({ fullName: '中国邮政小包', website: 'www.ems.com.cn' }) }
];

const insertCompany = db.prepare('INSERT OR IGNORE INTO express_company (name, code, metadata) VALUES (?, ?, ?)');
companies.forEach(c => insertCompany.run(c.name, c.code, c.metadata));

const testUser = db.prepare('INSERT OR IGNORE INTO user (phone, name, role) VALUES (?, ?, ?)');
testUser.run('13800138000', '测试用户', 'personal');

console.log('Database initialized successfully');

export default db;
