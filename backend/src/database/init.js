require('dotenv').config({ path: '../.env' });
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');
const createTables = require('./schema');

const dbPath = path.join(__dirname, '../../../data/app.sqlite');
const db = new Database(dbPath);

createTables(db);

const hashPassword = (password) => bcrypt.hashSync(password, 10);

const insertSeedData = () => {
  const existingGrades = db.prepare('SELECT COUNT(*) as count FROM grades').get();
  if (existingGrades.count > 0) {
    console.log('Seed data already exists, skipping...');
    return;
  }

  const insertGrade = db.prepare('INSERT INTO grades (name, level) VALUES (?, ?)');
  const grades = [
    ['一年级', 1],
    ['二年级', 2],
    ['三年级', 3],
    ['四年级', 4],
    ['五年级', 5],
    ['六年级', 6]
  ];
  grades.forEach(([name, level]) => insertGrade.run(name, level));

  const insertClassroom = db.prepare('INSERT INTO classrooms (name, capacity, equipment) VALUES (?, ?, ?)');
  const classrooms = [
    ['多功能教室1', 30, '投影仪,音响'],
    ['美术教室', 25, '画架,颜料'],
    ['音乐教室', 20, '钢琴,音响'],
    ['科学实验室', 25, '实验器材'],
    ['计算机教室', 30, '电脑,投影仪']
  ];
  classrooms.forEach(([name, capacity, equipment]) => insertClassroom.run(name, capacity, equipment));

  const insertUser = db.prepare('INSERT INTO users (username, password, role, name, phone, email, grade_id, parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  
  insertUser.run('admin', hashPassword('admin123'), 'admin', '管理员', '13800000000', 'admin@school.com', null, null);

  const teacher1Id = insertUser.run('teacher1', hashPassword('teacher123'), 'teacher', '张老师', '13800000001', 'zhang@school.com', null, null).lastInsertRowid;
  const teacher2Id = insertUser.run('teacher2', hashPassword('teacher123'), 'teacher', '李老师', '13800000002', 'li@school.com', null, null).lastInsertRowid;
  const teacher3Id = insertUser.run('teacher3', hashPassword('teacher123'), 'teacher', '王老师', '13800000003', 'wang@school.com', null, null).lastInsertRowid;

  const parent1Id = insertUser.run('parent1', hashPassword('parent123'), 'parent', '家长小明', '13900000001', 'parent1@example.com', null, null).lastInsertRowid;
  const parent2Id = insertUser.run('parent2', hashPassword('parent123'), 'parent', '家长小红', '13900000002', 'parent2@example.com', null, null).lastInsertRowid;
  const parent3Id = insertUser.run('parent3', hashPassword('parent123'), 'parent', '家长小华', '13900000003', 'parent3@example.com', null, null).lastInsertRowid;

  insertUser.run('student1', hashPassword('student123'), 'student', '小明', null, null, 1, parent1Id);
  insertUser.run('student2', hashPassword('student123'), 'student', '小红', null, null, 2, parent2Id);
  insertUser.run('student3', hashPassword('student123'), 'student', '小华', null, null, 3, parent3Id);
  insertUser.run('student4', hashPassword('student123'), 'student', '小强', null, null, 1, parent1Id);
  insertUser.run('student5', hashPassword('student123'), 'student', '小丽', null, null, 2, parent2Id);

  const insertCourse = db.prepare(`
    INSERT INTO courses (name, description, teacher_id, classroom_id, grade_ids, day_of_week, start_time, end_time, capacity, fee, status, enrollment_start, enrollment_end, refund_deadline, refund_rule, requirements)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date();
  const enrollmentStart = new Date(now);
  const enrollmentEnd = new Date(now);
  enrollmentEnd.setMonth(enrollmentEnd.getMonth() + 1);
  const refundDeadline = new Date(enrollmentEnd);
  refundDeadline.setDate(refundDeadline.getDate() + 7);

  const courses = [
    ['创意绘画', '培养学生绘画创意能力', teacher1Id, 2, '[1,2,3]', 1, '16:30', '17:30', 20, 100, 'published', enrollmentStart.toISOString(), enrollmentEnd.toISOString(), refundDeadline.toISOString(), '开课前7天可全额退款，3天内退50%', '无'],
    ['钢琴基础', '从零开始学习钢琴', teacher2Id, 3, '[2,3,4]', 2, '16:30', '17:30', 10, 200, 'published', enrollmentStart.toISOString(), enrollmentEnd.toISOString(), refundDeadline.toISOString(), '开课前7天可全额退款', '需要自备钢琴'],
    ['编程入门', 'Scratch编程基础', teacher3Id, 5, '[3,4,5,6]', 3, '16:30', '18:00', 25, 150, 'published', enrollmentStart.toISOString(), enrollmentEnd.toISOString(), refundDeadline.toISOString(), '开课前7天可全额退款', '会使用电脑基础操作'],
    ['科学实验', '趣味科学小实验', teacher1Id, 4, '[1,2,3,4]', 4, '16:30', '17:30', 20, 120, 'published', enrollmentStart.toISOString(), enrollmentEnd.toISOString(), refundDeadline.toISOString(), '开课前7天可全额退款', '穿着实验服'],
    ['合唱训练', '学校合唱队训练', teacher2Id, 3, '[3,4,5,6]', 5, '16:00', '17:30', 30, 80, 'published', enrollmentStart.toISOString(), enrollmentEnd.toISOString(), refundDeadline.toISOString(), '开课前7天可全额退款', '热爱唱歌']
  ];

  courses.forEach(course => insertCourse.run(...course));

  console.log('Seed data inserted successfully!');
  console.log('Test accounts:');
  console.log('Admin: admin / admin123');
  console.log('Teacher: teacher1 / teacher123');
  console.log('Parent: parent1 / parent123');
  console.log('Student: student1 / student123');
};

insertSeedData();
db.close();
