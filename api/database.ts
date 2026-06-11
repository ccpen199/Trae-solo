import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, 'campus.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function initDatabase(): void {
  const database = getDb()

  database.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('group', 'branch')),
      parent_id INTEGER REFERENCES organizations(id),
      contact TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('hr', 'admin', 'branch_admin', 'student', 'mentor')),
      org_id INTEGER REFERENCES organizations(id),
      password_hash TEXT NOT NULL,
      credit_score REAL DEFAULT 80.0,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id),
      university TEXT,
      major TEXT,
      grade TEXT,
      skills TEXT DEFAULT '[]',
      certificates TEXT DEFAULT '[]',
      rating REAL DEFAULT 0.0,
      resume_text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('summer_winter', 'internship', 'online_task')),
      description TEXT,
      requirements TEXT DEFAULT '{}',
      salary_min INTEGER,
      salary_max INTEGER,
      org_id INTEGER REFERENCES organizations(id),
      status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'closed')),
      settlement_cycle TEXT CHECK(settlement_cycle IN ('daily', 'weekly', 'monthly')),
      headcount INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER REFERENCES jobs(id),
      student_id INTEGER REFERENCES student_profiles(id),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'shortlisted', 'interviewed', 'offered', 'rejected')),
      cover_letter TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER REFERENCES jobs(id),
      application_id INTEGER REFERENCES applications(id),
      type TEXT DEFAULT 'group_chat',
      status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'in_progress', 'completed')),
      summary TEXT,
      scheduled_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS interview_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interview_id INTEGER REFERENCES interviews(id),
      sender_id INTEGER REFERENCES users(id),
      content TEXT,
      type TEXT DEFAULT 'text' CHECK(type IN ('text', 'file', 'system')),
      file_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER REFERENCES jobs(id),
      student_id INTEGER REFERENCES student_profiles(id),
      checkin_time DATETIME,
      checkout_time DATETIME,
      method TEXT DEFAULT 'qrcode',
      status TEXT DEFAULT 'normal' CHECK(status IN ('normal', 'late', 'absent', 'early_leave')),
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fund_pools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER UNIQUE REFERENCES organizations(id),
      balance REAL DEFAULT 0.0,
      frozen REAL DEFAULT 0.0,
      pending REAL DEFAULT 0.0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settlements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      org_id INTEGER REFERENCES organizations(id),
      amount REAL NOT NULL,
      fee REAL DEFAULT 0.0,
      cycle TEXT CHECK(cycle IN ('daily', 'weekly', 'monthly')),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed')),
      details TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS micro_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('survey', 'trial_play', 'share')),
      description TEXT,
      reward REAL NOT NULL,
      quota INTEGER NOT NULL,
      completed INTEGER DEFAULT 0,
      org_id INTEGER REFERENCES organizations(id),
      status TEXT DEFAULT 'published' CHECK(status IN ('published', 'paused', 'closed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS micro_task_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER REFERENCES micro_tasks(id),
      student_id INTEGER REFERENCES student_profiles(id),
      result TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER REFERENCES users(id),
      to_user_id INTEGER REFERENCES users(id),
      score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 5),
      comment TEXT,
      tags TEXT DEFAULT '[]',
      related_job_id INTEGER REFERENCES jobs(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS risk_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('overtime', 'unsigned_contract', 'abnormal_behavior')),
      level TEXT NOT NULL CHECK(level IN ('high', 'medium', 'low')),
      message TEXT NOT NULL,
      org_id INTEGER REFERENCES organizations(id),
      related_user_id INTEGER REFERENCES users(id),
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'resolved', 'ignored')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_org ON jobs(org_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_type ON jobs(type);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
    CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_job_date ON attendance(job_id, checkin_time);
    CREATE INDEX IF NOT EXISTS idx_interview_messages_interview ON interview_messages(interview_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_to_user ON evaluations(to_user_id);
    CREATE INDEX IF NOT EXISTS idx_risk_alerts_org_status ON risk_alerts(org_id, status);
  `)

  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count === 0) {
    seedDatabase(database)
  }
}

function seedDatabase(db: Database.Database): void {
  const insertOrg = db.prepare(`
    INSERT INTO organizations (name, type, parent_id, contact) VALUES (?, ?, ?, ?)
  `)

  const org1 = insertOrg.run('杭州云校教育科技集团', 'group', null, '0571-88888888')
  const org2 = insertOrg.run('浙江大学校园服务中心', 'branch', org1.lastInsertRowid as number, '0571-87654321')
  const org3 = insertOrg.run('杭州电子科技大学分部', 'branch', org1.lastInsertRowid as number, '0571-87659999')

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, role, org_id, password_hash, credit_score, avatar) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  const passwordHash = '$2b$10$mockhashvalue_for_testing_only'

  const admin1 = insertUser.run('王建国', 'wangjianguo@yunxiao.com', 'admin', org1.lastInsertRowid, passwordHash, 95, '/avatars/admin1.png')
  const admin2 = insertUser.run('李明辉', 'liminghui@yunxiao.com', 'admin', org2.lastInsertRowid, passwordHash, 92, '/avatars/admin2.png')

  const hr1 = insertUser.run('张丽华', 'zhanglihua@zju.edu.cn', 'hr', org2.lastInsertRowid, passwordHash, 88, '/avatars/hr1.png')
  const hr2 = insertUser.run('陈晓燕', 'chenxiaoyan@hdu.edu.cn', 'hr', org3.lastInsertRowid, passwordHash, 85, '/avatars/hr2.png')
  const hr3 = insertUser.run('刘婷婷', 'liutingting@yunxiao.com', 'hr', org1.lastInsertRowid, passwordHash, 90, '/avatars/hr3.png')
  const hr4 = insertUser.run('赵雅琴', 'zhaoyaqin@zju.edu.cn', 'hr', org2.lastInsertRowid, passwordHash, 87, '/avatars/hr4.png')
  const hr5 = insertUser.run('孙悦', 'sunyue@hdu.edu.cn', 'hr', org3.lastInsertRowid, passwordHash, 83, '/avatars/hr5.png')

  const branchAdmin1 = insertUser.run('马文博', 'mawenbo@zju.edu.cn', 'branch_admin', org2.lastInsertRowid, passwordHash, 91, '/avatars/ba1.png')
  const branchAdmin2 = insertUser.run('周建华', 'zhoujianhua@hdu.edu.cn', 'branch_admin', org3.lastInsertRowid, passwordHash, 89, '/avatars/ba2.png')
  const branchAdmin3 = insertUser.run('吴雪梅', 'wuxuemei@zju.edu.cn', 'branch_admin', org2.lastInsertRowid, passwordHash, 86, '/avatars/ba3.png')

  const mentor1 = insertUser.run('黄志强', 'huangzhiqiang@zju.edu.cn', 'mentor', org2.lastInsertRowid, passwordHash, 94, '/avatars/mentor1.png')
  const mentor2 = insertUser.run('杨秀英', 'yangxiuying@hdu.edu.cn', 'mentor', org3.lastInsertRowid, passwordHash, 93, '/avatars/mentor2.png')
  const mentor3 = insertUser.run('郑伟', 'zhengwei@zju.edu.cn', 'mentor', org2.lastInsertRowid, passwordHash, 88, '/avatars/mentor3.png')
  const mentor4 = insertUser.run('林美玲', 'linmeiling@yunxiao.com', 'mentor', org1.lastInsertRowid, passwordHash, 91, '/avatars/mentor4.png')
  const mentor5 = insertUser.run('何国栋', 'heguodong@hdu.edu.cn', 'mentor', org3.lastInsertRowid, passwordHash, 87, '/avatars/mentor5.png')

  const studentNames = [
    '陈思远', '王子涵', '刘雨萱', '张明轩', '李佳琪',
    '赵天翔', '周心怡', '吴凯旋', '郑雅文', '孙浩然',
    '杨思源', '黄嘉琪', '林宇航', '何欣怡', '马俊杰',
    '罗梦瑶', '徐志远', '高雨涵', '胡晓峰', '谢思琪',
    '韩雨桐', '唐诗语', '邓子轩', '曹思远', '彭雨萱'
  ]

  const universities = ['浙江大学', '杭州电子科技大学', '浙江工业大学', '浙江理工大学', '杭州师范大学']
  const majors = ['计算机科学与技术', '软件工程', '数据科学', '人工智能', '信息安全', '电子信息工程', '数字媒体技术', '工商管理']
  const grades = ['大一', '大二', '大三', '大四', '研一', '研二']
  const skillsPool = ['Python', 'Java', 'JavaScript', 'React', 'Vue', 'Node.js', 'SQL', '数据分析', '机器学习', 'UI设计', '视频剪辑', '文案写作', 'Excel', 'Photoshop', 'Figma']
  const certsPool = ['英语六级', '计算机二级', '普通话甲级', '教师资格证', 'CPA', 'AWS认证', 'PMP', '心理咨询师']

  const studentIds: number[] = []

  const insertProfile = db.prepare(`
    INSERT INTO student_profiles (user_id, university, major, grade, skills, certificates, rating, resume_text) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (let i = 0; i < studentNames.length; i++) {
    const student = insertUser.run(
      studentNames[i],
      `student${i + 1}@campus.edu.cn`,
      'student',
      i % 2 === 0 ? org2.lastInsertRowid : org3.lastInsertRowid,
      passwordHash,
      70 + Math.floor(Math.random() * 25),
      `/avatars/student${i + 1}.png`
    )

    const numSkills = 3 + Math.floor(Math.random() * 5)
    const numCerts = 1 + Math.floor(Math.random() * 3)
    const shuffledSkills = [...skillsPool].sort(() => Math.random() - 0.5)
    const shuffledCerts = [...certsPool].sort(() => Math.random() - 0.5)
    const skills = shuffledSkills.slice(0, numSkills)
    const certs = shuffledCerts.slice(0, numCerts)
    const university = universities[i % universities.length]
    const major = majors[i % majors.length]
    const grade = grades[i % grades.length]
    const rating = +(2.5 + Math.random() * 2.5).toFixed(1)

    const profile = insertProfile.run(
      student.lastInsertRowid,
      university,
      major,
      grade,
      JSON.stringify(skills),
      JSON.stringify(certs),
      rating,
      `${studentNames[i]}，${university}${major}专业${grade}学生，擅长${skills.join('、')}，持有${certs.join('、')}证书。在校期间积极参与社会实践和志愿服务，具备良好的团队协作能力和沟通能力。`
    )

    studentIds.push(profile.lastInsertRowid as number)
  }

  const insertJob = db.prepare(`
    INSERT INTO jobs (title, type, description, requirements, salary_min, salary_max, org_id, status, settlement_cycle, headcount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const jobsData = [
    { title: '暑期行政助理', type: 'summer_winter', desc: '协助行政办公室处理日常事务，包括文件归档、会议记录、来访接待等', reqs: { skills: ['Excel', '文案写作'], education: '本科在读', experience: '无要求' }, salMin: 120, salMax: 150, org: org2, status: 'published', cycle: 'monthly', head: 3 },
    { title: 'Java开发实习生', type: 'internship', desc: '参与公司核心业务系统的开发与维护，使用Spring Boot框架进行后端开发', reqs: { skills: ['Java', 'SQL', 'Node.js'], education: '本科大三以上', experience: '有项目经验优先' }, salMin: 200, salMax: 300, org: org1, status: 'published', cycle: 'monthly', head: 5 },
    { title: '在线问卷调查员', type: 'online_task', desc: '完成指定主题的在线问卷调查，收集用户反馈数据', reqs: { skills: ['数据分析', 'Excel'], education: '不限', experience: '无要求' }, salMin: 50, salMax: 80, org: org2, status: 'published', cycle: 'daily', head: 20 },
    { title: 'UI设计实习生', type: 'internship', desc: '参与移动端和Web端产品的UI/UX设计，输出设计稿和交互原型', reqs: { skills: ['UI设计', 'Figma', 'Photoshop'], education: '本科在读', experience: '有作品集优先' }, salMin: 180, salMax: 250, org: org1, status: 'published', cycle: 'monthly', head: 2 },
    { title: '寒假图书馆管理员', type: 'summer_winter', desc: '负责图书馆书籍整理、借还登记、阅览室秩序维护等工作', reqs: { skills: ['Excel'], education: '大专以上', experience: '无要求' }, salMin: 100, salMax: 130, org: org3, status: 'published', cycle: 'monthly', head: 4 },
    { title: 'Python数据分析助理', type: 'internship', desc: '协助数据团队进行数据清洗、分析和可视化工作', reqs: { skills: ['Python', '数据分析', '机器学习'], education: '本科大三以上', experience: '有数据分析经验优先' }, salMin: 220, salMax: 320, org: org1, status: 'published', cycle: 'monthly', head: 3 },
    { title: '新媒体运营助理', type: 'online_task', desc: '负责微信公众号、小红书等平台的内容策划和运营', reqs: { skills: ['文案写作', '视频剪辑', 'Photoshop'], education: '本科在读', experience: '有新媒体运营经验优先' }, salMin: 130, salMax: 180, org: org2, status: 'published', cycle: 'weekly', head: 3 },
    { title: '前端开发实习生', type: 'internship', desc: '参与公司前端项目开发，使用React/Vue技术栈', reqs: { skills: ['React', 'Vue', 'JavaScript'], education: '本科大三以上', experience: '有前端项目经验优先' }, salMin: 200, salMax: 280, org: org1, status: 'published', cycle: 'monthly', head: 4 },
    { title: '校园大使招募', type: 'online_task', desc: '负责在校园内推广公司产品，收集用户反馈，组织线下活动', reqs: { skills: ['文案写作'], education: '本科在读', experience: '有社团经验优先' }, salMin: 80, salMax: 150, org: org2, status: 'published', cycle: 'weekly', head: 10 },
    { title: '视频剪辑助理', type: 'online_task', desc: '协助短视频内容的剪辑、配音和后期制作', reqs: { skills: ['视频剪辑', 'Photoshop'], education: '不限', experience: '会使用剪辑软件' }, salMin: 100, salMax: 200, org: org3, status: 'published', cycle: 'weekly', head: 5 },
    { title: '信息安全实习生', type: 'internship', desc: '参与公司安全审计和渗透测试工作，编写安全报告', reqs: { skills: ['信息安全', 'Python', 'SQL'], education: '本科大三以上', experience: '有CTF经验优先' }, salMin: 250, salMax: 350, org: org1, status: 'draft', cycle: 'monthly', head: 2 },
    { title: '冬季招生助理', type: 'summer_winter', desc: '协助招生办进行冬季招生宣传、咨询接待和资料整理', reqs: { skills: ['Excel', '文案写作'], education: '本科在读', experience: '无要求' }, salMin: 110, salMax: 140, org: org2, status: 'draft', cycle: 'monthly', head: 6 },
  ]

  const jobIds: number[] = []
  for (const j of jobsData) {
    const result = insertJob.run(j.title, j.type, j.desc, JSON.stringify(j.reqs), j.salMin, j.salMax, j.org.lastInsertRowid, j.status, j.cycle, j.head)
    jobIds.push(result.lastInsertRowid as number)
  }

  const insertApp = db.prepare(`
    INSERT INTO applications (job_id, student_id, status, cover_letter) VALUES (?, ?, ?, ?)
  `)

  const appStatuses = ['pending', 'shortlisted', 'interviewed', 'offered', 'rejected'] as const
  const coverLetters = [
    '您好，我对该岗位非常感兴趣，在校期间有相关实践经验，希望能得到这个机会。',
    '老师好，我专业对口，学习能力强，期待能加入贵团队。',
    '尊敬的HR，我具备该岗位所需的技能和热情，希望能为贵公司贡献力量。',
    '您好，我有丰富的项目经验，相信能胜任此岗位，期待面试机会。',
    '老师您好，我对这个方向非常热爱，课余时间一直在钻研相关技术。'
  ]

  const appIds: number[] = []
  for (let jIdx = 0; jIdx < Math.min(jobIds.length, 8); jIdx++) {
    const numApps = 3 + Math.floor(Math.random() * 4)
    for (let a = 0; a < numApps && a < studentIds.length; a++) {
      const sIdx = (jIdx * 3 + a) % studentIds.length
      const status = appStatuses[Math.floor(Math.random() * appStatuses.length)]
      const result = insertApp.run(jobIds[jIdx], studentIds[sIdx], status, coverLetters[a % coverLetters.length])
      appIds.push(result.lastInsertRowid as number)
    }
  }

  const insertInterview = db.prepare(`
    INSERT INTO interviews (job_id, application_id, type, status, summary, scheduled_at) VALUES (?, ?, ?, ?, ?, ?)
  `)

  const interviewIds: number[] = []
  for (let i = 0; i < Math.min(appIds.length, 12); i++) {
    const jIdx = i % Math.min(jobIds.length, 8)
    const types = ['group_chat', 'video', 'phone']
    const statuses = ['scheduled', 'in_progress', 'completed']
    const summaries = [
      '候选人表达清晰，技术基础扎实，建议进入下一轮。',
      '沟通能力良好，但项目经验偏少，需进一步考察。',
      '综合素质较好，与岗位匹配度较高，推荐录用。',
      '候选人对该领域有热情，但实操能力有待提升。'
    ]
    const result = insertInterview.run(
      jobIds[jIdx],
      appIds[i],
      types[i % types.length],
      statuses[i % statuses.length],
      i % 3 === 2 ? summaries[i % summaries.length] : null,
      `2026-06-${10 + i} ${9 + (i % 4)}:00:00`
    )
    interviewIds.push(result.lastInsertRowid as number)
  }

  const insertMessage = db.prepare(`
    INSERT INTO interview_messages (interview_id, sender_id, content, type, file_url) VALUES (?, ?, ?, ?, ?)
  `)

  const messagesData = [
    { sender: 3, content: '欢迎各位参加本次面试，请先简单做个自我介绍吧', type: 'text' },
    { sender: 9, content: '好的，我是浙江大学计算机专业的学生，擅长Java和Python', type: 'text' },
    { sender: 3, content: '请分享一下你做过的项目经验', type: 'text' },
    { sender: 10, content: '我参与过校园二手交易平台的后端开发，使用Spring Boot', type: 'text' },
    { sender: 3, content: '这是岗位详情资料，请大家查阅', type: 'file', file_url: '/files/job_detail.pdf' },
    { sender: 0, content: '面试已开始，请各位按时参加', type: 'system' },
  ]

  for (const ivId of interviewIds) {
    for (const msg of messagesData) {
      const senderId = msg.sender === 0 ? (hr1.lastInsertRowid as number) : (msg.sender <= 5 ? (hr1.lastInsertRowid as number) : studentIds[(msg.sender - 6) % studentIds.length])
      insertMessage.run(ivId, senderId, msg.content, msg.type, msg.type === 'file' ? msg.file_url : null)
    }
  }

  const insertAttendance = db.prepare(`
    INSERT INTO attendance (job_id, student_id, checkin_time, checkout_time, method, status, location) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  for (let jIdx = 0; jIdx < Math.min(jobIds.length, 6); jIdx++) {
    const numRecords = 3 + Math.floor(Math.random() * 3)
    for (let r = 0; r < numRecords; r++) {
      const sIdx = (jIdx * 2 + r) % studentIds.length
      const day = 1 + r * 2
      const hour = 8 + Math.floor(Math.random() * 2)
      const status = Math.random() > 0.85 ? 'late' : (Math.random() > 0.9 ? 'absent' : 'normal')
      insertAttendance.run(
        jobIds[jIdx],
        studentIds[sIdx],
        `2026-06-0${day} ${hour}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00`,
        status !== 'absent' ? `2026-06-0${day} ${17 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:00` : null,
        'qrcode',
        status,
        '浙江大学紫金港校区'
      )
    }
  }

  const insertFundPool = db.prepare(`
    INSERT INTO fund_pools (org_id, balance, frozen, pending) VALUES (?, ?, ?, ?)
  `)
  insertFundPool.run(org1.lastInsertRowid, 500000, 80000, 25000)
  insertFundPool.run(org2.lastInsertRowid, 200000, 30000, 12000)
  insertFundPool.run(org3.lastInsertRowid, 150000, 20000, 8000)

  const insertSettlement = db.prepare(`
    INSERT INTO settlements (org_id, amount, fee, cycle, status, details) VALUES (?, ?, ?, ?, ?, ?)
  `)

  const settlementData = [
    { orgId: org1.lastInsertRowid, amount: 45000, fee: 2250, cycle: 'monthly', status: 'completed', details: [{ studentName: '陈思远', amount: 15000 }, { studentName: '王子涵', amount: 15000 }, { studentName: '刘雨萱', amount: 15000 }] },
    { orgId: org2.lastInsertRowid, amount: 22000, fee: 1100, cycle: 'monthly', status: 'completed', details: [{ studentName: '张明轩', amount: 12000 }, { studentName: '李佳琪', amount: 10000 }] },
    { orgId: org1.lastInsertRowid, amount: 18000, fee: 900, cycle: 'weekly', status: 'processing', details: [{ studentName: '赵天翔', amount: 9000 }, { studentName: '周心怡', amount: 9000 }] },
    { orgId: org3.lastInsertRowid, amount: 9600, fee: 480, cycle: 'weekly', status: 'pending', details: [{ studentName: '吴凯旋', amount: 4800 }, { studentName: '郑雅文', amount: 4800 }] },
    { orgId: org2.lastInsertRowid, amount: 32000, fee: 1600, cycle: 'monthly', status: 'completed', details: [{ studentName: '孙浩然', amount: 16000 }, { studentName: '杨思源', amount: 16000 }] },
    { orgId: org1.lastInsertRowid, amount: 5000, fee: 250, cycle: 'daily', status: 'completed', details: [{ studentName: '黄嘉琪', amount: 2500 }, { studentName: '林宇航', amount: 2500 }] },
  ]

  for (const s of settlementData) {
    insertSettlement.run(s.orgId, s.amount, s.fee, s.cycle, s.status, JSON.stringify(s.details))
  }

  const insertMicroTask = db.prepare(`
    INSERT INTO micro_tasks (title, type, description, reward, quota, completed, org_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const microTasksData = [
    { title: '大学生消费习惯调查', type: 'survey', desc: '完成一份关于大学生日常消费习惯的问卷调查，约5分钟', reward: 5, quota: 50, completed: 32, org: org2, status: 'published' },
    { title: '校园App体验测试', type: 'trial_play', desc: '下载并体验校园生活App，完成指定功能测试并提交反馈', reward: 15, quota: 30, completed: 18, org: org1, status: 'published' },
    { title: '开学季活动分享', type: 'share', desc: '在社交平台分享开学季活动海报，截图提交', reward: 3, quota: 100, completed: 67, org: org2, status: 'published' },
    { title: '在线学习平台调研', type: 'survey', desc: '完成在线学习平台使用偏好调研问卷', reward: 8, quota: 40, completed: 25, org: org3, status: 'published' },
    { title: '新功能试用反馈', type: 'trial_play', desc: '试用平台新上线的AI助手功能，提交使用感受和建议', reward: 10, quota: 20, completed: 20, org: org1, status: 'paused' },
    { title: '毕业季话题互动', type: 'share', desc: '在微博或小红书参与毕业季话题互动', reward: 2, quota: 200, completed: 143, org: org2, status: 'published' },
    { title: '心理健康调查问卷', type: 'survey', desc: '参与大学生心理健康状况匿名调查', reward: 6, quota: 80, completed: 55, org: org3, status: 'published' },
  ]

  const microTaskIds: number[] = []
  for (const t of microTasksData) {
    const result = insertMicroTask.run(t.title, t.type, t.desc, t.reward, t.quota, t.completed, t.org.lastInsertRowid, t.status)
    microTaskIds.push(result.lastInsertRowid as number)
  }

  const insertSubmission = db.prepare(`
    INSERT INTO micro_task_submissions (task_id, student_id, result, status) VALUES (?, ?, ?, ?)
  `)

  for (let tIdx = 0; tIdx < microTaskIds.length; tIdx++) {
    const numSubs = 3 + Math.floor(Math.random() * 4)
    for (let s = 0; s < numSubs; s++) {
      const sIdx = (tIdx * 3 + s) % studentIds.length
      const statuses = ['pending', 'approved', 'rejected']
      insertSubmission.run(
        microTaskIds[tIdx],
        studentIds[sIdx],
        tIdx % 3 === 0 ? '问卷已完成，感谢参与' : (tIdx % 3 === 1 ? '已下载体验并提交反馈' : '已分享至社交平台'),
        statuses[s % statuses.length]
      )
    }
  }

  const insertEvaluation = db.prepare(`
    INSERT INTO evaluations (from_user_id, to_user_id, score, comment, tags, related_job_id) VALUES (?, ?, ?, ?, ?, ?)
  `)

  const evaluationData = [
    { from: hr1, to: 9, score: 4, comment: '工作认真负责，学习能力强', tags: ['认真负责', '学习能力强'] },
    { from: hr2, to: 10, score: 5, comment: '技术扎实，团队协作好', tags: ['技术扎实', '团队协作好'] },
    { from: mentor1, to: 11, score: 3, comment: '基础可以，需要更多实践', tags: ['基础扎实'] },
    { from: hr1, to: 12, score: 4, comment: '设计能力突出，作品质量高', tags: ['设计能力突出', '审美佳'] },
    { from: hr3, to: 13, score: 5, comment: '数据分析能力强，逻辑清晰', tags: ['分析能力强', '逻辑清晰'] },
    { from: 9, to: hr1.lastInsertRowid, score: 5, comment: '导师很耐心，指导很专业', tags: ['耐心', '专业'] },
    { from: 10, to: mentor1.lastInsertRowid, score: 4, comment: '导师技术指导很有帮助', tags: ['技术指导好'] },
    { from: hr2, to: 14, score: 3, comment: '沟通能力有待提升，但态度端正', tags: ['态度端正'] },
    { from: hr4, to: 15, score: 4, comment: '文案功底不错，执行力强', tags: ['文案功底好', '执行力强'] },
    { from: mentor2, to: 16, score: 5, comment: '编程能力出众，项目完成质量高', tags: ['编程能力强', '质量高'] },
    { from: hr1, to: 17, score: 4, comment: '视频剪辑技巧娴熟，创意十足', tags: ['创意十足', '技能娴熟'] },
    { from: hr3, to: 18, score: 3, comment: '工作尚可，但需要更主动一些', tags: ['需更主动'] },
  ]

  for (const e of evaluationData) {
    const fromId = typeof e.from === 'number' ? e.from : Number((e.from as any).lastInsertRowid)
    const toId = typeof e.to === 'number' ? e.to : Number((e.to as any).lastInsertRowid)
    insertEvaluation.run(fromId, toId, e.score, e.comment, JSON.stringify(e.tags), jobIds[Math.floor(Math.random() * Math.min(jobIds.length, 8))])
  }

  const insertRiskAlert = db.prepare(`
    INSERT INTO risk_alerts (type, level, message, org_id, related_user_id, status) VALUES (?, ?, ?, ?, ?, ?)
  `)

  const riskData = [
    { type: 'overtime', level: 'high', message: '学生陈思远连续工作超过8小时，已超出校园用工时限规定', org: org2, user: 9, status: 'pending' },
    { type: 'unsigned_contract', level: 'high', message: 'Java开发实习生岗位存在3名未签订合同的上岗学生', org: org1, user: 10, status: 'pending' },
    { type: 'abnormal_behavior', level: 'medium', message: '学生赵天翔近期考勤异常，连续3次迟到', org: org2, user: 13, status: 'pending' },
    { type: 'overtime', level: 'medium', message: '本周有5名学生周工时超过28小时', org: org2, user: 11, status: 'resolved' },
    { type: 'unsigned_contract', level: 'low', message: 'UI设计实习生岗位合同即将到期，请及时续签', org: org1, user: 12, status: 'pending' },
    { type: 'abnormal_behavior', level: 'high', message: '学生孙浩然在岗期间擅自离岗，请核实情况', org: org3, user: 17, status: 'pending' },
    { type: 'overtime', level: 'low', message: '在线问卷调查任务平均完成时间超出预估2倍', org: org2, user: 14, status: 'ignored' },
    { type: 'unsigned_contract', level: 'medium', message: '杭州电子科技大学分部有2名实习生合同信息缺失', org: org3, user: 15, status: 'pending' },
  ]

  for (const r of riskData) {
    insertRiskAlert.run(r.type, r.level, r.message, r.org.lastInsertRowid, r.user, r.status)
  }

  console.log('Database seeded successfully')
}
