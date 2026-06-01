const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON`);

  db.run(`
    CREATE TABLE IF NOT EXISTS pathways (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      disease TEXT NOT NULL,
      stage TEXT,
      description TEXT,
      version TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      created_by TEXT,
      reviewed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      published_at DATETIME
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pathway_drugs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pathway_id INTEGER NOT NULL,
      drug_name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT NOT NULL,
      route TEXT,
      contraindications TEXT,
      adjustment_conditions TEXT,
      notes TEXT,
      FOREIGN KEY (pathway_id) REFERENCES pathways(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gender TEXT,
      age INTEGER,
      medical_record_no TEXT UNIQUE,
      diagnosis TEXT,
      allergy_history TEXT,
      liver_function TEXT,
      kidney_function TEXT,
      lab_results TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS patient_pathways (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      pathway_id INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_date DATETIME,
      risk_factors TEXT,
      concurrent_medications TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
      FOREIGN KEY (pathway_id) REFERENCES pathways(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_pathway_id INTEGER NOT NULL,
      drug_name TEXT NOT NULL,
      dosage TEXT NOT NULL,
      frequency TEXT NOT NULL,
      duration TEXT,
      doctor_id TEXT,
      doctor_name TEXT,
      is_off_pathway INTEGER DEFAULT 0,
      approval_status TEXT DEFAULT 'pending',
      pharmacist_id TEXT,
      pharmacist_comment TEXT,
      doctor_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      FOREIGN KEY (patient_pathway_id) REFERENCES patient_pathways(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS adverse_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_pathway_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      severity TEXT,
      description TEXT,
      drug_name TEXT,
      onset_date DATETIME,
      outcome TEXT,
      reporter TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_pathway_id) REFERENCES patient_pathways(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS efficacy_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_pathway_id INTEGER NOT NULL,
      feedback_type TEXT,
      description TEXT,
      outcome TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_pathway_id) REFERENCES patient_pathways(id) ON DELETE CASCADE
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pathway_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pathway_id INTEGER NOT NULL,
      version TEXT NOT NULL,
      change_log TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pathway_id) REFERENCES pathways(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      record_id INTEGER,
      user_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const stmt = db.prepare(`SELECT COUNT(*) as count FROM pathways`);
  stmt.get((err, row) => {
    if (row.count === 0) {
      const pathwayStmt = db.prepare(`
        INSERT INTO pathways (name, disease, stage, description, version, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      pathwayStmt.run(
        '社区获得性肺炎标准路径',
        '社区获得性肺炎',
        '普通型',
        '适用于18-65岁普通型社区获得性肺炎患者',
        'v1.0',
        'published',
        'system'
      );
      
      pathwayStmt.finalize();

      db.get(`SELECT id FROM pathways WHERE name = ?`, ['社区获得性肺炎标准路径'], (err, pathway) => {
        if (pathway) {
          const drugStmt = db.prepare(`
            INSERT INTO pathway_drugs (pathway_id, drug_name, dosage, frequency, duration, route, contraindications, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `);
          
          drugStmt.run(
            pathway.id,
            '阿莫西林克拉维酸钾',
            '0.625g',
            'q8h',
            '7-14天',
            '口服',
            '青霉素过敏者禁用',
            '饭后服用'
          );
          
          drugStmt.run(
            pathway.id,
            '莫西沙星',
            '0.4g',
            'qd',
            '7-14天',
            '口服',
            '喹诺酮类过敏者禁用，18岁以下禁用',
            '注意QT间期延长风险'
          );
          
          drugStmt.finalize();
        }
      });
    }
  });

  const patientStmt = db.prepare(`SELECT COUNT(*) as count FROM patients`);
  patientStmt.get((err, row) => {
    if (row.count === 0) {
      const insertPatient = db.prepare(`
        INSERT INTO patients (name, gender, age, medical_record_no, diagnosis, allergy_history, liver_function, kidney_function)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertPatient.run(
        '张三',
        '男',
        45,
        'MR20240001',
        '社区获得性肺炎',
        '无药物过敏史',
        '正常',
        '正常'
      );
      
      insertPatient.finalize();
    }
  });
});

module.exports = db;
