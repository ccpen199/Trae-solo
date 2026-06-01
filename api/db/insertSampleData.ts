import db from './init.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const adminEmail = 'admin@flexwork.com';
const employerEmail = 'employer@company.com';
const seekerEmail = 'worker@example.com';
const password = '123456';
const hashedPassword = bcrypt.hashSync(password, 10);

const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

if (!existingAdmin) {
  const adminId = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, name, status)
    VALUES (?, ?, ?, 'admin', '平台管理员', 'active')
  `).run(adminId, adminEmail, hashedPassword);
  console.log('✓ 创建管理员账号: admin@flexwork.com / 123456');
} else {
  console.log('ℹ 管理员账号已存在');
}

const existingEmployer = db.prepare('SELECT id FROM users WHERE email = ?').get(employerEmail);
let employerId: string | null = null;

if (!existingEmployer) {
  const employerUserId = uuidv4();
  employerId = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, name, status)
    VALUES (?, ?, ?, 'employer', '测试企业', 'active')
  `).run(employerUserId, employerEmail, hashedPassword);

  db.prepare(`
    INSERT INTO employers (id, user_id, company_name, contact_name, contact_phone)
    VALUES (?, ?, '灵活用工科技公司', '李经理', '13800138000')
  `).run(employerId, employerUserId);

  const sampleJobs = [
    {
      title: '周末活动现场执行',
      description: '负责活动现场的执行工作，包括场地布置、嘉宾引导等。要求工作认真负责，有良好的沟通能力。',
      job_type: 'daily',
      salary_amount: 200,
      location_address: '上海市浦东新区世纪大道100号',
      location_lat: 31.2304,
      location_lng: 121.4737,
      required_skills: 's10,s6'
    },
    {
      title: '数据录入专员',
      description: '负责公司业务数据的录入和整理工作，要求熟练使用Excel，细心认真。',
      job_type: 'remote',
      salary_amount: 5000,
      location_address: '远程办公',
      required_skills: 's15'
    },
    {
      title: '电商运营助理',
      description: '协助电商平台的日常运营工作，包括商品上架、客服接待等。有电商经验优先。',
      job_type: 'weekly',
      salary_amount: 3000,
      location_address: '杭州市余杭区文一西路',
      location_lat: 30.2741,
      location_lng: 120.1551,
      required_skills: 's6,s7'
    },
    {
      title: 'UI设计项目',
      description: '负责产品的UI界面设计，要求有独立设计能力，熟练使用Figma或Sketch。',
      job_type: 'project',
      salary_amount: 8000,
      location_address: '北京市朝阳区望京',
      location_lat: 39.9847,
      location_lng: 116.4754,
      required_skills: 's12'
    },
    {
      title: '展会协助人员',
      description: '展会现场协助工作，包括接待、资料派发等。形象良好，沟通能力强。',
      job_type: 'daily',
      salary_amount: 280,
      location_address: '广州市海珠区琶洲会展中心',
      location_lat: 23.1065,
      location_lng: 113.3949,
      required_skills: 's10,s7'
    },
    {
      title: '文案策划兼职',
      description: '负责品牌文案和推广文案的撰写，要求有文案功底，有创意。',
      job_type: 'remote',
      salary_amount: 3500,
      location_address: '远程办公',
      required_skills: 's11'
    }
  ];

  sampleJobs.forEach((job) => {
    const jobId = uuidv4();
    db.prepare(`
      INSERT INTO jobs (id, employer_id, title, description, job_type, salary_amount, 
        location_address, location_lat, location_lng, required_skills, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `).run(
      jobId,
      employerId,
      job.title,
      job.description,
      job.job_type,
      job.salary_amount,
      job.location_address,
      job.location_lat,
      job.location_lng,
      job.required_skills
    );
  });

  console.log('✓ 创建雇主账号: employer@company.com / 123456');
  console.log('✓ 创建6个测试岗位');
} else {
  console.log('ℹ 雇主账号已存在');
}

const existingSeeker = db.prepare('SELECT id FROM users WHERE email = ?').get(seekerEmail);

if (!existingSeeker) {
  const seekerUserId = uuidv4();
  const jobSeekerId = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, password_hash, role, name, status)
    VALUES (?, ?, ?, 'job_seeker', '张小明', 'active')
  `).run(seekerUserId, seekerEmail, hashedPassword);

  db.prepare(`
    INSERT INTO job_seekers (id, user_id, phone, credit_score, bio, location_address)
    VALUES (?, ?, '13900139000', 85, '认真负责，有多年灵活用工经验', '上海市浦东新区')
  `).run(jobSeekerId, seekerUserId);

  const skillIds = ['s1', 's6', 's7', 's10', 's15'];
  skillIds.forEach((skillId) => {
    db.prepare(`
      INSERT INTO job_seeker_skills (job_seeker_id, skill_id, proficiency_level)
      VALUES (?, ?, 4)
    `).run(jobSeekerId, skillId);
  });

  console.log('✓ 创建求职者账号: worker@example.com / 123456');
} else {
  console.log('ℹ 求职者账号已存在');
}

console.log('');
console.log('========================================');
console.log('测试数据初始化完成!');
console.log('========================================');
