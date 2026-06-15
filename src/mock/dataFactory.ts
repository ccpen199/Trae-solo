// @ts-nocheck
import {
  TownshipCode,
  IndustryTag,
  JobSeekerType,
  InterviewStage,
  RPOStage,
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
  MatchDimension,
  GapItem,
  Application,
  ChannelROI,
  SubsidyApplication,
  AuditStep,
  CampusSession,
  EducationCourse,
  WrittenExam,
  ExamQuestion,
  AIInterview,
  AIQuestion,
  AIScoreReport,
  FunnelMetrics,
  RetentionAnalysis,
  CreditBankRecord
} from '../../shared/types';
import { TOWNSHIPS } from './townships';

export class SeededRandom {
  private seed: number;

  constructor(seed: number = 42) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(min: number, max: number, decimals: number = 2): number {
    return parseFloat((this.next() * (max - min) + min).toFixed(decimals));
  }

  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }

  picks<T>(arr: T[], count: number): T[] {
    const shuffled = [...arr].sort(() => this.next() - 0.5);
    return shuffled.slice(0, Math.min(count, arr.length));
  }

  date(start: Date, end: Date): string {
    const time = start.getTime() + this.next() * (end.getTime() - start.getTime());
    return new Date(time).toISOString();
  }

  weightedPick<T>(items: { value: T; weight: number }[]): T {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = this.next() * totalWeight;
    for (const item of items) {
      random -= item.weight;
      if (random <= 0) return item.value;
    }
    return items[0].value;
  }
}

const SURNAMES = ['陈', '李', '黄', '张', '林', '王', '刘', '梁', '吴', '郑', '杨', '何', '冯', '罗', '谢', '曾', '周', '蔡', '叶', '邓', '许', '郭', '苏', '钟', '徐'];
const GIVEN_NAMES = ['伟', '强', '磊', '军', '勇', '杰', '涛', '明', '超', '辉', '鹏', '华', '飞', '斌', '波', '宇', '浩', '凯', '健', '俊', '芳', '娜', '敏', '静', '丽', '娟', '艳', '玲', '婷', '霞', '琳', '颖', '慧', '莹', '雪', '梅', '萍', '英', '玉', '桂英'];

const ENTERPRISE_PREFIXES = ['中山', '广东', '华南', '顺达', '恒达', '宏达', '金盛', '盛达', '鑫泰', '永盛', '万昌', '利源', '安信', '华盛', '泰昌', '德润', '昌盛', '鼎盛', '宏远', '国兴'];
const ENTERPRISE_MIDDLES = ['金', '顺', '泰', '盛', '华', '昌', '达', '鑫', '宏', '德', '瑞', '祥', '恒', '永', '润', '丰', '源', '昌', '盛', '达'];

const ENTERPRISE_SUFFIX_MAP: Record<IndustryTag, string[]> = {
  [IndustryTag.HARDWARE]: ['五金制品有限公司', '精密五金有限公司', '五金塑胶有限公司', '金属制品有限公司', '五金电子有限公司', '模具有限公司', '冲压件有限公司', '机械五金有限公司'],
  [IndustryTag.LIGHTING]: ['照明电器有限公司', '灯饰有限公司', '光电科技有限公司', '照明科技有限公司', 'LED照明有限公司', '灯饰电器有限公司', '智能照明有限公司', '光电有限公司'],
  [IndustryTag.CASUALWEAR]: ['服装有限公司', '服饰有限公司', '制衣有限公司', '针织有限公司', '纺织服装有限公司', '休闲服饰有限公司', '牛仔服饰有限公司', '制衣厂有限公司'],
  [IndustryTag.FURNITURE]: ['家具有限公司', '办公家具有限公司', '红木家具有限公司', '家居用品有限公司', '智能家居有限公司', '实木家具有限公司', '家具制造有限公司', '户外家具有限公司'],
  [IndustryTag.ELECTRONICS]: ['电子科技有限公司', '电子有限公司', '电子电器有限公司', '智能科技有限公司', '光电科技有限公司', '微电子有限公司', '通信科技有限公司', '数码科技有限公司'],
  [IndustryTag.MACHINERY]: ['机械有限公司', '机械设备有限公司', '精密机械有限公司', '自动化设备有限公司', '机械制造有限公司', '数控机床有限公司', '工业设备有限公司', '智能装备有限公司'],
  [IndustryTag.APPLIANCE]: ['电器有限公司', '家电有限公司', '生活电器有限公司', '厨卫电器有限公司', '智能家电有限公司', '电器科技有限公司', '家用电器有限公司', '小家电有限公司'],
  [IndustryTag.FOOD]: ['食品有限公司', '食品科技有限公司', '农产品有限公司', '肉制品有限公司', '饮料有限公司', '食品工业有限公司', '粮油食品有限公司', '健康食品有限公司'],
  [IndustryTag.NEWENERGY]: ['新能源科技有限公司', '光伏科技有限公司', '储能科技有限公司', '能源科技有限公司', '新能源汽车有限公司', '动力电池有限公司', '智能能源有限公司', '电力科技有限公司'],
  [IndustryTag.ROBOTICS]: ['机器人科技有限公司', '智能装备有限公司', '自动化科技有限公司', '工业机器人有限公司', '智能机器人有限公司', '人工智能科技有限公司', '智能制造有限公司', '工业自动化有限公司']
};

const INDUSTRY_JOB_MAP: Record<IndustryTag, { positions: string[]; departments: string[] }> = {
  [IndustryTag.HARDWARE]: {
    positions: ['五金冲压工', 'CNC操作工', '线切割师傅', '模具师傅', '磨床技工', '铣床技工', '车床技工', '钳工', '钣金工', '电焊工', '喷涂工', '抛光工', '装配工', '品检员', '五金设计工程师', '模具设计师', 'QE工程师', '生产主管', '车间主任', '物料员'],
    departments: ['冲压车间', 'CNC车间', '模具部', '装配部', '喷涂车间', '品质部', '工程部', '生产部', '物控部']
  },
  [IndustryTag.LIGHTING]: {
    positions: ['灯饰装配工', 'LED焊锡工', '电子维修员', '灯饰结构工程师', 'LED驱动工程师', '灯具设计师', '光学工程师', '品检员', '包装工', 'SMT贴片操作员', '注塑工', '喷涂工', '组装线长', 'QE技术员', '外贸业务员', '电商运营', '仓库管理员', '物料采购员', '生产计划员', '售后技术员'],
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

const COMMON_SKILLS: Record<JobSeekerType, string[]> = {
  [JobSeekerType.BLUECOLLAR]: ['冲压操作', '焊接', '喷涂', '装配', '包装', '搬运', '物料分拣', '清洁', '品检基础', '叉车驾驶', '电工基础', '机修基础', 'CNC基础操作', '注塑机操作', '缝纫', '开料', '打磨', '抛光'],
  [JobSeekerType.SKILLED]: ['CNC编程', '模具设计', '数控车床', '数控铣床', '线切割', '电火花', '磨床精密', '钳工高级', '焊接高级', '电工证', 'PLC编程', 'AutoCAD', 'SolidWorks', 'Pro/E', 'UG', 'Mastercam', '液压系统', '电气布线', '变频器调试', '机器人示教'],
  [JobSeekerType.GRADUATE]: ['Office办公', 'AutoCAD基础', 'SolidWorks基础', 'Python', 'C语言', '英语四级', '英语六级', '数据分析', '沟通表达', '团队协作', '学习能力强', '抗压能力', 'PPT制作', 'Excel函数', 'PS基础', '视频剪辑', '新媒体运营', '电商运营基础']
};

const SCHOOLS: Record<EducationItem['degree'], string[]> = {
  '高中': ['中山纪念中学', '中山市第一中学', '中山市华侨中学', '中山市实验中学', '中山市第二中学', '中山市桂山中学', '中山市杨仙逸中学', '小榄中学', '古镇高级中学', '东升高级中学'],
  '中专': ['中山市中等专业学校', '中山市技师学院', '中山火炬职业技术学院中专部', '中山市工贸技工学校', '中山市启航技工学校', '中山市现美美容美发职业培训学校'],
  '大专': ['中山火炬职业技术学院', '中山职业技术学院', '广东理工职业学院中山校区', '中山开放大学', '中山市广播电视大学'],
  '本科': ['电子科技大学中山学院', '广东药科大学中山校区', '广东工业大学（中山）', '华南理工大学继续教育学院中山教学点', '中山大学新华学院'],
  '硕士': ['中山大学管理学院中山MBA', '华南理工大学中山教学点', '暨南大学中山MBA', '广东财经大学中山研究生班'],
  '博士': ['中山大学中山博士后流动站', '华南理工大学博士后工作站']
};

const MAJORS = ['机械设计制造', '机电一体化', '数控技术', '模具设计与制造', '焊接技术', '电气自动化', '电子信息工程', '计算机应用', '软件工程', '会计学', '物流管理', '市场营销', '电子商务', '工商管理', '人力资源', '国际贸易', '英语', '商务英语', '服装设计', '工业设计', '食品科学', '化学工程', '环境工程', '土木工程', '汽车维修'];

const WELFARE_OPTIONS = ['五险一金', '包食宿', '带薪年假', '节日福利', '员工体检', '年终奖', '绩效奖金', '全勤奖', '加班费', '班车接送', '员工旅游', '培训提升', '弹性工作', '股权激励', '通讯补贴', '交通补贴', '餐补', '住房补贴', '高温补贴', '生日福利'];

const pickTownshipByIndustry = (rng: SeededRandom, industry: IndustryTag): TownshipCode => {
  const items = TOWNSHIPS.map(t => ({
    value: t.code,
    weight: t.enterpriseWeight[industry] || 1
  }));
  return rng.weightedPick(items);
};

const randomChineseName = (rng: SeededRandom): string => {
  const surname = rng.pick(SURNAMES);
  const givenName = rng.pick(GIVEN_NAMES);
  return surname + givenName;
};

const randomPhone = (rng: SeededRandom): string => {
  const prefixes = ['138', '139', '137', '136', '135', '158', '159', '188', '189', '177'];
  const prefix = rng.pick(prefixes);
  const suffix = String(rng.int(10000000, 99999999));
  return prefix + suffix;
};

const randomEnterpriseName = (rng: SeededRandom, industry: IndustryTag): { full: string; short: string } => {
  const prefix = rng.pick(ENTERPRISE_PREFIXES);
  const suffix = rng.pick(ENTERPRISE_SUFFIX_MAP[industry]);
  const middle = rng.pick(ENTERPRISE_MIDDLES) + rng.pick(ENTERPRISE_MIDDLES);
  const full = prefix + middle + suffix;
  const short = prefix + middle;
  return { full, short };
};

const randomEnterpriseScale = (employeeCount: number): Enterprise['scale'] => {
  if (employeeCount < 20) return '20人以下';
  if (employeeCount < 100) return '20-99人';
  if (employeeCount < 500) return '100-499人';
  if (employeeCount < 1000) return '500-999人';
  if (employeeCount < 10000) return '1000-9999人';
  return '10000人以上';
};

const randomSalaryRange = (rng: SeededRandom, type: JobSeekerType): { min: number; max: number } => {
  switch (type) {
    case JobSeekerType.BLUECOLLAR: {
      const min = rng.int(4000, 6000);
      const max = min + rng.int(1500, 3000);
      return { min, max: Math.min(max, 8500) };
    }
    case JobSeekerType.SKILLED: {
      const min = rng.int(6000, 10000);
      const max = min + rng.int(2500, 6000);
      return { min, max: Math.min(max, 15000) };
    }
    case JobSeekerType.GRADUATE: {
      const min = rng.int(4500, 6000);
      const max = min + rng.int(1000, 2500);
      return { min, max: Math.min(max, 7500) };
    }
  }
};

const randomSkills = (rng: SeededRandom, type: JobSeekerType, count: number, prefix: string): SkillItem[] => {
  const pool = COMMON_SKILLS[type];
  const picked = rng.picks(pool, count);
  return picked.map((name, idx) => ({
    id: `${prefix}_sk_${idx}`,
    name,
    proficiency: rng.int(1, 5) as 1 | 2 | 3 | 4 | 5,
    years: type === JobSeekerType.GRADUATE ? rng.float(0.5, 3, 1) : rng.float(1, 12, 1)
  }));
};

const randomEducation = (rng: SeededRandom, maxDegree: EducationItem['degree'], prefix: string): EducationItem[] => {
  const degrees: EducationItem['degree'][] = ['高中', '中专', '大专', '本科', '硕士', '博士'];
  const maxIdx = degrees.indexOf(maxDegree);
  const result: EducationItem[] = [];
  const count = maxIdx >= 3 ? rng.int(2, 3) : rng.int(1, 2);
  for (let i = 0; i < Math.min(count, maxIdx + 1); i++) {
    const degree = degrees[Math.min(maxIdx - i, maxIdx)];
    const school = rng.pick(SCHOOLS[degree]);
    const major = rng.pick(MAJORS);
    const endYear = rng.int(2005, 2024);
    const duration = degree === '博士' ? 4 : degree === '硕士' ? 3 : degree === '本科' ? 4 : 3;
    result.push({
      id: `${prefix}_edu_${i}`,
      school,
      major,
      degree,
      startDate: `${endYear - duration}-09-01`,
      endDate: `${endYear}-06-30`,
      description: i === 0 ? `主修课程：${rng.picks(MAJORS, 4).join('、')}` : undefined
    });
  }
  return result.sort((a, b) => a.startDate.localeCompare(b.startDate));
};

const WORK_ENTERPRISE_POOL = ['美的集团', '格力电器', 'TCL王牌电器', '长虹电子', '奥马电器', '格兰仕集团', '木林森照明', '华帝股份', '长青集团', '达华智能', '中顺洁柔', '乐心医疗', '通宇通讯', '广东顶固', '大洋电机', '江龙船艇', '完美（中国）', '曼秀雷敦', '联邦制药', '雅居乐地产'];

const randomWorkHistory = (rng: SeededRandom, type: JobSeekerType, workYears: number, prefix: string): WorkItem[] => {
  const industry = rng.pick(Object.values(IndustryTag));
  const { positions } = INDUSTRY_JOB_MAP[industry];
  const jobCount = workYears < 2 ? 1 : workYears < 5 ? rng.int(1, 2) : rng.int(2, 3);
  const result: WorkItem[] = [];
  let endYear = 2024;
  for (let i = 0; i < jobCount; i++) {
    const yearsInJob = i === jobCount - 1 ? Math.min(workYears, i === 0 ? workYears : rng.int(1, 3)) : rng.int(1, 3);
    const startYear = endYear - yearsInJob;
    const salary = type === JobSeekerType.BLUECOLLAR ? rng.int(4000, 6500) : type === JobSeekerType.SKILLED ? rng.int(6500, 12000) : rng.int(4500, 7000);
    result.push({
      id: `${prefix}_work_${i}`,
      company: rng.pick(WORK_ENTERPRISE_POOL),
      position: rng.pick(positions),
      startDate: `${startYear}-${rng.int(1, 12).toString().padStart(2, '0')}-01`,
      endDate: i === 0 ? '至今' : `${endYear}-${rng.int(1, 12).toString().padStart(2, '0')}-28`,
      salary,
      highlights: [
        `负责${rng.pick(['车间生产', '设备操作', '品质管控', '工艺优化', '团队管理'])}相关工作`,
        `${rng.pick(['日产量', '合格率', '效率', '良品率'])}提升${rng.int(5, 25)}%`,
        `参与${rng.pick(['新产品导入', '产线改造', '工艺升级', '设备更新'])}项目`
      ]
    });
    endYear = startYear;
  }
  return result;
};

/**
 * 生成企业数据
 * @param count 生成数量
 * @param rng 随机数生成器实例
 * @returns 企业数组
 */
export function generateEnterprises(count: number, rng: SeededRandom): Enterprise[] {
  const enterprises: Enterprise[] = [];
  const industryWeights = [
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
  ];

  for (let i = 1; i <= count; i++) {
    const industry = rng.weightedPick(industryWeights);
    const township = pickTownshipByIndustry(rng, industry);
    const townshipData = TOWNSHIPS.find(t => t.code === township)!;
    const names = randomEnterpriseName(rng, industry);
    const employeeCount = rng.int(15, 3500);
    const welfareCount = rng.int(5, 10);
    const establishedYear = rng.int(1998, 2022);

    enterprises.push({
      id: `ent_${i}`,
      name: names.full,
      shortName: names.short,
      industry,
      township,
      townshipName: townshipData.name,
      address: `中山市${townshipData.name}${rng.pick(['工业大道', '兴业路', '创业路', '科技路', '工业园', '工业区', '同乐路', '万福路', '朝阳路', '建设路'])}${rng.int(1, 200)}号`,
      scale: randomEnterpriseScale(employeeCount),
      registeredCapital: rng.int(50, 5000),
      establishedYear,
      description: `成立于${establishedYear}年，位于中山市${townshipData.name}，专业从事${industry}相关产品的研发、生产和销售。公司拥有先进的生产设备和专业的技术团队，产品远销国内外市场，在行业内享有良好的声誉。`,
      welfare: rng.picks(WELFARE_OPTIONS, welfareCount),
      welfareTags: rng.picks(WELFARE_OPTIONS, welfareCount),
      contactName: randomChineseName(rng),
      contactPhone: randomPhone(rng),
      contactEmail: `hr${rng.int(100, 999)}@${names.short.toLowerCase()}${rng.pick(['.com', '.cn', '.com.cn'])}`,
      verified: rng.next() > 0.12,
      employeeCount,
      openPositionCount: rng.int(1, 25),
      createdAt: rng.date(new Date(2020, 0, 1), new Date(2024, 1, 1))
    });
  }

  return enterprises;
}

/**
 * 生成职位数据
 * @param count 生成数量
 * @param enterprises 企业数组
 * @param rng 随机数生成器实例
 * @returns 职位数组
 */
export function generateJobs(count: number, enterprises: Enterprise[], rng: SeededRandom): JobPosition[] {
  const jobs: JobPosition[] = [];
  let posIdx = 1;

  for (const ent of enterprises) {
    if (jobs.length >= count) break;
    const posCount = Math.min(ent.openPositionCount, rng.int(3, 12));
    for (let p = 0; p < posCount && jobs.length < count; p++) {
      const { positions, departments } = INDUSTRY_JOB_MAP[ent.industry];
      const title = rng.pick(positions);
      const department = rng.pick(departments);

      const type = rng.weightedPick<JobSeekerType>([
        { value: JobSeekerType.BLUECOLLAR, weight: 50 },
        { value: JobSeekerType.SKILLED, weight: 38 },
        { value: JobSeekerType.GRADUATE, weight: 12 }
      ]);

      const salary = randomSalaryRange(rng, type);
      const expOptions: JobPosition['experience'][] = type === JobSeekerType.GRADUATE ? ['应届生', '不限'] : ['不限', '1-3年', '3-5年', '5-10年'];
      const eduOptions: JobPosition['education'][] = type === JobSeekerType.GRADUATE ? ['大专', '本科', '不限'] : type === JobSeekerType.SKILLED ? ['不限', '高中', '中专', '大专'] : ['不限', '高中', '中专'];
      const skillsPool = COMMON_SKILLS[type];
      const requiredSkillCount = rng.int(2, 4);
      const requiredSkills: RequiredSkill[] = rng.picks(skillsPool, requiredSkillCount).map((name, idx) => ({
        id: `req_${posIdx}_${idx}`,
        name,
        required: idx < Math.min(2, requiredSkillCount),
        minProficiency: idx < 2 ? (rng.int(3, 4) as 3 | 4) : undefined,
        weight: idx === 0 ? 35 : idx === 1 ? 25 : idx === 2 ? 20 : 20
      }));

      const township = TOWNSHIPS.find(t => t.code === ent.township)!;

      jobs.push({
        id: `pos_${posIdx}`,
        enterpriseId: ent.id,
        enterpriseName: ent.name,
        title,
        department,
        industry: ent.industry,
        township: ent.township,
        townshipName: township.name,
        address: `${township.name}${ent.address.split(township.name)[1] || ''}`,
        type,
        salaryMin: salary.min,
        salaryMax: salary.max,
        salaryRange: [salary.min, salary.max],
        salaryType: rng.pick(['月薪', '月薪', '月薪', '计件', '日薪']),
        experience: rng.pick(expOptions),
        education: rng.pick(eduOptions),
        requiredSkills,
        responsibilities: [
          `负责${title}日常作业，严格按SOP执行`,
          `${rng.pick(['维护保养', '巡检记录', '异常处理', '工艺执行', '品质管控'])}工作落实`,
          '配合完成生产计划，达成产量和品质目标',
          '遵守车间5S管理和安全生产规范',
          '完成上级交办的其他工作任务'
        ],
        requirements: [
          `学历${rng.pick(eduOptions)}以上，${title}相关经验优先`,
          `具备${requiredSkills.slice(0, 2).map(s => s.name).join('、')}相关技能`,
          `身体健康，能${rng.pick(['适应加班', '适应倒班', '吃苦耐劳', '服从安排'])}`,
          `${type === JobSeekerType.SKILLED ? '持有相关职业资格证书优先' : '有无经验均可，提供岗前培训'}`,
          '责任心强，具有良好的团队合作精神'
        ],
        jobDescription: `负责${title}相关工作，按照生产计划完成每日任务。`,
        benefits: rng.picks(ent.welfare, rng.int(3, 5)),
        hiringCount: rng.int(1, 10),
        status: rng.pick(['招聘中', '招聘中', '招聘中', '已暂停', '已关闭']),
        urgent: rng.next() > 0.75,
        publishedAt: rng.date(new Date(2024, 2, 1), new Date(2024, 5, 30)),
        deadline: '2024-12-31',
        viewCount: rng.int(50, 3000),
        applicationCount: rng.int(3, 80),
        views: rng.int(50, 3000),
        applicationsCount: rng.int(3, 80)
      });
      posIdx++;
    }
  }

  while (jobs.length < count) {
    const ent = rng.pick(enterprises);
    const { positions, departments } = INDUSTRY_JOB_MAP[ent.industry];
    const title = rng.pick(positions);
    const department = rng.pick(departments);
    const type = rng.weightedPick<JobSeekerType>([
      { value: JobSeekerType.BLUECOLLAR, weight: 50 },
      { value: JobSeekerType.SKILLED, weight: 38 },
      { value: JobSeekerType.GRADUATE, weight: 12 }
    ]);
    const salary = randomSalaryRange(rng, type);
    const township = TOWNSHIPS.find(t => t.code === ent.township)!;
    const skillsPool = COMMON_SKILLS[type];
    const requiredSkillCount = rng.int(2, 4);
    const requiredSkills: RequiredSkill[] = rng.picks(skillsPool, requiredSkillCount).map((name, idx) => ({
      id: `req_${posIdx}_${idx}`,
      name,
      required: idx < Math.min(2, requiredSkillCount),
      minProficiency: idx < 2 ? (rng.int(3, 4) as 3 | 4) : undefined,
      weight: idx === 0 ? 35 : idx === 1 ? 25 : idx === 2 ? 20 : 20
    }));

    jobs.push({
      id: `pos_${posIdx}`,
      enterpriseId: ent.id,
      enterpriseName: ent.name,
      title,
      department,
      industry: ent.industry,
      township: ent.township,
      townshipName: township.name,
      type,
      salaryMin: salary.min,
      salaryMax: salary.max,
      salaryRange: [salary.min, salary.max],
      requiredSkills,
      viewCount: rng.int(50, 3000),
      applicationCount: rng.int(3, 80)
    });
    posIdx++;
  }

  return jobs.slice(0, count);
}

/**
 * 生成求职者数据
 * @param count 生成数量
 * @param rng 随机数生成器实例
 * @returns 求职者数组
 */
export function generateJobSeekers(count: number, rng: SeededRandom): JobSeeker[] {
  const jobSeekers: JobSeeker[] = [];
  const tagsPool = [
    '有电工证', '有焊工证', '有叉车证', '会CAD绘图', '会Office办公', '英语良好', '接受加班', '接受倒班',
    '吃苦耐劳', '沟通能力强', '有团队管理经验', '急上岗', '可出差', '有驾驶证', '有住宿需求',
    '本地人', '有社保要求', '有年终奖要求', '会开CNC', '会编程'
  ];

  for (let i = 1; i <= count; i++) {
    const gender: '男' | '女' = rng.next() > 0.35 ? '男' : '女';
    const type = rng.weightedPick<JobSeekerType>([
      { value: JobSeekerType.BLUECOLLAR, weight: 55 },
      { value: JobSeekerType.SKILLED, weight: 30 },
      { value: JobSeekerType.GRADUATE, weight: 15 }
    ]);
    const age = type === JobSeekerType.GRADUATE ? rng.int(20, 24) : rng.int(18, 52);
    const workYears = type === JobSeekerType.GRADUATE ? rng.int(0, 1) : Math.max(0, age - 20 - rng.int(0, 3));
    const degrees: EducationItem['degree'][] = type === JobSeekerType.GRADUATE ? ['大专', '本科', '硕士'] : type === JobSeekerType.SKILLED ? ['高中', '中专', '大专'] : ['高中', '中专'];
    const highestDegree = rng.pick(degrees);
    const { positions } = INDUSTRY_JOB_MAP[rng.pick(Object.values(IndustryTag))];
    const expectPosition = rng.pick(positions);
    const expect = randomSalaryRange(rng, type);

    jobSeekers.push({
      id: `js_${i}`,
      name: randomChineseName(rng),
      gender,
      age,
      phone: randomPhone(rng),
      type,
      township: rng.pick(TOWNSHIPS).code,
      expectPosition,
      expectSalaryMin: expect.min,
      expectSalaryMax: expect.max,
      status: rng.pick(['求职中', '求职中', '在职看机会', '暂不考虑']),
      workYears,
      highestDegree,
      tags: rng.picks(tagsPool, rng.int(2, 5)),
      createdAt: rng.date(new Date(2023, 0, 1), new Date(2024, 5, 1))
    });
  }

  return jobSeekers;
}

/**
 * 生成简历数据
 * @param jobSeekers 求职者数组
 * @param rng 随机数生成器实例
 * @returns 简历数组
 */
export function generateResumes(jobSeekers: JobSeeker[], rng: SeededRandom): Resume[] {
  const resumes: Resume[] = [];

  for (let i = 0; i < jobSeekers.length; i++) {
    const js = jobSeekers[i];
    const resumeId = `res_${i + 1}`;
    js.resumeId = resumeId;

    const projects: ProjectItem[] = js.type === JobSeekerType.GRADUATE ? [{
      id: `proj_${i}`,
      name: '毕业设计/实习项目',
      role: rng.pick(['项目成员', '项目负责人', '技术开发']),
      startDate: '2023-09-01',
      endDate: '2024-05-30',
      description: `${js.expectPosition}相关的实践项目，涵盖核心技能应用`,
      achievements: ['完成项目全部功能开发', '通过导师验收答辩', '获得优秀项目评价']
    }] : [];

    resumes.push({
      id: resumeId,
      jobSeekerId: js.id,
      title: `${js.expectPosition}求职简历`,
      skills: randomSkills(rng, js.type, rng.int(3, 6), `res_${i + 1}`),
      skillList: randomSkills(rng, js.type, rng.int(3, 6), `res_${i + 1}`),
      educationList: randomEducation(rng, js.highestDegree, `res_${i + 1}`),
      educationExperienceList: randomEducation(rng, js.highestDegree, `res_${i + 1}`),
      workList: js.workYears >= 1 ? randomWorkHistory(rng, js.type, js.workYears, `res_${i + 1}`) : [],
      workExperienceList: js.workYears >= 1 ? randomWorkHistory(rng, js.type, js.workYears, `res_${i + 1}`) : [],
      projectList: projects,
      projects,
      certificates: rng.next() > 0.5 ? [
        { id: `cert_${i}_1`, name: rng.pick(['电工证', '焊工证', '叉车证', 'CAD认证', '职业资格证']), issuer: rng.pick(['人社局', '应急管理局', '行业协会']), date: `202${rng.int(0, 3)}-${rng.int(1, 12).toString().padStart(2, '0')}-01` }
      ] : undefined,
      selfEvaluation: `${js.type}求职者，${js.workYears}年${js.expectPosition}相关工作经验，${(js.tags || []).slice(0, 3).join('、')}。工作积极主动，具有良好的团队合作精神和沟通能力，期望加入贵公司共同发展。`,
      updatedAt: rng.date(new Date(2024, 0, 1), new Date(2024, 5, 30)),
      basicInfo: {
        name: js.name || '',
        gender: js.gender as '男' | '女',
        age: js.age || 25,
        phone: js.phone || '',
        location: js.township || TownshipCode.SQ,
        education: js.highestDegree as any,
        workYears: js.workYears || 0,
        jobSeekerType: js.type,
        expectPosition: js.expectPosition,
        expectSalary: js.expectSalaryMin && js.expectSalaryMax ? [Number(js.expectSalaryMin), Number(js.expectSalaryMax)] : undefined,
        currentStatus: js.status
      }
    });
  }

  return resumes;
}

/**
 * 计算简历与职位的匹配度
 * @param resume 简历
 * @param job 职位
 * @param rng 随机数生成器实例
 * @returns 匹配结果
 */
export function calculateMatchScore(resume: Resume, job: JobPosition, rng: SeededRandom): MatchResult {
  const requiredSkills = job.requiredSkills || [];
  const resumeSkills = resume.skills || [];

  const matchedSkills = resumeSkills.filter(s =>
    requiredSkills.some(ps =>
      String(ps.name).includes(String(s.name).slice(0, 2)) ||
      String(s.name).includes(String(ps.name).slice(0, 2))
    )
  );
  const skillMatch = Math.round((matchedSkills.length / Math.max(requiredSkills.length, 1)) * 100);
  const experienceMatch = rng.int(40, 95);
  const educationMatch = rng.int(50, 90);
  const salaryMatch = rng.int(55, 92);
  const locationMatch = rng.int(60, 98);

  const overallScore = Math.round(
    skillMatch * 0.35 +
    experienceMatch * 0.25 +
    educationMatch * 0.15 +
    salaryMatch * 0.1 +
    locationMatch * 0.15
  );

  const dimensions: MatchDimension = { skillMatch, experienceMatch, educationMatch, salaryMatch, locationMatch };

  const gaps: GapItem[] = [];
  if (skillMatch < 70) {
    gaps.push({ dimension: 'skillMatch', score: skillMatch, description: '技能匹配度略低，部分核心技能未掌握', suggestion: '建议补充相关技能培训或考取职业资格证书' });
  }
  if (experienceMatch < 60) {
    gaps.push({ dimension: 'experienceMatch', score: experienceMatch, description: '工作经验略有欠缺', suggestion: '可从基础岗位做起，逐步积累经验' });
  }
  if (educationMatch < 65) {
    gaps.push({ dimension: 'educationMatch', score: educationMatch, description: '学历要求有差距', suggestion: '可通过学历提升课程提高学历水平' });
  }
  if (salaryMatch < 65) {
    gaps.push({ dimension: 'salaryMatch', score: salaryMatch, description: '薪资期望与岗位有差距', suggestion: '可适当调整薪资期望或考虑绩效奖金部分' });
  }

  const strengths: string[] = [];
  if (skillMatch >= 70) strengths.push(`技能高度匹配：${matchedSkills.slice(0, 2).map(s => s.name).join('、')}`);
  if (experienceMatch >= 80) strengths.push('工作经验丰富，上手快');
  if (locationMatch >= 85) strengths.push('地理位置近，通勤方便');
  if (educationMatch >= 80) strengths.push('学历满足并有竞争力');
  if (strengths.length === 0) strengths.push('综合条件符合岗位基本要求');

  return {
    id: `match_${resume.jobSeekerId}_${job.id}`,
    jobSeekerId: resume.jobSeekerId,
    resumeId: resume.id,
    positionId: job.id,
    jobPositionId: job.id,
    positionTitle: job.title,
    enterpriseName: job.enterpriseName,
    overallScore,
    totalScore: overallScore,
    dimensions,
    matchDimensions: dimensions,
    gaps,
    gapAnalysis: gaps,
    missingSkills: requiredSkills.filter(rs =>
      !resumeSkills.some(s => String(s.name).includes(String(rs.name).slice(0, 2)))
    ),
    improvementSuggestions: gaps.map(g => g.suggestion),
    strengths,
    matchedAt: rng.date(new Date(2024, 3, 1), new Date(2024, 6, 10)),
    recommended: overallScore >= 70
  };
}

/**
 * 生成投递数据
 * @param jobSeekers 求职者数组
 * @param jobs 职位数组
 * @param count 生成数量
 * @param rng 随机数生成器实例
 * @returns 投递数组
 */
export function generateApplications(
  jobSeekers: JobSeeker[],
  jobs: JobPosition[],
  count: number,
  rng: SeededRandom
): Application[] {
  const applications: Application[] = [];
  const statuses: Application['status'][] = ['待处理', '已查看', '初筛通过', '面试中', 'Offer', '已录用', '不合适', '已放弃'];
  const statusWeights = [20, 18, 18, 15, 8, 6, 10, 5];
  const stages: InterviewStage[] = [InterviewStage.WRITTEN, InterviewStage.AISCREEN, InterviewStage.TECH, InterviewStage.HR, InterviewStage.DIRECTOR];
  const sources: Application['source'][] = ['主动投递', '企业邀请', 'AI推荐', 'RPO推荐', '校招'];
  const sourceWeights = [45, 15, 22, 10, 8];
  const remarks: Record<string, string> = {
    '已查看': 'HR已查看简历',
    '初筛通过': '简历初筛通过，邀请面试',
    '面试中': '面试流程进行中',
    'Offer': '面试通过，发放录用Offer',
    '已录用': '候选人接受Offer，已确认入职',
    '不合适': '综合评估，暂不合适',
    '已放弃': '候选人主动放弃'
  };

  const existingPairs = new Set<string>();
  let appIdx = 1;

  while (applications.length < count) {
    const js = rng.pick(jobSeekers);
    const pos = rng.pick(jobs);
    const key = `${js.id}_${pos.id}`;
    if (existingPairs.has(key)) continue;
    existingPairs.add(key);

    const status = rng.weightedPick(statuses.map((s, i) => ({ value: s, weight: statusWeights[i] })));
    const source = rng.weightedPick(sources.map((s, i) => ({ value: s, weight: sourceWeights[i] })));
    const appliedAt = rng.date(new Date(2024, 3, 1), new Date(2024, 6, 10));

    const history: Application['history'] = [{
      status: '待处理',
      time: appliedAt,
      operator: '系统',
      remark: '简历投递成功'
    }];

    let currentTime = new Date(appliedAt);
    const targetIdx = statuses.indexOf(status);
    for (let i = 1; i <= targetIdx; i++) {
      currentTime = new Date(currentTime.getTime() + rng.int(1, 48) * 60 * 60 * 1000);
      history.push({
        status: statuses[i],
        time: currentTime.toISOString(),
        operator: rng.pick(['HR专员', '招聘主管', '用人部门', '系统', '候选人']),
        remark: remarks[statuses[i]]
      });
    }

    applications.push({
      id: `app_${appIdx++}`,
      jobSeekerId: js.id,
      positionId: pos.id,
      enterpriseId: pos.enterpriseId,
      source,
      status,
      currentStage: status === '面试中' ? rng.pick(stages) : null,
      matchScore: rng.int(55, 96),
      appliedAt,
      viewedAt: status !== '待处理' ? new Date(new Date(appliedAt).getTime() + rng.int(1, 24) * 60 * 60 * 1000).toISOString() : undefined,
      lastUpdatedAt: currentTime.toISOString(),
      history
    });
  }

  return applications;
}

/**
 * 生成人才候选人数据
 * @param project RPO项目
 * @param resumes 简历数组
 * @param rng 随机数生成器实例
 * @returns 候选人数组
 */
export function generateTalentCandidates(
  project: RPOProject,
  resumes: Resume[],
  rng: SeededRandom
): TalentCandidate[] {
  const candidateCount = Math.min(30, project.hiringCount * rng.int(2, 4));
  const candidates: TalentCandidate[] = [];
  const statuses: TalentCandidate['status'][] = ['待推荐', '已推荐', '已接受', '已拒绝', '面试中', '已发Offer', '已入职', '已淘汰'];
  const stages: InterviewStage[] = [InterviewStage.WRITTEN, InterviewStage.AISCREEN, InterviewStage.TECH, InterviewStage.HR, InterviewStage.DIRECTOR];

  const selectedResumes = rng.picks(resumes, candidateCount);

  for (let i = 0; i < candidateCount; i++) {
    const resume = selectedResumes[i];
    const status = rng.pick(statuses);
    candidates.push({
      id: `tc_${project.id}_${i}`,
      rpoProjectId: project.id,
      jobSeekerId: resume.jobSeekerId,
      resumeId: resume.id,
      status,
      currentStage: status === '面试中' ? rng.pick(stages) : null,
      stage: status === '面试中' ? rng.pick(stages) : null,
      recommendReason: `符合${project.positionTitle}岗位要求，${rng.pick(['技术背景扎实', '工作经验匹配', '稳定性好', '薪资期望合理', '沟通表达良好'])}，推荐面试。`,
      feedback: status === '已淘汰' ? rng.pick(['技术不符合', '薪资谈不拢', '候选人放弃', '面试表现一般']) : undefined,
      updatedAt: rng.date(new Date(2024, 3, 1), new Date(2024, 6, 10)),
      matchScore: rng.int(60, 95),
      tags: rng.picks(['经验丰富', '技术扎实', '稳定性好', '沟通能力强', '薪资合理'], rng.int(2, 4)),
      expectedSalary: [rng.int(5000, 8000), rng.int(8000, 15000)] as [number, number]
    });
  }

  return candidates;
}

/**
 * 生成RPO项目数据
 * @param count 生成数量
 * @param enterprises 企业数组
 * @param jobs 职位数组
 * @param resumes 简历数组
 * @param rng 随机数生成器实例
 * @returns RPO项目数组
 */
export function generateRPOProjects(
  count: number,
  enterprises: Enterprise[],
  jobs: JobPosition[],
  resumes: Resume[],
  rng: SeededRandom
): RPOProject[] {
  const rpoProjects: RPOProject[] = [];
  const stageWeights = [
    { value: RPOStage.DEMAND, weight: 5 },
    { value: RPOStage.SOURCING, weight: 15 },
    { value: RPOStage.SCREENING, weight: 18 },
    { value: RPOStage.INTERVIEW, weight: 22 },
    { value: RPOStage.OFFER, weight: 15 },
    { value: RPOStage.ONBOARD, weight: 10 },
    { value: RPOStage.GUARANTEE, weight: 8 },
    { value: RPOStage.COMPLETED, weight: 5 },
    { value: RPOStage.CANCELLED, weight: 2 }
  ];

  for (let i = 1; i <= count; i++) {
    const enterprise = rng.pick(enterprises);
    const job = rng.pick(jobs.filter(j => j.enterpriseId === enterprise.id)) || rng.pick(jobs);
    const stage = rng.weightedPick(stageWeights);
    const salary = randomSalaryRange(rng, JobSeekerType.SKILLED);
    const hiringCount = rng.int(3, 25);
    const filledCount = stage === RPOStage.COMPLETED ? hiringCount : Math.min(hiringCount, rng.int(0, hiringCount - 1));
    const startDate = rng.date(new Date(2024, 0, 1), new Date(2024, 4, 1));
    const start = new Date(startDate);
    const expected = new Date(start.getTime() + rng.int(60, 120) * 24 * 60 * 60 * 1000);

    const project: RPOProject = {
      id: `rpo_${i}`,
      code: `RPO${(2024000 + i).toString()}`,
      name: `${enterprise.shortName}-${job.title}批量招聘项目`,
      enterpriseId: enterprise.id,
      enterpriseName: enterprise.name,
      positionTitle: job.title,
      industry: enterprise.industry,
      township: enterprise.township,
      hiringCount,
      headcount: hiringCount,
      filledCount,
      salaryMin: salary.min,
      salaryMax: salary.max,
      salaryRange: [salary.min, salary.max],
      stage,
      stages: [stage],
      priority: rng.pick(['普通', '加急', '特急']),
      feeRate: rng.float(8, 25, 1),
      guaranteePeriod: rng.pick([30, 60, 90]),
      owner: randomChineseName(rng),
      ownerPhone: randomPhone(rng),
      startDate: startDate.slice(0, 10),
      expectedDate: expected.toISOString().slice(0, 10),
      completedDate: stage === RPOStage.COMPLETED ? rng.date(new Date(2024, 4, 1), new Date(2024, 6, 10)).slice(0, 10) : undefined,
      candidates: [],
      talentPool: [],
      backgroundChecks: [],
      createdAt: startDate,
      budget: hiringCount * salary.max * 3,
      spentBudget: hiringCount * salary.max * 3 * rng.float(0.3, 0.8, 2),
      description: `${enterprise.name}委托的${job.title}批量招聘RPO项目，计划招聘${hiringCount}人。`
    };

    project.candidates = generateTalentCandidates(project, resumes, rng);
    project.talentPool = project.candidates;

    const bgCandidates = project.candidates.filter(c => c.status === '已发Offer' || c.status === '已入职');
    const bgChecks: BackgroundCheck[] = [];
    bgCandidates.forEach(c => {
      ['学历验证', '工作履历核实', '不良记录核查', '职业资格核实'].forEach((item, bi) => {
        bgChecks.push({
          id: `bg_${project.id}_${c.id}_${bi}`,
          candidateId: c.id,
          item,
          status: rng.next() > 0.1 ? '通过' : '不通过',
          operator: randomChineseName(rng),
          checkedAt: rng.date(new Date(2024, 4, 1), new Date(2024, 6, 10))
        });
      });
    });
    project.backgroundChecks = bgChecks;

    rpoProjects.push(project);
  }

  return rpoProjects;
}

/**
 * 生成渠道ROI数据
 * @param months 月份数组
 * @param rng 随机数生成器实例
 * @returns 渠道ROI数组
 */
export function generateChannelROI(months: string[], rng: SeededRandom): ChannelROI[] {
  const channels = ['BOSS直聘', '智联招聘', '前程无忧', '58同城', '猎聘', '本地招聘网', '微信公众号', '抖音招聘', '快手招聘', '厂区直招', '员工推荐', '人力资源公司', '校招双选会', '线上招聘会', '线下招聘会'];
  const channelROIs: ChannelROI[] = [];
  let roiIdx = 1;

  months.forEach((month, mIdx) => {
    const channelCount = mIdx === months.length - 1 ? 10 : 15;
    const selectedChannels = rng.picks(channels, channelCount);
    selectedChannels.forEach(channel => {
      const cost = rng.int(2000, 50000);
      const viewCount = rng.int(500, 50000);
      const applicationCount = Math.floor(viewCount * rng.float(0.02, 0.1));
      const interviewCount = Math.floor(applicationCount * rng.float(0.08, 0.25));
      const hireCount = Math.floor(interviewCount * rng.float(0.15, 0.35));

      channelROIs.push({
        id: `roi_${roiIdx++}`,
        month,
        channel,
        cost,
        viewCount,
        views: viewCount,
        applicationCount,
        applications: applicationCount,
        interviewCount,
        interviews: interviewCount,
        hireCount,
        hires: hireCount,
        costPerHire: hireCount > 0 ? Math.round(cost / hireCount) : cost,
        conversionRate: viewCount > 0 ? parseFloat(((hireCount / viewCount) * 100).toFixed(2)) : 0,
        avgQualityScore: rng.float(60, 90, 1),
        avgTimeToHire: rng.float(15, 45, 1)
      });
    });
  });

  return channelROIs;
}

/**
 * 生成漏斗指标数据
 * @param periods 时间段数组
 * @param rng 随机数生成器实例
 * @returns 漏斗指标数组
 */
export function generateFunnelMetrics(periods: string[], rng: SeededRandom): FunnelMetrics[] {
  const funnelMetrics: FunnelMetrics[] = [];
  let funnelIdx = 1;

  for (const period of periods) {
    const viewCount = rng.int(20000, 80000);
    const applicationCount = Math.floor(viewCount * rng.float(0.06, 0.12));
    const screeningPassCount = Math.floor(applicationCount * rng.float(0.4, 0.65));
    const interviewCount = Math.floor(screeningPassCount * rng.float(0.35, 0.55));
    const offerCount = Math.floor(interviewCount * rng.float(0.18, 0.32));
    const onboardCount = Math.floor(offerCount * rng.float(0.55, 0.78));
    const cost = rng.int(50000, 200000);

    funnelMetrics.push({
      id: `funnel_${funnelIdx++}`,
      period,
      periodType: '月',
      viewCount,
      views: viewCount,
      clicks: Math.floor(viewCount * rng.float(0.3, 0.6)),
      applicationCount,
      applications: applicationCount,
      screeningPassCount,
      screeningPass: screeningPassCount,
      interviewCount,
      interviews: interviewCount,
      offerCount,
      offers: offerCount,
      onboardCount,
      hires: onboardCount,
      retention30d: rng.float(80, 95, 1),
      retention90d: rng.float(65, 85, 1),
      retention180d: rng.float(50, 75, 1),
      cost,
      costPerHire: onboardCount > 0 ? Math.round(cost / onboardCount) : 0,
      viewToApplicationRate: parseFloat(((applicationCount / viewCount) * 100).toFixed(2)),
      applicationToScreeningRate: parseFloat(((screeningPassCount / applicationCount) * 100).toFixed(2)),
      screeningToInterviewRate: parseFloat(((interviewCount / screeningPassCount) * 100).toFixed(2)),
      interviewToOfferRate: parseFloat(((offerCount / interviewCount) * 100).toFixed(2)),
      offerToOnboardRate: parseFloat(((onboardCount / offerCount) * 100).toFixed(2))
    });
  }

  return funnelMetrics;
}

/**
 * 生成留存分析数据
 * @param periods 时间段数组
 * @param rng 随机数生成器实例
 * @returns 留存分析数组
 */
export function generateRetentionData(periods: string[], rng: SeededRandom): RetentionAnalysis[] {
  const retentionAnalyses: RetentionAnalysis[] = [];
  const townshipCodes = TOWNSHIPS.map(t => t.code);
  let retIdx = 1;

  for (const period of periods) {
    const samples = rng.int(10, 18);
    const selectedTownships = rng.picks(townshipCodes, Math.ceil(samples / 2));
    const selectedIndustries = rng.picks(Object.values(IndustryTag), Math.ceil(samples / 3));

    for (const twp of selectedTownships) {
      for (const ind of selectedIndustries) {
        if (rng.next() > 0.35) continue;
        const onboardCount = rng.int(8, 120);

        retentionAnalyses.push({
          id: `ret_${retIdx++}`,
          month: period,
          months: period,
          township: twp,
          industry: ind,
          onboardCount,
          cohortSize: onboardCount,
          retention30: rng.float(78, 95, 1),
          retention90: rng.float(65, 88, 1),
          retention180: rng.float(52, 78, 1),
          retention365: rng.float(42, 68, 1),
          retention30d: rng.float(78, 95, 1),
          retention90d: rng.float(65, 88, 1),
          retention180d: rng.float(52, 78, 1),
          retention365d: rng.float(42, 68, 1),
          turnoverRate: rng.float(8, 28, 1),
          avgTenure: rng.float(8, 32, 1),
          cohort: period,
          attritionReasons: [
            { reason: '薪资待遇', count: rng.int(5, 20), percentage: rng.float(20, 35, 1) },
            { reason: '职业发展', count: rng.int(3, 15), percentage: rng.float(15, 28, 1) },
            { reason: '工作环境', count: rng.int(2, 10), percentage: rng.float(10, 20, 1) },
            { reason: '家庭原因', count: rng.int(2, 8), percentage: rng.float(8, 18, 1) },
            { reason: '其他', count: rng.int(1, 5), percentage: rng.float(5, 12, 1) }
          ]
        });
      }
    }
  }

  return retentionAnalyses;
}

/**
 * 生成校园宣讲会数据
 * @param count 生成数量
 * @param enterprises 企业数组
 * @param rng 随机数生成器实例
 * @returns 校园宣讲会数组
 */
export function generateCampusSessions(
  count: number,
  enterprises: Enterprise[],
  rng: SeededRandom
): CampusSession[] {
  const schools = ['广东工业大学', '华南理工大学', '广州大学', '佛山科学技术学院', '五邑大学', '广东技术师范大学', '东莞理工学院', '肇庆学院', '惠州学院', '韶关学院', '嘉应学院', '韩山师范学院', '广东石油化工学院', '湛江科技学院', '珠海科技学院'];
  const campusSessions: CampusSession[] = [];
  let csIdx = 1;

  for (let i = 1; i <= count; i++) {
    const school = rng.pick(schools);
    const selectedEnterprises = rng.picks(enterprises, rng.int(15, 35));
    const start = new Date(2024, rng.int(8, 10), rng.int(1, 28));
    const end = new Date(start.getTime() + rng.int(30, 90) * 24 * 60 * 60 * 1000);
    const participantCount = rng.int(200, 1200);
    const hireTarget = Math.floor(participantCount * rng.float(0.05, 0.15));
    const industries = rng.picks(Object.values(IndustryTag), rng.int(3, 6));
    const township = rng.pick(TOWNSHIPS);

    const samplePositions = selectedEnterprises.length > 0
      ? selectedEnterprises.flatMap(e => e.id ? [] : []).slice(0, 1)
      : [];

    const writtenExam: WrittenExam | undefined = rng.next() > 0.3 ? {
      id: `we_${csIdx}`,
      positionId: `pos_${rng.int(1, 100)}`,
      positionTitle: `${school}综合能力笔试`,
      duration: 90,
      totalScore: 100,
      passScore: 60,
      questions: Array.from({ length: 25 }, (_, qi) => {
        const qTypes: ExamQuestion['type'][] = ['单选', '多选', '判断', '简答'];
        const qType = rng.weightedPick(qTypes.map((t, idx) => ({ value: t, weight: [10, 5, 6, 4][idx] })));
        return {
          id: `eq_${csIdx}_${qi}`,
          type: qType,
          content: `${rng.pick(['逻辑推理', '数量关系', '行业常识', '专业基础', '综合分析', '英语能力'])}题${qi + 1}`,
          options: qType !== '简答' && qType !== '判断' ? ['A. 选项一', 'B. 选项二', 'C. 选项三', 'D. 选项四'] : undefined,
          answer: qType === '判断' ? (rng.next() > 0.5 ? '正确' : '错误') : qType === '简答' ? '参考答案要点...' : rng.pick(['A', 'B', 'C', 'D']),
          score: qType === '简答' ? 10 : qType === '多选' ? 4 : 3,
          category: rng.pick(['综合能力', '专业知识', '英语', '逻辑'])
        } as ExamQuestion;
      }),
      startTime: start.toISOString(),
      endTime: end.toISOString()
    } : undefined;

    const aiInterview: AIInterview | undefined = rng.next() > 0.4 ? {
      id: `ai_${csIdx}`,
      positionId: `pos_${rng.int(1, 100)}`,
      positionTitle: `${school}AI面试评估`,
      durationPerQuestion: 15,
      questions: [
        { id: `aiq_${csIdx}_1`, question: '请用1-2分钟做一个自我介绍，包括你的专业背景和实习经历', expectedKeywords: ['专业', '实习', '技能'], answerDuration: 90, thinkTime: 30, type: '自我介绍' },
        { id: `aiq_${csIdx}_2`, question: '请谈谈你对本专业领域发展趋势的理解', expectedKeywords: ['发展', '趋势', '技术'], answerDuration: 120, thinkTime: 30, type: '专业能力' },
        { id: `aiq_${csIdx}_3`, question: '请分享一次你克服困难完成任务的经历', expectedKeywords: ['困难', '解决', '团队'], answerDuration: 120, thinkTime: 30, type: '综合素质' },
        { id: `aiq_${csIdx}_4`, question: '如果领导安排的任务与你个人规划冲突，你会如何处理？', expectedKeywords: ['沟通', '协调', '优先级'], answerDuration: 90, thinkTime: 30, type: '情景模拟' }
      ] as AIQuestion[],
      aiWeights: {
        expression: rng.int(20, 30),
        speech: rng.int(30, 40),
        semantics: rng.int(35, 45)
      },
      scoreReports: [
        { id: `aisr_${csIdx}_1`, interviewId: `ai_${csIdx}`, candidateId: `cand_${csIdx}_1`, overallScore: rng.float(65, 95, 1), dimensions: { expression: rng.float(65, 95, 1), speech: rng.float(60, 92, 1), semantics: rng.float(58, 90, 1) }, keywordHitRate: rng.float(60, 90, 1), feedback: '表达清晰流畅，逻辑层次分明', overallComment: '综合表现良好', conductedAt: rng.date(start, end) },
        { id: `aisr_${csIdx}_2`, interviewId: `ai_${csIdx}`, candidateId: `cand_${csIdx}_2`, overallScore: rng.float(60, 92, 1), dimensions: { expression: rng.float(60, 92, 1), speech: rng.float(58, 90, 1), semantics: rng.float(62, 93, 1) }, keywordHitRate: rng.float(55, 88, 1), feedback: '具备扎实的专业基础', overallComment: '专业能力较强', conductedAt: rng.date(start, end) }
      ] as AIScoreReport[],
      overallScore: rng.float(65, 92, 1)
    } : undefined;

    const formatTypes: Array<'线上' | '线下' | '混合'> = ['线上', '线下', '混合'];
    const statusTypes: Array<'筹备中' | '进行中' | '已结束'> = ['筹备中', '进行中', '已结束'];
    const capacity = rng.int(400, 2000);
    const registered = rng.int(Math.floor(capacity * 0.3), capacity);

    campusSessions.push({
      id: `cs_${csIdx}`,
      code: `CAMPUS${2024}${csIdx.toString().padStart(3, '0')}`,
      name: `中山市${school}2025届校园招聘会`,
      enterpriseIds: selectedEnterprises.map(e => e.id),
      enterpriseName: selectedEnterprises[0]?.name,
      university: school,
      school: school,
      college: `${rng.pick(['机电工程学院', '电子信息学院', '经济管理学院', '计算机学院', '自动化学院'])}`,
      date: start.toISOString().slice(0, 10),
      format: rng.pick(formatTypes),
      venue: `${township.name}${rng.pick(['国际会展中心', '体育馆', '学术报告厅', '就业指导中心'])}${rng.int(1, 5)}号馆`,
      capacity,
      registered,
      positionIds: selectedEnterprises.slice(0, 10).map((_, idx) => `pos_${csIdx}_${idx}`),
      positionNames: selectedEnterprises.slice(0, 5).map(e => `${e.shortName}招聘`),
      status: rng.pick(statusTypes),
      participantCount,
      hireTarget,
      hiredCount: Math.floor(hireTarget * rng.float(0.3, 0.9)),
      description: `汇聚${selectedEnterprises.length}家中山优质企业，提供${rng.int(50, 200)}个${industries.slice(0, 3).join('/')}相关岗位，面向2025届毕业生。`,
      writtenExam,
      aiInterview,
      createdAt: rng.date(new Date(2024, 5, 1), start)
    });
    csIdx++;
  }

  return campusSessions;
}

/**
 * 生成学历课程数据
 * @param count 生成数量
 * @param rng 随机数生成器实例
 * @returns 学历课程数组
 */
export function generateEducationCourses(
  count: number,
  rng: SeededRandom
): EducationCourse[] {
  const courseProviders = ['中山职业技术学院', '中山火炬职业技术学院', '中山市技师学院', '电子科技大学中山学院继续教育', '中山市开放大学', '广东理工职业学院中山校区'];
  const courseNames = [
    { name: '机电一体化技术大专班', category: '学历提升', level: '大专' as const, type: '自考' as const },
    { name: '数控技术中专班', category: '学历提升', level: '中专' as const, type: '自考' as const },
    { name: '工商管理专升本', category: '学历提升', level: '本科' as const, type: '成考' as const },
    { name: '电子商务大专班', category: '学历提升', level: '大专' as const, type: '成考' as const },
    { name: '工业机器人操作与编程', category: '职业技能', level: '大专' as const, type: '职业资格' as const },
    { name: 'CNC精密加工高级班', category: '职业技能', level: '中专' as const, type: '职业资格' as const },
    { name: 'PLC自动化控制工程师', category: '职业技能', level: '大专' as const, type: '职业资格' as const },
    { name: '工业设计师资格证', category: '职业资格', level: '大专' as const, type: '职业资格' as const },
    { name: '模具设计师职业资格', category: '职业资格', level: '大专' as const, type: '职业资格' as const },
    { name: '焊工高级技能班', category: '职业技能', level: '中专' as const, type: '职业资格' as const },
    { name: '电工技师资格培训', category: '职业资格', level: '中专' as const, type: '职业资格' as const },
    { name: '人力资源管理师二级', category: '职业资格', level: '本科' as const, type: '职业资格' as const }
  ];
  const courses: EducationCourse[] = [];
  const townshipCodes = TOWNSHIPS.map(t => t.code);

  for (let i = 0; i < Math.min(count, courseNames.length); i++) {
    const cn = courseNames[i];
    const duration = cn.category === '学历提升' ? (cn.level === '本科' ? 48 : cn.level === '大专' ? 36 : 24) : rng.int(4, 12);
    const start = new Date(2024, rng.int(6, 11), rng.int(1, 28));
    const end = new Date(start.getTime() + duration * 30 * 24 * 60 * 60 * 1000);
    const maxStudents = cn.category === '学历提升' ? rng.int(60, 150) : rng.int(25, 50);
    const enrollmentCount = Math.floor(maxStudents * rng.float(0.55, 0.98));
    const township = rng.pick(townshipCodes);
    const townshipName = TOWNSHIPS.find(t => t.code === township)?.name || '中山';
    const statusTypes: Array<'招生中' | '已开班' | '已结束'> = ['招生中', '已开班', '已结束'];

    courses.push({
      id: `ec_${i + 1}`,
      code: `EDU${2024}${(i + 1).toString().padStart(3, '0')}`,
      title: cn.name,
      provider: rng.pick(courseProviders),
      type: cn.type,
      targetDegree: cn.level,
      major: rng.pick(['机械电子', '工商管理', '智能制造', '数控技术', '自动化', '电子商务', '工业设计', '人力资源']),
      duration: `${duration}个月`,
      price: cn.category === '学历提升' ? rng.int(6000, 28000) : rng.int(1500, 8800),
      creditBankEligible: cn.category === '学历提升' || rng.next() > 0.3,
      enrollmentLink: `https://example.com/enroll/ec_${i + 1}`,
      tags: rng.picks(['热门', '推荐就业', '校企合作', '学历提升', '学位可申请', '高薪技能', '实操为主', '紧缺岗位'], rng.int(2, 4)),
      totalCredits: cn.category === '学历提升' ? (cn.level === '本科' ? 140 : cn.level === '大专' ? 110 : 90) : rng.int(15, 60),
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      township,
      location: `${townshipName}${rng.pick(['职业培训中心', '成人教育中心', '技能鉴定中心', '继续教育学院', '人才服务中心'])}`,
      description: `${cn.name}培训课程，涵盖理论学习和实操训练，考核合格颁发相应证书。适合在职人员提升学历和技能水平。`,
      rating: rng.float(4.2, 4.9, 1),
      enrollmentCount,
      maxStudents,
      status: start > new Date() ? '招生中' : end < new Date() ? '已结束' : rng.pick(statusTypes),
      createdAt: rng.date(new Date(2024, 3, 1), start)
    });
  }

  return courses;
}

/**
 * 生成学分银行记录
 * @param jobSeekerCount 求职者数量
 * @param courses 课程数组
 * @param rng 随机数生成器实例
 * @returns 学分银行记录数组
 */
export function generateCreditBankRecords(
  jobSeekerCount: number,
  courses: EducationCourse[],
  rng: SeededRandom
): CreditBankRecord[] {
  const records: CreditBankRecord[] = [];
  const statusTypes: Array<'未同步' | '同步中' | '已同步' | '已认证'> = ['未同步', '同步中', '已同步', '已认证'];
  let recordIdx = 1;

  for (let i = 1; i <= jobSeekerCount; i++) {
    if (rng.next() > 0.4) continue;
    const courseCount = rng.int(1, 5);
    const selectedCourses = rng.picks(courses, courseCount);

    for (const course of selectedCourses) {
      const totalCredits = course.totalCredits || rng.int(10, 30);
      const progress = rng.int(0, 100);
      const earnedCredits = Math.floor(totalCredits * (progress / 100));
      const start = new Date(2024, rng.int(1, 9), rng.int(1, 28));

      records.push({
        id: `cbr_${recordIdx++}`,
        jobSeekerId: `js_${i}`,
        courseId: course.id,
        courseTitle: course.title,
        earnedCredits,
        totalCredits,
        progress,
        estimatedCertDate: new Date(start.getTime() + (12 + rng.int(0, 18)) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        syncStatus: progress === 100 ? rng.pick(statusTypes) : progress > 50 ? rng.pick(['未同步', '同步中']) : '未同步',
        earnedAt: progress === 100 ? rng.date(start, new Date()).slice(0, 10) : undefined,
        status: progress === 100 ? '已完成' : progress > 0 ? '进行中' : '待开始'
      });
    }
  }

  return records;
}