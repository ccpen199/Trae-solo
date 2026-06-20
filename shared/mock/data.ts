import type {
  Company,
  JobDescription,
  TalentProfile,
  MatchResult,
  ChatSession,
  ChatMessage,
  InterviewInvite,
  RecruitmentMetrics,
  RiskScore,
  RegionalLaborData,
  KnowledgeGraph,
  User,
  SkillRadar,
  CompanyQualification,
  EntityType,
  IndustryType,
} from '@shared/types';
import { v4 as uuidv4 } from 'uuid';

const generateId = () => uuidv4();

const randomInRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateSkillRadar = (base: Partial<SkillRadar> = {}): SkillRadar => ({
  professional: base.professional ?? randomInRange(60, 95),
  communication: base.communication ?? randomInRange(55, 90),
  service: base.service ?? randomInRange(65, 95),
  teamwork: base.teamwork ?? randomInRange(60, 90),
  stress: base.stress ?? randomInRange(50, 85),
  learning: base.learning ?? randomInRange(60, 90),
});

export const mockUsers: User[] = [
  {
    id: 'hr-001',
    role: 'hr',
    name: '张经理',
    email: 'hr@hotelgroup.com',
    phone: '13800138001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hr001',
    companyId: 'comp-001',
  },
  {
    id: 'hr-002',
    role: 'hr',
    name: '李主管',
    email: 'hr@restaurant.com',
    phone: '13800138002',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hr002',
    companyId: 'comp-002',
  },
  {
    id: 'admin-001',
    role: 'admin',
    name: '系统管理员',
    email: 'admin@platform.com',
    phone: '13900139000',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  },
];

export const mockCompanies: Company[] = [
  {
    id: 'comp-001',
    name: '锦江国际酒店管理集团',
    industry: 'hotel',
    contactPerson: '张经理',
    phone: '021-88888888',
    address: '上海市浦东新区世纪大道1号',
    geoLat: 31.2304,
    geoLng: 121.4737,
    tenantId: 1001,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-06-01'),
  },
  {
    id: 'comp-002',
    name: '海底捞火锅连锁',
    industry: 'restaurant',
    contactPerson: '李主管',
    phone: '010-66666666',
    address: '北京市朝阳区三里屯路19号',
    geoLat: 39.9388,
    geoLng: 116.4472,
    tenantId: 1002,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-05-10'),
  },
  {
    id: 'comp-003',
    name: '美丽田园美容连锁',
    industry: 'beauty',
    contactPerson: '王总监',
    phone: '020-77777777',
    address: '广州市天河区珠江新城',
    geoLat: 23.1291,
    geoLng: 113.2644,
    tenantId: 1003,
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-06-15'),
  },
  {
    id: 'comp-004',
    name: '泰康之家养老社区',
    industry: 'healthcare',
    contactPerson: '刘院长',
    phone: '0755-99999999',
    address: '深圳市南山区科技园',
    geoLat: 22.5431,
    geoLng: 114.0579,
    tenantId: 1004,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-04-20'),
  },
  {
    id: 'comp-005',
    name: '永辉超市',
    industry: 'retail',
    contactPerson: '陈经理',
    phone: '0591-55555555',
    address: '福州市鼓楼区五四路',
    geoLat: 26.0745,
    geoLng: 119.2965,
    tenantId: 1005,
    createdAt: new Date('2024-02-28'),
    updatedAt: new Date('2024-05-25'),
  },
  {
    id: 'comp-006',
    name: '字节跳动电商部',
    industry: 'ecommerce',
    contactPerson: '赵总监',
    phone: '010-88889999',
    address: '北京市海淀区中关村',
    geoLat: 39.9842,
    geoLng: 116.3074,
    tenantId: 1006,
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-06-10'),
  },
];

export const mockCompanyQualifications: CompanyQualification[] = [
  {
    id: 'qual-001',
    companyId: 'comp-001',
    businessLicense: 'https://example.com/license/001.jpg',
    industryCertifications: ['星级酒店认证', 'ISO9001质量管理体系', 'HACCP食品安全认证'],
    complianceScore: 92,
    status: 'approved',
    verifiedAt: new Date('2024-01-20'),
  },
  {
    id: 'qual-002',
    companyId: 'comp-002',
    businessLicense: 'https://example.com/license/002.jpg',
    industryCertifications: ['餐饮服务许可证', '卫生等级A级', '食品安全示范店'],
    complianceScore: 88,
    status: 'approved',
    verifiedAt: new Date('2024-02-25'),
  },
  {
    id: 'qual-003',
    companyId: 'comp-003',
    businessLicense: 'https://example.com/license/003.jpg',
    industryCertifications: ['医疗美容机构资质', '卫生许可证', '连锁经营认证'],
    complianceScore: 95,
    status: 'pending',
  },
  {
    id: 'qual-004',
    companyId: 'comp-004',
    businessLicense: 'https://example.com/license/004.jpg',
    industryCertifications: ['养老机构设立许可证', '医疗机构执业许可证', '消防验收合格证明'],
    complianceScore: 78,
    status: 'pending',
  },
  {
    id: 'qual-005',
    companyId: 'comp-005',
    businessLicense: 'https://example.com/license/005.jpg',
    industryCertifications: ['食品经营许可证', '烟草专卖零售许可证'],
    complianceScore: 65,
    status: 'rejected',
    verifiedAt: new Date('2024-06-08'),
  },
  {
    id: 'qual-006',
    companyId: 'comp-006',
    businessLicense: 'https://example.com/license/006.jpg',
    industryCertifications: ['增值电信业务经营许可证', '网络文化经营许可证', 'ICP备案'],
    complianceScore: 91,
    status: 'pending',
  },
];

export interface BlacklistEntry {
  id: string;
  entityId: string;
  entityType: EntityType;
  entityName: string;
  reason: string;
  addedAt: Date;
  addedBy: string;
}

export interface WhitelistEntry {
  id: string;
  entityId: string;
  entityType: EntityType;
  entityName: string;
  reason: string;
  addedAt: Date;
  addedBy: string;
}

export const mockBlacklist: BlacklistEntry[] = [
  {
    id: 'black-001',
    entityId: 'comp-005',
    entityType: 'company',
    entityName: '永辉超市',
    reason: '多次发布虚假招聘信息，被求职者投诉',
    addedAt: new Date('2024-06-05'),
    addedBy: 'admin-001',
  },
  {
    id: 'black-002',
    entityId: 'talent-006',
    entityType: 'talent',
    entityName: '赵前台',
    reason: '提供虚假工作经历，多次爽约面试',
    addedAt: new Date('2024-06-10'),
    addedBy: 'admin-001',
  },
];

export const mockWhitelist: WhitelistEntry[] = [
  {
    id: 'white-001',
    entityId: 'comp-001',
    entityType: 'company',
    entityName: '锦江国际酒店管理集团',
    reason: '知名连锁企业，合作历史良好，无不良记录',
    addedAt: new Date('2024-02-01'),
    addedBy: 'admin-001',
  },
  {
    id: 'white-002',
    entityId: 'comp-002',
    entityType: 'company',
    entityName: '海底捞火锅连锁',
    reason: '行业标杆企业，招聘流程规范，员工满意度高',
    addedAt: new Date('2024-03-15'),
    addedBy: 'admin-001',
  },
];

export const mockJobs: JobDescription[] = [
  {
    id: 'job-001',
    companyId: 'comp-001',
    company: mockCompanies[0],
    title: '五星级酒店前台接待',
    industry: 'hotel',
    description: '负责酒店前台接待工作，为客人提供专业、热情的服务。包括办理入住退房、解答咨询、处理投诉等。',
    skillRadar: generateSkillRadar({ professional: 85, communication: 90, service: 95 }),
    scheduleFlexibility: 'shift',
    salary: {
      base: 5500,
      performance: 1500,
      commission: 500,
      benefits: ['五险一金', '免费食宿', '节日福利', '年度体检'],
      currency: 'CNY',
    },
    location: '上海市浦东新区世纪大道1号',
    geoLat: 31.2304,
    geoLng: 121.4737,
    requirements: ['3年以上星级酒店前台经验', '良好的英语沟通能力', '形象气质佳'],
    benefits: ['五险一金', '带薪年假', '节日福利', '员工折扣'],
    createdAt: new Date('2024-06-01'),
    status: 'published',
  },
  {
    id: 'job-002',
    companyId: 'comp-001',
    company: mockCompanies[0],
    title: '酒店餐饮部主管',
    industry: 'hotel',
    description: '负责酒店餐饮部的日常运营管理，确保服务质量和客户满意度。',
    skillRadar: generateSkillRadar({ professional: 90, teamwork: 88, stress: 85 }),
    scheduleFlexibility: 'shift',
    salary: {
      base: 8000,
      performance: 2500,
      commission: 1000,
      benefits: ['五险一金', '绩效奖金', '管理津贴'],
      currency: 'CNY',
    },
    location: '上海市浦东新区世纪大道1号',
    geoLat: 31.2304,
    geoLng: 121.4737,
    requirements: ['5年以上餐饮管理经验', '熟悉五星级酒店运营标准'],
    benefits: ['五险一金', '管理培训', '晋升通道'],
    createdAt: new Date('2024-06-05'),
    status: 'published',
  },
  {
    id: 'job-003',
    companyId: 'comp-002',
    company: mockCompanies[1],
    title: '火锅店店长',
    industry: 'restaurant',
    description: '负责门店全面管理，包括人员排班、库存管理、客户服务、业绩达成等。',
    skillRadar: generateSkillRadar({ professional: 88, stress: 90, teamwork: 85 }),
    scheduleFlexibility: 'shift',
    salary: {
      base: 12000,
      performance: 5000,
      commission: 3000,
      benefits: ['门店分红', '股权激励', '带薪年假'],
      currency: 'CNY',
    },
    location: '北京市朝阳区三里屯路19号',
    geoLat: 39.9388,
    geoLng: 116.4472,
    requirements: ['3年以上火锅门店管理经验', '具备优秀的团队管理能力'],
    benefits: ['五险一金', '年度旅游', '员工持股计划'],
    createdAt: new Date('2024-06-03'),
    status: 'published',
  },
  {
    id: 'job-004',
    companyId: 'comp-002',
    company: mockCompanies[1],
    title: '资深服务员',
    industry: 'restaurant',
    description: '为顾客提供优质的用餐服务，包括点菜、传菜、结账等工作。',
    skillRadar: generateSkillRadar({ service: 92, communication: 88, teamwork: 80 }),
    scheduleFlexibility: 'shift',
    salary: {
      base: 4500,
      performance: 1000,
      commission: 800,
      benefits: ['包吃包住', '全勤奖', '服务之星奖'],
      currency: 'CNY',
    },
    location: '北京市朝阳区三里屯路19号',
    geoLat: 39.9388,
    geoLng: 116.4472,
    requirements: ['1年以上餐饮服务经验', '能吃苦耐劳，适应快节奏'],
    benefits: ['免费食宿', '每月团建', '生日福利'],
    createdAt: new Date('2024-06-08'),
    status: 'published',
  },
  {
    id: 'job-005',
    companyId: 'comp-003',
    company: mockCompanies[2],
    title: '高级美容师',
    industry: 'beauty',
    description: '为客户提供专业的美容护肤服务，根据客户肤质制定个性化护理方案。',
    skillRadar: generateSkillRadar({ professional: 95, service: 90, communication: 85 }),
    scheduleFlexibility: 'flexible',
    salary: {
      base: 6000,
      performance: 2000,
      commission: 2500,
      benefits: ['产品提成', '服务奖励', '培训补贴'],
      currency: 'CNY',
    },
    location: '广州市天河区珠江新城',
    geoLat: 23.1291,
    geoLng: 113.2644,
    requirements: ['美容师资格证', '3年以上高端美容院经验', '形象气质佳'],
    benefits: ['五险一金', '美容产品福利', '专业培训'],
    createdAt: new Date('2024-06-02'),
    status: 'published',
  },
  {
    id: 'job-006',
    companyId: 'comp-004',
    company: mockCompanies[3],
    title: '养老护理员',
    industry: 'healthcare',
    description: '负责社区老年人的日常护理工作，包括生活照料、康复护理、心理关怀等。',
    skillRadar: generateSkillRadar({ service: 95, patience: 90, communication: 85 } as any),
    scheduleFlexibility: 'shift',
    salary: {
      base: 5000,
      performance: 1500,
      commission: 500,
      benefits: ['护理津贴', '加班补助', '专业培训'],
      currency: 'CNY',
    },
    location: '深圳市南山区科技园',
    geoLat: 22.5431,
    geoLng: 114.0579,
    requirements: ['养老护理员证书', '有爱心和耐心', '1年以上护理经验'],
    benefits: ['五险一金', '免费食宿', '心理辅导'],
    createdAt: new Date('2024-06-04'),
    status: 'published',
  },
  {
    id: 'job-007',
    companyId: 'comp-005',
    company: mockCompanies[4],
    title: '生鲜部门主管',
    industry: 'retail',
    description: '负责超市生鲜部门的运营管理，包括商品陈列、库存管理、质量把控。',
    skillRadar: generateSkillRadar({ professional: 85, stress: 80, teamwork: 78 }),
    scheduleFlexibility: 'shift',
    salary: {
      base: 7000,
      performance: 2000,
      commission: 1000,
      benefits: ['部门奖金', '损耗控制奖'],
      currency: 'CNY',
    },
    location: '福州市鼓楼区五四路',
    geoLat: 26.0745,
    geoLng: 119.2965,
    requirements: ['2年以上生鲜管理经验', '熟悉生鲜商品特性'],
    benefits: ['五险一金', '员工折扣', '节日福利'],
    createdAt: new Date('2024-06-06'),
    status: 'published',
  },
  {
    id: 'job-008',
    companyId: 'comp-006',
    company: mockCompanies[5],
    title: '电商直播运营',
    industry: 'ecommerce',
    description: '负责电商直播的策划和执行，包括选品、脚本撰写、数据分析。',
    skillRadar: generateSkillRadar({ professional: 88, communication: 92, learning: 85 }),
    scheduleFlexibility: 'flexible',
    salary: {
      base: 10000,
      performance: 4000,
      commission: 3000,
      benefits: ['直播GMV提成', '流量奖励'],
      currency: 'CNY',
    },
    location: '北京市海淀区中关村',
    geoLat: 39.9842,
    geoLng: 116.3074,
    requirements: ['2年以上直播运营经验', '有成功案例者优先'],
    benefits: ['五险一金', '弹性工作', '年终奖'],
    createdAt: new Date('2024-06-07'),
    status: 'published',
  },
];

export const mockTalents: TalentProfile[] = [
  {
    id: 'talent-001',
    userId: 'user-001',
    name: '王小明',
    phone: '13912345678',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=talent001',
    certificates: [
      { id: 'cert-001', name: '酒店管理师证书', issuer: '中国旅游饭店业协会', issueDate: new Date('2022-05-10'), verified: true },
      { id: 'cert-002', name: '英语四级证书', issuer: '教育部考试中心', issueDate: new Date('2021-06-15'), verified: true },
    ],
    experienceYears: 4,
    serviceScenarios: ['五星级酒店前台', '高端会所接待', '商务会议服务'],
    scenarioFitScore: 92,
    videoResumeUrl: 'https://example.com/video/resume-001.mp4',
    skillRadar: generateSkillRadar({ professional: 88, communication: 92, service: 94 }),
    preferredIndustries: ['hotel', 'restaurant'],
    expectedSalary: 7000,
    currentLocation: '上海市浦东新区',
    geoLat: 31.2200,
    geoLng: 121.5400,
    tags: ['英语流利', '形象佳', '服务意识强'],
  },
  {
    id: 'talent-002',
    userId: 'user-002',
    name: '李小红',
    phone: '13987654321',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=talent002',
    certificates: [
      { id: 'cert-003', name: '高级美容师证书', issuer: '中国美发美容协会', issueDate: new Date('2021-08-20'), verified: true },
      { id: 'cert-004', name: '皮肤管理师认证', issuer: '国际美容协会', issueDate: new Date('2023-03-10'), expireDate: new Date('2026-03-10'), verified: true },
    ],
    experienceYears: 5,
    serviceScenarios: ['高端美容院', '医疗美容诊所', '皮肤管理中心'],
    scenarioFitScore: 95,
    videoResumeUrl: 'https://example.com/video/resume-002.mp4',
    skillRadar: generateSkillRadar({ professional: 94, service: 91, communication: 87 }),
    preferredIndustries: ['beauty', 'healthcare'],
    expectedSalary: 9000,
    currentLocation: '广州市天河区',
    geoLat: 23.1300,
    geoLng: 113.2700,
    tags: ['技术精湛', '客情维护好', '销售能力强'],
  },
  {
    id: 'talent-003',
    userId: 'user-003',
    name: '张大厨',
    phone: '13811112222',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=talent003',
    certificates: [
      { id: 'cert-005', name: '高级中式烹调师', issuer: '中国烹饪协会', issueDate: new Date('2019-11-05'), verified: true },
    ],
    experienceYears: 8,
    serviceScenarios: ['火锅店后厨', '中餐厅厨师', '餐饮管理'],
    scenarioFitScore: 88,
    videoResumeUrl: 'https://example.com/video/resume-003.mp4',
    skillRadar: generateSkillRadar({ professional: 92, teamwork: 85, stress: 82 }),
    preferredIndustries: ['restaurant', 'hotel'],
    expectedSalary: 15000,
    currentLocation: '北京市朝阳区',
    geoLat: 39.9400,
    geoLng: 116.4500,
    tags: ['川湘菜精通', '成本控制', '团队管理'],
  },
  {
    id: 'talent-004',
    userId: 'user-004',
    name: '刘护士',
    phone: '13733334444',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=talent004',
    certificates: [
      { id: 'cert-006', name: '护士执业证书', issuer: '卫生部', issueDate: new Date('2020-07-01'), verified: true },
      { id: 'cert-007', name: '养老护理师高级', issuer: '民政部职业技能鉴定中心', issueDate: new Date('2022-12-15'), verified: true },
    ],
    experienceYears: 4,
    serviceScenarios: ['医院病房', '养老机构', '家庭护理'],
    scenarioFitScore: 94,
    videoResumeUrl: 'https://example.com/video/resume-004.mp4',
    skillRadar: generateSkillRadar({ professional: 90, service: 95, communication: 88 }),
    preferredIndustries: ['healthcare', 'retail'],
    expectedSalary: 7500,
    currentLocation: '深圳市南山区',
    geoLat: 22.5450,
    geoLng: 114.0600,
    tags: ['有爱心', '专业技能强', '善于沟通'],
  },
  {
    id: 'talent-005',
    userId: 'user-005',
    name: '陈主播',
    phone: '13655556666',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=talent005',
    certificates: [
      { id: 'cert-008', name: '电子商务师', issuer: '中国电子商务协会', issueDate: new Date('2022-09-10'), verified: true },
    ],
    experienceYears: 3,
    serviceScenarios: ['电商直播', '短视频运营', '网络营销'],
    scenarioFitScore: 90,
    videoResumeUrl: 'https://example.com/video/resume-005.mp4',
    skillRadar: generateSkillRadar({ professional: 85, communication: 93, learning: 90 }),
    preferredIndustries: ['ecommerce', 'retail'],
    expectedSalary: 12000,
    currentLocation: '北京市海淀区',
    geoLat: 39.9850,
    geoLng: 116.3100,
    tags: ['镜头感强', '口才好', '数据分析能力'],
  },
  {
    id: 'talent-006',
    userId: 'user-006',
    name: '赵前台',
    phone: '13577778888',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=talent006',
    certificates: [
      { id: 'cert-009', name: '前厅服务员中级', issuer: '职业技能鉴定中心', issueDate: new Date('2023-04-20'), verified: true },
    ],
    experienceYears: 2,
    serviceScenarios: ['酒店前台', '商务中心', '行政接待'],
    scenarioFitScore: 85,
    videoResumeUrl: 'https://example.com/video/resume-006.mp4',
    skillRadar: generateSkillRadar({ professional: 78, communication: 82, service: 88 }),
    preferredIndustries: ['hotel', 'restaurant'],
    expectedSalary: 5500,
    currentLocation: '上海市浦东新区',
    geoLat: 31.2250,
    geoLng: 121.5000,
    tags: ['学习能力强', '形象好', '英语基础'],
  },
];

export const mockMatchResults: MatchResult[] = [
  {
    jobId: 'job-001',
    talentId: 'talent-001',
    talent: mockTalents[0],
    job: mockJobs[0],
    overallScore: 92.5,
    skillMatch: 94,
    experienceMatch: 90,
    locationMatch: 95,
    salaryMatch: 88,
    scenarioMatch: 93,
    reasons: ['技能匹配度极高', '地理位置非常近', '薪资期望匹配', '行业经验丰富'],
    matchedAt: new Date('2024-06-10'),
  },
  {
    jobId: 'job-001',
    talentId: 'talent-006',
    talent: mockTalents[5],
    job: mockJobs[0],
    overallScore: 78.3,
    skillMatch: 75,
    experienceMatch: 65,
    locationMatch: 92,
    salaryMatch: 85,
    scenarioMatch: 80,
    reasons: ['地理位置匹配', '薪资期望匹配', '技能需要提升', '经验稍显不足'],
    matchedAt: new Date('2024-06-10'),
  },
  {
    jobId: 'job-003',
    talentId: 'talent-003',
    talent: mockTalents[2],
    job: mockJobs[2],
    overallScore: 89.7,
    skillMatch: 88,
    experienceMatch: 92,
    locationMatch: 91,
    salaryMatch: 86,
    scenarioMatch: 90,
    reasons: ['餐饮管理经验丰富', '位置匹配', '有团队管理能力'],
    matchedAt: new Date('2024-06-11'),
  },
  {
    jobId: 'job-005',
    talentId: 'talent-002',
    talent: mockTalents[1],
    job: mockJobs[4],
    overallScore: 94.2,
    skillMatch: 96,
    experienceMatch: 93,
    locationMatch: 95,
    salaryMatch: 92,
    scenarioMatch: 95,
    reasons: ['美容技术精湛', '证书齐全', '客户服务能力强', '薪资匹配度高'],
    matchedAt: new Date('2024-06-09'),
  },
  {
    jobId: 'job-006',
    talentId: 'talent-004',
    talent: mockTalents[3],
    job: mockJobs[5],
    overallScore: 91.8,
    skillMatch: 90,
    experienceMatch: 92,
    locationMatch: 94,
    salaryMatch: 88,
    scenarioMatch: 95,
    reasons: ['护理专业背景', '养老经验丰富', '有爱心和耐心', '地理位置近'],
    matchedAt: new Date('2024-06-12'),
  },
  {
    jobId: 'job-008',
    talentId: 'talent-005',
    talent: mockTalents[4],
    job: mockJobs[7],
    overallScore: 88.5,
    skillMatch: 86,
    experienceMatch: 85,
    locationMatch: 92,
    salaryMatch: 88,
    scenarioMatch: 92,
    reasons: ['直播经验丰富', '表达能力强', '地理位置匹配'],
    matchedAt: new Date('2024-06-11'),
  },
];

export const mockSessions: ChatSession[] = [
  {
    id: 'session-001',
    jobId: 'job-001',
    job: mockJobs[0],
    talentId: 'talent-001',
    talent: mockTalents[0],
    hrId: 'hr-001',
    hrName: '张经理',
    encryptionEnabled: true,
    lastMessage: {
      id: 'msg-005',
      sessionId: 'session-001',
      senderId: 'talent-001',
      senderType: 'talent',
      content: '好的，我周四下午2点准时到。',
      type: 'text',
      encrypted: true,
      createdAt: new Date('2024-06-15T14:30:00'),
    },
    lastMessageAt: new Date('2024-06-15T14:30:00'),
    unreadCount: 1,
    createdAt: new Date('2024-06-10'),
  },
  {
    id: 'session-002',
    jobId: 'job-005',
    job: mockJobs[4],
    talentId: 'talent-002',
    talent: mockTalents[1],
    hrId: 'hr-002',
    hrName: '李主管',
    encryptionEnabled: true,
    lastMessage: {
      id: 'msg-008',
      sessionId: 'session-002',
      senderId: 'hr-002',
      senderType: 'hr',
      content: '您的面试已经通过，请下周一来办理入职。',
      type: 'system',
      encrypted: true,
      createdAt: new Date('2024-06-14T10:00:00'),
    },
    lastMessageAt: new Date('2024-06-14T10:00:00'),
    unreadCount: 0,
    createdAt: new Date('2024-06-09'),
  },
  {
    id: 'session-003',
    jobId: 'job-003',
    job: mockJobs[2],
    talentId: 'talent-003',
    talent: mockTalents[2],
    hrId: 'hr-002',
    hrName: '李主管',
    encryptionEnabled: true,
    lastMessage: {
      id: 'msg-010',
      sessionId: 'session-003',
      senderId: 'hr-002',
      senderType: 'hr',
      content: '请问您方便什么时候来面试？',
      type: 'text',
      encrypted: true,
      createdAt: new Date('2024-06-13T16:45:00'),
      readAt: new Date('2024-06-13T17:00:00'),
    },
    lastMessageAt: new Date('2024-06-13T16:45:00'),
    unreadCount: 0,
    createdAt: new Date('2024-06-11'),
  },
];

export const mockMessages: ChatMessage[] = [
  {
    id: 'msg-001',
    sessionId: 'session-001',
    senderId: 'hr-001',
    senderType: 'hr',
    content: '您好，王小明先生，我是锦江国际酒店的张经理，看到您的简历非常匹配我们的前台岗位。',
    type: 'text',
    encrypted: true,
    createdAt: new Date('2024-06-10T10:00:00'),
    readAt: new Date('2024-06-10T10:05:00'),
  },
  {
    id: 'msg-002',
    sessionId: 'session-001',
    senderId: 'talent-001',
    senderType: 'talent',
    content: '张经理您好，感谢您的关注。我对这个岗位很感兴趣，请问具体的工作时间是怎样的？',
    type: 'text',
    encrypted: true,
    createdAt: new Date('2024-06-10T10:08:00'),
    readAt: new Date('2024-06-10T10:10:00'),
  },
  {
    id: 'msg-003',
    sessionId: 'session-001',
    senderId: 'hr-001',
    senderType: 'hr',
    content: '我们实行三班倒，早班7:00-15:00，中班15:00-23:00，晚班23:00-7:00，每周休息两天。',
    type: 'text',
    encrypted: true,
    createdAt: new Date('2024-06-10T10:15:00'),
    readAt: new Date('2024-06-10T10:20:00'),
  },
  {
    id: 'msg-004',
    sessionId: 'session-001',
    senderId: 'hr-001',
    senderType: 'hr',
    content: '我想邀请您本周四下午2点来酒店参加面试，请问您方便吗？',
    type: 'interview_invite',
    encrypted: true,
    createdAt: new Date('2024-06-15T14:00:00'),
    readAt: new Date('2024-06-15T14:25:00'),
  },
  {
    id: 'msg-005',
    sessionId: 'session-001',
    senderId: 'talent-001',
    senderType: 'talent',
    content: '好的，我周四下午2点准时到。',
    type: 'text',
    encrypted: true,
    createdAt: new Date('2024-06-15T14:30:00'),
  },
];

export const mockInterviewInvites: InterviewInvite[] = [
  {
    id: 'invite-001',
    sessionId: 'session-001',
    jobId: 'job-001',
    talentId: 'talent-001',
    hrId: 'hr-001',
    interviewTime: new Date('2024-06-20T14:00:00'),
    location: '上海市浦东新区世纪大道1号，锦江酒店15楼人力资源部',
    notes: '请携带身份证、学历证书原件及复印件，正装出席。',
    status: 'accepted',
    createdAt: new Date('2024-06-15T14:00:00'),
  },
  {
    id: 'invite-002',
    sessionId: 'session-002',
    jobId: 'job-005',
    talentId: 'talent-002',
    hrId: 'hr-002',
    interviewTime: new Date('2024-06-18T10:00:00'),
    location: '广州市天河区珠江新城，美丽田园总部3楼',
    notes: '请准备一段5分钟的护肤手法展示。',
    status: 'completed',
    createdAt: new Date('2024-06-12T09:00:00'),
  },
  {
    id: 'invite-003',
    sessionId: 'session-003',
    jobId: 'job-003',
    talentId: 'talent-003',
    hrId: 'hr-002',
    interviewTime: new Date('2024-06-19T15:00:00'),
    location: '北京市朝阳区三里屯路19号，海底捞总部',
    notes: '有实操考核环节，请穿舒适服装。',
    status: 'pending',
    createdAt: new Date('2024-06-13T16:45:00'),
  },
];

export const mockRecruitmentMetrics: RecruitmentMetrics = {
  avgFillDays: 12.5,
  channelFunnel: [
    { channel: '平台推荐', views: 1520, applications: 156, interviews: 48, hires: 12 },
    { channel: '主动搜索', views: 890, applications: 89, interviews: 32, hires: 8 },
    { channel: '企业直聘', views: 650, applications: 78, interviews: 25, hires: 6 },
    { channel: '内部推荐', views: 120, applications: 35, interviews: 18, hires: 5 },
  ],
  retentionRate: 85.5,
  costPerHire: 1250,
  timeToHireByRole: {
    '前台接待': 8,
    '美容师': 15,
    '餐饮店长': 22,
    '直播运营': 18,
  },
};

export const mockRiskScores: RiskScore[] = [
  {
    id: 'risk-001',
    entityId: 'comp-003',
    entityType: 'company',
    riskLevel: 'medium',
    riskFactors: ['营业执照待审核', '行业认证不全', '过往3个月有1笔投诉记录'],
    overallScore: 72,
    evaluatedAt: new Date('2024-06-15'),
  },
  {
    id: 'risk-002',
    entityId: 'talent-006',
    entityType: 'talent',
    riskLevel: 'low',
    riskFactors: ['工作经历需核实', '学历证书待验证'],
    overallScore: 88,
    evaluatedAt: new Date('2024-06-14'),
  },
  {
    id: 'risk-003',
    entityId: 'job-006',
    entityType: 'job',
    riskLevel: 'high',
    riskFactors: ['薪资范围异常偏高', '岗位描述与行业标准不符', '发布IP地址异常'],
    overallScore: 45,
    evaluatedAt: new Date('2024-06-16'),
  },
  {
    id: 'risk-004',
    entityId: 'comp-005',
    entityType: 'company',
    riskLevel: 'high',
    riskFactors: ['多次被求职者投诉', '资质审核未通过', '存在经营异常记录'],
    overallScore: 38,
    evaluatedAt: new Date('2024-06-15'),
  },
  {
    id: 'risk-005',
    entityId: 'comp-004',
    entityType: 'company',
    riskLevel: 'medium',
    riskFactors: ['部分认证即将过期', '需要补充消防验收证明'],
    overallScore: 78,
    evaluatedAt: new Date('2024-06-16'),
  },
  {
    id: 'risk-006',
    entityId: 'talent-003',
    entityType: 'talent',
    riskLevel: 'low',
    riskFactors: ['技能证书需要更新验证'],
    overallScore: 92,
    evaluatedAt: new Date('2024-06-13'),
  },
  {
    id: 'risk-007',
    entityId: 'job-004',
    entityType: 'job',
    riskLevel: 'medium',
    riskFactors: ['工作时间描述模糊', '薪资范围跨度较大'],
    overallScore: 75,
    evaluatedAt: new Date('2024-06-16'),
  },
  {
    id: 'risk-008',
    entityId: 'comp-006',
    entityType: 'company',
    riskLevel: 'low',
    riskFactors: ['新入驻企业，需要观察'],
    overallScore: 85,
    evaluatedAt: new Date('2024-06-16'),
  },
];

export interface RiskScoreHistory {
  date: string;
  score: number;
}

export const mockRiskScoreHistories: Record<string, RiskScoreHistory[]> = {
  'risk-001': [
    { date: '06-10', score: 85 },
    { date: '06-11', score: 82 },
    { date: '06-12', score: 80 },
    { date: '06-13', score: 78 },
    { date: '06-14', score: 75 },
    { date: '06-15', score: 72 },
  ],
  'risk-003': [
    { date: '06-11', score: 68 },
    { date: '06-12', score: 62 },
    { date: '06-13', score: 58 },
    { date: '06-14', score: 52 },
    { date: '06-15', score: 48 },
    { date: '06-16', score: 45 },
  ],
  'risk-004': [
    { date: '06-10', score: 55 },
    { date: '06-11', score: 52 },
    { date: '06-12', score: 48 },
    { date: '06-13', score: 45 },
    { date: '06-14', score: 42 },
    { date: '06-15', score: 38 },
  ],
};

const regions = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安'];
const industries = ['hotel', 'restaurant', 'beauty', 'healthcare', 'retail', 'ecommerce'] as const;
const trends = ['rising', 'stable', 'falling'] as const;

export const mockRegionalLaborData: RegionalLaborData[] = regions.flatMap((region, idx) => 
  industries.map((industry, i) => ({
    id: `labor-${idx}-${i}`,
    region,
    regionCode: `REG${(idx + 1).toString().padStart(3, '0')}`,
    industry,
    demandCount: randomInRange(500, 5000),
    supplyCount: randomInRange(400, 4500),
    gapRatio: Number((Math.random() * 0.5).toFixed(2)),
    avgSalary: randomInRange(4000, 15000),
    heatIndex: randomInRange(40, 95),
    trend: trends[randomInRange(0, 2)],
    dataDate: new Date('2024-06-01'),
  }))
);

export const mockKnowledgeGraphs: KnowledgeGraph[] = [
  {
    id: 'kg-001',
    industry: 'hotel',
    jobTitle: '前台接待',
    requiredSkills: ['客户服务', '沟通能力', '英语基础', 'PMS系统操作', '问题解决'],
    recommendedCourses: ['酒店服务礼仪', '前厅操作实务', '酒店英语会话', '客户投诉处理'],
    promotionPaths: [
      { id: 'pp-001', from: '前台接待', to: '前台主管', avgYears: 2, requiredSkills: ['团队管理', '培训能力'] },
      { id: 'pp-002', from: '前台主管', to: '前厅部经理', avgYears: 3, requiredSkills: ['预算管理', '收益管理'] },
      { id: 'pp-003', from: '前厅部经理', to: '房务总监', avgYears: 5, requiredSkills: ['战略规划', '跨部门协调'] },
    ],
  },
  {
    id: 'kg-002',
    industry: 'restaurant',
    jobTitle: '服务员',
    requiredSkills: ['餐桌服务', '菜品知识', '酒水知识', '收银操作', '客户关系'],
    recommendedCourses: ['餐饮服务流程', '食品安全知识', '销售技巧', '宴会服务'],
    promotionPaths: [
      { id: 'pp-004', from: '服务员', to: '领班', avgYears: 1.5, requiredSkills: ['岗位培训', '班次管理'] },
      { id: 'pp-005', from: '领班', to: '餐厅主管', avgYears: 2.5, requiredSkills: ['排班管理', '库存管理'] },
      { id: 'pp-006', from: '餐厅主管', to: '店长', avgYears: 3, requiredSkills: ['财务管理', '人员招聘'] },
    ],
  },
  {
    id: 'kg-003',
    industry: 'beauty',
    jobTitle: '美容师',
    requiredSkills: ['皮肤分析', '美容手法', '产品知识', '仪器操作', '客情维护'],
    recommendedCourses: ['皮肤生理学', '美容仪器操作', '问题性皮肤护理', '销售心理学'],
    promotionPaths: [
      { id: 'pp-007', from: '美容师', to: '高级美容师', avgYears: 2, requiredSkills: ['专项技术', '客户管理'] },
      { id: 'pp-008', from: '高级美容师', to: '技术总监', avgYears: 3, requiredSkills: ['技术培训', '项目研发'] },
      { id: 'pp-009', from: '技术总监', to: '门店经理', avgYears: 4, requiredSkills: ['门店运营', '团队建设'] },
    ],
  },
];

export const generateJobFromPainPoint = (painPoint: string): Partial<JobDescription> => {
  const keywords = painPoint.toLowerCase();
  
  let industry: typeof industries[number] = 'hotel';
  let title = '待确定岗位';
  let skillRadar = generateSkillRadar();
  let scheduleFlexibility: 'fixed' | 'flexible' | 'shift' = 'fixed';
  let baseSalary = 5000;
  let requirements: string[] = [];
  
  if (keywords.includes('酒店') || keywords.includes('宾馆') || keywords.includes('hotel')) {
    industry = 'hotel';
    if (keywords.includes('前台')) {
      title = '酒店前台接待';
      skillRadar = generateSkillRadar({ communication: 90, service: 92, professional: 85 });
      requirements = ['良好的沟通能力', '服务意识强', '有酒店工作经验优先'];
    } else if (keywords.includes('餐饮')) {
      title = '酒店餐饮主管';
      skillRadar = generateSkillRadar({ professional: 88, teamwork: 85, stress: 82 });
      requirements = ['餐饮管理经验', '团队领导能力', '成本控制意识'];
    }
    if (keywords.includes('三班倒') || keywords.includes('轮班')) {
      scheduleFlexibility = 'shift';
    }
    baseSalary = 5500;
  } else if (keywords.includes('餐饮') || keywords.includes('餐厅') || keywords.includes('火锅') || keywords.includes('饭店')) {
    industry = 'restaurant';
    if (keywords.includes('店长') || keywords.includes('经理')) {
      title = '餐饮门店店长';
      skillRadar = generateSkillRadar({ professional: 90, stress: 88, teamwork: 85 });
      baseSalary = 12000;
      requirements = ['3年以上餐饮管理经验', '团队管理能力', '业绩导向'];
    } else {
      title = '餐饮服务员';
      skillRadar = generateSkillRadar({ service: 90, communication: 85, teamwork: 80 });
      baseSalary = 4500;
      requirements = ['能吃苦耐劳', '服务热情', '有餐饮经验优先'];
    }
    scheduleFlexibility = 'shift';
  } else if (keywords.includes('美容') || keywords.includes('美甲') || keywords.includes('美业')) {
    industry = 'beauty';
    title = '高级美容师';
    skillRadar = generateSkillRadar({ professional: 92, service: 88, communication: 85 });
    baseSalary = 6000;
    scheduleFlexibility = 'flexible';
    requirements = ['美容师资格证', '相关工作经验', '形象气质佳'];
  } else if (keywords.includes('康养') || keywords.includes('养老') || keywords.includes('护理')) {
    industry = 'healthcare';
    title = '养老护理员';
    skillRadar = generateSkillRadar({ service: 94, patience: 90, communication: 85 } as any);
    baseSalary = 5000;
    scheduleFlexibility = 'shift';
    requirements = ['养老护理员证书', '有爱心耐心', '护理专业背景'];
  } else if (keywords.includes('超市') || keywords.includes('零售') || keywords.includes('收银')) {
    industry = 'retail';
    title = '零售门店主管';
    skillRadar = generateSkillRadar({ professional: 85, stress: 80, teamwork: 78 });
    baseSalary = 7000;
    scheduleFlexibility = 'shift';
    requirements = ['零售管理经验', '商品知识', '客户服务意识'];
  } else if (keywords.includes('电商') || keywords.includes('直播') || keywords.includes('运营')) {
    industry = 'ecommerce';
    title = '电商直播运营';
    skillRadar = generateSkillRadar({ professional: 88, communication: 90, learning: 85 });
    baseSalary = 10000;
    scheduleFlexibility = 'flexible';
    requirements = ['直播运营经验', '数据分析能力', '内容创作能力'];
  }
  
  if (keywords.includes('经验') || keywords.includes('年')) {
    const years = keywords.match(/(\d+)\s*年/);
    if (years) {
      requirements.push(`${years[1]}年以上相关工作经验`);
    }
  }
  
  if (keywords.includes('急') || keywords.includes('马上') || keywords.includes('急需')) {
    requirements.push('能尽快到岗者优先');
  }
  
  return {
    title,
    industry,
    description: painPoint,
    skillRadar,
    scheduleFlexibility,
    salary: {
      base: baseSalary,
      performance: Math.floor(baseSalary * 0.25),
      commission: Math.floor(baseSalary * 0.15),
      benefits: ['五险一金', '节日福利', '带薪年假'],
      currency: 'CNY',
    },
    requirements,
    benefits: ['五险一金', '带薪年假', '节日福利', '年度体检'],
    status: 'draft',
  };
};

export const calculateMatchScore = (job: JobDescription, talent: TalentProfile): MatchResult => {
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };
  
  const skillMatch = Object.keys(job.skillRadar).reduce((acc, key) => {
    const k = key as keyof typeof job.skillRadar;
    const jobSkill = job.skillRadar[k];
    const talentSkill = talent.skillRadar[k];
    const diff = Math.abs(jobSkill - talentSkill);
    return acc + Math.max(0, 100 - diff * 2);
  }, 0) / 6;
  
  const experienceDiff = Math.abs(talent.experienceYears - 3);
  const experienceMatch = Math.max(0, 100 - experienceDiff * 10);
  
  const distance = calculateDistance(job.geoLat, job.geoLng, talent.geoLat, talent.geoLng);
  const locationMatch = Math.max(0, 100 - distance * 2);
  
  const salaryDiff = Math.abs(talent.expectedSalary - job.salary.base);
  const salaryMatch = Math.max(0, 100 - (salaryDiff / job.salary.base) * 50);
  
  const scenarioOverlap = talent.serviceScenarios.filter(s => 
    job.description.includes(s) || job.title.includes(s)
  ).length;
  const scenarioMatch = Math.min(100, 60 + scenarioOverlap * 20);
  
  const overallScore = (skillMatch * 0.3 + experienceMatch * 0.2 + locationMatch * 0.2 + salaryMatch * 0.15 + scenarioMatch * 0.15);
  
  const reasons: string[] = [];
  if (skillMatch >= 85) reasons.push('技能匹配度高');
  if (experienceMatch >= 80) reasons.push('工作经验匹配');
  if (locationMatch >= 85) reasons.push('地理位置近');
  if (salaryMatch >= 80) reasons.push('薪资期望匹配');
  if (scenarioMatch >= 80) reasons.push('服务场景适配度高');
  if (skillMatch < 70) reasons.push('部分技能有待提升');
  if (distance > 20) reasons.push('通勤距离稍远');
  
  return {
    jobId: job.id,
    talentId: talent.id,
    job,
    talent,
    overallScore: Number(overallScore.toFixed(1)),
    skillMatch: Number(skillMatch.toFixed(0)),
    experienceMatch: Number(experienceMatch.toFixed(0)),
    locationMatch: Number(locationMatch.toFixed(0)),
    salaryMatch: Number(salaryMatch.toFixed(0)),
    scenarioMatch: Number(scenarioMatch.toFixed(0)),
    reasons,
    matchedAt: new Date(),
  };
};
