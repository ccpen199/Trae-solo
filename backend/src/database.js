import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/app.sqlite');

const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      building TEXT NOT NULL,
      floor INTEGER DEFAULT 1,
      status TEXT DEFAULT 'offline',
      last_online DATETIME,
      fault_code TEXT,
      bluetooth_mac TEXT,
      nfc_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password TEXT DEFAULT '123456',
      phone TEXT,
      email TEXT,
      department TEXT,
      balance REAL DEFAULT 0,
      alipay_user_id TEXT,
      bluetooth_address TEXT,
      nfc_card_id TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME,
      duration INTEGER DEFAULT 0,
      water_used REAL DEFAULT 0,
      avg_temp REAL DEFAULT 0,
      avg_flow REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      payment_method TEXT,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(student_id),
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS realtime_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      temperature REAL,
      flow_rate REAL,
      cumulative_volume REAL,
      is_running INTEGER DEFAULT 0,
      is_full_flow INTEGER DEFAULT 0,
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      device_id TEXT,
      student_id TEXT,
      message TEXT NOT NULL,
      severity TEXT DEFAULT 'warning',
      status TEXT DEFAULT 'unread',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      resolved_by TEXT
    );

    CREATE TABLE IF NOT EXISTS pricing_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'standard',
      base_price REAL DEFAULT 0.05,
      night_start_hour INTEGER DEFAULT 22,
      night_end_hour INTEGER DEFAULT 6,
      night_discount REAL DEFAULT 0.7,
      tier1_limit REAL DEFAULT 50,
      tier1_price REAL DEFAULT 0.05,
      tier2_limit REAL DEFAULT 100,
      tier2_price REAL DEFAULT 0.08,
      tier3_price REAL DEFAULT 0.12,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS recharge_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'alipay',
      trade_no TEXT,
      status TEXT DEFAULT 'success',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(student_id)
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      device_id TEXT NOT NULL,
      auth_method TEXT NOT NULL,
      auth_token TEXT,
      phone_verified INTEGER DEFAULT 0,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(student_id),
      FOREIGN KEY (device_id) REFERENCES devices(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(student_id)
    );

    CREATE TABLE IF NOT EXISTS energy_statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE NOT NULL,
      building TEXT NOT NULL,
      hour INTEGER,
      total_water REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      usage_count INTEGER DEFAULT 0,
      UNIQUE(date, building, hour)
    );
  `);

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admin_users').get().count;
  if (adminCount === 0) {
    db.prepare('INSERT INTO admin_users (username, password, role) VALUES (?, ?, ?)').run(
      'admin', 'admin123', 'superadmin'
    );
  }

  const pricingCount = db.prepare('SELECT COUNT(*) as count FROM pricing_rules').get().count;
  if (pricingCount === 0) {
    db.prepare(`
      INSERT INTO pricing_rules (name, type, base_price, night_start_hour, night_end_hour,
        night_discount, tier1_limit, tier1_price, tier2_limit, tier2_price, tier3_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('默认资费', 'tiered', 0.05, 22, 6, 0.7, 50, 0.05, 100, 0.08, 0.12);
  }

  const deviceCount = db.prepare('SELECT COUNT(*) as count FROM devices').get().count;
  if (deviceCount === 0) {
    const buildings = ['一号楼', '二号楼', '三号楼', '图书馆'];
    const faultCodes = ['E01:传感器故障', 'E02:通信超时', 'E03:阀门异常', 'E04:温控失效', 'E05:电源故障'];
    const stmt = db.prepare('INSERT INTO devices (id, name, location, building, floor, status, bluetooth_mac, nfc_id, fault_code, last_online) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (let i = 1; i <= 20; i++) {
      const building = buildings[Math.floor((i - 1) / 5)];
      const floor = Math.floor(Math.random() * 6) + 1;
      const isOffline = i % 5 === 0;
      stmt.run(
        `DEV${String(i).padStart(4, '0')}`,
        `水控终端-${String(i).padStart(3, '0')}`,
        `${building}${floor}层浴室`,
        building,
        floor,
        isOffline ? 'offline' : 'online',
        `AA:BB:CC:${String(Math.floor(Math.random() * 256)).padStart(2, '0')}:${String(Math.floor(Math.random() * 256)).padStart(2, '0')}:${String(Math.floor(Math.random() * 256)).padStart(2, '0')}`,
        `NFC${String(Math.floor(Math.random() * 1000000)).padStart(8, '0')}`,
        isOffline ? faultCodes[Math.floor(Math.random() * faultCodes.length)] : null,
        isOffline ? new Date(Date.now() - Math.floor(Math.random() * 72) * 3600000).toISOString() : new Date().toISOString()
      );
    }
  }

  const studentCount = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
  if (studentCount === 0) {
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二', '刘一', '陈二', '杨三', '黄四', '林五'];
    const depts = ['计算机学院', '电子工程学院', '机械工程学院', '经济管理学院', '外国语学院'];
    const stmt = db.prepare('INSERT INTO students (student_id, name, phone, email, department, balance, alipay_user_id, bluetooth_address, nfc_card_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (let i = 1; i <= 15; i++) {
      const balance = i === 1 ? 0 : i === 2 ? 3.5 : (Math.random() * 150 + 10);
      stmt.run(
        `2024${String(i).padStart(4, '0')}`,
        names[i - 1],
        `138${String(10000000 + i * 12345678).slice(-8)}`,
        `student${i}@campus.edu.cn`,
        depts[(i - 1) % depts.length],
        Math.round(balance * 100) / 100,
        `alipay_${String(10000000 + i * 54321).slice(-8)}`,
        `DD:EE:FF:${String(Math.floor(Math.random() * 256)).padStart(2, '0')}:${String(Math.floor(Math.random() * 256)).padStart(2, '0')}:${String(Math.floor(Math.random() * 256)).padStart(2, '0')}`,
        `CARD${String(10000000 + i * 98765).slice(-8)}`
      );
    }
  }

  const txCount = db.prepare('SELECT COUNT(*) as count FROM transactions').get().count;
  if (txCount === 0) {
    const devices = db.prepare('SELECT id, building, location FROM devices').all();
    const students = db.prepare('SELECT student_id FROM students').all();
    const methods = ['alipay', 'wechat', 'balance'];
    const txStmt = db.prepare(`
      INSERT INTO transactions (student_id, device_id, start_time, end_time, duration, water_used, avg_temp, avg_flow, amount, payment_method, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date();
    for (let i = 0; i < 60; i++) {
      const student = students[i % students.length];
      const device = devices[Math.floor(Math.random() * devices.length)];
      const daysAgo = i < students.length ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const startTime = new Date(now.getTime() - (daysAgo * 86400000 + hoursAgo * 3600000));
      const durationSec = Math.floor(Math.random() * 1800) + 120;
      const endTime = new Date(startTime.getTime() + durationSec * 1000);
      const waterUsed = Math.round((Math.random() * 40 + 5) * 100) / 100;
      const avgTemp = Math.round((Math.random() * 15 + 35) * 10) / 10;
      const avgFlow = Math.round((Math.random() * 8 + 2) * 100) / 100;
      const method = methods[Math.floor(Math.random() * methods.length)];

      let pricePerLiter = 0.05;
      if (waterUsed <= 50) pricePerLiter = 0.05;
      else if (waterUsed <= 100) pricePerLiter = 0.08;
      else pricePerLiter = 0.12;

      const hour = startTime.getHours();
      if (hour >= 22 || hour < 6) pricePerLiter *= 0.7;

      const amount = Math.round(waterUsed * pricePerLiter * 100) / 100;

      txStmt.run(
        student.student_id,
        device.id,
        startTime.toISOString(),
        endTime.toISOString(),
        durationSec,
        waterUsed,
        avgTemp,
        avgFlow,
        amount,
        method,
        'completed'
      );
    }
  }

  const msgCount = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
  if (msgCount === 0) {
    const students = db.prepare('SELECT student_id, balance, name FROM students').all();
    const msgStmt = db.prepare('INSERT INTO messages (student_id, type, title, content, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?)');

    for (const student of students) {
      if (student.balance < 10) {
        const daysAgo = Math.floor(Math.random() * 3) + 1;
        const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
        msgStmt.run(
          student.student_id,
          'balance_warning',
          '余额不足提醒',
          `${student.name}同学您好，您的账户余额为${student.balance.toFixed(2)}元，低于安全阈值，请及时充值以避免影响热水使用。`,
          0,
          createdAt
        );
      }

      const sysMsgChance = Math.random();
      if (sysMsgChance > 0.5) {
        const daysAgo = Math.floor(Math.random() * 7) + 1;
        const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
        msgStmt.run(
          student.student_id,
          'system',
          '系统维护通知',
          '热水系统将于本周六凌晨2:00-6:00进行例行维护，届时服务将暂停，请提前做好用水安排。',
          Math.random() > 0.5 ? 0 : 1,
          createdAt
        );
      }
    }
  }

  const realtimeCount = db.prepare('SELECT COUNT(*) as count FROM realtime_data').get().count;
  if (realtimeCount === 0) {
    const onlineDevices = db.prepare("SELECT id FROM devices WHERE status = 'online'").all();
    const rtStmt = db.prepare('INSERT INTO realtime_data (device_id, temperature, flow_rate, cumulative_volume, is_running, is_full_flow) VALUES (?, ?, ?, ?, ?, ?)');
    for (const device of onlineDevices) {
      const flow = Math.round((Math.random() * 8 + 1) * 100) / 100;
      rtStmt.run(
        device.id,
        Math.round((Math.random() * 15 + 35) * 10) / 10,
        flow,
        Math.round(Math.random() * 500 * 100) / 100,
        0,
        flow > 8 ? 1 : 0
      );
    }
  }

  const alertCount = db.prepare('SELECT COUNT(*) as count FROM alerts').get().count;
  if (alertCount === 0) {
    const alertDevices = db.prepare("SELECT id, building FROM devices WHERE status = 'online' ORDER BY RANDOM() LIMIT 3").all();
    const alertStmt = db.prepare('INSERT INTO alerts (type, device_id, message, severity, status) VALUES (?, ?, ?, ?, ?)');
    for (const device of alertDevices) {
      alertStmt.run('full_flow', device.id, `${device.id}连续10分钟满流运行，可能存在异常用水，请及时检查`, 'warning', 'unread');
    }
  }
}

initDatabase();

export default db;
