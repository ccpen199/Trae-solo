const initSchema = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  grade INTEGER NOT NULL,
  class_name TEXT NOT NULL,
  gender TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evaluation_dimensions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  weight REAL DEFAULT 1,
  applicable_grades TEXT,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evaluation_indicators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dimension_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  max_score REAL DEFAULT 10,
  weight REAL DEFAULT 1,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dimension_id) REFERENCES evaluation_dimensions(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS evaluation_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  indicator_id INTEGER,
  dimension_id INTEGER,
  type TEXT NOT NULL,
  score REAL DEFAULT 0,
  reason TEXT,
  comment TEXT,
  activity_proof TEXT,
  is_sensitive BOOLEAN DEFAULT 0,
  created_by INTEGER NOT NULL,
  semester TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (indicator_id) REFERENCES evaluation_indicators(id),
  FOREIGN KEY (dimension_id) REFERENCES evaluation_dimensions(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS record_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES evaluation_records(id),
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS appeals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL,
  student_id INTEGER NOT NULL,
  appellant_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  supplementary_materials TEXT,
  status TEXT DEFAULT 'pending',
  conclusion TEXT,
  handled_by INTEGER,
  handled_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES evaluation_records(id),
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (appellant_id) REFERENCES users(id),
  FOREIGN KEY (handled_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS archives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  semester TEXT NOT NULL,
  overall_score REAL,
  dimension_scores TEXT,
  record_ids TEXT,
  is_archived BOOLEAN DEFAULT 0,
  archived_by INTEGER,
  archived_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id),
  FOREIGN KEY (archived_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS archive_modifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  archive_id INTEGER NOT NULL,
  modified_by INTEGER NOT NULL,
  change_reason TEXT NOT NULL,
  change_content TEXT,
  approval_status TEXT DEFAULT 'pending',
  approved_by INTEGER,
  approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (archive_id) REFERENCES archives(id),
  FOREIGN KEY (modified_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS dimension_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version_number INTEGER NOT NULL,
  dimension_data TEXT NOT NULL,
  created_by INTEGER,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
`;

module.exports = initSchema;
