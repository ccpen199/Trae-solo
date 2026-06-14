import { getDb } from './index.js';
import bcrypt from 'bcryptjs';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export function seedData(): void {
  const db = getDb();

  const schoolCount = db.prepare('SELECT COUNT(*) as count FROM schools').get() as { count: number };
  if (schoolCount.count > 0) return;

  const schools = [
    { id: 's1', name: '清华大学', province: '北京', studentCount: 35000 },
    { id: 's2', name: '北京大学', province: '北京', studentCount: 32000 },
    { id: 's3', name: '复旦大学', province: '上海', studentCount: 28000 },
    { id: 's4', name: '上海交通大学', province: '上海', studentCount: 30000 },
    { id: 's5', name: '浙江大学', province: '浙江', studentCount: 33000 },
    { id: 's6', name: '南京大学', province: '江苏', studentCount: 26000 },
    { id: 's7', name: '武汉大学', province: '湖北', studentCount: 29000 },
    { id: 's8', name: '中山大学', province: '广东', studentCount: 27000 },
  ];

  const insertSchool = db.prepare(
    'INSERT INTO schools (id, name, province, student_count) VALUES (?, ?, ?, ?)'
  );
  schools.forEach(s => insertSchool.run(s.id, s.name, s.province, s.studentCount));

  const hashedPassword = bcrypt.hashSync('123456', 10);

  const students = [
    {
      id: 'stu1',
      studentId: '2021010001',
      name: '张明',
      school: '清华大学',
      major: '计算机科学与技术',
      grade: '大三',
      avatar: '',
      rating: 4.8,
      verified: 1,
      phone: '13800000001',
      email: 'zhangming@mail.tsinghua.edu.cn',
      resumeSkills: JSON.stringify(['Python', 'JavaScript', 'React', '数据分析']),
      resumeExperience: '有2份前端开发实习经验，参与过校园小程序开发',
      resumeIntroduction: '热爱技术，学习能力强，有团队协作精神',
    },
    {
      id: 'stu2',
      studentId: '2022020023',
      name: '李婷',
      school: '北京大学',
      major: '市场营销',
      grade: '大二',
      avatar: '',
      rating: 4.6,
      verified: 1,
      phone: '13800000002',
      email: 'liting@pku.edu.cn',
      resumeSkills: JSON.stringify(['市场调研', '文案撰写', 'PPT设计', '社交运营']),
      resumeExperience: '学生会宣传部成员，有活动策划经验',
      resumeIntroduction: '性格开朗，善于沟通，执行力强',
    },
    {
      id: 'stu3',
      studentId: '2021030156',
      name: '王浩',
      school: '复旦大学',
      major: '金融学',
      grade: '大三',
      avatar: '',
      rating: 4.9,
      verified: 1,
      phone: '13800000003',
      email: 'wanghao@fudan.edu.cn',
      resumeSkills: JSON.stringify(['财务分析', 'Excel', '数据建模', '投资分析']),
      resumeExperience: '有证券公司实习经验，熟悉金融市场',
      resumeIntroduction: '严谨细致，对数字敏感，有商业思维',
    },
    {
      id: 'stu4',
      studentId: '2023040234',
      name: '陈雪',
      school: '上海交通大学',
      major: '英语专业',
      grade: '大一',
      avatar: '',
      rating: 4.5,
      verified: 1,
      phone: '13800000004',
      email: 'chenxue@sjtu.edu.cn',
      resumeSkills: JSON.stringify(['英语专业八级', '翻译', '写作', '教学']),
      resumeExperience: '有家教经验，擅长英语听说读写教学',
      resumeIntroduction: '耐心细致，有责任心，热爱教育',
    },
    {
      id: 'stu5',
      studentId: '2022050089',
      name: '刘洋',
      school: '浙江大学',
      major: '工业设计',
      grade: '大二',
      avatar: '',
      rating: 4.7,
      verified: 1,
      phone: '13800000005',
      email: 'liuyang@zju.edu.cn',
      resumeSkills: JSON.stringify(['Figma', 'Sketch', 'Photoshop', '用户研究']),
      resumeExperience: '设计社成员，有UI设计项目经验',
      resumeIntroduction: '审美在线，创意丰富，注重用户体验',
    },
  ];

  const insertStudent = db.prepare(`
    INSERT INTO students 
    (id, student_id, name, school, major, grade, avatar, rating, verified, phone, email, resume_skills, resume_experience, resume_introduction, password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  students.forEach(s => {
    insertStudent.run(
      s.id, s.studentId, s.name, s.school, s.major, s.grade,
      s.avatar, s.rating, s.verified, s.phone, s.email,
      s.resumeSkills, s.resumeExperience, s.resumeIntroduction,
      hashedPassword
    );
  });

  const companies = [
    {
      id: 'com1',
      name: '星辰科技有限公司',
      email: 'hr@startech.com',
      licenseNo: '91310000MA12345678',
      contactName: '王经理',
      contactPhone: '13900000001',
      address: '北京市海淀区中关村软件园',
      verified: 1,
      description: '专注于企业SaaS服务的创新科技公司，成立于2018年',
      industry: '互联网/科技',
    },
    {
      id: 'com2',
      name: '悦读教育科技',
      email: 'hr@yuedu.com',
      licenseNo: '91310000MA23456789',
      contactName: '李老师',
      contactPhone: '13900000002',
      address: '上海市浦东新区张江高科技园区',
      verified: 1,
      description: '在线教育公司，专注于K12和大学生职业发展',
      industry: '教育培训',
    },
    {
      id: 'com3',
      name: '慧达金融咨询',
      email: 'hr@huida-finance.com',
      licenseNo: '91310000MA34567890',
      contactName: '张总监',
      contactPhone: '13900000003',
      address: '深圳市南山区科技园',
      verified: 1,
      description: '专业金融咨询服务机构，服务于中小企业和高净值客户',
      industry: '金融/咨询',
    },
    {
      id: 'com4',
      name: '品创设计工作室',
      email: 'hr@pinchuang.design',
      licenseNo: '91310000MA45678901',
      contactName: '陈设计师',
      contactPhone: '13900000004',
      address: '杭州市西湖区文三路',
      verified: 1,
      description: '品牌设计与用户体验设计工作室，服务过多家知名品牌',
      industry: '设计/创意',
    },
    {
      id: 'com5',
      name: '优鲜生活超市',
      email: 'hr@youxian.com',
      licenseNo: '91310000MA56789012',
      contactName: '刘店长',
      contactPhone: '13900000005',
      address: '广州市天河区珠江新城',
      verified: 1,
      description: '社区精品超市连锁，提供新鲜食材和日用品',
      industry: '零售/生活服务',
    },
  ];

  const insertCompany = db.prepare(`
    INSERT INTO companies 
    (id, name, email, license_no, contact_name, contact_phone, address, verified, description, industry, password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  companies.forEach(c => {
    insertCompany.run(
      c.id, c.name, c.email, c.licenseNo, c.contactName, c.contactPhone,
      c.address, c.verified, c.description, c.industry, hashedPassword
    );
  });

  const insertAdmin = db.prepare(
    'INSERT INTO admins (id, username, name, role, password) VALUES (?, ?, ?, ?, ?)'
  );
  insertAdmin.run('admin1', 'admin', '教育局管理员', 'super_admin', hashedPassword);

  const jobs = [
    {
      id: 'job1',
      companyId: 'com1',
      title: '前端开发实习生',
      description: '参与公司核心产品的前端开发工作，负责页面实现和交互优化。\n\n岗位职责：\n1. 参与Web应用前端开发\n2. 与设计师和后端工程师协作\n3. 优化页面性能和用户体验\n\n岗位要求：\n1. 熟悉HTML、CSS、JavaScript\n2. 了解React或Vue框架\n3. 有良好的学习能力和沟通能力',
      location: '北京/远程',
      salaryPerHour: 35,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: JSON.stringify(['计算机科学与技术', '软件工程', '电子信息']),
      workDays: JSON.stringify(['周一', '周二', '周三', '周四', '周五']),
      workStartTime: '09:00',
      workEndTime: '18:00',
      status: 'published',
    },
    {
      id: 'job2',
      companyId: 'com2',
      title: '英语教研助理',
      description: '协助教研团队进行英语课程内容开发和教学资料整理。\n\n岗位职责：\n1. 协助编写和校对英语教材\n2. 参与课程设计和教研活动\n3. 整理学生学习数据和反馈\n\n岗位要求：\n1. 英语专业或英语能力优秀\n2. 耐心细致，文字功底好\n3. 对教育行业有热情',
      location: '上海浦东',
      salaryPerHour: 28,
      maxHoursPerDay: 6,
      maxHoursPerWeek: 24,
      majorRequired: JSON.stringify(['英语专业', '教育学', '汉语言文学']),
      workDays: JSON.stringify(['周二', '周三', '周四', '周六']),
      workStartTime: '10:00',
      workEndTime: '17:00',
      status: 'published',
    },
    {
      id: 'job3',
      companyId: 'com3',
      title: '金融数据分析师助理',
      description: '协助分析师进行金融数据收集、整理和基础分析工作。\n\n岗位职责：\n1. 收集和整理金融市场数据\n2. 协助撰写分析报告\n3. 维护数据库和报表系统\n\n岗位要求：\n1. 金融、经济、统计相关专业\n2. 熟练使用Excel，会Python优先\n3. 数据敏感，逻辑清晰',
      location: '深圳南山',
      salaryPerHour: 40,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 32,
      majorRequired: JSON.stringify(['金融学', '经济学', '统计学', '数学']),
      workDays: JSON.stringify(['周一', '周二', '周三', '周四']),
      workStartTime: '09:30',
      workEndTime: '18:30',
      status: 'published',
    },
    {
      id: 'job4',
      companyId: 'com4',
      title: 'UI设计实习生',
      description: '参与移动应用和网站的界面设计，配合产品团队完成设计方案。\n\n岗位职责：\n1. 负责APP和Web端界面设计\n2. 制作设计规范和组件库\n3. 参与用户研究和可用性测试\n\n岗位要求：\n1. 设计相关专业，有作品集\n2. 熟练使用Figma或Sketch\n3. 有良好的审美和交互思维',
      location: '杭州/远程',
      salaryPerHour: 30,
      maxHoursPerDay: 7,
      maxHoursPerWeek: 28,
      majorRequired: JSON.stringify(['工业设计', '视觉传达', '数字媒体', '交互设计']),
      workDays: JSON.stringify(['周一', '周三', '周五', '周六']),
      workStartTime: '10:00',
      workEndTime: '19:00',
      status: 'published',
    },
    {
      id: 'job5',
      companyId: 'com5',
      title: '超市收银员（兼职）',
      description: '负责超市收银台工作，为顾客提供优质服务。\n\n岗位职责：\n1. 收银、扫码、结算\n2. 整理货架，保持收银区整洁\n3. 解答顾客咨询\n\n岗位要求：\n1. 工作认真负责，细心\n2. 有服务意识，态度友好\n3. 能适应站立工作',
      location: '广州天河',
      salaryPerHour: 22,
      maxHoursPerDay: 6,
      maxHoursPerWeek: 24,
      majorRequired: JSON.stringify([]),
      workDays: JSON.stringify(['周六', '周日']),
      workStartTime: '09:00',
      workEndTime: '18:00',
      status: 'published',
    },
    {
      id: 'job6',
      companyId: 'com1',
      title: 'Python开发实习生',
      description: '参与后端服务开发，负责API接口实现和数据处理。\n\n岗位职责：\n1. 后端API开发与维护\n2. 数据库设计和优化\n3. 编写单元测试和文档\n\n岗位要求：\n1. 熟悉Python，有Django/Flask经验优先\n2. 了解MySQL/MongoDB数据库\n3. 有良好的代码规范意识',
      location: '北京海淀',
      salaryPerHour: 38,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: JSON.stringify(['计算机科学与技术', '软件工程', '数学']),
      workDays: JSON.stringify(['周一', '周二', '周三', '周四', '周五']),
      workStartTime: '09:00',
      workEndTime: '18:00',
      status: 'published',
    },
    {
      id: 'job7',
      companyId: 'com2',
      title: '市场推广专员（校园）',
      description: '负责公司产品在校园内的推广活动，提升品牌知名度。\n\n岗位职责：\n1. 策划和执行校园推广活动\n2. 运营校园社群和公众号\n3. 拓展校园合作伙伴\n\n岗位要求：\n1. 市场营销、传播相关专业优先\n2. 有学生会或社团经验\n3. 善于沟通，有创意，执行力强',
      location: '上海/各校',
      salaryPerHour: 25,
      maxHoursPerDay: 5,
      maxHoursPerWeek: 20,
      majorRequired: JSON.stringify(['市场营销', '广告学', '传播学', '新闻']),
      workDays: JSON.stringify(['周二', '周四', '周六', '周日']),
      workStartTime: '11:00',
      workEndTime: '20:00',
      status: 'published',
    },
    {
      id: 'job8',
      companyId: 'com3',
      title: '行业研究实习生',
      description: '协助进行行业和公司研究，撰写研究报告。\n\n岗位职责：\n1. 收集行业数据和公司信息\n2. 协助搭建财务模型\n3. 撰写行业和公司研究报告\n\n岗位要求：\n1. 金融、经济、会计相关专业\n2. 有行业研究或投行实习经验优先\n3. 逻辑清晰，文字能力强',
      location: '深圳福田',
      salaryPerHour: 45,
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      majorRequired: JSON.stringify(['金融学', '经济学', '会计学', '财务管理']),
      workDays: JSON.stringify(['周一', '周二', '周三', '周四', '周五']),
      workStartTime: '09:00',
      workEndTime: '18:00',
      status: 'published',
    },
  ];

  const insertJob = db.prepare(`
    INSERT INTO jobs 
    (id, company_id, title, description, location, salary_per_hour, max_hours_per_day, max_hours_per_week, 
     major_required, work_days, work_start_time, work_end_time, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  jobs.forEach(j => {
    insertJob.run(
      j.id, j.companyId, j.title, j.description, j.location,
      j.salaryPerHour, j.maxHoursPerDay, j.maxHoursPerWeek,
      j.majorRequired, j.workDays, j.workStartTime, j.workEndTime, j.status
    );
  });

  const filingForms = [
    {
      id: 'ff1',
      jobId: 'job1',
      companyId: 'com1',
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      minWage: 30,
      insuranceProvided: 1,
      insuranceType: '实习责任险',
      safetyMeasures: '提供岗前培训，配备导师，签署实习协议',
      emergencyContact: '王经理',
      emergencyPhone: '13900000001',
    },
    {
      id: 'ff2',
      jobId: 'job2',
      companyId: 'com2',
      maxHoursPerDay: 6,
      maxHoursPerWeek: 24,
      minWage: 25,
      insuranceProvided: 1,
      insuranceType: '意外伤害险',
      safetyMeasures: '办公环境安全培训，签署兼职协议',
      emergencyContact: '李老师',
      emergencyPhone: '13900000002',
    },
    {
      id: 'ff3',
      jobId: 'job3',
      companyId: 'com3',
      maxHoursPerDay: 8,
      maxHoursPerWeek: 32,
      minWage: 35,
      insuranceProvided: 1,
      insuranceType: '实习综合险',
      safetyMeasures: '保密协议，导师制，定期安全培训',
      emergencyContact: '张总监',
      emergencyPhone: '13900000003',
    },
    {
      id: 'ff4',
      jobId: 'job4',
      companyId: 'com4',
      maxHoursPerDay: 7,
      maxHoursPerWeek: 28,
      minWage: 28,
      insuranceProvided: 0,
      safetyMeasures: '远程办公，签署项目合作协议',
      emergencyContact: '陈设计师',
      emergencyPhone: '13900000004',
    },
    {
      id: 'ff5',
      jobId: 'job5',
      companyId: 'com5',
      maxHoursPerDay: 6,
      maxHoursPerWeek: 24,
      minWage: 20,
      insuranceProvided: 1,
      insuranceType: '雇主责任险',
      safetyMeasures: '岗前操作培训，配备防护用品',
      emergencyContact: '刘店长',
      emergencyPhone: '13900000005',
    },
    {
      id: 'ff6',
      jobId: 'job6',
      companyId: 'com1',
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      minWage: 35,
      insuranceProvided: 1,
      insuranceType: '实习责任险',
      safetyMeasures: '提供岗前培训，配备导师，签署实习协议',
      emergencyContact: '王经理',
      emergencyPhone: '13900000001',
    },
    {
      id: 'ff7',
      jobId: 'job7',
      companyId: 'com2',
      maxHoursPerDay: 5,
      maxHoursPerWeek: 20,
      minWage: 22,
      insuranceProvided: 1,
      insuranceType: '意外伤害险',
      safetyMeasures: '活动安全培训，配备带队老师',
      emergencyContact: '李老师',
      emergencyPhone: '13900000002',
    },
    {
      id: 'ff8',
      jobId: 'job8',
      companyId: 'com3',
      maxHoursPerDay: 8,
      maxHoursPerWeek: 40,
      minWage: 40,
      insuranceProvided: 1,
      insuranceType: '实习综合险',
      safetyMeasures: '保密协议，导师制，定期安全培训',
      emergencyContact: '张总监',
      emergencyPhone: '13900000003',
    },
  ];

  const insertFilingForm = db.prepare(`
    INSERT INTO filing_forms 
    (id, job_id, company_id, max_hours_per_day, max_hours_per_week, min_wage, 
     insurance_provided, insurance_type, safety_measures, emergency_contact, emergency_phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  filingForms.forEach(f => {
    insertFilingForm.run(
      f.id, f.jobId, f.companyId, f.maxHoursPerDay, f.maxHoursPerWeek, f.minWage,
      f.insuranceProvided, f.insuranceType, f.safetyMeasures, f.emergencyContact, f.emergencyPhone
    );
  });

  const applications = [
    {
      id: 'app1',
      studentId: 'stu1',
      jobId: 'job1',
      status: 'completed',
      interviewTime: null,
      workHours: 120,
      salary: 4200,
      rating: 5,
      comment: '工作认真负责，代码质量高，团队合作好',
    },
    {
      id: 'app2',
      studentId: 'stu1',
      jobId: 'job6',
      status: 'working',
      interviewTime: null,
      workHours: 60,
      salary: 2280,
      rating: null,
      comment: null,
    },
    {
      id: 'app3',
      studentId: 'stu2',
      jobId: 'job7',
      status: 'completed',
      interviewTime: null,
      workHours: 80,
      salary: 2000,
      rating: 4.5,
      comment: '创意丰富，执行力强，活动效果好',
    },
    {
      id: 'app4',
      studentId: 'stu3',
      jobId: 'job3',
      status: 'accepted',
      interviewTime: '2024-06-15 14:00',
      workHours: 0,
      salary: 0,
      rating: null,
      comment: null,
    },
    {
      id: 'app5',
      studentId: 'stu4',
      jobId: 'job2',
      status: 'interview',
      interviewTime: '2024-06-18 10:00',
      workHours: 0,
      salary: 0,
      rating: null,
      comment: null,
    },
    {
      id: 'app6',
      studentId: 'stu5',
      jobId: 'job4',
      status: 'pending',
      interviewTime: null,
      workHours: 0,
      salary: 0,
      rating: null,
      comment: null,
    },
    {
      id: 'app7',
      studentId: 'stu2',
      jobId: 'job2',
      status: 'rejected',
      interviewTime: null,
      workHours: 0,
      salary: 0,
      rating: null,
      comment: null,
    },
    {
      id: 'app8',
      studentId: 'stu3',
      jobId: 'job8',
      status: 'completed',
      interviewTime: null,
      workHours: 160,
      salary: 7200,
      rating: 4.8,
      comment: '研究能力强，报告质量高，逻辑清晰',
    },
  ];

  const insertApplication = db.prepare(`
    INSERT INTO applications 
    (id, student_id, job_id, status, interview_time, work_hours, salary, rating, comment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  applications.forEach(a => {
    insertApplication.run(
      a.id, a.studentId, a.jobId, a.status, a.interviewTime,
      a.workHours, a.salary, a.rating, a.comment
    );
  });

  const schedules = [
    {
      studentId: 'stu1',
      courses: JSON.stringify([
        { day: 1, startPeriod: 1, endPeriod: 2, courseName: '数据结构' },
        { day: 1, startPeriod: 5, endPeriod: 6, courseName: '操作系统' },
        { day: 2, startPeriod: 3, endPeriod: 4, courseName: '计算机网络' },
        { day: 3, startPeriod: 1, endPeriod: 2, courseName: '算法设计' },
        { day: 3, startPeriod: 7, endPeriod: 8, courseName: '数据库原理' },
        { day: 4, startPeriod: 3, endPeriod: 4, courseName: '软件工程' },
        { day: 5, startPeriod: 1, endPeriod: 2, courseName: '编译原理' },
      ]),
    },
    {
      studentId: 'stu2',
      courses: JSON.stringify([
        { day: 1, startPeriod: 3, endPeriod: 4, courseName: '市场营销学' },
        { day: 2, startPeriod: 1, endPeriod: 2, courseName: '消费者行为学' },
        { day: 2, startPeriod: 5, endPeriod: 6, courseName: '广告学' },
        { day: 3, startPeriod: 3, endPeriod: 4, courseName: '市场调研' },
        { day: 4, startPeriod: 1, endPeriod: 2, courseName: '品牌管理' },
        { day: 4, startPeriod: 7, endPeriod: 8, courseName: '营销策划' },
        { day: 5, startPeriod: 3, endPeriod: 4, courseName: '电子商务' },
      ]),
    },
    {
      studentId: 'stu3',
      courses: JSON.stringify([
        { day: 1, startPeriod: 1, endPeriod: 2, courseName: '货币银行学' },
        { day: 1, startPeriod: 5, endPeriod: 6, courseName: '国际金融' },
        { day: 2, startPeriod: 3, endPeriod: 4, courseName: '投资学' },
        { day: 3, startPeriod: 1, endPeriod: 2, courseName: '公司金融' },
        { day: 3, startPeriod: 7, endPeriod: 8, courseName: '金融工程' },
        { day: 4, startPeriod: 3, endPeriod: 4, courseName: '计量经济学' },
        { day: 5, startPeriod: 1, endPeriod: 2, courseName: '财务报表分析' },
      ]),
    },
    {
      studentId: 'stu4',
      courses: JSON.stringify([
        { day: 1, startPeriod: 1, endPeriod: 2, courseName: '综合英语' },
        { day: 2, startPeriod: 3, endPeriod: 4, courseName: '英语听力' },
        { day: 2, startPeriod: 5, endPeriod: 6, courseName: '英语口语' },
        { day: 3, startPeriod: 1, endPeriod: 2, courseName: '英语阅读' },
        { day: 4, startPeriod: 3, endPeriod: 4, courseName: '英语写作' },
        { day: 5, startPeriod: 1, endPeriod: 2, courseName: '翻译理论' },
      ]),
    },
    {
      studentId: 'stu5',
      courses: JSON.stringify([
        { day: 1, startPeriod: 1, endPeriod: 2, courseName: '设计素描' },
        { day: 1, startPeriod: 5, endPeriod: 6, courseName: '设计概论' },
        { day: 2, startPeriod: 3, endPeriod: 4, courseName: '色彩构成' },
        { day: 3, startPeriod: 1, endPeriod: 2, courseName: '平面构成' },
        { day: 3, startPeriod: 7, endPeriod: 8, courseName: '设计软件' },
        { day: 4, startPeriod: 3, endPeriod: 4, courseName: '产品设计' },
        { day: 5, startPeriod: 1, endPeriod: 2, courseName: '人机工程学' },
      ]),
    },
  ];

  const insertSchedule = db.prepare(
    'INSERT INTO schedules (id, student_id, courses) VALUES (?, ?, ?)'
  );
  schedules.forEach(s => {
    insertSchedule.run(generateId(), s.studentId, s.courses);
  });

  const wallets = [
    { studentId: 'stu1', balance: 3580.5 },
    { studentId: 'stu2', balance: 1200.0 },
    { studentId: 'stu3', balance: 0 },
    { studentId: 'stu4', balance: 560.0 },
    { studentId: 'stu5', balance: 2000.0 },
  ];

  const insertWallet = db.prepare(
    'INSERT INTO wallets (id, student_id, balance) VALUES (?, ?, ?)'
  );
  wallets.forEach(w => {
    insertWallet.run(generateId(), w.studentId, w.balance);
  });

  const conversations = [
    {
      id: 'conv1',
      studentId: 'stu1',
      companyId: 'com1',
      jobId: 'job1',
      lastMessage: '好的，明天上午10点面试准时参加',
      lastMessageAt: '2024-06-10 15:30:00',
      unreadStudent: 1,
      unreadCompany: 0,
    },
    {
      id: 'conv2',
      studentId: 'stu1',
      companyId: 'com1',
      jobId: 'job6',
      lastMessage: '这个模块的代码我已经提交了',
      lastMessageAt: '2024-06-12 18:00:00',
      unreadStudent: 0,
      unreadCompany: 2,
    },
    {
      id: 'conv3',
      studentId: 'stu3',
      companyId: 'com3',
      jobId: 'job3',
      lastMessage: '欢迎加入我们团队',
      lastMessageAt: '2024-06-08 09:15:00',
      unreadStudent: 1,
      unreadCompany: 0,
    },
    {
      id: 'conv4',
      studentId: 'stu4',
      companyId: 'com2',
      jobId: 'job2',
      lastMessage: '请问面试需要准备什么材料？',
      lastMessageAt: '2024-06-11 14:20:00',
      unreadStudent: 0,
      unreadCompany: 1,
    },
  ];

  const insertConversation = db.prepare(`
    INSERT INTO conversations 
    (id, student_id, company_id, job_id, last_message, last_message_at, unread_count_student, unread_count_company)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  conversations.forEach(c => {
    insertConversation.run(
      c.id, c.studentId, c.companyId, c.jobId,
      c.lastMessage, c.lastMessageAt, c.unreadStudent, c.unreadCompany
    );
  });

  const messages = [
    {
      conversationId: 'conv1',
      senderId: 'com1',
      senderType: 'company',
      content: '你好，我是星辰科技的HR，看到你投递了前端开发实习岗位',
      type: 'text',
      createdAt: '2024-06-09 10:00:00',
      read: 1,
    },
    {
      conversationId: 'conv1',
      senderId: 'stu1',
      senderType: 'student',
      content: '您好，是的，我对这个岗位很感兴趣',
      type: 'text',
      createdAt: '2024-06-09 10:05:00',
      read: 1,
    },
    {
      conversationId: 'conv1',
      senderId: 'com1',
      senderType: 'company',
      content: '方便约个时间面试吗？明天上午10点可以吗？',
      type: 'text',
      createdAt: '2024-06-09 10:10:00',
      read: 1,
    },
    {
      conversationId: 'conv1',
      senderId: 'stu1',
      senderType: 'student',
      content: '好的，明天上午10点面试准时参加',
      type: 'text',
      createdAt: '2024-06-10 15:30:00',
      read: 0,
    },
    {
      conversationId: 'conv2',
      senderId: 'com1',
      senderType: 'company',
      content: '欢迎加入Python开发实习项目',
      type: 'text',
      createdAt: '2024-06-01 09:00:00',
      read: 1,
    },
    {
      conversationId: 'conv2',
      senderId: 'stu1',
      senderType: 'student',
      content: '谢谢，我会努力的！',
      type: 'text',
      createdAt: '2024-06-01 09:05:00',
      read: 1,
    },
    {
      conversationId: 'conv2',
      senderId: 'com1',
      senderType: 'company',
      content: '这周的任务是完成用户模块的API开发',
      type: 'text',
      createdAt: '2024-06-03 10:00:00',
      read: 1,
    },
    {
      conversationId: 'conv2',
      senderId: 'stu1',
      senderType: 'student',
      content: '好的，收到',
      type: 'text',
      createdAt: '2024-06-03 10:05:00',
      read: 1,
    },
    {
      conversationId: 'conv2',
      senderId: 'com1',
      senderType: 'company',
      content: '进度怎么样了？有问题随时沟通',
      type: 'text',
      createdAt: '2024-06-12 17:30:00',
      read: 0,
    },
    {
      conversationId: 'conv2',
      senderId: 'stu1',
      senderType: 'student',
      content: '这个模块的代码我已经提交了',
      type: 'text',
      createdAt: '2024-06-12 18:00:00',
      read: 0,
    },
  ];

  const insertMessage = db.prepare(`
    INSERT INTO messages 
    (id, conversation_id, sender_id, sender_type, content, type, created_at, read)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  messages.forEach(m => {
    insertMessage.run(
      generateId(), m.conversationId, m.senderId, m.senderType,
      m.content, m.type, m.createdAt, m.read
    );
  });

  const complaints = [
    {
      id: 'cmp1',
      studentId: 'stu2',
      companyId: 'com5',
      jobId: 'job5',
      type: 'salary',
      description: '工作了两周，公司拖欠工资不发，说好的22元/小时，现在联系不上负责人',
      status: 'investigating',
      result: null,
      createdAt: '2024-06-05 14:30:00',
    },
    {
      id: 'cmp2',
      studentId: 'stu4',
      companyId: 'com4',
      jobId: 'job4',
      type: 'other',
      description: '工作内容和岗位描述不符，实际做的都是打杂的事情',
      status: 'resolved',
      result: '已与企业沟通，调整工作内容，学生获得相应补偿',
      createdAt: '2024-05-20 10:00:00',
    },
    {
      id: 'cmp3',
      studentId: 'stu5',
      companyId: 'com2',
      jobId: 'job7',
      type: 'safety',
      description: '推广活动期间没有提供必要的安全保障，在户外工作没有遮阳措施',
      status: 'pending',
      result: null,
      createdAt: '2024-06-10 16:45:00',
    },
  ];

  const insertComplaint = db.prepare(`
    INSERT INTO complaints 
    (id, student_id, company_id, job_id, type, description, status, result, created_at, resolved_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  complaints.forEach(c => {
    insertComplaint.run(
      c.id, c.studentId, c.companyId, c.jobId, c.type,
      c.description, c.status, c.result, c.createdAt,
      c.status === 'resolved' ? '2024-05-25 15:00:00' : null
    );
  });

  const certificates = [
    {
      id: 'cert1',
      studentId: 'stu1',
      applicationId: 'app1',
      jobTitle: '前端开发实习生',
      companyName: '星辰科技有限公司',
      startDate: '2024-03-01',
      endDate: '2024-05-31',
      workHours: 120,
      salary: 4200,
      rating: 5,
      certificateUrl: '/certificates/cert1.pdf',
      sealUrl: '/seals/startech.png',
    },
    {
      id: 'cert2',
      studentId: 'stu2',
      applicationId: 'app3',
      jobTitle: '市场推广专员（校园）',
      companyName: '悦读教育科技',
      startDate: '2024-04-01',
      endDate: '2024-06-01',
      workHours: 80,
      salary: 2000,
      rating: 4.5,
      certificateUrl: '/certificates/cert2.pdf',
      sealUrl: '/seals/yuedu.png',
    },
    {
      id: 'cert3',
      studentId: 'stu3',
      applicationId: 'app8',
      jobTitle: '行业研究实习生',
      companyName: '慧达金融咨询',
      startDate: '2024-02-01',
      endDate: '2024-05-31',
      workHours: 160,
      salary: 7200,
      rating: 4.8,
      certificateUrl: '/certificates/cert3.pdf',
      sealUrl: '/seals/huida.png',
    },
  ];

  const insertCertificate = db.prepare(`
    INSERT INTO certificates 
    (id, student_id, application_id, job_title, company_name, start_date, end_date, 
     work_hours, salary, rating, certificate_url, seal_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  certificates.forEach(c => {
    insertCertificate.run(
      c.id, c.studentId, c.applicationId, c.jobTitle, c.companyName,
      c.startDate, c.endDate, c.workHours, c.salary, c.rating,
      c.certificateUrl, c.sealUrl
    );
  });

  const payrollRecords = [
    {
      id: 'pr1',
      applicationId: 'app1',
      companyId: 'com1',
      studentId: 'stu1',
      amount: 4200,
      status: 'paid',
      batchId: 'batch001',
      paidAt: '2024-06-01 10:00:00',
    },
    {
      id: 'pr2',
      applicationId: 'app3',
      companyId: 'com2',
      studentId: 'stu2',
      amount: 2000,
      status: 'paid',
      batchId: 'batch002',
      paidAt: '2024-06-05 14:00:00',
    },
    {
      id: 'pr3',
      applicationId: 'app8',
      companyId: 'com3',
      studentId: 'stu3',
      amount: 7200,
      status: 'paid',
      batchId: 'batch003',
      paidAt: '2024-06-03 09:30:00',
    },
    {
      id: 'pr4',
      applicationId: 'app2',
      companyId: 'com1',
      studentId: 'stu1',
      amount: 2280,
      status: 'processing',
      batchId: 'batch004',
      paidAt: null,
    },
  ];

  const insertPayroll = db.prepare(`
    INSERT INTO payroll_records 
    (id, application_id, company_id, student_id, amount, status, batch_id, paid_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  payrollRecords.forEach(p => {
    insertPayroll.run(
      p.id, p.applicationId, p.companyId, p.studentId,
      p.amount, p.status, p.batchId, p.paidAt
    );
  });

  const withdrawRecords = [
    {
      id: 'wd1',
      studentId: 'stu1',
      amount: 2000,
      channel: 'alipay',
      status: 'success',
      createdAt: '2024-06-02 11:00:00',
      completedAt: '2024-06-02 11:30:00',
    },
    {
      id: 'wd2',
      studentId: 'stu2',
      amount: 500,
      channel: 'wechat',
      status: 'success',
      createdAt: '2024-06-06 15:20:00',
      completedAt: '2024-06-06 15:45:00',
    },
    {
      id: 'wd3',
      studentId: 'stu5',
      amount: 1000,
      channel: 'alipay',
      status: 'pending',
      createdAt: '2024-06-11 09:00:00',
      completedAt: null,
    },
  ];

  const insertWithdraw = db.prepare(`
    INSERT INTO withdraw_records 
    (id, student_id, amount, channel, status, created_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  withdrawRecords.forEach(w => {
    insertWithdraw.run(
      w.id, w.studentId, w.amount, w.channel,
      w.status, w.createdAt, w.completedAt
    );
  });
}
