require('dotenv').config({ path: '../../.env' });
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'app.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'leader', 'teacher', 'admin')),
    student_id TEXT,
    phone TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clubs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    charter TEXT,
    activity_direction TEXT,
    leader_id INTEGER REFERENCES users(id),
    teacher_id INTEGER REFERENCES users(id),
    member_count INTEGER DEFAULT 0,
    max_members INTEGER DEFAULT 50,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'suspended')),
    annual_review_passed BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS club_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER REFERENCES clubs(id),
    user_id INTEGER REFERENCES users(id),
    role TEXT DEFAULT 'member' CHECK(role IN ('member', 'vice_leader', 'leader')),
    join_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    leave_date DATETIME,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'left', 'graduated')),
    UNIQUE(club_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS recruitment_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER REFERENCES clubs(id),
    title TEXT NOT NULL,
    description TEXT,
    requirements TEXT,
    start_date DATE,
    end_date DATE,
    interview_info TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('draft', 'active', 'closed')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS recruitment_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER REFERENCES recruitment_campaigns(id),
    user_id INTEGER REFERENCES users(id),
    club_id INTEGER REFERENCES clubs(id),
    reason TEXT,
    resume TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'interview', 'accepted', 'rejected')),
    interview_time DATETIME,
    interview_result TEXT,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER REFERENCES clubs(id),
    title TEXT NOT NULL,
    description TEXT,
    plan TEXT,
    location TEXT,
    start_time DATETIME,
    end_time DATETIME,
    budget DECIMAL(10,2) DEFAULT 0,
    actual_cost DECIMAL(10,2) DEFAULT 0,
    photos TEXT,
    summary TEXT,
    needs_approval BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending', 'approved', 'rejected', 'ongoing', 'completed')),
    approval_note TEXT,
    approver_id INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS activity_signins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_id INTEGER REFERENCES activities(id),
    user_id INTEGER REFERENCES users(id),
    signin_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS funds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER REFERENCES clubs(id) UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0,
    total_income DECIMAL(10,2) DEFAULT 0,
    total_expense DECIMAL(10,2) DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS fund_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER REFERENCES clubs(id),
    activity_id INTEGER REFERENCES activities(id),
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    purpose TEXT,
    receipts TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'reimbursed')),
    approval_note TEXT,
    approver_id INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME,
    reimbursed_at DATETIME
  );

  CREATE TABLE IF NOT EXISTS annual_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER REFERENCES clubs(id),
    year INTEGER NOT NULL,
    report TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'passed', 'failed')),
    review_note TEXT,
    reviewer_id INTEGER REFERENCES users(id),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    UNIQUE(club_id, year)
  );

  CREATE TABLE IF NOT EXISTS member_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    club_id INTEGER REFERENCES clubs(id),
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    old_role TEXT,
    new_role TEXT,
    operator_id INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

const adminPassword = bcrypt.hashSync('admin123', 10);
const teacherPassword = bcrypt.hashSync('teacher123', 10);
const studentPassword = bcrypt.hashSync('student123', 10);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (username, password, name, role, student_id, phone, email)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

insertUser.run('admin', adminPassword, '系统管理员', 'admin', null, '13800000000', 'admin@school.edu');
insertUser.run('teacher1', teacherPassword, '张老师', 'teacher', null, '13800000001', 'zhang@school.edu');
insertUser.run('teacher2', teacherPassword, '李老师', 'teacher', null, '13800000002', 'li@school.edu');
insertUser.run('student1', studentPassword, '张三', 'student', '20240001', '13900000001', 'zhangsan@school.edu');
insertUser.run('student2', studentPassword, '李四', 'student', '20240002', '13900000002', 'lisi@school.edu');
insertUser.run('student3', studentPassword, '王五', 'student', '20240003', '13900000003', 'wangwu@school.edu');
insertUser.run('student4', studentPassword, '赵六', 'student', '20240004', '13900000004', 'zhaoliu@school.edu');
insertUser.run('student5', studentPassword, '钱七', 'student', '20240005', '13900000005', 'qianqi@school.edu');

const insertClub = db.prepare(`
  INSERT OR IGNORE INTO clubs (name, description, charter, activity_direction, leader_id, teacher_id, member_count, max_members, status, annual_review_passed, created_at, approved_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`);

insertClub.run('科技创新协会', '专注于科技创新和机器人研发的学生社团', '遵守校规校纪，积极参与科技创新活动', '科技创新、机器人、编程', 4, 2, 3, 50, 'approved', 1);
insertClub.run('文艺社', '致力于推广校园文化艺术的学生社团', '弘扬艺术文化，丰富校园生活', '音乐、舞蹈、戏剧、美术', 5, 3, 2, 80, 'approved', 1);
insertClub.run('志愿者协会', '组织志愿服务活动的公益性学生社团', '奉献、友爱、互助、进步', '志愿服务、公益活动、社会实践', 6, 2, 4, 100, 'approved', 1);

const insertMember = db.prepare(`
  INSERT OR IGNORE INTO club_members (club_id, user_id, role, join_date)
  VALUES (?, ?, ?, CURRENT_TIMESTAMP)
`);

insertMember.run(1, 4, 'leader');
insertMember.run(1, 5, 'member');
insertMember.run(1, 6, 'member');
insertMember.run(2, 5, 'leader');
insertMember.run(2, 6, 'member');
insertMember.run(3, 6, 'leader');
insertMember.run(3, 4, 'member');
insertMember.run(3, 5, 'member');
insertMember.run(3, 7, 'member');

const insertRecruitment = db.prepare(`
  INSERT OR IGNORE INTO recruitment_campaigns (club_id, title, description, requirements, start_date, end_date, interview_info, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
`);

insertRecruitment.run(1, '2024年秋季纳新', '科技创新协会2024年秋季学期纳新活动开始啦！欢迎对科技创新感兴趣的同学加入我们！', '1. 对科技创新有浓厚兴趣；2. 具备基本编程能力优先；3. 能按时参加社团活动；', '2024-09-01', '2024-09-15', '面试时间：9月16日14:00，地点：科技楼302室');
insertRecruitment.run(2, '迎新季文艺人才招募', '文艺社面向全体新生招募各类文艺人才，无论你擅长唱歌、跳舞还是表演，都欢迎加入！', '1. 热爱文艺表演；2. 有一定基础或学习热情；3. 能积极参与社团排练和演出；', '2024-09-05', '2024-09-20', '面试时间：9月21日18:30，地点：大学生活动中心201室');
insertRecruitment.run(3, '志愿者招募计划', '志愿者协会长期招募志愿者，参与各类公益志愿服务活动，用爱心传递温暖！', '1. 具有奉献精神和责任心；2. 能保证每月至少参加1次志愿活动；3. 遵守志愿者服务规范；', '2024-09-01', '2024-12-31', '无需面试，报名后即可参与活动');

const insertFund = db.prepare(`
  INSERT OR IGNORE INTO funds (club_id, balance, total_income, total_expense, updated_at)
  VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

insertFund.run(1, 5000.00, 5000.00, 0);
insertFund.run(2, 3000.00, 3000.00, 0);
insertFund.run(3, 8000.00, 8000.00, 0);

const insertActivity = db.prepare(`
  INSERT OR IGNORE INTO activities (club_id, title, description, plan, location, start_time, end_time, budget, actual_cost, needs_approval, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'approved', CURRENT_TIMESTAMP)
`);

insertActivity.run(1, '机器人编程培训', '面向社团成员的机器人编程基础培训', '讲解机器人基本原理和编程方法', '科技楼302', '2024-09-10 14:00:00', '2024-09-10 17:00:00', 200, 0);
insertActivity.run(2, '迎新晚会节目排练', '为迎新晚会准备节目排练', '舞蹈、歌唱节目排练', '大学生活动中心', '2024-09-12 18:00:00', '2024-09-12 21:00:00', 500, 0);

console.log('Database initialized successfully!');
console.log('Default accounts created:');
console.log('  admin / admin123 (团委管理员)');
console.log('  teacher1 / teacher123 (指导老师)');
console.log('  student1-5 / student123 (学生账号)');

db.close();
