import { PrismaClient, UserRole, EducationLevel, ExperienceLevel, AuditStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const shandongCities = [
  { name: '济南市', code: '370100', latitude: 36.6771, longitude: 117.0009 },
  { name: '青岛市', code: '370200', latitude: 36.0671, longitude: 120.3826 },
  { name: '淄博市', code: '370300', latitude: 36.8129, longitude: 118.0559 },
  { name: '枣庄市', code: '370400', latitude: 34.8108, longitude: 117.3230 },
  { name: '东营市', code: '370500', latitude: 37.4347, longitude: 118.6747 },
  { name: '烟台市', code: '370600', latitude: 37.4638, longitude: 121.4480 },
  { name: '潍坊市', code: '370700', latitude: 36.7068, longitude: 119.1618 },
  { name: '济宁市', code: '370800', latitude: 35.4147, longitude: 116.5871 },
  { name: '泰安市', code: '370900', latitude: 36.1983, longitude: 117.0835 },
  { name: '威海市', code: '371000', latitude: 37.5028, longitude: 122.1141 },
  { name: '日照市', code: '371100', latitude: 35.4182, longitude: 119.5234 },
  { name: '临沂市', code: '371300', latitude: 35.0641, longitude: 118.3424 },
  { name: '德州市', code: '371400', latitude: 37.4409, longitude: 116.3647 },
  { name: '聊城市', code: '371500', latitude: 36.4562, longitude: 115.9856 },
  { name: '滨州市', code: '371600', latitude: 37.3832, longitude: 118.0282 },
  { name: '菏泽市', code: '371700', latitude: 35.2338, longitude: 115.4800 },
];

const industries = [
  { name: '信息技术/互联网', code: 'IT' },
  { name: '金融/银行/保险', code: 'FINANCE' },
  { name: '教育/培训/科研', code: 'EDUCATION' },
  { name: '医疗/医药/健康', code: 'HEALTHCARE' },
  { name: '制造业', code: 'MANUFACTURING' },
  { name: '房地产/建筑', code: 'REAL_ESTATE' },
  { name: '零售/电商/贸易', code: 'RETAIL' },
  { name: '物流/运输', code: 'LOGISTICS' },
  { name: '餐饮/酒店/旅游', code: 'HOSPITALITY' },
  { name: '文化传媒/广告', code: 'MEDIA' },
  { name: '能源/化工/环保', code: 'ENERGY' },
  { name: '政府/事业单位', code: 'GOVERNMENT' },
];

const skills = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js',
  'Python', 'Java', 'Spring Boot', 'Go', 'Rust', 'C++', 'C#',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Oracle',
  'Docker', 'Kubernetes', 'AWS', '阿里云', 'Linux', 'Git',
  'HTML/CSS', 'SASS', 'LESS', 'Webpack', 'Vite',
  'UI/UX设计', '产品经理', '数据分析', '人工智能', '机器学习',
  '会计', '人力资源', '市场营销', '销售', '运营',
  '英语', '日语', '韩语', '项目管理', '沟通协调',
];

async function main() {
  console.log('开始数据库种子初始化...');

  for (const city of shandongCities) {
    await prisma.city.upsert({
      where: { code: city.code },
      create: city,
      update: city,
    });
  }
  console.log(`✅ 山东16地市数据已导入`);

  for (const industry of industries) {
    await prisma.industry.upsert({
      where: { code: industry.code },
      create: industry,
      update: industry,
    });
  }
  console.log(`✅ 行业数据已导入 (${industries.length}个)`);

  for (const skill of skills) {
    await prisma.skill.upsert({
      where: { name: skill },
      create: { name: skill },
      update: { name: skill },
    });
  }
  console.log(`✅ 技能栈数据已导入 (${skills.length}个)`);

  const hashedPassword = await bcrypt.hash('123456', 10);

  const jobseeker = await prisma.user.upsert({
    where: { username: 'jobseeker' },
    create: {
      username: 'jobseeker',
      email: 'jobseeker@example.com',
      password: hashedPassword,
      role: UserRole.JOBSEEKER,
      phone: '13800138001',
      realName: '张三',
      isVerified: true,
    },
    update: {},
  });

  await prisma.jobseekerProfile.upsert({
    where: { userId: jobseeker.id },
    create: {
      userId: jobseeker.id,
      cityId: 1,
      industryId: 1,
      gender: '男',
      educationLevel: EducationLevel.BACHELOR,
      experienceLevel: ExperienceLevel.THREE_TO_FIVE,
      expectedSalary: 15000,
      currentSalary: 12000,
      workYears: 4,
      latitude: 36.6771,
      longitude: 117.0009,
      address: '济南市历下区',
      selfIntroduction: '4年前端开发经验，精通React和Vue，熟悉Node.js全栈开发。',
      jobIntention: '高级前端开发工程师、技术主管',
      isLookingForJob: true,
    },
    update: {},
  });

  const hr = await prisma.user.upsert({
    where: { username: 'hr' },
    create: {
      username: 'hr',
      email: 'hr@example.com',
      password: hashedPassword,
      role: UserRole.HR,
      phone: '13800138002',
      realName: '李经理',
      isVerified: true,
    },
    update: {},
  });

  const company = await prisma.company.upsert({
    where: { name: '山东科技创新有限公司' },
    create: {
      name: '山东科技创新有限公司',
      unifiedSocialCode: '91370100MA3TEST001',
      legalPerson: '王总',
      registeredCapital: '5000万',
      industryId: 1,
      cityId: 1,
      address: '济南市高新区舜华路1000号',
      latitude: 36.6683,
      longitude: 117.1136,
      businessScope: '软件开发、技术咨询、互联网服务',
      companyType: '民营企业',
      employeeCount: '100-299人',
      description: '山东科技创新有限公司是一家专注于企业数字化转型的高科技企业。',
      contactPhone: '0531-88888888',
      contactEmail: 'contact@sdtech.com',
      auditStatus: AuditStatus.APPROVED,
    },
    update: {},
  });

  await prisma.hRProfile.upsert({
    where: { userId: hr.id },
    create: {
      userId: hr.id,
      companyId: company.id,
      department: '人力资源部',
      position: '招聘经理',
      workPhone: '0531-88888889',
    },
    update: {},
  });

  const schoolAdmin = await prisma.user.upsert({
    where: { username: 'school' },
    create: {
      username: 'school',
      email: 'school@example.com',
      password: hashedPassword,
      role: UserRole.SCHOOL,
      phone: '13800138003',
      realName: '王老师',
      isVerified: true,
    },
    update: {},
  });

  const school = await prisma.school.upsert({
    where: { name: '山东大学' },
    create: {
      name: '山东大学',
      code: '10422',
      schoolType: '双一流大学',
      cityId: 1,
      address: '济南市历城区山大南路27号',
      contactPerson: '王老师',
      contactPhone: '0531-88395114',
      website: 'www.sdu.edu.cn',
      description: '山东大学是一所历史悠久、学科齐全、学术实力雄厚、办学特色鲜明，在国内外具有重要影响的教育部直属重点综合性大学。',
      auditStatus: AuditStatus.APPROVED,
    },
    update: {},
  });

  await prisma.schoolProfile.upsert({
    where: { userId: schoolAdmin.id },
    create: {
      userId: schoolAdmin.id,
      schoolId: school.id,
      department: '就业指导中心',
      position: '主任',
    },
    update: {},
  });

  const regulator = await prisma.user.upsert({
    where: { username: 'regulator' },
    create: {
      username: 'regulator',
      email: 'regulator@example.com',
      password: hashedPassword,
      role: UserRole.REGULATOR,
      phone: '13800138004',
      realName: '赵监管',
      isVerified: true,
    },
    update: {},
  });

  await prisma.regulatorProfile.upsert({
    where: { userId: regulator.id },
    create: {
      userId: regulator.id,
      department: '人力资源和社会保障局',
      position: '监察专员',
      region: '山东省',
      permissions: {
        canAuditCompany: true,
        canAuditJob: true,
        canViewStatistics: true,
        canIssueWarning: true,
      },
    },
    update: {},
  });

  const sampleJobs = [
    {
      title: '高级前端开发工程师',
      companyId: company.id,
      creatorId: hr.id,
      cityId: 1,
      industryId: 1,
      salaryMin: 15000,
      salaryMax: 25000,
      educationLevel: EducationLevel.BACHELOR,
      experienceLevel: ExperienceLevel.THREE_TO_FIVE,
      description: '负责公司核心产品的前端架构设计和开发工作，参与技术选型和性能优化。',
      requirements: '1. 3年以上前端开发经验\n2. 精通React/Vue等主流框架\n3. 熟悉TypeScript\n4. 有大型项目经验者优先',
      benefits: '五险一金、年终奖、带薪年假、定期团建、技术培训',
      workAddress: '济南市高新区舜华路1000号',
      latitude: 36.6683,
      longitude: 117.1136,
      recruitCount: 2,
      isUrgent: true,
      auditStatus: AuditStatus.APPROVED,
      status: 'ACTIVE',
      skills: ['React', 'TypeScript', 'Vue.js', 'Node.js', 'Git'],
    },
    {
      title: 'Java后端开发工程师',
      companyId: company.id,
      creatorId: hr.id,
      cityId: 2,
      industryId: 1,
      salaryMin: 18000,
      salaryMax: 30000,
      educationLevel: EducationLevel.BACHELOR,
      experienceLevel: ExperienceLevel.FIVE_TO_TEN,
      description: '负责电商平台后端服务的设计与开发，保障系统高可用和高性能。',
      requirements: '1. 5年以上Java开发经验\n2. 精通Spring Boot/Spring Cloud\n3. 熟悉MySQL、Redis、MQ\n4. 有高并发系统经验',
      benefits: '五险一金、股票期权、弹性工作、免费午餐',
      workAddress: '青岛市崂山区海尔路180号',
      latitude: 36.0671,
      longitude: 120.3826,
      recruitCount: 3,
      isRemote: true,
      auditStatus: AuditStatus.APPROVED,
      status: 'ACTIVE',
      skills: ['Java', 'Spring Boot', 'MySQL', 'Redis', 'Docker'],
    },
    {
      title: '产品经理',
      companyId: company.id,
      creatorId: hr.id,
      cityId: 1,
      industryId: 1,
      salaryMin: 20000,
      salaryMax: 35000,
      educationLevel: EducationLevel.MASTER,
      experienceLevel: ExperienceLevel.THREE_TO_FIVE,
      description: '负责SaaS产品的规划和设计，协调研发、运营、销售团队推进产品落地。',
      requirements: '1. 3年以上B端产品经验\n2. 熟悉企业服务领域\n3. 优秀的需求分析和文档能力\n4. 有PMP证书优先',
      benefits: '五险一金、项目奖金、年度旅游、健康体检',
      workAddress: '济南市高新区舜华路1000号',
      latitude: 36.6683,
      longitude: 117.1136,
      recruitCount: 1,
      auditStatus: AuditStatus.APPROVED,
      status: 'ACTIVE',
      skills: ['产品经理', '项目管理', '数据分析', '沟通协调'],
    },
  ];

  for (const jobData of sampleJobs) {
    const { skills, ...jobInfo } = jobData;
    const job = await prisma.job.upsert({
      where: { title: jobData.title + '_' + jobData.cityId },
      create: {
        ...jobInfo,
        title: jobData.title,
      },
      update: {},
    });

    for (let i = 0; i < skills.length; i++) {
      const skill = await prisma.skill.findUnique({ where: { name: skills[i] } });
      if (skill) {
        await prisma.jobSkill.upsert({
          where: { jobId_skillId: { jobId: job.id, skillId: skill.id } },
          create: {
            jobId: job.id,
            skillId: skill.id,
            isRequired: i < 3,
            priority: i + 1,
          },
          update: {},
        });
      }
    }
  }
  console.log(`✅ 示例岗位数据已导入 (${sampleJobs.length}个)`);

  console.log('\n🎉 数据库种子初始化完成!');
  console.log('\n测试账号:');
  console.log('  求职者: jobseeker / 123456');
  console.log('  企业HR: hr / 123456');
  console.log('  院校管理员: school / 123456');
  console.log('  监管人员: regulator / 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
