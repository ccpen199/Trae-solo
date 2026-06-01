const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_no TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      gender TEXT,
      department TEXT,
      position_id INTEGER,
      skill_level INTEGER DEFAULT 1,
      status TEXT DEFAULT 'active',
      forbidden_post TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      certificate_type TEXT NOT NULL,
      certificate_no TEXT,
      issue_date TEXT,
      expire_date TEXT,
      issuer TEXT,
      status TEXT DEFAULT 'valid',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      position_code TEXT UNIQUE NOT NULL,
      position_name TEXT NOT NULL,
      department TEXT,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS position_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      position_id INTEGER NOT NULL,
      requirement_type TEXT NOT NULL,
      requirement_content TEXT NOT NULL,
      retraining_cycle INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS training_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_code TEXT UNIQUE NOT NULL,
      course_name TEXT NOT NULL,
      course_type TEXT,
      duration INTEGER,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS training_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      training_date TEXT,
      sign_in_status TEXT DEFAULT 'pending',
      score INTEGER,
      pass_status TEXT DEFAULT 'pending',
      retake_count INTEGER DEFAULT 0,
      instructor_rating INTEGER,
      instructor_comment TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS exams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      exam_name TEXT NOT NULL,
      exam_type TEXT,
      exam_date TEXT,
      score INTEGER,
      pass_status TEXT DEFAULT 'pending',
      retake_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS authorizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      position_id INTEGER,
      authorization_type TEXT NOT NULL,
      applicant TEXT NOT NULL,
      approver TEXT,
      reason TEXT,
      effective_scope TEXT,
      start_date TEXT,
      end_date TEXT,
      status TEXT DEFAULT 'pending',
      is_temporary INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
      FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS employee_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      skill_name TEXT NOT NULL,
      skill_level INTEGER DEFAULT 1,
      acquired_date TEXT,
      expire_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_date TEXT NOT NULL,
      shift TEXT NOT NULL,
      position_id INTEGER,
      employee_id INTEGER,
      qualification_check TEXT DEFAULT 'pending',
      check_note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE SET NULL,
      FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL
    );
  `);

  const positionCount = db.prepare('SELECT COUNT(*) as count FROM positions').get().count;
  if (positionCount === 0) {
    const insertPosition = db.prepare('INSERT INTO positions (position_code, position_name, department, description) VALUES (?, ?, ?, ?)');
    insertPosition.run('OP001', '操作工', '生产部', '生产线操作工');
    insertPosition.run('OP002', '焊接工', '生产部', '焊接工位操作工');
    insertPosition.run('OP003', '电工', '设备部', '电气维修人员');
    insertPosition.run('OP004', '叉车司机', '物流部', '叉车驾驶人员');
  }

  const courseCount = db.prepare('SELECT COUNT(*) as count FROM training_courses').get().count;
  if (courseCount === 0) {
    const insertCourse = db.prepare('INSERT INTO training_courses (course_code, course_name, course_type, duration, description) VALUES (?, ?, ?, ?, ?)');
    insertCourse.run('SAFE001', '安全生产基础', '安全', 8, '工厂安全生产基础知识培训');
    insertCourse.run('SAFE002', '消防安全培训', '安全', 4, '消防安全知识和应急处理');
    insertCourse.run('TECH001', '操作技能培训', '技术', 16, '岗位操作技能基础培训');
    insertCourse.run('QUAL001', '质量管理基础', '质量', 4, '产品质量管理基础知识');
  }

  const employeeCount = db.prepare('SELECT COUNT(*) as count FROM employees').get().count;
  if (employeeCount === 0) {
    const insertEmployee = db.prepare('INSERT INTO employees (employee_no, name, gender, department, position_id, skill_level) VALUES (?, ?, ?, ?, ?, ?)');
    insertEmployee.run('E001', '张三', '男', '生产部', 1, 2);
    insertEmployee.run('E002', '李四', '男', '生产部', 2, 3);
    insertEmployee.run('E003', '王芳', '女', '设备部', 3, 2);
    insertEmployee.run('E004', '赵强', '男', '物流部', 4, 1);
  }
}

initDatabase();

module.exports = db;
