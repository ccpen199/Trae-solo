import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data', 'app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'dean', 'teacher', 'student')),
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      credit INTEGER NOT NULL DEFAULT 0,
      hours INTEGER NOT NULL DEFAULT 0,
      course_type TEXT NOT NULL DEFAULT 'normal' CHECK(course_type IN ('normal', 'experiment', 'practice')),
      department_id INTEGER,
      description TEXT,
      experiment_requirements TEXT,
      need_odd_even BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      title TEXT,
      department_id INTEGER,
      teacher_no TEXT UNIQUE NOT NULL,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      grade INTEGER NOT NULL,
      student_count INTEGER NOT NULL DEFAULT 0,
      department_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      student_no TEXT UNIQUE NOT NULL,
      class_id INTEGER,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS classrooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      building TEXT NOT NULL,
      room_no TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 0,
      classroom_type TEXT NOT NULL DEFAULT 'normal' CHECK(classroom_type IN ('normal', 'experiment', 'multimedia', 'lecture')),
      equipment TEXT,
      status TEXT DEFAULT 'available' CHECK(status IN ('available', 'maintenance', 'disabled')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(building, room_no)
    );

    CREATE TABLE IF NOT EXISTS calendar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      semester TEXT NOT NULL,
      week_no INTEGER NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      is_holiday BOOLEAN DEFAULT 0,
      holiday_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(semester, week_no)
    );

    CREATE TABLE IF NOT EXISTS time_slots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_no INTEGER NOT NULL UNIQUE,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teacher_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
      slot_id INTEGER NOT NULL,
      semester TEXT NOT NULL,
      is_available BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES teachers(id),
      FOREIGN KEY (slot_id) REFERENCES time_slots(id),
      UNIQUE(teacher_id, day_of_week, slot_id, semester)
    );

    CREATE TABLE IF NOT EXISTS class_availability (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
      slot_id INTEGER NOT NULL,
      semester TEXT NOT NULL,
      is_available BOOLEAN DEFAULT 1,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (slot_id) REFERENCES time_slots(id),
      UNIQUE(class_id, day_of_week, slot_id, semester)
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      classroom_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 1 AND 7),
      slot_id INTEGER NOT NULL,
      week_type TEXT NOT NULL DEFAULT 'all' CHECK(week_type IN ('all', 'odd', 'even')),
      start_week INTEGER NOT NULL DEFAULT 1,
      end_week INTEGER NOT NULL DEFAULT 18,
      semester TEXT NOT NULL,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'cancelled', 'adjusted')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id),
      FOREIGN KEY (teacher_id) REFERENCES teachers(id),
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
      FOREIGN KEY (slot_id) REFERENCES time_slots(id)
    );

    CREATE TABLE IF NOT EXISTS schedule_conflicts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id1 INTEGER NOT NULL,
      schedule_id2 INTEGER NOT NULL,
      conflict_type TEXT NOT NULL CHECK(conflict_type IN ('teacher', 'classroom', 'class', 'time')),
      description TEXT NOT NULL,
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (schedule_id1) REFERENCES schedules(id),
      FOREIGN KEY (schedule_id2) REFERENCES schedules(id)
    );

    CREATE TABLE IF NOT EXISTS adjustments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      original_schedule_id INTEGER NOT NULL,
      applicant_id INTEGER NOT NULL,
      applicant_type TEXT NOT NULL CHECK(applicant_type IN ('teacher', 'dean')),
      adjust_type TEXT NOT NULL CHECK(adjust_type IN ('change_time', 'change_room', 'cancel', 'reschedule')),
      original_day_of_week INTEGER,
      original_slot_id INTEGER,
      original_classroom_id INTEGER,
      new_day_of_week INTEGER,
      new_slot_id INTEGER,
      new_classroom_id INTEGER,
      reason TEXT NOT NULL,
      affected_students TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'cancelled')),
      approver_id INTEGER,
      approval_comment TEXT,
      approved_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (original_schedule_id) REFERENCES schedules(id),
      FOREIGN KEY (applicant_id) REFERENCES users(id),
      FOREIGN KEY (approver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('adjustment', 'cancellation', 'makeup', 'room_change', 'system')),
      related_id INTEGER,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      table_name TEXT,
      record_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const timeSlots = db.prepare('SELECT COUNT(*) as count FROM time_slots').get();
  if (timeSlots.count === 0) {
    const insertSlot = db.prepare(`
      INSERT INTO time_slots (slot_no, start_time, end_time, name)
      VALUES (?, ?, ?, ?)
    `);
    const slots = [
      [1, '08:00', '08:45', '第一节'],
      [2, '08:55', '09:40', '第二节'],
      [3, '10:00', '10:45', '第三节'],
      [4, '10:55', '11:40', '第四节'],
      [5, '14:00', '14:45', '第五节'],
      [6, '14:55', '15:40', '第六节'],
      [7, '16:00', '16:45', '第七节'],
      [8, '16:55', '17:40', '第八节'],
      [9, '19:00', '19:45', '第九节'],
      [10, '19:55', '20:40', '第十节'],
    ];
    slots.forEach(slot => insertSlot.run(...slot));
  }

  const departments = db.prepare('SELECT COUNT(*) as count FROM departments').get();
  if (departments.count === 0) {
    const insertDept = db.prepare(`
      INSERT INTO departments (name, code)
      VALUES (?, ?)
    `);
    insertDept.run('计算机学院', 'CS');
    insertDept.run('数学学院', 'MATH');
    insertDept.run('物理学院', 'PHY');
    insertDept.run('外国语学院', 'FL');
  }

  const users = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (users.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (username, password, name, role, department)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertUser.run('admin', 'admin123', '系统管理员', 'admin', null);
    insertUser.run('dean1', 'dean123', '张主任', 'dean', '计算机学院');
    insertUser.run('teacher1', 't123456', '李老师', 'teacher', '计算机学院');
    insertUser.run('teacher2', 't123456', '王老师', 'teacher', '数学学院');
    insertUser.run('student1', 's123456', '学生甲', 'student', '计算机学院');
    insertUser.run('student2', 's123456', '学生乙', 'student', '计算机学院');
  }

  const teachers = db.prepare('SELECT COUNT(*) as count FROM teachers').get();
  if (teachers.count === 0) {
    const insertTeacher = db.prepare(`
      INSERT INTO teachers (user_id, name, title, department_id, teacher_no)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertTeacher.run(3, '李老师', '副教授', 1, 'T001');
    insertTeacher.run(4, '王老师', '教授', 2, 'T002');
  }

  const classes = db.prepare('SELECT COUNT(*) as count FROM classes').get();
  if (classes.count === 0) {
    const insertClass = db.prepare(`
      INSERT INTO classes (name, code, grade, student_count, department_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertClass.run('计算机科学与技术1班', 'CS2024-1', 2024, 45, 1);
    insertClass.run('计算机科学与技术2班', 'CS2024-2', 2024, 48, 1);
    insertClass.run('数学与应用数学1班', 'MATH2024-1', 2024, 40, 2);
  }

  const students = db.prepare('SELECT COUNT(*) as count FROM students').get();
  if (students.count === 0) {
    const insertStudent = db.prepare(`
      INSERT INTO students (user_id, name, student_no, class_id)
      VALUES (?, ?, ?, ?)
    `);
    insertStudent.run(5, '学生甲', 'S2024001', 1);
    insertStudent.run(6, '学生乙', 'S2024002', 1);
  }

  const courses = db.prepare('SELECT COUNT(*) as count FROM courses').get();
  if (courses.count === 0) {
    const insertCourse = db.prepare(`
      INSERT INTO courses (name, code, credit, hours, course_type, department_id, description, experiment_requirements, need_odd_even)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertCourse.run('数据结构', 'CS101', 4, 64, 'normal', 1, '数据结构基础课程', '', 0);
    insertCourse.run('高等数学', 'MATH101', 5, 80, 'normal', 2, '高等数学基础课程', '', 0);
    insertCourse.run('计算机网络', 'CS201', 3, 48, 'experiment', 1, '计算机网络实验课程', '需要电脑实验室，配备网络设备', 1);
    insertCourse.run('大学物理', 'PHY101', 4, 64, 'normal', 3, '大学物理基础课程', '', 0);
    insertCourse.run('大学英语', 'FL101', 3, 48, 'normal', 4, '大学英语基础课程', '', 0);
  }

  const classrooms = db.prepare('SELECT COUNT(*) as count FROM classrooms').get();
  if (classrooms.count === 0) {
    const insertClassroom = db.prepare(`
      INSERT INTO classrooms (name, building, room_no, capacity, classroom_type, equipment)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertClassroom.run('教学楼A101', '教学楼A', '101', 60, 'normal', '投影仪,音响');
    insertClassroom.run('教学楼A102', '教学楼A', '102', 80, 'multimedia', '投影仪,音响,电子白板');
    insertClassroom.run('实验楼B201', '实验楼B', '201', 40, 'experiment', '电脑40台,实验设备');
    insertClassroom.run('教学楼C301', '教学楼C', '301', 120, 'lecture', '投影仪,音响,麦克风');
    insertClassroom.run('实验楼B202', '实验楼B', '202', 35, 'experiment', '电脑35台,实验设备');
  }

  const calendar = db.prepare('SELECT COUNT(*) as count FROM calendar').get();
  if (calendar.count === 0) {
    const insertWeek = db.prepare(`
      INSERT INTO calendar (semester, week_no, start_date, end_date)
      VALUES (?, ?, ?, ?)
    `);
    const semester = '2024-2025-2';
    const startDate = new Date('2025-02-24');
    for (let i = 1; i <= 18; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (i - 1) * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      insertWeek.run(
        semester,
        i,
        weekStart.toISOString().split('T')[0],
        weekEnd.toISOString().split('T')[0]
      );
    }
  }

  const schedules = db.prepare('SELECT COUNT(*) as count FROM schedules').get();
  if (schedules.count === 0) {
    const insertSchedule = db.prepare(`
      INSERT INTO schedules (course_id, teacher_id, class_id, classroom_id, day_of_week, slot_id, week_type, start_week, end_week, semester)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const semester = '2024-2025-2';
    insertSchedule.run(1, 1, 1, 1, 1, 1, 'all', 1, 18, semester);
    insertSchedule.run(1, 1, 1, 1, 1, 2, 'all', 1, 18, semester);
    insertSchedule.run(2, 2, 1, 2, 2, 1, 'all', 1, 18, semester);
    insertSchedule.run(2, 2, 1, 2, 2, 2, 'all', 1, 18, semester);
    insertSchedule.run(3, 1, 1, 3, 3, 5, 'all', 1, 18, semester);
    insertSchedule.run(3, 1, 1, 3, 3, 6, 'all', 1, 18, semester);
    insertSchedule.run(4, 2, 2, 4, 4, 1, 'all', 1, 18, semester);
    insertSchedule.run(4, 2, 2, 4, 4, 2, 'all', 1, 18, semester);
    insertSchedule.run(5, 2, 1, 1, 5, 1, 'odd', 1, 18, semester);
    insertSchedule.run(5, 2, 1, 1, 5, 2, 'even', 1, 18, semester);
  }

  const teacherAvailability = db.prepare('SELECT COUNT(*) as count FROM teacher_availability').get();
  if (teacherAvailability.count === 0) {
    const insertAvail = db.prepare(`
      INSERT INTO teacher_availability (teacher_id, day_of_week, slot_id, semester, is_available)
      VALUES (?, ?, ?, ?, ?)
    `);
    const semester = '2024-2025-2';
    for (let teacherId = 1; teacherId <= 2; teacherId++) {
      for (let day = 1; day <= 5; day++) {
        for (let slot = 1; slot <= 10; slot++) {
          if ((teacherId === 1 && day === 3 && slot >= 5) || 
              (teacherId === 2 && day === 5 && slot >= 5)) {
            insertAvail.run(teacherId, day, slot, semester, 0);
          } else {
            insertAvail.run(teacherId, day, slot, semester, 1);
          }
        }
      }
    }
  }

  const classAvailability = db.prepare('SELECT COUNT(*) as count FROM class_availability').get();
  if (classAvailability.count === 0) {
    const insertAvail = db.prepare(`
      INSERT INTO class_availability (class_id, day_of_week, slot_id, semester, is_available, reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const semester = '2024-2025-2';
    for (let classId = 1; classId <= 3; classId++) {
      for (let day = 1; day <= 5; day++) {
        for (let slot = 1; slot <= 10; slot++) {
          if (slot === 4 || slot === 8) {
            insertAvail.run(classId, day, slot, semester, 0, '课间休息/班会时间');
          } else {
            insertAvail.run(classId, day, slot, semester, 1, '');
          }
        }
      }
    }
  }

  const adjustments = db.prepare('SELECT COUNT(*) as count FROM adjustments').get();
  if (adjustments.count === 0) {
    const insertAdj = db.prepare(`
      INSERT INTO adjustments (
        original_schedule_id, applicant_id, applicant_type, adjust_type, 
        original_day_of_week, original_slot_id, original_classroom_id,
        new_day_of_week, new_slot_id, new_classroom_id, reason, 
        affected_students, approver_id, status, comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAdj.run(
      3, 3, 'teacher', 'change_time',
      2, 1, 2,
      4, 3, 2,
      '教师有教研活动冲突，申请调整时间',
      '计算机2024-1班45人',
      null, 'pending', ''
    );
    insertAdj.run(
      6, 3, 'teacher', 'change_room',
      3, 6, 3,
      3, 6, 2,
      '实验室设备维护，需要更换教室',
      '计算机2024-1班45人',
      1, 'approved', '同意更换'
    );
  }

  const notifications = db.prepare('SELECT COUNT(*) as count FROM notifications').get();
  if (notifications.count === 0) {
    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, type, title, content, related_id, is_read)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertNotif.run(3, 'adjustment', '调课申请已通过', '您申请的"计算机网络"课程调课已通过审批，请留意新的上课时间。', 2, 0);
    insertNotif.run(5, 'adjustment', '课程时间调整通知', '您选修的"高等数学"课程时间已调整，请查看新课表。', 2, 0);
    insertNotif.run(1, 'system', '系统维护通知', '系统将于本周五晚22:00-24:00进行维护，期间可能影响使用。', null, 1);
  }

  console.log('Database initialized successfully');
}

export default db;
