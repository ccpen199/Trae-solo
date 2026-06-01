const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const db = new Database(dbPath);

console.log('数据库连接成功');

const initSchema = `
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
  dimension_id INTEGER,
  indicator_id INTEGER,
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
  FOREIGN KEY (dimension_id) REFERENCES evaluation_dimensions(id),
  FOREIGN KEY (indicator_id) REFERENCES evaluation_indicators(id),
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

db.exec(initSchema);
console.log('表结构初始化成功');

function initInitialData() {
  const bcrypt = require('bcryptjs');
  const defaultPassword = bcrypt.hashSync('123456', 10);
  
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (username, password, name, role) VALUES (?, ?, ?, ?)
  `);
  
  insertUser.run('admin', defaultPassword, '系统管理员', 'admin');
  insertUser.run('moral', defaultPassword, '德育处老师', 'moral');
  insertUser.run('teacher1', defaultPassword, '张老师', 'head_teacher');
  insertUser.run('teacher2', defaultPassword, '李老师', 'subject_teacher');
  insertUser.run('parent1', defaultPassword, '王家长', 'parent');
  console.log('用户数据初始化成功');

  const insertStudent = db.prepare(`
    INSERT OR IGNORE INTO students (student_no, name, grade, class_name, gender, parent_name, parent_phone) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertStudent.run('2024001', '张三', 7, '初一1班', '男', '张爸爸', '13800138001');
  insertStudent.run('2024002', '李四', 7, '初一1班', '女', '李妈妈', '13800138002');
  insertStudent.run('2024003', '王五', 7, '初一2班', '男', '王爸爸', '13800138003');
  insertStudent.run('2024004', '赵六', 8, '初二1班', '女', '赵妈妈', '13800138004');
  insertStudent.run('2024005', '孙七', 8, '初二1班', '男', '孙爸爸', '13800138005');
  console.log('学生数据初始化成功');

  const insertDimension = db.prepare(`
    INSERT OR IGNORE INTO evaluation_dimensions (name, code, description, weight, applicable_grades, version, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertDimension.run('品德发展', 'morality', '包括思想品德、行为习惯、社会责任等', 1.0, '7,8,9', 1, 1, 1);
  insertDimension.run('学业水平', 'academic', '包括学习成绩、学习态度、学习能力等', 1.0, '7,8,9', 1, 1, 1);
  insertDimension.run('身心健康', 'physical', '包括体育锻炼、心理健康、身体素质等', 1.0, '7,8,9', 1, 1, 1);
  insertDimension.run('艺术素养', 'art', '包括审美能力、艺术表现、文化理解等', 1.0, '7,8,9', 1, 1, 1);
  insertDimension.run('劳动意识', 'labor', '包括劳动态度、劳动技能、劳动习惯等', 1.0, '7,8,9', 1, 1, 1);
  insertDimension.run('社会实践', 'social', '包括社会参与、志愿服务、实践能力等', 1.0, '7,8,9', 1, 1, 1);
  console.log('评价维度初始化成功');
}

initInitialData();

module.exports = db;
