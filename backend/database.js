const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      building_no TEXT NOT NULL,
      unit_no TEXT NOT NULL,
      floor_no INTEGER,
      room_no TEXT NOT NULL,
      area REAL,
      layout_type TEXT,
      price REAL,
      status TEXT DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(building_no, unit_no, room_no)
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      id_card TEXT,
      channel_id INTEGER,
      channel_referrer_id INTEGER,
      first_visit_date DATETIME,
      latest_visit_date DATETIME,
      intended_layout TEXT,
      budget_min REAL,
      budget_max REAL,
      family_structure TEXT,
      agent_id INTEGER,
      stage TEXT DEFAULT 'lead',
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (channel_id) REFERENCES channels(id),
      FOREIGN KEY (agent_id) REFERENCES users(id),
      UNIQUE(phone)
    );

    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      visit_type TEXT NOT NULL,
      visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      receiver_id INTEGER,
      route TEXT,
      showrooms TEXT,
      feedback TEXT,
      next_follow_date DATETIME,
      next_follow_content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS follow_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      agent_id INTEGER,
      follow_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      method TEXT,
      content TEXT,
      result TEXT,
      next_follow_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (agent_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS intentions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      property_id INTEGER,
      deposit_amount REAL,
      discount_amount REAL,
      payment_method TEXT,
      approval_status TEXT DEFAULT 'pending',
      approver_id INTEGER,
      approval_date DATETIME,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (property_id) REFERENCES properties(id),
      FOREIGN KEY (approver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS churns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      churn_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      reason TEXT,
      competitor TEXT,
      price_sensitivity TEXT,
      recontact_plan TEXT,
      recontact_date DATETIME,
      remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    CREATE TABLE IF NOT EXISTS revisits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      revisit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      receiver_id INTEGER,
      purpose TEXT,
      feedback TEXT,
      next_follow_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS agent_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      from_agent_id INTEGER,
      to_agent_id INTEGER,
      transfer_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      reason TEXT,
      operator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (from_agent_id) REFERENCES users(id),
      FOREIGN KEY (to_agent_id) REFERENCES users(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (name, role, phone) VALUES (?, ?, ?)');
    insertUser.run('张经理', 'manager', '13800138001');
    insertUser.run('李顾问', 'agent', '13800138002');
    insertUser.run('王顾问', 'agent', '13800138003');
    insertUser.run('赵渠道', 'channel', '13800138004');
  }

  const channelCount = db.prepare('SELECT COUNT(*) as count FROM channels').get().count;
  if (channelCount === 0) {
    const insertChannel = db.prepare('INSERT INTO channels (name, type, contact_name, contact_phone) VALUES (?, ?, ?, ?)');
    insertChannel.run('自然到访', 'natural', '', '');
    insertChannel.run('老业主推荐', 'referral', '', '');
    insertChannel.run('线上广告', 'online', '', '');
    insertChannel.run('中介渠道', 'agent', '王中介', '13900139001');
  }

  const propertyCount = db.prepare('SELECT COUNT(*) as count FROM properties').get().count;
  if (propertyCount === 0) {
    const insertProperty = db.prepare('INSERT INTO properties (building_no, unit_no, floor_no, room_no, area, layout_type, price) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const layouts = ['两室一厅', '三室两厅', '四室两厅'];
    const prices = [1200000, 1800000, 2500000];
    const areas = [85, 120, 160];
    
    for (let b = 1; b <= 3; b++) {
      for (let u = 1; u <= 2; u++) {
        for (let f = 1; f <= 10; f++) {
          for (let r = 1; r <= 2; r++) {
            const idx = Math.floor(Math.random() * 3);
            insertProperty.run(
              String(b), 
              String(u), 
              f, 
              `${f}0${r}`, 
              areas[idx], 
              layouts[idx], 
              prices[idx]
            );
          }
        }
      }
    }
  }
}

initDatabase();

module.exports = db;
