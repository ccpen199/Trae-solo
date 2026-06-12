import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'app.sqlite')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('talent', 'institution', 'admin')),
    verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS talent_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    practice_category TEXT,
    department TEXT,
    title TEXT,
    certificate_url TEXT,
    gender TEXT,
    age INTEGER,
    email TEXT,
    location TEXT
  );

  CREATE TABLE IF NOT EXISTS institution_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    institution_name TEXT NOT NULL,
    institution_type TEXT,
    license_url TEXT,
    credit_code TEXT,
    license_expiry TEXT,
    review_status TEXT NOT NULL DEFAULT 'pending',
    last_review_date TEXT,
    location TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS resumes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    talent_id INTEGER NOT NULL REFERENCES talent_profiles(id),
    basic_info TEXT NOT NULL DEFAULT '{}',
    education TEXT NOT NULL DEFAULT '[]',
    certifications TEXT NOT NULL DEFAULT '[]',
    work_experience TEXT NOT NULL DEFAULT '[]',
    privacy_settings TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    institution_id INTEGER NOT NULL REFERENCES institution_profiles(id),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    required_title TEXT,
    required_category TEXT,
    location TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    description TEXT,
    requirements TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'active', 'rejected', 'closed')),
    ai_risk_score INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL REFERENCES jobs(id),
    talent_id INTEGER NOT NULL REFERENCES talent_profiles(id),
    status TEXT NOT NULL DEFAULT 'applied' CHECK(status IN ('applied', 'read', 'invited', 'interview', 'offered', 'rejected')),
    timeline TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(job_id, talent_id)
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    talent_id INTEGER NOT NULL REFERENCES talent_profiles(id),
    institution_id INTEGER NOT NULL REFERENCES institution_profiles(id),
    last_message TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(talent_id, institution_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id),
    sender_id INTEGER NOT NULL REFERENCES users(id),
    sender_role TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'text' CHECK(type IN ('text', 'resume_card', 'job_card')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    category TEXT NOT NULL CHECK(category IN ('news', 'policy', 'education')),
    likes INTEGER NOT NULL DEFAULT 0,
    comments INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL REFERENCES community_posts(id),
    author_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`)

try {
  db.exec(`
    ALTER TABLE jobs ADD COLUMN approved_by INTEGER REFERENCES users(id);
    ALTER TABLE jobs ADD COLUMN approved_at TEXT;
    ALTER TABLE jobs ADD COLUMN closed_reason TEXT;
    ALTER TABLE jobs ADD COLUMN closed_at TEXT;
    ALTER TABLE jobs ADD COLUMN closed_by INTEGER REFERENCES users(id);
    ALTER TABLE jobs ADD COLUMN review_note TEXT;
  `)
} catch (e) {}

try {
  db.exec(`
    ALTER TABLE applications ADD COLUMN read_at TEXT;
    ALTER TABLE applications ADD COLUMN invited_at TEXT;
    ALTER TABLE applications ADD COLUMN interview_at TEXT;
    ALTER TABLE applications ADD COLUMN offered_at TEXT;
    ALTER TABLE applications ADD COLUMN rejected_at TEXT;
  `)
} catch (e) {}

try {
  db.exec(`
    ALTER TABLE institution_profiles ADD COLUMN verified_level INTEGER DEFAULT 0;
  `)
} catch (e) {}

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
if (userCount.count === 0) {
  const insertUser = db.prepare(`
    INSERT INTO users (phone, password, name, role, verified) VALUES (?, ?, ?, ?, ?)
  `)
  const insertTalentProfile = db.prepare(`
    INSERT INTO talent_profiles (user_id, practice_category, department, title, gender, age, email, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertInstitutionProfile = db.prepare(`
    INSERT INTO institution_profiles (user_id, institution_name, institution_type, credit_code, license_expiry, review_status, last_review_date, location, description, verified_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertResume = db.prepare(`
    INSERT INTO resumes (talent_id, basic_info, education, certifications, work_experience, privacy_settings) VALUES (?, ?, ?, ?, ?, ?)
  `)
  const insertJob = db.prepare(`
    INSERT INTO jobs (institution_id, title, department, required_title, required_category, location, salary_min, salary_max, description, requirements, status, ai_risk_score, approved_by, approved_at, review_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertApplication = db.prepare(`
    INSERT INTO applications (job_id, talent_id, status, timeline, read_at, invited_at, interview_at, offered_at, rejected_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertConversation = db.prepare(`
    INSERT INTO conversations (talent_id, institution_id, last_message, updated_at) VALUES (?, ?, ?, datetime('now'))
  `)
  const insertMessage = db.prepare(`
    INSERT INTO messages (conversation_id, sender_id, sender_role, content, type) VALUES (?, ?, ?, ?, ?)
  `)
  const insertPost = db.prepare(`
    INSERT INTO community_posts (author_id, title, content, tags, category, likes, comments) VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const insertComment = db.prepare(`
    INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?)
  `)

  const seed = db.transaction(() => {
    insertUser.run('13800000001', 'admin123', '系统管理员', 'admin', 1)

    const talentData = [
      { phone: '13800000002', name: '张伟', category: '临床', dept: '内科', title: '主治医师', gender: '男', age: 35, email: 'zhangwei@med.com', location: '北京' },
      { phone: '13800000003', name: '李娜', category: '临床', dept: '外科', title: '副主任医师', gender: '女', age: 42, email: 'lina@med.com', location: '上海' },
      { phone: '13800000004', name: '王磊', category: '临床', dept: '儿科', title: '住院医师', gender: '男', age: 28, email: 'wanglei@med.com', location: '广州' },
      { phone: '13800000005', name: '陈静', category: '临床', dept: '妇产科', title: '主治医师', gender: '女', age: 33, email: 'chenjing@med.com', location: '深圳' },
      { phone: '13800000006', name: '刘洋', category: '药学', dept: '药学', title: '主任药师', gender: '男', age: 50, email: 'liuyang@med.com', location: '杭州' },
    ]

    const talentUserIds: number[] = []
    const talentProfileIds: number[] = []

    for (const t of talentData) {
      const r = insertUser.run(t.phone, '123456', t.name, 'talent', 1)
      talentUserIds.push(Number(r.lastInsertRowid))
      const pr = insertTalentProfile.run(r.lastInsertRowid, t.category, t.dept, t.title, t.gender, t.age, t.email, t.location)
      talentProfileIds.push(Number(pr.lastInsertRowid))
    }

    const instData = [
      { name: '北京协和医院', type: '三甲医院', code: '91110000MA01A001', expiry: '2027-12-31', review: 'approved', lastDate: '2025-01-15', location: '北京', desc: '中国最顶尖的综合性医院之一', verifiedLevel: 2 },
      { name: '上海市第一人民医院', type: '二甲医院', code: '91310000MA01B002', expiry: '2026-06-30', review: 'approved', lastDate: '2024-11-20', location: '上海', desc: '上海市历史悠久的综合性医院', verifiedLevel: 2 },
      { name: '广州妇儿医疗中心', type: '专科医院', code: '91440100MA01C003', expiry: '2026-03-15', review: 'pending', lastDate: null, location: '广州', desc: '专注于妇女儿童健康的专科医疗机构', verifiedLevel: 0 },
      { name: '杭州西湖社区卫生服务中心', type: '社区医院', code: '91330100MA01D004', expiry: '2025-09-30', review: 'approved', lastDate: '2024-08-10', location: '杭州', desc: '服务社区的基层医疗机构', verifiedLevel: 1 },
    ]

    const instUserIds: number[] = []
    const instProfileIds: number[] = []

    for (const inst of instData) {
      const r = insertUser.run(`1390000000${instProfileIds.length + 1}`, '123456', inst.name, 'institution', 1)
      instUserIds.push(Number(r.lastInsertRowid))
      const pr = insertInstitutionProfile.run(r.lastInsertRowid, inst.name, inst.type, inst.code, inst.expiry, inst.review, inst.lastDate, inst.location, inst.desc, inst.verifiedLevel)
      instProfileIds.push(Number(pr.lastInsertRowid))
    }

    for (let i = 0; i < talentProfileIds.length; i++) {
      const tp = talentProfileIds[i]
      const t = talentData[i]
      insertResume.run(
        tp,
        JSON.stringify({ name: t.name, gender: t.gender, age: t.age, phone: t.phone, email: t.email, location: t.location }),
        JSON.stringify([
          { school: '北京大学医学部', degree: '博士', major: '临床医学', year: `${2010 + i}` },
          { school: '复旦大学上海医学院', degree: '硕士', major: '基础医学', year: `${2007 + i}` },
        ]),
        JSON.stringify([
          { name: '执业医师资格证', year: `${2012 + i}`, status: '有效' },
          { name: '专科医师规范化培训合格证', year: `${2015 + i}`, status: '有效' },
        ]),
        JSON.stringify([
          { hospital: instData[0].name, department: t.dept, position: t.title, startYear: `${2013 + i}`, endYear: '至今' },
        ]),
        JSON.stringify({ phone: false, email: true, realName: false })
      )
    }

    const jobData = [
      { inst: 0, title: '内科主治医师', dept: '内科', reqTitle: '主治医师', reqCat: '临床', loc: '北京', salMin: 15000, salMax: 25000, desc: '负责内科门诊及住院患者的诊疗工作', req: '内科主治医师职称，3年以上临床经验', status: 'active', risk: 0, approvedBy: 1, approvedAt: '2025-01-20T10:00:00Z', reviewNote: '资质齐全，信息真实，予以通过' },
      { inst: 0, title: '外科副主任医师', dept: '外科', reqTitle: '副主任医师', reqCat: '临床', loc: '北京', salMin: 20000, salMax: 35000, desc: '负责外科手术及疑难病例会诊', req: '外科副主任医师职称，5年以上临床经验', status: 'active', risk: 0, approvedBy: 1, approvedAt: '2025-01-22T14:30:00Z', reviewNote: '高职称岗位，薪资合理，予以通过' },
      { inst: 1, title: '儿科住院医师', dept: '儿科', reqTitle: '住院医师', reqCat: '临床', loc: '上海', salMin: 10000, salMax: 18000, desc: '负责儿科门诊及病房工作', req: '儿科住院医师规范化培训合格', status: 'active', risk: 0, approvedBy: 1, approvedAt: '2025-02-01T09:15:00Z', reviewNote: '住院医师岗位，要求合理，予以通过' },
      { inst: 1, title: '妇产科主治医师', dept: '妇产科', reqTitle: '主治医师', reqCat: '临床', loc: '上海', salMin: 14000, salMax: 22000, desc: '负责妇产科门诊及手术', req: '妇产科主治医师职称，2年以上临床经验', status: 'active', risk: 0, approvedBy: 1, approvedAt: '2025-02-05T11:00:00Z', reviewNote: '主治医师岗位，信息完整，予以通过' },
      { inst: 2, title: '儿科主治医师', dept: '儿科', reqTitle: '主治医师', reqCat: '临床', loc: '广州', salMin: 12000, salMax: 20000, desc: '负责儿童常见病的诊疗', req: '儿科主治医师职称', status: 'pending', risk: 15, approvedBy: null, approvedAt: null, reviewNote: '机构未完成高级认证，职位暂缓上架' },
      { inst: 2, title: '产科住院医师', dept: '妇产科', reqTitle: '住院医师', reqCat: '临床', loc: '广州', salMin: 10000, salMax: 16000, desc: '负责产科病房及分娩工作', req: '妇产科住院医师规范化培训合格', status: 'pending', risk: 10, approvedBy: null, approvedAt: null, reviewNote: '机构未完成高级认证，职位暂缓上架' },
      { inst: 3, title: '全科医生', dept: '全科', reqTitle: '主治医师', reqCat: '临床', loc: '杭州', salMin: 8000, salMax: 15000, desc: '负责社区居民常见病诊疗及健康管理', req: '全科医学主治医师职称', status: 'pending', risk: 8, approvedBy: null, approvedAt: null, reviewNote: '机构仅基础认证，需高级认证后方可上架' },
      { inst: 3, title: '药房主管', dept: '药学', reqTitle: '主管药师', reqCat: '药学', loc: '杭州', salMin: 9000, salMax: 14000, desc: '负责药房日常管理及药品调配', req: '主管药师及以上职称，2年以上药房管理经验', status: 'pending', risk: 5, approvedBy: null, approvedAt: null, reviewNote: '机构仅基础认证，需高级认证后方可上架' },
      { inst: 0, title: '急诊科医师', dept: '急诊科', reqTitle: '主治医师', reqCat: '临床', loc: '北京', salMin: 18000, salMax: 30000, desc: '负责急诊患者的救治及抢救工作', req: '急诊科主治医师职称，3年以上急诊经验', status: 'active', risk: 5, approvedBy: 1, approvedAt: '2025-02-15T09:00:00Z', reviewNote: '急诊岗位，风险评分5，需关注薪资合理性' },
    ]

    const jobIds: number[] = []
    for (const j of jobData) {
      const r = insertJob.run(instProfileIds[j.inst], j.title, j.dept, j.reqTitle, j.reqCat, j.loc, j.salMin, j.salMax, j.desc, j.req, j.status, j.risk, j.approvedBy, j.approvedAt, j.reviewNote)
      jobIds.push(Number(r.lastInsertRowid))
    }

    const appData = [
      { job: 0, talent: 0, status: 'interview', timeline: '[{"status":"applied","at":"2025-03-01"},{"status":"read","at":"2025-03-02"},{"status":"invited","at":"2025-03-05"},{"status":"interview","at":"2025-03-10"}]', readAt: '2025-03-02T10:00:00Z', invitedAt: '2025-03-05T14:30:00Z', interviewAt: '2025-03-10T09:00:00Z', offeredAt: null, rejectedAt: null },
      { job: 1, talent: 1, status: 'offered', timeline: '[{"status":"applied","at":"2025-02-15"},{"status":"read","at":"2025-02-16"},{"status":"invited","at":"2025-02-20"},{"status":"interview","at":"2025-02-25"},{"status":"offered","at":"2025-03-01"}]', readAt: '2025-02-16T11:00:00Z', invitedAt: '2025-02-20T15:00:00Z', interviewAt: '2025-02-25T10:00:00Z', offeredAt: '2025-03-01T16:00:00Z', rejectedAt: null },
      { job: 2, talent: 2, status: 'read', timeline: '[{"status":"applied","at":"2025-04-01"},{"status":"read","at":"2025-04-02"}]', readAt: '2025-04-02T09:30:00Z', invitedAt: null, interviewAt: null, offeredAt: null, rejectedAt: null },
      { job: 3, talent: 3, status: 'applied', timeline: '[{"status":"applied","at":"2025-04-10"}]', readAt: null, invitedAt: null, interviewAt: null, offeredAt: null, rejectedAt: null },
      { job: 4, talent: 2, status: 'invited', timeline: '[{"status":"applied","at":"2025-03-20"},{"status":"read","at":"2025-03-21"},{"status":"invited","at":"2025-03-25"}]', readAt: '2025-03-21T14:00:00Z', invitedAt: '2025-03-25T10:30:00Z', interviewAt: null, offeredAt: null, rejectedAt: null },
      { job: 6, talent: 3, status: 'rejected', timeline: '[{"status":"applied","at":"2025-03-15"},{"status":"read","at":"2025-03-16"},{"status":"rejected","at":"2025-03-20"}]', readAt: '2025-03-16T11:00:00Z', invitedAt: null, interviewAt: null, offeredAt: null, rejectedAt: '2025-03-20T16:00:00Z' },
      { job: 7, talent: 4, status: 'applied', timeline: '[{"status":"applied","at":"2025-04-05"}]', readAt: null, invitedAt: null, interviewAt: null, offeredAt: null, rejectedAt: null },
      { job: 8, talent: 0, status: 'applied', timeline: '[{"status":"applied","at":"2025-04-12"}]', readAt: null, invitedAt: null, interviewAt: null, offeredAt: null, rejectedAt: null },
    ]

    for (const a of appData) {
      insertApplication.run(jobIds[a.job], talentProfileIds[a.talent], a.status, a.timeline, a.readAt, a.invitedAt, a.interviewAt, a.offeredAt, a.rejectedAt)
    }

    const conv1 = insertConversation.run(talentProfileIds[0], instProfileIds[0], '您好，请问面试时间方便安排吗？')
    const conv2 = insertConversation.run(talentProfileIds[1], instProfileIds[0], '感谢您的录用意向！')
    const conv3 = insertConversation.run(talentProfileIds[2], instProfileIds[1], '请问这个岗位还招人吗？')

    insertMessage.run(Number(conv1.lastInsertRowid), talentUserIds[0], 'talent', '您好，我对贵院内科主治医师职位很感兴趣，请问可以安排面试吗？', 'text')
    insertMessage.run(Number(conv1.lastInsertRowid), instUserIds[0], 'institution', '您好张医生，我们已收到您的简历，面试时间方便安排吗？', 'text')
    insertMessage.run(Number(conv1.lastInsertRowid), talentUserIds[0], 'talent', '可以，下周三上午方便。', 'text')

    insertMessage.run(Number(conv2.lastInsertRowid), instUserIds[0], 'institution', '李医生您好，恭喜您通过面试，我们决定录用您。', 'text')
    insertMessage.run(Number(conv2.lastInsertRowid), talentUserIds[1], 'talent', '感谢您的录用意向！我非常愿意加入贵院。', 'text')

    insertMessage.run(Number(conv3.lastInsertRowid), talentUserIds[2], 'talent', '请问上海第一人民医院的儿科岗位还在招人吗？', 'text')
    insertMessage.run(Number(conv3.lastInsertRowid), instUserIds[1], 'institution', '目前还在招聘中，您可以投递简历。', 'text')

    const postData = [
      { author: 0, title: '2025年医疗卫生体制改革最新政策解读', content: '近日，国务院发布了最新的医疗卫生体制改革方案，重点推进分级诊疗制度建设，加强基层医疗服务能力。方案明确提出到2025年底，县域就诊率要达到90%以上...', tags: '["医改","分级诊疗","政策"]', category: 'policy', likes: 128, comments: 45 },
      { author: 1, title: '住院医师规范化培训经验分享', content: '作为一名刚刚完成住院医师规范化培训的医生，我想分享一下自己的培训经历和心得。规培三年，我在内科轮转了多个科室，积累了丰富的临床经验...', tags: '["规培","经验分享","医学教育"]', category: 'education', likes: 256, comments: 89 },
      { author: 0, title: '人工智能在医疗影像诊断中的应用进展', content: '近年来，人工智能技术在医疗影像诊断领域取得了显著进展。多项研究表明，AI辅助诊断系统在肺结节检测、眼底病变筛查等方面的准确率已接近甚至超过资深影像科医生...', tags: '["AI","医疗影像","前沿技术"]', category: 'news', likes: 342, comments: 67 },
      { author: 2, title: '儿科医生短缺问题的深层原因分析', content: '我国儿科医生长期短缺，每千名儿童儿科医生数仅为0.63人，远低于发达国家水平。造成这一局面的原因包括：儿科工作强度大、收入相对较低、职业发展空间有限等...', tags: '["儿科","人才短缺","分析"]', category: 'policy', likes: 189, comments: 56 },
      { author: 3, title: '执业药师继续教育新规解读', content: '国家药监局近日发布新规，对执业药师继续教育制度进行了重大调整。新规要求执业药师每年参加不少于90学时的继续教育，其中专业科目不少于60学时...', tags: '["药师","继续教育","新规"]', category: 'education', likes: 95, comments: 32 },
      { author: 4, title: '社区医院信息化建设实践与思考', content: '随着医疗信息化建设的不断推进，社区医院也面临着数字化转型的挑战。我院在信息化建设中，重点推进了电子病历系统、远程会诊平台和智慧药房建设...', tags: '["社区医院","信息化","实践"]', category: 'news', likes: 67, comments: 21 },
    ]

    const postIds: number[] = []
    for (const p of postData) {
      const r = insertPost.run(talentUserIds[p.author], p.title, p.content, p.tags, p.category, p.likes, p.comments)
      postIds.push(Number(r.lastInsertRowid))
    }

    insertComment.run(postIds[0], talentUserIds[1], '政策解读很及时，分级诊疗确实是未来的方向。')
    insertComment.run(postIds[0], talentUserIds[2], '希望基层医院的待遇能跟上，否则人才留不住。')
    insertComment.run(postIds[1], talentUserIds[3], '规培确实很辛苦，但收获也很大，加油！')
    insertComment.run(postIds[2], instUserIds[0], 'AI辅助诊断在我们医院已经试点应用，效果不错。')
    insertComment.run(postIds[3], talentUserIds[0], '儿科确实需要更多政策支持和投入。')
  })

  seed()
}

export default db
