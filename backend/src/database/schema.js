const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'campus_edu.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      const result = stmt.run(params);
      resolve({ lastID: result.lastInsertRowid, changes: result.changes });
    } catch (error) {
      reject(error);
    }
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      const result = stmt.get(params);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    try {
      const stmt = db.prepare(sql);
      const result = stmt.all(params);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};

const initDatabase = () => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'student', 'homeroom_teacher')),
        name TEXT NOT NULL,
        gender TEXT,
        birth_date DATE,
        phone TEXT,
        email TEXT,
        address TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'suspended')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS classes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        class_name TEXT NOT NULL,
        class_code TEXT UNIQUE NOT NULL,
        grade TEXT NOT NULL,
        homeroom_teacher_id INTEGER,
        student_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'graduated')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (homeroom_teacher_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        student_number TEXT UNIQUE NOT NULL,
        class_id INTEGER,
        enrollment_date DATE NOT NULL,
        enrollment_status TEXT DEFAULT 'enrolled' CHECK(enrollment_status IN ('enrolled', 'studying', 'suspended', 'withdrawn', 'graduated')),
        major TEXT,
        admission_score REAL,
        id_card_number TEXT,
        emergency_contact TEXT,
        emergency_phone TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS teacher_profiles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        teacher_number TEXT UNIQUE NOT NULL,
        department TEXT,
        position TEXT,
        teach_subjects TEXT,
        entry_date DATE,
        teacher_qualification TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS classrooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_name TEXT NOT NULL,
        room_code TEXT UNIQUE NOT NULL,
        building TEXT NOT NULL,
        floor INTEGER,
        capacity INTEGER NOT NULL,
        equipment TEXT,
        status TEXT DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'maintenance')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_name TEXT NOT NULL,
        course_code TEXT UNIQUE NOT NULL,
        course_type TEXT NOT NULL CHECK(course_type IN ('required', 'elective', 'optional')),
        credits REAL NOT NULL,
        hours INTEGER NOT NULL,
        department TEXT,
        description TEXT,
        prerequisite TEXT,
        max_students INTEGER DEFAULT 30,
        min_students INTEGER DEFAULT 5,
        teacher_id INTEGER,
        term TEXT NOT NULL,
        academic_year TEXT NOT NULL,
        status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'cancelled', 'completed')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        classroom_id INTEGER,
        class_id INTEGER,
        day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        week_type TEXT DEFAULT 'all' CHECK(week_type IN ('all', 'odd', 'even')),
        term TEXT NOT NULL,
        academic_year TEXT NOT NULL,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled', 'modified')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id),
        FOREIGN KEY (teacher_id) REFERENCES users(id),
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
        FOREIGN KEY (class_id) REFERENCES classes(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        schedule_id INTEGER,
        enroll_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'enrolled' CHECK(status IN ('enrolled', 'dropped', 'pending')),
        drop_time TIMESTAMP,
        term TEXT NOT NULL,
        academic_year TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (course_id) REFERENCES courses(id),
        FOREIGN KEY (schedule_id) REFERENCES schedules(id),
        UNIQUE(student_id, course_id, term, academic_year)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS attendances (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        schedule_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        attendance_date DATE NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('present', 'late', 'early_leave', 'absent', 'leave')),
        remark TEXT,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (schedule_id) REFERENCES schedules(id),
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (teacher_id) REFERENCES users(id),
        FOREIGN KEY (course_id) REFERENCES courses(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        course_id INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        enrollment_id INTEGER,
        usual_score REAL DEFAULT 0,
        midterm_score REAL DEFAULT 0,
        final_score REAL DEFAULT 0,
        total_score REAL,
        grade_point REAL,
        grade_level TEXT CHECK(grade_level IN ('A', 'B', 'C', 'D', 'F')),
        rank INTEGER,
        status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'submitted', 'approved', 'archived')),
        term TEXT NOT NULL,
        academic_year TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id),
        FOREIGN KEY (course_id) REFERENCES courses(id),
        FOREIGN KEY (teacher_id) REFERENCES users(id),
        FOREIGN KEY (enrollment_id) REFERENCES enrollments(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS archives (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        archive_type TEXT NOT NULL CHECK(archive_type IN ('student', 'course', 'grade', 'attendance', 'schedule')),
        reference_id INTEGER NOT NULL,
        archive_name TEXT NOT NULL,
        archive_data TEXT,
        file_path TEXT,
        archived_by INTEGER NOT NULL,
        archive_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        term TEXT,
        academic_year TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'deleted')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (archived_by) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS operation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        operation_type TEXT NOT NULL,
        module_name TEXT NOT NULL,
        description TEXT,
        request_data TEXT,
        response_data TEXT,
        ip_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    console.log('数据库表初始化完成');
    
    insertInitialData();
    
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
};

const insertInitialData = () => {
  const bcrypt = require('bcryptjs');
  
  const existingUsers = getQuery('SELECT COUNT(*) as count FROM users');
  if (existingUsers.count > 0) {
    console.log('已有初始数据，跳过插入');
    return;
  }

  const hashedPassword = bcrypt.hashSync('123456', 10);

  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, name, phone, email, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertStudentUser = db.prepare(`
    INSERT INTO users (username, password, role, name, gender, phone, email, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTeacherProfile = db.prepare(`
    INSERT INTO teacher_profiles (user_id, teacher_number, department, position, teach_subjects, entry_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertClass = db.prepare(`
    INSERT INTO classes (class_name, class_code, grade, homeroom_teacher_id, student_count, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertStudentProfile = db.prepare(`
    INSERT INTO student_profiles (user_id, student_number, class_id, enrollment_date, enrollment_status, major, admission_score)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertClassroom = db.prepare(`
    INSERT INTO classrooms (room_name, room_code, building, floor, capacity, equipment, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCourse = db.prepare(`
    INSERT INTO courses (course_name, course_code, course_type, credits, hours, department, description, max_students, teacher_id, term, academic_year, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSchedule = db.prepare(`
    INSERT INTO schedules (course_id, teacher_id, classroom_id, class_id, day_of_week, start_time, end_time, week_type, term, academic_year, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('admin', hashedPassword, 'admin', '张教务', '13800138001', 'admin@campus.edu', 'active');
  insertUser.run('homeroom1', hashedPassword, 'homeroom_teacher', '李班主任', '13800138002', 'homeroom1@campus.edu', 'active');
  insertUser.run('teacher1', hashedPassword, 'teacher', '王教师', '13800138003', 'teacher1@campus.edu', 'active');
  insertUser.run('teacher2', hashedPassword, 'teacher', '赵教师', '13800138004', 'teacher2@campus.edu', 'active');
  
  insertStudentUser.run('student1', hashedPassword, 'student', '学生一', 'male', '13900139001', 'student1@campus.edu', 'active');
  insertStudentUser.run('student2', hashedPassword, 'student', '学生二', 'female', '13900139002', 'student2@campus.edu', 'active');
  insertStudentUser.run('student3', hashedPassword, 'student', '学生三', 'male', '13900139003', 'student3@campus.edu', 'active');

  insertTeacherProfile.run(3, 'T2024001', '计算机学院', '讲师', '程序设计,数据结构', '2020-09-01');
  insertTeacherProfile.run(4, 'T2024002', '计算机学院', '副教授', '数据库原理,软件工程', '2018-09-01');

  insertClass.run('计算机2401班', 'CS202401', '2024级', 2, 3, 'active');

  insertStudentProfile.run(5, 'S20240001', 1, '2024-09-01', 'studying', '计算机科学与技术', 580.5);
  insertStudentProfile.run(6, 'S20240002', 1, '2024-09-01', 'studying', '计算机科学与技术', 578.0);
  insertStudentProfile.run(7, 'S20240003', 1, '2024-09-01', 'studying', '计算机科学与技术', 585.5);

  insertClassroom.run('多媒体教室1', 'M101', '教学楼A', 1, 50, '投影仪,音响,电脑', 'available');
  insertClassroom.run('计算机实验室1', 'L201', '实验楼B', 2, 40, '计算机,投影仪,网络', 'available');

  insertCourse.run('程序设计基础', 'CS101', 'required', 3.0, 48, '计算机学院', '计算机编程入门课程', 50, 3, '第1学期', '2024-2025学年', 'published');
  insertCourse.run('数据结构', 'CS201', 'required', 4.0, 64, '计算机学院', '数据结构与算法设计', 45, 4, '第1学期', '2024-2025学年', 'published');
  insertCourse.run('数据库原理', 'CS301', 'elective', 3.0, 48, '计算机学院', '数据库系统原理与应用', 40, 4, '第1学期', '2024-2025学年', 'published');

  insertSchedule.run(1, 3, 1, 1, 1, '08:00', '09:40', 'all', '第1学期', '2024-2025学年', 'active');
  insertSchedule.run(2, 4, 2, 1, 2, '10:00', '11:40', 'all', '第1学期', '2024-2025学年', 'active');
  insertSchedule.run(1, 3, 1, 1, 3, '14:00', '15:40', 'all', '第1学期', '2024-2025学年', 'active');
  insertSchedule.run(3, 4, 1, 1, 4, '08:00', '09:40', 'all', '第1学期', '2024-2025学年', 'active');
  insertSchedule.run(2, 4, 2, 1, 5, '10:00', '11:40', 'all', '第1学期', '2024-2025学年', 'active');

  const insertEnrollment = db.prepare(`
    INSERT INTO enrollments (student_id, course_id, schedule_id, term, academic_year, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertAttendance = db.prepare(`
    INSERT INTO attendances (schedule_id, student_id, teacher_id, course_id, attendance_date, status, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertGrade = db.prepare(`
    INSERT INTO grades (student_id, course_id, teacher_id, enrollment_id, usual_score, midterm_score, final_score, total_score, grade_point, grade_level, status, term, academic_year)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEnrollment.run(5, 1, 1, '第1学期', '2024-2025学年', 'enrolled');
  insertEnrollment.run(5, 2, 2, '第1学期', '2024-2025学年', 'enrolled');
  insertEnrollment.run(5, 3, 4, '第1学期', '2024-2025学年', 'enrolled');
  insertEnrollment.run(6, 1, 1, '第1学期', '2024-2025学年', 'enrolled');
  insertEnrollment.run(6, 2, 2, '第1学期', '2024-2025学年', 'enrolled');
  insertEnrollment.run(7, 1, 1, '第1学期', '2024-2025学年', 'enrolled');
  insertEnrollment.run(7, 3, 4, '第1学期', '2024-2025学年', 'enrolled');

  const attendanceDates = ['2024-09-02', '2024-09-04', '2024-09-09', '2024-09-11', '2024-09-16'];
  const attendanceStatuses = ['present', 'present', 'late', 'present', 'absent'];
  
  for (let i = 0; i < attendanceDates.length; i++) {
    insertAttendance.run(1, 5, 3, 1, attendanceDates[i], attendanceStatuses[i], '');
    insertAttendance.run(1, 6, 3, 1, attendanceDates[i], 'present', '');
    insertAttendance.run(1, 7, 3, 1, attendanceDates[i], i === 2 ? 'leave' : 'present', i === 2 ? '请假' : '');
  }

  for (let i = 0; i < 3; i++) {
    insertAttendance.run(2, 5, 4, 2, attendanceDates[i], 'present', '');
    insertAttendance.run(2, 6, 4, 2, attendanceDates[i], i === 1 ? 'late' : 'present', '');
  }

  const calculateGradePoint = (score) => {
    if (score >= 90) return { gp: 4.0, level: 'A' };
    if (score >= 80) return { gp: 3.0, level: 'B' };
    if (score >= 70) return { gp: 2.0, level: 'C' };
    if (score >= 60) return { gp: 1.0, level: 'D' };
    return { gp: 0.0, level: 'F' };
  };

  const student1Grades = [
    { courseId: 1, teacherId: 3, enrollmentId: 1, usual: 88, midterm: 85, final: 90 },
    { courseId: 2, teacherId: 4, enrollmentId: 2, usual: 92, midterm: 88, final: 95 },
    { courseId: 3, teacherId: 4, enrollmentId: 3, usual: 85, midterm: 82, final: 80 }
  ];

  const student2Grades = [
    { courseId: 1, teacherId: 3, enrollmentId: 4, usual: 78, midterm: 75, final: 80 },
    { courseId: 2, teacherId: 4, enrollmentId: 5, usual: 82, midterm: 78, final: 75 }
  ];

  const student3Grades = [
    { courseId: 1, teacherId: 3, enrollmentId: 6, usual: 95, midterm: 92, final: 98 },
    { courseId: 3, teacherId: 4, enrollmentId: 7, usual: 90, midterm: 88, final: 92 }
  ];

  [student1Grades, student2Grades, student3Grades].forEach((grades, idx) => {
    const studentId = 5 + idx;
    grades.forEach(g => {
      const totalScore = g.usual * 0.3 + g.midterm * 0.3 + g.final * 0.4;
      const { gp, level } = calculateGradePoint(totalScore);
      insertGrade.run(studentId, g.courseId, g.teacherId, g.enrollmentId, g.usual, g.midterm, g.final, Math.round(totalScore * 100) / 100, gp, level, 'approved', '第1学期', '2024-2025学年');
    });
  });

  console.log('初始数据插入完成，包括选课、考勤和成绩记录');
};

module.exports = {
  db,
  runQuery,
  getQuery,
  allQuery,
  initDatabase
};
