import {
  TownshipCode,
  IndustryTag,
  JobSeekerType,
  InterviewStage,
  RPOStageEnum,
  ApplicationStatus,
  SubsidyType,
  SubsidyStatus,
  JobSeeker,
  Resume,
  SkillItem,
  EducationItem,
  WorkItem,
  ProjectItem,
  Enterprise,
  JobPosition,
  RequiredSkill,
  RPOProject,
  TalentCandidate,
  BackgroundCheck,
  MatchResult,
  Application,
  ChannelROI,
  SubsidyApplication,
  AuditStep,
  MatchDetails,
  ResumeParseResult,
  JDMatchResult,
  SkillAlignmentResult,
  DifferentiationResult,
  DifferentiationType,
  JobWithMatch,
} from '../../shared/types';
import { TOWNSHIPS } from './townships';

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomFloat = (min: number, max: number, decimals: number = 2): number => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
};

export const randomPick = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const randomPicks = <T>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
};

export const randomDate = (start: Date, end: Date): string => {
  const time = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(time).toISOString();
};

export const randomPhone = (): string => {
  const prefixes = ['138', '139', '137', '136', '135', '158', '159', '188', '189', '177'];
  const prefix = randomPick(prefixes);
  const suffix = String(randomInt(10000000, 99999999));
  return prefix + suffix;
};

export const weightedPick = <T>(items: { value: T; weight: number }[]): T => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item.value;
  }
  return items[0].value;
};

export const pickTownshipByIndustry = (industry: IndustryTag): TownshipCode => {
  const items = TOWNSHIPS.map(t => ({
    value: t.code,
    weight: t.enterpriseWeight[industry] || 1
  }));
  return weightedPick(items);
};

const SURNAMES = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '林', '郭', '何', '高', '罗', '梁', '宋', '郑', '谢', '唐', '邓', '冯', '曾', '曹', '彭', '蔡', '潘', '田', '董', '袁', '于', '蒋', '余', '叶', '程'];
const GIVEN_NAMES_CHINESE = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英', '文', '华', '鑫', '建国', '志强', '建华', '丽娟', '晓明', '雪梅', '玉兰', '志伟', '丽英', '慧', '颖', '鹏', '超', '峰', '辉', '琳', '玲', '桂芳', '俊', '凯', '帅', '浩', '宇', '晨', '佳', '乐', '鑫', '宁', '静', '婷', '雪', '倩', '琳', '瑶', '琴', '霞'];

export const randomChineseName = (): string => {
  const surname = randomPick(SURNAMES);
  const givenName = randomPick(GIVEN_NAMES_CHINESE);
  return surname + givenName;
};

const HARDWARE_ENTERPRISE_PREFIXES = ['中山', '广东', '华南', '顺达', '恒达', '宏达', '金达', '盛达', '鑫达', '永达', '万达', '利达', '安盛', '华盛', '泰盛', '德盛', '昌盛', '鼎盛', '宏盛', '国盛'];
const HARDWARE_ENTERPRISE_SUFFIXES = ['五金制品有限公司', '精密五金有限公司', '五金塑胶有限公司', '金属制品有限公司', '五金电子有限公司', '模具有限公司', '冲压件有限公司', '机械五金有限公司', '五金电器有限公司', '不锈钢制品有限公司'];
const LIGHTING_ENTERPRISE_SUFFIXES = ['照明电器有限公司', '灯饰有限公司', '光电科技有限公司', '照明科技有限公司', 'LED照明有限公司', '灯饰电器有限公司', '智能照明有限公司', '光电有限公司'];
const CASUALWEAR_ENTERPRISE_SUFFIXES = ['服装有限公司', '服饰有限公司', '制衣有限公司', '针织有限公司', '纺织服装有限公司', '休闲服饰有限公司', '牛仔服饰有限公司', '制衣厂有限公司'];
const FURNITURE_ENTERPRISE_SUFFIXES = ['家具有限公司', '办公家具有限公司', '红木家具有限公司', '家居用品有限公司', '智能家居有限公司', '实木家具有限公司', '家具制造有限公司', '户外家具有限公司'];
const ELECTRONICS_ENTERPRISE_SUFFIXES = ['电子科技有限公司', '电子有限公司', '电子电器有限公司', '智能科技有限公司', '光电科技有限公司', '微电子有限公司', '通信科技有限公司', '数码科技有限公司'];
const MACHINERY_ENTERPRISE_SUFFIXES = ['机械有限公司', '机械设备有限公司', '精密机械有限公司', '自动化设备有限公司', '机械制造有限公司', '数控机床有限公司', '工业设备有限公司', '智能装备有限公司'];
const APPLIANCE_ENTERPRISE_SUFFIXES = ['电器有限公司', '家电有限公司', '生活电器有限公司', '厨卫电器有限公司', '智能家电有限公司', '电器科技有限公司', '家用电器有限公司', '小家电有限公司'];
const FOOD_ENTERPRISE_SUFFIXES = ['食品有限公司', '食品科技有限公司', '农产品有限公司', '肉制品有限公司', '饮料有限公司', '食品工业有限公司', '粮油食品有限公司', '健康食品有限公司'];
const NEWENERGY_ENTERPRISE_SUFFIXES = ['新能源科技有限公司', '光伏科技有限公司', '储能科技有限公司', '能源科技有限公司', '新能源汽车有限公司', '动力电池有限公司', '智能能源有限公司', '电力科技有限公司'];
const ROBOTICS_ENTERPRISE_SUFFIXES = ['机器人科技有限公司', '智能装备有限公司', '自动化科技有限公司', '工业机器人有限公司', '智能机器人有限公司', '人工智能科技有限公司', '智能制造有限公司', '工业自动化有限公司'];

const ENTERPRISE_SUFFIX_MAP: Record<IndustryTag, string[]> = {
  [IndustryTag.HARDWARE]: HARDWARE_ENTERPRISE_SUFFIXES,
  [IndustryTag.LIGHTING]: LIGHTING_ENTERPRISE_SUFFIXES,
  [IndustryTag.CASUALWEAR]: CASUALWEAR_ENTERPRISE_SUFFIXES,
  [IndustryTag.FURNITURE]: FURNITURE_ENTERPRISE_SUFFIXES,
  [IndustryTag.ELECTRONICS]: ELECTRONICS_ENTERPRISE_SUFFIXES,
  [IndustryTag.MACHINERY]: MACHINERY_ENTERPRISE_SUFFIXES,
  [IndustryTag.APPLIANCE]: APPLIANCE_ENTERPRISE_SUFFIXES,
  [IndustryTag.FOOD]: FOOD_ENTERPRISE_SUFFIXES,
  [IndustryTag.NEWENERGY]: NEWENERGY_ENTERPRISE_SUFFIXES,
  [IndustryTag.ROBOTICS]: ROBOTICS_ENTERPRISE_SUFFIXES
};

export const randomEnterpriseName = (industry: IndustryTag): { full: string; short: string } => {
  const prefix = randomPick(HARDWARE_ENTERPRISE_PREFIXES);
  const suffix = randomPick(ENTERPRISE_SUFFIX_MAP[industry]);
  const middleWords = ['金', '顺', '泰', '盛', '华', '昌', '达', '鑫', '宏', '德', '瑞', '祥', '鑫', '恒', '永'];
  const middle = randomPick(middleWords) + randomPick(middleWords);
  const full = prefix + middle + suffix;
  const short = prefix + middle;
  return { full, short };
};

export const randomEnterpriseScale = (employeeCount: number): Enterprise['scale'] => {
  if (employeeCount < 20) return '20人以下';
  if (employeeCount < 100) return '20-99人';
  if (employeeCount < 500) return '100-499人';
  if (employeeCount < 1000) return '500-999人';
  if (employeeCount < 10000) return '1000-9999人';
  return '10000人以上';
};

const WELFARE_OPTIONS = ['五险一金', '包食宿', '带薪年假', '节日福利', '员工体检', '年终奖', '绩效奖金', '全勤奖', '加班费', '班车接送', '员工旅游', '培训提升', '弹性工作', '股权激励', '通讯补贴', '交通补贴', '餐补', '住房补贴', '高温补贴', '生日福利'];

const INDUSTRY_JOB_MAP: Record<IndustryTag, { positions: string[]; departments: string[] }> = {
  [IndustryTag.HARDWARE]: {
    positions: ['五金冲压工', 'CNC操作工', '线切割师傅', '模具师傅', '磨床技工', '铣床技工', '车床技工', '钳工', '钣金工', '焊接工', '喷涂工', '抛光工', '装配工', '品检员', '五金设计工程师', '模具设计师', 'QE工程师', '生产主管', '车间主任', '物料员'],
    departments: ['冲压车间', 'CNC车间', '模具部', '装配部', '喷涂车间', '品质部', '工程部', '生产部', '物控部']
  },
  [IndustryTag.LIGHTING]: {
    positions: ['灯饰装配工', 'LED焊锡工', '电子维修员', '灯饰结构工程师', 'LED驱动工程师', '灯具设计师', '光学工程师', '品检员', '包装工', '贴片机操作', '注塑工', '喷涂工', '组装线长', 'QE技术员', '外贸业务员', '电商运营', '仓库管理员', '物料采购员', '生产计划员', '售后技术员'],
    departments: ['装配车间', '电子车间', '喷涂车间', '注塑车间', '研发部', '品质部', '外贸部', '电商部', '仓储部', '采购部']
  },
  [IndustryTag.CASUALWEAR]: {
    positions: ['服装缝纫工', '平车工', '烫工', '剪裁工', '服装设计师', '打版师', '样衣工', 'QC品检', '车间组长', '仓库理货', '面料采购员', '跟单员', '电商客服', '美工设计', '直播带货主播', '运营助理', '生产主管', 'IE工程师', '设备维修工', '洗水工'],
    departments: ['缝纫车间', '剪裁车间', '后整部', '设计部', '技术部', '品质部', '电商部', '仓储部', '采购部', '生产部']
  },
  [IndustryTag.FURNITURE]: {
    positions: ['木工开料', '木工雕刻', '油漆工', '扪皮工', '贴皮工', '安装工', '家具设计师', '结构工程师', '木工师傅', '打磨工', '封边机操作', '排钻工', '品检员', '仓管员', '销售顾问', '安装售后', '采购专员', '生产计划', '跟单员', '绘图员'],
    departments: ['木工车间', '油漆车间', '软体车间', '安装部', '研发部', '品质部', '销售部', '仓储部', '采购部']
  },
  [IndustryTag.ELECTRONICS]: {
    positions: ['SMT操作员', '波峰焊技术员', '电子装配工', '测试工程师', '硬件工程师', '软件工程师', 'PCB设计', '维修技术员', 'IQC检验员', 'IPQC巡检', 'OQC出货检', '仓库管理员', '采购员', 'PM项目经理', 'FAE现场应用', 'PE产品工程师', 'TE测试工程', '生产组长', '物料员', '文员'],
    departments: ['SMT车间', '插件车间', '装配车间', '研发部', '测试部', '品质部', '仓储部', '采购部', '项目部']
  },
  [IndustryTag.MACHINERY]: {
    positions: ['数控车床师傅', '数控铣床师傅', '加工中心操作', '磨床师傅', '线切割师傅', '电火花师傅', '机械设计师', '电气工程师', '装配钳工', '液压技术员', '设备维修工', '品检员', '龙门铣师傅', '镗床师傅', '焊接师傅', '钣金工程师', '生产主管', '工艺工程师', '仓库管理员', '售后工程师'],
    departments: ['机加工车间', '装配车间', '焊接车间', '钣金车间', '研发部', '工艺部', '品质部', '售后部', '仓储部']
  },
  [IndustryTag.APPLIANCE]: {
    positions: ['注塑机调机师', '注塑工', '装配工', '品质检验', '模具师傅', '结构工程师', '电子工程师', 'QE工程师', '丝印工', '喷油工', '组装线长', '物料员', '仓管员', '生产计划', '采购员', '测试员', '售后维修', '技术支持', '销售业务员', '车间主管'],
    departments: ['注塑车间', '装配车间', '喷涂车间', '丝印车间', '研发部', '品质部', '生产部', '仓储部', '采购部', '销售部']
  },
  [IndustryTag.FOOD]: {
    positions: ['食品生产工', '包装工', '品检员', '烘焙师傅', '研发工程师', 'QA品质保证', 'QC检验员', '冷库管理员', '配料员', '发酵工', '屠宰工', '清洗工', '设备维修工', '仓库管理员', '采购员', '销售代表', '电商运营', '叉车司机', '化验员', '生产班长'],
    departments: ['生产车间', '包装车间', '冷库', '研发部', '品控部', '仓储部', '采购部', '销售部', '物流部']
  },
  [IndustryTag.NEWENERGY]: {
    positions: ['光伏安装工', '电池片操作工', '组件装配工', 'PACK工程师', 'BMS工程师', '储能系统工程师', '电气工程师', '工艺工程师', '设备技术员', '品检员', '测试工程师', '研发工程师', '项目经理', '施工员', '安全员', '仓管员', '采购员', '销售工程师', '技术支持', '生产主管'],
    departments: ['电池车间', '组件车间', 'PACK车间', '研发部', '工程部', '品质部', '项目部', '仓储部', '采购部']
  },
  [IndustryTag.ROBOTICS]: {
    positions: ['机器人调试工程师', '机械设计工程师', '电气设计工程师', 'PLC程序员', '视觉工程师', '自动化集成', '机器人培训师', '售后工程师', '装配钳工', '电气接线员', '测试工程师', '项目工程师', '销售工程师', '算法工程师', 'ROS开发', '嵌入式开发', '品检员', '工艺工程师', '仓管员', '技术文档'],
    departments: ['研发部', '电气部', '软件部', '装配部', '调试部', '项目一部', '项目二部', '销售部', '售后部']
  }
};

export const randomJobTitle = (industry: IndustryTag): { title: string; department: string } => {
  const { positions, departments } = INDUSTRY_JOB_MAP[industry];
  return {
    title: randomPick(positions),
    department: randomPick(departments)
  };
};

export const randomSalaryRange = (type: JobSeekerType): { min: number; max: number } => {
  switch (type) {
    case JobSeekerType.BLUECOLLAR: {
      const min = randomInt(4000, 6000);
      const max = min + randomInt(1500, 3000);
      return { min, max: Math.min(max, 8500) };
    }
    case JobSeekerType.SKILLED: {
      const min = randomInt(6000, 10000);
      const max = min + randomInt(2500, 6000);
      return { min, max: Math.min(max, 15000) };
    }
    case JobSeekerType.GRADUATE: {
      const min = randomInt(4000, 5500);
      const max = min + randomInt(1000, 2500);
      return { min, max: Math.min(max, 7500) };
    }
  }
};

const COMMON_SKILLS: Record<JobSeekerType, string[]> = {
  [JobSeekerType.BLUECOLLAR]: ['冲压操作', '焊接', '喷涂', '装配', '包装', '搬运', '物料分拣', '清洁', '品检基础', '叉车驾驶', '电工基础', '机修基础', 'CNC基础操作', '注塑机操作', '缝纫', '开料', '打磨', '抛光'],
  [JobSeekerType.SKILLED]: ['CNC编程', '模具设计', '数控车床', '数控铣床', '线切割', '电火花', '磨床精密', '钳工高级', '焊接高级', '电工证', 'PLC编程', 'AutoCAD', 'SolidWorks', 'Pro/E', 'UG', 'Mastercam', '液压系统', '电气布线', '变频器调试', '机器人示教'],
  [JobSeekerType.GRADUATE]: ['Office办公', 'AutoCAD基础', 'SolidWorks基础', 'Python', 'C语言', '英语四级', '英语六级', '数据分析', '沟通表达', '团队协作', '学习能力强', '抗压能力', 'PPT制作', 'Excel函数', 'PS基础', '视频剪辑', '新媒体运营', '电商运营基础']
};

export const randomSkills = (type: JobSeekerType, count: number): SkillItem[] => {
  const pool = COMMON_SKILLS[type];
  const picked = randomPicks(pool, count);
  const typeStr = type as string;
  return picked.map((name, idx) => ({
    id: `sk_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    proficiency: randomInt(1, 5) as 1 | 2 | 3 | 4 | 5,
    category: typeStr === '蓝领' ? '基础操作' : typeStr === '技工' ? '专业技能' : '综合能力',
    years: typeStr === '应届生' ? randomFloat(0.5, 3, 1) : randomFloat(1, 12, 1)
  }));
};

const SCHOOLS: Record<EducationItem['degree'], string[]> = {
  '高中': ['中山纪念中学', '中山市第一中学', '中山市华侨中学', '中山市实验中学', '中山市第二中学', '中山市桂山中学', '中山市杨仙逸中学', '小榄中学', '古镇高级中学', '东升高级中学'],
  '中专': ['中山市中等专业学校', '中山市技师学院', '中山火炬职业技术学院中专部', '中山市工贸技工学校', '中山市启航技工学校', '中山市现美美容美发职业培训学校'],
  '大专': ['中山火炬职业技术学院', '中山职业技术学院', '广东理工职业学院中山校区', '中山开放大学', '中山市广播电视大学'],
  '本科': ['电子科技大学中山学院', '广东药科大学中山校区', '中山火炬职业技术学院专升本', '广东工业大学（中山）', '华南理工大学继续教育学院中山教学点'],
  '硕士': ['中山大学管理学院中山MBA', '华南理工大学中山教学点', '暨南大学中山MBA', '广东财经大学中山研究生班'],
  '博士': ['中山大学中山博士后流动站', '华南理工大学博士后工作站']
};

const MAJORS = ['机械设计制造', '机电一体化', '数控技术', '模具设计与制造', '焊接技术', '电气自动化', '电子信息工程', '计算机应用', '软件工程', '会计学', '物流管理', '市场营销', '电子商务', '工商管理', '人力资源', '国际贸易', '英语', '商务英语', '服装设计', '工业设计', '食品科学', '化学工程', '环境工程', '土木工程', '汽车维修'];

export const randomEducation = (maxDegree: EducationItem['degree'] | '初中'): EducationItem[] => {
  const degrees: EducationItem['degree'][] = ['高中', '中专', '大专', '本科', '硕士', '博士'];
  const actualMaxDegree: EducationItem['degree'] = maxDegree === '初中' ? '高中' : maxDegree;
  const maxIdx = degrees.indexOf(actualMaxDegree);
  const result: EducationItem[] = [];
  const count = maxIdx >= 3 ? randomInt(2, 3) : randomInt(1, 2);
  for (let i = 0; i < Math.min(count, maxIdx + 1); i++) {
    const degree = degrees[Math.min(maxIdx - i, maxIdx)];
    const school = randomPick(SCHOOLS[degree]);
    const major = randomPick(MAJORS);
    const endYear = randomInt(2005, 2024);
    const duration = degree === '博士' ? 4 : degree === '硕士' ? 3 : degree === '本科' ? 4 : 3;
    result.push({
      id: `edu_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      school,
      major,
      degree,
      startDate: `${endYear - duration}-09-01`,
      endDate: `${endYear}-06-30`,
      description: i === 0 ? `主修课程：${randomPicks(MAJORS, 4).join('、')}` : undefined
    });
  }
  return result.sort((a, b) => a.startDate.localeCompare(b.startDate));
};

const ENTERPRISE_POOL_FOR_WORK = ['美的集团', '格力电器', 'TCL王牌电器', '长虹电子', '奥马电器', '格兰仕集团', '木林森照明', '华帝股份', '长青集团', '达华智能', '中顺洁柔', '乐心医疗', '通宇通讯', '广东顶固', '大洋电机', '江龙船艇', '完美（中国）', '曼秀雷敦', '联邦制药', '雅居乐地产'];

export const randomWorkHistory = (type: JobSeekerType, workYears: number): WorkItem[] => {
  const industry = randomPick(Object.values(IndustryTag));
  const { positions } = INDUSTRY_JOB_MAP[industry];
  const jobCount = workYears < 2 ? 1 : workYears < 5 ? randomInt(1, 2) : randomInt(2, 3);
  const result: WorkItem[] = [];
  let endYear = 2024;
  for (let i = 0; i < jobCount; i++) {
    const yearsInJob = i === jobCount - 1 ? Math.min(workYears, i === 0 ? workYears : randomInt(1, 3)) : randomInt(1, 3);
    const startYear = endYear - yearsInJob;
    const salary = type === JobSeekerType.BLUECOLLAR ? randomInt(4000, 6500) : type === JobSeekerType.SKILLED ? randomInt(6500, 12000) : randomInt(4500, 7000);
    result.push({
      id: `work_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`,
      company: randomPick(ENTERPRISE_POOL_FOR_WORK),
      position: randomPick(positions),
      startDate: `${startYear}-${randomInt(1, 12).toString().padStart(2, '0')}-01`,
      endDate: i === 0 ? '至今' : `${endYear}-${randomInt(1, 12).toString().padStart(2, '0')}-28`,
      salary,
      highlights: [
        `负责${randomPick(['车间生产', '设备操作', '品质管控', '工艺优化', '团队管理'])}相关工作`,
        `${randomPick(['日产量', '合格率', '效率', '良品率'])}提升${randomInt(5, 25)}%`,
        `参与${randomPick(['新产品导入', '产线改造', '工艺升级', '设备更新'])}项目`
      ]
    });
    endYear = startYear;
  }
  return result;
};

export const createJobSeeker = (id: string): JobSeeker => {
  const gender: '男' | '女' = Math.random() > 0.35 ? '男' : '女';
  const type = weightedPick<JobSeekerType>([
    { value: JobSeekerType.BLUECOLLAR, weight: 55 },
    { value: JobSeekerType.SKILLED, weight: 30 },
    { value: JobSeekerType.GRADUATE, weight: 15 }
  ]);
  const age = type === JobSeekerType.GRADUATE ? randomInt(20, 24) : randomInt(18, 52);
  const workYears = type === JobSeekerType.GRADUATE ? randomInt(0, 1) : Math.max(0, age - 20 - randomInt(0, 3));
  const degrees: EducationItem['degree'][] = type === JobSeekerType.GRADUATE ? ['大专', '本科', '硕士'] : type === JobSeekerType.SKILLED ? ['高中', '中专', '大专'] : ['高中', '中专'];
  const highestDegree = randomPick(degrees);
  const { positions } = INDUSTRY_JOB_MAP[randomPick(Object.values(IndustryTag))];
  const expectPosition = randomPick(positions);
  const expect = randomSalaryRange(type);
  const tagsPool = [
    '有电工证', '有焊工证', '有叉车证', '会CAD绘图', '会Office办公', '英语良好', '接受加班', '接受倒班',
    '吃苦耐劳', '沟通能力强', '有团队管理经验', '急上岗', '可出差', '有驾驶证', '有住宿需求',
    '本地人', '有社保要求', '有年终奖要求', '会开CNC', '会编程'
  ];
  return {
    id,
    name: randomChineseName(),
    gender,
    age,
    phone: randomPhone(),
    type,
    township: randomPick(TOWNSHIPS).code,
    expectPosition,
    expectSalaryMin: expect.min,
    expectSalaryMax: expect.max,
    status: randomPick(['求职中', '求职中', '在职看机会', '暂不考虑']),
    workYears,
    highestDegree,
    tags: randomPicks(tagsPool, randomInt(2, 5)),
    createdAt: randomDate(new Date(2023, 0, 1), new Date(2024, 5, 1))
  };
};

export const createResume = (id: string, jobSeeker: JobSeeker): Resume => {
  const graduateType = (jobSeeker.type as string) === '应届生';
  return {
    id,
    jobSeekerId: jobSeeker.id,
    title: `${jobSeeker.expectPosition}求职简历`,
    skills: randomSkills(jobSeeker.type, randomInt(3, 6)),
    educationList: randomEducation(jobSeeker.highestDegree),
    workList: jobSeeker.workYears >= 1 ? randomWorkHistory(jobSeeker.type, jobSeeker.workYears) : [],
    projectList: graduateType ? [{
      id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: '毕业设计/实习项目',
      role: randomPick(['项目成员', '项目负责人', '技术开发']),
      startDate: '2023-09-01',
      endDate: '2024-05-30',
      description: `${jobSeeker.expectPosition}相关的实践项目，涵盖核心技能应用`,
      achievements: ['完成项目全部功能开发', '通过导师验收答辩', '获得优秀项目评价']
    }] : [],
    certificates: [],
    selfEvaluation: `${jobSeeker.type}求职者，${jobSeeker.workYears}年${jobSeeker.expectPosition}相关工作经验，${jobSeeker.tags.slice(0, 3).join('、')}。工作积极主动，具有良好的团队合作精神和沟通能力，期望加入贵公司共同发展。`,
    updatedAt: randomDate(new Date(2024, 0, 1), new Date(2024, 5, 30))
  } as any;
};

export const createEnterprise = (id: string): Enterprise => {
  const industry = weightedPick<IndustryTag>([
    { value: IndustryTag.HARDWARE, weight: 18 },
    { value: IndustryTag.LIGHTING, weight: 15 },
    { value: IndustryTag.CASUALWEAR, weight: 12 },
    { value: IndustryTag.FURNITURE, weight: 12 },
    { value: IndustryTag.ELECTRONICS, weight: 14 },
    { value: IndustryTag.MACHINERY, weight: 10 },
    { value: IndustryTag.APPLIANCE, weight: 8 },
    { value: IndustryTag.FOOD, weight: 5 },
    { value: IndustryTag.NEWENERGY, weight: 3 },
    { value: IndustryTag.ROBOTICS, weight: 3 }
  ]);
  const township = pickTownshipByIndustry(industry);
  const townshipData = TOWNSHIPS.find(t => t.code === township)!;
  const names = randomEnterpriseName(industry);
  const employeeCount = randomInt(15, 3500);
  const welfareCount = randomInt(5, 10);
  return {
    id,
    name: names.full,
    shortName: names.short,
    licenseNo: `91442000${randomInt(1000000000, 9999999999).toString()}X`,
    legalRepresentative: randomChineseName(),
    industry,
    township,
    address: `中山市${townshipData.name}${randomPick(['工业大道', '兴业路', '创业路', '科技路', '工业园', '工业区', '同乐路', '万福路', '朝阳路', '建设路'])}${randomInt(1, 200)}号`,
    scale: randomEnterpriseScale(employeeCount),
    registeredCapital: randomInt(50, 5000),
    establishedYear: randomInt(1998, 2022),
    description: `成立于${randomInt(1998, 2022)}年，位于中山市${townshipData.name}，专业从事${industry}相关产品的研发、生产和销售。公司拥有先进的生产设备和专业的技术团队，产品远销国内外市场，在行业内享有良好的声誉。`,
    welfare: randomPicks(WELFARE_OPTIONS, welfareCount),
    contactName: randomChineseName(),
    contactPhone: randomPhone(),
    contactEmail: `hr${randomInt(100, 999)}@${names.short.toLowerCase()}${randomPick(['.com', '.cn', '.com.cn'])}`,
    verified: Math.random() > 0.12,
    employeeCount,
    openPositionCount: randomInt(1, 25),
    createdAt: randomDate(new Date(2020, 0, 1), new Date(2024, 1, 1))
  } as any;
};

export const createJobPosition = (id: string, enterprise: Enterprise): JobPosition => {
  const { title, department } = randomJobTitle(enterprise.industry);
  const type = weightedPick<JobSeekerType>([
    { value: JobSeekerType.BLUECOLLAR, weight: 50 },
    { value: JobSeekerType.SKILLED, weight: 38 },
    { value: JobSeekerType.GRADUATE, weight: 12 }
  ]);
  const salary = randomSalaryRange(type);
  const expOptions: JobPosition['experience'][] = type === JobSeekerType.GRADUATE ? ['应届生', '不限'] : ['不限', '1-3年', '3-5年', '5-10年'];
  const eduOptions: JobPosition['education'][] = type === JobSeekerType.GRADUATE ? ['大专', '本科', '不限'] : type === JobSeekerType.SKILLED ? ['不限', '高中', '中专', '大专'] : ['不限', '高中', '中专'];
  const skillsPool = COMMON_SKILLS[type];
  const requiredSkillCount = randomInt(2, 4);
  const requiredSkills: RequiredSkill[] = randomPicks(skillsPool, requiredSkillCount).map((name, idx) => ({
    id: `req_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    required: idx < Math.min(2, requiredSkillCount),
    minProficiency: idx < 2 ? (randomInt(3, 4) as 3 | 4) : undefined,
    weight: idx === 0 ? 35 : idx === 1 ? 25 : idx === 2 ? 20 : 20
  }));
  const township = TOWNSHIPS.find(t => t.code === enterprise.township)!;
  const skilledType = (type as string) === '技工';
  return {
    id,
    enterpriseId: enterprise.id,
    title,
    department,
    industry: enterprise.industry,
    township: enterprise.township,
    address: `${township.name}${enterprise.address.split(township.name)[1] || ''}`,
    type,
    salaryMin: salary.min,
    salaryMax: salary.max,
    salaryType: randomPick(['月薪', '月薪', '月薪', '计件', '日薪']),
    experience: randomPick(expOptions),
    education: randomPick(eduOptions),
    requiredSkills,
    jobDescription: `${title}岗位的详细描述，负责日常生产运营相关工作。`,
    responsibilities: [
      `负责${title}日常作业，严格按SOP执行`,
      `${randomPick(['维护保养', '巡检记录', '异常处理', '工艺执行', '品质管控'])}工作落实`,
      '配合完成生产计划，达成产量和品质目标',
      '遵守车间5S管理和安全生产规范',
      '完成上级交办的其他工作任务'
    ],
    requirements: [
      `学历${randomPick(eduOptions)}以上，${title}相关经验优先`,
      `具备${requiredSkills.slice(0, 2).map(s => s.name).join('、')}相关技能`,
      `身体健康，能${randomPick(['适应加班', '适应倒班', '吃苦耐劳', '服从安排'])}`,
      `${skilledType ? '持有相关职业资格证书优先' : '有无经验均可，提供岗前培训'}`,
      '责任心强，具有良好的团队合作精神'
    ],
    benefits: randomPicks(enterprise.welfare, randomInt(3, 5)),
    hiringCount: randomInt(1, 10),
    status: randomPick(['招聘中', '招聘中', '招聘中', '已暂停', '已关闭']),
    urgent: Math.random() > 0.75,
    publishedAt: randomDate(new Date(2024, 2, 1), new Date(2024, 5, 30)),
    deadline: '2024-12-31',
    viewCount: randomInt(50, 3000),
    applicationCount: randomInt(3, 80),
    channel: randomPick(['BOSS直聘', '智联招聘', '前程无忧', '58同城', '本地招聘网', '厂区直招', '员工推荐'])
  } as any;
};

export const createMatchResult = (
  id: string,
  jobSeekerId: string,
  positionId: string,
  skills: SkillItem[],
  positionSkills: RequiredSkill[]
): MatchResult => {
  const matchedSkills = skills.filter(s => positionSkills.some(ps => ps.name.includes(s.name.slice(0, 2)) || s.name.includes(ps.name.slice(0, 2))));
  const skillMatch = Math.round((matchedSkills.length / Math.max(positionSkills.length, 1)) * 100);
  const experienceMatch = randomInt(40, 95);
  const educationMatch = randomInt(50, 90);
  const salaryMatch = randomInt(55, 92);
  const locationMatch = randomInt(60, 98);
  const overall = Math.round((skillMatch * 0.35 + experienceMatch * 0.25 + educationMatch * 0.15 + salaryMatch * 0.1 + locationMatch * 0.15));
  const gaps: { dimension: any; score: number; description: string; suggestion: string }[] = [];
  if (skillMatch < 70) gaps.push({ dimension: 'skillMatch', score: skillMatch, description: '技能匹配度略低，部分核心技能未掌握', suggestion: '建议补充相关技能培训或考取职业资格证书' });
  if (experienceMatch < 60) gaps.push({ dimension: 'experienceMatch', score: experienceMatch, description: '工作经验略有欠缺', suggestion: '可从基础岗位做起，逐步积累经验' });
  if (educationMatch < 65) gaps.push({ dimension: 'educationMatch', score: educationMatch, description: '学历要求有差距', suggestion: '可通过学历提升课程提高学历水平' });
  if (salaryMatch < 65) gaps.push({ dimension: 'salaryMatch', score: salaryMatch, description: '薪资期望与岗位有差距', suggestion: '可适当调整薪资期望或考虑绩效奖金部分' });
  const strengths: string[] = [];
  if (skillMatch >= 70) strengths.push(`技能高度匹配：${matchedSkills.slice(0, 2).map(s => s.name).join('、')}`);
  if (experienceMatch >= 80) strengths.push('工作经验丰富，上手快');
  if (locationMatch >= 85) strengths.push('地理位置近，通勤方便');
  if (educationMatch >= 80) strengths.push('学历满足并有竞争力');
  if (strengths.length === 0) strengths.push('综合条件符合岗位基本要求');
  return {
    id,
    jobSeekerId,
    positionId,
    overallScore: overall,
    dimensions: { skillMatch, experienceMatch, educationMatch, salaryMatch, locationMatch },
    gapAnalysis: {
      missingSkills: [],
      improvementSuggestions: gaps.map(g => g.suggestion)
    },
    gaps: gaps as any,
    strengths,
    matchedAt: randomDate(new Date(2024, 3, 1), new Date(2024, 6, 10)),
    recommended: overall >= 70
  } as any;
};

export const createRPOProject = (id: string, idx: number, enterprises: Enterprise[]): RPOProject => {
  const enterprise = randomPick(enterprises);
  const { title } = randomJobTitle(enterprise.industry);
  const stage = weightedPick<RPOStageEnum>([
    { value: RPOStageEnum.DEMAND, weight: 5 },
    { value: RPOStageEnum.SOURCING, weight: 15 },
    { value: RPOStageEnum.SCREENING, weight: 18 },
    { value: RPOStageEnum.INTERVIEW, weight: 22 },
    { value: RPOStageEnum.OFFER, weight: 15 },
    { value: RPOStageEnum.ONBOARD, weight: 10 },
    { value: RPOStageEnum.GUARANTEE, weight: 8 },
    { value: RPOStageEnum.COMPLETED, weight: 5 },
    { value: RPOStageEnum.CANCELLED, weight: 2 }
  ]);
  const salary = randomSalaryRange(JobSeekerType.SKILLED);
  const hiringCount = randomInt(3, 25);
  const filledCount = stage === RPOStageEnum.COMPLETED ? hiringCount : Math.min(hiringCount, randomInt(0, hiringCount - 1));
  const startDate = randomDate(new Date(2024, 0, 1), new Date(2024, 4, 1));
  const start = new Date(startDate);
  const expected = new Date(start.getTime() + randomInt(60, 120) * 24 * 60 * 60 * 1000);
  const candidateCount = Math.min(30, hiringCount * randomInt(2, 4));
  const candidates: TalentCandidate[] = [];
  const bgChecks: BackgroundCheck[] = [];
  const statuses: TalentCandidate['status'][] = ['待推荐', '已推荐', '已接受', '已拒绝', '面试中', '已发Offer', '已入职', '已淘汰'];
  const stages: InterviewStage[] = [InterviewStage.WRITTEN, InterviewStage.AISCREEN, InterviewStage.TECH, InterviewStage.HR, InterviewStage.DIRECTOR];
  for (let i = 0; i < candidateCount; i++) {
    const status = randomPick(statuses);
    candidates.push({
      id: `tc_${id}_${i}`,
      rpoProjectId: id,
      resumeId: `res_${randomInt(1, 500)}`,
      jobSeekerId: `js_${randomInt(1, 500)}`,
      tags: randomPicks(['经验丰富', '学历达标', '技能匹配', '本地人选', '稳定性好'], randomInt(2, 4)),
      activityScore: randomInt(50, 100),
      stage: status,
      status,
      touchHistory: [],
      currentStage: status === '面试中' ? randomPick(stages) : null,
      recommendReason: `符合${title}岗位要求，${randomPick(['技术背景扎实', '工作经验匹配', '稳定性好', '薪资期望合理', '沟通表达良好'])}，推荐面试。`,
      feedback: status === '已淘汰' ? randomPick(['技术不符合', '薪资谈不拢', '候选人放弃', '面试表现一般']) : undefined,
      matchScore: randomInt(60, 95),
      updatedAt: randomDate(new Date(2024, 3, 1), new Date(2024, 6, 10))
    } as any);
    if (status === '已发Offer' || status === '已入职') {
      ['学历验证', '工作履历核实', '不良记录核查', '职业资格核实'].forEach((item, bi) => {
        bgChecks.push({
          id: `bg_${id}_${i}_${bi}`,
          candidateId: `tc_${id}_${i}`,
          resultLevel: Math.random() > 0.1 ? '良好' : '不合格',
          checkItems: [{
            project: item,
            result: Math.random() > 0.1 ? '通过' : '不通过'
          }],
          operator: randomChineseName(),
          checkedAt: randomDate(new Date(2024, 4, 1), new Date(2024, 6, 10))
        } as any);
      });
    }
  }
  return {
    id,
    code: `RPO${(2024000 + idx).toString()}`,
    name: `${enterprise.shortName}-${title}批量招聘项目`,
    enterpriseId: enterprise.id,
    enterpriseName: enterprise.name,
    positionTitle: title,
    positionIds: [],
    industry: enterprise.industry,
    township: enterprise.township,
    headcount: hiringCount,
    filledCount,
    salaryMin: salary.min,
    salaryMax: salary.max,
    status: stage as any,
    stages: [],
    priority: randomPick(['普通', '加急', '特急']),
    feeRate: randomFloat(8, 25, 1),
    guaranteePeriod: randomPick([30, 60, 90]),
    consultant: randomChineseName(),
    consultantPhone: randomPhone(),
    budget: randomInt(50000, 500000),
    startDate,
    deadline: expected.toISOString().slice(0, 10),
    completedDate: stage === RPOStageEnum.COMPLETED ? randomDate(new Date(2024, 4, 1), new Date(2024, 6, 10)).slice(0, 10) : undefined,
    talentPoolIds: [],
    candidates,
    createdAt: startDate,
    stage,
    owner: randomChineseName(),
    ownerPhone: randomPhone(),
    expectedDate: expected.toISOString().slice(0, 10),
    backgroundChecks: bgChecks
  } as any;
};

export const createApplication = (
  id: string,
  jobSeekerId: string,
  position: JobPosition
): Application => {
  const statuses: ApplicationStatus[] = [ApplicationStatus.PENDING, ApplicationStatus.VIEWED, ApplicationStatus.SCREEN_PASS, ApplicationStatus.INTERVIEW, ApplicationStatus.OFFER, ApplicationStatus.HIRED, ApplicationStatus.UNSUITABLE, ApplicationStatus.ABANDONED];
  const weights = [20, 18, 18, 15, 8, 6, 10, 5];
  const status = weightedPick<ApplicationStatus>(statuses.map((s, i) => ({ value: s, weight: weights[i] })));
  const stages: InterviewStage[] = [InterviewStage.WRITTEN, InterviewStage.AISCREEN, InterviewStage.TECH, InterviewStage.HR, InterviewStage.DIRECTOR];
  const sources: Application['source'][] = ['主动投递', '企业邀请', 'AI推荐', 'RPO推荐', '校招'];
  const sourceWeights = [45, 15, 22, 10, 8];
  const source = weightedPick<Application['source']>(sources.map((s, i) => ({ value: s, weight: sourceWeights[i] })));
  const appliedAt = randomDate(new Date(2024, 3, 1), new Date(2024, 6, 10));
  const history: Application['history'] = [{
    status: ApplicationStatus.PENDING,
    time: appliedAt,
    operator: '系统',
    remark: '简历投递成功'
  }];
  let currentTime = new Date(appliedAt);
  const targetIdx = statuses.indexOf(status);
  for (let i = 1; i <= targetIdx; i++) {
    currentTime = new Date(currentTime.getTime() + randomInt(1, 48) * 60 * 60 * 1000);
    const remarksMap: Partial<Record<ApplicationStatus, string>> = {
      [ApplicationStatus.PENDING]: '简历投递成功',
      [ApplicationStatus.VIEWED]: 'HR已查看简历',
      [ApplicationStatus.SCREEN_PASS]: '简历初筛通过，邀请面试',
      [ApplicationStatus.INTERVIEW]: '面试流程进行中',
      [ApplicationStatus.OFFER]: '面试通过，发放录用Offer',
      [ApplicationStatus.HIRED]: '候选人接受Offer，已确认入职',
      [ApplicationStatus.UNSUITABLE]: '综合评估，暂不合适',
      [ApplicationStatus.ABANDONED]: '候选人主动放弃',
      [ApplicationStatus.APPLYING]: '投递中'
    };
    const getRemark = (s: ApplicationStatus): string => {
      return remarksMap[s] || '';
    };
    history.push({
      status: statuses[i],
      time: currentTime.toISOString(),
      operator: randomPick(['HR专员', '招聘主管', '用人部门', '系统', '候选人']),
      remark: getRemark(statuses[i])
    });
  }
  return {
    id,
    jobSeekerId,
    positionId: position.id,
    enterpriseId: position.enterpriseId,
    source,
    status,
    currentStage: status === ApplicationStatus.INTERVIEW ? randomPick(stages) : null,
    matchScore: randomInt(55, 96),
    appliedAt,
    viewedAt: status !== ApplicationStatus.PENDING ? new Date(new Date(appliedAt).getTime() + randomInt(1, 24) * 60 * 60 * 1000).toISOString() : undefined,
    lastUpdatedAt: currentTime.toISOString(),
    history
  };
};

export const createChannelROI = (id: string, month: string): ChannelROI => {
  const channels = ['BOSS直聘', '智联招聘', '前程无忧', '58同城', '猎聘', '本地招聘网', '微信公众号', '抖音招聘', '快手招聘', '厂区直招', '员工推荐', '人力资源公司', '校招双选会', '线上招聘会', '线下招聘会'];
  const channel = channels[id.length % channels.length] || randomPick(channels);
  const cost = randomInt(2000, 50000);
  const views = randomInt(500, 50000);
  const applications = Math.floor(views * randomFloat(0.02, 0.1));
  const interviews = Math.floor(applications * randomFloat(0.08, 0.25));
  const hires = Math.floor(interviews * randomFloat(0.15, 0.35));
  return {
    id,
    month,
    channel,
    cost,
    views,
    applications,
    interviews,
    hires,
    cpa: hires > 0 ? Math.round(cost / hires) : cost,
    avgQualityScore: randomFloat(60, 95, 1),
    costPerHire: hires > 0 ? Math.round(cost / hires) : cost,
    conversionRate: views > 0 ? parseFloat(((hires / views) * 100).toFixed(2)) : 0
  } as any;
};

export const createSubsidyApplication = (id: string, idx: string, enterprises: Enterprise[], townshipCodes: TownshipCode[]): SubsidyApplication => {
  const types: SubsidyType[] = [SubsidyType.RECRUITMENT, SubsidyType.SOCIAL, SubsidyType.SKILL_TRAINING, SubsidyType.STABLE];
  const typeWeights = [28, 25, 22, 25];
  const type = weightedPick<SubsidyType>(types.map((t, i) => ({ value: t, weight: typeWeights[i] })));
  const applicantType: SubsidyApplication['applicantType'] = Math.random() > 0.55 ? '企业' : '个人';
  const statuses: SubsidyStatus[] = [SubsidyStatus.DRAFT, SubsidyStatus.SUBMITTED, SubsidyStatus.REVIEWING, SubsidyStatus.APPROVED, SubsidyStatus.REJECTED, SubsidyStatus.PAID];
  const statusWeights = [5, 10, 18, 30, 12, 25];
  const status = weightedPick<SubsidyStatus>(statuses.map((s, i) => ({ value: s, weight: statusWeights[i] })));
  const getAmountRange = (t: SubsidyType): [number, number] => {
    switch (t) {
      case SubsidyType.RECRUITMENT:
      case SubsidyType.ENTERPRISE_HIRE:
        return [5000, 100000];
      case SubsidyType.SOCIAL:
      case SubsidyType.SOCIAL_INSURANCE:
        return [3000, 50000];
      case SubsidyType.SKILL_TRAINING:
      case SubsidyType.SKILL_UPGRADE:
        return [1000, 30000];
      case SubsidyType.STABLE:
        return [10000, 200000];
      case SubsidyType.GRADUATE_EMPLOY:
        return [3000, 80000];
      default:
        return [1000, 50000];
    }
  };
  const [min, max] = getAmountRange(type);
  const amount = randomInt(min, max);
  const township = randomPick(townshipCodes);
  const applicant = applicantType === '企业' ? randomPick(enterprises) : null;
  const createdAt = randomDate(new Date(2024, 0, 1), new Date(2024, 5, 1));
  const auditRoles = ['社区工作站', '镇街人社分局', '市人社局', '财政局'];
  const stepCount = randomInt(3, 4);
  const isReviewingStatus = status === SubsidyStatus.REVIEWING || (status as any) === SubsidyStatus.AUDITING;
  const currentStep = status === SubsidyStatus.DRAFT ? 0 : status === SubsidyStatus.SUBMITTED ? 1 : isReviewingStatus ? randomInt(2, stepCount - 1) : stepCount;
  const auditSteps: AuditStep[] = [];
  for (let i = 0; i < stepCount; i++) {
    const isRejected = status === SubsidyStatus.REJECTED && i === currentStep - 1;
    const isReviewing = isReviewingStatus && i === currentStep;
    const stepStatus: AuditStep['status'] = i < currentStep ? (isRejected ? '驳回' : '通过') : isReviewing ? '审核中' : '待审核';
    auditSteps.push({
      id: `audit_${id}_${i}`,
      step: (i + 1).toString(),
      role: auditRoles[Math.min(i, auditRoles.length - 1)],
      operator: stepStatus === '待审核' ? '' : randomChineseName(),
      status: stepStatus,
      operatedAt: (stepStatus === '待审核' ? undefined : randomDate(new Date(createdAt), new Date(2024, 6, 10))) || '',
      comment: stepStatus === '通过' ? '材料齐全，符合补贴条件' : stepStatus === '驳回' ? randomPick(['材料不完整', '不符合补贴条件', '申请信息有误']) : stepStatus === '审核中' ? '正在审核中，请耐心等待' : undefined,
      auditedAt: stepStatus === '待审核' ? undefined : randomDate(new Date(createdAt), new Date(2024, 6, 10))
    });
  }
  const submittedAt = status !== SubsidyStatus.DRAFT ? randomDate(new Date(createdAt), new Date(auditSteps[0]?.auditedAt || '2024-05-30')) : undefined;
  const approvedAt = (status === SubsidyStatus.APPROVED || status === SubsidyStatus.PAID) ? auditSteps[auditSteps.length - 1].auditedAt : undefined;
  const paidAt = status === SubsidyStatus.PAID ? randomDate(new Date(approvedAt || '2024-05-01'), new Date(2024, 6, 10)) : undefined;
  return {
    id,
    code: `SUB${new Date(createdAt).getFullYear()}${(parseInt(idx) + 1001).toString()}`,
    type,
    applicantType,
    applicantId: applicantType === '企业' && applicant ? applicant.id : `person_${randomInt(1, 500)}`,
    applicantName: applicantType === '企业' && applicant ? applicant.name : randomChineseName(),
    township,
    amount,
    status,
    auditTrail: auditSteps,
    auditSteps,
    documents: [],
    appliedAt: createdAt,
    submittedAt,
    approvedAt,
    paidAt,
    createdAt,
    materials: randomPicks(['营业执照', '法人身份证', '社保缴纳证明', '工资发放记录', '招聘简章', '劳动合同', '培训结业证书', '稳岗证明'], randomInt(3, 5))
  } as any;
};

const SKILL_LEVELS = ['了解', '熟练', '精通'];
const CERTIFICATES_POOL = ['数控车工高级证', '电工证', '焊工证', '叉车证', 'CAD绘图师证', 'PLC编程工程师证', '模具设计师证', '数控机床操作证', '钳工高级证', '焊接技师证'];

export const createResumeParse = (type: JobSeekerType, township: TownshipCode, workYears: number, education: string): ResumeParseResult => {
  const townshipData = TOWNSHIPS.find(t => t.code === township);
  const skillsCount = type === JobSeekerType.SKILLED ? randomInt(3, 6) : type === JobSeekerType.BLUECOLLAR ? randomInt(2, 4) : randomInt(2, 5);
  const skills = randomPicks(COMMON_SKILLS[type], skillsCount);
  const certCount = type === JobSeekerType.SKILLED ? randomInt(1, 3) : type === JobSeekerType.BLUECOLLAR ? randomInt(0, 2) : randomInt(0, 1);
  const certificates = certCount > 0 ? randomPicks(CERTIFICATES_POOL, certCount) : [];
  const salaryRange = randomSalaryRange(type);

  return {
    yearsOfExperience: workYears,
    education,
    location: townshipData?.name || '中山市',
    targetSalary: [Math.floor(salaryRange.min / 1000), Math.floor(salaryRange.max / 1000)],
    skills,
    certificates,
  };
};

export const createJDMatch = (job: JobPosition, resumeParse: ResumeParseResult): JDMatchResult => {
  const expScore = randomInt(70, 98);
  const eduScore = randomInt(65, 95);
  const locScore = randomInt(75, 98);
  const salScore = randomInt(70, 95);

  const expReasons = [
    `要求${job.experience}，您有${resumeParse.yearsOfExperience}年，超出要求`,
    `要求${job.experience}，您有${resumeParse.yearsOfExperience}年，基本匹配`,
    `经验要求${job.experience}，您的${resumeParse.yearsOfExperience}年经验符合要求`,
  ];
  const eduReasons = [
    `要求${job.education}，您是${resumeParse.education}，超出要求`,
    `要求${job.education}，您是${resumeParse.education}，符合要求`,
    `学历要求${job.education}，您的${resumeParse.education}学历达标`,
  ];
  const locReasons = [
    `职位在${resumeParse.location}，您期望在${resumeParse.location}工作`,
    `工作地点${resumeParse.location}，与您期望地点一致`,
    `职位位于${resumeParse.location}，通勤方便`,
  ];
  const salReasons = [
    `薪资${job.salaryMin}-${job.salaryMax}，您期望${resumeParse.targetSalary[0]}-${resumeParse.targetSalary[1]}K，匹配度高`,
    `薪资范围${job.salaryMin}-${job.salaryMax}K，与您的期望${resumeParse.targetSalary[0]}-${resumeParse.targetSalary[1]}K吻合`,
    `岗位预算${job.salaryMin}-${job.salaryMax}K，符合您的薪资期望`,
  ];

  return {
    experience: { score: expScore, label: '经验匹配', reason: randomPick(expReasons) },
    education: { score: eduScore, label: '学历匹配', reason: randomPick(eduReasons) },
    location: { score: locScore, label: '地域匹配', reason: randomPick(locReasons) },
    salary: { score: salScore, label: '薪酬匹配', reason: randomPick(salReasons) },
  };
};

export const createSkillAlignment = (jobSkills: RequiredSkill[], resumeSkills: string[], type: JobSeekerType): SkillAlignmentResult => {
  const matched: SkillAlignmentResult['matched'] = [];
  const missing: SkillAlignmentResult['missing'] = [];
  const related: SkillAlignmentResult['related'] = [];

  const jobSkillNames = jobSkills.map(s => s.name);
  const matchCount = Math.min(jobSkills.length, randomInt(1, jobSkills.length));

  for (let i = 0; i < matchCount; i++) {
    const skill = jobSkills[i];
    matched.push({
      name: skill.name,
      level: randomPick(SKILL_LEVELS),
      required: skill.required ? '熟练' : '了解',
    });
  }

  for (let i = matchCount; i < jobSkills.length; i++) {
    const skill = jobSkills[i];
    if (Math.random() > 0.4) {
      missing.push({
        name: skill.name,
        required: skill.required ? '熟练' : '了解',
        suggestion: `可通过学习${skill.name}基础课程补上`,
      });
    }
  }

  const relatedSkills = resumeSkills.filter(s => !jobSkillNames.includes(s)).slice(0, randomInt(0, 3));
  for (const skill of relatedSkills) {
    related.push({
      name: skill,
      level: randomPick(SKILL_LEVELS),
      bonus: `+${randomInt(3, 8)}%`,
    });
  }

  return { matched, missing, related };
};

export const createDifferentiation = (type: JobSeekerType, resumeParse: ResumeParseResult, jdMatch: JDMatchResult): DifferentiationResult => {
  const typeValue = String(type);
  const typeInfo: { type: DifferentiationType; label: string } =
    typeValue === JobSeekerType.SKILLED
      ? { type: 'skilled', label: '技工' }
      : typeValue === JobSeekerType.GRADUATE
        ? { type: 'graduate', label: '应届生' }
        : { type: 'blue_collar', label: '蓝领' };

  const blueCollarHighlights = [
    '✅ 包吃包住，符合您的住宿需求',
    '✅ 加班补贴丰厚，多劳多得',
    '✅ 稳岗补贴政策适用，工作稳定有保障',
    '✅ 厂区直招，无中介费',
    '💡 建议申请技能培训补贴，提升职业等级',
  ];

  const skilledHighlights = [
    `✅ 持${resumeParse.certificates[0] || '高级技能等级证书'}，符合技工岗位优先条件`,
    `✅ ${resumeParse.yearsOfExperience}年行业经验，匹配度 +${randomInt(10, 20)}%`,
    '✅ 期望薪资与岗位预算高度吻合',
    `💡 建议补充${randomPick(['UG编程', 'PLC高级应用', '三维建模'])}技能，可提升至技术组长岗`,
  ];

  const graduateHighlights = [
    `✅ ${resumeParse.education}学历，专业对口`,
    '✅ 有相关实习经历，基础扎实',
    '✅ 公司提供完善的应届生培养体系，成长空间大',
    '✅ 可申请高校毕业生就业补贴',
    '💡 建议参加公司的管培生计划，加速职业发展',
  ];

  const highlightsPool = typeInfo.type === 'blue_collar' ? blueCollarHighlights
    : typeInfo.type === 'skilled' ? skilledHighlights
    : graduateHighlights;

  return {
    type: typeInfo.type,
    typeLabel: typeInfo.label,
    highlights: randomPicks(highlightsPool, randomInt(3, 4)),
  };
};

export const createMatchDetails = (job: JobPosition, jobSeeker: JobSeeker, resume: Resume): MatchDetails => {
  const resumeParse = createResumeParse(job.type, jobSeeker.township, jobSeeker.workYears, jobSeeker.highestDegree);
  const jdMatch = createJDMatch(job, resumeParse);
  const skillAlignment = createSkillAlignment(job.requiredSkills, resumeParse.skills, job.type);
  const differentiation = createDifferentiation(job.type, resumeParse, jdMatch);

  return {
    resumeParse,
    jdMatch,
    skillAlignment,
    differentiation,
  };
};

export const createJobWithMatch = (job: JobPosition, jobSeeker: JobSeeker, resume: Resume): JobWithMatch => {
  const matchScore = randomInt(60, 98);
  const matchDetails = createMatchDetails(job, jobSeeker, resume);

  return {
    ...job,
    matchScore,
    matchDetails,
  };
};
