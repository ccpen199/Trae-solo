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
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      org_id INTEGER,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (org_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS issues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      model_location TEXT,
      floor TEXT,
      building TEXT,
      specialty TEXT,
      issue_type TEXT,
      severity TEXT,
      screenshot TEXT,
      drawing_version TEXT,
      design_response TEXT,
      site_evidence TEXT,
      status TEXT DEFAULT 'draft',
      created_by INTEGER,
      responsible_org_id INTEGER,
      due_date DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (responsible_org_id) REFERENCES organizations(id)
    );

    CREATE TABLE IF NOT EXISTS issue_flow (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      issue_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      comment TEXT,
      attachment TEXT,
      from_org_id INTEGER,
      to_org_id INTEGER,
      operator_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
      FOREIGN KEY (from_org_id) REFERENCES organizations(id),
      FOREIGN KEY (to_org_id) REFERENCES organizations(id),
      FOREIGN KEY (operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS drawings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      version TEXT NOT NULL,
      specialty TEXT,
      file_path TEXT,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    );
  `);

  const orgCount = db.prepare('SELECT COUNT(*) as count FROM organizations').get().count;
  if (orgCount === 0) {
    const insertOrg = db.prepare('INSERT INTO organizations (name, type) VALUES (?, ?)');
    insertOrg.run('业主单位', 'owner');
    insertOrg.run('设计院', 'design');
    insertOrg.run('施工单位', 'construction');
    insertOrg.run('监理单位', 'supervision');

    const insertUser = db.prepare('INSERT INTO users (username, name, org_id, role) VALUES (?, ?, ?, ?)');
    insertUser.run('admin', '管理员', 1, 'admin');
    insertUser.run('designer', '设计师', 2, 'designer');
    insertUser.run('builder', '施工员', 3, 'builder');
    insertUser.run('supervisor', '监理', 4, 'supervisor');
  }
}

initDatabase();

module.exports = db;
