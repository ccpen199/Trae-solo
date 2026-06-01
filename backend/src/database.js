const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const dbDir = path.join(__dirname, '../data')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const dbPath = path.join(dbDir, 'app.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      industry TEXT,
      risk_level TEXT DEFAULT 'medium',
      fire_facilities TEXT,
      responsible_person TEXT,
      phone TEXT,
      is_focus INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inspection_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER NOT NULL,
      plan_date DATE NOT NULL,
      inspector TEXT,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (unit_id) REFERENCES units(id)
    );

    CREATE TABLE IF NOT EXISTS inspection_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER,
      unit_id INTEGER NOT NULL,
      inspector TEXT,
      inspection_date DATE NOT NULL,
      fire_extinguisher TEXT,
      fire_extinguisher_photo TEXT,
      evacuation_route TEXT,
      evacuation_route_photo TEXT,
      electrical_circuit TEXT,
      electrical_circuit_photo TEXT,
      control_room TEXT,
      control_room_photo TEXT,
      other_issues TEXT,
      overall_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (unit_id) REFERENCES units(id),
      FOREIGN KEY (plan_id) REFERENCES inspection_plans(id)
    );

    CREATE TABLE IF NOT EXISTS hazards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      unit_id INTEGER NOT NULL,
      hazard_type TEXT NOT NULL,
      description TEXT NOT NULL,
      photo TEXT,
      status TEXT DEFAULT 'pending',
      level TEXT DEFAULT 'general',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (record_id) REFERENCES inspection_records(id),
      FOREIGN KEY (unit_id) REFERENCES units(id)
    );

    CREATE TABLE IF NOT EXISTS rectifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hazard_id INTEGER NOT NULL,
      unit_id INTEGER NOT NULL,
      responsible_person TEXT NOT NULL,
      deadline DATE NOT NULL,
      measures TEXT,
      attachment_required INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      actual_completion_date DATE,
      escalation_level INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (hazard_id) REFERENCES hazards(id),
      FOREIGN KEY (unit_id) REFERENCES units(id)
    );

    CREATE TABLE IF NOT EXISTS rechecks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rectification_id INTEGER NOT NULL,
      hazard_id INTEGER NOT NULL,
      unit_id INTEGER NOT NULL,
      rechecker TEXT,
      recheck_date DATE,
      is_passed INTEGER DEFAULT 0,
      need_again_rectify INTEGER DEFAULT 0,
      punishment_suggestion TEXT,
      close_evidence TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (rectification_id) REFERENCES rectifications(id),
      FOREIGN KEY (hazard_id) REFERENCES hazards(id),
      FOREIGN KEY (unit_id) REFERENCES units(id)
    );

    CREATE INDEX IF NOT EXISTS idx_units_risk ON units(risk_level);
    CREATE INDEX IF NOT EXISTS idx_hazards_status ON hazards(status);
    CREATE INDEX IF NOT EXISTS idx_rectifications_deadline ON rectifications(deadline);
    CREATE INDEX IF NOT EXISTS idx_rectifications_status ON rectifications(status);
  `)

  const unitCount = db.prepare('SELECT COUNT(*) as count FROM units').get().count
  if (unitCount === 0) {
    const insertUnit = db.prepare(`
      INSERT INTO units (name, address, industry, risk_level, fire_facilities, responsible_person, phone, is_focus)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const units = [
      ['宏业大厦', '北京市朝阳区建国路88号', '商业办公', 'high', '灭火器、消火栓、喷淋系统', '张三', '13800138001', 1],
      ['阳光小区', '北京市海淀区中关村大街1号', '住宅小区', 'medium', '灭火器、消火栓', '李四', '13800138002', 0],
      ['幸福超市', '北京市西城区西单北大街100号', '零售商业', 'high', '灭火器、消火栓、喷淋、烟感', '王五', '13800138003', 1],
      ['康乐酒店', '北京市东城区王府井大街50号', '酒店宾馆', 'medium', '灭火器、消火栓、喷淋系统', '赵六', '13800138004', 0],
      ['创新工厂', '北京市亦庄经济开发区科创路200号', '工业生产', 'high', '灭火器、消火栓、喷淋、消防栓', '钱七', '13800138005', 1]
    ]
    units.forEach(u => insertUnit.run(...u))
  }
}

initDatabase()

module.exports = db
