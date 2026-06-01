const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', '..', 'data', 'app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS applicants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      id_card TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS material_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      validity_days INTEGER DEFAULT 365,
      is_sensitive INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS service_item_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      service_item_id INTEGER NOT NULL,
      material_type_id INTEGER NOT NULL,
      is_required INTEGER DEFAULT 1,
      need_resign INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (service_item_id) REFERENCES service_items(id),
      FOREIGN KEY (material_type_id) REFERENCES material_types(id)
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_id INTEGER NOT NULL,
      material_type_id INTEGER NOT NULL,
      source_service_item_id INTEGER,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      file_hash TEXT,
      status TEXT DEFAULT 'valid',
      effective_date DATE,
      expiry_date DATE,
      source TEXT,
      is_sensitive INTEGER DEFAULT 0,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (applicant_id) REFERENCES applicants(id),
      FOREIGN KEY (material_type_id) REFERENCES material_types(id),
      FOREIGN KEY (source_service_item_id) REFERENCES service_items(id)
    );

    CREATE TABLE IF NOT EXISTS authorizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material_id INTEGER NOT NULL,
      applicant_id INTEGER NOT NULL,
      department TEXT NOT NULL,
      purpose TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status TEXT DEFAULT 'active',
      consented_at DATETIME,
      consented_by INTEGER,
      withdrawn_at DATETIME,
      withdrawn_by INTEGER,
      withdraw_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (material_id) REFERENCES materials(id),
      FOREIGN KEY (applicant_id) REFERENCES applicants(id)
    );

    CREATE TABLE IF NOT EXISTS service_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicant_id INTEGER NOT NULL,
      service_item_id INTEGER NOT NULL,
      application_no TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (applicant_id) REFERENCES applicants(id),
      FOREIGN KEY (service_item_id) REFERENCES service_items(id)
    );

    CREATE TABLE IF NOT EXISTS application_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL,
      material_id INTEGER,
      material_type_id INTEGER NOT NULL,
      usage_type TEXT DEFAULT 'new',
      reuse_reason TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES service_applications(id),
      FOREIGN KEY (material_id) REFERENCES materials(id),
      FOREIGN KEY (material_type_id) REFERENCES material_types(id)
    );

    CREATE TABLE IF NOT EXISTS corrections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_material_id INTEGER NOT NULL,
      application_id INTEGER NOT NULL,
      corrector_id INTEGER,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      FOREIGN KEY (application_material_id) REFERENCES application_materials(id),
      FOREIGN KEY (application_id) REFERENCES service_applications(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      resource_type TEXT,
      resource_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const stmt = db.prepare('SELECT COUNT(*) as count FROM material_types');
  if (stmt.get().count === 0) {
    const insertMaterialType = db.prepare('INSERT INTO material_types (code, name, description, validity_days, is_sensitive) VALUES (?, ?, ?, ?, ?)');
    insertMaterialType.run('SFZ', '身份证', '个人身份证明', 3650, 1);
    insertMaterialType.run('HKZ', '户口本', '户籍证明', 3650, 1);
    insertMaterialType.run('JZZ', '居住证', '居住证明', 365, 0);
    insertMaterialType.run('HKSYQZ', '房屋所有权证', '房产证明', 3650, 1);
    insertMaterialType.run('JSZ', '结婚证', '婚姻证明', 3650, 1);
    insertMaterialType.run('SMD', '身份证明', '通用身份证明', 365, 0);
    insertMaterialType.run('PXM', '票息证明', '收入证明', 180, 0);
  }

  const stmt2 = db.prepare('SELECT COUNT(*) as count FROM service_items');
  if (stmt2.get().count === 0) {
    const insertServiceItem = db.prepare('INSERT INTO service_items (code, name, department, description) VALUES (?, ?, ?, ?)');
    insertServiceItem.run('FWBZ', '房屋备案', '住建局', '房屋租赁备案');
    insertServiceItem.run('JSBZ', '结婚办证', '民政局', '婚姻登记');
    insertServiceItem.run('ZZSQ', '执照申请', '市场监管局', '营业执照申请');
    insertServiceItem.run('JZSQ', '居住证申请', '公安局', '居住证办理');
    
    const simStmt = db.prepare('INSERT INTO service_item_materials (service_item_id, material_type_id, is_required) VALUES (?, ?, ?)');
    simStmt.run(1, 1, 1);
    simStmt.run(1, 3, 1);
    simStmt.run(1, 4, 1);
    simStmt.run(2, 1, 1);
    simStmt.run(2, 2, 1);
    simStmt.run(2, 5, 0);
    simStmt.run(3, 1, 1);
    simStmt.run(3, 6, 1);
    simStmt.run(3, 7, 0);
    simStmt.run(4, 1, 1);
    simStmt.run(4, 2, 1);
  }

  const stmt3 = db.prepare('SELECT COUNT(*) as count FROM users');
  if (stmt3.get().count === 0) {
    const bcrypt = require('bcrypt');
    const insertUser = db.prepare('INSERT INTO users (username, password, name, role, department) VALUES (?, ?, ?, ?, ?)');
    insertUser.run('admin', bcrypt.hashSync('admin123', 10), '系统管理员', 'admin', '系统');
    insertUser.run('window', bcrypt.hashSync('window123', 10), '窗口工作人员', 'window', '综合窗口');
    insertUser.run('approver', bcrypt.hashSync('approver123', 10), '审批人员', 'approver', '审批科');
  }
}

initDatabase();

module.exports = db;
