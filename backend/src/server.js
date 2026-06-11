const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const crypto = require('crypto');

const PROJECT_DIR = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(PROJECT_DIR, '.env'), override: true });

const HOST = process.env.HOST || '127.0.0.1';
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 49077);
const BACKEND_PORT = Number(process.env.BACKEND_PORT || 59077);
const DATA_DIR = path.join(PROJECT_DIR, 'data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DB_PATH = path.join(DATA_DIR, 'app.sqlite');
const LOG_FILE = path.join(PROJECT_DIR, 'backend.log');
const JWT_SECRET = process.env.JWT_SECRET || 'yunnan-hrss-jwt-secret-2026';

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  process.stdout.write(line);
  fs.appendFileSync(LOG_FILE, line);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  if (!password || !hash) return false;
  try {
    return bcrypt.compareSync(password, hash);
  } catch (e) {
    log(`Password verify error: ${e.message}`);
    return false;
  }
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, idCard: user.id_card },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '认证令牌无效或已过期' });
  }
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ code: 403, message: '需要管理员权限' });
  }
  next();
}

function getClientIp(req) {
  return req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';
}

function auditLog(db, userId, userName, action, resource, req, details = '') {
  try {
    db.prepare(`
      INSERT INTO audit_logs (user_id, user_name, action, resource, ip, user_agent, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(userId, userName, action, resource, getClientIp(req), req.headers['user-agent'] || '', details);
  } catch (e) {
    log(`Audit log error: ${e.message}`);
  }
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      id_card TEXT UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL DEFAULT '',
      role TEXT DEFAULT 'user',
      social_card_no TEXT,
      avatar TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS insurance_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      insurance_type TEXT,
      payment_month TEXT,
      payment_base REAL,
      personal_amount REAL,
      company_amount REAL,
      total_amount REAL,
      payment_status TEXT DEFAULT 'paid',
      company_name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS labor_contracts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_no TEXT UNIQUE,
      employer_name TEXT,
      employee_id_card TEXT,
      employee_name TEXT,
      contract_type TEXT DEFAULT 'fixed',
      position TEXT,
      salary REAL,
      work_location TEXT,
      status TEXT DEFAULT 'draft',
      start_date TEXT,
      end_date TEXT,
      content_hash TEXT,
      blockchain_hash TEXT,
      signed_by_employee_at TEXT,
      signed_by_employer_at TEXT,
      terminated_at TEXT,
      termination_reason TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS contract_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      contract_id INTEGER,
      change_type TEXT,
      change_content TEXT,
      effective_date TEXT,
      status TEXT DEFAULT 'pending',
      blockchain_hash TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS certifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      certification_type TEXT,
      status TEXT DEFAULT 'pending',
      liveness_score REAL,
      face_match_score REAL,
      background_check TEXT,
      certified_at TEXT,
      expiry_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS rights_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_no TEXT UNIQUE,
      user_id INTEGER,
      title TEXT,
      type TEXT,
      description TEXT,
      status TEXT DEFAULT 'pending',
      current_handler TEXT,
      evidence_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS evidences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rights_id INTEGER,
      file_name TEXT,
      file_type TEXT,
      file_size INTEGER,
      file_hash TEXT,
      timestamp TEXT,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      company_name TEXT,
      location TEXT,
      salary_min REAL,
      salary_max REAL,
      education TEXT,
      experience TEXT,
      major_tags TEXT,
      job_tags TEXT,
      description TEXT,
      deadline TEXT,
      view_count INTEGER DEFAULT 0,
      posted_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS job_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER,
      user_id INTEGER,
      resume_url TEXT,
      status TEXT DEFAULT 'pending',
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS institutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      type TEXT,
      address TEXT,
      lat REAL,
      lng REAL,
      phone TEXT,
      working_hours TEXT,
      services TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      document_no TEXT,
      issuing_department TEXT,
      issue_date TEXT,
      effective_date TEXT,
      category TEXT,
      tags TEXT,
      summary TEXT,
      content TEXT,
      view_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS qa (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT,
      answer TEXT,
      category TEXT,
      tags TEXT,
      view_count INTEGER DEFAULT 0,
      helpful_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS supervise_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_type TEXT,
      business_no TEXT,
      title TEXT,
      applicant TEXT,
      receive_date TEXT,
      deadline TEXT,
      handler TEXT,
      status TEXT DEFAULT 'normal',
      remind_count INTEGER DEFAULT 0,
      last_reminded_at TEXT,
      handle_result TEXT,
      handle_remark TEXT,
      next_step TEXT,
      handled_at TEXT,
      handled_by TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS supervise_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supervise_id INTEGER,
      action TEXT,
      action_by TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS policy_push (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      push_id TEXT UNIQUE,
      policy_id INTEGER,
      title TEXT,
      tags TEXT,
      push_type TEXT,
      target_group TEXT,
      scheduled_time TEXT,
      status TEXT DEFAULT 'pending',
      created_by TEXT,
      completed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      user_name TEXT,
      action TEXT,
      resource TEXT,
      ip TEXT,
      user_agent TEXT,
      details TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const seeded = db.prepare('SELECT COUNT(*) as count FROM users').get().count > 0;
  if (seeded) return;

  const pwdHash = hashPassword('password123');
  const adminPwdHash = hashPassword('admin123');

  db.prepare('INSERT INTO users (name, id_card, phone, password_hash, role, social_card_no) VALUES (?, ?, ?, ?, ?, ?)').run(
    '张三', '530102199001011234', '13800138001', pwdHash, 'user', '530102199001011234'
  );
  db.prepare('INSERT INTO users (name, id_card, phone, password_hash, role, social_card_no) VALUES (?, ?, ?, ?, ?, ?)').run(
    '李四', '530102199202022345', '13800138002', pwdHash, 'user', '530102199202022345'
  );
  db.prepare('INSERT INTO users (name, id_card, phone, password_hash, role, social_card_no) VALUES (?, ?, ?, ?, ?, ?)').run(
    '管理员', 'admin', '13900139000', adminPwdHash, 'admin', 'ADMIN-YNRS'
  );

  const insertPayment = db.prepare(`
    INSERT INTO insurance_payments (user_id, insurance_type, payment_month, payment_base, personal_amount, company_amount, total_amount, payment_status, company_name)
    VALUES (1, ?, ?, ?, ?, ?, ?, 'paid', '云南云岭建设服务有限公司')
  `);
  
  const companies = ['云南云岭建设服务有限公司', '昆明滇池文旅服务有限公司', '云南数字人社科技有限公司'];
  const types = ['pension', 'medical', 'unemployment', 'injury', 'maternity'];
  
  for (let month = 0; month < 36; month++) {
    const date = new Date(2023, 5 - month, 1);
    const year = date.getFullYear();
    const mon = String(date.getMonth() + 1).padStart(2, '0');
    const base = 7500 + Math.floor(Math.random() * 1500);
    const company = companies[month % 3];
    
    types.forEach((type) => {
      let personal = 0, company = 0;
      switch (type) {
        case 'pension': personal = base * 0.08; company = base * 0.16; break;
        case 'medical': personal = base * 0.02; company = base * 0.095; break;
        case 'unemployment': personal = base * 0.005; company = base * 0.005; break;
        case 'injury': personal = 0; company = base * 0.002; break;
        case 'maternity': personal = 0; company = base * 0.005; break;
      }
      insertPayment.run(type, `${year}-${mon}`, base, Number(personal.toFixed(2)), Number(company.toFixed(2)), Number((personal + company).toFixed(2)));
    });
  }

  const insertContract = db.prepare(`
    INSERT INTO labor_contracts (contract_no, employer_name, employee_id_card, employee_name, contract_type, position, salary, work_location, status, start_date, end_date, blockchain_hash, signed_by_employee_at, signed_by_employer_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertContract.run('HT-YN-2026-0001', '云南云岭建设服务有限公司', '530102199001011234', '张三', 'fixed', '工程资料员', 7200, '昆明市五华区政务服务中心项目部', 'active', '2026-01-01', '2028-12-31', '0x8f77e0c3a91b2c3d4e5f6', '2026-01-01 10:30:00', '2026-01-01 09:00:00');
  insertContract.run('HT-YN-2025-0098', '昆明滇池文旅服务有限公司', '530102199001011234', '张三', 'fixed', '社保专员', 6500, '昆明市西山区滇池路88号', 'pending_sign', '2025-08-01', '2027-07-31', '0xa9c51dd430b8e7f6a5b4c', null, '2025-08-01 14:20:00');
  insertContract.run('HT-YN-2024-0156', '云南数字人社科技有限公司', '530102199001011234', '张三', 'unfixed', '高级工程师', 15000, '昆明市呈贡区云上小镇', 'active', '2024-03-15', null, '0x7e3f9a2c8b5d1e4f7a9c2', '2024-03-15 09:30:00', '2024-03-15 08:00:00');

  db.prepare(`
    INSERT INTO certifications (user_id, certification_type, status, liveness_score, face_match_score, background_check, certified_at, expiry_date)
    VALUES (1, 'pension', 'success', 98.2, 99.1, 'pass', '2026-05-21 09:30:00', '2027-05-21')
  `).run();
  db.prepare(`
    INSERT INTO certifications (user_id, certification_type, status, liveness_score, face_match_score, background_check, certified_at, expiry_date)
    VALUES (2, 'subsidy', 'success', 96.5, 97.8, 'pass', '2026-04-15 14:20:00', '2027-04-15')
  `).run();

  const insertRights = db.prepare(`
    INSERT INTO rights_cases (case_no, user_id, title, type, description, status, current_handler, evidence_count)
    VALUES (?, 1, ?, ?, ?, ?, ?, ?)
  `);
  insertRights.run('WQ-202606-001', '工资拖欠在线投诉', 'wage', '提交工资流水、聊天记录和现场照片，已完成时间戳存证。', 'processing', '昆明市劳动监察支队', 3);
  insertRights.run('WQ-202605-018', '未依法缴纳社保举报', 'social_security', '系统已转办属地经办机构。', 'transferred', '五华区人社局', 2);
  insertRights.run('WQ-202603-045', '违法解除劳动合同赔偿', 'dismissal', '用人单位未提前30天通知，要求支付经济补偿金。', 'resolved', '官渡区劳动人事争议仲裁院', 5);

  const insertJob = db.prepare(`
    INSERT INTO jobs (title, company_name, location, salary_min, salary_max, education, experience, major_tags, job_tags, description, deadline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertJob.run('社保经办窗口专员', '昆明市公共就业和人才服务中心', '昆明', 5200, 7200, 'college', 'entry', '公共管理,人力资源,劳动与社会保障', '五险一金,窗口服务,政务大厅', '负责电子社保卡咨询、参保登记和待遇资格认证引导。', '2026-07-15');
  insertJob.run('劳动合同电子签署运营', '云南数字人社科技有限公司', '昆明', 8000, 12000, 'bachelor', '1-3', '法学,信息管理,计算机', '电子签名,存证上链,合同管理', '负责劳动合同模板配置、签署流程运营和数据核验。', '2026-07-20');
  insertJob.run('社保数据治理工程师', '云南省人社数据中心', '昆明', 12000, 18000, 'bachelor', '3-5', '计算机,软件工程,数据科学', 'SQLite,数据治理,安全审计', '建设五险数据质量核验、跨省通办接口和审计报表。', '2026-08-01');
  insertJob.run('劳动监察执法辅助', '昆明市人力资源和社会保障局', '昆明', 4800, 6800, 'college', '1-3', '法学,行政管理', '执法检查,投诉处理,文书制作', '协助开展劳动保障监察执法，处理欠薪投诉。', '2026-07-25');
  insertJob.run('政策研究专员', '云南省人力资源和社会保障厅', '昆明', 7000, 10000, 'master', '3-5', '劳动与社会保障,公共管理,经济学', '政策研究,文稿起草,数据分析', '负责人社政策研究、文件起草和政策评估工作。', '2026-08-15');
  insertJob.run('待遇资格认证系统运维', '云南省社会保险局', '昆明', 8500, 13000, 'bachelor', '3-5', '计算机,软件工程,电子信息', '系统运维,人脸识别,活体检测', '负责待遇资格认证系统的日常运维和技术支持。', '2026-07-30');

  const insertInstitution = db.prepare(`
    INSERT INTO institutions (name, type, address, lat, lng, phone, working_hours, services)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertInstitution.run('云南省人力资源和社会保障政务服务大厅', 'social_security', '昆明市官渡区国贸路309号', 25.0289, 102.7328, '0871-12333', '周一至周五 09:00-17:00', '参保登记,权益查询,资格认证,维权咨询');
  insertInstitution.run('昆明市医疗保险服务中心', 'medical_insurance', '昆明市呈贡区市级行政中心2号楼', 24.8802, 102.8345, '0871-63610000', '周一至周五 09:00-17:00', '医保参保,账户查询,异地就医备案,医保报销');
  insertInstitution.run('五华区劳动监察大队', 'employment', '昆明市五华区龙泉路191号', 25.0678, 102.6987, '0871-65123456', '周一至周五 09:00-17:00', '欠薪投诉,用工检查,法律援助,劳动仲裁');
  insertInstitution.run('盘龙区社会保险局', 'social_security', '昆明市盘龙区白云路327号', 25.0512, 102.7234, '0871-63123456', '周一至周五 09:00-17:00', '养老保险,失业保险,工伤保险,生育保险');
  insertInstitution.run('西山区人才服务中心', 'training', '昆明市西山区丽苑路188号', 25.0345, 102.6789, '0871-68123456', '周一至周五 09:00-17:00', '职业培训,技能鉴定,就业推荐,创业扶持');
  insertInstitution.run('呈贡区政务服务中心人社窗口', 'other', '昆明市呈贡区锦绣大街1号', 24.8807, 102.8359, '0871-67456789', '周一至周五 09:00-17:00', '综合业务办理,社保卡服务,证明打印');

  const insertPolicy = db.prepare(`
    INSERT INTO policies (title, document_no, issuing_department, issue_date, effective_date, category, tags, summary, content, view_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPolicy.run('云南省关于完善企业职工基本养老保险制度的实施意见', '云政发〔2025〕1号', '云南省人民政府', '2025-01-15', '2025-02-01', '养老保险', '养老保险,缴费比例,基础养老金,个人账户', '为进一步完善我省企业职工基本养老保险制度，根据国家有关规定，结合我省实际，制定本实施意见。', '一、完善企业职工基本养老保险制度的指导思想和主要任务\n\n（一）指导思想。以习近平新时代中国特色社会主义思想为指导，深入贯彻党的二十大精神，按照党中央、国务院决策部署，坚持以人民为中心的发展思想，围绕覆盖全民、统筹城乡、公平统一、安全规范、可持续的多层次社会保障体系目标，完善制度、健全机制、强化管理、优化服务，确保参保人员的养老保险权益，推动我省企业职工基本养老保险制度高质量发展。\n\n（二）主要任务。一是完善参保缴费政策，扩大养老保险覆盖面；二是完善待遇确定和调整机制，确保待遇水平合理适度；三是完善基金统筹制度，增强基金抗风险能力；四是完善经办管理服务，提升服务质量和效率；五是完善基金监管体系，确保基金安全完整。\n\n二、完善参保缴费政策\n\n（三）扩大参保覆盖范围。本省行政区域内的企业、事业单位、社会团体、民办非企业单位、基金会、律师事务所、会计师事务所等组织（以下称用人单位）和与之形成劳动关系的劳动者，应当依法参加企业职工基本养老保险。\n\n（四）统一缴费比例。用人单位缴费比例为16%，计入统筹基金；个人缴费比例为8%，计入个人账户。', 2560);
  insertPolicy.run('云南省城乡居民基本医疗保险实施办法', '云医保发〔2025〕15号', '云南省医疗保障局', '2025-03-10', '2025-04-01', '医疗保险', '医疗保险,城乡居民,报销比例,门诊统筹', '为保障我省城乡居民基本医疗需求，完善城乡居民基本医疗保险制度，制定本实施办法。', '第一章 总则\n\n第一条 为完善城乡居民基本医疗保险制度，保障城乡居民基本医疗需求，根据《中华人民共和国社会保险法》《医疗保障基金使用监督管理条例》等法律法规，结合我省实际，制定本实施办法。\n\n第二条 本办法适用于本省行政区域内未参加职工基本医疗保险的城乡居民，包括农村居民、城镇非从业居民、在校学生、学龄前儿童以及其他城乡居民。\n\n第三条 城乡居民基本医疗保险制度坚持全覆盖、保基本、多层次、可持续的原则，实行个人缴费和政府补助相结合，待遇水平与经济社会发展水平相适应。\n\n第二章 参保缴费\n\n第四条 城乡居民基本医疗保险实行年度缴费制度，每年9月1日至12月31日为下一年度参保缴费期。\n\n第五条 2025年城乡居民基本医疗保险个人缴费标准为每人每年380元，政府补助标准为每人每年640元。', 1890);
  insertPolicy.run('云南省失业保险条例实施细则', '云人社发〔2024〕89号', '云南省人力资源和社会保障厅', '2024-11-20', '2025-01-01', '失业保险', '失业保险,失业金,技能提升补贴,稳岗返还', '根据《云南省失业保险条例》，结合我省实际，制定本实施细则。', '第一章 总则\n\n第一条 为了实施《云南省失业保险条例》（以下简称条例），结合我省实际，制定本实施细则。\n\n第二条 本省行政区域内的企业、事业单位、社会团体、民办非企业单位、基金会、律师事务所、会计师事务所等组织（以下统称用人单位）和与之建立劳动关系的职工，应当依照条例和本细则规定参加失业保险。\n\n第三条 失业保险实行省级统筹，统一政策、统一标准、统一基金管理、统一经办流程。\n\n第二章 失业保险费缴纳\n\n第四条 用人单位按照本单位职工工资总额的1%缴纳失业保险费，职工按照本人工资的0.5%缴纳失业保险费。\n\n第五条 职工个人应当缴纳的失业保险费，由用人单位从职工本人工资中代扣代缴。', 1450);
  insertPolicy.run('云南省电子社保卡公共服务应用指引', '云人社办〔2026〕12号', '云南省人力资源和社会保障厅', '2026-05-10', '2026-06-01', '电子社保卡', '电子社保卡,实名认证,一网通办,待遇认证', '明确电子社保卡作为统一身份认证载体接入全省人社公共服务。', '一、总体要求\n\n（一）指导思想。以习近平新时代中国特色社会主义思想为指导，深入贯彻落实党中央、国务院关于加快推进"互联网+政务服务"的决策部署，以社会保障卡为载体，以居民服务"一卡通"为目标，推进电子社保卡在人社领域的广泛应用，为群众提供更加便捷、高效、安全的人社公共服务。\n\n（二）基本原则。坚持统一标准，严格按照国家统一规范建设电子社保卡应用体系；坚持便民利民，以群众需求为导向，简化办事流程，优化服务体验；坚持安全可控，落实网络安全等级保护要求，确保个人信息和资金安全。\n\n二、应用场景\n\n（三）身份认证。电子社保卡作为全省人社公共服务的统一身份认证载体，支持扫码登录、人脸识别登录等多种认证方式。\n\n（四）权益查询。持卡人可通过电子社保卡查询养老保险、医疗保险、失业保险、工伤保险、生育保险等各项社会保险权益信息。', 1280);
  insertPolicy.run('劳动合同电子签署与存证工作规范', '云人社规〔2026〕4号', '云南省人力资源和社会保障厅', '2026-04-18', '2026-05-01', '劳动合同', '电子签名,合同存证,劳动关系,区块链', '规范线上合同签署、变更、终止与证据固化流程。', '第一章 总则\n\n第一条 为规范劳动合同电子签署行为，保障用人单位和劳动者的合法权益，根据《中华人民共和国劳动合同法》《中华人民共和国电子签名法》等法律法规，结合我省实际，制定本规范。\n\n第二条 本省行政区域内的用人单位与劳动者订立、履行、变更、解除或者终止劳动合同，采用电子形式的，适用本规范。\n\n第三条 电子劳动合同与书面劳动合同具有同等法律效力，用人单位和劳动者应当依法履行各自的义务。\n\n第二章 电子签署要求\n\n第四条 采用电子形式订立劳动合同，应当使用符合《中华人民共和国电子签名法》规定的可靠电子签名。\n\n第五条 用人单位和劳动者应当通过实名身份认证后，方可进行电子签名。', 960);

  const insertQA = db.prepare('INSERT INTO qa (question, answer, category, tags, view_count, helpful_count) VALUES (?, ?, ?, ?, ?, ?)');
  insertQA.run('养老保险缴费满15年就可以不用再缴了吗？', '不是的。根据社会保险法规定，养老保险累计缴费满15年只是领取基本养老金的条件之一。只要您与用人单位建立劳动关系，就应当依法缴纳养老保险。缴费年限越长，退休后领取的养老金就越高。', '养老保险', '养老保险,缴费年限,养老金', 15234, 1245);
  insertQA.run('社保卡丢失了怎么补办？', '社保卡丢失后，请您及时拨打12333服务热线办理挂失。补办新卡需要本人携带身份证原件到就近的社保卡服务网点办理，补办费用为20元。一般15个工作日后可以领取新卡。', '社保卡', '社保卡,补办,挂失', 12890, 987);
  insertQA.run('异地就医如何备案？', '参保人员跨省异地就医前，可通过以下方式办理备案：1. 登录"国家医保服务平台"APP在线办理；2. 拨打参保地12393医保服务热线办理；3. 到参保地医保经办机构窗口办理。备案成功后，可在异地定点医院直接结算。', '医疗保险', '异地就医,备案,医保结算', 10567, 876);
  insertQA.run('失业金领取条件是什么？', '领取失业金需要同时满足以下条件：1. 失业前用人单位和本人已经缴纳失业保险费满一年的；2. 非因本人意愿中断就业的；3. 已经进行失业登记，并有求职要求的。', '失业保险', '失业保险,失业金,领取条件', 8976, 765);
  insertQA.run('工伤认定的申请时限是多久？', '职工发生事故伤害或者按照职业病防治法规定被诊断、鉴定为职业病，所在单位应当自事故伤害发生之日或者被诊断、鉴定为职业病之日起30日内，向统筹地区社会保险行政部门提出工伤认定申请。用人单位未按前款规定提出工伤认定申请的，工伤职工或者其近亲属、工会组织在事故伤害发生之日或者被诊断、鉴定为职业病之日起1年内，可以直接向用人单位所在地统筹地区社会保险行政部门提出工伤认定申请。', '工伤保险', '工伤保险,工伤认定,申请时限', 7654, 654);
  insertQA.run('生育津贴怎么计算？', '生育津贴按照职工所在用人单位上年度职工月平均工资计发。计算公式：生育津贴=用人单位上年度职工月平均工资÷30×产假天数。产假天数按照国家和我省有关规定执行，基础产假为158天。', '生育保险', '生育保险,生育津贴,产假', 6543, 543);
  insertQA.run('劳动仲裁的时效是多久？', '劳动争议申请仲裁的时效期间为一年。仲裁时效期间从当事人知道或者应当知道其权利被侵害之日起计算。劳动关系存续期间因拖欠劳动报酬发生争议的，劳动者申请仲裁不受一年仲裁时效期间的限制；但是，劳动关系终止的，应当自劳动关系终止之日起一年内提出。', '劳动维权', '劳动仲裁,仲裁时效,劳动争议', 5432, 432);
  insertQA.run('待遇资格认证多久做一次？', '领取养老保险待遇的退休人员，每年需要进行一次待遇资格认证。认证周期为12个月，从上次认证成功的时间开始计算。逾期未认证的，将暂停发放养老金，待认证通过后恢复发放并补发暂停期间的养老金。', '待遇认证', '资格认证,人脸识别,养老金', 4321, 321);

  const insertSupervise = db.prepare(`
    INSERT INTO supervise_tasks (business_type, business_no, title, applicant, receive_date, deadline, handler, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const today = new Date();
  for (let i = 0; i < 15; i++) {
    const receiveDate = new Date(today);
    receiveDate.setDate(receiveDate.getDate() - (15 + i * 2));
    const deadline = new Date(receiveDate);
    deadline.setDate(deadline.getDate() + 20);
    const remaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
    let status = 'normal';
    if (remaining <= 3) status = 'warning';
    if (remaining < 0) status = 'overdue';
    
    const types = ['rights', 'insurance', 'contract', 'certification'];
    const applicants = ['张三', '李四', '王五', '赵六', '陈七'];
    const handlers = ['昆明市劳动监察支队', '五华区人社局', '官渡区社保分局', '西山区医保中心', '盘龙区就业局'];
    const titles = ['工资拖欠投诉办理', '社保补缴申请', '劳动合同备案', '待遇资格认证复核', '失业金申领审批'];
    
    insertSupervise.run(
      types[i % 4],
      `BZ-${2026}${String(6).padStart(2, '0')}${String(100 + i)}`,
      titles[i % 5],
      applicants[i % 5],
      receiveDate.toISOString().split('T')[0],
      deadline.toISOString().split('T')[0],
      handlers[i % 5],
      status
    );
  }

  db.prepare("INSERT INTO audit_logs (user_id, user_name, action, resource, ip) VALUES ('3', '经办管理员', '查看运营总览', 'admin.dashboard', '127.0.0.1')").run();
  db.prepare("INSERT INTO audit_logs (user_id, user_name, action, resource, ip) VALUES ('1', '张三', '登录系统', 'auth.login', '127.0.0.1')").run();
  db.prepare("INSERT INTO audit_logs (user_id, user_name, action, resource, ip) VALUES ('1', '张三', '查询养老保险', 'insurance.pension', '127.0.0.1')").run();
  db.prepare("INSERT INTO audit_logs (user_id, user_name, action, resource, ip) VALUES ('1', '张三', '下载权益单', 'insurance.export', '127.0.0.1')").run();
  db.prepare("INSERT INTO audit_logs (user_id, user_name, action, resource, ip) VALUES ('3', '经办管理员', '督办超时业务', 'admin.supervise', '127.0.0.1')").run();
}

function ok(data, message = 'success') {
  return { code: 200, message, data, timestamp: new Date().toISOString() };
}

function getCurrentUser(req) {
  const userId = req.user?.id || 1;
  return db.prepare('SELECT id, name, id_card, phone, role, social_card_no, avatar, created_at FROM users WHERE id = ?').get(userId);
}

function maskIdCard(idCard) {
  if (!idCard || idCard.length < 8) return idCard;
  return idCard.slice(0, 6) + '********' + idCard.slice(-4);
}

initDatabase();

const app = express();
const origins = [`http://127.0.0.1:${FRONTEND_PORT}`, `http://localhost:${FRONTEND_PORT}`];
app.use(cors({
  origin(origin, callback) {
    if (!origin || origins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use((req, res, next) => {
  log(`${req.method} ${req.path}`);
  next();
});

app.get('/api/health', (req, res) => {
  res.json(ok({ status: 'ok', service: 'yunnan-human-social-service', port: BACKEND_PORT, db: DB_PATH }));
});

app.post('/api/auth/login', (req, res) => {
  const { idCard, password, authType } = req.body;
  
  if (!idCard || !password) {
    return res.status(400).json({ code: 400, message: '请输入账号和密码' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE id_card = ?').get(idCard);
  if (!user) {
    return res.status(401).json({ code: 401, message: '账号不存在' });
  }
  
  let passwordValid = verifyPassword(password, user.password_hash);
  
  if (!passwordValid && !user.password_hash) {
    const defaultPasswords = {
      '530102199001011234': 'password123',
      '530102199202022345': 'password123',
      'admin': 'admin123'
    };
    if (defaultPasswords[idCard] === password) {
      const newHash = hashPassword(password);
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, user.id);
      user.password_hash = newHash;
      passwordValid = true;
      log(`Fixed password hash for user: ${idCard}`);
    }
  }
  
  if (!passwordValid) {
    return res.status(401).json({ code: 401, message: '密码错误' });
  }
  
  const token = generateToken(user);
  
  auditLog(db, user.id, user.name, '登录系统', 'auth.login', req, `认证方式: ${authType || 'password'}`);
  
  const safeUser = {
    id: user.id,
    name: user.name,
    idCard: maskIdCard(user.id_card),
    phone: user.phone,
    role: user.role,
    socialSecurityCardNo: user.social_card_no,
    avatar: user.avatar
  };
  
  res.json(ok({ token, user: safeUser }));
});

app.post('/api/auth/logout', authMiddleware, (req, res) => {
  auditLog(db, req.user.id, req.user.idCard, '登出系统', 'auth.logout', req);
  res.json(ok({ loggedOut: true }));
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = getCurrentUser(req);
  if (user) {
    user.id_card = maskIdCard(user.id_card);
  }
  res.json(ok({ user }));
});

app.get('/api/user/profile', authMiddleware, (req, res) => {
  const user = getCurrentUser(req);
  if (user) {
    user.id_card = maskIdCard(user.id_card);
  }
  res.json(ok({ user, profile: user }));
});

app.get('/api/users/profile', authMiddleware, (req, res) => {
  const user = getCurrentUser(req);
  if (user) {
    user.id_card = maskIdCard(user.id_card);
  }
  res.json(ok({ user, profile: user }));
});

app.get('/api/insurance/summary', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const rows = db.prepare('SELECT * FROM insurance_payments WHERE user_id = ? ORDER BY payment_month DESC').all(userId);
  const types = ['pension', 'medical', 'unemployment', 'injury', 'maternity'];
  const labels = { pension: '养老保险', medical: '医疗保险', unemployment: '失业保险', injury: '工伤保险', maternity: '生育保险' };
  const summary = {};
  let totalMonths = 0;
  let totalBalance = 0;
  
  types.forEach((type) => {
    const records = rows.filter((row) => row.insurance_type === type);
    const last = records[0] || {};
    const months = records.length;
    const personalBal = Number((records.reduce((sum, row) => sum + row.personal_amount, 0)).toFixed(2));
    const overallBal = Number((records.reduce((sum, row) => sum + row.company_amount, 0)).toFixed(2));
    
    summary[type] = {
      type,
      label: labels[type],
      status: 'normal',
      paymentMonths: months,
      personalAccountBalance: personalBal,
      overallAccountBalance: overallBal,
      lastPaymentDate: last.payment_month || '-'
    };
    
    totalMonths = Math.max(totalMonths, months);
    totalBalance += personalBal;
  });
  
  auditLog(db, userId, req.user.idCard, '查询五险总览', 'insurance.summary', req);
  res.json(ok({ ...summary, totalPaymentMonths: totalMonths, totalAccountBalance: Number(totalBalance.toFixed(2)) }));
});

app.get('/api/insurance/:type', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const type = req.params.type;
  const payments = db.prepare('SELECT * FROM insurance_payments WHERE user_id = ? AND insurance_type = ? ORDER BY payment_month DESC').all(userId, type);
  const labels = { pension: '养老保险', medical: '医疗保险', unemployment: '失业保险', injury: '工伤保险', maternity: '生育保险' };
  
  const summary = {
    totalMonths: payments.length,
    totalPersonal: Number(payments.reduce((sum, row) => sum + row.personal_amount, 0).toFixed(2)),
    totalCompany: Number(payments.reduce((sum, row) => sum + row.company_amount, 0).toFixed(2)),
    avgBase: payments.length > 0 ? Number((payments.reduce((sum, row) => sum + row.payment_base, 0) / payments.length).toFixed(2)) : 0
  };
  
  auditLog(db, userId, req.user.idCard, `查询${labels[type] || type}明细`, `insurance.${type}`, req);
  res.json(ok({ type, label: labels[type] || type, payments, summary, status: 'normal' }));
});

app.get('/api/insurance/:type/payments', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 12;
  const offset = (page - 1) * pageSize;
  
  const countStmt = db.prepare('SELECT COUNT(*) as count FROM insurance_payments WHERE user_id = ? AND insurance_type = ?');
  const dataStmt = db.prepare('SELECT * FROM insurance_payments WHERE user_id = ? AND insurance_type = ? ORDER BY payment_month DESC LIMIT ? OFFSET ?');
  
  const { count } = countStmt.get(userId, req.params.type);
  const payments = dataStmt.all(userId, req.params.type, pageSize, offset);
  
  res.json(ok({
    list: payments,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize)
  }));
});

app.get('/api/insurance/transfer', authMiddleware, (req, res) => {
  const userId = req.user.id;
  
  const transferRecords = [
    {
      id: 1,
      type: '原参保地社保经办机构转出',
      location: '上海市社保中心',
      date: '2023-03-15',
      amount: null,
      status: 'done',
      remark: '已完成转出手续'
    },
    {
      id: 2,
      type: '转移基金划转',
      location: '上海市社保中心',
      date: '2023-03-20',
      amount: 128650.00,
      status: 'done',
      remark: '基金已划转至新参保地'
    },
    {
      id: 3,
      type: '新参保地接收',
      location: '昆明市社保中心',
      date: '2023-03-25',
      amount: null,
      status: 'done',
      remark: '已完成转入手续'
    },
    {
      id: 4,
      type: '个人账户合并',
      location: '昆明市社保中心',
      date: '2023-04-05',
      amount: null,
      status: 'done',
      remark: '个人账户已合并完成'
    }
  ];
  
  auditLog(db, userId, req.user.idCard, '查询社保转移接续轨迹', 'insurance.transfer', req);
  res.json(ok(transferRecords));
});

app.get('/api/contract', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const user = getCurrentUser(req);
  const contracts = db.prepare('SELECT * FROM labor_contracts WHERE employee_id_card = ? ORDER BY created_at DESC').all(user?.id_card || '530102199001011234');
  auditLog(db, userId, req.user.idCard, '查询劳动合同列表', 'contract.list', req);
  res.json(ok(contracts));
});

app.get('/api/contract/history', authMiddleware, (req, res) => {
  const userId = req.user.id;
  const user = getCurrentUser(req);
  const contracts = db.prepare('SELECT * FROM labor_contracts WHERE employee_id_card = ? ORDER BY created_at DESC').all(user?.id_card || '530102199001011234');

  const history = [];
  contracts.forEach(contract => {
    history.push({
      id: contract.id,
      contractNo: contract.contract_no,
      type: 'sign',
      typeLabel: '合同签订',
      date: contract.start_date,
      employer: contract.employer_name,
      position: contract.position,
      salary: contract.salary,
      status: contract.status,
      blockchainHash: contract.blockchain_hash,
      createdAt: contract.created_at
    });

    if (contract.status === 'terminated') {
      history.push({
        id: contract.id,
        contractNo: contract.contract_no,
        type: 'terminate',
        typeLabel: '合同终止',
        date: contract.terminated_at,
        employer: contract.employer_name,
        reason: contract.termination_reason,
        blockchainHash: contract.blockchain_hash,
        createdAt: contract.terminated_at
      });
    }
  });

  history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  auditLog(db, userId, req.user.idCard, '查询合同变更历史', 'contract.history', req);
  res.json(ok(history));
});

app.get('/api/contract/:id', authMiddleware, (req, res) => {
  const item = db.prepare('SELECT * FROM labor_contracts WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ code: 404, message: '合同不存在' });
  auditLog(db, req.user.id, req.user.idCard, '查看合同详情', `contract.${req.params.id}`, req);
  res.json(ok(item));
});

app.post('/api/contract/:id/sign', authMiddleware, (req, res) => {
  const now = new Date().toISOString();
  const hash = crypto.createHash('sha256').update(`${req.params.id}-${now}`).digest('hex');
  db.prepare("UPDATE labor_contracts SET status = 'active', signed_by_employee_at = ?, blockchain_hash = ? WHERE id = ?").run(now, `0x${hash}`, req.params.id);
  auditLog(db, req.user.id, req.user.idCard, '签署劳动合同', `contract.sign.${req.params.id}`, req);
  res.json(ok({ id: req.params.id, status: 'active', signedAt: now, blockchainHash: `0x${hash}` }));
});

app.post('/api/contract/:id/change', authMiddleware, (req, res) => {
  const { changeType, changeContent, effectiveDate } = req.body;
  if (!changeType || !changeContent || !effectiveDate) {
    return res.status(400).json({ code: 400, message: '请填写完整变更信息' });
  }
  
  const contract = db.prepare('SELECT * FROM labor_contracts WHERE id = ?').get(req.params.id);
  if (!contract) {
    return res.status(404).json({ code: 404, message: '合同不存在' });
  }
  if (contract.status !== 'active') {
    return res.status(400).json({ code: 400, message: '只有生效中的合同才能变更' });
  }
  
  const now = new Date().toISOString();
  const hash = crypto.createHash('sha256').update(`${req.params.id}-change-${now}`).digest('hex');
  const blockchainHash = `0x${hash}`;
  
  db.prepare(`
    INSERT INTO contract_changes (contract_id, change_type, change_content, effective_date, status, blockchain_hash, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?)
  `).run(req.params.id, changeType, changeContent, effectiveDate, blockchainHash, now);
  
  auditLog(db, req.user.id, req.user.idCard, '变更劳动合同', `contract.change.${req.params.id}`, req, `变更类型: ${changeType}, 生效日期: ${effectiveDate}`);
  res.json(ok({ id: req.params.id, blockchainHash, changedAt: now, status: 'pending' }));
});

app.post('/api/contract/:id/terminate', authMiddleware, (req, res) => {
  const { reason, effectiveDate } = req.body;
  if (!reason || !effectiveDate) {
    return res.status(400).json({ code: 400, message: '请填写完整终止信息' });
  }
  
  const contract = db.prepare('SELECT * FROM labor_contracts WHERE id = ?').get(req.params.id);
  if (!contract) {
    return res.status(404).json({ code: 404, message: '合同不存在' });
  }
  if (contract.status !== 'active') {
    return res.status(400).json({ code: 400, message: '只有生效中的合同才能终止' });
  }
  
  const now = new Date().toISOString();
  const hash = crypto.createHash('sha256').update(`${req.params.id}-terminate-${now}`).digest('hex');
  const blockchainHash = `0x${hash}`;
  
  db.prepare("UPDATE labor_contracts SET status = 'terminated', terminated_at = ?, termination_reason = ?, blockchain_hash = ? WHERE id = ?").run(
    effectiveDate, reason, blockchainHash, req.params.id
  );
  
  auditLog(db, req.user.id, req.user.idCard, '终止劳动合同', `contract.terminate.${req.params.id}`, req, `终止原因: ${reason}, 终止日期: ${effectiveDate}`);
  res.json(ok({ id: req.params.id, blockchainHash, terminatedAt: now, status: 'terminated' }));
});

app.get('/api/certification', authMiddleware, (req, res) => {
  const certs = db.prepare('SELECT * FROM certifications WHERE user_id = ? ORDER BY id DESC').all(req.user.id);
  auditLog(db, req.user.id, req.user.idCard, '查询认证记录', 'certification.list', req);
  res.json(ok(certs));
});

app.post('/api/certification', authMiddleware, (req, res) => {
  const livenessScore = 95 + Math.random() * 5;
  const faceMatchScore = 94 + Math.random() * 6;
  const now = new Date();
  const expiry = new Date(now);
  expiry.setFullYear(expiry.getFullYear() + 1);
  
  db.prepare(`
    INSERT INTO certifications (user_id, certification_type, status, liveness_score, face_match_score, background_check, certified_at, expiry_date)
    VALUES (?, ?, 'success', ?, ?, 'pass', ?, ?)
  `).run(req.user.id, req.body.type || 'pension', livenessScore.toFixed(1), faceMatchScore.toFixed(1), now.toISOString(), expiry.toISOString().split('T')[0]);
  
  auditLog(db, req.user.id, req.user.idCard, '完成待遇资格认证', 'certification.submit', req, `活体检测: ${livenessScore.toFixed(1)}%, 人脸匹配: ${faceMatchScore.toFixed(1)}%`);
  res.json(ok({ status: 'success', livenessScore: livenessScore.toFixed(1), faceMatchScore: faceMatchScore.toFixed(1), certifiedAt: now.toISOString(), expiryDate: expiry.toISOString().split('T')[0] }));
});

app.get('/api/rights', authMiddleware, (req, res) => {
  const cases = db.prepare('SELECT * FROM rights_cases WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  auditLog(db, req.user.id, req.user.idCard, '查询维权记录', 'rights.list', req);
  res.json(ok(cases));
});

app.get('/api/rights/:id', authMiddleware, (req, res) => {
  const item = db.prepare('SELECT * FROM rights_cases WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ code: 404, message: '记录不存在' });
  const evidences = db.prepare('SELECT * FROM evidences WHERE rights_id = ?').all(req.params.id);
  auditLog(db, req.user.id, req.user.idCard, '查看维权详情', `rights.${req.params.id}`, req);
  res.json(ok({ ...item, evidences }));
});

app.post('/api/rights', authMiddleware, (req, res) => {
  const caseNo = `WQ-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
  const result = db.prepare(`
    INSERT INTO rights_cases (case_no, user_id, title, type, description, status, current_handler, evidence_count)
    VALUES (?, ?, ?, ?, ?, 'pending', '省级维权分派中心', ?)
  `).run(caseNo, req.user.id, req.body.title || '在线维权申请', req.body.type || 'wage', req.body.description || '', Number(req.body.evidenceCount || 0));
  
  auditLog(db, req.user.id, req.user.idCard, '提交维权申请', 'rights.submit', req, `类型: ${req.body.type || 'wage'}, 标题: ${req.body.title || '在线维权申请'}`);
  res.status(201).json(ok({ id: result.lastInsertRowid, caseNo, status: 'pending' }));
});

app.post('/api/rights/:id/upload', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ code: 400, message: '未选择文件' });
  
  const fileBuffer = fs.readFileSync(req.file.path);
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const timestamp = new Date().toISOString();
  const tsHash = crypto.createHash('sha256').update(`${fileHash}-${timestamp}`).digest('hex');
  
  const fileTypeMap = { 'image/jpeg': 'image', 'image/png': 'image', 'video/mp4': 'video', 'audio/mpeg': 'audio', 'application/pdf': 'document' };
  const fileType = fileTypeMap[req.file.mimetype] || 'document';
  
  db.prepare(`
    INSERT INTO evidences (rights_id, file_name, file_type, file_size, file_hash, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, req.file.originalname, fileType, req.file.size, fileHash, timestamp);
  
  db.prepare('UPDATE rights_cases SET evidence_count = evidence_count + 1, updated_at = ? WHERE id = ?').run(timestamp, req.params.id);
  
  auditLog(db, req.user.id, req.user.idCard, '上传维权证据', `rights.upload.${req.params.id}`, req, `文件: ${req.file.originalname}, 类型: ${fileType}, 大小: ${req.file.size}字节`);
  res.json(ok({ id: req.params.id, fileHash, timestampHash: `sha256-${tsHash}`, timestamp, stored: true }));
});

app.post('/api/rights/:id/evidence', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ code: 400, message: '未选择文件' });
  
  const fileBuffer = fs.readFileSync(req.file.path);
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  const timestamp = new Date().toISOString();
  const blockchainHash = `0x${crypto.createHash('sha256').update(`${req.params.id}-${fileHash}-${timestamp}`).digest('hex')}`;
  
  const fileTypeMap = { 'image/jpeg': 'image', 'image/png': 'image', 'video/mp4': 'video', 'audio/mpeg': 'audio', 'application/pdf': 'document' };
  const fileType = fileTypeMap[req.file.mimetype] || 'document';
  
  db.prepare(`
    INSERT INTO evidences (rights_id, file_name, file_type, file_size, file_hash, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(req.params.id, req.file.originalname, fileType, req.file.size, fileHash, timestamp);
  
  db.prepare('UPDATE rights_cases SET evidence_count = evidence_count + 1, updated_at = ? WHERE id = ?').run(timestamp, req.params.id);
  
  auditLog(db, req.user.id, req.user.idCard, '上传维权举证材料', `rights.evidence.${req.params.id}`, req, `文件: ${req.file.originalname}, 哈希: ${fileHash.substring(0, 16)}...`);
  res.json(ok({ 
    id: req.params.id, 
    fileHash, 
    blockchainHash,
    timestamp, 
    fileName: req.file.originalname,
    fileSize: req.file.size,
    fileType,
    stored: true 
  }));
});

app.get('/api/jobs/match', authMiddleware, (req, res) => {
  const userProfile = {
    education: 'bachelor',
    experience: '3-5',
    majors: ['计算机', '软件工程', '数据科学']
  };
  
  const jobs = db.prepare('SELECT * FROM jobs ORDER BY posted_at DESC').all();
  const scored = jobs.map(job => {
    let score = 50;
    if (job.education === userProfile.education) score += 15;
    if (job.experience === userProfile.experience) score += 15;
    const jobMajors = (job.major_tags || '').split(',');
    const matchMajors = jobMajors.filter(m => userProfile.majors.some(um => m.includes(um) || um.includes(m)));
    score += matchMajors.length * 10;
    return { ...job, matchScore: Math.min(score, 99) };
  });
  scored.sort((a, b) => b.matchScore - a.matchScore);
  
  auditLog(db, req.user.id, req.user.idCard, '岗位智能匹配', 'jobs.match', req, `返回 ${scored.length} 个匹配岗位`);
  res.json(ok(scored.slice(0, 10)));
});

app.get('/api/jobs', (req, res) => {
  const keyword = String(req.query.keyword || req.query.q || '').trim();
  const category = String(req.query.category || '').trim();
  const location = String(req.query.location || '').trim();
  const education = String(req.query.education || '').trim();
  const experience = String(req.query.experience || '').trim();
  
  const params = [];
  let sql = 'SELECT * FROM jobs WHERE 1=1';
  
  if (keyword) {
    sql += ' AND (title LIKE ? OR company_name LIKE ? OR description LIKE ? OR job_tags LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  if (location) { sql += ' AND location LIKE ?'; params.push(`%${location}%`); }
  if (education) { sql += ' AND education = ?'; params.push(education); }
  if (experience) { sql += ' AND experience = ?'; params.push(experience); }
  
  sql += ' ORDER BY posted_at DESC';
  const list = db.prepare(sql).all(...params);
  res.json(ok({ list, total: list.length, keyword, filters: { category, location, education, experience } }));
});

app.get('/api/jobs/:id', (req, res) => {
  db.prepare('UPDATE jobs SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id);
  if (!job) return res.status(404).json({ code: 404, message: '岗位不存在' });
  res.json(ok(job));
});

app.post('/api/jobs/:id/apply', authMiddleware, (req, res) => {
  db.prepare(`
    INSERT INTO job_applications (job_id, user_id, status)
    VALUES (?, ?, 'submitted')
  `).run(req.params.id, req.user.id);
  
  auditLog(db, req.user.id, req.user.idCard, '投递简历', `jobs.apply.${req.params.id}`, req);
  res.json(ok({ jobId: req.params.id, status: 'submitted', submittedAt: new Date().toISOString() }));
});

app.get('/api/institutions', (req, res) => {
  const keyword = String(req.query.keyword || '').trim();
  const type = String(req.query.type || '').trim();
  let sql = 'SELECT * FROM institutions WHERE 1=1';
  const params = [];
  
  if (type) { sql += ' AND type = ?'; params.push(type); }
  
  sql += ' ORDER BY name ASC';
  let rows = db.prepare(sql).all(...params);
  
  if (keyword) {
    rows = rows.filter((row) => 
      `${row.name}${row.address}${row.services || ''}`.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  rows = rows.map(r => ({ ...r, services: (r.services || '').split(',') }));
  res.json(ok({ list: rows, total: rows.length }));
});

app.get('/api/institutions/nearby', (req, res) => {
  const lat = parseFloat(req.query.lat) || 25.0389;
  const lng = parseFloat(req.query.lng) || 102.7183;
  
  const rows = db.prepare('SELECT * FROM institutions').all().map(r => {
    const distance = Math.sqrt(Math.pow(r.lat - lat, 2) + Math.pow(r.lng - lng, 2)) * 111;
    return { ...r, distance: Number(distance.toFixed(2)), services: (r.services || '').split(',') };
  }).sort((a, b) => a.distance - b.distance);
  
  res.json(ok(rows));
});

app.get('/api/policies/recommend', (req, res) => {
  const rows = db.prepare('SELECT * FROM policies ORDER BY view_count DESC LIMIT 5').all();
  res.json(ok(rows.map(r => ({ ...r, tags: (r.tags || '').split(',') }))));
});

app.get('/api/policies', (req, res) => {
  const keyword = String(req.query.keyword || '').trim();
  const category = String(req.query.category || '').trim();
  const tag = String(req.query.tag || '').trim();
  
  let sql = 'SELECT * FROM policies WHERE 1=1';
  const params = [];
  
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (tag) { sql += ' AND tags LIKE ?'; params.push(`%${tag}%`); }
  
  sql += ' ORDER BY issue_date DESC';
  let rows = db.prepare(sql).all(...params);
  
  if (keyword) {
    rows = rows.filter((row) => 
      `${row.title}${row.tags || ''}${row.summary || ''}`.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  
  rows = rows.map(r => ({ ...r, tags: (r.tags || '').split(',') }));
  res.json(ok({ list: rows, total: rows.length, filters: { category, tag } }));
});

app.get('/api/policies/:id', (req, res) => {
  db.prepare('UPDATE policies SET view_count = view_count + 1 WHERE id = ?').run(req.params.id);
  const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id);
  if (!policy) return res.status(404).json({ code: 404, message: '政策不存在' });
  
  policy.tags = (policy.tags || '').split(',');
  const related = db.prepare('SELECT * FROM policies WHERE id != ? ORDER BY view_count DESC LIMIT 3').all(req.params.id);
  policy.relatedPolicies = related.map(r => ({ id: r.id, title: r.title }));
  
  res.json(ok(policy));
});

app.get('/api/consult/qa', (req, res) => {
  const category = String(req.query.category || '').trim();
  let sql = 'SELECT * FROM qa WHERE 1=1';
  const params = [];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  sql += ' ORDER BY view_count DESC';
  
  const rows = db.prepare(sql).all(...params).map(r => ({ ...r, tags: (r.tags || '').split(',') }));
  res.json(ok(rows));
});

app.post('/api/consult/ask', (req, res) => {
  const question = (req.body.question || '').trim();
  if (!question) return res.status(400).json({ code: 400, message: '请输入问题' });
  
  const allQA = db.prepare('SELECT * FROM qa').all();
  let bestMatch = null;
  let bestScore = 0;
  
  allQA.forEach(qa => {
    const qWords = question.split(/[，。？！,.\s]+/);
    const matchWords = qWords.filter(w => (qa.question + qa.answer).includes(w));
    const score = matchWords.length / Math.max(qWords.length, 1);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = qa;
    }
  });
  
  let answer = '请通过电子社保卡登录后在服务大厅选择对应事项办理，或拨打12333服务热线咨询。';
  let confidence = 0.6;
  
  if (bestMatch && bestScore > 0.2) {
    answer = bestMatch.answer;
    confidence = Math.min(0.95, 0.6 + bestScore * 0.3);
    db.prepare('UPDATE qa SET view_count = view_count + 1 WHERE id = ?').run(bestMatch.id);
  }
  
  res.json(ok({ question, answer, confidence: Number(confidence.toFixed(2)), matched: bestMatch ? { id: bestMatch.id, question: bestMatch.question } : null }));
});

app.get('/api/admin/dashboard', authMiddleware, adminMiddleware, (req, res) => {
  const stats = {
    users: db.prepare('SELECT COUNT(*) as count FROM users').get().count,
    payments: db.prepare('SELECT COUNT(*) as count FROM insurance_payments').get().count,
    contracts: db.prepare('SELECT COUNT(*) as count FROM labor_contracts').get().count,
    rightsCases: db.prepare('SELECT COUNT(*) as count FROM rights_cases').get().count,
    jobs: db.prepare('SELECT COUNT(*) as count FROM jobs').get().count,
    institutions: db.prepare('SELECT COUNT(*) as count FROM institutions').get().count,
    policies: db.prepare('SELECT COUNT(*) as count FROM policies').get().count,
    qa: db.prepare('SELECT COUNT(*) as count FROM qa').get().count,
    todayLogins: db.prepare("SELECT COUNT(*) as count FROM audit_logs WHERE action = '登录系统' AND DATE(created_at) = DATE('now')").get().count,
    pendingCases: db.prepare("SELECT COUNT(*) as count FROM rights_cases WHERE status = 'pending'").get().count
  };
  
  const trends = [];
  const now = new Date();
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    trends.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      count: 1200 + Math.floor(Math.random() * 500)
    });
  }
  
  auditLog(db, req.user.id, req.user.idCard, '查看管理后台', 'admin.dashboard', req);
  res.json(ok({
    stats,
    alerts: [
      { level: 'warning', title: '2 件维权申请待转办', owner: '劳动监察' },
      { level: 'info', title: '电子社保卡认证接口运行正常', owner: '身份认证' }
    ],
    trends
  }));
});

app.get('/api/admin/supervise', authMiddleware, adminMiddleware, (req, res) => {
  const status = String(req.query.status || '').trim();
  let sql = 'SELECT * FROM supervise_tasks WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ' ORDER BY deadline ASC';
  
  const tasks = db.prepare(sql).all(...params);
  const now = new Date();
  const tasksWithStatus = tasks.map(t => {
    const deadline = new Date(t.deadline);
    const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    let level = 'normal';
    if (t.status === 'completed') level = 'completed';
    else if (daysLeft < 0) level = 'overdue';
    else if (daysLeft <= 3) level = 'warning';
    return { ...t, remainingDays: daysLeft, level };
  });
  
  const overdue = tasksWithStatus.filter(t => t.level === 'overdue').length;
  const warning = tasksWithStatus.filter(t => t.level === 'warning').length;
  
  auditLog(db, req.user.id, req.user.idCard, '查看督办任务', 'admin.supervise', req);
  res.json(ok({ tasks: tasksWithStatus, overdue, warning, total: tasks.length }));
});

app.post('/api/admin/supervise/:id/urge', authMiddleware, adminMiddleware, (req, res) => {
  db.prepare("UPDATE supervise_tasks SET remind_count = remind_count + 1, last_reminded_at = ?, status = 'warning' WHERE id = ?").run(new Date().toISOString(), req.params.id);
  auditLog(db, req.user.id, req.user.idCard, '发送督办催办', `admin.supervise.urge.${req.params.id}`, req);
  res.json(ok({ id: req.params.id, urged: true, urgedAt: new Date().toISOString() }));
});

app.post('/api/admin/supervise/:id/complete', authMiddleware, adminMiddleware, (req, res) => {
  db.prepare("UPDATE supervise_tasks SET status = 'completed', completed_at = ? WHERE id = ?").run(new Date().toISOString(), req.params.id);
  auditLog(db, req.user.id, req.user.idCard, '标记督办完成', `admin.supervise.complete.${req.params.id}`, req);
  res.json(ok({ id: req.params.id, completed: true, completedAt: new Date().toISOString() }));
});

app.post('/api/admin/supervise/:id/handle', authMiddleware, adminMiddleware, (req, res) => {
  const { handleResult, handleRemark, nextStep } = req.body;
  if (!handleResult || !handleRemark) {
    return res.status(400).json({ code: 400, message: '请填写完整处理信息' });
  }
  
  const task = db.prepare('SELECT * FROM supervise_tasks WHERE id = ?').get(req.params.id);
  if (!task) {
    return res.status(404).json({ code: 404, message: '督办任务不存在' });
  }
  if (task.status === 'completed') {
    return res.status(400).json({ code: 400, message: '该任务已完成，无需重复处理' });
  }
  
  const now = new Date().toISOString();
  const statusMap = {
    'completed': 'completed',
    'transferred': 'in_progress',
    'delayed': 'warning',
    'rejected': 'normal',
    'other': 'in_progress'
  };
  
  db.prepare(`
    UPDATE supervise_tasks 
    SET handle_result = ?, handle_remark = ?, next_step = ?, handled_at = ?, handled_by = ?, status = ?
    WHERE id = ?
  `).run(handleResult, handleRemark, nextStep || '', now, req.user.name || '管理员', statusMap[handleResult] || 'in_progress', req.params.id);
  
  db.prepare(`
    INSERT INTO supervise_records (supervise_id, action, action_by, remark, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(req.params.id, handleResult, req.user.name || '管理员', handleRemark, now);
  
  auditLog(db, req.user.id, req.user.idCard, '处理督办任务', `admin.supervise.handle.${req.params.id}`, req, `处理结果: ${handleResult}`);
  res.json(ok({ 
    id: req.params.id, 
    handled: true, 
    handledAt: now,
    handleResult,
    status: statusMap[handleResult] || 'in_progress'
  }));
});

app.get('/api/admin/knowledge/graph', authMiddleware, adminMiddleware, (req, res) => {
  const categories = ['养老保险', '医疗保险', '失业保险', '劳动合同', '劳动维权', '政策咨询'];
  const qaList = db.prepare('SELECT * FROM qa LIMIT 12').all();
  const policies = db.prepare('SELECT * FROM policies LIMIT 6').all();
  
  const nodes = [
    { id: '人社服务', value: 100, category: 'root' },
    ...categories.map((c, i) => ({ id: c, value: 40, category: 'category' })),
    ...qaList.map((q) => ({ id: q.question.substring(0, 10) + '...', value: 15, category: q.category })),
    ...policies.map((p) => ({ id: p.title.substring(0, 10) + '...', value: 20, category: '政策' }))
  ];
  
  const links = [
    ...categories.map((c) => ({ source: '人社服务', target: c, weight: 5 })),
    ...qaList.slice(0, 6).map((q, i) => ({ source: categories[i % 6], target: q.question.substring(0, 10) + '...', weight: 2 })),
    ...policies.map((p, i) => ({ source: categories[i % 6], target: p.title.substring(0, 10) + '...', weight: 3 }))
  ];
  
  auditLog(db, req.user.id, req.user.idCard, '查看知识图谱', 'admin.knowledge.graph', req);
  res.json(ok({ nodes, links }));
});

app.get('/api/admin/knowledge/cluster', authMiddleware, adminMiddleware, (req, res) => {
  const qaList = db.prepare('SELECT * FROM qa').all();
  const clusterMap = {};
  qaList.forEach(qa => {
    const cat = qa.category || '其他';
    if (!clusterMap[cat]) clusterMap[cat] = 0;
    clusterMap[cat] += qa.view_count || 1;
  });
  const clusters = Object.entries(clusterMap).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  
  res.json(ok(clusters));
});

app.get('/api/admin/city', authMiddleware, adminMiddleware, (req, res) => {
  const cities = [
    { code: '5301', city: '昆明', enabled: true, services: 238, onlineRate: '78.2%' },
    { code: '5303', city: '曲靖', enabled: true, services: 215, onlineRate: '78.1%' },
    { code: '5304', city: '玉溪', enabled: true, services: 198, onlineRate: '77.8%' },
    { code: '5305', city: '保山', enabled: true, services: 176, onlineRate: '75.0%' },
    { code: '5306', city: '昭通', enabled: false, services: 182, onlineRate: '70.3%' },
    { code: '5307', city: '丽江', enabled: true, services: 154, onlineRate: '72.7%' },
    { code: '5308', city: '普洱', enabled: true, services: 168, onlineRate: '75.0%' },
    { code: '5309', city: '临沧', enabled: false, services: 142, onlineRate: '69.0%' },
    { code: '5323', city: '楚雄', enabled: true, services: 165, onlineRate: '75.2%' },
    { code: '5325', city: '红河', enabled: true, services: 195, onlineRate: '75.9%' },
    { code: '5326', city: '文山', enabled: true, services: 158, onlineRate: '73.4%' },
    { code: '5328', city: '西双版纳', enabled: true, services: 148, onlineRate: '73.0%' },
    { code: '5329', city: '大理', enabled: true, services: 188, onlineRate: '75.5%' },
    { code: '5331', city: '德宏', enabled: true, services: 145, onlineRate: '73.1%' },
    { code: '5333', city: '怒江', enabled: false, services: 124, onlineRate: '71.0%' },
    { code: '5334', city: '迪庆', enabled: false, services: 118, onlineRate: '69.5%' }
  ];
  
  auditLog(db, req.user.id, req.user.idCard, '查看地市服务接入', 'admin.city', req);
  res.json(ok(cities));
});

app.post('/api/admin/city/config', authMiddleware, adminMiddleware, (req, res) => {
  auditLog(db, req.user.id, req.user.idCard, '更新地市配置', 'admin.city.config', req, `地市: ${req.body.city}, 状态: ${req.body.enabled}`);
  res.json(ok({ saved: true, body: req.body, updatedAt: new Date().toISOString() }));
});

app.get('/api/admin/security/logs', authMiddleware, adminMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 50;
  const offset = (page - 1) * pageSize;
  
  const { count } = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get();
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY id DESC LIMIT ? OFFSET ?').all(pageSize, offset);
  
  auditLog(db, req.user.id, req.user.idCard, '查看安全审计日志', 'admin.security.logs', req);
  res.json(ok({
    list: logs,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize)
  }));
});

app.get('/api/admin/security/audit', authMiddleware, adminMiddleware, (req, res) => {
  const securityStatus = {
    risk: 'low',
    passed: 42,
    warnings: 1,
    backup: 'normal',
    encryptionLevel: 'AES-256',
    dataClassification: '已完成(公开/内部/敏感/绝密)',
    accessControl: 'RBAC+ABAC双模式',
    auditCoverage: '100%',
    backupStatus: '每日增量+每周全量',
    retentionPolicy: '10年(法定)',
    lastSecurityAudit: '2026-02-15',
    nextAuditDate: '2026-05-15'
  };
  
  auditLog(db, req.user.id, req.user.idCard, '查看安全审计报告', 'admin.security.audit', req);
  res.json(ok(securityStatus));
});

app.get('/api/admin/statistics/overview', authMiddleware, adminMiddleware, (req, res) => {
  const dailyVisits = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyVisits.push({
      date: dateStr.substring(5),
      visits: Math.floor(8000 + Math.random() * 4000),
      users: Math.floor(3000 + Math.random() * 2000)
    });
  }
  
  const insuranceStats = [
    { name: '养老保险', count: 2856342, amount: 15680000000 },
    { name: '医疗保险', count: 4523768, amount: 23450000000 },
    { name: '失业保险', count: 1834567, amount: 3560000000 },
    { name: '工伤保险', count: 2156789, amount: 2890000000 },
    { name: '生育保险', count: 1987654, amount: 1560000000 }
  ];
  
  auditLog(db, req.user.id, req.user.idCard, '查看统计概览', 'admin.statistics', req);
  res.json(ok({ dailyVisits, insuranceStats }));
});

app.get('/api/admin/policies', authMiddleware, adminMiddleware, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const offset = (page - 1) * pageSize;
  const keyword = req.query.keyword || '';
  
  let sql = 'SELECT * FROM policies WHERE 1=1';
  const params = [];
  if (keyword) {
    sql += ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
  params.push(pageSize, offset);
  
  const countSql = 'SELECT COUNT(*) as count FROM policies WHERE 1=1' + (keyword ? ' AND (title LIKE ? OR content LIKE ? OR tags LIKE ?)' : '');
  const countParams = keyword ? [`%${keyword}%`, `%${keyword}%`, `%${keyword}%`] : [];
  
  const { count } = db.prepare(countSql).get(...countParams);
  const policies = db.prepare(sql).all(...params);
  
  const policiesWithTags = policies.map(p => ({
    ...p,
    tags: p.tags ? p.tags.split(',').filter(t => t) : []
  }));
  
  auditLog(db, req.user.id, req.user.idCard, '管理后台查看政策列表', 'admin.policies.list', req);
  res.json(ok({
    list: policiesWithTags,
    total: count,
    page,
    pageSize,
    totalPages: Math.ceil(count / pageSize)
  }));
});

app.post('/api/admin/policies/push', authMiddleware, adminMiddleware, (req, res) => {
  const { policyId, tags, pushType, targetUserGroup, scheduledTime } = req.body;
  if (!policyId || !tags || tags.length === 0) {
    return res.status(400).json({ code: 400, message: '请选择政策和推送标签' });
  }
  
  const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(policyId);
  if (!policy) {
    return res.status(404).json({ code: 404, message: '政策不存在' });
  }
  
  const now = new Date().toISOString();
  const pushTagStr = Array.isArray(tags) ? tags.join(',') : tags;
  const pushId = `PUSH-${Date.now()}`;
  
  db.prepare(`
    INSERT INTO policy_push (push_id, policy_id, title, tags, push_type, target_group, scheduled_time, status, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(pushId, policyId, policy.title, pushTagStr, pushType || 'immediate', targetUserGroup || 'all', scheduledTime || now, 'sending', req.user.name || '管理员', now);
  
  const estimateCount = {
    'all': 4856789,
    'pension': 2856342,
    'medical': 4523768,
    'unemployment': 1834567,
    'employment': 1234567,
    'elderly': 1567890
  };
  
  const pushResult = {
    pushId,
    policyId,
    policyTitle: policy.title,
    tags: pushTagStr,
    pushType: pushType || 'immediate',
    scheduledTime: scheduledTime || now,
    createdAt: now,
    status: 'sending',
    estimateCount: estimateCount[targetUserGroup] || estimateCount['all'],
    pushed: false
  };
  
  setTimeout(() => {
    db.prepare("UPDATE policy_push SET status = 'completed', completed_at = ? WHERE push_id = ?").run(new Date().toISOString(), pushId);
  }, 2000);
  
  auditLog(db, req.user.id, req.user.idCard, '推送政策标签', 'admin.policies.push', req, `政策: ${policy.title}, 标签: ${pushTagStr}`);
  res.json(ok(pushResult));
});

app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', path: req.path });
});

const server = app.listen(BACKEND_PORT, HOST, () => {
  log(`Backend listening on http://${HOST}:${BACKEND_PORT}`);
});

function shutdown(signal) {
  log(`Received ${signal}, shutting down`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
