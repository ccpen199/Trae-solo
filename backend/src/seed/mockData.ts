import { v4 as uuidv4 } from 'uuid';
import { Company, Job, Graduate, JobFair, School, User, IndustryZone, CreditLevel, JobStatus, FairStatus } from '../types';
import { getDivisionIdByCode } from './yunnanDivisions';

export function generateMockCompanies(): Company[] {
  const companyTemplates = [
    { name: '昆明机床制造有限公司', zone: IndustryZone.DIANZHONG_MANUFACTURING, credit: CreditLevel.AAA, industry: '装备制造', code: '530102' },
    { name: '云南锡业集团有限责任公司', zone: IndustryZone.HONGHE_METALLURGY, credit: CreditLevel.AA, industry: '有色金属', code: '532501' },
    { name: '普洱市茶产业发展集团', zone: IndustryZone.PUER_TEA, credit: CreditLevel.AA, industry: '茶叶加工', code: '530802' },
    { name: '西双版纳国际旅行社', zone: IndustryZone.XISHUANGBANNA_TOURISM, credit: CreditLevel.A, industry: '旅游业', code: '532801' },
    { name: '昆明高新技术产业开发公司', zone: IndustryZone.KUNMING_IT, credit: CreditLevel.AA, industry: '信息技术', code: '530114' },
    { name: '玉溪红塔集团', zone: IndustryZone.YUXI_TOBACCO, credit: CreditLevel.AAA, industry: '烟草', code: '530402' },
    { name: '曲靖煤化工集团', zone: IndustryZone.QUJING_ENERGY, credit: CreditLevel.AA, industry: '能源化工', code: '530302' },
    { name: '大理文化旅游投资集团', zone: IndustryZone.DALI_CULTURE, credit: CreditLevel.A, industry: '文化旅游', code: '532901' },
    { name: '云南白药集团', zone: IndustryZone.DIANZHONG_MANUFACTURING, credit: CreditLevel.AAA, industry: '医药制造', code: '530111' },
    { name: '勐海茶厂', zone: IndustryZone.PUER_TEA, credit: CreditLevel.AA, industry: '茶叶加工', code: '530822' },
    { name: '西双版纳万达主题乐园', zone: IndustryZone.XISHUANGBANNA_TOURISM, credit: CreditLevel.A, industry: '旅游娱乐', code: '532801' },
    { name: '昆明云内动力股份有限公司', zone: IndustryZone.DIANZHONG_MANUFACTURING, credit: CreditLevel.AA, industry: '内燃机制造', code: '530111' },
    { name: '个旧冶金集团', zone: IndustryZone.HONGHE_METALLURGY, credit: CreditLevel.A, industry: '有色金属冶炼', code: '532501' },
    { name: '云南锗业股份有限公司', zone: IndustryZone.QUJING_ENERGY, credit: CreditLevel.A, industry: '稀有金属', code: '530324' },
    { name: '云南南天电子信息产业股份有限公司', zone: IndustryZone.KUNMING_IT, credit: CreditLevel.A, industry: '软件服务', code: '530114' },
    { name: '云南诺仕达集团', zone: IndustryZone.DALI_CULTURE, credit: CreditLevel.AA, industry: '文化产业', code: '530112' },
    { name: '大理药业股份有限公司', zone: IndustryZone.DIANZHONG_MANUFACTURING, credit: CreditLevel.A, industry: '医药制造', code: '532901' },
    { name: '云南铜业股份有限公司', zone: IndustryZone.HONGHE_METALLURGY, credit: CreditLevel.AA, industry: '铜冶炼', code: '530102' },
    { name: '云南铝业股份有限公司', zone: IndustryZone.QUJING_ENERGY, credit: CreditLevel.AA, industry: '铝冶炼', code: '530111' },
    { name: '西双版纳傣族园有限公司', zone: IndustryZone.XISHUANGBANNA_TOURISM, credit: CreditLevel.A, industry: '旅游景区', code: '532823' },
  ];

  return companyTemplates.map((tpl, index) => ({
    id: uuidv4(),
    name: tpl.name,
    unified_social_credit_code: `91530${String(index + 1).padStart(10, '0')}`,
    registration_number: `YN${String(index + 1).padStart(8, '0')}`,
    labor_filing_number: `YN-LB-${String(index + 1).padStart(8, '0')}`,
    credit_level: tpl.credit,
    industry: tpl.industry,
    industry_zone: tpl.zone,
    admin_division_id: getDivisionIdByCode(tpl.code) || '',
    address: `${tpl.code}片区工业园区${index + 1}号`,
    legal_representative: `法定代表人${index + 1}`,
    contact_person: `联系人${index + 1}`,
    contact_phone: `138${String(index + 1).padStart(8, '0')}`,
    description: `${tpl.name}是云南省${tpl.industry}行业的重点企业，致力于推动区域经济发展。`,
    employee_count: 500 + index * 100,
    verified: true,
    created_at: new Date(Date.now() - index * 30 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

export function generateMockJobs(companyIds: string[]): Job[] {
  const jobTemplates = [
    { title: '机械工程师', category: '技术研发', salaryMin: 8000, salaryMax: 15000, zone: IndustryZone.DIANZHONG_MANUFACTURING, companyIdx: 0 },
    { title: '电气工程师', category: '技术研发', salaryMin: 7000, salaryMax: 13000, zone: IndustryZone.DIANZHONG_MANUFACTURING, companyIdx: 0 },
    { title: '冶炼工艺师', category: '技术研发', salaryMin: 9000, salaryMax: 18000, zone: IndustryZone.HONGHE_METALLURGY, companyIdx: 1 },
    { title: '质量管理专员', category: '质量管理', salaryMin: 5000, salaryMax: 9000, zone: IndustryZone.HONGHE_METALLURGY, companyIdx: 1 },
    { title: '茶叶品鉴师', category: '技术研发', salaryMin: 6000, salaryMax: 12000, zone: IndustryZone.PUER_TEA, companyIdx: 2 },
    { title: '茶艺培训师', category: '教育培训', salaryMin: 4500, salaryMax: 8000, zone: IndustryZone.PUER_TEA, companyIdx: 2 },
    { title: '旅游产品经理', category: '产品策划', salaryMin: 7000, salaryMax: 14000, zone: IndustryZone.XISHUANGBANNA_TOURISM, companyIdx: 3 },
    { title: '导游', category: '客户服务', salaryMin: 4000, salaryMax: 8000, zone: IndustryZone.XISHUANGBANNA_TOURISM, companyIdx: 3 },
    { title: 'Java开发工程师', category: '技术研发', salaryMin: 10000, salaryMax: 25000, zone: IndustryZone.KUNMING_IT, companyIdx: 4 },
    { title: '前端开发工程师', category: '技术研发', salaryMin: 9000, salaryMax: 20000, zone: IndustryZone.KUNMING_IT, companyIdx: 4 },
    { title: '数据分析师', category: '数据分析', salaryMin: 8000, salaryMax: 16000, zone: IndustryZone.KUNMING_IT, companyIdx: 4 },
    { title: '生产管理岗', category: '生产运营', salaryMin: 6000, salaryMax: 12000, zone: IndustryZone.YUXI_TOBACCO, companyIdx: 5 },
    { title: '机电维修工', category: '后勤保障', salaryMin: 4000, salaryMax: 7000, zone: IndustryZone.YUXI_TOBACCO, companyIdx: 5 },
    { title: '化工工程师', category: '技术研发', salaryMin: 8000, salaryMax: 16000, zone: IndustryZone.QUJING_ENERGY, companyIdx: 6 },
    { title: '设备运维岗', category: '技术支持', salaryMin: 5000, salaryMax: 10000, zone: IndustryZone.QUJING_ENERGY, companyIdx: 6 },
    { title: '文旅策划师', category: '产品策划', salaryMin: 6000, salaryMax: 12000, zone: IndustryZone.DALI_CULTURE, companyIdx: 7 },
    { title: '新媒体运营', category: '市场营销', salaryMin: 4500, salaryMax: 9000, zone: IndustryZone.DALI_CULTURE, companyIdx: 7 },
    { title: '药品研发专员', category: '技术研发', salaryMin: 8000, salaryMax: 15000, zone: IndustryZone.DIANZHONG_MANUFACTURING, companyIdx: 8 },
    { title: '车间主任', category: '生产运营', salaryMin: 7000, salaryMax: 14000, zone: IndustryZone.DIANZHONG_MANUFACTURING, companyIdx: 11 },
    { title: '国际业务专员', category: '市场营销', salaryMin: 5000, salaryMax: 10000, zone: IndustryZone.PUER_TEA, companyIdx: 9 },
    { title: '销售经理', category: '市场营销', salaryMin: 6000, salaryMax: 20000, zone: IndustryZone.DIANZHONG_MANUFACTURING, companyIdx: 8 },
    { title: '人力资源专员', category: '人力资源', salaryMin: 4000, salaryMax: 8000, zone: IndustryZone.DIANZHONG_MANUFACTURING, companyIdx: 0 },
    { title: '财务会计', category: '财务管理', salaryMin: 4500, salaryMax: 9000, zone: IndustryZone.DIANZHONG_MANUFACTURING, companyIdx: 17 },
    { title: '行政助理', category: '行政管理', salaryMin: 3500, salaryMax: 6000, zone: IndustryZone.DIANZHONG_MANUFACTURING, companyIdx: 18 },
  ];

  const statuses = [JobStatus.PUBLISHED, JobStatus.PUBLISHED, JobStatus.PUBLISHED, JobStatus.CLOSED];
  const jobs: Job[] = [];

  jobTemplates.forEach((tpl, index) => {
    const companyId = companyIds[tpl.companyIdx % companyIds.length];
    const divCode = ['530102', '530103', '530111', '530112', '530114'][index % 5];
    const locationId = getDivisionIdByCode(divCode) || companyIds[0];
    const status = statuses[index % statuses.length];
    const now = new Date();

    jobs.push({
      id: uuidv4(),
      company_id: companyId,
      title: tpl.title,
      industry_zone: tpl.zone,
      category: tpl.category,
      salary_min: tpl.salaryMin,
      salary_max: tpl.salaryMax,
      salary_negotiable: false,
      location_id: locationId,
      address: `${divCode}片区办公地址`,
      description: `负责${tpl.title}相关工作，要求具有相关专业背景和工作经验。`,
      requirements: `本科及以上学历，${tpl.category}相关专业，具有团队协作精神。`,
      benefits: '五险一金、带薪年假、节日福利、年终奖金',
      quantity: 2 + (index % 5),
      status: status,
      publish_date: status === JobStatus.PUBLISHED ? new Date(now.getTime() - index * 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      expiry_date: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      view_count: 100 + index * 50,
      application_count: 10 + index * 3,
      created_at: new Date(now.getTime() - index * 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: now.toISOString(),
    });
  });

  return jobs;
}

export function generateMockGraduates(): Graduate[] {
  const schools = ['云南大学', '昆明理工大学', '云南师范大学', '云南农业大学', '西南林业大学', '云南财经大学', '昆明医科大学', '云南民族大学', '大理大学', '云南中医药大学'];
  const majors = ['计算机科学与技术', '软件工程', '机械工程', '电气工程', '工商管理', '金融学', '市场营销', '旅游管理', '茶学', '汉语言文学', '化学工程', '土木工程', '环境工程', '生物工程', '临床医学'];
  const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十', '陈一', '林二', '黄三', '刘四', '杨五', '何六', '马七', '朱八', '胡九', '郭十', '林十一', '钱十二'];
  const statuses: Array<'unemployed' | 'employed' | 'postgraduate' | 'other'> = ['employed', 'employed', 'unemployed', 'employed', 'postgraduate', 'unemployed', 'employed', 'employed', 'other', 'unemployed'];

  const graduates: Graduate[] = [];

  for (let i = 0; i < 50; i++) {
    const school = schools[i % schools.length];
    const major = majors[i % majors.length];
    const name = names[i % names.length];
    const status = statuses[i % statuses.length];
    const divCode = ['530102', '530302', '530402', '530502', '530602', '530702', '530802', '530902', '532301', '532501', '532601', '532801', '532901', '533102', '533301', '533401'][i % 16];

    const skills = ['Java', 'Python', 'C++', 'Excel', '英语六级', '普通话二甲', 'AutoCAD', 'PhotoShop', 'SQL', '数据分析'];
    const selectedSkills = skills.slice(i % 3, (i % 3) + 3);

    graduates.push({
      id: uuidv4(),
      name: name,
      id_card: `530${String(i + 1).padStart(14, '0')}`,
      student_id: `2020${String(i + 1).padStart(6, '0')}`,
      school: school,
      major: major,
      education_level: '本科',
      graduation_date: '2024-07-01',
      phone: `135${String(i + 1).padStart(8, '0')}`,
      email: `student${i + 1}@yunnan.edu.cn`,
      resume_url: `/resumes/${i + 1}.pdf`,
      employment_status: status,
      employed_company_id: null,
      employed_job_id: null,
      verification_status: 'verified',
      admin_division_id: getDivisionIdByCode(divCode) || '',
      skills: selectedSkills,
      internships: [
        {
          id: uuidv4(),
          graduate_id: '',
          company_name: `${school}实习企业${i + 1}`,
          position: `${major}实习生`,
          start_date: '2023-07-01',
          end_date: '2023-10-01',
          description: '参与公司核心项目研发，学习行业知识和技能。',
        },
      ],
      certificates: [
        {
          id: uuidv4(),
          graduate_id: '',
          name: '大学英语六级',
          issuer: '教育部考试中心',
          issue_date: '2022-12-01',
          certificate_number: `CET6-${String(i + 1).padStart(10, '0')}`,
        },
        {
          id: uuidv4(),
          graduate_id: '',
          name: '计算机二级',
          issuer: '教育部考试中心',
          issue_date: '2021-09-01',
          certificate_number: `NCRE-${String(i + 1).padStart(10, '0')}`,
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return graduates;
}

export function generateMockJobFairs(): JobFair[] {
  const fairs = [
    { title: '云南省2024年春季大型招聘会', code: '530000', organizer: '云南省人力资源和社会保障厅', isLive: false, location: '昆明国际会展中心' },
    { title: '昆明市高校毕业生专场招聘会', code: '530100', organizer: '昆明市人力资源和社会保障局', isLive: true, location: '昆明人才市场' },
    { title: '曲靖市制造业专场招聘会', code: '530300', organizer: '曲靖市人力资源和社会保障局', isLive: true, location: '曲靖市人才服务中心' },
    { title: '玉溪市烟草产业专场招聘会', code: '530400', organizer: '玉溪市人力资源和社会保障局', isLive: false, location: '玉溪市人力资源市场' },
    { title: '普洱市茶产业人才招聘会', code: '530800', organizer: '普洱市人力资源和社会保障局', isLive: true, location: '普洱市人才交流中心' },
    { title: '西双版纳州旅游人才专场招聘会', code: '532800', organizer: '西双版纳州人力资源和社会保障局', isLive: true, location: '景洪市会展中心' },
    { title: '大理州文化旅游产业招聘会', code: '532900', organizer: '大理州人力资源和社会保障局', isLive: false, location: '大理市人才市场' },
    { title: '楚雄州生物医药产业专场招聘会', code: '532300', organizer: '楚雄州人力资源和社会保障局', isLive: true, location: '楚雄市人才服务中心' },
    { title: '红河州有色金属产业招聘会', code: '532500', organizer: '红河州人力资源和社会保障局', isLive: false, location: '个旧市人才市场' },
    { title: '云南省2024年夏季大型招聘会', code: '530000', organizer: '云南省人力资源和社会保障厅', isLive: true, location: '昆明滇池国际会展中心' },
  ];

  const statuses = [FairStatus.UPCOMING, FairStatus.ONGOING, FairStatus.ENDED];

  return fairs.map((fair, index) => {
    const now = new Date();
    const startDate = new Date(now.getTime() + (index - 2) * 30 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    let status = FairStatus.UPCOMING;
    if (endDate < now) status = FairStatus.ENDED;
    else if (startDate <= now) status = FairStatus.ONGOING;

    return {
      id: uuidv4(),
      title: fair.title,
      admin_division_id: getDivisionIdByCode(fair.code) || '',
      organizer: fair.organizer,
      location: fair.location,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
      status: status,
      description: `${fair.title}将于${startDate.toLocaleDateString()}举办，诚邀各用人单位和求职者参加。`,
      max_companies: 200 + index * 50,
      registered_companies: Math.min(150 + index * 30, 200 + index * 50 - 10),
      max_visitors: 5000 + index * 1000,
      registered_visitors: Math.min(3000 + index * 800, 5000 + index * 1000 - 200),
      is_live: status !== FairStatus.ENDED && fair.isLive ? true : false,
      live_url: status !== FairStatus.ENDED && fair.isLive ? `https://live.yunnan-job.com/fair/${index + 1}` : '',
      created_at: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: now.toISOString(),
    };
  });
}

export function generateMockSchools(): School[] {
  const schools = [
    { name: '云南大学', code: '530102', type: 'university' as const, majors: ['计算机科学与技术', '软件工程', '经济学', '法学'] },
    { name: '昆明理工大学', code: '530111', type: 'university' as const, majors: ['机械工程', '电气工程', '土木工程', '冶金工程'] },
    { name: '云南师范大学', code: '530103', type: 'university' as const, majors: ['汉语言文学', '数学与应用数学', '教育学', '英语'] },
    { name: '云南农业大学', code: '530112', type: 'university' as const, majors: ['农学', '茶学', '园艺', '植物保护'] },
    { name: '云南财经大学', code: '530102', type: 'university' as const, majors: ['会计学', '金融学', '工商管理', '市场营销'] },
    { name: '昆明医科大学', code: '530114', type: 'university' as const, majors: ['临床医学', '药学', '护理学', '预防医学'] },
    { name: '云南民族大学', code: '530103', type: 'university' as const, majors: ['民族学', '社会学', '泰语', '越南语'] },
    { name: '大理大学', code: '532901', type: 'university' as const, majors: ['临床医学', '药学', '护理学', '汉语言文学'] },
    { name: '西南林业大学', code: '530111', type: 'university' as const, majors: ['林学', '园林', '森林工程', '环境科学'] },
    { name: '云南中医药大学', code: '530114', type: 'university' as const, majors: ['中医学', '中药学', '针灸推拿', '中西医临床医学'] },
    { name: '昆明冶金高等专科学校', code: '530102', type: 'vocational' as const, majors: ['冶金技术', '金属材料', '煤矿开采技术'] },
    { name: '云南交通职业技术学院', code: '530111', type: 'vocational' as const, majors: ['道路桥梁', '汽车运用', '物流管理'] },
    { name: '云南机电职业技术学院', code: '530103', type: 'vocational' as const, majors: ['机电一体化', '数控技术', '电气自动化'] },
    { name: '西双版纳职业技术学院', code: '532801', type: 'vocational' as const, majors: ['旅游管理', '酒店管理', '应用泰语'] },
    { name: '云南林业职业技术学院', code: '530111', type: 'vocational' as const, majors: ['林业技术', '园林技术', '野生动物保护'] },
  ];

  return schools.map((school, index) => ({
    id: uuidv4(),
    name: school.name,
    admin_division_id: getDivisionIdByCode(school.code) || '',
    school_type: school.type,
    contact_person: `就业办老师${index + 1}`,
    contact_phone: `0871-6${String(index + 1).padStart(7, '0')}`,
    address: `${school.code}片区大学城`,
    majors: school.majors,
  }));
}

export function generateMockUsers(companyIds: string[], schoolIds: string[]): User[] {
  return [
    {
      id: uuidv4(),
      username: 'admin',
      password_hash: '$2a$10$7EqJtq98hPqEX7fNZaFWoOj5aK5dU7fG9e98x2m8c7e5d3c1b0a9',
      role: 'admin',
      related_id: '',
      admin_division_id: getDivisionIdByCode('530000') || '',
      created_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      username: 'company1',
      password_hash: '$2a$10$7EqJtq98hPqEX7fNZaFWoOj5aK5dU7fG9e98x2m8c7e5d3c1b0a9',
      role: 'company',
      related_id: companyIds[0],
      admin_division_id: getDivisionIdByCode('530102') || '',
      created_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      username: 'school1',
      password_hash: '$2a$10$7EqJtq98hPqEX7fNZaFWoOj5aK5dU7fG9e98x2m8c7e5d3c1b0a9',
      role: 'school',
      related_id: schoolIds[0],
      admin_division_id: getDivisionIdByCode('530102') || '',
      created_at: new Date().toISOString(),
    },
    {
      id: uuidv4(),
      username: 'gov_yunnan',
      password_hash: '$2a$10$7EqJtq98hPqEX7fNZaFWoOj5aK5dU7fG9e98x2m8c7e5d3c1b0a9',
      role: 'government',
      related_id: '',
      admin_division_id: getDivisionIdByCode('530000') || '',
      created_at: new Date().toISOString(),
    },
  ];
}
