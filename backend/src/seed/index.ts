import 'dotenv/config';
import { initDb, getDb } from '../db';
import { generateDivisions } from './yunnanDivisions';
import { generateMockCompanies, generateMockJobs, generateMockGraduates, generateMockJobFairs, generateMockSchools, generateMockUsers } from './mockData';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('开始初始化数据库...');
  initDb();
  const db = getDb();

  console.log('清空现有数据...');
  const tables = ['users', 'job_school_push', 'rpo_batches', 'schools', 'applications', 'prosperity_indices', 'job_fairs', 'certificates', 'internships', 'graduates', 'jobs', 'companies', 'admin_divisions', 'policies'];
  tables.forEach(table => db.exec(`DELETE FROM ${table}`));

  console.log('生成行政区划数据...');
  const divisions = generateDivisions();
  const insertDivision = db.prepare(`
    INSERT INTO admin_divisions (id, code, name, level, parent_id, full_path, sort_order)
    VALUES (@id, @code, @name, @level, @parent_id, @full_path, @sort_order)
  `);
  const divisionTx = db.transaction(divs => {
    for (const div of divs) insertDivision.run(div);
  });
  divisionTx(divisions);
  console.log(`已插入 ${divisions.length} 条行政区划数据`);

  console.log('生成企业数据...');
  const companies = generateMockCompanies();
  const insertCompany = db.prepare(`
    INSERT INTO companies (
      id, name, unified_social_credit_code, registration_number, labor_filing_number,
      credit_level, industry, industry_zone, admin_division_id, address, legal_representative,
      contact_person, contact_phone, description, employee_count, verified, created_at, updated_at
    ) VALUES (
      @id, @name, @unified_social_credit_code, @registration_number, @labor_filing_number,
      @credit_level, @industry, @industry_zone, @admin_division_id, @address, @legal_representative,
      @contact_person, @contact_phone, @description, @employee_count, @verified, @created_at, @updated_at
    )
  `);
  const companyTx = db.transaction(comps => {
    for (const comp of comps) {
      insertCompany.run({ ...comp, verified: comp.verified ? 1 : 0 });
    }
  });
  companyTx(companies);
  console.log(`已插入 ${companies.length} 条企业数据`);

  console.log('生成岗位数据...');
  const jobs = generateMockJobs(companies.map(c => c.id));
  const insertJob = db.prepare(`
    INSERT INTO jobs (
      id, company_id, title, industry_zone, category, salary_min, salary_max, salary_negotiable,
      location_id, address, description, requirements, benefits, quantity, status, publish_date,
      expiry_date, view_count, application_count, created_at, updated_at
    ) VALUES (
      @id, @company_id, @title, @industry_zone, @category, @salary_min, @salary_max, @salary_negotiable,
      @location_id, @address, @description, @requirements, @benefits, @quantity, @status, @publish_date,
      @expiry_date, @view_count, @application_count, @created_at, @updated_at
    )
  `);
  const jobTx = db.transaction(jobsArr => {
    for (const job of jobsArr) {
      insertJob.run({ ...job, salary_negotiable: job.salary_negotiable ? 1 : 0 });
    }
  });
  jobTx(jobs);
  console.log(`已插入 ${jobs.length} 条岗位数据`);

  console.log('生成毕业生数据...');
  const graduates = generateMockGraduates();
  const insertGraduate = db.prepare(`
    INSERT INTO graduates (
      id, name, id_card, student_id, school, major, education_level, graduation_date,
      phone, email, resume_url, employment_status, employed_company_id, employed_job_id,
      verification_status, admin_division_id, skills, created_at, updated_at
    ) VALUES (
      @id, @name, @id_card, @student_id, @school, @major, @education_level, @graduation_date,
      @phone, @email, @resume_url, @employment_status, @employed_company_id, @employed_job_id,
      @verification_status, @admin_division_id, @skills, @created_at, @updated_at
    )
  `);
  const insertInternship = db.prepare(`
    INSERT INTO internships (id, graduate_id, company_name, position, start_date, end_date, description)
    VALUES (@id, @graduate_id, @company_name, @position, @start_date, @end_date, @description)
  `);
  const insertCertificate = db.prepare(`
    INSERT INTO certificates (id, graduate_id, name, issuer, issue_date, certificate_number)
    VALUES (@id, @graduate_id, @name, @issuer, @issue_date, @certificate_number)
  `);

  const gradTx = db.transaction(grads => {
    for (const grad of grads) {
      insertGraduate.run({ ...grad, skills: JSON.stringify(grad.skills) });
      for (const internship of grad.internships) {
        insertInternship.run({ ...internship, graduate_id: grad.id, id: uuidv4() });
      }
      for (const cert of grad.certificates) {
        insertCertificate.run({ ...cert, graduate_id: grad.id, id: uuidv4() });
      }
    }
  });
  gradTx(graduates);
  console.log(`已插入 ${graduates.length} 条毕业生数据`);

  console.log('生成招聘会数据...');
  const fairs = generateMockJobFairs();
  const insertFair = db.prepare(`
    INSERT INTO job_fairs (
      id, title, admin_division_id, organizer, location, start_time, end_time, status,
      description, max_companies, registered_companies, max_visitors, registered_visitors,
      is_live, live_url, created_at, updated_at
    ) VALUES (
      @id, @title, @admin_division_id, @organizer, @location, @start_time, @end_time, @status,
      @description, @max_companies, @registered_companies, @max_visitors, @registered_visitors,
      @is_live, @live_url, @created_at, @updated_at
    )
  `);
  const fairTx = db.transaction(fairsArr => {
    for (const fair of fairsArr) {
      insertFair.run({ ...fair, is_live: fair.is_live ? 1 : 0 });
    }
  });
  fairTx(fairs);
  console.log(`已插入 ${fairs.length} 条招聘会数据`);

  console.log('生成学校数据...');
  const schools = generateMockSchools();
  const insertSchool = db.prepare(`
    INSERT INTO schools (id, name, admin_division_id, school_type, contact_person, contact_phone, address, majors)
    VALUES (@id, @name, @admin_division_id, @school_type, @contact_person, @contact_phone, @address, @majors)
  `);
  const schoolTx = db.transaction(schoolsArr => {
    for (const school of schoolsArr) {
      insertSchool.run({ ...school, majors: JSON.stringify(school.majors) });
    }
  });
  schoolTx(schools);
  console.log(`已插入 ${schools.length} 条学校数据`);

  console.log('生成用户数据...');
  const users = generateMockUsers(companies.map(c => c.id), schools.map(s => s.id));
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, role, related_id, admin_division_id, created_at)
    VALUES (@id, @username, @password_hash, @role, @related_id, @admin_division_id, @created_at)
  `);
  const userTx = db.transaction(usersArr => {
    for (const user of usersArr) insertUser.run(user);
  });
  userTx(users);
  console.log(`已插入 ${users.length} 条用户数据`);

  console.log('生成政策数据...');
  const policies = [
    { title: '云南省高校毕业生就业创业补贴政策', type: 'subsidy', target: '毕业生', code: '530000' },
    { title: '云南省企业吸纳毕业生就业补贴', type: 'subsidy', target: '企业', code: '530000' },
    { title: '云南省青年见习计划实施办法', type: 'training', target: '毕业生', code: '530000' },
    { title: '昆明市高校毕业生租房补贴实施细则', type: 'subsidy', target: '毕业生', code: '530100' },
    { title: '曲靖市制造业企业用工补贴政策', type: 'subsidy', target: '企业', code: '530300' },
  ];
  const insertPolicy = db.prepare(`
    INSERT INTO policies (id, title, content, policy_type, target_group, admin_division_id, publish_date, created_by, created_at)
    VALUES (@id, @title, @content, @policy_type, @target_group, @admin_division_id, @publish_date, @created_by, @created_at)
  `);
  const provinceId = divisions.find(d => d.code === '530000')?.id || '';
  for (const policy of policies) {
    insertPolicy.run({
      id: uuidv4(),
      title: policy.title,
      content: `${policy.title}的详细内容，包含申请条件、补贴标准、办理流程等信息。`,
      policy_type: policy.type,
      target_group: policy.target,
      admin_division_id: divisions.find(d => d.code === policy.code)?.id || provinceId,
      publish_date: new Date().toISOString(),
      created_by: users[0].id,
      created_at: new Date().toISOString(),
    });
  }
  console.log(`已插入 ${policies.length} 条政策数据`);

  console.log('数据库初始化完成！');
  console.log('\n默认账号：');
  console.log('省级管理员: admin / admin123');
  console.log('企业用户: company1 / admin123');
  console.log('高校用户: school1 / admin123');
  console.log('政府用户: gov_yunnan / admin123');
}

seed().catch(console.error);
