import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'auto_match.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS talents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    current_company TEXT,
    experience INTEGER DEFAULT 0,
    field TEXT CHECK(field IN ('汽车制造','零部件','新能源','智能驾驶')),
    location TEXT,
    alumni_network TEXT,
    previous_companies TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    talent_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT CHECK(category IN ('硬技能','软技能','认证')),
    level TEXT CHECK(level IN ('初级','中级','高级','专家')),
    verified INTEGER DEFAULT 0,
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS certifications (
    id TEXT PRIMARY KEY,
    talent_id TEXT NOT NULL,
    name TEXT NOT NULL,
    issuer TEXT,
    valid_until TEXT,
    mapped_level TEXT,
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS project_experiences (
    id TEXT PRIMARY KEY,
    talent_id TEXT NOT NULL,
    title TEXT NOT NULL,
    company TEXT,
    vehicle_model TEXT,
    duration TEXT,
    description TEXT,
    skills TEXT,
    FOREIGN KEY (talent_id) REFERENCES talents(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    field TEXT CHECK(field IN ('汽车制造','零部件','新能源','智能驾驶')),
    location TEXT,
    salary_min INTEGER,
    salary_max INTEGER,
    description TEXT,
    status TEXT CHECK(status IN ('草稿','招聘中','已关闭')) DEFAULT '草稿',
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS skill_requirements (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT CHECK(category IN ('硬技能','软技能','认证')),
    required INTEGER DEFAULT 1,
    preferred_level TEXT,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS hard_constraints (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    type TEXT NOT NULL,
    value TEXT NOT NULL,
    required INTEGER DEFAULT 1,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS funnel_data (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    total_resumes INTEGER DEFAULT 0,
    screened INTEGER DEFAULT 0,
    interviewed INTEGER DEFAULT 0,
    offered INTEGER DEFAULT 0,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS match_results (
    id TEXT PRIMARY KEY,
    talent_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    overall_score REAL,
    semantic_score REAL,
    network_score REAL,
    region_score REAL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (talent_id) REFERENCES talents(id),
    FOREIGN KEY (job_id) REFERENCES jobs(id)
  );

  CREATE TABLE IF NOT EXISTS skill_nodes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    level INTEGER DEFAULT 0,
    related_skills TEXT,
    related_certs TEXT,
    hot_jobs INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS cert_mappings (
    id TEXT PRIMARY KEY,
    certification TEXT NOT NULL,
    job_levels TEXT,
    required_for TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_talents_field ON talents(field);
  CREATE INDEX IF NOT EXISTS idx_talents_location ON talents(location);
  CREATE INDEX IF NOT EXISTS idx_skills_talent ON skills(talent_id);
  CREATE INDEX IF NOT EXISTS idx_jobs_field ON jobs(field);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_match_job ON match_results(job_id);
  CREATE INDEX IF NOT EXISTS idx_match_talent ON match_results(talent_id);
  CREATE INDEX IF NOT EXISTS idx_skill_nodes_category ON skill_nodes(category);
`)

function seed() {
  const count = db.prepare('SELECT COUNT(*) as c FROM talents').get() as { c: number }
  if (count.c > 0) return

  const insertTalent = db.prepare(`
    INSERT INTO talents (id, name, email, phone, current_company, experience, field, location, alumni_network, previous_companies)
    VALUES (@id, @name, @email, @phone, @current_company, @experience, @field, @location, @alumni_network, @previous_companies)
  `)

  const insertSkill = db.prepare(`
    INSERT INTO skills (id, talent_id, name, category, level, verified)
    VALUES (@id, @talent_id, @name, @category, @level, @verified)
  `)

  const insertCert = db.prepare(`
    INSERT INTO certifications (id, talent_id, name, issuer, valid_until, mapped_level)
    VALUES (@id, @talent_id, @name, @issuer, @valid_until, @mapped_level)
  `)

  const insertProject = db.prepare(`
    INSERT INTO project_experiences (id, talent_id, title, company, vehicle_model, duration, description, skills)
    VALUES (@id, @talent_id, @title, @company, @vehicle_model, @duration, @description, @skills)
  `)

  const insertJob = db.prepare(`
    INSERT INTO jobs (id, title, company, field, location, salary_min, salary_max, description, status)
    VALUES (@id, @title, @company, @field, @location, @salary_min, @salary_max, @description, @status)
  `)

  const insertSkillReq = db.prepare(`
    INSERT INTO skill_requirements (id, job_id, name, category, required, preferred_level)
    VALUES (@id, @job_id, @name, @category, @required, @preferred_level)
  `)

  const insertConstraint = db.prepare(`
    INSERT INTO hard_constraints (id, job_id, type, value, required)
    VALUES (@id, @job_id, @type, @value, @required)
  `)

  const insertFunnel = db.prepare(`
    INSERT INTO funnel_data (id, job_id, total_resumes, screened, interviewed, offered)
    VALUES (@id, @job_id, @total_resumes, @screened, @interviewed, @offered)
  `)

  const insertMatch = db.prepare(`
    INSERT INTO match_results (id, talent_id, job_id, overall_score, semantic_score, network_score, region_score)
    VALUES (@id, @talent_id, @job_id, @overall_score, @semantic_score, @network_score, @region_score)
  `)

  const insertSkillNode = db.prepare(`
    INSERT INTO skill_nodes (id, name, category, level, related_skills, related_certs, hot_jobs)
    VALUES (@id, @name, @category, @level, @related_skills, @related_certs, @hot_jobs)
  `)

  const insertCertMapping = db.prepare(`
    INSERT INTO cert_mappings (id, certification, job_levels, required_for)
    VALUES (@id, @certification, @job_levels, @required_for)
  `)

  const talents = [
    { id: uuidv4(), name: '张伟', email: 'zhangwei@example.com', phone: '13800001001', current_company: '上汽集团', experience: 8, field: '汽车制造', location: '上海', alumni_network: JSON.stringify(['同济大学', '上海交大']), previous_companies: JSON.stringify(['一汽大众', '上汽通用']) },
    { id: uuidv4(), name: '李娜', email: 'lina@example.com', phone: '13800001002', current_company: '博世中国', experience: 6, field: '零部件', location: '苏州', alumni_network: JSON.stringify(['清华大学']), previous_companies: JSON.stringify(['大陆集团', '德尔福']) },
    { id: uuidv4(), name: '王磊', email: 'wanglei@example.com', phone: '13800001003', current_company: '比亚迪', experience: 5, field: '新能源', location: '深圳', alumni_network: JSON.stringify(['华南理工', '哈工大']), previous_companies: JSON.stringify(['宁德时代']) },
    { id: uuidv4(), name: '刘芳', email: 'liufang@example.com', phone: '13800001004', current_company: '小鹏汽车', experience: 4, field: '智能驾驶', location: '广州', alumni_network: JSON.stringify(['中科大', '中科院']), previous_companies: JSON.stringify(['百度Apollo']) },
    { id: uuidv4(), name: '陈强', email: 'chenqiang@example.com', phone: '13800001005', current_company: '吉利汽车', experience: 10, field: '汽车制造', location: '杭州', alumni_network: JSON.stringify(['浙江大学']), previous_companies: JSON.stringify(['长安汽车', '奇瑞汽车']) },
    { id: uuidv4(), name: '赵敏', email: 'zhaomin@example.com', phone: '13800001006', current_company: '法雷奥', experience: 7, field: '零部件', location: '武汉', alumni_network: JSON.stringify(['武汉理工', '华中科大']), previous_companies: JSON.stringify(['博世中国']) },
    { id: uuidv4(), name: '孙涛', email: 'suntao@example.com', phone: '13800001007', current_company: '蔚来汽车', experience: 3, field: '新能源', location: '合肥', alumni_network: JSON.stringify(['合肥工大']), previous_companies: JSON.stringify(['国轩高科']) },
    { id: uuidv4(), name: '周静', email: 'zhoujing@example.com', phone: '13800001008', current_company: '华为车BU', experience: 6, field: '智能驾驶', location: '深圳', alumni_network: JSON.stringify(['电子科大', '北航']), previous_companies: JSON.stringify(['大疆车载']) },
    { id: uuidv4(), name: '吴刚', email: 'wugang@example.com', phone: '13800001009', current_company: '一汽红旗', experience: 12, field: '汽车制造', location: '长春', alumni_network: JSON.stringify(['吉林大学']), previous_companies: JSON.stringify(['一汽大众', '一汽丰田']) },
    { id: uuidv4(), name: '郑丽', email: 'zhengli@example.com', phone: '13800001010', current_company: '采埃孚', experience: 8, field: '零部件', location: '上海', alumni_network: JSON.stringify(['上海交大', '同济大学']), previous_companies: JSON.stringify(['麦格纳']) },
    { id: uuidv4(), name: '黄勇', email: 'huangyong@example.com', phone: '13800001011', current_company: '理想汽车', experience: 4, field: '新能源', location: '北京', alumni_network: JSON.stringify(['北理工', '清华']), previous_companies: JSON.stringify(['北汽新能源']) },
    { id: uuidv4(), name: '许飞', email: 'xufei@example.com', phone: '13800001012', current_company: '地平线', experience: 5, field: '智能驾驶', location: '北京', alumni_network: JSON.stringify(['北大', '中科院']), previous_companies: JSON.stringify(['Momenta']) },
    { id: uuidv4(), name: '杨帆', email: 'yangfan@example.com', phone: '13800001013', current_company: '长城汽车', experience: 9, field: '汽车制造', location: '保定', alumni_network: JSON.stringify(['河北工大']), previous_companies: JSON.stringify(['广汽集团']) },
  ]

  const skillsData = [
    { talent_id: talents[0].id, name: 'CATIA', category: '硬技能', level: '专家', verified: 1 },
    { talent_id: talents[0].id, name: 'ANSYS', category: '硬技能', level: '高级', verified: 1 },
    { talent_id: talents[0].id, name: '功能安全', category: '认证', level: '高级', verified: 1 },
    { talent_id: talents[0].id, name: '团队管理', category: '软技能', level: '高级', verified: 0 },
    { talent_id: talents[1].id, name: 'ANSYS', category: '硬技能', level: '高级', verified: 1 },
    { talent_id: talents[1].id, name: 'MATLAB', category: '硬技能', level: '专家', verified: 1 },
    { talent_id: talents[1].id, name: 'ASPICE', category: '认证', level: '高级', verified: 1 },
    { talent_id: talents[1].id, name: '跨部门协作', category: '软技能', level: '高级', verified: 0 },
    { talent_id: talents[2].id, name: 'MATLAB', category: '硬技能', level: '高级', verified: 1 },
    { talent_id: talents[2].id, name: 'Simulink', category: '硬技能', level: '高级', verified: 1 },
    { talent_id: talents[2].id, name: 'BMS开发', category: '硬技能', level: '高级', verified: 0 },
    { talent_id: talents[2].id, name: 'IATF16949', category: '认证', level: '中级', verified: 1 },
    { talent_id: talents[3].id, name: 'ROS2', category: '硬技能', level: '高级', verified: 1 },
    { talent_id: talents[3].id, name: 'Python', category: '硬技能', level: '专家', verified: 1 },
    { talent_id: talents[3].id, name: 'C++', category: '硬技能', level: '高级', verified: 0 },
    { talent_id: talents[3].id, name: 'AutoSAR', category: '硬技能', level: '中级', verified: 0 },
    { talent_id: talents[4].id, name: 'CATIA', category: '硬技能', level: '专家', verified: 1 },
    { talent_id: talents[4].id, name: '功能安全', category: '认证', level: '专家', verified: 1 },
    { talent_id: talents[4].id, name: '项目管理', category: '软技能', level: '专家', verified: 0 },
    { talent_id: talents[4].id, name: 'ASPICE', category: '认证', level: '高级', verified: 1 },
    { talent_id: talents[5].id, name: 'ANSYS', category: '硬技能', level: '专家', verified: 1 },
    { talent_id: talents[5].id, name: 'CATIA', category: '硬技能', level: '高级', verified: 0 },
    { talent_id: talents[5].id, name: 'IATF16949', category: '认证', level: '高级', verified: 1 },
    { talent_id: talents[6].id, name: 'Simulink', category: '硬技能', level: '高级', verified: 1 },
    { talent_id: talents[6].id, name: 'MATLAB', category: '硬技能', level: '高级', verified: 1 },
    { talent_id: talents[6].id, name: 'BMS开发', category: '硬技能', level: '中级', verified: 0 },
    { talent_id: talents[7].id, name: 'C++', category: '硬技能', level: '专家', verified: 1 },
    { talent_id: talents[7].id, name: 'AutoSAR', category: '硬技能', level: '高级', verified: 1 },
    { talent_id: talents[7].id, name: '功能安全', category: '认证', level: '高级', verified: 1 },
    { talent_id: talents[7].id, name: 'ROS2', category: '硬技能', level: '中级', verified: 0 },
    { talent_id: talents[8].id, name: 'CATIA', category: '硬技能', level: '专家', verified: 1 },
    { talent_id: talents[8].id, name: 'ANSYS', category: '硬技能', level: '专家', verified: 1 },
    { talent_id: talents[8].id, name: '项目管理', category: '软技能', level: '专家', verified: 0 },
    { talent_id: talents[8].id, name: '功能安全', category: '认证', level: '专家', verified: 1 },
    { talent_id: talents[9].id, name: 'MATLAB', category: '硬技能', level: '高级', verified: 1 },
    { talent_id: talents[9].id, name: 'ANSYS', category: '硬技能', level: '高级', verified: 0 },
    { talent_id: talents[9].id, name: 'ASPICE', category: '认证', level: '高级', verified: 1 },
    { talent_id: talents[9].id, name: '跨部门协作', category: '软技能', level: '高级', verified: 0 },
    { talent_id: talents[10].id, name: 'Simulink', category: '硬技能', level: '高级', verified: 1 },
    { talent_id: talents[10].id, name: 'BMS开发', category: '硬技能', level: '高级', verified: 1 },
    { talent_id: talents[10].id, name: 'Python', category: '硬技能', level: '中级', verified: 0 },
    { talent_id: talents[11].id, name: 'ROS2', category: '硬技能', level: '专家', verified: 1 },
    { talent_id: talents[11].id, name: 'C++', category: '硬技能', level: '专家', verified: 1 },
    { talent_id: talents[11].id, name: 'Python', category: '硬技能', level: '高级', verified: 1 },
    { talent_id: talents[11].id, name: '深度学习', category: '硬技能', level: '高级', verified: 0 },
    { talent_id: talents[12].id, name: 'CATIA', category: '硬技能', level: '高级', verified: 1 },
    { talent_id: talents[12].id, name: '项目管理', category: '软技能', level: '专家', verified: 0 },
    { talent_id: talents[12].id, name: 'IATF16949', category: '认证', level: '高级', verified: 1 },
  ].map(s => ({ ...s, id: uuidv4() }))

  const certsData = [
    { id: uuidv4(), talent_id: talents[0].id, name: 'ISO 26262功能安全认证', issuer: 'TÜV Rheinland', valid_until: '2026-12', mapped_level: '高级' },
    { id: uuidv4(), talent_id: talents[1].id, name: 'ASPICE评估师', issuer: 'VDA', valid_until: '2027-03', mapped_level: '高级' },
    { id: uuidv4(), talent_id: talents[2].id, name: 'IATF16949内审员', issuer: 'IATF', valid_until: '2026-06', mapped_level: '中级' },
    { id: uuidv4(), talent_id: talents[3].id, name: 'AutoSAR认证', issuer: 'AutoSAR', valid_until: '2027-01', mapped_level: '中级' },
    { id: uuidv4(), talent_id: talents[4].id, name: 'ISO 26262功能安全认证', issuer: 'TÜV SÜD', valid_until: '2027-06', mapped_level: '专家' },
    { id: uuidv4(), talent_id: talents[4].id, name: 'ASPICE评估师', issuer: 'VDA', valid_until: '2026-09', mapped_level: '高级' },
    { id: uuidv4(), talent_id: talents[5].id, name: 'IATF16949内审员', issuer: 'IATF', valid_until: '2027-02', mapped_level: '高级' },
    { id: uuidv4(), talent_id: talents[7].id, name: 'ISO 26262功能安全认证', issuer: 'TÜV Rheinland', valid_until: '2026-11', mapped_level: '高级' },
    { id: uuidv4(), talent_id: talents[8].id, name: 'ISO 26262功能安全认证', issuer: 'TÜV SÜD', valid_until: '2027-08', mapped_level: '专家' },
    { id: uuidv4(), talent_id: talents[9].id, name: 'ASPICE评估师', issuer: 'VDA', valid_until: '2026-12', mapped_level: '高级' },
    { id: uuidv4(), talent_id: talents[12].id, name: 'IATF16949内审员', issuer: 'IATF', valid_until: '2027-04', mapped_level: '高级' },
  ]

  const projectsData = [
    { id: uuidv4(), talent_id: talents[0].id, title: '新能源整车平台开发', company: '上汽集团', vehicle_model: '智己L7', duration: '2021-2024', description: '负责整车架构设计与CAE分析，主导底盘系统集成', skills: JSON.stringify(['CATIA', 'ANSYS', '功能安全']) },
    { id: uuidv4(), talent_id: talents[0].id, title: '紧凑型SUV整车项目', company: '上汽通用', vehicle_model: '昂科威Plus', duration: '2018-2021', description: '车身结构设计与碰撞安全分析', skills: JSON.stringify(['CATIA', 'ANSYS']) },
    { id: uuidv4(), talent_id: talents[1].id, title: '电驱系统NVH优化', company: '博世中国', vehicle_model: '通用型', duration: '2020-2024', description: '电驱系统NVH仿真与优化，减振方案设计', skills: JSON.stringify(['ANSYS', 'MATLAB']) },
    { id: uuidv4(), talent_id: talents[2].id, title: '刀片电池BMS开发', company: '比亚迪', vehicle_model: '汉EV', duration: '2021-2024', description: 'BMS算法开发与策略优化', skills: JSON.stringify(['MATLAB', 'Simulink', 'BMS开发']) },
    { id: uuidv4(), talent_id: talents[3].id, title: 'L2+领航辅助系统开发', company: '小鹏汽车', vehicle_model: 'P7i', duration: '2022-2024', description: '感知算法开发与系统标定', skills: JSON.stringify(['ROS2', 'Python', 'C++']) },
    { id: uuidv4(), talent_id: talents[4].id, title: 'CMA架构整车开发', company: '吉利汽车', vehicle_model: '星越L', duration: '2019-2023', description: '整车项目总工，负责整车集成与功能安全', skills: JSON.stringify(['CATIA', '功能安全', 'ASPICE']) },
    { id: uuidv4(), talent_id: talents[7].id, title: 'MDC智能驾驶平台开发', company: '华为车BU', vehicle_model: '阿维塔11', duration: '2021-2024', description: 'AutoSAR中间件开发与功能安全设计', skills: JSON.stringify(['C++', 'AutoSAR', '功能安全']) },
    { id: uuidv4(), talent_id: talents[8].id, title: '红旗H9整车开发', company: '一汽红旗', vehicle_model: '红旗H9', duration: '2017-2022', description: '整车架构与底盘系统开发', skills: JSON.stringify(['CATIA', 'ANSYS', '功能安全']) },
    { id: uuidv4(), talent_id: talents[10].id, title: '增程式混动系统开发', company: '理想汽车', vehicle_model: '理想L9', duration: '2022-2024', description: '增程控制策略与BMS算法开发', skills: JSON.stringify(['Simulink', 'BMS开发']) },
    { id: uuidv4(), talent_id: talents[11].id, title: 'BEV感知算法开发', company: '地平线', vehicle_model: '通用型', duration: '2022-2024', description: '纯视觉BEV感知算法研发', skills: JSON.stringify(['ROS2', 'C++', 'Python', '深度学习']) },
    { id: uuidv4(), talent_id: talents[12].id, title: '柠檬平台整车项目', company: '长城汽车', vehicle_model: '摩卡', duration: '2019-2023', description: '整车项目管理与质量控制', skills: JSON.stringify(['CATIA', '项目管理', 'IATF16949']) },
  ]

  const jobs = [
    { id: uuidv4(), title: '整车架构高级工程师', company: '上汽集团', field: '汽车制造', location: '上海', salary_min: 35000, salary_max: 55000, description: '负责新能源整车架构设计与系统集成，主导整车平台开发', status: '招聘中' },
    { id: uuidv4(), title: 'NVH仿真工程师', company: '博世中国', field: '零部件', location: '苏州', salary_min: 25000, salary_max: 40000, description: '电驱系统NVH仿真分析与优化方案设计', status: '招聘中' },
    { id: uuidv4(), title: 'BMS算法高级工程师', company: '比亚迪', field: '新能源', location: '深圳', salary_min: 30000, salary_max: 50000, description: '负责BMS算法开发与策略优化，电池管理系统开发', status: '招聘中' },
    { id: uuidv4(), title: '感知算法工程师', company: '小鹏汽车', field: '智能驾驶', location: '广州', salary_min: 30000, salary_max: 55000, description: 'L2+至L4感知算法开发与系统标定', status: '招聘中' },
    { id: uuidv4(), title: '功能安全经理', company: '吉利汽车', field: '汽车制造', location: '杭州', salary_min: 40000, salary_max: 60000, description: '功能安全体系搭建与项目管理', status: '招聘中' },
    { id: uuidv4(), title: 'AutoSAR开发工程师', company: '华为车BU', field: '智能驾驶', location: '深圳', salary_min: 28000, salary_max: 45000, description: 'AutoSAR中间件开发与系统集成', status: '草稿' },
    { id: uuidv4(), title: '电驱系统工程师', company: '法雷奥', field: '零部件', location: '武汉', salary_min: 22000, salary_max: 38000, description: '电驱系统设计与测试验证', status: '已关闭' },
    { id: uuidv4(), title: '动力电池开发工程师', company: '蔚来汽车', field: '新能源', location: '合肥', salary_min: 28000, salary_max: 45000, description: '动力电池系统开发与测试验证', status: '招聘中' },
    { id: uuidv4(), title: '系统集成工程师', company: '一汽红旗', field: '汽车制造', location: '长春', salary_min: 25000, salary_max: 40000, description: '整车系统集成与验证', status: '招聘中' },
  ]

  const skillReqs = [
    { job_id: jobs[0].id, name: 'CATIA', category: '硬技能', required: 1, preferred_level: '专家' },
    { job_id: jobs[0].id, name: 'ANSYS', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[0].id, name: '功能安全', category: '认证', required: 1, preferred_level: '高级' },
    { job_id: jobs[0].id, name: '项目管理', category: '软技能', required: 0, preferred_level: '高级' },
    { job_id: jobs[1].id, name: 'ANSYS', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[1].id, name: 'MATLAB', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[1].id, name: 'IATF16949', category: '认证', required: 0, preferred_level: '中级' },
    { job_id: jobs[2].id, name: 'MATLAB', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[2].id, name: 'Simulink', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[2].id, name: 'BMS开发', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[2].id, name: 'IATF16949', category: '认证', required: 0, preferred_level: '中级' },
    { job_id: jobs[3].id, name: 'ROS2', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[3].id, name: 'Python', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[3].id, name: 'C++', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[3].id, name: '深度学习', category: '硬技能', required: 0, preferred_level: '高级' },
    { job_id: jobs[4].id, name: '功能安全', category: '认证', required: 1, preferred_level: '专家' },
    { job_id: jobs[4].id, name: 'ASPICE', category: '认证', required: 1, preferred_level: '高级' },
    { job_id: jobs[4].id, name: 'CATIA', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[4].id, name: '项目管理', category: '软技能', required: 1, preferred_level: '专家' },
    { job_id: jobs[5].id, name: 'AutoSAR', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[5].id, name: 'C++', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[5].id, name: '功能安全', category: '认证', required: 1, preferred_level: '高级' },
    { job_id: jobs[6].id, name: 'ANSYS', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[6].id, name: 'CATIA', category: '硬技能', required: 0, preferred_level: '中级' },
    { job_id: jobs[6].id, name: 'IATF16949', category: '认证', required: 1, preferred_level: '高级' },
    { job_id: jobs[7].id, name: 'Simulink', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[7].id, name: 'MATLAB', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[7].id, name: 'BMS开发', category: '硬技能', required: 1, preferred_level: '中级' },
    { job_id: jobs[8].id, name: 'CATIA', category: '硬技能', required: 1, preferred_level: '高级' },
    { job_id: jobs[8].id, name: 'ANSYS', category: '硬技能', required: 0, preferred_level: '高级' },
    { job_id: jobs[8].id, name: '功能安全', category: '认证', required: 1, preferred_level: '高级' },
  ].map(s => ({ ...s, id: uuidv4() }))

  const constraints = [
    { id: uuidv4(), job_id: jobs[0].id, type: '车型项目经验', value: '3年以上整车项目经验', required: 1 },
    { id: uuidv4(), job_id: jobs[0].id, type: '学历', value: '本科及以上', required: 1 },
    { id: uuidv4(), job_id: jobs[1].id, type: '行业经验', value: '3年以上零部件行业经验', required: 1 },
    { id: uuidv4(), job_id: jobs[2].id, type: 'IATF16949内审员', value: '持有IATF16949内审员证书', required: 0 },
    { id: uuidv4(), job_id: jobs[2].id, type: '学历', value: '硕士及以上', required: 1 },
    { id: uuidv4(), job_id: jobs[3].id, type: '行业经验', value: '2年以上智能驾驶经验', required: 1 },
    { id: uuidv4(), job_id: jobs[4].id, type: '车型项目经验', value: '5年以上整车项目经验', required: 1 },
    { id: uuidv4(), job_id: jobs[4].id, type: 'IATF16949内审员', value: '持有IATF16949内审员证书', required: 0 },
    { id: uuidv4(), job_id: jobs[5].id, type: '行业经验', value: '3年以上智能驾驶开发经验', required: 1 },
    { id: uuidv4(), job_id: jobs[6].id, type: '行业经验', value: '3年以上电驱系统经验', required: 1 },
    { id: uuidv4(), job_id: jobs[7].id, type: '学历', value: '硕士及以上', required: 1 },
    { id: uuidv4(), job_id: jobs[8].id, type: '车型项目经验', value: '5年以上整车集成经验', required: 1 },
    { id: uuidv4(), job_id: jobs[8].id, type: '学历', value: '本科及以上', required: 1 },
  ]

  const funnels = [
    { id: uuidv4(), job_id: jobs[0].id, total_resumes: 156, screened: 42, interviewed: 18, offered: 3 },
    { id: uuidv4(), job_id: jobs[1].id, total_resumes: 98, screened: 28, interviewed: 12, offered: 2 },
    { id: uuidv4(), job_id: jobs[2].id, total_resumes: 134, screened: 38, interviewed: 15, offered: 4 },
    { id: uuidv4(), job_id: jobs[3].id, total_resumes: 210, screened: 56, interviewed: 22, offered: 5 },
    { id: uuidv4(), job_id: jobs[4].id, total_resumes: 87, screened: 24, interviewed: 10, offered: 2 },
    { id: uuidv4(), job_id: jobs[5].id, total_resumes: 145, screened: 40, interviewed: 16, offered: 3 },
    { id: uuidv4(), job_id: jobs[6].id, total_resumes: 76, screened: 20, interviewed: 8, offered: 1 },
    { id: uuidv4(), job_id: jobs[7].id, total_resumes: 112, screened: 32, interviewed: 14, offered: 3 },
    { id: uuidv4(), job_id: jobs[8].id, total_resumes: 95, screened: 26, interviewed: 11, offered: 2 },
  ]

  const matches = [
    { id: uuidv4(), talent_id: talents[0].id, job_id: jobs[0].id, overall_score: 0.92, semantic_score: 0.95, network_score: 0.88, region_score: 1.0 },
    { id: uuidv4(), talent_id: talents[4].id, job_id: jobs[0].id, overall_score: 0.85, semantic_score: 0.88, network_score: 0.72, region_score: 0.8 },
    { id: uuidv4(), talent_id: talents[8].id, job_id: jobs[0].id, overall_score: 0.78, semantic_score: 0.82, network_score: 0.65, region_score: 0.6 },
    { id: uuidv4(), talent_id: talents[1].id, job_id: jobs[1].id, overall_score: 0.88, semantic_score: 0.90, network_score: 0.82, region_score: 0.9 },
    { id: uuidv4(), talent_id: talents[5].id, job_id: jobs[1].id, overall_score: 0.81, semantic_score: 0.85, network_score: 0.75, region_score: 0.7 },
    { id: uuidv4(), talent_id: talents[2].id, job_id: jobs[2].id, overall_score: 0.90, semantic_score: 0.92, network_score: 0.85, region_score: 0.95 },
    { id: uuidv4(), talent_id: talents[6].id, job_id: jobs[2].id, overall_score: 0.75, semantic_score: 0.78, network_score: 0.68, region_score: 0.75 },
    { id: uuidv4(), talent_id: talents[10].id, job_id: jobs[2].id, overall_score: 0.72, semantic_score: 0.76, network_score: 0.65, region_score: 0.65 },
    { id: uuidv4(), talent_id: talents[3].id, job_id: jobs[3].id, overall_score: 0.87, semantic_score: 0.90, network_score: 0.82, region_score: 0.85 },
    { id: uuidv4(), talent_id: talents[11].id, job_id: jobs[3].id, overall_score: 0.91, semantic_score: 0.93, network_score: 0.88, region_score: 0.9 },
    { id: uuidv4(), talent_id: talents[4].id, job_id: jobs[4].id, overall_score: 0.94, semantic_score: 0.96, network_score: 0.90, region_score: 0.9 },
    { id: uuidv4(), talent_id: talents[0].id, job_id: jobs[4].id, overall_score: 0.82, semantic_score: 0.85, network_score: 0.78, region_score: 0.8 },
    { id: uuidv4(), talent_id: talents[7].id, job_id: jobs[5].id, overall_score: 0.89, semantic_score: 0.92, network_score: 0.85, region_score: 0.85 },
    { id: uuidv4(), talent_id: talents[3].id, job_id: jobs[5].id, overall_score: 0.73, semantic_score: 0.78, network_score: 0.68, region_score: 0.65 },
    { id: uuidv4(), talent_id: talents[5].id, job_id: jobs[6].id, overall_score: 0.83, semantic_score: 0.86, network_score: 0.80, region_score: 0.75 },
    { id: uuidv4(), talent_id: talents[1].id, job_id: jobs[6].id, overall_score: 0.76, semantic_score: 0.80, network_score: 0.70, region_score: 0.7 },
    { id: uuidv4(), talent_id: talents[6].id, job_id: jobs[7].id, overall_score: 0.80, semantic_score: 0.84, network_score: 0.72, region_score: 0.8 },
    { id: uuidv4(), talent_id: talents[2].id, job_id: jobs[7].id, overall_score: 0.78, semantic_score: 0.82, network_score: 0.70, region_score: 0.75 },
    { id: uuidv4(), talent_id: talents[8].id, job_id: jobs[8].id, overall_score: 0.88, semantic_score: 0.90, network_score: 0.85, region_score: 0.9 },
    { id: uuidv4(), talent_id: talents[12].id, job_id: jobs[8].id, overall_score: 0.82, semantic_score: 0.85, network_score: 0.78, region_score: 0.8 },
    { id: uuidv4(), talent_id: talents[0].id, job_id: jobs[8].id, overall_score: 0.79, semantic_score: 0.82, network_score: 0.72, region_score: 0.75 },
  ]

  const skillNodes = [
    { id: uuidv4(), name: 'CATIA', category: '硬技能', level: 3, related_skills: JSON.stringify(['ANSYS', 'NX', 'SolidWorks']), related_certs: JSON.stringify(['CATIA认证工程师']), hot_jobs: 18 },
    { id: uuidv4(), name: 'ANSYS', category: '硬技能', level: 3, related_skills: JSON.stringify(['CATIA', 'HyperMesh', 'ABAQUS']), related_certs: JSON.stringify(['ANSYS认证工程师']), hot_jobs: 14 },
    { id: uuidv4(), name: 'MATLAB', category: '硬技能', level: 3, related_skills: JSON.stringify(['Simulink', 'Python', 'Stateflow']), related_certs: JSON.stringify(['MATLAB认证']), hot_jobs: 22 },
    { id: uuidv4(), name: 'Simulink', category: '硬技能', level: 3, related_skills: JSON.stringify(['MATLAB', 'Stateflow', 'Embedded Coder']), related_certs: JSON.stringify(['MATLAB认证']), hot_jobs: 20 },
    { id: uuidv4(), name: 'ROS2', category: '硬技能', level: 2, related_skills: JSON.stringify(['C++', 'Python', 'AutoSAR']), related_certs: JSON.stringify(['ROS认证']), hot_jobs: 15 },
    { id: uuidv4(), name: 'C++', category: '硬技能', level: 3, related_skills: JSON.stringify(['ROS2', 'AutoSAR', 'Python']), related_certs: JSON.stringify(['C++认证']), hot_jobs: 25 },
    { id: uuidv4(), name: 'Python', category: '硬技能', level: 3, related_skills: JSON.stringify(['ROS2', '深度学习', 'MATLAB']), related_certs: JSON.stringify(['Python认证']), hot_jobs: 28 },
    { id: uuidv4(), name: 'AutoSAR', category: '硬技能', level: 2, related_skills: JSON.stringify(['C++', 'ROS2', '功能安全']), related_certs: JSON.stringify(['AutoSAR认证']), hot_jobs: 12 },
    { id: uuidv4(), name: 'BMS开发', category: '硬技能', level: 2, related_skills: JSON.stringify(['Simulink', 'MATLAB', '嵌入式开发']), related_certs: JSON.stringify(['IATF16949内审员']), hot_jobs: 10 },
    { id: uuidv4(), name: '深度学习', category: '硬技能', level: 2, related_skills: JSON.stringify(['Python', 'ROS2', 'C++']), related_certs: JSON.stringify(['TensorFlow认证']), hot_jobs: 16 },
    { id: uuidv4(), name: '功能安全', category: '认证', level: 3, related_skills: JSON.stringify(['ASPICE', 'AutoSAR', 'CATIA']), related_certs: JSON.stringify(['ISO 26262功能安全认证', 'ASPICE评估师']), hot_jobs: 20 },
    { id: uuidv4(), name: 'ASPICE', category: '认证', level: 3, related_skills: JSON.stringify(['功能安全', 'AutoSAR', '项目管理']), related_certs: JSON.stringify(['ASPICE评估师']), hot_jobs: 15 },
    { id: uuidv4(), name: 'IATF16949', category: '认证', level: 2, related_skills: JSON.stringify(['项目管理', 'BMS开发', '质量管理']), related_certs: JSON.stringify(['IATF16949内审员']), hot_jobs: 12 },
    { id: uuidv4(), name: '项目管理', category: '软技能', level: 3, related_skills: JSON.stringify(['ASPICE', 'IATF16949', '团队管理']), related_certs: JSON.stringify(['PMP认证', 'ASPICE评估师']), hot_jobs: 22 },
    { id: uuidv4(), name: '团队管理', category: '软技能', level: 3, related_skills: JSON.stringify(['项目管理', '跨部门协作', '沟通能力']), related_certs: JSON.stringify([]), hot_jobs: 18 },
    { id: uuidv4(), name: '跨部门协作', category: '软技能', level: 2, related_skills: JSON.stringify(['团队管理', '沟通能力', '项目管理']), related_certs: JSON.stringify([]), hot_jobs: 15 },
    { id: uuidv4(), name: '嵌入式开发', category: '硬技能', level: 2, related_skills: JSON.stringify(['C++', 'AutoSAR', 'BMS开发']), related_certs: JSON.stringify(['嵌入式认证']), hot_jobs: 11 },
    { id: uuidv4(), name: '质量管理', category: '软技能', level: 2, related_skills: JSON.stringify(['IATF16949', '项目管理', 'ASPICE']), related_certs: JSON.stringify(['IATF16949内审员']), hot_jobs: 8 },
    { id: uuidv4(), name: 'NVH分析', category: '硬技能', level: 2, related_skills: JSON.stringify(['ANSYS', 'MATLAB', 'CATIA']), related_certs: JSON.stringify(['ANSYS认证工程师']), hot_jobs: 9 },
    { id: uuidv4(), name: '碰撞安全', category: '硬技能', level: 2, related_skills: JSON.stringify(['ANSYS', 'CATIA', '功能安全']), related_certs: JSON.stringify(['ISO 26262功能安全认证']), hot_jobs: 7 },
    { id: uuidv4(), name: '底盘系统', category: '硬技能', level: 2, related_skills: JSON.stringify(['CATIA', 'ANSYS', 'MATLAB']), related_certs: JSON.stringify([]), hot_jobs: 10 },
  ]

  const certMappings = [
    { id: uuidv4(), certification: 'ISO 26262功能安全认证', job_levels: JSON.stringify(['高级工程师', '专家工程师', '技术经理']), required_for: JSON.stringify(['功能安全经理', '整车架构高级工程师', 'AutoSAR开发工程师']) },
    { id: uuidv4(), certification: 'ASPICE评估师', job_levels: JSON.stringify(['高级工程师', '项目经理']), required_for: JSON.stringify(['功能安全经理', '系统集成工程师']) },
    { id: uuidv4(), certification: 'IATF16949内审员', job_levels: JSON.stringify(['质量工程师', '高级工程师', '质量经理']), required_for: JSON.stringify(['BMS算法高级工程师', '电驱系统工程师', '动力电池开发工程师']) },
    { id: uuidv4(), certification: 'AutoSAR认证', job_levels: JSON.stringify(['中级工程师', '高级工程师']), required_for: JSON.stringify(['AutoSAR开发工程师', '感知算法工程师']) },
    { id: uuidv4(), certification: 'CATIA认证工程师', job_levels: JSON.stringify(['中级工程师', '高级工程师', '专家工程师']), required_for: JSON.stringify(['整车架构高级工程师', '系统集成工程师']) },
    { id: uuidv4(), certification: 'ANSYS认证工程师', job_levels: JSON.stringify(['高级工程师', '专家工程师']), required_for: JSON.stringify(['NVH仿真工程师', '电驱系统工程师']) },
    { id: uuidv4(), certification: 'MATLAB认证', job_levels: JSON.stringify(['中级工程师', '高级工程师']), required_for: JSON.stringify(['BMS算法高级工程师', 'NVH仿真工程师']) },
    { id: uuidv4(), certification: 'PMP认证', job_levels: JSON.stringify(['项目经理', '项目总监']), required_for: JSON.stringify(['功能安全经理', '系统集成工程师']) },
    { id: uuidv4(), certification: 'ROS认证', job_levels: JSON.stringify(['中级工程师', '高级工程师']), required_for: JSON.stringify(['感知算法工程师', 'AutoSAR开发工程师']) },
    { id: uuidv4(), certification: 'C++认证', job_levels: JSON.stringify(['高级工程师', '专家工程师']), required_for: JSON.stringify(['AutoSAR开发工程师', '感知算法工程师']) },
    { id: uuidv4(), certification: 'TensorFlow认证', job_levels: JSON.stringify(['高级工程师', '专家工程师']), required_for: JSON.stringify(['感知算法工程师']) },
  ]

  const transaction = db.transaction(() => {
    for (const t of talents) insertTalent.run(t)
    for (const s of skillsData) insertSkill.run(s)
    for (const c of certsData) insertCert.run(c)
    for (const p of projectsData) insertProject.run(p)
    for (const j of jobs) insertJob.run(j)
    for (const sr of skillReqs) insertSkillReq.run(sr)
    for (const hc of constraints) insertConstraint.run(hc)
    for (const f of funnels) insertFunnel.run(f)
    for (const m of matches) insertMatch.run(m)
    for (const sn of skillNodes) insertSkillNode.run(sn)
    for (const cm of certMappings) insertCertMapping.run(cm)
  })

  transaction()
}

seed()

export default db
