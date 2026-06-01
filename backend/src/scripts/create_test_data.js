require('dotenv').config({ path: '../../.env' });
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../data/app.sqlite');
const db = new Database(dbPath);

const now = new Date();
const startTime = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1小时后
const endTime = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3小时后

try {
  const insertExam = db.prepare(`
    INSERT INTO exams (title, description, start_time, end_time, duration, 
                       max_screen_switches, require_camera, allow_late_minutes, 
                       allowed_devices, status, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const exam1 = insertExam.run(
    '2024年度计算机基础知识测试',
    '测试考生对计算机基础知识的掌握程度，包括操作系统、网络、硬件等内容',
    startTime.toISOString(),
    endTime.toISOString(),
    120,
    3,
    1,
    10,
    'desktop',
    'published',
    1
  );

  const exam2 = insertExam.run(
    'JavaScript编程能力测试',
    '测试JavaScript基础语法、DOM操作、异步编程等能力',
    startTime.toISOString(),
    endTime.toISOString(),
    90,
    5,
    1,
    15,
    'desktop',
    'published',
    1
  );

  const exam3 = insertExam.run(
    '数据库原理与应用',
    '测试SQL语句编写、数据库设计、事务处理等知识',
    startTime.toISOString(),
    endTime.toISOString(),
    60,
    2,
    1,
    5,
    'desktop',
    'draft',
    1
  );

  const insertQuestion = db.prepare(`
    INSERT INTO questions (exam_id, type, content, options, correct_answer, score)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const questions1 = [
    {
      type: 'single',
      content: '以下哪个不是操作系统？',
      options: JSON.stringify(['Windows', 'Linux', 'MySQL', 'macOS']),
      correct_answer: JSON.stringify(['MySQL']),
      score: 10
    },
    {
      type: 'single',
      content: 'HTTP协议默认使用的端口号是？',
      options: JSON.stringify(['21', '22', '80', '443']),
      correct_answer: JSON.stringify(['80']),
      score: 10
    },
    {
      type: 'multiple',
      content: '以下哪些是编程语言？',
      options: JSON.stringify(['Python', 'HTML', 'Java', 'CSS']),
      correct_answer: JSON.stringify(['Python', 'Java']),
      score: 20
    },
    {
      type: 'single',
      content: 'CPU的中文名称是什么？',
      options: JSON.stringify(['硬盘', '内存', '中央处理器', '显卡']),
      correct_answer: JSON.stringify(['中央处理器']),
      score: 10
    }
  ];

  questions1.forEach(q => {
    insertQuestion.run(exam1.lastInsertRowid, q.type, q.content, q.options, q.correct_answer, q.score);
  });

  const questions2 = [
    {
      type: 'single',
      content: 'JavaScript中哪个方法用于向数组末尾添加元素？',
      options: JSON.stringify(['push()', 'pop()', 'shift()', 'unshift()']),
      correct_answer: JSON.stringify(['push()']),
      score: 10
    },
    {
      type: 'single',
      content: '以下哪个不是JavaScript的数据类型？',
      options: JSON.stringify(['string', 'boolean', 'float', 'undefined']),
      correct_answer: JSON.stringify(['float']),
      score: 10
    },
    {
      type: 'essay',
      content: '请简述JavaScript中Promise的作用和基本用法。',
      options: JSON.stringify([]),
      correct_answer: JSON.stringify([]),
      score: 30
    }
  ];

  questions2.forEach(q => {
    insertQuestion.run(exam2.lastInsertRowid, q.type, q.content, q.options, q.correct_answer, q.score);
  });

  const assignStudent = db.prepare(`
    INSERT OR IGNORE INTO exam_students (exam_id, student_id, status)
    VALUES (?, ?, ?)
  `);

  assignStudent.run(exam1.lastInsertRowid, 3, 'pending');
  assignStudent.run(exam1.lastInsertRowid, 4, 'pending');
  assignStudent.run(exam2.lastInsertRowid, 3, 'pending');
  assignStudent.run(exam2.lastInsertRowid, 4, 'pending');

  console.log('✅ 测试数据创建成功！');
  console.log('📝 考试1 ID:', exam1.lastInsertRowid);
  console.log('📝 考试2 ID:', exam2.lastInsertRowid);
  console.log('📝 考试3 ID:', exam3.lastInsertRowid);
  console.log('👥 已为 student1 和 student2 分配考试');

} catch (error) {
  console.error('❌ 创建测试数据失败:', error);
} finally {
  db.close();
}
