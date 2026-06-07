const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'data', 'app.sqlite');
const db = new Database(dbPath);

const stats = {
  users: 0,
  workerProfiles: 0,
  certifications: 0,
  skillAssessments: 0,
  projects: 0,
  jobPostings: 0,
  contracts: 0,
  attendance: 0,
  payrolls: 0,
  socialSecurity: 0,
  biometricDeletionLogs: 0,
  auditLogs: 0
};

function getExistingUserId(username) {
  const row = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  return row ? row.id : null;
}

function getExistingEnterpriseId(username) {
  const row = db.prepare('SELECT id FROM users WHERE username = ? AND role = ?').get(username, 'enterprise');
  return row ? row.id : null;
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatDateTime(date) {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const seedData = db.transaction(() => {
  console.log('=== 开始数据填充 ===\n');

  const enterpriseId = getExistingEnterpriseId('enterprise01');
  if (!enterpriseId) {
    console.error('错误：未找到 enterprise01 用户，请先初始化数据库');
    return;
  }
  console.log(`使用企业用户 ID: ${enterpriseId}\n`);

  const adminId = getExistingUserId('admin');
  if (!adminId) {
    console.error('错误：未找到 admin 用户');
    return;
  }
  console.log(`使用管理员用户 ID: ${adminId}\n`);

  const workerPassword = bcrypt.hashSync('worker123', 10);

  const workers = [
    { username: 'worker02', realName: '李四', phone: '13900139002', idCard: '110101199002020002', gender: '男', birthDate: '1990-02-15', workYears: 3, skillLevel: 2 },
    { username: 'worker03', realName: '王五', phone: '13900139003', idCard: '110101198903030003', gender: '男', birthDate: '1989-03-20', workYears: 8, skillLevel: 5 },
    { username: 'worker04', realName: '赵六', phone: '13900139004', idCard: '110101199104040004', gender: '男', birthDate: '1991-04-10', workYears: 2, skillLevel: 1 },
    { username: 'worker05', realName: '钱七', phone: '13900139005', idCard: '110101198805050005', gender: '男', birthDate: '1988-05-25', workYears: 10, skillLevel: 4 },
    { username: 'worker06', realName: '孙八', phone: '13900139006', idCard: '110101199206060006', gender: '男', birthDate: '1992-06-15', workYears: 1, skillLevel: 1 },
    { username: 'worker07', realName: '周九', phone: '13900139007', idCard: '110101199007070007', gender: '男', birthDate: '1990-07-30', workYears: 5, skillLevel: 3 },
    { username: 'worker08', realName: '吴十', phone: '13900139008', idCard: '110101198708080008', gender: '男', birthDate: '1987-08-08', workYears: 12, skillLevel: 5 },
    { username: 'worker09', realName: '郑十一', phone: '13900139009', idCard: '110101199109090009', gender: '男', birthDate: '1991-09-18', workYears: 4, skillLevel: 2 }
  ];

  const workerIds = [];
  const insertUser = db.prepare('INSERT OR IGNORE INTO users (username, password, role, real_name, phone, id_card, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const insertWorkerProfile = db.prepare('INSERT OR IGNORE INTO worker_profiles (user_id, gender, birth_date, education, work_years, skill_level, has_biometric_data, biometric_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  for (const worker of workers) {
    const existingId = getExistingUserId(worker.username);
    if (existingId) {
      console.log(`用户 ${worker.username} 已存在，跳过`);
      workerIds.push({ username: worker.username, id: existingId, skillLevel: worker.skillLevel });
      continue;
    }

    const result = insertUser.run(worker.username, workerPassword, 'worker', worker.realName, worker.phone, worker.idCard, 'active');
    if (result.changes > 0) {
      const userId = result.lastInsertRowid;
      insertWorkerProfile.run(userId, worker.gender, worker.birthDate, '高中', worker.workYears, worker.skillLevel, 1, 0);
      workerIds.push({ username: worker.username, id: userId, skillLevel: worker.skillLevel });
      stats.users++;
      stats.workerProfiles++;
      console.log(`已创建用户: ${worker.username} (${worker.realName})`);
    }
  }

  const existingWorker01 = getExistingUserId('worker01');
  if (existingWorker01) {
    const wp = db.prepare('SELECT skill_level FROM worker_profiles WHERE user_id = ?').get(existingWorker01);
    workerIds.unshift({ username: 'worker01', id: existingWorker01, skillLevel: wp ? wp.skill_level : 1 });
    
    db.prepare('UPDATE worker_profiles SET has_biometric_data = 1, biometric_deleted = 0 WHERE user_id = ?').run(existingWorker01);
    console.log('已更新 worker01 的生物特征状态');
  }

  console.log(`\n=== 工人用户创建完成，共 ${stats.users} 个新用户 ===\n`);

  const certificationTypes = [
    { type: '焊工证', count: 6, tradeIds: [1, 1, 1, 1, 1, 1] },
    { type: '塔吊操作证', count: 3, tradeIds: [4, 4, 4] },
    { type: '电工证', count: 2, tradeIds: [2, 2] },
    { type: '架子工证', count: 1, tradeIds: [3] }
  ];

  const certificateNumbers = [
    'HA202001001', 'HA202002002', 'HA202003003', 'HA202004004', 'HA202005005', 'HA202006006',
    'TD202001001', 'TD202002002', 'TD202003003',
    'DG202001001', 'DG202002002',
    'JZ202001001'
  ];

  const verificationStatuses = ['verified', 'verified', 'verified', 'verified', 'verified', 'verified', 'verified', 'verified', 'pending', 'pending', 'pending', 'rejected'];

  const insertCert = db.prepare(`
    INSERT INTO trade_certifications 
    (worker_id, trade_id, certificate_number, certificate_type, certificate_image, ocr_result, ocr_confidence, verification_source, verification_status, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'government_simulation', ?, CURRENT_TIMESTAMP)
  `);

  let certIndex = 0;
  let workerCertIndex = 0;

  for (const certType of certificationTypes) {
    for (let i = 0; i < certType.count; i++) {
      const workerIndex = workerCertIndex % workerIds.length;
      const worker = workerIds[workerIndex];
      
      const existing = db.prepare(`
        SELECT id FROM trade_certifications 
        WHERE worker_id = ? AND certificate_number = ?
      `).get(worker.id, certificateNumbers[certIndex]);

      if (!existing) {
        const ocrResult = JSON.stringify({
          certificateType: certType.type,
          certificateNumber: certificateNumbers[certIndex],
          holderName: worker.username,
          issueDate: '2020-01-01',
          expiryDate: '2026-12-31',
          issuingAuthority: '住房和城乡建设部'
        });

        const verificationResult = JSON.stringify({
          verified: verificationStatuses[certIndex] === 'verified',
          verificationCode: 'VER' + Date.now(),
          source: '全国建筑工人管理服务信息平台'
        });

        insertCert.run(
          worker.id,
          certType.tradeIds[i],
          certificateNumbers[certIndex],
          certType.type,
          `/uploads/certificates/${certificateNumbers[certIndex]}.jpg`,
          ocrResult + '|' + verificationResult,
          0.95,
          verificationStatuses[certIndex]
        );
        stats.certifications++;
        console.log(`已创建认证: ${certType.type} - ${certificateNumbers[certIndex]} (${worker.username}) - ${verificationStatuses[certIndex]}`);
      } else {
        console.log(`认证 ${certificateNumbers[certIndex]} 已存在，跳过`);
      }

      certIndex++;
      workerCertIndex++;
    }
  }

  console.log(`\n=== 工种认证创建完成，共 ${stats.certifications} 条新记录 ===\n`);

  const insertAssessment = db.prepare(`
    INSERT INTO skill_assessments 
    (worker_id, trade_id, theory_score, theory_passed, practical_video_url, practical_score, practical_passed, overall_level, assessment_status, assessed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  const assessmentStatuses = ['passed', 'passed', 'passed', 'passed', 'passed', 'passed', 'passed', 'failed'];

  for (let i = 0; i < workerIds.length; i++) {
    const worker = workerIds[i];
    const tradeId = (i % 5) + 1;

    const existing = db.prepare(`
      SELECT id FROM skill_assessments 
      WHERE worker_id = ? AND trade_id = ?
    `).get(worker.id, tradeId);

    if (!existing) {
      const passed = assessmentStatuses[i] === 'passed';
      const theoryScore = passed ? randomInt(60, 100) : randomInt(40, 59);
      const practicalScore = passed ? randomInt(60, 100) : randomInt(40, 59);
      const overallLevel = passed ? worker.skillLevel : 0;
      const status = passed ? 'completed' : 'failed';

      insertAssessment.run(
        worker.id,
        tradeId,
        theoryScore,
        passed ? 1 : 0,
        `/uploads/practical/${worker.username}_${Date.now()}.mp4`,
        practicalScore,
        passed ? 1 : 0,
        overallLevel,
        status
      );
      stats.skillAssessments++;
      console.log(`已创建技能评定: ${worker.username} - 理论${theoryScore}分 实操${practicalScore}分 - ${status}`);
    } else {
      console.log(`技能评定 ${worker.username} 已存在，跳过`);
    }
  }

  console.log(`\n=== 技能评定创建完成，共 ${stats.skillAssessments} 条新记录 ===\n`);

  const projects = [
    {
      name: 'XX花园一期',
      code: 'PROJ2024001',
      type: '住宅项目',
      address: '北京市朝阳区青年路1号',
      lat: 39.9388,
      lng: 116.4988,
      radius: 300,
      budget: 50000000,
      status: 'under_construction',
      startDate: '2024-01-01',
      endDate: '2025-12-31'
    },
    {
      name: 'XX商业中心',
      code: 'PROJ2024002',
      type: '商业项目',
      address: '北京市海淀区中关村大街1号',
      lat: 39.9847,
      lng: 116.3046,
      radius: 250,
      budget: 80000000,
      status: 'started',
      startDate: '2024-03-01',
      endDate: '2026-06-30'
    },
    {
      name: 'XX产业园标准厂房',
      code: 'PROJ2024003',
      type: '工业项目',
      address: '北京市大兴区经济开发区1号',
      lat: 39.7333,
      lng: 116.3333,
      radius: 400,
      budget: 30000000,
      status: 'approved',
      startDate: '2024-06-01',
      endDate: '2025-12-31'
    },
    {
      name: 'XX大桥重建工程',
      code: 'PROJ2024004',
      type: '市政工程',
      address: '北京市丰台区卢沟桥',
      lat: 39.8522,
      lng: 116.2147,
      radius: 350,
      budget: 120000000,
      status: 'completed',
      startDate: '2023-01-01',
      endDate: '2024-12-31',
      actualStart: '2023-01-15',
      actualEnd: '2024-11-30'
    },
    {
      name: 'XX地铁5号线',
      code: 'PROJ2024005',
      type: '交通工程',
      address: '北京市东城区东单',
      lat: 39.9139,
      lng: 116.4258,
      radius: 500,
      budget: 200000000,
      status: 'under_construction',
      startDate: '2023-06-01',
      endDate: '2026-12-31'
    }
  ];

  const insertProject = db.prepare(`
    INSERT INTO construction_projects 
    (enterprise_id, project_name, project_code, project_type, project_address, geofence_lat, geofence_lng, geofence_radius, budget, status, start_date, end_date, actual_start_date, actual_end_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const projectIds = [];

  for (const project of projects) {
    const existing = db.prepare('SELECT id FROM construction_projects WHERE project_code = ?').get(project.code);
    if (existing) {
      console.log(`项目 ${project.code} 已存在，跳过`);
      projectIds.push({ code: project.code, id: existing.id, lat: project.lat, lng: project.lng, radius: project.radius });
      continue;
    }

    const result = insertProject.run(
      enterpriseId,
      project.name,
      project.code,
      project.type,
      project.address,
      project.lat,
      project.lng,
      project.radius,
      project.budget,
      project.status,
      project.startDate,
      project.endDate,
      project.actualStart || null,
      project.actualEnd || null
    );
    projectIds.push({ code: project.code, id: result.lastInsertRowid, lat: project.lat, lng: project.lng, radius: project.radius });
    stats.projects++;
    console.log(`已创建项目: ${project.name} (${project.code}) - ${project.status}`);
  }

  console.log(`\n=== 工程项目创建完成，共 ${stats.projects} 个新项目 ===\n`);

  const jobTitles = [
    { title: '高级焊工', tradeId: 1, salaryType: 'daily', salaryMin: 350, salaryMax: 500 },
    { title: '电工班长', tradeId: 2, salaryType: 'monthly', salaryMin: 12000, salaryMax: 18000 },
    { title: '架子工', tradeId: 3, salaryType: 'daily', salaryMin: 300, salaryMax: 450 },
    { title: '塔吊司机', tradeId: 4, salaryType: 'monthly', salaryMin: 10000, salaryMax: 15000 },
    { title: '钢筋工', tradeId: 7, salaryType: 'piece', salaryMin: 280, salaryMax: 400 },
    { title: '混凝土工', tradeId: 8, salaryType: 'daily', salaryMin: 260, salaryMax: 380 },
    { title: '模板工', tradeId: 9, salaryType: 'daily', salaryMin: 300, salaryMax: 450 },
    { title: '砌筑工', tradeId: 10, salaryType: 'piece', salaryMin: 280, salaryMax: 420 },
    { title: '防水工', tradeId: 12, salaryType: 'daily', salaryMin: 320, salaryMax: 480 },
    { title: '水暖工', tradeId: 13, salaryType: 'monthly', salaryMin: 9000, salaryMax: 14000 }
  ];

  const insertJob = db.prepare(`
    INSERT INTO job_postings 
    (enterprise_id, trade_id, project_id, title, salary_type, salary_min, salary_max, work_location, includes_board, includes_lodging, people_needed, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 5, 'active')
  `);

  const jobIds = [];

  for (let i = 0; i < jobTitles.length; i++) {
    const job = jobTitles[i];
    const projectIndex = i % projectIds.length;
    const project = projectIds[projectIndex];

    const existing = db.prepare(`
      SELECT id FROM job_postings 
      WHERE enterprise_id = ? AND title = ? AND project_id = ?
    `).get(enterpriseId, job.title, project.id);

    if (existing) {
      console.log(`岗位 ${job.title} 已存在，跳过`);
      jobIds.push({ id: existing.id, title: job.title });
      continue;
    }

    const result = insertJob.run(
      enterpriseId,
      job.tradeId,
      project.id,
      job.title,
      job.salaryType,
      job.salaryMin,
      job.salaryMax,
      `项目现场 - ${project.code}`
    );
    jobIds.push({ id: result.lastInsertRowid, title: job.title });
    stats.jobPostings++;
    console.log(`已创建岗位: ${job.title} (${project.code})`);
  }

  console.log(`\n=== 岗位发布创建完成，共 ${stats.jobPostings} 个新岗位 ===\n`);

  const contractStatuses = ['signed', 'signed', 'signed', 'signed', 'signed', 'signed', 'signed', 'signed', 'draft', 'draft'];

  const insertContract = db.prepare(`
    INSERT INTO labor_contracts 
    (worker_id, enterprise_id, job_posting_id, project_id, contract_no, contract_type, start_date, end_date, salary_amount, salary_type, status, worker_signed, enterprise_signed, worker_signed_at, enterprise_signed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const contractIds = [];

  for (let i = 0; i < 10; i++) {
    const workerIndex = i % workerIds.length;
    const worker = workerIds[workerIndex];
    const jobIndex = i % jobIds.length;
    const job = jobIds[jobIndex];
    const projectIndex = i % projectIds.length;
    const project = projectIds[projectIndex];

    const jobDetail = db.prepare('SELECT salary_type, salary_min FROM job_postings WHERE id = ?').get(job.id);
    const salaryType = jobDetail ? jobDetail.salary_type : 'daily';
    const salaryAmount = jobDetail ? jobDetail.salary_min : 300;

    const existing = db.prepare(`
      SELECT id FROM labor_contracts 
      WHERE worker_id = ? AND job_posting_id = ?
    `).get(worker.id, job.id);

    if (existing) {
      console.log(`合同 ${worker.username} - ${job.title} 已存在，跳过`);
      contractIds.push({ id: existing.id, workerId: worker.id, projectId: project.id });
      continue;
    }

    const status = contractStatuses[i];
    const contractNo = `CONTRACT_20240101_${String(i + 1).padStart(4, '0')}`;
    const workerSigned = status === 'signed' ? 1 : 0;
    const enterpriseSigned = status === 'signed' ? 1 : 0;

    const result = insertContract.run(
      worker.id,
      enterpriseId,
      job.id,
      project.id,
      contractNo,
      '固定期限',
      '2024-01-01',
      '2025-12-31',
      salaryAmount,
      salaryType,
      status,
      workerSigned,
      enterpriseSigned
    );
    contractIds.push({ id: result.lastInsertRowid, workerId: worker.id, projectId: project.id });
    stats.contracts++;
    console.log(`已创建合同: ${worker.username} - ${job.title} - ${status}`);
  }

  console.log(`\n=== 劳务合同创建完成，共 ${stats.contracts} 份新合同 ===\n`);

  const insertAttendance = db.prepare(`
    INSERT INTO attendance_records 
    (worker_id, project_id, contract_id, check_in_time, check_in_lat, check_in_lng, check_in_face_verified, check_in_geofence_verified, check_out_time, check_out_lat, check_out_lng, work_hours, status)
    VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?, ?)
  `);

  const today = new Date();

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const currentDate = new Date(today);
    currentDate.setDate(currentDate.getDate() - dayOffset);
    const dateStr = formatDate(currentDate);

    const numWorkers = randomInt(5, 8);
    const shuffledWorkers = [...contractIds].sort(() => Math.random() - 0.5).slice(0, numWorkers);

    for (let j = 0; j < shuffledWorkers.length; j++) {
      const contract = shuffledWorkers[j];
      const project = projectIds.find(p => p.id === contract.projectId);

      const existing = db.prepare(`
        SELECT id FROM attendance_records 
        WHERE worker_id = ? AND project_id = ? AND DATE(check_in_time) = ?
      `).get(contract.workerId, contract.projectId, dateStr);

      if (existing) {
        continue;
      }

      const checkInHour = randomInt(7, 9);
      const checkInMinute = randomInt(0, 59);
      const checkOutHour = randomInt(17, 19);
      const checkOutMinute = randomInt(0, 59);

      const checkInTime = new Date(currentDate);
      checkInTime.setHours(checkInHour, checkInMinute, 0, 0);

      const checkOutTime = new Date(currentDate);
      checkOutTime.setHours(checkOutHour, checkOutMinute, 0, 0);

      const workHours = Math.round(((checkOutTime - checkInTime) / (1000 * 60 * 60)) * 100) / 100;

      let status = 'normal';
      if (checkInHour > 9 || (checkInHour === 9 && checkInMinute > 30)) {
        status = 'late';
      } else if (workHours < 8 && checkOutHour < 18) {
        status = 'early_leave';
      } else if (workHours > 10) {
        status = 'overtime';
      }

      const latOffset = (Math.random() - 0.5) * 0.002;
      const lngOffset = (Math.random() - 0.5) * 0.002;

      insertAttendance.run(
        contract.workerId,
        contract.projectId,
        contract.id,
        formatDateTime(checkInTime),
        project ? project.lat + latOffset : 39.9,
        project ? project.lng + lngOffset : 116.4,
        formatDateTime(checkOutTime),
        project ? project.lat + latOffset + 0.0005 : 39.9,
        project ? project.lng + lngOffset + 0.0005 : 116.4,
        workHours,
        status
      );
      stats.attendance++;
    }

    if (dayOffset % 5 === 0) {
      console.log(`已处理 ${dateStr} 的考勤记录...`);
    }
  }

  console.log(`\n=== 考勤记录创建完成，共 ${stats.attendance} 条新记录 ===\n`);

  const insertPayroll = db.prepare(`
    INSERT INTO payrolls 
    (worker_id, enterprise_id, contract_id, project_id, period_year, period_month, base_salary, overtime_pay, bonus, deductions, social_security, net_salary, bank_transfer_status, bank_transfer_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transferStatuses = ['completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'completed', 'pending', 'pending', 'pending'];

  let payrollIndex = 0;

  for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
    const payrollDate = new Date(today);
    payrollDate.setMonth(payrollDate.getMonth() - monthOffset);
    const year = payrollDate.getFullYear();
    const month = payrollDate.getMonth() + 1;

    const monthWorkers = workerIds.slice(0, 5);

    for (let j = 0; j < monthWorkers.length; j++) {
      const worker = monthWorkers[j];
      const contract = contractIds.find(c => c.workerId === worker.id);

      if (!contract) continue;

      const existing = db.prepare(`
        SELECT id FROM payrolls 
        WHERE worker_id = ? AND period_year = ? AND period_month = ?
      `).get(worker.id, year, month);

      if (existing) {
        console.log(`工资条 ${worker.username} ${year}-${month} 已存在，跳过`);
        payrollIndex++;
        continue;
      }

      const baseSalary = randomInt(8000, 15000);
      const overtimePay = randomInt(500, 3000);
      const bonus = randomInt(0, 2000);
      const deductions = randomInt(100, 500);
      const socialSecurity = Math.round(baseSalary * 0.08);
      const netSalary = baseSalary + overtimePay + bonus - deductions - socialSecurity;

      const transferStatus = transferStatuses[payrollIndex % transferStatuses.length];
      const transferId = transferStatus === 'completed' ? `BANK${Date.now()}${j}` : null;

      insertPayroll.run(
        worker.id,
        enterpriseId,
        contract.id,
        contract.projectId,
        year,
        month,
        baseSalary,
        overtimePay,
        bonus,
        deductions,
        socialSecurity,
        netSalary,
        transferStatus,
        transferId
      );
      stats.payrolls++;
      console.log(`已创建工资条: ${worker.username} ${year}-${month} - ¥${netSalary} - ${transferStatus}`);
      payrollIndex++;
    }
  }

  console.log(`\n=== 工资条创建完成，共 ${stats.payrolls} 条新记录 ===\n`);

  const insertSocialSecurity = db.prepare(`
    INSERT INTO social_security_records 
    (worker_id, enterprise_id, project_id, insurance_type, insurance_month, 
     base_amount, personal_amount, enterprise_amount, payment_amount, payment_status,
     payment_due_date, disposal_status, disposal_action, remedial_deadline,
     is_reported, reported_at, reviewed_by, disposal_result, disposal_note)
    VALUES (?, ?, ?, '五险', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const ssStatuses = ['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'unpaid', 'unpaid', 'unpaid', 'unpaid', 'overdue', 'overdue'];
  const disposalStatuses = ['pending', 'notified', 'deadline_set', 'reported', 'completed'];
  const disposalActions = [null, 'notify_enterprise', 'set_deadline', 'report_regulator', 'completed'];
  const disposalResults = [null, '企业已补缴', '已上报监管部门', '已完成处置', '无需处理'];

  let ssIndex = 0;

  for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
    const ssDate = new Date(today);
    ssDate.setMonth(ssDate.getMonth() - monthOffset);
    const monthStr = `${ssDate.getFullYear()}-${String(ssDate.getMonth() + 1).padStart(2, '0')}`;

    for (let j = 0; j < workerIds.length; j++) {
      const worker = workerIds[j];
      const contract = contractIds.find(c => c.workerId === worker.id);

      if (!contract) continue;

      const existing = db.prepare(`
        SELECT id FROM social_security_records 
        WHERE worker_id = ? AND insurance_month = ?
      `).get(worker.id, monthStr);

      if (existing) {
        ssIndex++;
        continue;
      }

      const paymentAmount = randomInt(1200, 2500);
      const baseAmount = randomInt(4000, 8000);
      const personalAmount = Math.round(baseAmount * 0.08);
      const enterpriseAmount = Math.round(baseAmount * 0.16);
      const status = ssStatuses[ssIndex % ssStatuses.length];
      
      const dueDate = new Date(ssDate.getFullYear(), ssDate.getMonth() + 1, 25);
      const paymentDueDate = status === 'paid' ? dueDate.toISOString().split('T')[0] : 
                             (ssIndex % 3 === 0 ? '2026-03-25' : 
                              ssIndex % 3 === 1 ? '2026-05-25' : '2026-04-25');
      
      let disposalStatus = 'pending';
      let disposalAction = null;
      let remedialDeadline = null;
      let isReported = 0;
      let reportedAt = null;
      let reviewedBy = null;
      let disposalResult = null;
      let disposalNote = null;
      
      if (status === 'unpaid' || status === 'overdue') {
        const dsIndex = ssIndex % 5;
        disposalStatus = disposalStatuses[dsIndex];
        disposalAction = disposalActions[dsIndex];
        disposalResult = disposalResults[dsIndex];
        if (disposalStatus === 'deadline_set') {
          const rd = new Date(today);
          rd.setDate(rd.getDate() + 15);
          remedialDeadline = rd.toISOString().split('T')[0];
        }
        if (disposalStatus === 'reported') {
          isReported = 1;
          reportedAt = new Date(today.getTime() - 86400000 * 2).toISOString();
          reviewedBy = 1;
          disposalNote = '逾期超过3个月，已上报当地住建部门';
        }
        if (disposalStatus === 'notified') {
          disposalNote = '已电话通知企业HR，3日内回复补缴计划';
        }
        if (disposalStatus === 'completed') {
          reviewedBy = 1;
          disposalNote = '企业已完成补缴，处置完毕';
        }
      }

      insertSocialSecurity.run(
        worker.id,
        enterpriseId,
        contract.projectId,
        monthStr,
        baseAmount,
        personalAmount,
        enterpriseAmount,
        paymentAmount,
        status,
        paymentDueDate,
        disposalStatus,
        disposalAction,
        remedialDeadline,
        isReported,
        reportedAt,
        reviewedBy,
        disposalResult,
        disposalNote
      );
      stats.socialSecurity++;
      ssIndex++;
    }

    console.log(`已处理 ${monthStr} 的社保记录...`);
  }

  console.log(`\n=== 社保缴纳记录创建完成，共 ${stats.socialSecurity} 条新记录 ===\n`);

  const deletionReasons = [
    '工人离职申请删除',
    '数据过期自动清理',
    '合规性审查删除'
  ];

  const dataTypesOptions = [
    '["face_recognition", "fingerprint"]',
    '["face_recognition"]',
    '["fingerprint", "voice_recognition"]'
  ];

  const deletionMethods = ['physical', 'logical', 'crypto_destroy'];
  const reviewOpinions = [
    '符合《建筑业用工实名制管理办法》第十一条、第二十八条规定，数据已彻底物理销毁，可追溯审计',
    '符合《建筑业用工实名制管理办法》第十一条、第二十八条规定，数据已逻辑删除并隔离，可追溯审计',
    '符合《建筑业用工实名制管理办法》第十一条、第二十八条规定，数据已加密销毁，密钥已废止，可追溯审计'
  ];

  function generateCertificateNo() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `DEL-${dateStr}-${random}`;
  }

  function generateDestructionHash() {
    return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  const insertDeletionLog = db.prepare(`
    INSERT INTO biometric_deletion_logs 
    (worker_id, deletion_reason, data_types, operator_id, deletion_time, audit_trail,
     deletion_certificate_no, deletion_method, deletion_result, review_opinion, execution_time, destruction_hash)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)
  `);

  const workersForDeletion = workerIds.slice(0, 3);

  for (let i = 0; i < workersForDeletion.length; i++) {
    const worker = workersForDeletion[i];

    const existing = db.prepare(`
      SELECT id FROM biometric_deletion_logs 
      WHERE worker_id = ? AND deletion_reason = ?
    `).get(worker.id, deletionReasons[i]);

    if (existing) {
      console.log(`删除日志 ${worker.username} 已存在，跳过`);
      continue;
    }

    const certificateNo = generateCertificateNo();
    const destructionHash = generateDestructionHash();
    const executionTime = new Date().toISOString();

    const auditTrail = JSON.stringify({
      operator: adminId,
      operatorName: 'admin',
      operatorRole: 'admin',
      workerName: worker.real_name || worker.username,
      workerId: worker.id,
      timestamp: executionTime,
      ipAddress: '127.0.0.1',
      reason: deletionReasons[i],
      certificateNo: certificateNo,
      destructionHash: destructionHash,
      deletionMethod: deletionMethods[i]
    });

    insertDeletionLog.run(
      worker.id,
      deletionReasons[i],
      dataTypesOptions[i],
      adminId,
      auditTrail,
      certificateNo,
      deletionMethods[i],
      'success',
      reviewOpinions[i],
      executionTime,
      destructionHash
    );

    db.prepare(`
      UPDATE worker_profiles 
      SET has_biometric_data = 0, biometric_deleted = 1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(worker.id);

    stats.biometricDeletionLogs++;
    console.log(`已创建删除日志: ${worker.username} - ${deletionReasons[i]} - ${certificateNo}`);
  }

  console.log(`\n=== 生物特征删除凭证创建完成，共 ${stats.biometricDeletionLogs} 条新记录 ===\n`);

  const auditActions = [
    { action: 'login', table: null, count: 4 },
    { action: 'logout', table: null, count: 2 },
    { action: 'submit_certification', table: 'trade_certifications', count: 3 },
    { action: 'verify_certification', table: 'trade_certifications', count: 2 },
    { action: 'create_project', table: 'construction_projects', count: 2 },
    { action: 'sign_contract', table: 'labor_contracts', count: 2 },
    { action: 'attendance_checkin', table: 'attendance_records', count: 3 },
    { action: 'generate_payroll', table: 'payrolls', count: 2 },
    { action: 'delete_biometric', table: 'biometric_deletion_logs', count: 2 }
  ];

  const insertAuditLog = db.prepare(`
    INSERT INTO audit_logs 
    (user_id, action, table_name, record_id, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const actionGroup of auditActions) {
    for (let i = 0; i < actionGroup.count; i++) {
      const randomWorker = randomChoice(workerIds);
      const logDate = new Date(today);
      logDate.setDate(logDate.getDate() - randomInt(0, 29));
      logDate.setHours(randomInt(8, 18), randomInt(0, 59), randomInt(0, 59));

      const existing = db.prepare(`
        SELECT id FROM audit_logs 
        WHERE user_id = ? AND action = ? AND DATE(created_at) = ?
      `).get(randomWorker.id, actionGroup.action, formatDate(logDate));

      if (existing) {
        continue;
      }

      insertAuditLog.run(
        randomWorker.id,
        actionGroup.action,
        actionGroup.table,
        randomInt(1, 100),
        `192.168.${randomInt(1, 10)}.${randomInt(1, 255)}`,
        formatDateTime(logDate)
      );
      stats.auditLogs++;
    }
  }

  console.log(`\n=== 审计日志创建完成，共 ${stats.auditLogs} 条新记录 ===\n`);

  console.log('========================================');
  console.log('数据填充统计:');
  console.log(`  用户: ${stats.users} 个`);
  console.log(`  工人档案: ${stats.workerProfiles} 份`);
  console.log(`  工种认证: ${stats.certifications} 条`);
  console.log(`  技能评定: ${stats.skillAssessments} 条`);
  console.log(`  工程项目: ${stats.projects} 个`);
  console.log(`  岗位发布: ${stats.jobPostings} 个`);
  console.log(`  劳务合同: ${stats.contracts} 份`);
  console.log(`  考勤记录: ${stats.attendance} 条`);
  console.log(`  工资条: ${stats.payrolls} 条`);
  console.log(`  社保记录: ${stats.socialSecurity} 条`);
  console.log(`  生物特征删除: ${stats.biometricDeletionLogs} 条`);
  console.log(`  审计日志: ${stats.auditLogs} 条`);
  console.log('========================================');
  console.log('\n数据填充完成！');
});

try {
  seedData();
  db.close();
} catch (error) {
  console.error('数据填充失败:', error);
  db.close();
  process.exit(1);
}
