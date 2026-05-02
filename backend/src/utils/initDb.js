const db = require('./database');
const bcrypt = require('bcryptjs');

const initDatabase = () => {
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS airlines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT,
    country TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS flights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_number TEXT UNIQUE NOT NULL,
    airline_id INTEGER NOT NULL,
    departure_airport TEXT NOT NULL,
    arrival_airport TEXT NOT NULL,
    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,
    aircraft_type TEXT,
    status TEXT DEFAULT 'scheduled',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (airline_id) REFERENCES airlines(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS cabins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_id INTEGER NOT NULL,
    cabin_class TEXT NOT NULL,
    total_seats INTEGER NOT NULL,
    available_seats INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (flight_id) REFERENCES flights(id),
    UNIQUE(flight_id, cabin_class)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS fares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cabin_id INTEGER NOT NULL,
    fare_type TEXT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL,
    refundable BOOLEAN DEFAULT 0,
    changeable BOOLEAN DEFAULT 0,
    baggage_allowance INTEGER DEFAULT 20,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cabin_id) REFERENCES cabins(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS passengers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    id_type TEXT NOT NULL,
    id_number TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    nationality TEXT,
    membership_level TEXT DEFAULT 'normal',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(id_type, id_number)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS payment_channels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    fee_rate DECIMAL(5,4) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    passenger_id INTEGER NOT NULL,
    user_id INTEGER,
    status TEXT NOT NULL DEFAULT 'pending_query',
    total_amount DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    payment_channel_id INTEGER,
    payment_time DATETIME,
    created_by INTEGER,
    assigned_to INTEGER,
    expected_completion_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (passenger_id) REFERENCES passengers(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (payment_channel_id) REFERENCES payment_channels(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    flight_id INTEGER NOT NULL,
    cabin_id INTEGER NOT NULL,
    fare_id INTEGER NOT NULL,
    seat_number TEXT,
    unit_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (flight_id) REFERENCES flights(id),
    FOREIGN KEY (cabin_id) REFERENCES cabins(id),
    FOREIGN KEY (fare_id) REFERENCES fares(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT UNIQUE NOT NULL,
    order_id INTEGER NOT NULL,
    order_item_id INTEGER NOT NULL,
    passenger_id INTEGER NOT NULL,
    flight_id INTEGER NOT NULL,
    cabin_id INTEGER NOT NULL,
    fare_id INTEGER NOT NULL,
    seat_number TEXT,
    issue_time DATETIME NOT NULL,
    status TEXT DEFAULT 'issued',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (order_item_id) REFERENCES order_items(id),
    FOREIGN KEY (passenger_id) REFERENCES passengers(id),
    FOREIGN KEY (flight_id) REFERENCES flights(id),
    FOREIGN KEY (cabin_id) REFERENCES cabins(id),
    FOREIGN KEY (fare_id) REFERENCES fares(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS rebook_refund_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_number TEXT UNIQUE NOT NULL,
    order_id INTEGER NOT NULL,
    ticket_id INTEGER,
    request_type TEXT NOT NULL,
    original_flight_id INTEGER,
    new_flight_id INTEGER,
    original_cabin_id INTEGER,
    new_cabin_id INTEGER,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    approval_comments TEXT,
    refund_amount DECIMAL(10,2),
    additional_fee DECIMAL(10,2),
    created_by INTEGER,
    approved_by INTEGER,
    approved_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (ticket_id) REFERENCES tickets(id),
    FOREIGN KEY (original_flight_id) REFERENCES flights(id),
    FOREIGN KEY (new_flight_id) REFERENCES flights(id),
    FOREIGN KEY (original_cabin_id) REFERENCES cabins(id),
    FOREIGN KEY (new_cabin_id) REFERENCES cabins(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    recipient_role TEXT NOT NULL,
    recipient_id INTEGER,
    message_type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT 0,
    is_todo BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    user_id INTEGER,
    action TEXT NOT NULL,
    previous_status TEXT,
    new_status TEXT,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS inventory_locks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    cabin_id INTEGER NOT NULL,
    lock_count INTEGER NOT NULL,
    lock_expire_at DATETIME NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (cabin_id) REFERENCES cabins(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS order_statistics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stat_date DATE NOT NULL,
    airline_id INTEGER,
    total_orders INTEGER DEFAULT 0,
    pending_orders INTEGER DEFAULT 0,
    paid_orders INTEGER DEFAULT 0,
    issued_orders INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    total_amount DECIMAL(15,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(stat_date, airline_id),
    FOREIGN KEY (airline_id) REFERENCES airlines(id)
  )`);

  db.exec(`CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
  )`);

  const hashedPassword = bcrypt.hashSync('123456', 10);
  
  const insertUser = db.prepare(`INSERT OR IGNORE INTO users (username, password, role, name, email, phone) 
                                   VALUES (?, ?, ?, ?, ?, ?)`);
  
  insertUser.run('admin', hashedPassword, 'admin', '系统管理员', 'admin@flight.com', '13800138000');
  insertUser.run('passenger1', hashedPassword, 'passenger', '张三', 'zhangsan@example.com', '13900139001');
  insertUser.run('agent1', hashedPassword, 'agent', '代理小王', 'agent1@flight.com', '13700137001');
  insertUser.run('service1', hashedPassword, 'customer_service', '客服小李', 'service1@flight.com', '13600136001');
  insertUser.run('airline1', hashedPassword, 'airline', '航司工作人员', 'airline1@ca.com', '13500135001');

  const insertAirline = db.prepare(`INSERT OR IGNORE INTO airlines (code, name, full_name, country) 
                                     VALUES (?, ?, ?, ?)`);
  
  insertAirline.run('CA', '中国国航', '中国国际航空股份有限公司', '中国');
  insertAirline.run('MU', '东方航空', '中国东方航空股份有限公司', '中国');
  insertAirline.run('CZ', '南方航空', '中国南方航空股份有限公司', '中国');

  const insertPaymentChannel = db.prepare(`INSERT OR IGNORE INTO payment_channels (code, name, provider, fee_rate) 
                                             VALUES (?, ?, ?, ?)`);
  
  insertPaymentChannel.run('ALIPAY', '支付宝', '支付宝', 0.006);
  insertPaymentChannel.run('WECHAT', '微信支付', '腾讯微信', 0.006);
  insertPaymentChannel.run('UNIONPAY', '银联支付', '中国银联', 0.005);

  const insertPassenger = db.prepare(`INSERT OR IGNORE INTO passengers (first_name, last_name, id_type, id_number, phone, email, nationality)
                                        VALUES (?, ?, ?, ?, ?, ?, ?)`);
  
  insertPassenger.run('三', '张', '身份证', '110101199001011234', '13900139001', 'zhangsan@example.com', '中国');

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000);

  const insertFlight = db.prepare(`INSERT OR IGNORE INTO flights (flight_number, airline_id, departure_airport, arrival_airport, departure_time, arrival_time, aircraft_type, status)
                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
  
  insertFlight.run(
    'CA1234', 1, '北京首都国际机场', '上海虹桥国际机场', 
    tomorrow.toISOString().slice(0, 19).replace('T', ' '),
    new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
    '波音737-800', 'scheduled'
  );
  
  insertFlight.run(
    'MU5678', 2, '上海浦东国际机场', '广州白云国际机场', 
    dayAfter.toISOString().slice(0, 19).replace('T', ' '),
    new Date(dayAfter.getTime() + 2.5 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
    '空客A320', 'scheduled'
  );

  const insertCabin = db.prepare(`INSERT OR IGNORE INTO cabins (flight_id, cabin_class, total_seats, available_seats, price, status)
                                   VALUES (?, ?, ?, ?, ?, ?)`);
  
  insertCabin.run(1, '经济舱', 150, 150, 680.00, 'available');
  insertCabin.run(1, '商务舱', 30, 30, 1880.00, 'available');
  insertCabin.run(1, '头等舱', 8, 8, 3680.00, 'available');
  insertCabin.run(2, '经济舱', 180, 180, 420.00, 'available');
  insertCabin.run(2, '商务舱', 24, 24, 1280.00, 'available');

  const insertFare = db.prepare(`INSERT OR IGNORE INTO fares (cabin_id, fare_type, base_price, tax, total_price, refundable, changeable, baggage_allowance, status)
                                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  insertFare.run(1, '特价票', 680.00, 50.00, 730.00, 0, 0, 20, 'active');
  insertFare.run(1, '折扣票', 880.00, 50.00, 930.00, 1, 1, 20, 'active');
  insertFare.run(2, '商务折扣', 1880.00, 100.00, 1980.00, 1, 1, 30, 'active');
  insertFare.run(3, '头等全价', 3680.00, 200.00, 3880.00, 1, 1, 40, 'active');
  insertFare.run(4, '特价票', 420.00, 30.00, 450.00, 0, 0, 20, 'active');
  insertFare.run(5, '商务折扣', 1280.00, 80.00, 1360.00, 1, 1, 30, 'active');

  console.log('数据库初始化完成');
};

module.exports = initDatabase;
