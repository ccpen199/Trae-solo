const db = require('../src/database');
const bcrypt = require('bcryptjs');

function seedData() {
  console.log('开始初始化测试数据...');

  const testJobseekers = [
    {
      name: '张三',
      phone: '13800138000',
      password: '123456',
      gender: '男',
      age: 30,
      skills: ['电工', '焊工', '维修'],
      expectedSalaryMin: 6000,
      expectedSalaryMax: 10000,
      availableDate: '2026-06-15',
      location: '上海市浦东新区',
      commuteRadius: 30,
      workExperience: '8年电工经验，持有低压电工证，曾在多家工厂负责设备维护和电气维修工作。',
      education: '中专'
    },
    {
      name: '李四',
      phone: '13800138001',
      password: '123456',
      gender: '男',
      age: 28,
      skills: ['叉车司机', '仓管员', '搬运工'],
      expectedSalaryMin: 5000,
      expectedSalaryMax: 8000,
      availableDate: '2026-06-10',
      location: '上海市嘉定区',
      commuteRadius: 20,
      workExperience: '5年仓储物流经验，持有叉车证N1，熟悉仓库管理流程。',
      education: '高中'
    },
    {
      name: '王五',
      phone: '13800138002',
      password: '123456',
      gender: '男',
      age: 35,
      skills: ['装修工', '木工', '水电工'],
      expectedSalaryMin: 8000,
      expectedSalaryMax: 15000,
      availableDate: '2026-06-20',
      location: '上海市松江区',
      commuteRadius: 50,
      workExperience: '12年装修经验，精通木工和水电安装，参与过多个大型装修项目。',
      education: '初中'
    }
  ];

  const testEmployers = [
    {
      companyName: '上海华成制造有限公司',
      contactPerson: '王经理',
      contactPhone: '021-88888888',
      companyLicense: '91310000MA12345678',
      companyAddress: '上海市浦东新区张江高科技园区',
      companyDescription: '上海华成制造有限公司成立于2005年，是一家专业从事机械设备制造的高新技术企业。公司占地面积50亩，拥有员工500余人，产品远销国内外。',
      isVerified: 1,
      rating: 4.8,
      hrResponseTime: '4小时',
      avgResponseTime: 25,
      responseRate: 98,
      phone: '13900139000',
      password: '123456'
    },
    {
      companyName: '上海恒通物流有限公司',
      contactPerson: '李主管',
      contactPhone: '021-66666666',
      companyLicense: '91310000MA87654321',
      companyAddress: '上海市嘉定区安亭镇',
      companyDescription: '上海恒通物流有限公司是一家集仓储、运输、配送于一体的综合性物流企业。公司拥有现代化仓储设施10万平米，各种运输车辆200余台。',
      isVerified: 1,
      rating: 4.5,
      hrResponseTime: '8小时',
      avgResponseTime: 60,
      responseRate: 92,
      phone: '13900139001',
      password: '123456'
    },
    {
      companyName: '上海优居装饰工程有限公司',
      contactPerson: '张总监',
      contactPhone: '021-77777777',
      companyLicense: '91310000MA11223344',
      companyAddress: '上海市松江区九亭镇',
      companyDescription: '上海优居装饰工程有限公司专业从事家装、工装装饰装修工程，拥有专业设计团队和施工队伍，年施工能力500套以上。',
      isVerified: 0,
      rating: 4.2,
      hrResponseTime: '24小时',
      avgResponseTime: 180,
      responseRate: 85,
      phone: '13900139002',
      password: '123456'
    }
  ];

  const testJobs = [
    {
      employerIdx: 0,
      title: '电工维修工',
      description: '负责工厂生产设备的日常维护保养、故障维修，确保生产线正常运行。定期对电气设备进行巡检，建立设备维护档案。',
      salaryMin: 7000,
      salaryMax: 10000,
      location: '上海市浦东新区张江高科技园区',
      latitude: 31.2099,
      longitude: 121.5978,
      workType: '全职',
      requirements: '1. 持有低压或高压电工证\n2. 3年以上工厂设备维修经验\n3. 熟悉PLC控制系统优先\n4. 能够接受加班和轮班',
      benefits: '五险一金、年终奖、带薪年假、节日福利、免费工作餐、提供住宿、年度体检、技能培训',
      hasFood: 1,
      hasLodging: 1,
      hasInsurance: 1,
      hasFund: 1,
      availableDate: '2026-06-10',
      isUrgent: 1,
      skills: ['电工', '维修', '设备保养']
    },
    {
      employerIdx: 0,
      title: '焊工',
      description: '负责金属构件的焊接作业，按图纸要求完成产品焊接，保证焊接质量符合标准。维护焊接设备，确保安全生产。',
      salaryMin: 8000,
      salaryMax: 12000,
      location: '上海市浦东新区张江高科技园区',
      latitude: 31.2099,
      longitude: 121.5978,
      workType: '全职',
      requirements: '1. 持有焊工操作证（氩弧焊、二保焊）\n2. 5年以上相关工作经验\n3. 能看懂机械图纸\n4. 有压力容器焊接经验优先',
      benefits: '五险一金、计件工资、多劳多得、包吃住、节日福利、高温补贴、年终奖金',
      hasFood: 1,
      hasLodging: 1,
      hasInsurance: 1,
      hasFund: 0,
      availableDate: '2026-06-08',
      isUrgent: 1,
      skills: ['焊工', '氩弧焊', '二保焊']
    },
    {
      employerIdx: 1,
      title: '叉车司机',
      description: '负责仓库货物的装卸、搬运和堆垛作业，确保货物安全。定期对叉车进行检查和维护，遵守安全操作规程。',
      salaryMin: 5500,
      salaryMax: 7500,
      location: '上海市嘉定区安亭镇',
      latitude: 31.2934,
      longitude: 121.1797,
      workType: '全职',
      requirements: '1. 持有叉车N1驾驶证\n2. 2年以上仓储叉车操作经验\n3. 熟悉仓库货物堆放规范\n4. 能够接受夜班',
      benefits: '五险一金、包吃住、全勤奖、绩效奖金、工龄工资、节日福利',
      hasFood: 1,
      hasLodging: 1,
      hasInsurance: 1,
      hasFund: 0,
      availableDate: '2026-06-15',
      isUrgent: 0,
      skills: ['叉车司机', '仓储', '搬运']
    },
    {
      employerIdx: 1,
      title: '仓库管理员',
      description: '负责仓库日常管理，包括货物验收、入库、出库、盘点等工作。保证库存数据准确，账目清晰。',
      salaryMin: 5000,
      salaryMax: 6500,
      location: '上海市嘉定区安亭镇',
      latitude: 31.2934,
      longitude: 121.1797,
      workType: '全职',
      requirements: '1. 2年以上仓库管理经验\n2. 会使用电脑和仓库管理系统\n3. 工作认真负责，能吃苦耐劳\n4. 有物流仓储经验优先',
      benefits: '五险一金、包吃住、月度奖金、带薪年假、节日福利、生日礼品',
      hasFood: 1,
      hasLodging: 1,
      hasInsurance: 1,
      hasFund: 1,
      availableDate: '2026-06-20',
      isUrgent: 0,
      skills: ['仓管员', '库存管理', '货物验收']
    },
    {
      employerIdx: 2,
      title: '装修木工',
      description: '负责装修工程中的木作施工，包括吊顶、衣柜、门窗、地板等安装。保证施工质量和进度，做到文明施工。',
      salaryMin: 9000,
      salaryMax: 15000,
      location: '上海市松江区九亭镇',
      latitude: 31.1196,
      longitude: 121.3130,
      workType: '全职',
      requirements: '1. 5年以上装修木工经验\n2. 能看懂施工图纸\n3. 熟练使用各种木工工具\n4. 有家装公司工作经验优先',
      benefits: '项目提成、包住、餐补、交通补贴、节日福利、完工奖励',
      hasFood: 0,
      hasLodging: 1,
      hasInsurance: 1,
      hasFund: 0,
      availableDate: '2026-06-18',
      isUrgent: 1,
      skills: ['装修工', '木工', '安装']
    },
    {
      employerIdx: 2,
      title: '水电工',
      description: '负责装修工程中的水电施工，包括布线、水管安装、开关插座灯具安装等。确保施工质量和安全规范。',
      salaryMin: 8500,
      salaryMax: 13000,
      location: '上海市松江区九亭镇',
      latitude: 31.1196,
      longitude: 121.3130,
      workType: '全职',
      requirements: '1. 持有水电工相关证书\n2. 5年以上装修水电施工经验\n3. 熟悉水电施工规范和验收标准\n4. 工作细心，有责任心',
      benefits: '项目提成、包住、餐补、交通补贴、节日福利、完工奖励',
      hasFood: 0,
      hasLodging: 1,
      hasInsurance: 1,
      hasFund: 0,
      availableDate: '2026-06-12',
      isUrgent: 1,
      skills: ['水电工', '布线', '管道安装']
    }
  ];

  const now = new Date().toISOString();

  testJobseekers.forEach((js, idx) => {
    const existingUser = db.prepare('SELECT * FROM users WHERE phone = ?').get(js.phone);
    if (!existingUser) {
      const hashedPassword = bcrypt.hashSync(js.password, 10);
      const userResult = db.prepare(`
        INSERT INTO users (phone, password, role, created_at, updated_at)
        VALUES (?, ?, 'jobseeker', ?, ?)
      `).run(js.phone, hashedPassword, now, now);

      const jsResult = db.prepare(`
        INSERT INTO jobseekers (user_id, name, gender, age, phone, expected_salary_min, expected_salary_max, available_date, location, commute_radius, work_experience, education, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userResult.lastInsertRowid, js.name, js.gender, js.age, js.phone,
        js.expectedSalaryMin, js.expectedSalaryMax, js.availableDate, js.location, js.commuteRadius,
        js.workExperience, js.education, now, now
      );

      const insertSkill = db.prepare('INSERT INTO jobseeker_skills (jobseeker_id, skill) VALUES (?, ?)');
      js.skills.forEach(skill => insertSkill.run(jsResult.lastInsertRowid, skill));

      console.log(`✓ 创建求职者: ${js.name}`);
    } else {
      console.log(`- 求职者已存在: ${js.name}`);
    }
  });

  testEmployers.forEach((emp, idx) => {
    const existingUser = db.prepare('SELECT * FROM users WHERE phone = ?').get(emp.phone);
    if (!existingUser) {
      const hashedPassword = bcrypt.hashSync(emp.password, 10);
      const userResult = db.prepare(`
        INSERT INTO users (phone, password, role, created_at, updated_at)
        VALUES (?, ?, 'employer', ?, ?)
      `).run(emp.phone, hashedPassword, now, now);

      db.prepare(`
        INSERT INTO employers (user_id, company_name, contact_person, contact_phone, company_license, company_address, company_description, is_verified, rating, response_rate, avg_response_time, hr_response_time, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userResult.lastInsertRowid, emp.companyName, emp.contactPerson, emp.contactPhone,
        emp.companyLicense, emp.companyAddress, emp.companyDescription,
        emp.isVerified, emp.rating, emp.responseRate, emp.avgResponseTime, emp.hrResponseTime,
        now, now
      );

      console.log(`✓ 创建企业: ${emp.companyName}`);
    } else {
      console.log(`- 企业已存在: ${emp.companyName}`);
    }
  });

  const jobCount = db.prepare('SELECT COUNT(*) as count FROM jobs').get();
  if (jobCount.count === 0) {
    const employers = db.prepare('SELECT * FROM employers').all();
    const insertJob = db.prepare(`
      INSERT INTO jobs (employer_id, title, description, salary_min, salary_max, location, latitude, longitude, work_type, requirements, benefits, has_food, has_lodging, has_insurance, has_fund, available_date, is_urgent, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertSkill = db.prepare('INSERT INTO job_skills (job_id, skill) VALUES (?, ?)');

    testJobs.forEach(job => {
      const employer = employers[job.employerIdx];
      if (employer) {
        const result = insertJob.run(
          employer.id, job.title, job.description, job.salaryMin, job.salaryMax,
          job.location, job.latitude, job.longitude, job.workType, job.requirements, job.benefits,
          job.hasFood, job.hasLodging, job.hasInsurance, job.hasFund,
          job.availableDate, job.isUrgent, now, now
        );
        job.skills.forEach(skill => insertSkill.run(result.lastInsertRowid, skill));
        console.log(`✓ 创建岗位: ${job.title}`);
      }
    });
  } else {
    console.log('- 岗位数据已存在');
  }

  const creditRecordsCount = db.prepare('SELECT COUNT(*) as count FROM credit_records').get();
  if (creditRecordsCount.count === 0) {
    const jobseekers = db.prepare('SELECT * FROM jobseekers').all();
    const creditTypes = [
      { type: 'attendance', scoreChange: 2, reason: '本月全勤，出勤率100%' },
      { type: 'skill', scoreChange: 5, reason: '获得高级电工技能认证' },
      { type: 'award', scoreChange: 3, reason: '评为季度优秀员工' },
      { type: 'attendance', scoreChange: -1, reason: '迟到2次' }
    ];
    const insertCredit = db.prepare(`
      INSERT INTO credit_records (jobseeker_id, type, score_change, reason, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    if (jobseekers.length > 0) {
      creditTypes.forEach(record => {
        const randomJs = jobseekers[Math.floor(Math.random() * jobseekers.length)];
        insertCredit.run(randomJs.id, record.type, record.scoreChange, record.reason, now);
      });
      console.log('✓ 创建信用记录');
    }
  }

  console.log('\n========================================');
  console.log('测试数据初始化完成！');
  console.log('========================================');
  console.log('求职者账号:');
  console.log('  张三 - 13800138000 / 123456');
  console.log('  李四 - 13800138001 / 123456');
  console.log('  王五 - 13800138002 / 123456');
  console.log('企业账号:');
  console.log('  上海华成制造 - 13900139000 / 123456 (已认证)');
  console.log('  上海恒通物流 - 13900139001 / 123456 (已认证)');
  console.log('  上海优居装饰 - 13900139002 / 123456 (未认证)');
  console.log('管理员账号:');
  console.log('  admin / admin123456');
  console.log('========================================');
}

try {
  seedData();
} catch (error) {
  console.error('初始化数据失败:', error);
  process.exit(1);
}
