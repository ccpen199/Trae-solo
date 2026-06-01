const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = process.env.DB_PATH || './data/crop_insurance.db';
const fullDbPath = path.join(__dirname, dbPath);
const dbDir = path.dirname(fullDbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const db = new Database(fullDbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('farmer', 'insurer', 'surveyor', 'township', 'regulator')),
      phone TEXT,
      id_card TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS farmers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      id_card TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      township TEXT,
      village TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_no TEXT UNIQUE NOT NULL,
      farmer_id INTEGER NOT NULL REFERENCES farmers(id),
      crop_type TEXT NOT NULL,
      crop_variety TEXT,
      plot_location TEXT NOT NULL,
      plot_latitude REAL,
      plot_longitude REAL,
      area REAL NOT NULL,
      area_unit TEXT DEFAULT 'mu',
      insurance_amount REAL NOT NULL,
      premium REAL NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      deductible_clause TEXT,
      deductible_ratio REAL DEFAULT 0.1,
      payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
      payment_time DATETIME,
      status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'cancelled')),
      insurer_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_no TEXT UNIQUE NOT NULL,
      policy_id INTEGER NOT NULL REFERENCES policies(id),
      farmer_id INTEGER NOT NULL REFERENCES farmers(id),
      disaster_type TEXT NOT NULL,
      disaster_time DATETIME NOT NULL,
      photos TEXT,
      location TEXT,
      latitude REAL,
      longitude REAL,
      damaged_area REAL NOT NULL,
      emergency_contact TEXT NOT NULL,
      emergency_phone TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'surveying', 'surveyed', 'approved', 'rejected', 'paid')),
      reported_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      survey_no TEXT UNIQUE NOT NULL,
      report_id INTEGER NOT NULL REFERENCES reports(id),
      policy_id INTEGER NOT NULL REFERENCES policies(id),
      surveyor_id INTEGER REFERENCES users(id),
      survey_time DATETIME NOT NULL,
      field_records TEXT,
      sampling_method TEXT,
      sampling_count INTEGER,
      sample_loss_ratio REAL,
      satellite_reference TEXT,
      weather_reference TEXT,
      loss_ratio REAL NOT NULL,
      estimated_loss REAL,
      survey_opinion TEXT NOT NULL,
      photos TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_no TEXT UNIQUE NOT NULL,
      report_id INTEGER NOT NULL REFERENCES reports(id),
      policy_id INTEGER NOT NULL REFERENCES policies(id),
      policy_valid INTEGER DEFAULT 1,
      deductible_applied REAL DEFAULT 0,
      duplicate_report INTEGER DEFAULT 0,
      materials_complete INTEGER DEFAULT 1,
      missing_materials TEXT,
      compensation_amount REAL NOT NULL,
      review_opinion TEXT,
      status TEXT DEFAULT 'reviewing' CHECK (status IN ('reviewing', 'approved', 'rejected', 'paid')),
      rejection_reason TEXT,
      reviewer_id INTEGER REFERENCES users(id),
      review_time DATETIME,
      payment_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS claim_approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      claim_id INTEGER NOT NULL REFERENCES claims(id),
      approver_id INTEGER REFERENCES users(id),
      approver_role TEXT NOT NULL,
      approval_status TEXT NOT NULL CHECK (approval_status IN ('pending', 'approved', 'rejected')),
      approval_opinion TEXT,
      approval_time DATETIME,
      step INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS disaster_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS crop_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      default_amount_per_mu REAL
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      module TEXT NOT NULL,
      action TEXT NOT NULL,
      record_id INTEGER,
      content TEXT,
      ip TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_policies_farmer ON policies(farmer_id);
    CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
    CREATE INDEX IF NOT EXISTS idx_reports_policy ON reports(policy_id);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_surveys_report ON surveys(report_id);
    CREATE INDEX IF NOT EXISTS idx_claims_report ON claims(report_id);
    CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
    CREATE INDEX IF NOT EXISTS idx_approvals_claim ON claim_approvals(claim_id);
  `);

  const disasterCount = db.prepare('SELECT COUNT(*) as count FROM disaster_types').get();
  if (disasterCount.count === 0) {
    const insertDisaster = db.prepare(`
      INSERT INTO disaster_types (code, name, category, description) VALUES (?, ?, ?, ?)
    `);
    const disasters = [
      ['DROUGHT', '旱灾', '气象灾害', '长期无降水或降水异常偏少造成空气干燥、土壤缺水'],
      ['FLOOD', '洪涝', '气象灾害', '持续性降雨或暴雨导致积水、山洪'],
      ['HAIL', '冰雹', '气象灾害', '强对流天气导致的冰雹灾害'],
      ['WIND', '风灾', '气象灾害', '台风、龙卷风、大风等'],
      ['PEST', '病虫害', '生物灾害', '病虫害导致的作物损失'],
      ['FROST', '霜冻', '气象灾害', '低温冻害'],
      ['FIRE', '火灾', '其他灾害', '作物火灾'],
      ['OTHER', '其他', '其他灾害', '其他未列明灾害']
    ];
    disasters.forEach(d => insertDisaster.run(...d));
  }

  const cropCount = db.prepare('SELECT COUNT(*) as count FROM crop_types').get();
  if (cropCount.count === 0) {
    const insertCrop = db.prepare(`
      INSERT INTO crop_types (code, name, category, default_amount_per_mu) VALUES (?, ?, ?, ?)
    `);
    const crops = [
      ['RICE', '水稻', '粮食作物', 800],
      ['WHEAT', '小麦', '粮食作物', 600],
      ['CORN', '玉米', '粮食作物', 700],
      ['SOYBEAN', '大豆', '粮食作物', 500],
      ['PEANUT', '花生', '油料作物', 1000],
      ['COTTON', '棉花', '经济作物', 1200],
      ['VEGETABLE', '蔬菜', '蔬菜作物', 2000],
      ['FRUIT', '果树', '果业作物', 3000]
    ];
    crops.forEach(c => insertCrop.run(...c));
  }

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, name, role, phone, id_card, address) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const users = [
      ['admin', '系统管理员', 'regulator', '13800000000', '110101199001010000', '北京市朝阳区'],
      ['insurer1', '张保险', 'insurer', '13800000001', '110101199001010001', '北京市海淀区'],
      ['surveyor1', '李查勘', 'surveyor', '13800000002', '110101199001010002', '北京市丰台区'],
      ['township1', '王乡镇', 'township', '13800000003', '110101199001010003', '北京市通州区'],
      ['farmer1', '赵农户', 'farmer', '13800000004', '110101199001010004', '北京市大兴区']
    ];
    users.forEach(u => insertUser.run(...u));

    const insertFarmer = db.prepare(`
      INSERT INTO farmers (user_id, name, id_card, phone, address, township, village) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertFarmer.run(5, '赵农户', '110101199001010004', '13800000004', '北京市大兴区', '大兴镇', '幸福村');
  }

  console.log('Database initialized successfully');
}

module.exports = { db, initDatabase };
