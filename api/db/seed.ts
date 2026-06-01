import db from './init.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export function seedDatabase() {
  const adminEmail = 'admin@flexwork.com';
  const employerEmail = 'employer@company.com';
  const seekerEmail = 'worker@example.com';
  const password = '123456';
  const hashedPassword = bcrypt.hashSync(password, 10);

  const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);

  if (!existingAdmin) {
    const adminId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, password, role, name, status)
      VALUES (?, ?, ?, 'admin', '平台管理员', 'active')
    `).run(adminId, adminEmail, hashedPassword);
    console.log('✓ 创建管理员账号: admin@flexwork.com / 123456');
  }

  const existingEmployer = db.prepare('SELECT id FROM users WHERE email = ?').get(employerEmail);

  if (!existingEmployer) {
    const employerId = uuidv4();
    const employerUserId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, password, role, name, status)
      VALUES (?, ?, ?, 'employer', '测试企业', 'active')
    `).run(employerUserId, employerEmail, hashedPassword);

    db.prepare(`
      INSERT INTO employers (id, user_id, company_name, contact_name, contact_phone)
      VALUES (?, ?, '灵活用工科技公司', '李经理', '13800138000')
    `).run(employerId, employerUserId);

    const sampleJobs = [
      {
        title: '周末活动现场执行',
        description: '负责活动现场的执行工作，包括场地布置、嘉宾引导等',
        job_type: 'daily',
        salary_amount: 200,
        location_address: '上海市浦东新区世纪大道100号',
        required_skills: '活动执行,现场协调,客户服务'
      },
      {
        title: '数据录入专员',
        description: '负责公司业务数据的录入和整理工作',
        job_type: 'remote',
        salary_amount: 5000,
        location_address: '远程办公',
        required_skills: 'Excel,数据录入,办公软件'
      },
      {
        title: '电商运营助理',
        description: '协助电商平台的日常运营工作',
        job_type: 'weekly',
        salary_amount: 3000,
        location_address: '杭州市余杭区文一西路',
        required_skills: '电商运营,客服,商品上架'
      },
      {
        title: 'UI设计项目',
        description: '负责产品的UI界面设计',
        job_type: 'project',
        salary_amount: 8000,
        location_address: '北京市朝阳区望京',
        required_skills: 'UI设计,Figma,用户体验'
      }
    ];

    sampleJobs.forEach((job) => {
      const jobId = uuidv4();
      db.prepare(`
        INSERT INTO jobs (id, employer_id, title, description, job_type, salary_amount, location_address, required_skills, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
      `).run(
        jobId,
        employerId,
        job.title,
        job.description,
        job.job_type,
        job.salary_amount,
        job.location_address,
        job.required_skills
      );
    });

    console.log('✓ 创建雇主账号: employer@company.com / 123456');
    console.log('✓ 创建4个测试岗位');
  }

  const existingSeeker = db.prepare('SELECT id FROM users WHERE email = ?').get(seekerEmail);

  if (!existingSeeker) {
    const seekerId = uuidv4();
    const jobSeekerId = uuidv4();
    db.prepare(`
      INSERT INTO users (id, email, password, role, name, status)
      VALUES (?, ?, ?, 'job_seeker', '张小明', 'active')
    `).run(seekerId, seekerEmail, hashedPassword);

    db.prepare(`
      INSERT INTO job_seekers (id, user_id, phone, credit_score)
      VALUES (?, ?, '13900139000', 85)
    `).run(jobSeekerId, seekerId);

    const skills = db.prepare('SELECT id FROM skills LIMIT 5').all();
    skills.forEach((skill: any) => {
      db.prepare(`
        INSERT INTO job_seeker_skills (job_seeker_id, skill_id, proficiency_level)
        VALUES (?, ?, 4)
      `).run(jobSeekerId, skill.id);
    });

    console.log('✓ 创建求职者账号: worker@example.com / 123456');
  }

  console.log('');
  console.log('========================================');
  console.log('测试数据初始化完成!');
  console.log('========================================');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}
