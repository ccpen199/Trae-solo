import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.resolve(__dirname, 'app.db')

let dbInstance: Database.Database | null = null

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH)
    dbInstance.pragma('journal_mode = WAL')
    dbInstance.pragma('foreign_keys = ON')
  }
  return dbInstance
}

export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

function createTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      avatar TEXT,
      phone TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS student_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      real_name TEXT NOT NULL,
      gender TEXT,
      birthday TEXT,
      school TEXT NOT NULL,
      major TEXT NOT NULL,
      grade TEXT NOT NULL,
      gpa REAL,
      skills TEXT,
      resume_url TEXT,
      self_intro TEXT,
      target_position TEXT,
      target_city TEXT,
      expected_salary TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enterprise_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      company_name TEXT NOT NULL,
      industry TEXT,
      scale TEXT,
      logo_url TEXT,
      website TEXT,
      description TEXT,
      address TEXT,
      contact_name TEXT,
      contact_phone TEXT,
      verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS mentors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      real_name TEXT NOT NULL,
      company TEXT NOT NULL,
      position TEXT NOT NULL,
      expertise TEXT,
      experience_years INTEGER,
      bio TEXT,
      avatar_url TEXT,
      rating REAL DEFAULT 4.5,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      enterprise_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'intern',
      department TEXT,
      city TEXT NOT NULL,
      salary_min INTEGER,
      salary_max INTEGER,
      description TEXT NOT NULL,
      requirements TEXT,
      benefits TEXT,
      status TEXT NOT NULL DEFAULT 'open',
      views_count INTEGER NOT NULL DEFAULT 0,
      applications_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (enterprise_id) REFERENCES enterprise_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      enterprise_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      cover_letter TEXT,
      resume_snapshot TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS referrals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mentor_id INTEGER NOT NULL,
      company_id INTEGER,
      company_name TEXT NOT NULL,
      position TEXT NOT NULL,
      bonus TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'available',
      claimed_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT,
      views_count INTEGER NOT NULL DEFAULT 0,
      answers_count INTEGER NOT NULL DEFAULT 0,
      likes_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      author_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      content TEXT NOT NULL,
      likes_count INTEGER NOT NULL DEFAULT 0,
      is_accepted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS company_radars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      company_name TEXT NOT NULL,
      industry TEXT NOT NULL,
      overall_score REAL NOT NULL DEFAULT 0,
      culture_score REAL NOT NULL DEFAULT 0,
      growth_score REAL NOT NULL DEFAULT 0,
      salary_score REAL NOT NULL DEFAULT 0,
      work_life_score REAL NOT NULL DEFAULT 0,
      reviews_count INTEGER NOT NULL DEFAULT 0,
      description TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      mood TEXT,
      tags TEXT,
      is_public INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assessment_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      report_type TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      scores TEXT,
      details TEXT,
      suggestions TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      issuer TEXT NOT NULL,
      issue_date TEXT NOT NULL,
      certificate_url TEXT,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      role TEXT,
      start_date TEXT,
      end_date TEXT,
      description TEXT,
      tech_stack TEXT,
      link TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (student_id) REFERENCES student_profiles(id) ON DELETE CASCADE
    );
  `)
}

function seedMockData(db: Database.Database): void {
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }
  if (userCount.c > 0) return

  const hashPassword = (pw: string) => bcrypt.hashSync(pw, 10)
  const now = new Date().toISOString()

  const insertUser = db.prepare(
    'INSERT INTO users (username, email, password_hash, role, avatar, phone) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertStudent = db.prepare(
    'INSERT INTO student_profiles (user_id, real_name, gender, school, major, grade, gpa, skills, self_intro, target_position, target_city, expected_salary) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertEnterprise = db.prepare(
    'INSERT INTO enterprise_profiles (user_id, company_name, industry, scale, logo_url, website, description, address, contact_name, contact_phone, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertMentor = db.prepare(
    'INSERT INTO mentors (user_id, real_name, company, position, expertise, experience_years, bio, rating) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertJob = db.prepare(
    'INSERT INTO jobs (enterprise_id, title, type, department, city, salary_min, salary_max, description, requirements, benefits, views_count, applications_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertApplication = db.prepare(
    'INSERT INTO applications (job_id, student_id, enterprise_id, status, cover_letter) VALUES (?, ?, ?, ?, ?)'
  )
  const insertReferral = db.prepare(
    'INSERT INTO referrals (mentor_id, company_id, company_name, position, bonus, description, status, claimed_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertQuestion = db.prepare(
    'INSERT INTO questions (author_id, author_name, title, content, tags, views_count, answers_count, likes_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertAnswer = db.prepare(
    'INSERT INTO answers (question_id, author_id, author_name, content, likes_count, is_accepted) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertRadar = db.prepare(
    'INSERT INTO company_radars (company_id, company_name, industry, overall_score, culture_score, growth_score, salary_score, work_life_score, reviews_count, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  )
  const insertJournal = db.prepare(
    'INSERT INTO journal_entries (student_id, title, content, mood, tags, is_public) VALUES (?, ?, ?, ?, ?, ?)'
  )
  const insertReport = db.prepare(
    'INSERT INTO assessment_reports (student_id, report_type, title, summary, scores, details, suggestions) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const insertCertificate = db.prepare(
    'INSERT INTO certificates (student_id, title, issuer, issue_date, description) VALUES (?, ?, ?, ?, ?)'
  )
  const insertProject = db.prepare(
    'INSERT INTO projects (student_id, name, role, start_date, end_date, description, tech_stack, link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  )

  const tx = db.transaction(() => {
    const enterprises: Array<{ userId: number; profileId: number; companyName: string }> = []
    const enterpriseData = [
      { name: '字节跳动', industry: '互联网/科技', scale: '10000人以上', website: 'https://bytedance.com', desc: '全球领先的信息科技公司', address: '北京市海淀区知春路' },
      { name: '腾讯科技', industry: '互联网/科技', scale: '10000人以上', website: 'https://tencent.com', desc: '中国最大的互联网综合服务提供商之一', address: '深圳市南山区科技园' },
      { name: '阿里巴巴', industry: '电商/云计算', scale: '10000人以上', website: 'https://alibaba.com', desc: '全球领先的电子商务和云计算公司', address: '杭州市余杭区阿里园区' },
      { name: '美团点评', industry: '本地生活服务', scale: '10000人以上', website: 'https://meituan.com', desc: '中国领先的生活服务电子商务平台', address: '北京市朝阳区望京' },
      { name: '京东集团', industry: '电商/物流', scale: '10000人以上', website: 'https://jd.com', desc: '中国最大的自营式电商企业', address: '北京市亦庄经济开发区' },
      { name: '华为技术', industry: '通信/半导体', scale: '10000人以上', website: 'https://huawei.com', desc: '全球领先的ICT基础设施和智能终端提供商', address: '深圳市龙岗区坂田' },
      { name: '小米科技', industry: '智能硬件/互联网', scale: '10000人以上', website: 'https://mi.com', desc: '以手机、智能硬件和IoT平台为核心的消费电子公司', address: '北京市海淀区清河' },
      { name: '网易公司', industry: '互联网/游戏', scale: '5000-10000人', website: 'https://netease.com', desc: '中国领先的互联网技术公司', address: '杭州市滨江区网易大厦' },
    ]

    for (let i = 0; i < enterpriseData.length; i++) {
      const e = enterpriseData[i]
      const userId = insertUser.run(
        `hr_${e.name}`,
        `hr${i + 1}@company.com`,
        hashPassword('enterprise123'),
        'enterprise',
        null,
        `1380000${String(1000 + i).padStart(4, '0')}`
      ).lastInsertRowid as number

      const profileId = insertEnterprise.run(
        userId,
        e.name,
        e.industry,
        e.scale,
        null,
        e.website,
        e.desc,
        e.address,
        `HR负责人${i + 1}`,
        `010-8888${String(1000 + i).padStart(4, '0')}`,
        1
      ).lastInsertRowid as number

      enterprises.push({ userId, profileId, companyName: e.name })
    }

    const mentors: Array<{ userId: number; mentorId: number; realName: string }> = []
    const mentorData = [
      { name: '张明', company: '字节跳动', position: '高级前端架构师', expertise: 'React/Vue/工程化', years: 8 },
      { name: '李华', company: '腾讯科技', position: '后端技术专家', expertise: 'Go/微服务/分布式', years: 10 },
      { name: '王芳', company: '阿里巴巴', position: '产品总监', expertise: 'B端产品/电商', years: 12 },
      { name: '赵强', company: '美团点评', position: '算法专家', expertise: '推荐系统/NLP', years: 7 },
      { name: '刘洋', company: '华为技术', position: '研发总监', expertise: '操作系统/内核', years: 15 },
    ]

    for (let i = 0; i < mentorData.length; i++) {
      const m = mentorData[i]
      const userId = insertUser.run(
        `mentor_${m.name}`,
        `mentor${i + 1}@mentor.com`,
        hashPassword('mentor123'),
        'mentor',
        null,
        null
      ).lastInsertRowid as number

      const mentorId = insertMentor.run(
        userId,
        m.name,
        m.company,
        m.position,
        m.expertise,
        m.years,
        `${m.expertise}领域资深专家，具有丰富的校招和内推经验，已帮助50+同学拿到心仪offer`,
        4.5 + i * 0.05
      ).lastInsertRowid as number

      mentors.push({ userId, mentorId, realName: m.name })
    }

    const students: Array<{ userId: number; profileId: number; realName: string }> = []
    const studentData = [
      { name: '陈小明', gender: 'male', school: '清华大学', major: '计算机科学与技术', grade: '大三', gpa: 3.85, skills: 'Java,Spring,MySQL,Redis', target: '后端开发工程师', city: '北京', salary: '15-25K' },
      { name: '王小红', gender: 'female', school: '北京大学', major: '软件工程', grade: '研二', gpa: 3.92, skills: 'Python,TensorFlow,PyTorch', target: '算法工程师', city: '北京', salary: '20-35K' },
      { name: '张伟', gender: 'male', school: '上海交通大学', major: '电子信息工程', grade: '大四', gpa: 3.78, skills: 'C++,嵌入式,Linux', target: '嵌入式开发工程师', city: '上海', salary: '12-22K' },
      { name: '李娜', gender: 'female', school: '浙江大学', major: '数据科学与大数据技术', grade: '大三', gpa: 3.88, skills: 'Python,Hadoop,Spark,SQL', target: '数据分析师', city: '杭州', salary: '14-24K' },
      { name: '刘洋', gender: 'male', school: '复旦大学', major: '信息管理与信息系统', grade: '研一', gpa: 3.72, skills: 'React,Vue,TypeScript,Node.js', target: '前端开发工程师', city: '上海', salary: '13-23K' },
      { name: '陈静', gender: 'female', school: '南京大学', major: '人工智能', grade: '大四', gpa: 3.95, skills: 'PyTorch,计算机视觉,Transformer', target: 'CV算法工程师', city: '南京', salary: '18-30K' },
      { name: '杨帆', gender: 'male', school: '武汉大学', major: '网络空间安全', grade: '大三', gpa: 3.65, skills: '渗透测试,漏洞挖掘,Python', target: '安全工程师', city: '武汉', salary: '15-28K' },
      { name: '赵敏', gender: 'female', school: '华中科技大学', major: '计算机科学与技术', grade: '研二', gpa: 3.82, skills: 'Go,k8s,Docker,微服务', target: '云原生开发工程师', city: '深圳', salary: '16-30K' },
      { name: '周磊', gender: 'male', school: '西安交通大学', major: '软件工程', grade: '大四', gpa: 3.70, skills: 'Java,Android,Kotlin', target: 'Android开发工程师', city: '西安', salary: '12-20K' },
      { name: '吴婷', gender: 'female', school: '北京邮电大学', major: '通信工程', grade: '大三', gpa: 3.76, skills: 'iOS,Swift,Objective-C', target: 'iOS开发工程师', city: '北京', salary: '13-23K' },
      { name: '郑浩', gender: 'male', school: '同济大学', major: '软件工程', grade: '大四', gpa: 3.68, skills: '产品设计,原型设计,数据分析', target: '产品经理', city: '上海', salary: '12-20K' },
      { name: '孙丽', gender: 'female', school: '中国科学技术大学', major: '量子信息', grade: '研二', gpa: 3.90, skills: '量子计算,科研,Python', target: '科研工程师', city: '合肥', salary: '15-25K' },
    ]

    for (let i = 0; i < studentData.length; i++) {
      const s = studentData[i]
      const userId = insertUser.run(
        s.name.replace(/\s/g, ''),
        `student${i + 1}@edu.cn`,
        hashPassword('student123'),
        'student',
        null,
        `139${String(10000000 + i).padStart(8, '0')}`
      ).lastInsertRowid as number

      const profileId = insertStudent.run(
        userId,
        s.name,
        s.gender,
        s.school,
        s.major,
        s.grade,
        s.gpa,
        s.skills,
        `我是${s.school}${s.grade}的${s.major}专业学生，对${s.target}方向有浓厚兴趣。在校期间成绩优异，积极参与各类竞赛和项目实践，具备扎实的专业基础和良好的团队协作能力。`,
        s.target,
        s.city,
        s.salary
      ).lastInsertRowid as number

      students.push({ userId, profileId, realName: s.name })
    }

    const jobs: number[] = []
    const jobTemplates = [
      { title: '前端开发实习生', type: 'intern', dept: '研发部-前端组', city: '北京', min: 250, max: 400, desc: '负责公司Web产品的前端开发和维护', req: '熟悉React/Vue,了解TypeScript', benefit: '弹性工作、导师一对一、免费三餐、转正机会' },
      { title: '后端开发实习生', type: 'intern', dept: '研发部-服务端组', city: '北京', min: 280, max: 450, desc: '参与核心业务系统的设计与开发', req: '熟悉Java/Go,了解MySQL/Redis', benefit: '技术大牛带队、项目实战、转正机会' },
      { title: '算法实习生', type: 'intern', dept: 'AI实验室', city: '上海', min: 350, max: 550, desc: '参与推荐系统/搜索算法的优化和迭代', req: '熟悉Python,了解深度学习框架', benefit: '顶会论文分享、GPU资源、转正机会' },
      { title: '产品经理实习生', type: 'intern', dept: '产品部', city: '深圳', min: 200, max: 350, desc: '参与产品需求分析、原型设计和项目跟进', req: '有产品思维,熟练使用Axure/Figma', benefit: '完整产品生命周期、大牛导师、转正机会' },
      { title: '数据分析实习生', type: 'intern', dept: '数据部', city: '杭州', min: 220, max: 380, desc: '负责业务数据的分析和可视化报告输出', req: '熟悉SQL,掌握Python/R', benefit: '接触核心数据、业务培训、转正机会' },
      { title: '测试开发实习生', type: 'intern', dept: '质量保障部', city: '北京', min: 230, max: 380, desc: '参与自动化测试体系建设和工具开发', req: '了解测试方法,熟悉Python/Java', benefit: '质量体系学习、转正机会' },
      { title: 'iOS开发实习生', type: 'intern', dept: '移动客户端部', city: '上海', min: 260, max: 420, desc: '参与iOS应用的功能开发和性能优化', req: '熟悉Swift/Objective-C', benefit: '移动端技术栈、转正机会' },
      { title: 'Android开发实习生', type: 'intern', dept: '移动客户端部', city: '深圳', min: 260, max: 420, desc: '参与Android应用的功能开发和性能优化', req: '熟悉Java/Kotlin,了解Android框架', benefit: '移动端技术栈、转正机会' },
      { title: '高级前端开发工程师', type: 'fulltime', dept: '研发部', city: '北京', min: 25, max: 45, desc: '负责核心产品的前端架构设计和技术选型', req: '5年+前端经验,有大型项目经验', benefit: '五险一金、年终奖金、股权激励、带薪年假' },
      { title: '高级Java开发工程师', type: 'fulltime', dept: '研发部', city: '上海', min: 30, max: 55, desc: '负责核心业务系统的架构设计和开发', req: '5年+Java经验,有高并发系统经验', benefit: '五险一金、年终奖金、股权激励、带薪年假' },
      { title: '资深算法工程师', type: 'fulltime', dept: 'AI实验室', city: '北京', min: 40, max: 80, desc: '负责大规模推荐/搜索算法的研发和落地', req: '3年+算法经验,有顶会论文优先', benefit: '股票期权、研究经费、学术支持' },
      { title: '产品经理', type: 'fulltime', dept: '产品部', city: '深圳', min: 20, max: 40, desc: '负责业务线的产品规划和需求管理', req: '3年+产品经验,有0-1产品经验优先', benefit: '五险一金、年终奖金、带薪年假' },
      { title: '全栈开发工程师', type: 'fulltime', dept: '创新业务部', city: '杭州', min: 25, max: 45, desc: '独立负责创新项目从前端到后端的全栈开发', req: '精通前后端技术栈,有全栈项目经验', benefit: '弹性工作、快速晋升、股权激励' },
      { title: 'DevOps工程师', type: 'fulltime', dept: '基础架构部', city: '北京', min: 25, max: 45, desc: '负责CI/CD体系建设和K8s集群运维', req: '熟悉Docker/k8s,有大规模运维经验', benefit: '技术成长、五险一金、年终奖金' },
      { title: 'UI/UX设计师', type: 'fulltime', dept: '设计部', city: '上海', min: 18, max: 35, desc: '负责产品界面设计和用户体验优化', req: '3年+设计经验,有完整作品集', benefit: '设计氛围、Mac设备、设计分享会' },
      { title: '运营经理', type: 'fulltime', dept: '运营部', city: '深圳', min: 15, max: 30, desc: '负责用户增长和活动运营策划', req: '有运营经验,数据驱动思维', benefit: '五险一金、年终奖金、团建活动' },
      { title: '安全工程师', type: 'fulltime', dept: '安全部', city: '北京', min: 28, max: 50, desc: '负责Web安全、渗透测试和漏洞修复', req: '有安全行业经验,熟悉OWASP', benefit: '技术挑战、安全培训、股权激励' },
      { title: '云原生架构师', type: 'fulltime', dept: '基础架构部', city: '杭州', min: 40, max: 70, desc: '负责云原生架构设计和微服务治理', req: '8年+经验,有大规模云原生项目经验', benefit: '技术影响力、股票期权、专家通道' },
      { title: '数据产品经理', type: 'fulltime', dept: '数据中台部', city: '北京', min: 22, max: 42, desc: '负责数据产品规划和数据中台建设', req: '有数据产品经验,了解大数据技术栈', benefit: '核心数据、五险一金、年终奖金' },
      { title: '用户增长实习生', type: 'intern', dept: '增长团队', city: '广州', min: 180, max: 300, desc: '参与用户增长实验和增长策略落地', req: '数据分析能力,有增长意识', benefit: '增长方法论、快速成长、转正机会' },
    ]

    for (let i = 0; i < 20; i++) {
      const j = jobTemplates[i]
      const enterprise = enterprises[i % enterprises.length]
      const jobId = insertJob.run(
        enterprise.profileId,
        j.title,
        j.type,
        j.dept,
        j.city,
        j.min,
        j.max,
        j.desc + '。我们提供开放的技术氛围、清晰的成长路径和有竞争力的薪酬福利。团队成员均来自各大知名互联网公司，期待优秀的你加入！',
        j.req + '。热爱技术，有良好的沟通能力和团队协作精神。学习能力强，能够快速适应新技术。',
        j.benefit,
        100 + i * 37,
        10 + (i % 8)
      ).lastInsertRowid as number
      jobs.push(jobId)
    }

    const applicationStatuses = ['pending', 'reviewed', 'interview', 'offer', 'rejected']
    for (let i = 0; i < 35; i++) {
      const jobIdx = i % jobs.length
      const studentIdx = i % students.length
      insertApplication.run(
        jobs[jobIdx],
        students[studentIdx].profileId,
        enterprises[jobIdx % enterprises.length].profileId,
        applicationStatuses[i % applicationStatuses.length],
        `我对贵公司的${jobTemplates[jobIdx].title}岗位非常感兴趣，在${students[studentIdx].realName ? students[studentIdx].realName : ''}在校期间系统学习了相关知识，并参与了多个相关项目，希望能有机会加入贵公司贡献自己的力量。`
      )
    }

    const positions = ['后端开发工程师', '前端开发工程师', '算法工程师', '产品经理', '数据分析师', '测试开发工程师', 'Android开发工程师', 'iOS开发工程师', '全栈工程师', '运维工程师']
    for (let i = 0; i < 12; i++) {
      const mentor = mentors[i % mentors.length]
      const enterprise = enterprises[i % enterprises.length]
      insertReferral.run(
        mentor.mentorId,
        enterprise.profileId,
        enterprise.companyName,
        positions[i % positions.length],
        i % 3 === 0 ? '内推成功奖励5000元' : i % 3 === 1 ? '内推成功奖励3000元+面试直通' : '简历优先筛选',
        `我是${mentor.realName}，目前在${enterprise.companyName}担任技术岗位，可以为优秀候选人提供内推机会。希望你基本功扎实，有相关项目经验，符合条件的同学欢迎投递！`,
        i % 4 === 0 ? 'claimed' : 'available',
        i % 4 === 0 ? students[i % students.length].profileId : null
      )
    }

    const questionTemplates = [
      { title: '准备2025届互联网秋招，应该如何规划时间线？', tags: '秋招,求职规划' },
      { title: '字节跳动的前端面试通常考哪些内容？有什么经验分享吗？', tags: '字节跳动,前端,面试' },
      { title: '算法岗和开发岗应该怎么选？各自的发展前景如何？', tags: '职业规划,算法,开发' },
      { title: '没有实习经历，简历应该怎么写才能脱颖而出？', tags: '简历,实习' },
      { title: '腾讯Java后端实习面试经验分享（已OC）', tags: '腾讯,Java,面试经验' },
      { title: '双非学校如何逆袭拿到大厂offer？', tags: '求职,大厂,双非' },
      { title: '阿里巴巴暑期实习转正率怎么样？', tags: '阿里巴巴,实习,转正' },
      { title: 'Go语言现在在大厂的应用情况如何？值得深入学习吗？', tags: 'Go语言,技术栈' },
      { title: '研究生期间应该怎么规划才能在校招中更有竞争力？', tags: '研究生,规划,校招' },
      { title: '美团和京东的offer该怎么选？求过来人建议', tags: 'offer选择,美团,京东' },
      { title: '简历中的项目经验怎么描述才不会显得很水？', tags: '简历,项目' },
      { title: '华为OD和正式社招有什么区别？求详细解答', tags: '华为,OD,社招' },
      { title: '本科毕业读硕士 vs 直接工作，该如何选择？', tags: '考研,就业,职业规划' },
      { title: '前端面试必考的八股文有哪些？求整理', tags: '前端,面试,八股文' },
      { title: '实习期间如何和导师有效沟通？感觉很紧张', tags: '实习,沟通,职场' },
      { title: '网易游戏开发岗位面试经验（已拿SP）', tags: '网易,游戏开发,面试' },
      { title: '秋招投递多少家公司比较合适？投多了会不会忙不过来？', tags: '秋招,投递' },
      { title: '女生在程序员这个职业上会不会有劣势？', tags: '性别,程序员,职业' },
      { title: '如何准备系统设计面试？感觉这部分总是答不好', tags: '系统设计,面试' },
      { title: '小米的薪资水平和工作氛围怎么样？', tags: '小米,薪资,工作氛围' },
      { title: '拿到了几个中小厂offer，还需要继续冲大厂吗？', tags: 'offer选择,大厂' },
      { title: 'SQL在面试中考得多吗？需要掌握到什么程度？', tags: 'SQL,数据库,面试' },
      { title: '面试时被问到期望薪资，应该怎么回答比较好？', tags: '面试,薪资,谈薪' },
      { title: '计算机网络在面试中的重点有哪些？', tags: '计算机网络,面试' },
      { title: '研一现在开始准备实习，会不会太早了？', tags: '研究生,实习,准备' },
      { title: '校招中怎么判断一个团队/业务的发展前景好不好？', tags: '校招,团队,业务' },
      { title: '非科班转码两年，想进大厂还需要补什么？', tags: '转码,大厂' },
      { title: '拿到offer后谈薪有什么技巧？感觉自己被倒挂了', tags: '谈薪,offer' },
      { title: '实习三个月，技术上没什么成长，要不要跑路？', tags: '实习,成长,离职' },
      { title: '华为的性格测试真的会刷人吗？需要怎么准备？', tags: '华为,性格测试,面试' },
    ]

    for (let i = 0; i < 30; i++) {
      const q = questionTemplates[i]
      const authorIdx = i % (students.length + mentors.length)
      let authorName: string
      let authorId: number
      if (authorIdx < students.length) {
        authorName = students[authorIdx].realName
        authorId = students[authorIdx].userId
      } else {
        authorName = mentors[authorIdx - students.length].realName
        authorId = mentors[authorIdx - students.length].userId
      }

      insertQuestion.run(
        authorId,
        authorName,
        q.title,
        `${q.title}\n\n最近在准备秋招/实习，对这个问题很困惑，希望有经验的学长学姐或者大佬能分享一下看法。感谢大家的回答，我会认真参考每个人的建议！`,
        q.tags,
        200 + i * 89,
        3 + (i % 12),
        15 + (i % 30)
      )
    }

    const answerTemplates = [
      '作为一个已经工作三年的过来人，我觉得你可以从以下几个方面入手：首先是打好基础，其次是多做项目，最后是刷面试题。祝你顺利！',
      '我去年刚经历过同样的阶段，可以给你一些建议。首先要明确自己的目标岗位，然后针对性地准备。技术栈的选择也很重要，建议选择主流的、招聘需求大的方向。',
      '这个问题我太有发言权了！去年秋招我也纠结了很久，最后选择了适合自己的路。核心建议是：不要盲目跟风，要结合自己的兴趣和特长来做选择。',
      '谢邀~ 人在美国，刚下飞机（开个玩笑）。认真回答一下：建议你先做一个全面的自我评估，然后制定详细的计划，按部就班地执行就好。',
      '刚好看到这个问题，我最近也在研究。分享一下我的理解，可能不一定完全对，欢迎大家补充和指正。个人觉得最重要的是持续学习和积累。',
      '我是某大厂的面试官，可以从面试官的角度给你一些建议。其实面试的时候我们最看重的是候选人的思考方式和学习能力，而不是具体的某个知识点会不会。',
      '帮你顶一下！这个问题我也想知道答案，坐等大佬们的回复。建议你可以把问题描述得更具体一些，这样大家更容易给出针对性的建议。',
      '先说结论：建议你选择A方案。原因有三点：1) 发展空间更大；2) 技术栈更有前景；3) 团队氛围更好。当然最终还是看你个人的偏好。',
    ]

    for (let i = 0; i < 80; i++) {
      const questionId = (i % 30) + 1
      const authorIdx = i % (students.length + mentors.length)
      let authorName: string
      let authorId: number
      if (authorIdx < students.length) {
        authorName = students[authorIdx].realName
        authorId = students[authorIdx].userId
      } else {
        authorName = mentors[authorIdx - students.length].realName
        authorId = mentors[authorIdx - students.length].userId
      }

      insertAnswer.run(
        questionId,
        authorId,
        authorName,
        answerTemplates[i % answerTemplates.length] +
          '\n\n另外补充几点个人的小建议，希望对你有帮助。如果觉得有用的话，欢迎点个赞支持一下~有其他问题也可以评论区继续交流！',
        3 + (i % 25),
        i % 8 === 0 ? 1 : 0
      )
    }

    const radarData = [
      { name: '字节跳动', industry: '互联网/科技', overall: 92, culture: 90, growth: 95, salary: 94, workLife: 78, reviews: 2345, desc: '快速发展的互联网巨头，技术氛围浓厚，薪资竞争力强，但工作强度较大' },
      { name: '腾讯科技', industry: '互联网/科技', overall: 94, culture: 95, growth: 88, salary: 92, workLife: 85, reviews: 3120, desc: '中国互联网的常青树，企业文化好，福利完善，工作生活相对平衡' },
      { name: '阿里巴巴', industry: '电商/云计算', overall: 91, culture: 88, growth: 90, salary: 93, workLife: 80, reviews: 2890, desc: '电商和云计算双轮驱动，业务稳定，技术体系完善，加班略多' },
      { name: '美团点评', industry: '本地生活服务', overall: 87, culture: 86, growth: 89, salary: 88, workLife: 82, reviews: 1560, desc: '本地生活服务龙头，业务稳定增长，技术实力强，氛围较好' },
      { name: '京东集团', industry: '电商/物流', overall: 85, culture: 84, growth: 85, salary: 86, workLife: 83, reviews: 1280, desc: '自营电商和物流龙头，技术投入大，福利完善，性价比不错' },
      { name: '华为技术', industry: '通信/半导体', overall: 90, culture: 82, growth: 92, salary: 91, workLife: 72, reviews: 3450, desc: '民族科技标杆，技术深度强，加班较多，回报与付出成正比' },
      { name: '小米科技', industry: '智能硬件/互联网', overall: 83, culture: 85, growth: 84, salary: 82, workLife: 85, reviews: 980, desc: '性价比首选，工作强度适中，氛围轻松，技术栈全面' },
      { name: '网易公司', industry: '互联网/游戏', overall: 86, culture: 90, growth: 80, salary: 85, workLife: 88, reviews: 1120, desc: '游戏和教育双强，福利好，食堂有名，工作生活平衡佳' },
      { name: '百度公司', industry: '人工智能/搜索', overall: 84, culture: 82, growth: 83, salary: 84, workLife: 84, reviews: 1340, desc: 'AI技术积累深厚，搜索业务稳定，自动驾驶前景可期' },
      { name: '滴滴出行', industry: '出行/科技', overall: 80, culture: 78, growth: 76, salary: 82, workLife: 78, reviews: 760, desc: '出行行业龙头，国际化布局，技术挑战大，但面临监管压力' },
      { name: '快手科技', industry: '短视频/直播', overall: 82, culture: 83, growth: 80, salary: 84, workLife: 80, reviews: 890, desc: '短视频双雄之一，日活过亿，推荐算法强，发展潜力大' },
      { name: '拼多多', industry: '电商', overall: 83, culture: 76, growth: 88, salary: 88, workLife: 70, reviews: 670, desc: '电商新势力，增长迅猛，薪资竞争力强，但加班较多' },
      { name: 'B站(哔哩哔哩)', industry: '视频/社区', overall: 81, culture: 88, growth: 82, salary: 79, workLife: 85, reviews: 540, desc: '年轻人聚集的文化社区，氛围轻松有趣，适合喜欢ACG的同学' },
      { name: '携程集团', industry: '在线旅游', overall: 79, culture: 82, growth: 78, salary: 80, workLife: 82, reviews: 620, desc: 'OTA行业龙头，疫情后恢复增长，国际化布局，工作稳定' },
      { name: '蚂蚁集团', industry: '金融科技', overall: 88, culture: 85, growth: 86, salary: 90, workLife: 78, reviews: 1450, desc: '金融科技独角兽，支付和数字金融领先，技术实力雄厚' },
    ]

    for (let i = 0; i < radarData.length; i++) {
      const r = radarData[i]
      insertRadar.run(
        i < enterprises.length ? enterprises[i].profileId : null,
        r.name,
        r.industry,
        r.overall,
        r.culture,
        r.growth,
        r.salary,
        r.workLife,
        r.reviews,
        r.desc
      )
    }

    const journalTitles = [
      '第一天实习，紧张又兴奋',
      '秋招面试复盘：字节跳动一面',
      '在腾讯实习的第三周',
      '拿到第一个offer！',
      '学习分布式系统的一些心得',
      '项目周总结与下周计划',
      '关于职业规划的一些思考',
      '代码重构：从0到1的优化过程',
      '实习答辩准备中...',
      '读完《代码整洁之道》有感',
    ]
    const moods = ['开心', '充实', '平静', '焦虑', '疲惫但满足', '期待']
    const journalTags = ['实习,成长', '面试,复盘', '学习,技术', '求职,心路', '项目,总结', '读书,分享']

    for (let i = 0; i < 25; i++) {
      const student = students[i % students.length]
      const title = journalTitles[i % journalTitles.length]
      insertJournal.run(
        student.profileId,
        `【${student.realName}】${title}`,
        `${title}\n\n今天又是充实的一天。早上参加了团队的站会，同步了上周的工作进度和本周的计划安排。然后开始了新的开发任务，过程中遇到了一些小问题，通过查文档和请教同事最终都解决了。\n\n最大的收获是学会了如何更高效地调试问题，以及如何写出更优雅的代码。晚上下班后还学习了一会儿新技术，感觉每天都在进步。\n\n继续加油，明天会更好！`,
        moods[i % moods.length],
        journalTags[i % journalTags.length],
        i % 3 === 0 ? 1 : 0
      )
    }

    const reportTypes = [
      { type: 'personality', title: 'MBTI职业性格测评报告', summary: 'ENTP型人格 - 辩论家型，富有创造力和灵活性' },
      { type: 'skill', title: '技术能力综合测评报告', summary: '编程基础扎实，算法能力优秀，工程实践能力良好' },
      { type: 'career', title: '职业倾向测评报告', summary: '适合从事技术研发类工作，有较强的逻辑思维和问题解决能力' },
      { type: 'eq', title: '情商与职场适应力报告', summary: '情绪管理能力良好，沟通表达清晰，团队协作意识强' },
    ]

    for (let i = 0; i < 20; i++) {
      const student = students[i % students.length]
      const rt = reportTypes[i % reportTypes.length]
      insertReport.run(
        student.profileId,
        rt.type,
        rt.title,
        rt.summary,
        JSON.stringify({ 总分: 85 + (i % 15), 各维度得分: { 专业能力: 88 + (i % 10), 沟通能力: 82 + (i % 12), 学习能力: 90 + (i % 8), 团队协作: 85 + (i % 10) } }),
        '详细分析内容包括：性格特征详解、能力雷达图、优势与不足分析等完整内容',
        '建议：1) 继续发挥现有优势；2) 重点提升薄弱环节；3) 多参与团队项目锻炼协作能力；4) 保持持续学习的习惯'
      )
    }

    const certData = [
      { title: '计算机二级（Python）', issuer: '教育部考试中心', date: '2024-03-15', desc: '熟练掌握Python基础编程' },
      { title: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', date: '2024-06-20', desc: 'AWS云架构设计助理级认证' },
      { title: '阿里云ACP云原生工程师', issuer: '阿里云', date: '2024-05-10', desc: '云原生技术栈专业认证' },
      { title: 'CFA一级', issuer: 'CFA Institute', date: '2024-02-28', desc: '特许金融分析师一级' },
      { title: 'CET-6 英语六级', issuer: '教育部考试中心', date: '2023-12-09', desc: '成绩：598分' },
      { title: 'Google Data Analytics', issuer: 'Google', date: '2024-04-18', desc: '谷歌数据分析专业证书' },
      { title: 'PMP项目管理', issuer: 'PMI', date: '2024-07-01', desc: '项目管理专业人士认证' },
      { title: '全国大学生数学建模竞赛一等奖', issuer: '教育部', date: '2023-11-20', desc: '省级一等奖' },
    ]

    for (let i = 0; i < 30; i++) {
      const student = students[i % students.length]
      const cert = certData[i % certData.length]
      insertCertificate.run(
        student.profileId,
        cert.title,
        cert.issuer,
        cert.date,
        cert.desc
      )
    }

    const projectData = [
      { name: '电商后台管理系统', role: '全栈开发', start: '2024-01', end: '2024-04', desc: '基于React+SpringBoot的电商后台，支持商品/订单/用户管理', stack: 'React,TypeScript,SpringBoot,MySQL,Redis', link: 'https://github.com/xxx/ecommerce-admin' },
      { name: '在线协作文档', role: '前端开发', start: '2024-03', end: '2024-06', desc: '类Notion的在线协作文档系统，支持实时协作编辑', stack: 'Vue3,WebSocket,CRDT,Node.js', link: 'https://github.com/xxx/collab-doc' },
      { name: '智能推荐系统', role: '算法开发', start: '2024-02', end: '2024-05', desc: '基于协同过滤和深度学习的新闻推荐系统', stack: 'Python,PyTorch,Spark,Redis', link: 'https://github.com/xxx/recommend-sys' },
      { name: '校园二手交易平台', role: '后端开发', start: '2023-09', end: '2023-12', desc: '面向大学生的二手物品交易小程序，支持发布/搜索/聊天', stack: 'Go,Gin,MySQL,MongoDB,微信小程序', link: 'https://github.com/xxx/campus-market' },
      { name: '分布式ID生成器', role: '基础架构', start: '2024-04', end: '2024-05', desc: '基于雪花算法的高性能分布式ID生成服务', stack: 'Java,Spring Cloud,ZooKeeper', link: 'https://github.com/xxx/distributed-id' },
      { name: '个人博客系统', role: '全栈开发', start: '2023-06', end: '2023-08', desc: '基于Next.js的个人博客，支持Markdown、评论、搜索', stack: 'Next.js,TailwindCSS,Prisma,PostgreSQL', link: 'https://github.com/xxx/personal-blog' },
    ]

    for (let i = 0; i < 35; i++) {
      const student = students[i % students.length]
      const proj = projectData[i % projectData.length]
      insertProject.run(
        student.profileId,
        proj.name,
        proj.role,
        proj.start,
        proj.end,
        proj.desc,
        proj.stack,
        proj.link
      )
    }
  })

  tx()
  console.log('[DB] Mock data seeded successfully!')
}

export function initDatabase(): Database.Database {
  const db = getDb()
  createTables(db)
  seedMockData(db)
  console.log('[DB] Database initialized at', DB_PATH)
  return db
}

export default initDatabase
