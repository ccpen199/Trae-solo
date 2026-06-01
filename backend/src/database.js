const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      region TEXT,
      password TEXT DEFAULT '123456',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hospitals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      level TEXT,
      province TEXT,
      city TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL,
      name TEXT NOT NULL,
      specialty TEXT,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      gender TEXT,
      title TEXT,
      specialty TEXT,
      hospital_id TEXT,
      department_id TEXT,
      phone TEXT,
      email TEXT,
      compliance_status TEXT DEFAULT 'normal',
      visit_frequency_limit INTEGER DEFAULT 4,
      preferences TEXT,
      is_restricted INTEGER DEFAULT 0,
      restricted_reason TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS visit_plans (
      id TEXT PRIMARY KEY,
      representative_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      visit_date DATE NOT NULL,
      visit_time TEXT NOT NULL,
      visit_type TEXT NOT NULL,
      purpose TEXT,
      status TEXT DEFAULT 'pending',
      is_rescheduled INTEGER DEFAULT 0,
      reschedule_reason TEXT,
      original_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (representative_id) REFERENCES users(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS visit_records (
      id TEXT PRIMARY KEY,
      plan_id TEXT,
      representative_id TEXT NOT NULL,
      doctor_id TEXT NOT NULL,
      visit_date DATE NOT NULL,
      checkin_time DATETIME,
      checkout_time DATETIME,
      location_lat REAL,
      location_lng REAL,
      location_address TEXT,
      discussion_topics TEXT,
      materials_used TEXT,
      feedback TEXT,
      follow_up_tasks TEXT,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES visit_plans(id),
      FOREIGN KEY (representative_id) REFERENCES users(id),
      FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS materials (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT,
      category TEXT,
      is_sensitive INTEGER DEFAULT 0,
      file_path TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS compliance_reviews (
      id TEXT PRIMARY KEY,
      visit_record_id TEXT,
      visit_plan_id TEXT,
      risk_type TEXT,
      risk_level TEXT,
      description TEXT,
      status TEXT DEFAULT 'pending',
      reviewer_id TEXT,
      review_notes TEXT,
      reviewed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (visit_record_id) REFERENCES visit_records(id),
      FOREIGN KEY (visit_plan_id) REFERENCES visit_plans(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS regions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT,
      manager_id TEXT,
      FOREIGN KEY (parent_id) REFERENCES regions(id),
      FOREIGN KEY (manager_id) REFERENCES users(id)
    );
  `);

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const insertUser = db.prepare('INSERT INTO users (id, username, name, role, region) VALUES (?, ?, ?, ?, ?)');
    insertUser.run('rep001', 'rep001', '张代表', 'representative', '华东区');
    insertUser.run('rep002', 'rep002', '李代表', 'representative', '华东区');
    insertUser.run('mgr001', 'mgr001', '王经理', 'manager', '华东区');
    insertUser.run('comp001', 'comp001', '赵合规', 'compliance', '总部');
    insertUser.run('market001', 'market001', '孙市场', 'marketing', '总部');
  }

  const hospitalCount = db.prepare('SELECT COUNT(*) as count FROM hospitals').get().count;
  if (hospitalCount === 0) {
    const insertHospital = db.prepare('INSERT INTO hospitals (id, name, level, province, city, address) VALUES (?, ?, ?, ?, ?, ?)');
    insertHospital.run('hosp001', '上海第一人民医院', '三甲', '上海', '上海', '上海市虹口区武进路85号');
    insertHospital.run('hosp002', '复旦大学附属中山医院', '三甲', '上海', '上海', '上海市徐汇区枫林路180号');
  }

  const deptCount = db.prepare('SELECT COUNT(*) as count FROM departments').get().count;
  if (deptCount === 0) {
    const insertDept = db.prepare('INSERT INTO departments (id, hospital_id, name, specialty) VALUES (?, ?, ?, ?)');
    insertDept.run('dept001', 'hosp001', '心内科', '心血管内科');
    insertDept.run('dept002', 'hosp001', '内分泌科', '内分泌代谢');
    insertDept.run('dept003', 'hosp002', '心内科', '心血管内科');
  }

  const doctorCount = db.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
  if (doctorCount === 0) {
    const insertDoctor = db.prepare('INSERT INTO doctors (id, name, gender, title, specialty, hospital_id, department_id, compliance_status, visit_frequency_limit, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertDoctor.run('doc001', '陈医生', '男', '主任医师', '冠心病介入', 'hosp001', 'dept001', 'normal', 4, 'mgr001');
    insertDoctor.run('doc002', '刘医生', '女', '副主任医师', '高血压', 'hosp001', 'dept001', 'normal', 4, 'mgr001');
    insertDoctor.run('doc003', '周医生', '男', '主任医师', '糖尿病', 'hosp001', 'dept002', 'restricted', 2, 'mgr001');
    insertDoctor.run('doc004', '吴医生', '男', '副主任医师', '心律失常', 'hosp002', 'dept003', 'normal', 4, 'mgr001');
  }

  const materialCount = db.prepare('SELECT COUNT(*) as count FROM materials').get().count;
  if (materialCount === 0) {
    const insertMaterial = db.prepare('INSERT INTO materials (id, name, type, category, is_sensitive, description) VALUES (?, ?, ?, ?, ?, ?)');
    insertMaterial.run('mat001', '产品说明书-降压药A', 'document', 'product', 0, '降压药A产品说明书');
    insertMaterial.run('mat002', '临床研究数据-冠心病', 'document', 'research', 1, '三期临床研究数据');
    insertMaterial.run('mat003', '患者教育手册', 'document', 'education', 0, '患者教育材料');
  }
}

initDatabase();

module.exports = db;
