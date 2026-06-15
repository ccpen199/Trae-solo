import {
  Township,
  TownshipCode,
  IndustryTag,
  Enterprise,
  JobPosition,
  JobSeeker,
  JobSeekerType,
  Resume,
  SkillItem,
  RequiredSkill,
  RPOProject,
  RPOStage,
  TalentCandidate,
  CampusSession,
  WrittenExam,
  AIInterview,
  EducationCourse,
  CreditBankRecord,
  ChannelROI,
  FunnelMetrics,
  RetentionAnalysis,
  SubsidyApplication,
  InterviewStage,
  AuditStep,
  TouchRecord,
  ExamQuestion,
  AIQuestion,
  RPOStageStatus,
  CourseType,
  CreditBankStatus,
} from '../../shared/types/index.js';

type EnterpriseDashboard = any;

export const TOWNSHIP_DATA: any[] = ([
  { code: TownshipCode.SQ, name: '石岐街道', industries: [IndustryTag.ELECTRONICS, IndustryTag.APPLIANCE], enterpriseCount: 86, jobCount: 1250, housingInfo: '平均租金1500-2500元/月', trafficInfo: '地铁1号线、多条公交线', schoolInfo: '中小学20所', adjacentTownships: [TownshipCode.DS, TownshipCode.SQ] },
  { code: TownshipCode.DQ, name: '东凤镇', industries: [IndustryTag.HARDWARE, IndustryTag.MACHINERY], enterpriseCount: 120, jobCount: 1800, housingInfo: '平均租金1000-1800元/月', trafficInfo: '公交快线、广珠西线高速', schoolInfo: '中小学15所', adjacentTownships: [TownshipCode.NT, TownshipCode.HP] },
  { code: TownshipCode.XL, name: '小榄镇', industries: [IndustryTag.HARDWARE, IndustryTag.LIGHTING], enterpriseCount: 280, jobCount: 3500, housingInfo: '平均租金1200-2200元/月', trafficInfo: '小榄站、多条主干道', schoolInfo: '中小学30所', adjacentTownships: [TownshipCode.DQ, TownshipCode.GZ] },
  { code: TownshipCode.GZ, name: '古镇镇', industries: [IndustryTag.LIGHTING, IndustryTag.ELECTRONICS], enterpriseCount: 350, jobCount: 4200, housingInfo: '平均租金1100-2000元/月', trafficInfo: '古镇站、广中江高速', schoolInfo: '中小学25所', adjacentTownships: [TownshipCode.XL, TownshipCode.WGS] },
  { code: TownshipCode.SX, name: '沙溪镇', industries: [IndustryTag.CASUALWEAR, IndustryTag.CASUALWEAR], enterpriseCount: 180, jobCount: 2400, housingInfo: '平均租金900-1600元/月', trafficInfo: '公交快线、105国道', schoolInfo: '中小学18所', adjacentTownships: [TownshipCode.SQ, TownshipCode.DC] },
  { code: TownshipCode.SJ, name: '三角镇', industries: [IndustryTag.NEWENERGY, IndustryTag.FOOD], enterpriseCount: 95, jobCount: 1300, housingInfo: '平均租金800-1500元/月', trafficInfo: '广澳高速、三角快线', schoolInfo: '中小学12所', adjacentTownships: [TownshipCode.MZ, TownshipCode.HP] },
  { code: TownshipCode.MZ, name: '民众街道', industries: [IndustryTag.FOOD, IndustryTag.HARDWARE], enterpriseCount: 70, jobCount: 980, housingInfo: '平均租金700-1300元/月', trafficInfo: '南沙港快速、民众大道', schoolInfo: '中小学10所', adjacentTownships: [TownshipCode.SJ, TownshipCode.GK] },
  { code: TownshipCode.HP, name: '黄圃镇', industries: [IndustryTag.FOOD, IndustryTag.HARDWARE], enterpriseCount: 150, jobCount: 2100, housingInfo: '平均租金900-1700元/月', trafficInfo: '广珠西线、黄圃快线', schoolInfo: '中小学16所', adjacentTownships: [TownshipCode.DQ, TownshipCode.NT] },
  { code: TownshipCode.NT, name: '南头镇', industries: [IndustryTag.APPLIANCE, IndustryTag.MACHINERY], enterpriseCount: 110, jobCount: 1600, housingInfo: '平均租金1000-1800元/月', trafficInfo: '南头站、广珠西线', schoolInfo: '中小学13所', adjacentTownships: [TownshipCode.DQ, TownshipCode.HP] },
  { code: TownshipCode.FS, name: '阜沙镇', industries: [IndustryTag.MACHINERY, IndustryTag.MACHINERY], enterpriseCount: 65, jobCount: 880, housingInfo: '平均租金800-1400元/月', trafficInfo: '阜沙快线、广中江高速', schoolInfo: '中小学10所', adjacentTownships: [TownshipCode.DS, TownshipCode.GK] },
  { code: TownshipCode.DS, name: '东升镇', industries: [IndustryTag.HARDWARE, IndustryTag.FURNITURE], enterpriseCount: 130, jobCount: 1750, housingInfo: '平均租金1000-1800元/月', trafficInfo: '中江高速、105国道', schoolInfo: '中小学14所', adjacentTownships: [TownshipCode.SQ, TownshipCode.XL] },
  { code: TownshipCode.GK, name: '观澜镇', industries: [IndustryTag.ELECTRONICS, IndustryTag.ROBOTICS], enterpriseCount: 90, jobCount: 1200, housingInfo: '平均租金1100-1900元/月', trafficInfo: '观澜大道、外环高速', schoolInfo: '中小学12所', adjacentTownships: [TownshipCode.SX2, TownshipCode.BF] },
  { code: TownshipCode.SX2, name: '三乡镇', industries: [IndustryTag.FURNITURE, IndustryTag.APPLIANCE], enterpriseCount: 140, jobCount: 1900, housingInfo: '平均租金1000-1700元/月', trafficInfo: '广珠公路、沙坦快线', schoolInfo: '中小学17所', adjacentTownships: [TownshipCode.GK, TownshipCode.TZ] },
  { code: TownshipCode.TZ, name: '坦洲镇', industries: [IndustryTag.ELECTRONICS, IndustryTag.HARDWARE], enterpriseCount: 160, jobCount: 2200, housingInfo: '平均租金900-1600元/月', trafficInfo: '坦洲快线、105国道', schoolInfo: '中小学18所', adjacentTownships: [TownshipCode.SX2, TownshipCode.SW] },
  { code: TownshipCode.BF, name: '板芙镇', industries: [IndustryTag.FURNITURE, IndustryTag.CASUALWEAR], enterpriseCount: 75, jobCount: 1050, housingInfo: '平均租金800-1500元/月', trafficInfo: '板芙北路、105国道', schoolInfo: '中小学11所', adjacentTownships: [TownshipCode.GK, TownshipCode.SW] },
  { code: TownshipCode.SW, name: '神湾镇', industries: [IndustryTag.FOOD, IndustryTag.FOOD], enterpriseCount: 45, jobCount: 650, housingInfo: '平均租金700-1200元/月', trafficInfo: '古神公路、神湾大道', schoolInfo: '中小学8所', adjacentTownships: [TownshipCode.TZ, TownshipCode.BF] },
  { code: TownshipCode.GK, name: '港口镇', industries: [IndustryTag.MACHINERY, IndustryTag.ELECTRONICS], enterpriseCount: 85, jobCount: 1150, housingInfo: '平均租金900-1600元/月', trafficInfo: '港口大道、中江高速', schoolInfo: '中小学13所', adjacentTownships: [TownshipCode.SQ, TownshipCode.FS] },
  { code: TownshipCode.DC, name: '大涌镇', industries: [IndustryTag.CASUALWEAR, IndustryTag.FURNITURE], enterpriseCount: 95, jobCount: 1300, housingInfo: '平均租金850-1500元/月', trafficInfo: '大涌快线、古神公路', schoolInfo: '中小学10所', adjacentTownships: [TownshipCode.SX, TownshipCode.SQ] },
  { code: TownshipCode.SQ, name: '沙朗镇', industries: [IndustryTag.MACHINERY, IndustryTag.MACHINERY], enterpriseCount: 70, jobCount: 950, housingInfo: '平均租金850-1500元/月', trafficInfo: '沙朗大道、105国道', schoolInfo: '中小学10所', adjacentTownships: [TownshipCode.SQ, TownshipCode.DC] },
  { code: TownshipCode.XL, name: '溪兰镇', industries: [IndustryTag.HARDWARE, IndustryTag.HARDWARE], enterpriseCount: 60, jobCount: 820, housingInfo: '平均租金750-1300元/月', trafficInfo: '溪兰大道、广中江高速', schoolInfo: '中小学9所', adjacentTownships: [TownshipCode.GZ, TownshipCode.WGS] },
  { code: TownshipCode.NL, name: '木棉镇', industries: [IndustryTag.CASUALWEAR, IndustryTag.FOOD], enterpriseCount: 55, jobCount: 750, housingInfo: '平均租金700-1200元/月', trafficInfo: '木棉大道、广澳高速', schoolInfo: '中小学8所', adjacentTownships: [TownshipCode.MZ, TownshipCode.NL] },
  { code: TownshipCode.NL, name: '南朗街道', industries: [IndustryTag.NEWENERGY, IndustryTag.ROBOTICS], enterpriseCount: 100, jobCount: 1400, housingInfo: '平均租金1000-1800元/月', trafficInfo: '南朗站、翠亨快线', schoolInfo: '中小学15所', adjacentTownships: [TownshipCode.NL, TownshipCode.WGS] },
  { code: TownshipCode.WGS, name: '文田镇', industries: [IndustryTag.FOOD, IndustryTag.HARDWARE], enterpriseCount: 50, jobCount: 680, housingInfo: '平均租金700-1200元/月', trafficInfo: '文田大道、广中江高速', schoolInfo: '中小学8所', adjacentTownships: [TownshipCode.XL, TownshipCode.HL] },
  { code: TownshipCode.HL, name: '康乐镇', industries: [IndustryTag.APPLIANCE, IndustryTag.LIGHTING], enterpriseCount: 65, jobCount: 880, housingInfo: '平均租金800-1400元/月', trafficInfo: '康乐大道、古神公路', schoolInfo: '中小学10所', adjacentTownships: [TownshipCode.WGS, TownshipCode.WGS] },
  { code: TownshipCode.WGS, name: '五桂山街道', industries: [IndustryTag.ROBOTICS, IndustryTag.NEWENERGY], enterpriseCount: 40, jobCount: 550, housingInfo: '平均租金900-1600元/月', trafficInfo: '五桂山大道、城桂公路', schoolInfo: '中小学7所', adjacentTownships: [TownshipCode.NL, TownshipCode.HL] },
] as any[]);

const TOWNSHIP_MAP = new Map(TOWNSHIP_DATA.map(t => [t.code, t]));

export function getTownshipName(code: TownshipCode): string {
  return TOWNSHIP_MAP.get(code)?.name || code;
}

export function getTownship(code: TownshipCode): Township | undefined {
  return TOWNSHIP_MAP.get(code);
}

export function getTownshipList(): Township[] {
  return TOWNSHIP_DATA;
}

const ENTERPRISE_NAMES = [
  '中山市华辉五金制品有限公司', '中山市明辉灯饰有限公司', '中山市红星机械有限公司', '中山市创新电子科技有限公司',
  '中山市永大家电制造有限公司', '中山市优品家具有限公司', '中山市精益纺织有限公司', '中山市盛达服装有限公司',
  '中山市新能源科技有限公司', '中山市机器人智能装备有限公司', '中山市金鼎五金塑胶有限公司', '中山市博华照明电器有限公司',
  '中山市宏达机械厂', '中山市志远电子有限公司', '中山市万和电气有限公司', '中山市美居家具集团',
  '中山市恒达纺织印染有限公司', '中山市雅琪制衣有限公司', '中山市力神电池有限公司', '中山市智造机器人有限公司',
  '中山市金盛五金加工厂', '中山市光韵灯饰设计有限公司', '中山市锐锋机械有限公司', '中山市联创电子有限公司',
  '中山市万家乐电器有限公司', '中山市尚美家具有限公司', '中山市联发纺织有限公司', '中山市帝牌服饰有限公司',
  '中山市绿源新能源有限公司', '中山市艾派克机器人有限公司', '中山市恒基五金制品厂', '中山市星辉灯饰厂',
  '中山市利达机械厂', '中山市高科电子有限公司', '中山市容声电器有限公司', '中山市皇朝家具有限公司',
  '中山市永安纺织有限公司', '中山市潮流前线服装有限公司', '中山市中创新能源科技有限公司', '中山市智能制造研究院',
];

const POSITION_TITLES = [
  { title: '数控车床操作工', category: '技工', salary: [6000, 9000] as [number, number] },
  { title: 'CNC编程工程师', category: '技工', salary: [8000, 12000] as [number, number] },
  { title: '五金模具设计师', category: '技工', salary: [9000, 15000] as [number, number] },
  { title: '装配钳工', category: '技工', salary: [5500, 8000] as [number, number] },
  { title: '焊接技师', category: '技工', salary: [6500, 10000] as [number, number] },
  { title: '电子维修技术员', category: '技工', salary: [5000, 8000] as [number, number] },
  { title: 'LED灯具组装工', category: '蓝领', salary: [4000, 6500] as [number, number] },
  { title: '流水线操作工', category: '蓝领', salary: [3800, 5500] as [number, number] },
  { title: '包装工', category: '蓝领', salary: [3500, 5000] as [number, number] },
  { title: '搬运工', category: '蓝领', salary: [4200, 6000] as [number, number] },
  { title: '质检QC', category: '蓝领', salary: [4000, 6000] as [number, number] },
  { title: '仓管员', category: '蓝领', salary: [4200, 6500] as [number, number] },
  { title: '生产主管', category: '管理', salary: [7000, 11000] as [number, number] },
  { title: '车间主任', category: '管理', salary: [8000, 13000] as [number, number] },
  { title: '外贸业务员', category: '商务', salary: [5000, 8000] as [number, number] },
  { title: '行政文员', category: '文职', salary: [4000, 6000] as [number, number] },
  { title: '财务会计', category: '文职', salary: [5000, 8000] as [number, number] },
  { title: '人力资源专员', category: '文职', salary: [4500, 7000] as [number, number] },
  { title: 'PLC工程师', category: '技工', salary: [9000, 14000] as [number, number] },
  { title: '电气工程师', category: '技工', salary: [8500, 13000] as [number, number] },
  { title: '工业机器人运维', category: '技工', salary: [7000, 11000] as [number, number] },
  { title: '机械设计工程师', category: '技工', salary: [9000, 15000] as [number, number] },
  { title: '注塑机调机员', category: '技工', salary: [6000, 9500] as [number, number] },
  { title: '电工', category: '技工', salary: [5500, 8500] as [number, number] },
  { title: '应届生储备干部', category: '应届生', salary: [4500, 6500] as [number, number] },
  { title: '管理培训生', category: '应届生', salary: [5000, 7000] as [number, number] },
  { title: '销售助理（应届生）', category: '应届生', salary: [4000, 6000] as [number, number] },
  { title: '技术助理（应届生）', category: '应届生', salary: [4500, 7000] as [number, number] },
  { title: '品管员（应届生）', category: '应届生', salary: [4200, 6000] as [number, number] },
  { title: 'MES系统工程师', category: '技工', salary: [10000, 16000] as [number, number] },
];

const SKILL_POOL: any[] = [
  { name: '数控车床操作', proficiency: 3, category: IndustryTag.MACHINERY, relatedJobs: ['数控车床操作工', 'CNC编程工程师'] },
  { name: 'CNC编程', proficiency: 4, category: IndustryTag.MACHINERY, relatedJobs: ['CNC编程工程师', '模具设计师'] },
  { name: '模具设计', proficiency: 4, category: IndustryTag.HARDWARE, relatedJobs: ['五金模具设计师'] },
  { name: '钳工装配', proficiency: 3, category: IndustryTag.MACHINERY, relatedJobs: ['装配钳工'] },
  { name: '氩弧焊', proficiency: 3, category: IndustryTag.HARDWARE, relatedJobs: ['焊接技师'] },
  { name: '电子维修', proficiency: 3, category: IndustryTag.ELECTRONICS, relatedJobs: ['电子维修技术员'] },
  { name: 'PLC编程', proficiency: 4, category: IndustryTag.MACHINERY, relatedJobs: ['PLC工程师', '电气工程师'] },
  { name: '电气控制', proficiency: 3, category: IndustryTag.MACHINERY, relatedJobs: ['电气工程师'] },
  { name: '工业机器人', proficiency: 4, category: IndustryTag.ROBOTICS, relatedJobs: ['工业机器人运维'] },
  { name: '机械制图CAD', proficiency: 4, category: IndustryTag.MACHINERY, relatedJobs: ['机械设计工程师'] },
  { name: 'SolidWorks', proficiency: 4, category: IndustryTag.MACHINERY, relatedJobs: ['机械设计工程师'] },
  { name: '注塑机调试', proficiency: 3, category: IndustryTag.HARDWARE, relatedJobs: ['注塑机调机员'] },
  { name: '电工证', proficiency: 3, category: '通用技能', relatedJobs: ['电工', '电气工程师'] },
  { name: 'MES系统', proficiency: 4, category: IndustryTag.ROBOTICS, relatedJobs: ['MES系统工程师'] },
  { name: '品质管理QC', proficiency: 3, category: '通用技能', relatedJobs: ['质检QC', '品管员（应届生）'] },
  { name: '仓库管理', proficiency: 2, category: '通用技能', relatedJobs: ['仓管员'] },
  { name: 'LED组装', proficiency: 2, category: IndustryTag.LIGHTING, relatedJobs: ['LED灯具组装工'] },
  { name: '流水线作业', proficiency: 1, category: '通用技能', relatedJobs: ['流水线操作工'] },
  { name: '办公软件Office', proficiency: 3, category: '通用技能', relatedJobs: ['行政文员', '财务会计'] },
  { name: '财务会计', proficiency: 4, category: '通用技能', relatedJobs: ['财务会计'] },
  { name: '人力资源', proficiency: 3, category: '通用技能', relatedJobs: ['人力资源专员'] },
  { name: '外贸英语', proficiency: 3, category: '通用技能', relatedJobs: ['外贸业务员'] },
  { name: '生产管理', proficiency: 4, category: '通用技能', relatedJobs: ['生产主管', '车间主任'] },
  { name: '沟通协调', proficiency: 3, category: '通用技能', relatedJobs: ['管理培训生', '储备干部'] },
];

const WELFARE_TAGS = ['包吃住', '五险一金', '年终奖', '带薪年假', '节日福利', '生日礼品', '员工旅游', '提供住宿', '住房补贴', '交通补贴', '通讯补贴', '餐饮补贴', '培训晋升', '高温补贴', '夜班补贴', '全勤奖', '绩效奖金', '加班费'];

function randomPick<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(startYear: number = 2023): string {
  const start = new Date(startYear, 0, 1);
  const end = new Date();
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

export function generateEnterprises(count: number = 150): Enterprise[] {
  const enterprises: Enterprise[] = [];
  const employeeCounts: any[] = ['1-50', '51-200', '201-500', '501-1000', '1000+'];
  const creditRatings: Enterprise['creditRating'][] = ['A', 'B', 'C', 'D'];

  for (let i = 0; i < count; i++) {
    const township = randomItem(TOWNSHIP_DATA);
    enterprises.push({
      id: `ent_${String(i + 1).padStart(4, '0')}`,
      name: ENTERPRISE_NAMES[i % ENTERPRISE_NAMES.length] + (i >= ENTERPRISE_NAMES.length ? `（${i}分公司）` : ''),
      licenseNo: `91442000MA${randomInt(10000000, 99999999)}X`,
      legalPerson: `法定代表人${i + 1}`,
      registeredCapital: randomInt(50, 5000),
      employeeCount: randomItem(employeeCounts),
      industry: randomItem(township.industries),
      township: township.code,
      verified: Math.random() > 0.1,
      creditRating: Math.random() > 0.15 ? (Math.random() > 0.3 ? 'A' : 'B') : randomItem(creditRatings),
      address: `${township.name}${randomItem(['工业大道', '兴业路', '创业路', '科技路', '振兴路'])}${randomInt(1, 999)}号`,
      description: `本公司成立于${randomInt(1995, 2020)}年，专业从事${township.industries[0]}相关产品的研发、生产与销售，产品远销国内外市场，在业内享有良好声誉。`,
      welfareTags: randomPick(WELFARE_TAGS, randomInt(4, 8)),
      contact: {
        hrName: `HR${randomItem(['王', '李', '张', '刘', '陈', '杨', '黄'])}${randomItem(['经理', '主管', '专员', '小姐', '先生'])}`,
        hrPhone: `138${randomInt(10000000, 99999999)}`,
        hrEmail: `hr${i + 1}@company${i + 1}.com`,
      },
      createdAt: randomDate(2020),
    } as any);
  }
  return enterprises;
}

export const MOCK_ENTERPRISES = generateEnterprises(80);
const ENTERPRISE_MAP = new Map(MOCK_ENTERPRISES.map(e => [e.id, e]));

export function generateJobs(count: number = 200): JobPosition[] {
  const jobs: JobPosition[] = [];
  const experiences: JobPosition['experience'][] = ['不限', '应届生', '1-3年', '3-5年', '5-10年', '10年以上'];
  const educations: JobPosition['education'][] = ['不限', '初中', '高中', '中专', '大专', '本科'];
  const salaryTypes: JobPosition['salaryType'][] = ['月薪', '计件', '日结', '年薪'];
  const channels: JobPosition['channel'][] = ['招聘网站', '内推', '镇街', '校园', '猎头', 'RPO'];
  const statuses: JobPosition['status'][] = ['招聘中', '招聘中', '招聘中', '已暂停', '已结束'];

  for (let i = 0; i < count; i++) {
    const pos = randomItem(POSITION_TITLES);
    const enterprise = MOCK_ENTERPRISES[i % MOCK_ENTERPRISES.length];
    const township = getTownship(enterprise.township)!;

    const requiredSkills: RequiredSkill[] = [];
    const relevantSkills = SKILL_POOL.filter(s => s.relatedJobs.includes(pos.title));
    relevantSkills.slice(0, randomInt(2, 4)).forEach((s, idx) => {
      requiredSkills.push({
        id: `rs_${i}_${idx}`,
        name: s.name,
        weight: idx === 0 ? 30 : randomInt(10, 25),
        required: idx === 0,
      } as any);
    });
    if (requiredSkills.length === 0) {
      requiredSkills.push({ id: `rs_${i}_extra1`, name: '岗位相关经验', weight: 30, required: true } as any);
      requiredSkills.push({ id: `rs_${i}_extra2`, name: '吃苦耐劳', weight: 20, required: true } as any);
    }

    const salaryVar = (1 + (Math.random() - 0.5) * 0.3);
    const minSalary = Math.round(pos.salary[0] * salaryVar / 100) * 100;
    const maxSalary = Math.round(pos.salary[1] * salaryVar / 100) * 100;

    jobs.push({
      id: `job_${String(i + 1).padStart(5, '0')}`,
      enterpriseId: enterprise.id,
      enterpriseName: enterprise.name,
      title: pos.title,
      township: enterprise.township,
      townshipName: township.name,
      salaryRange: [minSalary, maxSalary],
      salaryType: pos.category === '蓝领' && Math.random() > 0.7 ? randomItem(['计件', '日结']) : '月薪',
      experience: pos.category === '应届生' ? '应届生' : (pos.category === '蓝领' ? randomItem(['不限', '1-3年']) : randomItem(experiences)),
      education: pos.category === '应届生' ? randomItem(['大专', '本科']) : (pos.category === '蓝领' ? randomItem(['不限', '初中', '高中']) : randomItem(educations)),
      requiredSkills,
      jobDescription: `岗位职责：\n1. 负责${pos.title}相关工作；\n2. 按照生产计划完成当日任务；\n3. 严格执行工艺标准和质量要求；\n4. 配合班组长完成其他工作。\n\n任职要求：\n1. 年龄18-45岁，身体健康；\n2. 有相关工作经验者优先；\n3. 能吃苦耐劳，有团队合作精神；\n4. 服从公司安排，能接受加班。`,
      welfareTags: randomPick([...enterprise.welfareTags, ...WELFARE_TAGS], randomInt(5, 9)),
      channel: pos.category === '应届生' ? '校园' : randomItem(channels),
      status: randomItem(statuses),
      publishedAt: randomDate(2024),
      views: randomInt(100, 5000),
      applicationsCount: randomInt(5, 200),
      type: (pos.category === '蓝领' ? JobSeekerType.BLUE_COLLAR : pos.category === '技工' ? JobSeekerType.SKILLED_WORKER : JobSeekerType.FRESH_GRADUATE) as any,
      salaryMin: minSalary,
      salaryMax: maxSalary,
      responsibilities: [],
      requirements: [],
      benefits: [],
      hiringCount: randomInt(1, 10),
      urgent: Math.random() > 0.7,
    } as any);
  }
  return jobs;
}

export const MOCK_JOBS = generateJobs(150);
const JOB_MAP = new Map(MOCK_JOBS.map(j => [j.id, j]));

const JOB_SEEKER_NAMES = ['张三', '李四', '王五', '赵六', '陈七', '刘八', '杨九', '黄十', '周明', '吴华', '郑强', '孙丽', '钱伟', '马超', '朱芳', '胡军', '林峰', '何静', '罗勇', '梁敏'];

export function generateJobSeekers(count: number = 100): { seekers: JobSeeker[]; resumes: Resume[] } {
  const seekers: JobSeeker[] = [];
  const resumes: Resume[] = [];
  const types: JobSeekerType[] = [JobSeekerType.BLUE_COLLAR, JobSeekerType.SKILLED, JobSeekerType.GRADUATE];
  const genders: ('男' | '女')[] = ['男', '男', '男', '女'];
  const educations: string[] = ['初中', '高中', '中专', '大专', '本科', '硕士'];

  for (let i = 0; i < count; i++) {
    const type = types[i % 3];
    const township = randomItem(TOWNSHIP_DATA);
    const age = type === JobSeekerType.GRADUATE ? randomInt(21, 25) : randomInt(20, 48);
    const workYears = type === JobSeekerType.GRADUATE ? randomInt(0, 1) : (type === JobSeekerType.SKILLED ? randomInt(3, 15) : randomInt(1, 10));
    const pos = randomItem(POSITION_TITLES.filter(p => p.category === (type === JobSeekerType.BLUE_COLLAR ? '蓝领' : type === JobSeekerType.SKILLED ? '技工' : '应届生')));

    const seekerId = `js_${String(i + 1).padStart(5, '0')}`;
    const resumeId = `res_${String(i + 1).padStart(5, '0')}`;

    const educationList: Resume['educationList'] = [];
    const eduIdx = type === JobSeekerType.GRADUATE ? randomInt(3, 5) : (type === JobSeekerType.SKILLED ? randomInt(1, 3) : randomInt(0, 2));
    if (eduIdx >= 0) {
      const degree = educations[Math.min(eduIdx, educations.length - 1)];
      educationList.push({
        id: `edu_${i}_1`,
        school: type === JobSeekerType.GRADUATE ? randomItem(['中山职业技术学院', '广东理工学院', '中山大学南方学院', '电子科技大学中山学院']) : randomItem(['中山市第一职业技术学校', '中山市技师学院', '中山市工贸技工学校', '中山市现代职业技术学校']),
        major: randomItem(['机械制造', '电子信息', '数控技术', '模具设计', '电气工程', '工商管理', '计算机应用', '会计']),
      degree: degree as any,
        startDate: `${2015 + randomInt(0, 4)}-09`,
        endDate: `${2018 + randomInt(0, 4)}-06`,
      });
    }

    const workExperienceList: Resume['workExperienceList'] = [];
    const expCount = Math.min(workYears > 5 ? randomInt(2, 4) : (workYears > 2 ? randomInt(1, 3) : (workYears > 0 ? 1 : 0)), 4);
    for (let w = 0; w < expCount; w++) {
      const expTownship = randomItem(TOWNSHIP_DATA);
      const expJob = randomItem(POSITION_TITLES);
      workExperienceList.push({
        id: `work_${i}_${w}`,
        company: randomItem(ENTERPRISE_NAMES),
        position: expJob.title,
        township: expTownship.code,
        startDate: `${2019 + w}-0${randomInt(1, 9)}`,
        endDate: w < expCount - 1 ? `${2020 + w}-${randomInt(10, 12)}` : undefined,
        salary: Math.round((expJob.salary[0] + expJob.salary[1]) / 2 / 500) * 500,
        achievements: w === 0 ? ['获得年度优秀员工称号', '产量提升20%'] : ['保质保量完成生产任务'],
        skillsUsed: expJob.category === '技工' ? randomPick(SKILL_POOL.map(s => s.name), randomInt(2, 4)) : ['团队协作', '执行力强'],
      });
    }

    const skillList: Resume['skillList'] = [];
    const typeRelatedJobs = POSITION_TITLES.filter(p => p.category === (type === JobSeekerType.BLUE_COLLAR ? '蓝领' : type === JobSeekerType.SKILLED ? '技工' : '应届生'));
    const relatedSkillNames = new Set<string>();
    typeRelatedJobs.forEach(j => SKILL_POOL.filter((s: any) => (s.relatedJobs || []).includes(j.title)).forEach(s => relatedSkillNames.add(s.name)));
    const skillNames = Array.from(relatedSkillNames);
    const selectedSkillNames = type === JobSeekerType.SKILLED ? randomPick(skillNames, randomInt(4, 8)) : randomPick(skillNames, randomInt(2, 5));
      selectedSkillNames.forEach(name => {
      const base = SKILL_POOL.find(s => s.name === name)!;
      skillList.push({
        ...base,
        proficiency: (type === JobSeekerType.SKILLED ? Math.min(5, (base as any).proficiency + randomInt(0, 1)) : Math.max(1, (base as any).proficiency - randomInt(0, 2))) as any,
      });
    });
    skillList.push({ name: '沟通协调', proficiency: 3, category: '通用技能', relatedJobs: [] } as any);

    seekers.push({
      id: seekerId,
      phone: `139${randomInt(10000000, 99999999)}`,
      name: JOB_SEEKER_NAMES[i % JOB_SEEKER_NAMES.length] + (i >= JOB_SEEKER_NAMES.length ? String(i - JOB_SEEKER_NAMES.length + 2) : ''),
      type,
      idVerified: Math.random() > 0.2,
      resumeId,
      preferredTownships: randomPick(TOWNSHIP_DATA.map(t => t.code), randomInt(1, 4)),
      preferredSalaryRange: type === JobSeekerType.GRADUATE ? [4000, 6500] : type === JobSeekerType.SKILLED ? [7000, 12000] : [4000, 7000],
      createdAt: randomDate(2023),
      gender: randomItem(genders),
      age,
      township: township.code,
      expectPosition: pos.title,
      expectSalaryMin: (type === JobSeekerType.GRADUATE ? 4000 : type === JobSeekerType.SKILLED ? 7000 : 4000),
      expectSalaryMax: (type === JobSeekerType.GRADUATE ? 6500 : type === JobSeekerType.SKILLED ? 12000 : 7000),
      workYears,
      avatarUrl: '',
      tags: [],
    } as any);

    resumes.push({
      id: resumeId,
      jobSeekerId: seekerId,
      basicInfo: {
        name: seekers[i].name,
        gender: randomItem(genders),
        age,
        phone: seekers[i].phone,
        education: educationList.length > 0 ? (educationList[0].degree as any) : '初中',
        location: township.code,
        workYears,
      },
      educationList,
      workExperienceList,
      skillList,
      certificates: (type === JobSeekerType.SKILLED ? randomPick(['电工证', '焊工证', '叉车证', '钳工证', 'CAD中级证', '数控车中级证', 'PLC编程证'], randomInt(0, 3)) : randomPick(['计算机一级', '英语四级', '驾驶证C1'], randomInt(0, 2))).map((name, idx) => ({
        id: `cert_${i}_${idx}`,
        name,
        issuer: '中山市职业技能鉴定中心',
        date: '2023-06-15',
      })),
      projects: workYears > 3 ? [{
        id: `proj_${i}_1`,
        name: `${randomItem(['新生产线', '设备升级', '工艺改进', '自动化改造'])}项目`,
        role: randomItem(['核心成员', '项目助理', '技术负责人']),
        startDate: '2023-01',
        endDate: '2023-06',
        description: '参与项目全程，负责具体实施工作，项目按期完成并达到预期效果。',
        skillsUsed: randomPick(SKILL_POOL.map(s => s.name), 3),
      }] : [],
      selfEvaluation: `本人性格开朗，做事认真负责，有${workYears}年相关工作经验，具备团队合作精神，能吃苦耐劳，希望能在贵公司发挥所长，与公司共同发展。`,
      lastUpdated: randomDate(2024),
      title: pos.title + '简历',
      skills: skillList,
      workList: workExperienceList,
      projectList: workYears > 3 ? [{
        id: `proj_${i}_1`,
        name: `${randomItem(['新生产线', '设备升级', '工艺改进', '自动化改造'])}项目`,
        role: randomItem(['核心成员', '项目助理', '技术负责人']),
        startDate: '2023-01',
        endDate: '2023-06',
        description: '参与项目全程，负责具体实施工作，项目按期完成并达到预期效果。',
        skillsUsed: randomPick(SKILL_POOL.map(s => s.name), 3),
      }] : [],
      updatedAt: randomDate(2024),
    } as any);
  }
  return { seekers, resumes };
}

const { seekers: MOCK_SEEKERS, resumes: MOCK_RESUMES } = generateJobSeekers(60);
export { MOCK_SEEKERS, MOCK_RESUMES };
const SEEKER_MAP = new Map(MOCK_SEEKERS.map(s => [s.id, s]));
const RESUME_MAP = new Map(MOCK_RESUMES.map(r => [r.id, r]));

export function generateRPOProjects(count: number = 15): RPOProject[] {
  const statuses: RPOProject['status'][] = [RPOStageStatus.DEMAND_CONFIRM, RPOStageStatus.SOURCING, RPOStageStatus.SCREENING, RPOStageStatus.INTERVIEW_RECOMMEND, RPOStageStatus.OFFER_STAGE, RPOStageStatus.ONBOARD_STAGE, RPOStageStatus.GUARANTEE_PERIOD, RPOStageStatus.COMPLETED];
  const projects: RPOProject[] = [];

  for (let i = 0; i < count; i++) {
    const enterprise = randomItem(MOCK_ENTERPRISES);
    const projJobs = MOCK_JOBS.filter(j => j.enterpriseId === enterprise.id).slice(0, randomInt(2, 5));
    const status = statuses[i % statuses.length];
    const headcount = randomInt(10, 80);
    const filledRate = statuses.indexOf(status) / statuses.length;
    const filledCount = Math.round(headcount * filledRate * (0.7 + Math.random() * 0.3));

    const stageNames: RPOStage['name'][] = ['需求确认', '人才寻访', '初步筛选', '推荐面试', 'Offer发放', '入职跟进', '保用期'];
    const stages: RPOStage[] = stageNames.map((name, idx) => {
      const stageIdx = statuses.indexOf(status);
      const stageStatus = idx < stageIdx ? '已完成' : idx === stageIdx ? '进行中' : '待开始';
      return {
        name,
        startDate: `2025-0${Math.min(6, idx + 1)}-01`,
        endDate: stageStatus === '已完成' ? `2025-0${Math.min(6, idx + 1)}-${20 + idx}` : undefined,
        status: stageStatus === '待开始' ? '待开始' : (stageStatus === '已完成' ? '已完成' : (Math.random() > 0.85 ? '已延期' : '进行中')),
        assignees: ['RPO顾问A', 'RPO顾问B'],
        notes: `${name}阶段按计划推进中`,
      };
    });

    projects.push({
      id: `rpo_${String(i + 1).padStart(3, '0')}`,
      enterpriseId: enterprise.id,
      enterpriseName: enterprise.name,
      name: `${enterprise.name.slice(0, 8)}${randomItem(['技术工人', '管理储备', '蓝领批量', '工程师团队'])}招聘项目`,
      positions: projJobs.map(j => j.id),
      positionNames: projJobs.map(j => j.title),
      positionTitle: projJobs[0]?.title || '技术工人',
      positionIds: projJobs.map(j => j.id),
      industry: enterprise.industry,
      township: enterprise.township,
      headcount,
      filledCount,
      salaryMin: projJobs[0]?.salaryMin || 4000,
      salaryMax: projJobs[0]?.salaryMax || 8000,
      status,
      stages,
      priority: randomItem(['普通', '加急', '特急']) as any,
      feeRate: 0.15,
      guaranteePeriod: 90,
      consultant: `RPO顾问${['甲', '乙', '丙', '丁'][i % 4]}`,
      talentPoolIds: Array.from({ length: randomInt(20, 80) }, (_, j) => `talent_${i}_${j}`),
      candidates: [],
      budget: headcount * randomInt(3000, 8000),
      roi: Math.round((Math.random() * 2 + 0.5) * 100) / 100,
      createdAt: `2025-0${randomInt(1, 3)}-0${randomInt(1, 9)}`,
      startDate: `2025-0${randomInt(3, 5)}-0${randomInt(1, 9)}`,
      deadline: `2025-0${randomInt(8, 9)}-${randomInt(15, 30)}`,
    } as any);
  }
  return projects;
}

export const MOCK_RPO_PROJECTS = generateRPOProjects();

export function generateTalentCandidates(projectId: string, count: number = 20): TalentCandidate[] {
  const stages: TalentCandidate['stage'][] = ['待联系', InterviewStage.WRITTEN_EXAM, InterviewStage.AI_SCREENING, InterviewStage.TECHNICAL, InterviewStage.HR, '已入职', '已淘汰'];
  const candidates: TalentCandidate[] = [];
  const availableResumes = MOCK_RESUMES.slice(0, Math.min(count, MOCK_RESUMES.length));

  for (let i = 0; i < count; i++) {
    const resume = availableResumes[i % availableResumes.length];
    candidates.push({
      id: `talent_${projectId.slice(-3)}_${String(i + 1).padStart(3, '0')}`,
      rpoProjectId: projectId,
      resumeId: resume.id,
      resumeName: resume.basicInfo.name,
      jobSeekerId: resume.jobSeekerId,
      projectId,
      tags: randomPick(['高意向', '稳定', '技能匹配', '本地人', '经验丰富', '可立即上岗', '有资源', '形象好'], randomInt(1, 4)),
      activityScore: randomInt(40, 98),
      stage: stages[i % stages.length],
      currentStage: i % 3 === 0 ? null : (stages[i % stages.length] as any),
      status: i % 7 === 6 ? '已淘汰' : (i % 7 === 5 ? '已入职' : '待推荐') as any,
      touchHistory: Array.from({ length: randomInt(1, 5) }, (_, h) => ({
        date: `2025-0${randomInt(4, 6)}-${randomInt(10, 28)}`,
        type: randomItem(['电话', '微信', '邮件', '面试', '短信']) as TouchRecord['type'],
        content: `第${h + 1}次联系`,
        result: randomItem(['意向明确待安排', '待回复', '已确认参加面试', '暂不考虑', '不合适']),
      })),
      recommendReason: '综合条件匹配，推荐面试',
      updatedAt: randomDate(2025),
      matchScore: randomInt(60, 95),
    } as any);
  }
  return candidates;
}

export function generateCampusSessions(count: number = 15): CampusSession[] {
  const universities = ['中山大学', '华南理工大学', '暨南大学', '华南师范大学', '广东工业大学', '广东理工学院', '中山职业技术学院', '电子科技大学中山学院', '广州大学', '深圳大学'];
  const sessions: CampusSession[] = [];

  for (let i = 0; i < count; i++) {
    const enterprise = randomItem(MOCK_ENTERPRISES);
    const jobs = MOCK_JOBS.filter(j => j.enterpriseId === enterprise.id && (j.experience === '应届生' || j.experience === '不限')).slice(0, randomInt(2, 5));
    const university = universities[i % universities.length];
    sessions.push({
      id: `camp_${String(i + 1).padStart(3, '0')}`,
      enterpriseId: enterprise.id,
      enterpriseIds: [enterprise.id],
      enterpriseName: enterprise.name,
      name: `${university}${enterprise.shortName || enterprise.name}校园招聘`,
      university,
      school: randomItem(['机械工程学院', '电子信息学院', '经济管理学院', '计算机学院', '自动化学院']),
      date: `2025-${randomInt(9, 11)}-${randomInt(10, 28)} 14:00`,
      format: randomItem(['线上', '线下', '混合']) as any,
      venue: randomItem(['校本部图书馆报告厅', '大学城校区体育馆', '线上腾讯会议', '招生就业处多功能厅']),
      capacity: randomInt(80, 300),
      registered: randomInt(20, 250),
      replayUrl: Math.random() > 0.5 ? `https://replay.example.com/campus/${i + 1}` : undefined,
      positions: jobs.map(j => j.id),
      positionIds: jobs.map(j => j.id),
      positionNames: jobs.map(j => j.title),
      status: randomItem(['筹备中', '进行中', '已结束']) as any,
      createdAt: randomDate(2025),
    } as any);
  }
  return sessions;
}

export const MOCK_CAMPUS_SESSIONS = generateCampusSessions();

export function generateWrittenExam(positionId: string): WrittenExam {
  const categories: ExamQuestion['category'][] = ['专业技能', '逻辑思维', '职业性格', '英语'];
  const questions: ExamQuestion[] = [];

  for (let i = 0; i < 20; i++) {
    const cat = categories[i % 4];
    const type: ExamQuestion['type'] = i < 10 ? '单选' : (i < 15 ? '判断' : (i < 18 ? '多选' : '简答'));
    questions.push({
      id: `q_${positionId.slice(-5)}_${i}`,
      type,
      content: `${cat}测试题${i + 1}：这是一道关于${cat}的${type === '单选' ? '单项选择' : type === '判断' ? '判断' : type === '多选' ? '多项选择' : '简答'}题，考察应聘者的相关能力。`,
      options: type === '单选' || type === '多选' ? ['选项A', '选项B', '选项C', '选项D'] : undefined,
      answer: type === '判断' ? '正确' : (type === '多选' ? ['选项A', '选项C'] : '选项A'),
      score: type === '简答' ? 10 : (type === '多选' ? 3 : (type === '判断' ? 2 : 2)),
      category: cat,
    } as ExamQuestion);
  }

  return {
    id: `exam_${positionId.slice(-5)}`,
    positionId,
    positionTitle: JOB_MAP.get(positionId)?.title || '未知岗位',
    duration: 90,
    questions,
    passScore: 60,
  };
}

export function generateAIInterview(positionId: string): AIInterview {
  const questions: AIQuestion[] = [
    { id: `aiq_${positionId.slice(-5)}_1`, question: '请做一个简单的自我介绍，包括你的教育背景和工作经历。', expectedKeywords: ['教育', '工作', '经验', '技能'], answerDuration: 120 },
    { id: `aiq_${positionId.slice(-5)}_2`, question: '你为什么选择申请这个岗位？你对这个岗位有什么了解？', expectedKeywords: ['岗位', '了解', '兴趣', '发展'], answerDuration: 90 },
    { id: `aiq_${positionId.slice(-5)}_3`, question: '请描述一次你在工作中遇到的困难，以及你是如何解决的。', expectedKeywords: ['困难', '解决', '沟通', '方案'], answerDuration: 120 },
    { id: `aiq_${positionId.slice(-5)}_4`, question: '你对未来3-5年的职业规划是怎样的？', expectedKeywords: ['规划', '发展', '学习', '目标'], answerDuration: 90 },
    { id: `aiq_${positionId.slice(-5)}_5`, question: '如果工作中需要加班，你怎么看？', expectedKeywords: ['加班', '效率', '责任', '安排'], answerDuration: 60 },
  ];

  return {
    id: `ai_${positionId.slice(-5)}`,
    positionId,
    positionTitle: JOB_MAP.get(positionId)?.title || '未知岗位',
    questions,
    durationPerQuestion: 120,
    aiWeights: { expression: 0.25, speech: 0.25, semantics: 0.5 },
  };
}

export function generateEducationCourses(count: number = 30): EducationCourse[] {
  const providers = ['中山开放大学', '中山市技师学院', '中山职业技术学院', '华南理工大学继续教育学院', '广东开放大学', '奥鹏远程教育中心'];
  const types: EducationCourse['type'][] = [CourseType.SELF_STUDY, CourseType.ADULT_EDU, CourseType.VOCATIONAL_QUAL];
  const courses: EducationCourse[] = [];

  const courseTemplates = [
    { title: '机械制造与自动化', major: '机械类', target: '大专学历', duration: '2.5年', price: 8800 },
    { title: '机电一体化技术', major: '机械类', target: '大专学历', duration: '2.5年', price: 9200 },
    { title: '电气自动化技术', major: '电气类', target: '大专学历', duration: '2.5年', price: 9000 },
    { title: '工商企业管理', major: '管理类', target: '大专学历', duration: '2.5年', price: 7800 },
    { title: '会计学', major: '财经类', target: '本科学历', duration: '3年', price: 12800 },
    { title: '计算机科学与技术', major: '计算机类', target: '本科学历', duration: '3年', price: 13800 },
    { title: '人力资源管理', major: '管理类', target: '本科学历', duration: '3年', price: 11800 },
    { title: '数控加工高级技师', major: '职业资格', target: '高级技师证', duration: '6个月', price: 5800 },
    { title: '工业机器人应用工程师', major: '职业资格', target: '职业技能证书', duration: '4个月', price: 6800 },
    { title: 'PLC编程工程师', major: '职业资格', target: '中级职称', duration: '3个月', price: 4800 },
    { title: '注册会计师(CPA)', major: '职业资格', target: '执业资格证', duration: '12个月', price: 15800 },
    { title: '二级建造师', major: '职业资格', target: '执业资格证', duration: '6个月', price: 6200 },
  ];

  courseTemplates.forEach((tpl, idx) => {
    const provider = providers[idx % providers.length];
    courses.push({
      id: `course_${String(idx + 1).padStart(3, '0')}`,
      title: tpl.title,
      provider,
      type: tpl.target.includes('学历') ? (idx % 2 === 0 ? CourseType.SELF_STUDY : CourseType.ADULT_EDU) : CourseType.VOCATIONAL_QUAL,
      targetDegree: tpl.target,
      major: tpl.major,
      duration: tpl.duration,
      price: tpl.price,
      creditBankEligible: tpl.target.includes('学历') || idx % 3 === 0,
      enrollmentLink: `https://enroll.example.com/course/${idx + 1}`,
      tags: randomPick(['热门', '政府补贴', '包通过', '推荐就业', '高通过率', '线上授课', '周末班'], randomInt(1, 3)),
    });
  });

  return courses;
}

export const MOCK_EDUCATION_COURSES = generateEducationCourses();

export function generateCreditBankRecords(seekerId: string, count: number = 3): CreditBankRecord[] {
  const records: CreditBankRecord[] = [];
  const statuses: CreditBankRecord['syncStatus'][] = [CreditBankStatus.NOT_SYNCED, CreditBankStatus.SYNCING, CreditBankStatus.SYNCED, CreditBankStatus.CERTIFIED];

  for (let i = 0; i < count; i++) {
    const course = MOCK_EDUCATION_COURSES[i % MOCK_EDUCATION_COURSES.length];
    const progress = randomInt(10, 100);
    records.push({
      id: `credit_${seekerId.slice(-5)}_${i}`,
      jobSeekerId: seekerId,
      courseId: course.id,
      courseTitle: course.title,
      earnedCredits: Math.round(course.totalCredits ? progress / 100 * 60 : progress / 100 * 60),
      totalCredits: 60,
      progress,
      estimatedCertDate: `2025-${randomInt(6, 12)}-${randomInt(15, 30)}`,
      syncStatus: statuses[i % statuses.length],
    });
  }
  return records;
}

export function generateChannelROI(months: number = 6): ChannelROI[] {
  const channels = ['招聘网站', '内推', '镇街', '校园', '猎头', 'RPO'];
  const data: ChannelROI[] = [];

  for (let m = 0; m < months; m++) {
    const month = `2025-${String(m + 1).padStart(2, '0')}`;
    channels.forEach(channel => {
      const baseCost = channel === '猎头' ? 80000 : (channel === 'RPO' ? 60000 : (channel === '招聘网站' ? 30000 : 15000));
      const cost = Math.round(baseCost * (0.8 + Math.random() * 0.4));
      const views = Math.round(cost * (10 + Math.random() * 20));
      const applications = Math.round(views * (0.05 + Math.random() * 0.1));
      const interviews = Math.round(applications * (0.15 + Math.random() * 0.2));
      const hires = Math.round(interviews * (0.1 + Math.random() * 0.2));
      data.push({
        channel,
        cost,
        views,
        applications,
        interviews,
        hires,
        cpa: hires > 0 ? Math.round(cost / hires) : cost,
        avgQualityScore: randomInt(65, 92),
        month,
      });
    });
  }
  return data;
}

export const MOCK_CHANNEL_ROI = generateChannelROI();

export function generateFunnelMetrics(periods: number = 6): FunnelMetrics[] {
  const data: FunnelMetrics[] = [];
  for (let p = 0; p < periods; p++) {
    const views = randomInt(50000, 120000);
    const clicks = Math.round(views * (0.08 + Math.random() * 0.05));
    const applications = Math.round(clicks * (0.2 + Math.random() * 0.1));
    const screeningPass = Math.round(applications * (0.4 + Math.random() * 0.2));
    const interviews = Math.round(screeningPass * (0.35 + Math.random() * 0.2));
    const offers = Math.round(interviews * (0.25 + Math.random() * 0.15));
    const hires = Math.round(offers * (0.6 + Math.random() * 0.2));
    data.push({
      period: `2025-${String(p + 1).padStart(2, '0')}`,
      views,
      clicks,
      applications,
      screeningPass,
      interviews,
      offers,
      hires,
      retention30d: Math.round(hires * (0.85 + Math.random() * 0.1)),
      retention90d: Math.round(hires * (0.7 + Math.random() * 0.15)),
    });
  }
  return data;
}

export function generateRetentionAnalysis(count: number = 8): RetentionAnalysis[] {
  const channels = ['招聘网站', '内推', '镇街', '校园'];
  const positionTypes = [JobSeekerType.BLUE_COLLAR, JobSeekerType.SKILLED_WORKER, JobSeekerType.FRESH_GRADUATE];
  const data: RetentionAnalysis[] = [];

  for (let i = 0; i < count; i++) {
    const cohortSize = randomInt(30, 150);
    let remaining = cohortSize;
    const reasons = ['薪资不满意', '工作强度大', '通勤太远', '家庭原因', '发展空间', '管理问题', '找到更好机会'];
    const months = Array.from({ length: 12 }, (_, m) => {
      const attrition = m < 3 ? randomInt(0, 10) : (m < 6 ? randomInt(0, 5) : randomInt(0, 2));
      remaining = Math.max(0, remaining - attrition);
      return {
        month: m + 1,
        remaining,
        attritionReason: attrition > 0 ? randomItem(reasons) : undefined,
      };
    });
    data.push({
      cohort: `2024-${String(i + 1).padStart(2, '0')}入职`,
      cohortSize,
      channel: channels[i % channels.length],
      positionType: positionTypes[i % positionTypes.length],
      township: randomItem(TOWNSHIP_DATA).code,
      months,
    });
  }
  return data;
}

export function generateSubsidyApplications(count: number = 25): SubsidyApplication[] {
  const types: SubsidyApplication['type'][] = ['ENTERPRISE_HIRE', 'GRADUATE_EMPLOY', 'SKILL_UPGRADE', 'SOCIAL_INSURANCE'] as any;
  const statuses: SubsidyApplication['status'][] = ['DRAFT', 'SUBMITTED', 'AUDITING', 'APPROVED', 'REJECTED', 'PAID'] as any;
  const apps: SubsidyApplication[] = [];

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const applicantType: SubsidyApplication['applicantType'] = type === '技能提升' || type === '高校毕业生就业' ? randomItem(['企业', '个人']) : (type === '企业吸纳就业' ? '企业' : randomItem(['企业', '个人']));
    const status = statuses[i % statuses.length];
    const enterprise = randomItem(MOCK_ENTERPRISES);
    const seeker = randomItem(MOCK_SEEKERS);

    const docNames = type === '企业吸纳就业'
      ? ['营业执照复印件', '劳动合同', '社保缴纳证明', '工资发放凭证', '申请人身份证']
      : type === '高校毕业生就业'
        ? ['毕业证书', '劳动合同', '社保缴纳证明', '身份证']
        : type === '技能提升'
          ? ['技能证书', '培训发票', '身份证', '社保缴纳证明']
          : ['社保缴纳凭证', '劳动合同', '工资表', '身份证'];

    const requiredDocuments = docNames.map(name => ({
      name,
      uploaded: status !== '草稿',
      url: status !== '草稿' ? `https://docs.example.com/subsidy/${i}/${encodeURIComponent(name)}` : undefined,
    }));

    const stepNames = ['提交申请', '材料初审', '镇街复核', '区级审批', '资金发放'];
    const stepIdx = statuses.indexOf(status);
    const auditTrail: AuditStep[] = stepNames.slice(0, Math.max(1, Math.min(stepIdx + 1, 5))).map((name, idx) => ({
      id: `as_${i}_${idx}`,
      step: name,
      operator: `${['镇街专员', '区局科员', '区局科长', '财政局', '银行'][idx]}`,
      comment: idx < stepIdx ? '审核通过' : (idx === stepIdx ? ((status as any) === 'REJECTED' ? '材料不完整，请补充' : '审核中') : '待处理'),
      status: (idx < stepIdx ? '通过' : (idx === stepIdx ? ((status as any) === 'REJECTED' ? '驳回' : ((status as any) === 'PAID' ? '通过' : '待处理')) : '待处理')) as any,
      operatedAt: `2025-0${Math.min(6, idx + 1)}-${randomInt(10, 25)}`,
    })) as any;

    const amount = type === '企业吸纳就业'
      ? randomInt(3000, 20000)
      : type === '高校毕业生就业'
        ? randomInt(2000, 8000)
        : type === '技能提升'
          ? randomInt(1000, 5000)
          : randomInt(500, 3000);

    apps.push({
      id: `sub_${String(i + 1).padStart(5, '0')}`,
      type: type as any,
      applicantType,
      applicantId: applicantType === '企业' ? enterprise.id : seeker.id,
      applicantName: applicantType === '企业' ? enterprise.name : seeker.name,
      employeeId: applicantType === '企业' ? seeker.id : undefined,
      employeeName: applicantType === '企业' ? seeker.name : undefined,
      amount,
      documents: requiredDocuments as any,
      status: status as any,
      auditTrail,
      appliedAt: randomDate(2025),
    } as any);
  }
  return apps;
}

export const MOCK_SUBSIDY_APPS = generateSubsidyApplications();

export function generateEnterpriseDashboard(enterpriseId: string): EnterpriseDashboard {
  const enterprise = ENTERPRISE_MAP.get(enterpriseId);
  const jobs = MOCK_JOBS.filter(j => j.enterpriseId === enterpriseId);
  const totalApps = jobs.reduce((sum, j) => sum + j.applicationsCount, 0);

  const recentApplications = Array.from({ length: 8 }, (_, i) => {
    const resume = randomItem(MOCK_RESUMES);
    const job = jobs[i % Math.max(1, jobs.length)];
    return {
      id: `app_${enterpriseId.slice(-5)}_${i}`,
      candidateName: resume.basicInfo.name,
      positionTitle: job?.title || '储备干部',
      matchScore: randomInt(62, 96),
      appliedAt: randomDate(2025),
      status: randomItem(['待筛选', '待面试', '面试中', '已录用', '已淘汰']),
    };
  });

  const upcomingInterviews = Array.from({ length: 5 }, (_, i) => {
    const resume = randomItem(MOCK_RESUMES);
    const job = jobs[i % Math.max(1, jobs.length)];
    return {
      id: `intv_${enterpriseId.slice(-5)}_${i}`,
      candidateName: resume.basicInfo.name,
      positionTitle: job?.title || '储备干部',
      date: `2025-0${randomInt(6, 7)}-${randomInt(10, 28)} ${randomInt(9, 17)}:00`,
      stage: [InterviewStage.WRITTEN_EXAM, InterviewStage.AI_SCREENING, InterviewStage.TECHNICAL, InterviewStage.HR, InterviewStage.DIRECTOR][i % 5],
    };
  });

  return {
    todayApplications: Math.round(totalApps * 0.02) + randomInt(1, 8),
    weekInterviews: randomInt(5, 25),
    monthHires: randomInt(3, 18),
    budgetUsed: randomInt(20000, 80000),
    budgetTotal: randomInt(80000, 200000),
    channelROI: MOCK_CHANNEL_ROI.slice(0, 6),
    recentApplications,
    upcomingInterviews,
  };
}

export function getEnterpriseById(id: string): Enterprise | undefined {
  return ENTERPRISE_MAP.get(id);
}

export function getJobById(id: string): JobPosition | undefined {
  return JOB_MAP.get(id);
}

export function getJobSeekerById(id: string): JobSeeker | undefined {
  return SEEKER_MAP.get(id);
}

export function getResumeById(id: string): Resume | undefined {
  return RESUME_MAP.get(id);
}

export function getJobsByTownship(code: TownshipCode): JobPosition[] {
  return MOCK_JOBS.filter(j => j.township === code);
}

export function getEnterprisesByTownship(code: TownshipCode): Enterprise[] {
  return MOCK_ENTERPRISES.filter(e => e.township === code);
}

export function getJobsByEnterprise(enterpriseId: string): JobPosition[] {
  return MOCK_JOBS.filter(j => j.enterpriseId === enterpriseId);
}

export function getResumesByEnterprise(enterpriseId: string): Resume[] {
  return MOCK_RESUMES.slice(0, 40);
}
