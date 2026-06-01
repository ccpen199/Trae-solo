const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      role TEXT NOT NULL,
      school_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      level INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (school_id) REFERENCES schools(id)
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      head_teacher_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (grade_id) REFERENCES grades(id),
      FOREIGN KEY (head_teacher_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS class_teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL,
      teacher_id INTEGER NOT NULL,
      subject TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id),
      FOREIGN KEY (teacher_id) REFERENCES users(id),
      UNIQUE(class_id, teacher_id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER,
      name TEXT NOT NULL,
      student_no TEXT,
      gender TEXT,
      birth_date DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (class_id) REFERENCES classes(id)
    );

    CREATE TABLE IF NOT EXISTS guardians (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      relation TEXT NOT NULL,
      is_primary BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (student_id) REFERENCES students(id),
      UNIQUE(user_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      scope_type TEXT NOT NULL,
      scope_id INTEGER,
      priority TEXT DEFAULT 'normal',
      need_confirmation BOOLEAN DEFAULT 0,
      scheduled_at DATETIME,
      is_published BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS announcement_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      announcement_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (announcement_id) REFERENCES announcements(id)
    );

    CREATE TABLE IF NOT EXISTS announcement_reads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      announcement_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      read_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      confirmed_at DATETIME,
      FOREIGN KEY (announcement_id) REFERENCES announcements(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(announcement_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      guardian_id INTEGER NOT NULL,
      leave_type TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT NOT NULL,
      proof_file TEXT,
      status TEXT DEFAULT 'pending',
      approver_id INTEGER,
      approved_at DATETIME,
      check_in_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (guardian_id) REFERENCES users(id),
      FOREIGN KEY (approver_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      category TEXT NOT NULL,
      priority TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'open',
      assigned_to INTEGER,
      escalated BOOLEAN DEFAULT 0,
      escalated_to INTEGER,
      escalated_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (escalated_to) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS feedback_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feedback_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (feedback_id) REFERENCES feedbacks(id),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      related_type TEXT,
      related_id INTEGER,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  const schoolCheck = db.prepare('SELECT COUNT(*) as count FROM schools');
  if (schoolCheck.get().count === 0) {
    const insertSchool = db.prepare('INSERT INTO schools (name, address) VALUES (?, ?)');
    insertSchool.run('阳光小学', '北京市朝阳区阳光路100号');

    const hashedAdmin = bcrypt.hashSync('admin123', 10);
    const hashedTeacher = bcrypt.hashSync('teacher123', 10);
    const hashedParent = bcrypt.hashSync('parent123', 10);
    const hashedParent2 = bcrypt.hashSync('parent123', 10);
    const hashedParent3 = bcrypt.hashSync('parent123', 10);

    const insertUser = db.prepare('INSERT INTO users (username, password, name, phone, role, school_id) VALUES (?, ?, ?, ?, ?, ?)');
    const adminId = insertUser.run('admin', hashedAdmin, '系统管理员', '13800138000', 'admin', 1).lastInsertRowid;
    const teacherId = insertUser.run('teacher1', hashedTeacher, '张老师', '13800138001', 'teacher', 1).lastInsertRowid;
    const parentId = insertUser.run('parent1', hashedParent, '李爸爸', '13800138002', 'guardian', 1).lastInsertRowid;
    const parent2Id = insertUser.run('parent2', hashedParent2, '王妈妈', '13800138003', 'guardian', 1).lastInsertRowid;
    const parent3Id = insertUser.run('parent3', hashedParent3, '陈爸爸', '13800138004', 'guardian', 1).lastInsertRowid;

    const insertGrade = db.prepare('INSERT INTO grades (school_id, name, level) VALUES (?, ?, ?)');
    const grade1Id = insertGrade.run(1, '一年级', 1).lastInsertRowid;
    const grade2Id = insertGrade.run(1, '二年级', 2).lastInsertRowid;

    const insertClass = db.prepare('INSERT INTO classes (grade_id, name, head_teacher_id) VALUES (?, ?, ?)');
    const class1Id = insertClass.run(grade1Id, '1班', teacherId).lastInsertRowid;
    const class2Id = insertClass.run(grade1Id, '2班', teacherId).lastInsertRowid;

    const insertClassTeacher = db.prepare('INSERT INTO class_teachers (class_id, teacher_id, subject) VALUES (?, ?, ?)');
    insertClassTeacher.run(class1Id, teacherId, '语文');
    insertClassTeacher.run(class2Id, teacherId, '数学');

    const insertStudent = db.prepare('INSERT INTO students (class_id, name, student_no, gender) VALUES (?, ?, ?, ?)');
    const student1Id = insertStudent.run(class1Id, '李小明', '202401001', 'male').lastInsertRowid;
    const student2Id = insertStudent.run(class1Id, '王小美', '202401002', 'female').lastInsertRowid;
    const student3Id = insertStudent.run(class1Id, '陈小龙', '202401003', 'male').lastInsertRowid;
    const student4Id = insertStudent.run(class1Id, '赵小雨', '202401004', 'female').lastInsertRowid;

    const insertGuardian = db.prepare('INSERT INTO guardians (user_id, student_id, relation, is_primary) VALUES (?, ?, ?, ?)');
    insertGuardian.run(parentId, student1Id, '父亲', 1);
    insertGuardian.run(parent2Id, student2Id, '母亲', 1);
    insertGuardian.run(parent3Id, student3Id, '父亲', 1);

    const insertAnnouncement = db.prepare(`
      INSERT INTO announcements (title, content, author_id, scope_type, scope_id, priority, need_confirmation, is_published)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    
    const ann1Id = insertAnnouncement.run(
      '关于2024年秋季学期开学的通知',
      '各位家长：\n\n您好！2024年秋季学期将于9月1日正式开学，请各位家长注意以下事项：\n\n1. 开学时间：9月1日（星期一）上午8:00\n2. 请携带学生暑假作业\n3. 请准备好学习用品\n4. 请提前调整作息时间\n\n如有疑问，请联系班主任。\n\n谢谢！\n\n阳光小学教务处',
      adminId,
      'school',
      null,
      'high',
      1
    ).lastInsertRowid;

    const ann2Id = insertAnnouncement.run(
      '一年级1班家长会通知',
      '尊敬的一年级1班家长：\n\n为了更好地促进家校合作，兹定于本周五（8月30日）下午3:00在一年级1班教室召开家长会。\n\n会议议程：\n1. 新学期教学计划介绍\n2. 学生行为规范要求\n3. 家校配合注意事项\n4. 自由交流\n\n请各位家长准时参加，谢谢！\n\n班主任：张老师',
      teacherId,
      'class',
      class1Id,
      'normal',
      1
    ).lastInsertRowid;

    const ann3Id = insertAnnouncement.run(
      '校园安全提醒',
      '各位家长：\n\n近期校园安全工作需加强，请各位家长配合做好以下工作：\n\n1. 接送孩子时请在指定区域等候\n2. 请勿让孩子携带危险物品到校\n3. 请教育孩子遵守交通规则\n4. 如有特殊情况请及时告知班主任\n\n孩子的安全是我们共同的责任，感谢您的配合！\n\n学校安保处',
      adminId,
      'school',
      null,
      'high',
      0
    ).lastInsertRowid;

    const insertAnnouncementRead = db.prepare(`
      INSERT INTO announcement_reads (announcement_id, user_id, read_at, confirmed_at)
      VALUES (?, ?, ?, ?)
    `);
    insertAnnouncementRead.run(ann1Id, parent2Id, '2024-08-25 11:30:00', null);

    const insertLeave = db.prepare(`
      INSERT INTO leave_requests (student_id, guardian_id, leave_type, start_date, end_date, reason, status, approver_id, approved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertLeave.run(
      student1Id, parentId, 'sick',
      '2024-08-26', '2024-08-27',
      '孩子感冒发烧，需要在家休息两天，请老师批准。',
      'approved', teacherId, '2024-08-25 14:00:00'
    );
    insertLeave.run(
      student2Id, parent2Id, 'personal',
      '2024-08-28', '2024-08-28',
      '家中有事，需要带孩子回老家一天。',
      'pending', null, null
    );

    const insertFeedback = db.prepare(`
      INSERT INTO feedbacks (title, content, author_id, category, priority, status, assigned_to)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const fb1Id = insertFeedback.run(
      '关于教室空调温度的建议',
      '张老师您好：\n\n最近天气炎热，教室空调温度设置偏低，建议适当调高温度，避免孩子着凉。特别是午休时，部分孩子反映有点冷。\n\n谢谢！',
      parentId, 'life', 'normal', 'open', teacherId
    ).lastInsertRowid;

    const fb2Id = insertFeedback.run(
      '作业量问题咨询',
      '老师您好：\n\n想了解一下本学期的作业量安排，孩子每天完成作业需要多长时间比较合理？有没有推荐的时间管理方法？',
      parent2Id, 'study', 'normal', 'closed', teacherId
    ).lastInsertRowid;

    const insertReply = db.prepare(`
      INSERT INTO feedback_replies (feedback_id, author_id, content)
      VALUES (?, ?, ?)
    `);
    insertReply.run(
      fb2Id, teacherId,
      '家长您好：\n\n本学期作业量控制在每天30-40分钟左右。建议培养孩子定时完成作业的习惯，可以分段进行，中间适当休息。如有具体问题可以随时联系我。'
    );
    insertReply.run(
      fb2Id, parent2Id,
      '好的，谢谢老师的解答！我们会配合培养孩子良好的学习习惯。'
    );
  }
};

module.exports = { db, initDatabase };
