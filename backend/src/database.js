const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS residents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      id_card TEXT UNIQUE,
      phone TEXT,
      building TEXT,
      unit TEXT,
      room_number TEXT,
      family_members TEXT,
      is_party_member INTEGER DEFAULT 0,
      is_volunteer INTEGER DEFAULT 0,
      privacy_authorized INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      merged_from TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS point_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER UNIQUE NOT NULL,
      total_points INTEGER DEFAULT 0,
      available_points INTEGER DEFAULT 0,
      frozen_points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS point_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      points INTEGER NOT NULL,
      description TEXT,
      version INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS point_rule_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      points INTEGER NOT NULL,
      description TEXT,
      version INTEGER NOT NULL,
      changed_by TEXT,
      change_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rule_id) REFERENCES point_rules(id)
    );

    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      location TEXT,
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      max_participants INTEGER,
      rule_id INTEGER,
      points_per_participant INTEGER,
      status TEXT DEFAULT 'draft',
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rule_id) REFERENCES point_rules(id)
    );

    CREATE TABLE IF NOT EXISTS activity_signups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      activity_id INTEGER NOT NULL,
      resident_id INTEGER NOT NULL,
      signup_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'signed_up',
      checkin_time DATETIME,
      checkin_type TEXT,
      proof_image TEXT,
      is_anomalous INTEGER DEFAULT 0,
      anomaly_reason TEXT,
      reviewed_by TEXT,
      review_time DATETIME,
      points_awarded INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (activity_id) REFERENCES activities(id),
      FOREIGN KEY (resident_id) REFERENCES residents(id),
      UNIQUE(activity_id, resident_id)
    );

    CREATE TABLE IF NOT EXISTS point_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      points INTEGER NOT NULL,
      balance_before INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      reason TEXT NOT NULL,
      source_type TEXT,
      source_id INTEGER,
      operator TEXT,
      is_revoked INTEGER DEFAULT 0,
      revoked_by TEXT,
      revoke_reason TEXT,
      revoked_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resident_id) REFERENCES residents(id),
      FOREIGN KEY (account_id) REFERENCES point_accounts(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      image TEXT,
      points_required INTEGER NOT NULL,
      stock INTEGER DEFAULT 0,
      max_per_resident INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS exchanges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      points_spent INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      verification_code TEXT,
      redeemed_by TEXT,
      redeemed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resident_id) REFERENCES residents(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS appeals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resident_id INTEGER NOT NULL,
      transaction_id INTEGER,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      handler TEXT,
      handle_result TEXT,
      handled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (resident_id) REFERENCES residents(id),
      FOREIGN KEY (transaction_id) REFERENCES point_transactions(id)
    );

    CREATE TABLE IF NOT EXISTS point_publications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period TEXT NOT NULL,
      type TEXT NOT NULL,
      data TEXT NOT NULL,
      published_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_residents_id_card ON residents(id_card);
    CREATE INDEX IF NOT EXISTS idx_residents_phone ON residents(phone);
    CREATE INDEX IF NOT EXISTS idx_point_accounts_resident ON point_accounts(resident_id);
    CREATE INDEX IF NOT EXISTS idx_point_transactions_resident ON point_transactions(resident_id);
    CREATE INDEX IF NOT EXISTS idx_activity_signups_activity ON activity_signups(activity_id);
    CREATE INDEX IF NOT EXISTS idx_activity_signups_resident ON activity_signups(resident_id);
    CREATE INDEX IF NOT EXISTS idx_exchanges_resident ON exchanges(resident_id);
    CREATE INDEX IF NOT EXISTS idx_appeals_resident ON appeals(resident_id);
  `);

  const ruleCount = db.prepare('SELECT COUNT(*) as count FROM point_rules').get().count;
  if (ruleCount === 0) {
    const insertRule = db.prepare(`
      INSERT INTO point_rules (name, category, points, description, version, is_active, created_by)
      VALUES (?, ?, ?, ?, 1, 1, 'system')
    `);

    const insertVersion = db.prepare(`
      INSERT INTO point_rule_versions (rule_id, name, category, points, description, version, changed_by, change_reason)
      VALUES (?, ?, ?, ?, ?, 1, 'system', '初始版本')
    `);

    const defaultRules = [
      ['志愿服务时长', 'volunteer', 10, '每小时志愿服务获得10积分'],
      ['垃圾分类达标', 'garbage', 5, '垃圾分类检查达标获得5积分'],
      ['社区活动参与', 'activity', 20, '参与社区活动获得20积分'],
      ['文明行为表彰', 'civilization', 50, '文明行为受到表彰获得50积分'],
      ['违规行为扣分', 'penalty', -10, '违规行为扣减10积分'],
      ['缺席已报名活动', 'penalty', -5, '无故缺席已报名活动扣减5积分']
    ];

    defaultRules.forEach(rule => {
      const result = insertRule.run(...rule);
      insertVersion.run(result.lastInsertRowid, rule[0], rule[1], rule[2], rule[3]);
    });
  }

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (name, description, points_required, stock, max_per_resident, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);

    const defaultProducts = [
      ['洗衣液', '1kg装洗衣液', 100, 50, 2],
      ['纸巾', '10包装抽纸', 50, 100, 3],
      ['食用油', '1L装食用油', 200, 30, 1],
      ['社区荣誉证书', '社区优秀志愿者荣誉证书', 500, 10, 1]
    ];

    defaultProducts.forEach(product => {
      insertProduct.run(...product);
    });
  }

  const residentCount = db.prepare('SELECT COUNT(*) as count FROM residents WHERE status = 1').get().count;
  if (residentCount === 0) {
    const insertResident = db.prepare(`
      INSERT INTO residents (name, id_card, phone, building, unit, room_number, is_party_member, is_volunteer, privacy_authorized, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const insertAccount = db.prepare(`
      INSERT INTO point_accounts (resident_id, total_points, available_points, frozen_points)
      VALUES (?, ?, ?, 0)
    `);

    const defaultResidents = [
      ['张三', '110101199001011001', '13800138001', '1', '2', '301', 1, 1, 1, 500, 500],
      ['李四', '110101199001011002', '13800138002', '2', '1', '102', 0, 1, 1, 320, 320],
      ['王五', '110101199001011003', '13800138003', '3', '3', '501', 1, 0, 1, 180, 180],
      ['赵六', '110101199001011004', '13800138004', '1', '1', '201', 0, 0, 0, 90, 90],
      ['陈七', '110101199001011005', '13800138005', '2', '2', '402', 0, 1, 1, 750, 750]
    ];

    defaultResidents.forEach(resident => {
      const result = insertResident.run(
        resident[0], resident[1], resident[2], resident[3], resident[4],
        resident[5], resident[6], resident[7], resident[8]
      );
      insertAccount.run(result.lastInsertRowid, resident[9], resident[10]);
    });
  }
}

initDatabase();

module.exports = db;
