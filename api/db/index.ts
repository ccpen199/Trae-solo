import Database from 'better-sqlite3'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'

const dbDir = join(process.cwd(), 'data')
mkdirSync(dbDir, { recursive: true })

const dbPath = join(dbDir, 'careerforge.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'seeker',
    encrypted_password TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS resumes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    lang TEXT NOT NULL DEFAULT 'zh',
    template_id TEXT NOT NULL,
    sections TEXT NOT NULL DEFAULT '[]',
    keyword_density TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS resume_cases (
    id TEXT PRIMARY KEY,
    industry TEXT NOT NULL,
    level TEXT NOT NULL,
    company TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    highlights TEXT NOT NULL DEFAULT '[]',
    sections TEXT NOT NULL DEFAULT '[]',
    tags TEXT NOT NULL DEFAULT '[]'
  );

  CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id TEXT REFERENCES resumes(id),
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'todo',
    applied_at TEXT,
    interviews TEXT NOT NULL DEFAULT '[]',
    offer TEXT,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS company_templates (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    sections TEXT NOT NULL DEFAULT '[]',
    scoring_criteria TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    details TEXT NOT NULL DEFAULT '{}'
  );

  CREATE TABLE IF NOT EXISTS compliance_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data_minimization INTEGER NOT NULL DEFAULT 1,
    encrypted_storage INTEGER NOT NULL DEFAULT 1,
    retention_days INTEGER NOT NULL DEFAULT 365
  );

  CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
  CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
  CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_resume_cases_industry ON resume_cases(industry);
  CREATE INDEX IF NOT EXISTS idx_resume_cases_level ON resume_cases(level);
`)

const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
if (userCount.count === 0) {
  const userId1 = uuidv4()
  const userId2 = uuidv4()
  const userId3 = uuidv4()

  const insertUser = db.prepare(
    'INSERT INTO users (id, email, name, role, encrypted_password) VALUES (?, ?, ?, ?, ?)'
  )
  insertUser.run(userId1, 'zhangsan@example.com', '张三', 'seeker', 'hashed_pw_1')
  insertUser.run(userId2, 'hr@techcorp.com', 'HR李经理', 'hr', 'hashed_pw_2')
  insertUser.run(userId3, 'wangwu@example.com', '王五', 'seeker', 'hashed_pw_3')

  const insertResume = db.prepare(
    'INSERT INTO resumes (id, user_id, title, lang, template_id, sections, keyword_density) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const resumeId1 = uuidv4()
  const resumeId2 = uuidv4()
  const resumeId3 = uuidv4()
  insertResume.run(
    resumeId1,
    userId1,
    '前端工程师简历',
    'zh',
    'template-1',
    JSON.stringify([
      { id: 's1', type: 'personal', order: 1, content: { name: '张三', phone: '13800138000', email: 'zhangsan@example.com' } },
      { id: 's2', type: 'education', order: 2, content: { school: '北京大学', degree: '本科', major: '计算机科学', period: '2015-2019' } },
      { id: 's3', type: 'experience', order: 3, content: { company: '字节跳动', role: '前端工程师', period: '2019-2022', description: '负责抖音Web端开发，使用React + TypeScript' } },
      { id: 's4', type: 'skills', order: 4, content: { items: ['React', 'TypeScript', 'Node.js', 'Webpack', 'CSS'] } }
    ]),
    JSON.stringify({ keywords: [{ word: 'React', count: 3, density: 2.1 }, { word: 'TypeScript', count: 2, density: 1.4 }], atsScore: 78 })
  )
  insertResume.run(
    resumeId2,
    userId1,
    'Senior Frontend Engineer Resume',
    'en',
    'template-2',
    JSON.stringify([
      { id: 's1', type: 'personal', order: 1, content: { name: 'Zhang San', phone: '+86 13800138000', email: 'zhangsan@example.com' } },
      { id: 's2', type: 'experience', order: 2, content: { company: 'ByteDance', role: 'Senior Frontend Engineer', period: '2019-2023', description: 'Led the frontend team for TikTok Web' } },
      { id: 's3', type: 'skills', order: 3, content: { items: ['React', 'Vue', 'TypeScript', 'Node.js', 'GraphQL'] } }
    ]),
    JSON.stringify({ keywords: [{ word: 'Frontend', count: 2, density: 1.8 }, { word: 'React', count: 3, density: 2.5 }], atsScore: 82 })
  )
  insertResume.run(
    resumeId3,
    userId3,
    '后端开发简历',
    'zh',
    'template-1',
    JSON.stringify([
      { id: 's1', type: 'personal', order: 1, content: { name: '王五', phone: '13900139000', email: 'wangwu@example.com' } },
      { id: 's2', type: 'education', order: 2, content: { school: '清华大学', degree: '硕士', major: '软件工程', period: '2017-2020' } },
      { id: 's3', type: 'experience', order: 3, content: { company: '阿里巴巴', role: 'Java后端工程师', period: '2020-2023', description: '负责电商核心系统开发' } }
    ]),
    JSON.stringify({ keywords: [{ word: 'Java', count: 4, density: 3.2 }, { word: 'Spring', count: 2, density: 1.6 }], atsScore: 75 })
  )

  const insertCase = db.prepare(
    'INSERT INTO resume_cases (id, industry, level, company, summary, highlights, sections, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  insertCase.run(
    uuidv4(), '互联网', 'senior', '字节跳动',
    '从0到1搭建抖音国际化前端架构，主导微前端方案落地',
    JSON.stringify(['主导微前端架构设计，支撑10+子应用', '搭建前端监控体系，页面性能提升40%', '推动TypeScript落地，代码缺陷率降低35%']),
    JSON.stringify([
      { type: 'experience', title: '字节跳动 - 高级前端工程师', content: '负责抖音Web端架构设计和核心模块开发' },
      { type: 'education', title: '浙江大学 - 计算机科学硕士', content: '2014-2017' }
    ]),
    JSON.stringify(['微前端', 'React', 'TypeScript', '性能优化'])
  )
  insertCase.run(
    uuidv4(), '金融', 'mid', '蚂蚁集团',
    '负责支付宝小程序开发者工具链建设',
    JSON.stringify(['设计并实现小程序编译优化管线', '开发者工具日活提升60%', '获得年度技术突破奖']),
    JSON.stringify([
      { type: 'experience', title: '蚂蚁集团 - 前端技术专家', content: '小程序开发者工具链核心开发' },
      { type: 'education', title: '上海交通大学 - 软件工程本科', content: '2015-2019' }
    ]),
    JSON.stringify(['小程序', '编译器', '工具链', 'Node.js'])
  )
  insertCase.run(
    uuidv4(), '互联网', 'junior', '美团',
    '参与美团外卖商家端前端开发，独立负责订单管理模块',
    JSON.stringify(['独立完成订单管理模块全流程开发', '优化页面加载速度，FCP降低50%', '推动团队代码规范落地']),
    JSON.stringify([
      { type: 'experience', title: '美团 - 前端开发工程师', content: '外卖商家端核心模块开发' },
      { type: 'education', title: '华中科技大学 - 计算机科学本科', content: '2018-2022' }
    ]),
    JSON.stringify(['Vue', '小程序', '性能优化'])
  )
  insertCase.run(
    uuidv4(), 'AI', 'senior', 'OpenAI',
    'LLM应用层架构师，主导ChatGPT前端交互设计',
    JSON.stringify(['设计流式响应渲染架构', '实现多模态输入交互系统', '支撑千万级日活用户']),
    JSON.stringify([
      { type: 'experience', title: 'OpenAI - 前端架构师', content: 'ChatGPT前端架构设计' },
      { type: 'education', title: 'MIT - Computer Science PhD', content: '2015-2020' }
    ]),
    JSON.stringify(['LLM', '流式渲染', 'React', 'WebSockets'])
  )

  const insertApplication = db.prepare(
    'INSERT INTO applications (id, user_id, resume_id, company, position, status, applied_at, interviews, offer, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  insertApplication.run(
    uuidv4(), userId1, resumeId1, '腾讯', '高级前端工程师', 'interview', '2025-05-20',
    JSON.stringify([
      { id: uuidv4(), date: '2025-05-28', type: 'phone', notes: '技术电话面试，聊了React原理' },
      { id: uuidv4(), date: '2025-06-03', type: 'technical', notes: '现场技术面试，包含算法和系统设计' }
    ]),
    null,
    '腾讯WXG事业群，团队技术氛围好'
  )
  insertApplication.run(
    uuidv4(), userId1, resumeId1, '阿里', '前端技术专家', 'offer', '2025-04-15',
    JSON.stringify([
      { id: uuidv4(), date: '2025-04-22', type: 'phone', notes: 'HR初面' },
      { id: uuidv4(), date: '2025-04-28', type: 'technical', notes: '技术交叉面' },
      { id: uuidv4(), date: '2025-05-05', type: 'onsite', notes: ' onsite终面' }
    ]),
    JSON.stringify({ baseSalary: 550000, bonus: '3个月', benefits: ['餐补', '健身房', '弹性工作'], equity: 'RSU 2000股/4年', deadline: '2025-06-15' }),
    '阿里云事业部，P7级别'
  )
  insertApplication.run(
    uuidv4(), userId1, resumeId2, 'Google', 'Senior Frontend Engineer', 'applied', '2025-06-01',
    JSON.stringify([]),
    null,
    'L5 level, Mountain View'
  )
  insertApplication.run(
    uuidv4(), userId3, resumeId3, '华为', '后端开发工程师', 'todo', null,
    JSON.stringify([]),
    null,
    '消费者BG'
  )

  const insertTemplate = db.prepare(
    'INSERT INTO company_templates (id, company_id, name, sections, scoring_criteria) VALUES (?, ?, ?, ?, ?)'
  )
  insertTemplate.run(
    uuidv4(), userId2, '技术岗通用模板',
    JSON.stringify([
      { type: 'personal', required: true, order: 1 },
      { type: 'education', required: true, order: 2 },
      { type: 'experience', required: true, order: 3 },
      { type: 'skills', required: true, order: 4 },
      { type: 'projects', required: false, order: 5 }
    ]),
    JSON.stringify({
      dimensions: [
        { name: '技术深度', weight: 0.3 },
        { name: '项目经验', weight: 0.25 },
        { name: '教育背景', weight: 0.15 },
        { name: '软技能', weight: 0.15 },
        { name: '文化匹配', weight: 0.15 }
      ],
      thresholds: { autoReject: 40, autoAdvance: 80 }
    })
  )
  insertTemplate.run(
    uuidv4(), userId2, '产品岗评估模板',
    JSON.stringify([
      { type: 'personal', required: true, order: 1 },
      { type: 'experience', required: true, order: 2 },
      { type: 'projects', required: true, order: 3 },
      { type: 'skills', required: false, order: 4 }
    ]),
    JSON.stringify({
      dimensions: [
        { name: '产品思维', weight: 0.35 },
        { name: '数据驱动', weight: 0.25 },
        { name: '沟通能力', weight: 0.2 },
        { name: '技术理解', weight: 0.2 }
      ],
      thresholds: { autoReject: 45, autoAdvance: 75 }
    })
  )

  const insertAuditLog = db.prepare(
    'INSERT INTO audit_logs (id, user_id, action, resource, details) VALUES (?, ?, ?, ?, ?)'
  )
  insertAuditLog.run(uuidv4(), userId1, 'create', 'resume', JSON.stringify({ resumeId: resumeId1, title: '前端工程师简历' }))
  insertAuditLog.run(uuidv4(), userId1, 'create', 'resume', JSON.stringify({ resumeId: resumeId2, title: 'Senior Frontend Engineer Resume' }))
  insertAuditLog.run(uuidv4(), userId1, 'update', 'resume', JSON.stringify({ resumeId: resumeId1, field: 'sections' }))
  insertAuditLog.run(uuidv4(), userId1, 'create', 'application', JSON.stringify({ company: '腾讯', position: '高级前端工程师' }))
  insertAuditLog.run(uuidv4(), userId1, 'update', 'application', JSON.stringify({ company: '阿里', status: 'offer' }))
  insertAuditLog.run(uuidv4(), userId3, 'create', 'resume', JSON.stringify({ resumeId: resumeId3, title: '后端开发简历' }))

  const insertCompliance = db.prepare(
    'INSERT INTO compliance_settings (id, user_id, data_minimization, encrypted_storage, retention_days) VALUES (?, ?, ?, ?, ?)'
  )
  insertCompliance.run(uuidv4(), userId1, 1, 1, 365)
  insertCompliance.run(uuidv4(), userId2, 1, 1, 180)
  insertCompliance.run(uuidv4(), userId3, 0, 1, 90)
}

export default db
