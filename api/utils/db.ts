import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = process.env.DATABASE_PATH || './data/app.sqlite';
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'ta', 'teacher', 'admin')),
      email VARCHAR(100),
      student_id VARCHAR(50),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      teacher_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) NOT NULL,
      course_id INTEGER REFERENCES courses(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS class_students (
      class_id INTEGER REFERENCES classes(id),
      student_id INTEGER REFERENCES users(id),
      PRIMARY KEY (class_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS experiments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      objectives TEXT,
      template TEXT,
      course_id INTEGER REFERENCES courses(id),
      deadline DATETIME NOT NULL,
      late_deadline DATETIME,
      status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
      version INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS rubric_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      experiment_id INTEGER REFERENCES experiments(id) ON DELETE CASCADE,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      max_score REAL NOT NULL DEFAULT 100,
      weight REAL NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS experiment_versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      experiment_id INTEGER REFERENCES experiments(id),
      version INTEGER NOT NULL,
      title VARCHAR(200) NOT NULL,
      description TEXT,
      objectives TEXT,
      deadline DATETIME,
      changed_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      experiment_id INTEGER REFERENCES experiments(id),
      student_id INTEGER REFERENCES users(id),
      status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'late', 'resubmitted', 'returned', 'graded')),
      submitted_at DATETIME,
      graded_at DATETIME,
      graded_by INTEGER REFERENCES users(id),
      total_score REAL,
      version INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(experiment_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS submission_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      file_type VARCHAR(50) NOT NULL,
      file_size INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS submission_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER REFERENCES submissions(id),
      action VARCHAR(50) NOT NULL,
      status_before VARCHAR(20),
      status_after VARCHAR(20),
      performed_by INTEGER REFERENCES users(id),
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
      rubric_item_id INTEGER REFERENCES rubric_items(id),
      score REAL NOT NULL,
      comment TEXT,
      graded_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS annotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved BOOLEAN DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS grade_archives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER REFERENCES submissions(id),
      course_id INTEGER REFERENCES courses(id),
      class_id INTEGER REFERENCES classes(id),
      experiment_id INTEGER REFERENCES experiments(id),
      student_id INTEGER REFERENCES users(id),
      total_score REAL NOT NULL,
      grading_version INTEGER NOT NULL,
      archived_by INTEGER REFERENCES users(id),
      archived_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      adjustment_reason TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_experiments_course ON experiments(course_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_experiment ON submissions(experiment_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
    CREATE INDEX IF NOT EXISTS idx_grades_submission ON grades(submission_id);
    CREATE INDEX IF NOT EXISTS idx_annotations_submission ON annotations(submission_id);
    CREATE INDEX IF NOT EXISTS idx_grade_archives_course ON grade_archives(course_id);
  `);

  const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('admin') as { count: number };
  
  if (adminCount.count === 0) {
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('admin123', salt);
    const teacherHash = bcrypt.hashSync('teacher123', salt);
    const taHash = bcrypt.hashSync('ta123', salt);
    const studentHash = bcrypt.hashSync('student123', salt);

    const insertUser = db.prepare(`
      INSERT INTO users (username, password_hash, name, role, email, student_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertUser.run('admin', adminHash, '系统管理员', 'admin', 'admin@lab.edu', null);
    insertUser.run('teacher', teacherHash, '张教授', 'teacher', 'teacher@lab.edu', null);
    insertUser.run('ta01', taHash, '李助教', 'ta', 'ta01@lab.edu', null);
    insertUser.run('student01', studentHash, '王同学', 'student', 'student01@lab.edu', '20240001');
    insertUser.run('student02', studentHash, '刘同学', 'student', 'student02@lab.edu', '20240002');

    const insertCourse = db.prepare('INSERT INTO courses (name, code, teacher_id) VALUES (?, ?, ?)');
    const courseId = insertCourse.run('计算机基础实验', 'CS101', 2).lastInsertRowid as number;

    const insertClass = db.prepare('INSERT INTO classes (name, course_id) VALUES (?, ?)');
    const classId = insertClass.run('实验班1班', courseId).lastInsertRowid as number;

    const addStudentToClass = db.prepare('INSERT INTO class_students (class_id, student_id) VALUES (?, ?)');
    addStudentToClass.run(classId, 4);
    addStudentToClass.run(classId, 5);

    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    const lateDeadline = new Date();
    lateDeadline.setDate(lateDeadline.getDate() + 10);

    const insertExperiment = db.prepare(`
      INSERT INTO experiments (title, description, objectives, course_id, deadline, late_deadline, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, 'published', ?)
    `);
    const expId = insertExperiment.run(
      '实验一：Python基础编程',
      '完成Python基础语法练习，掌握变量、循环、函数的使用',
      '1. 掌握Python基本语法\n2. 学会编写简单函数\n3. 完成指定练习题',
      courseId,
      deadline.toISOString(),
      lateDeadline.toISOString(),
      2
    ).lastInsertRowid as number;

    const insertRubric = db.prepare(`
      INSERT INTO rubric_items (experiment_id, name, description, max_score, weight, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertRubric.run(expId, '代码正确性', '程序运行结果正确', 40, 1, 1);
    insertRubric.run(expId, '代码规范', '代码格式规范，有注释', 30, 1, 2);
    insertRubric.run(expId, '实验报告', '报告内容完整，分析深入', 30, 1, 3);
  }
}

export default db;
