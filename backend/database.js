const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'lease_risk.db');

if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      credit_code TEXT UNIQUE,
      legal_representative TEXT,
      registered_capital REAL,
      established_date TEXT,
      industry TEXT,
      business_scope TEXT,
      address TEXT,
      contact_person TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      annual_revenue REAL,
      employee_count INTEGER,
      credit_score INTEGER DEFAULT 600,
      credit_level TEXT DEFAULT 'C',
      suggested_limit REAL DEFAULT 0,
      approved_limit REAL DEFAULT 0,
      guarantee_type TEXT,
      guarantee_detail TEXT,
      historical_leases TEXT,
      historical_overdue INTEGER DEFAULT 0,
      historical_default TEXT DEFAULT 'no',
      approved_by TEXT,
      approved_at TEXT,
      reject_reason TEXT,
      rejected_by TEXT,
      rejected_at TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lease_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      lease_amount REAL,
      lease_term INTEGER,
      start_date TEXT,
      end_date TEXT,
      repayment_status TEXT,
      overdue_days INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_no TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      customer_name TEXT,
      total_amount REAL,
      lease_term INTEGER,
      start_date TEXT,
      end_date TEXT,
      deposit REAL DEFAULT 0,
      delivery_address TEXT,
      insurance_coverage REAL DEFAULT 0,
      default_clause TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS contract_devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER NOT NULL,
      device_name TEXT,
      device_model TEXT,
      quantity INTEGER DEFAULT 1,
      unit_price REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id)
    );

    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      serial_no TEXT UNIQUE NOT NULL,
      device_name TEXT NOT NULL,
      device_model TEXT,
      brand TEXT,
      purchase_date TEXT,
      purchase_price REAL,
      current_value REAL,
      contract_id INTEGER,
      customer_id INTEGER,
      current_location TEXT,
      last_check_date TEXT,
      status TEXT DEFAULT 'idle',
      delivery_status TEXT DEFAULT 'pending',
      acceptance_date TEXT,
      return_status TEXT DEFAULT 'none',
      abnormal_movement INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS maintenance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      maintenance_date TEXT,
      maintenance_type TEXT,
      description TEXT,
      cost REAL,
      technician TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_no TEXT UNIQUE NOT NULL,
      contract_id INTEGER NOT NULL,
      customer_id INTEGER,
      bill_type TEXT DEFAULT 'rent',
      amount REAL NOT NULL,
      due_date TEXT,
      paid_amount REAL DEFAULT 0,
      paid_date TEXT,
      penalty REAL DEFAULT 0,
      reduction REAL DEFAULT 0,
      status TEXT DEFAULT 'unpaid',
      overdue_days INTEGER DEFAULT 0,
      collection_status TEXT DEFAULT 'none',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS collection_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      collection_date TEXT,
      collection_method TEXT,
      collector TEXT,
      result TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id)
    );

    CREATE TABLE IF NOT EXISTS device_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      alert_type TEXT,
      alert_level TEXT DEFAULT 'warning',
      description TEXT,
      status TEXT DEFAULT 'active',
      handled_by TEXT,
      handled_at TEXT,
      handle_result TEXT,
      handle_notes TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );
  `);

  const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
  if (customerCount === 0) {
    const insertCustomer = db.prepare(`
      INSERT INTO customers (
        company_name, credit_code, legal_representative, registered_capital,
        established_date, industry, business_scope, address, contact_person,
        contact_phone, contact_email, annual_revenue, employee_count,
        credit_score, credit_level, suggested_limit, approved_limit,
        guarantee_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const customers = [
      ['北京科技发展有限公司', '91110000MA001ABC01', '张三', 5000000, '2018-03-15', '信息技术', '软件开发、技术服务', '北京市海淀区中关村大街1号', '张三', '13800138001', 'zhangsan@bjtech.com', 20000000, 150, 750, 'A', 500000, 500000, 'credit', 'approved'],
      ['上海制造有限公司', '91310000MA002DEF02', '李四', 10000000, '2015-06-20', '制造业', '机械设备生产、销售', '上海市浦东新区张江路100号', '李四', '13900139002', 'lisi@shmfg.com', 50000000, 300, 820, 'AA', 1000000, 1000000, 'mortgage', 'approved'],
      ['广州贸易有限公司', '91440000MA003GHI03', '王五', 2000000, '2020-01-10', '批发零售', '电子产品批发零售', '广州市天河区天河路385号', '王五', '13700137003', 'wangwu@gztrade.com', 8000000, 50, 650, 'B', 200000, 200000, 'guarantee', 'approved'],
      ['深圳创新科技', '91440300MA004JKL04', '赵六', 8000000, '2019-09-01', '电子科技', '智能硬件研发', '深圳市南山区科技园', '赵六', '13600136004', 'zhaoliu@szcx.com', 30000000, 200, 580, 'C', 100000, 0, 'credit', 'pending'],
    ];

    customers.forEach(c => insertCustomer.run(...c));

    const insertContract = db.prepare(`
      INSERT INTO contracts (
        contract_no, customer_id, customer_name, total_amount, lease_term,
        start_date, end_date, deposit, delivery_address, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const contracts = [
      ['HT20240001', 1, '北京科技发展有限公司', 360000, 12, '2024-01-01', '2024-12-31', 30000, '北京市海淀区中关村大街1号', 'active'],
      ['HT20240002', 2, '上海制造有限公司', 720000, 24, '2024-02-01', '2026-01-31', 60000, '上海市浦东新区张江路100号', 'active'],
      ['HT20240003', 3, '广州贸易有限公司', 120000, 6, '2024-03-01', '2024-08-31', 10000, '广州市天河区天河路385号', 'active'],
    ];

    contracts.forEach(c => insertContract.run(...c));

    const insertDevice = db.prepare(`
      INSERT INTO devices (
        serial_no, device_name, device_model, brand, purchase_date,
        purchase_price, current_value, contract_id, customer_id,
        current_location, status, delivery_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const devices = [
      ['SN20240001', '服务器', 'Dell PowerEdge R750', 'Dell', '2023-12-01', 50000, 45000, 1, 1, '北京市海淀区中关村大街1号机房', 'in_use', 'delivered'],
      ['SN20240002', '交换机', 'Cisco Catalyst 9300', 'Cisco', '2023-12-15', 20000, 18000, 1, 1, '北京市海淀区中关村大街1号机房', 'in_use', 'delivered'],
      ['SN20240003', '数控机床', 'DMG MORI CMX50', 'DMG', '2023-11-20', 300000, 280000, 2, 2, '上海市浦东新区张江路100号车间', 'in_use', 'delivered'],
      ['SN20240004', '工业机器人', 'ABB IRB 1200', 'ABB', '2023-10-10', 150000, 140000, 2, 2, '上海市浦东新区张江路100号车间', 'in_use', 'delivered'],
      ['SN20240005', '笔记本电脑', 'ThinkPad X1 Carbon', 'Lenovo', '2024-01-05', 12000, 10000, 3, 3, '广州市天河区天河路385号', 'in_use', 'delivered'],
      ['SN20240006', '打印机', 'HP LaserJet Pro', 'HP', '2024-01-10', 3000, 2500, 3, 3, '广州市天河区天河路385号', 'in_use', 'delivered'],
      ['SN20240007', '投影仪', 'Epson CB-2265U', 'Epson', '2024-02-01', 8000, 7000, null, null, '深圳市南山区科技园仓库', 'idle', 'pending'],
      ['SN20240008', '监控系统', 'Hikvision DS-7608N', 'Hikvision', '2024-02-15', 5000, 4500, null, null, '深圳市南山区科技园仓库', 'idle', 'pending'],
    ];

    devices.forEach(d => insertDevice.run(...d));

    const insertBill = db.prepare(`
      INSERT INTO bills (
        bill_no, contract_id, customer_id, bill_type, amount,
        due_date, paid_amount, status, overdue_days
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const bills = [
      ['ZD20240001', 1, 1, 'rent', 30000, '2024-01-15', 30000, 'paid', 0],
      ['ZD20240002', 1, 1, 'rent', 30000, '2024-02-15', 30000, 'paid', 0],
      ['ZD20240003', 1, 1, 'rent', 30000, '2024-03-15', 30000, 'paid', 0],
      ['ZD20240004', 1, 1, 'rent', 30000, '2024-04-15', 15000, 'partial', 45],
      ['ZD20240005', 2, 2, 'rent', 30000, '2024-02-15', 30000, 'paid', 0],
      ['ZD20240006', 2, 2, 'rent', 30000, '2024-03-15', 30000, 'paid', 0],
      ['ZD20240007', 2, 2, 'rent', 30000, '2024-04-15', 0, 'unpaid', 45],
      ['ZD20240008', 3, 3, 'rent', 20000, '2024-03-15', 20000, 'paid', 0],
      ['ZD20240009', 3, 3, 'rent', 20000, '2024-04-15', 0, 'unpaid', 15],
    ];

    bills.forEach(b => insertBill.run(...b));

    const insertAlert = db.prepare(`
      INSERT INTO device_alerts (device_id, alert_type, alert_level, description, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    const alerts = [
      [1, 'abnormal_movement', 'warning', '设备位置异常移动', 'active'],
      [4, 'maintenance_due', 'info', '设备即将到达保养周期', 'active'],
    ];

    alerts.forEach(a => insertAlert.run(...a));
  }
}

initDatabase();

module.exports = db;
