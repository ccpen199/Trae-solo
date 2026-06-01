const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'training.db');
const schemaPath = path.join(__dirname, 'schema.sql');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);

const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

const hashedPassword = bcrypt.hashSync('123456', 10);

const insertUser = db.prepare(`
  INSERT INTO users (username, password, name, email, role, department, position)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertUser.run('admin', hashedPassword, '系统管理员', 'admin@company.com', 'admin', '人力资源部', '培训主管');
insertUser.run('instructor1', hashedPassword, '张讲师', 'zhang@company.com', 'instructor', '技术部', '高级工程师');
insertUser.run('instructor2', hashedPassword, '李讲师', 'li@company.com', 'instructor', '产品部', '产品总监');
insertUser.run('hr1', hashedPassword, 'HR小王', 'hr1@company.com', 'hr', '人力资源部', 'HR专员');
insertUser.run('employee1', hashedPassword, '员工张三', 'emp1@company.com', 'employee', '技术部', '前端工程师');
insertUser.run('employee2', hashedPassword, '员工李四', 'emp2@company.com', 'employee', '技术部', '后端工程师');
insertUser.run('employee3', hashedPassword, '员工王五', 'emp3@company.com', 'employee', '产品部', '产品经理');
insertUser.run('employee4', hashedPassword, '员工赵六', 'emp4@company.com', 'employee', '市场部', '市场专员');

const insertCourse = db.prepare(`
  INSERT INTO courses (title, description, instructor_id, applicable_positions, registration_scope, 
                       live_time, duration, credits, is_required, status, materials, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const now = new Date();
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

insertCourse.run(
  'Vue3 前端开发实战',
  '深入学习Vue3组合式API、响应式原理、状态管理等核心技术',
  2,
  '前端工程师,全栈工程师',
  '技术部全体',
  tomorrow.toISOString().slice(0, 19).replace('T', ' '),
  120,
  2,
  1,
  'published',
  '["Vue3官方文档.pdf","项目实战代码.zip"]',
  1
);

insertCourse.run(
  '产品经理方法论',
  '需求分析、用户研究、原型设计、项目管理全流程培训',
  3,
  '产品经理,产品助理',
  '产品部,市场部',
  yesterday.toISOString().slice(0, 19).replace('T', ' '),
  90,
  1,
  0,
  'completed',
  '["产品思维.pdf","案例分析.pptx"]',
  1
);

insertCourse.run(
  '企业文化与职业素养',
  '了解公司发展历程、企业文化、职业规范和沟通技巧',
  1,
  '全体员工',
  '全公司',
  tomorrow.toISOString().slice(0, 19).replace('T', ' '),
  60,
  1,
  1,
  'published',
  '["员工手册.pdf"]',
  1
);

const insertEnrollment = db.prepare(`
  INSERT INTO course_enrollments (course_id, user_id, status, progress)
  VALUES (?, ?, ?, ?)
`);

insertEnrollment.run(1, 5, 'enrolled', 0);
insertEnrollment.run(1, 6, 'enrolled', 0);
insertEnrollment.run(2, 7, 'completed', 100);
insertEnrollment.run(2, 8, 'completed', 100);
insertEnrollment.run(3, 5, 'enrolled', 0);
insertEnrollment.run(3, 6, 'enrolled', 0);
insertEnrollment.run(3, 7, 'enrolled', 0);
insertEnrollment.run(3, 8, 'enrolled', 0);

const insertExam = db.prepare(`
  INSERT INTO exams (course_id, title, description, duration, passing_score, max_attempts, created_by)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertExam.run(2, '产品经理方法论结业考试', '检验产品知识掌握程度', 60, 60, 3, 1);

const insertQuestion = db.prepare(`
  INSERT INTO exam_questions (exam_id, type, question, options, answer, score)
  VALUES (?, ?, ?, ?, ?, ?)
`);

insertQuestion.run(1, 'single', '产品经理的核心职责是什么？', 
  '["写代码","需求管理和产品规划","销售产品","财务核算"]', '1', 20);
insertQuestion.run(1, 'single', '用户研究的首要目的是？', 
  '["收集用户反馈","了解用户需求和痛点","完成KPI","制作报表"]', '1', 20);
insertQuestion.run(1, 'single', 'MVP是指什么？', 
  '["最有价值球员","最小可行产品","最大价值产品","最快速产品"]', '1', 20);
insertQuestion.run(1, 'multiple', '产品需求文档(PRD)通常包含哪些内容？', 
  '["功能描述","交互设计","技术架构","验收标准"]', '0,1,3', 20);
insertQuestion.run(1, 'judge', '产品经理不需要了解技术实现细节。', 
  '["正确","错误"]', '1', 20);

const insertAttendance = db.prepare(`
  INSERT INTO attendances (course_id, user_id, status, check_in_time, is_late)
  VALUES (?, ?, ?, ?, ?)
`);

insertAttendance.run(2, 7, 'present', yesterday.toISOString().slice(0, 19).replace('T', ' '), 0);
insertAttendance.run(2, 8, 'present', yesterday.toISOString().slice(0, 19).replace('T', ' '), 1);

const insertEvaluation = db.prepare(`
  INSERT INTO course_evaluations (course_id, user_id, rating, comment)
  VALUES (?, ?, ?, ?)
`);

insertEvaluation.run(2, 7, 5, '课程内容很实用，讲师讲得很好！');
insertEvaluation.run(2, 8, 4, '内容不错，希望有更多案例');

const insertExamAttempt = db.prepare(`
  INSERT INTO exam_attempts (exam_id, user_id, attempt_number, score, answers, is_passed, started_at, submitted_at)
  VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`);

insertExamAttempt.run(1, 7, 1, 85, '[]', 1);
insertExamAttempt.run(1, 8, 1, 55, '[]', 0);
insertExamAttempt.run(1, 8, 2, 75, '[]', 1);

const insertCertificate = db.prepare(`
  INSERT INTO certificates (user_id, course_id, exam_id, certificate_no, issued_at)
  VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

insertCertificate.run(7, 2, 1, 'CERT' + Date.now() + '007');
insertCertificate.run(8, 2, 1, 'CERT' + Date.now() + '008');

const insertException = db.prepare(`
  INSERT INTO exceptions (type, course_id, user_id, description, status)
  VALUES (?, ?, ?, ?, ?)
`);

insertException.run('absent', 2, 5, '员工张三未参加课程2的培训', 'pending');
insertException.run('late', 2, 8, '员工赵六签到迟到15分钟', 'handled');
insertException.run('retake', 2, 8, '员工赵六考试首次未通过，申请重考', 'handled');
insertException.run('interrupt', 1, null, '课程1直播信号中断5分钟', 'pending');

console.log('Database initialized successfully!');
console.log('Default accounts created:');
console.log('  admin / 123456 (管理员)');
console.log('  instructor1 / 123456 (讲师)');
console.log('  hr1 / 123456 (HR)');
console.log('  employee1 / 123456 (员工)');

db.close();
