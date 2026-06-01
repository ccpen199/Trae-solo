const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS buildings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      address TEXT,
      total_area REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enterprises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      building_id INTEGER,
      floor TEXT,
      room_no TEXT,
      area REAL,
      workstations INTEGER,
      contact_person TEXT,
      contact_phone TEXT,
      status TEXT DEFAULT 'active',
      lease_start_date TEXT,
      lease_end_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id)
    );

    CREATE TABLE IF NOT EXISTS meters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meter_no TEXT NOT NULL UNIQUE,
      meter_name TEXT,
      energy_type TEXT NOT NULL,
      building_id INTEGER,
      enterprise_id INTEGER,
      location TEXT,
      multiplier REAL DEFAULT 1,
      reading_cycle TEXT DEFAULT 'monthly',
      initial_reading REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      is_public INTEGER DEFAULT 0,
      parent_meter_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id),
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
    );

    CREATE TABLE IF NOT EXISTS meter_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meter_id INTEGER NOT NULL,
      old_meter_no TEXT,
      new_meter_no TEXT,
      old_final_reading REAL,
      new_initial_reading REAL,
      change_date TEXT NOT NULL,
      reason TEXT,
      operator TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meter_id) REFERENCES meters(id)
    );

    CREATE TABLE IF NOT EXISTS meter_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meter_id INTEGER NOT NULL,
      reading_date TEXT NOT NULL,
      reading_value REAL NOT NULL,
      reading_type TEXT DEFAULT 'manual',
      source TEXT,
      status TEXT DEFAULT 'normal',
      anomaly_type TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (meter_id) REFERENCES meters(id)
    );

    CREATE TABLE IF NOT EXISTS allocation_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_name TEXT NOT NULL,
      energy_type TEXT NOT NULL,
      allocation_type TEXT NOT NULL,
      building_id INTEGER,
      source_meter_id INTEGER,
      effective_date TEXT NOT NULL,
      end_date TEXT,
      status TEXT DEFAULT 'active',
      formula TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (building_id) REFERENCES buildings(id),
      FOREIGN KEY (source_meter_id) REFERENCES meters(id)
    );

    CREATE TABLE IF NOT EXISTS allocation_rule_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_id INTEGER NOT NULL,
      target_enterprise_id INTEGER,
      target_meter_id INTEGER,
      allocation_ratio REAL,
      fixed_amount REAL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rule_id) REFERENCES allocation_rules(id),
      FOREIGN KEY (target_enterprise_id) REFERENCES enterprises(id),
      FOREIGN KEY (target_meter_id) REFERENCES meters(id)
    );

    CREATE TABLE IF NOT EXISTS energy_prices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      energy_type TEXT NOT NULL,
      price REAL NOT NULL,
      tax_rate REAL DEFAULT 0.13,
      effective_date TEXT NOT NULL,
      end_date TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_no TEXT NOT NULL UNIQUE,
      enterprise_id INTEGER NOT NULL,
      billing_period TEXT NOT NULL,
      energy_type TEXT NOT NULL,
      direct_usage REAL DEFAULT 0,
      allocated_usage REAL DEFAULT 0,
      total_usage REAL DEFAULT 0,
      unit_price REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      enterprise_confirm_status TEXT DEFAULT 'pending',
      enterprise_confirm_at TEXT,
      enterprise_confirm_by TEXT,
      payment_status TEXT DEFAULT 'unpaid',
      payment_at TEXT,
      payment_method TEXT,
      generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (enterprise_id) REFERENCES enterprises(id)
    );

    CREATE TABLE IF NOT EXISTS bill_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      item_type TEXT NOT NULL,
      meter_id INTEGER,
      meter_reading_id INTEGER,
      allocation_rule_id INTEGER,
      usage REAL DEFAULT 0,
      unit_price REAL DEFAULT 0,
      amount REAL DEFAULT 0,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (meter_id) REFERENCES meters(id),
      FOREIGN KEY (meter_reading_id) REFERENCES meter_readings(id),
      FOREIGN KEY (allocation_rule_id) REFERENCES allocation_rules(id)
    );

    CREATE TABLE IF NOT EXISTS bill_operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bill_id INTEGER NOT NULL,
      operation TEXT NOT NULL,
      operator TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id)
    );

    CREATE INDEX IF NOT EXISTS idx_meter_readings_meter_date ON meter_readings(meter_id, reading_date);
    CREATE INDEX IF NOT EXISTS idx_bills_enterprise_period ON bills(enterprise_id, billing_period);
    CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
  `);

  const buildingCount = db.prepare('SELECT COUNT(*) as count FROM buildings').get().count;
  if (buildingCount === 0) {
    const buildings = [
      { name: 'A栋写字楼', address: '园区1号路', total_area: 12000 },
      { name: 'B栋研发楼', address: '园区2号路', total_area: 15000 },
      { name: 'C栋生产车间', address: '园区3号路', total_area: 20000 }
    ];

    const insertBuilding = db.prepare('INSERT INTO buildings (name, address, total_area) VALUES (?, ?, ?)');
    buildings.forEach(b => insertBuilding.run(b.name, b.address, b.total_area));

    const enterprises = [
      { name: '科技有限公司', building_id: 1, floor: '3层', room_no: '301-305', area: 500, workstations: 60, contact_person: '张经理', contact_phone: '13800138001', status: 'active', lease_start_date: '2024-01-01', lease_end_date: '2026-12-31' },
      { name: '创新科技发展公司', building_id: 1, floor: '5层', room_no: '501-508', area: 800, workstations: 100, contact_person: '李总', contact_phone: '13800138002', status: 'active', lease_start_date: '2024-03-01', lease_end_date: '2027-02-28' },
      { name: '数据服务有限公司', building_id: 2, floor: '2层', room_no: '201-210', area: 1000, workstations: 120, contact_person: '王总监', contact_phone: '13800138003', status: 'active', lease_start_date: '2023-06-01', lease_end_date: '2026-05-31' }
    ];

    const insertEnterprise = db.prepare('INSERT INTO enterprises (name, building_id, floor, room_no, area, workstations, contact_person, contact_phone, status, lease_start_date, lease_end_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    enterprises.forEach(e => insertEnterprise.run(e.name, e.building_id, e.floor, e.room_no, e.area, e.workstations, e.contact_person, e.contact_phone, e.status, e.lease_start_date, e.lease_end_date));

    const meters = [
      { meter_no: 'A-PUB-E-001', meter_name: 'A栋总电表', energy_type: 'electricity', building_id: 1, multiplier: 80, is_public: 1, status: 'active' },
      { meter_no: 'A-PUB-W-001', meter_name: 'A栋总水表', energy_type: 'water', building_id: 1, multiplier: 1, is_public: 1, status: 'active' },
      { meter_no: 'A-E-3001', meter_name: '301-305电表', energy_type: 'electricity', building_id: 1, enterprise_id: 1, multiplier: 20, is_public: 0, status: 'active' },
      { meter_no: 'A-W-3001', meter_name: '301-305水表', energy_type: 'water', building_id: 1, enterprise_id: 1, multiplier: 1, is_public: 0, status: 'active' },
      { meter_no: 'A-E-5001', meter_name: '501-508电表', energy_type: 'electricity', building_id: 1, enterprise_id: 2, multiplier: 30, is_public: 0, status: 'active' },
      { meter_no: 'A-W-5001', meter_name: '501-508水表', energy_type: 'water', building_id: 1, enterprise_id: 2, multiplier: 1, is_public: 0, status: 'active' },
      { meter_no: 'B-PUB-E-001', meter_name: 'B栋总电表', energy_type: 'electricity', building_id: 2, multiplier: 100, is_public: 1, status: 'active' },
      { meter_no: 'B-PUB-W-001', meter_name: 'B栋总水表', energy_type: 'water', building_id: 2, multiplier: 1, is_public: 1, status: 'active' },
      { meter_no: 'B-PUB-G-001', meter_name: 'B栋总气表', energy_type: 'gas', building_id: 2, multiplier: 10, is_public: 1, status: 'active' },
      { meter_no: 'B-E-2001', meter_name: '201-210电表', energy_type: 'electricity', building_id: 2, enterprise_id: 3, multiplier: 40, is_public: 0, status: 'active' },
      { meter_no: 'B-W-2001', meter_name: '201-210水表', energy_type: 'water', building_id: 2, enterprise_id: 3, multiplier: 1, is_public: 0, status: 'active' },
      { meter_no: 'B-G-2001', meter_name: '201-210气表', energy_type: 'gas', building_id: 2, enterprise_id: 3, multiplier: 5, is_public: 0, status: 'active' },
      { meter_no: 'PUB-AC-001', meter_name: '中央空调总表', energy_type: 'cooling', building_id: null, multiplier: 100, is_public: 1, status: 'active' }
    ];

    const insertMeter = db.prepare('INSERT INTO meters (meter_no, meter_name, energy_type, building_id, enterprise_id, multiplier, is_public, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    meters.forEach(m => insertMeter.run(m.meter_no, m.meter_name, m.energy_type, m.building_id, m.enterprise_id, m.multiplier, m.is_public, m.status));

    const prices = [
      { energy_type: 'electricity', price: 0.85, tax_rate: 0.13, effective_date: '2024-01-01' },
      { energy_type: 'water', price: 4.5, tax_rate: 0.09, effective_date: '2024-01-01' },
      { energy_type: 'gas', price: 3.2, tax_rate: 0.09, effective_date: '2024-01-01' },
      { energy_type: 'cooling', price: 12.0, tax_rate: 0.06, effective_date: '2024-01-01' }
    ];

    const insertPrice = db.prepare('INSERT INTO energy_prices (energy_type, price, tax_rate, effective_date) VALUES (?, ?, ?, ?)');
    prices.forEach(p => insertPrice.run(p.energy_type, p.price, p.tax_rate, p.effective_date));

    const rules = [
      { rule_name: 'A栋公共电费面积分摊', energy_type: 'electricity', allocation_type: 'area', building_id: 1, source_meter_id: 1, effective_date: '2024-01-01' },
      { rule_name: 'A栋公共水费面积分摊', energy_type: 'water', allocation_type: 'area', building_id: 1, source_meter_id: 2, effective_date: '2024-01-01' },
      { rule_name: 'B栋公共电费面积分摊', energy_type: 'electricity', allocation_type: 'area', building_id: 2, source_meter_id: 7, effective_date: '2024-01-01' },
      { rule_name: 'B栋公共水费面积分摊', energy_type: 'water', allocation_type: 'area', building_id: 2, source_meter_id: 8, effective_date: '2024-01-01' },
      { rule_name: 'B栋公共气费面积分摊', energy_type: 'gas', allocation_type: 'area', building_id: 2, source_meter_id: 9, effective_date: '2024-01-01' },
      { rule_name: '中央空调工位分摊', energy_type: 'cooling', allocation_type: 'workstation', building_id: null, source_meter_id: 13, effective_date: '2024-01-01' }
    ];

    const insertRule = db.prepare('INSERT INTO allocation_rules (rule_name, energy_type, allocation_type, building_id, source_meter_id, effective_date) VALUES (?, ?, ?, ?, ?, ?)');
    rules.forEach(r => insertRule.run(r.rule_name, r.energy_type, r.allocation_type, r.building_id, r.source_meter_id, r.effective_date));
  }
}

initDatabase();

module.exports = db;
