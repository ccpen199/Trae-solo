const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'app.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      supplier TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS processes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      description TEXT,
      equipment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS hazards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      process_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL,
      likelihood TEXT NOT NULL,
      is_significant INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (process_id) REFERENCES processes(id)
    );

    CREATE TABLE IF NOT EXISTS ccps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      process_id INTEGER NOT NULL,
      hazard_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      limit_type TEXT NOT NULL,
      critical_limit TEXT NOT NULL,
      monitoring_method TEXT NOT NULL,
      monitoring_frequency TEXT NOT NULL,
      responsible_role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (process_id) REFERENCES processes(id),
      FOREIGN KEY (hazard_id) REFERENCES hazards(id)
    );

    CREATE TABLE IF NOT EXISTS process_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      version TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      approved_by INTEGER,
      approved_at DATETIME,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (approved_by) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_no TEXT UNIQUE NOT NULL,
      product_id INTEGER NOT NULL,
      quantity REAL,
      unit TEXT,
      production_date DATE NOT NULL,
      status TEXT DEFAULT 'in_progress',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS monitoring_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_id INTEGER NOT NULL,
      ccp_id INTEGER NOT NULL,
      process_id INTEGER NOT NULL,
      equipment TEXT,
      operator_id INTEGER NOT NULL,
      record_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      temperature REAL,
      time_value REAL,
      metal_detected INTEGER DEFAULT 0,
      cleanliness TEXT,
      other_data TEXT,
      is_violation INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (batch_id) REFERENCES batches(id),
      FOREIGN KEY (ccp_id) REFERENCES ccps(id),
      FOREIGN KEY (process_id) REFERENCES processes(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monitoring_record_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (monitoring_record_id) REFERENCES monitoring_records(id)
    );

    CREATE TABLE IF NOT EXISTS corrective_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id INTEGER NOT NULL,
      batch_id INTEGER NOT NULL,
      violation_cause TEXT NOT NULL,
      isolation_details TEXT,
      treatment_measures TEXT NOT NULL,
      retest_result TEXT,
      responsible_id INTEGER NOT NULL,
      completed_at DATETIME,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (alert_id) REFERENCES alerts(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id),
      FOREIGN KEY (responsible_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      location TEXT,
      last_calibration_date DATE,
      next_calibration_date DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS training_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      training_name TEXT NOT NULL,
      training_date DATE NOT NULL,
      trainer TEXT,
      certificate_no TEXT,
      expiry_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS internal_audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_no TEXT UNIQUE NOT NULL,
      audit_date DATE NOT NULL,
      auditor TEXT NOT NULL,
      department TEXT,
      findings TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS corrective_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_id INTEGER,
      description TEXT NOT NULL,
      responsible_id INTEGER NOT NULL,
      deadline DATE,
      completed_at DATETIME,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (audit_id) REFERENCES internal_audits(id),
      FOREIGN KEY (responsible_id) REFERENCES users(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, name, role, department) VALUES (?, ?, ?, ?)
    `);
    insertUser.run('admin', '系统管理员', 'admin', '信息部');
    insertUser.run('quality', '品控主管', 'quality', '品控部');
    insertUser.run('production', '生产主管', 'production', '生产部');
    insertUser.run('warehouse', '仓储主管', 'warehouse', '仓储部');
    insertUser.run('manager', '经理', 'manager', '管理层');
  }

  const productCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
  if (productCount === 0) {
    const insertProduct = db.prepare(`
      INSERT INTO products (code, name, description) VALUES (?, ?, ?)
    `);
    insertProduct.run('SAUCE-001', '经典番茄沙司', '采用新鲜番茄制作的调味酱');
    insertProduct.run('SAUCE-002', '辣味烧烤酱', '适合烧烤的辣味调味酱');
  }

  const materialCount = db.prepare('SELECT COUNT(*) as count FROM materials').get().count;
  if (materialCount === 0) {
    const insertMaterial = db.prepare(`
      INSERT INTO materials (code, name, type, supplier) VALUES (?, ?, ?, ?)
    `);
    insertMaterial.run('MAT-001', '新鲜番茄', '原料', '番茄农场A');
    insertMaterial.run('MAT-002', '食用盐', '辅料', '盐业公司B');
    insertMaterial.run('MAT-003', '白砂糖', '辅料', '糖业公司C');
  }

  const equipmentCount = db.prepare('SELECT COUNT(*) as count FROM equipment').get().count;
  if (equipmentCount === 0) {
    const insertEquipment = db.prepare(`
      INSERT INTO equipment (code, name, location, last_calibration_date, next_calibration_date) VALUES (?, ?, ?, ?, ?)
    `);
    insertEquipment.run('EQ-001', '杀菌锅#1', '生产车间A', '2026-01-15', '2026-07-15');
    insertEquipment.run('EQ-002', '金属检测仪#1', '包装车间', '2026-02-01', '2026-08-01');
    insertEquipment.run('EQ-003', '温度计#1', '生产车间A', '2026-03-01', '2026-09-01');
  }
}

initDatabase();

module.exports = db;
