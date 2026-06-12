import { faker } from '@faker-js/faker/locale/zh_CN';
import type {
  User,
  DecorationCompany,
  InspirationItem,
  ConstructionProcess,
  PitfallGuide,
  CommunityQuestion,
  Project,
  MaterialSKU,
  DisputeCase,
  MeasurementAppointment,
  DesignStyle,
  ColorPalette,
  StandardRef,
  ProcessStep,
  QualificationDoc,
  HistoricalProject,
  InspectionReport,
  RoomConfig,
  WallConfig,
  FurnitureItem,
  DesignPlan3D,
  QuoteItem,
  DecorationQuote,
  SupplierAPIConfig,
  ComparisonPlan,
  MeasurementRecord,
  ProjectTask,
  CommunityAnswer,
  Comment,
  Statement,
  Evidence,
  MediationLog,
  ArbitrationResult,
  WarrantyTerm,
} from '@/types';

const DESIGN_STYLES: DesignStyle[] = ['modern', 'nordic', 'chinese', 'luxury', 'industrial', 'japanese', 'mediterranean'];

const STYLE_COLOR_PALETTES: Record<DesignStyle, ColorPalette[]> = {
  modern: [
    { primary: '#2C3E50', secondary: '#34495E', accent: '#E74C3C', neutrals: ['#ECF0F1', '#BDC3C7', '#95A5A6'] },
    { primary: '#1A1A2E', secondary: '#16213E', accent: '#E94560', neutrals: ['#F5F5F5', '#D4D4D8', '#A1A1AA'] },
  ],
  nordic: [
    { primary: '#F5F1EB', secondary: '#E8DFD3', accent: '#7BA3A8', neutrals: ['#FFFFFF', '#FAFAFA', '#D9D9D9'] },
    { primary: '#EFEAE3', secondary: '#D7CFC3', accent: '#B5838D', neutrals: ['#FDFBF7', '#F0EBE3', '#C9C0B3'] },
  ],
  chinese: [
    { primary: '#8B0000', secondary: '#B22222', accent: '#DAA520', neutrals: ['#FDF5E6', '#FAEBD7', '#DEB887'] },
    { primary: '#3D2914', secondary: '#5C3D2E', accent: '#C9A961', neutrals: ['#F5E6D3', '#E8D4B8', '#C9B896'] },
  ],
  luxury: [
    { primary: '#1A1A1A', secondary: '#2D2D2D', accent: '#C9A961', neutrals: ['#F8F8F8', '#E8E8E8', '#A0A0A0'] },
    { primary: '#0C0C0C', secondary: '#1F1F1F', accent: '#D4AF37', neutrals: ['#FAFAFA', '#DCDCDC', '#808080'] },
  ],
  industrial: [
    { primary: '#2B2B2B', secondary: '#3C3C3C', accent: '#CD853F', neutrals: ['#A9A9A9', '#808080', '#696969'] },
    { primary: '#363636', secondary: '#4A4A4A', accent: '#8B4513', neutrals: ['#C0C0C0', '#A0A0A0', '#708090'] },
  ],
  japanese: [
    { primary: '#D4C5A9', secondary: '#C2B280', accent: '#556B2F', neutrals: ['#F5F5DC', '#E8E4D0', '#BEBE99'] },
    { primary: '#C9B79C', secondary: '#B5A07A', accent: '#6B8E23', neutrals: ['#FAF8F0', '#F0EAD6', '#CCBE9A'] },
  ],
  mediterranean: [
    { primary: '#1E3A5F', secondary: '#2E5077', accent: '#DAA520', neutrals: ['#FFF8DC', '#F5DEB3', '#DEB887'] },
    { primary: '#003366', secondary: '#004C99', accent: '#E6B800', neutrals: ['#FFFFF0', '#FFFACD', '#F0E68C'] },
  ],
};

const PROCESS_STAGES: ConstructionProcess['stage'][] = ['water_electric', 'masonry', 'carpentry', 'painting', 'installation'];
const STAGE_NAMES: Record<ConstructionProcess['stage'], string> = {
  water_electric: '水电工程',
  masonry: '泥木工程',
  carpentry: '木工工程',
  painting: '油漆工程',
  installation: '安装工程',
};

const PROCESS_NAMES: Record<ConstructionProcess['stage'], string[]> = {
  water_electric: ['水电定位放线', '水管铺设安装', '电路布线施工', '强电箱配置', '弱电系统布置', '防水闭水试验'],
  masonry: ['墙面找平抹灰', '地面找平处理', '瓷砖铺贴施工', '墙砖铺贴工艺', '门槛石安装', '包立管施工'],
  carpentry: ['吊顶龙骨安装', '石膏板封板', '定制柜体安装', '木地板龙骨铺设', '门窗套制作', '背景墙基层'],
  painting: ['墙面刮腻子', '腻子打磨平整', '底漆涂刷施工', '面漆涂刷工艺', '木器漆施工', '艺术漆效果'],
  installation: ['橱柜安装施工', '洁具卫浴安装', '开关插座安装', '灯具安装调试', '木地板铺装', '五金配件安装'],
};

const GB_STANDARDS: Omit<StandardRef, 'article' | 'content'>[] = [
  { type: 'GB', code: 'GB 50303-2015' },
  { type: 'GB', code: 'GB 50242-2002' },
  { type: 'GB', code: 'GB 50210-2018' },
  { type: 'JGJ', code: 'JGJ 46-2005' },
  { type: 'JGJ', code: 'JGJ/T 298-2013' },
  { type: 'HB', code: 'HB 201-2016' },
];

const ARTICLE_TEMPLATES = [
  '第4.2.1条',
  '第5.1.3条',
  '第3.2.5条',
  '第6.1.2条',
  '第7.3.4条',
  '第8.2.1条',
];

const PITFALL_STAGES: PitfallGuide['stage'][] = ['water_electric', 'masonry', 'carpentry', 'painting', 'installation', 'contract'];
const PITFALL_TITLES = {
  water_electric: ['水管打压试验未做', '电路未分回路布置', '强弱电同槽敷设', '防水高度不足', '地漏排水坡度不够', '接线端子裸露'],
  masonry: ['瓷砖空鼓率超标', '墙砖压地砖工艺错误', '地面找平起砂', '阴阳角不方正', '瓷砖缝隙不均匀', '过门石安装渗水'],
  carpentry: ['吊顶龙骨间距过大', '石膏板接缝未处理', '柜体背板未封边', '门吸安装位置错误', '衣柜与墙体缝隙过大', '吊顶转角整块裁切'],
  painting: ['腻子未干透刷漆', '底漆漏刷', '墙面色差明显', '流坠挂泪现象', '木纹棕眼未填平', '阴阳角不顺直'],
  installation: ['橱柜水平度不达标', '马桶密封不严漏水', '地板起拱变形', '插座相位接反', '灯具固定不牢', '五金件松动'],
  contract: ['合同增项条款模糊', '工期延误赔偿过低', '材料品牌规格未注明', '付款比例不合理', '质保条款不完善', '验收标准未明确'],
};

const ROOM_TYPES: RoomConfig['type'][] = ['living', 'bedroom', 'kitchen', 'bathroom', 'balcony', 'dining'];
const ROOM_NAMES: Record<RoomConfig['type'], string[]> = {
  living: ['客厅', '大客厅', '小客厅'],
  bedroom: ['主卧', '次卧', '儿童房', '书房'],
  kitchen: ['厨房', '开放式厨房'],
  bathroom: ['主卫', '客卫'],
  balcony: ['生活阳台', '观景阳台'],
  dining: ['餐厅', '用餐区'],
};

const FURNITURE_CATEGORIES: FurnitureItem['category'][] = ['sofa', 'bed', 'table', 'chair', 'cabinet', 'tv', 'lamp', 'decoration'];

export function createUsers(): User[] {
  const users: User[] = [];

  users.push({
    id: 'user-owner-001',
    role: 'owner',
    phone: '13800000001',
    nickname: '张先生',
    avatar: faker.image.avatar(),
    createdAt: faker.date.past({ years: 1 }).toISOString(),
  });

  users.push({
    id: 'user-owner-002',
    role: 'owner',
    phone: '13800000002',
    nickname: '李女士',
    avatar: faker.image.avatar(),
    createdAt: faker.date.past({ years: 1 }).toISOString(),
  });

  for (let i = 1; i <= 2; i++) {
    users.push({
      id: `user-provider-00${i}`,
      role: 'provider',
      phone: `1380000001${i}`,
      nickname: faker.company.name(),
      avatar: faker.image.avatar(),
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    });
  }

  for (let i = 1; i <= 3; i++) {
    users.push({
      id: `user-expert-00${i}`,
      role: 'expert',
      phone: `1380000002${i}`,
      nickname: `${faker.person.lastName()}专家`,
      avatar: faker.image.avatar(),
      createdAt: faker.date.past({ years: 2 }).toISOString(),
    });
  }

  users.push({
    id: 'user-admin-001',
    role: 'admin',
    phone: '13800000099',
    nickname: '系统管理员',
    avatar: faker.image.avatar(),
    createdAt: faker.date.past({ years: 3 }).toISOString(),
  });

  return users;
}

function createQualificationDocs(companyId: string): QualificationDoc[] {
  const types: QualificationDoc['type'][] = ['business_license', 'qualification_cert', 'safety_permit'];
  return types.map((type, idx) => ({
    id: `qual-${companyId}-${idx}`,
    type,
    imageUrl: faker.image.urlLoremFlickr({ category: 'business', width: 800, height: 600 }),
    ocrResult: {
      公司名称: faker.company.name(),
      统一社会信用代码: faker.string.numeric(18),
      法定代表人: faker.person.fullName(),
      注册资本: `${faker.number.int({ min: 100, max: 2000 })}万元`,
      成立日期: faker.date.past({ years: 10 }).toISOString().split('T')[0],
    },
    verifiedAt: faker.date.past({ years: 1 }).toISOString(),
  }));
}

function createHistoricalProjects(count: number): HistoricalProject[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `hp-${faker.string.uuid()}`,
    name: `${faker.location.city()}${faker.person.lastName()}宅`,
    area: faker.number.float({ min: 80, max: 200, fractionDigits: 1 }),
    price: faker.number.int({ min: 150000, max: 1500000 }),
    style: faker.helpers.arrayElement(DESIGN_STYLES),
    imageUrl: faker.image.urlLoremFlickr({ category: 'interior', width: 600, height: 400 }),
    completedAt: faker.date.past({ years: 3 }).toISOString(),
  }));
}

function createInspectionReports(count: number): InspectionReport[] {
  const stages = ['水电阶段', '泥木阶段', '木工阶段', '油漆阶段', '安装阶段', '竣工验收'];
  return Array.from({ length: count }, (_, i) => ({
    id: `ir-${faker.string.uuid()}`,
    stage: stages[i % stages.length],
    inspector: faker.person.fullName(),
    score: faker.number.int({ min: 75, max: 100 }),
    issues: faker.helpers.arrayElements([
      '部分线路接线不规范',
      '瓷砖局部空鼓需整改',
      '墙面平整度略有偏差',
      '吊顶龙骨间距稍大',
      '防水需二次涂刷',
    ], { min: 0, max: 3 }),
    images: Array.from({ length: 3 }, () =>
      faker.image.urlLoremFlickr({ category: 'construction', width: 400, height: 300 })
    ),
    inspectedAt: faker.date.recent({ days: 90 }).toISOString(),
  }));
}

export function createCompanies(count = 8): DecorationCompany[] {
  const companies: DecorationCompany[] = [];
  const prefixes = ['鼎盛', '优品', '匠心', '雅居', '金鼎', '美居', '宜家', '瑞景', '华庭', '东易'];
  const suffixes = ['装饰工程', '建筑装饰', '空间设计', '家居设计', '装饰设计', '装修设计'];

  for (let i = 0; i < count; i++) {
    const isPending = i >= count - 2;
    const name = `${prefixes[i % prefixes.length]}${faker.helpers.arrayElement(suffixes)}有限公司`;
    const company: DecorationCompany = {
      id: `company-${String(i + 1).padStart(3, '0')}`,
      name,
      logo: faker.image.urlLoremFlickr({ category: 'logo', width: 200, height: 200 }),
      qualificationLevel: faker.helpers.arrayElement(['level1', 'level2', 'level3'] as const),
      licenseNumber: faker.string.alphanumeric(15).toUpperCase(),
      establishedYear: faker.number.int({ min: 2005, max: 2020 }),
      caseCount: faker.number.int({ min: 50, max: 500 }),
      averageRating: faker.number.float({ min: 4.0, max: 5.0, fractionDigits: 1 }),
      reviewCount: faker.number.int({ min: 20, max: 300 }),
      city: faker.helpers.arrayElement(['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京']),
      serviceScope: faker.helpers.arrayElements(
        ['家装', '工装', '别墅', '旧房改造', '软装搭配', '全屋定制'],
        { min: 2, max: 5 }
      ),
      tags: faker.helpers.arrayElements(
        ['免费量房', '零增项', '十年质保', '环保材料', '自有工人', '分期付款', '设计免费'],
        { min: 2, max: 4 }
      ),
      auditStatus: isPending ? 'pending' : faker.helpers.arrayElement(['approved', 'rejected', 'approved'] as const),
      qualificationDocs: createQualificationDocs(`company-${i + 1}`),
      historicalProjects: createHistoricalProjects(faker.number.int({ min: 3, max: 8 })),
      inspectionReports: createInspectionReports(faker.number.int({ min: 2, max: 6 })),
    };
    companies.push(company);
  }

  return companies;
}

export function createInspirations(count = 60): InspirationItem[] {
  const roomTypes = ['客厅', '卧室', '厨房', '卫生间', '餐厅', '书房', '阳台'];
  const inspirations: InspirationItem[] = [];

  for (let i = 0; i < count; i++) {
    const style = DESIGN_STYLES[i % DESIGN_STYLES.length];
    const palettes = STYLE_COLOR_PALETTES[style];
    const palette = palettes[i % palettes.length];

    inspirations.push({
      id: `inspiration-${String(i + 1).padStart(3, '0')}`,
      title: `${faker.helpers.arrayElement(roomTypes)}${style === 'modern' ? '现代' : style === 'nordic' ? '北欧' : style === 'chinese' ? '新中式' : style === 'luxury' ? '轻奢' : style === 'industrial' ? '工业风' : style === 'japanese' ? '日式' : '地中海'}风格设计`,
      imageUrl: faker.image.urlLoremFlickr({ category: 'interior', width: 800, height: 600 }) + `?lock=${i}`,
      style,
      roomType: faker.helpers.arrayElement(roomTypes),
      colorPalette: { ...palette, neutrals: [...palette.neutrals] },
      materialIds: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () =>
        `sku-${String(faker.number.int({ min: 1, max: 200 })).padStart(3, '0')}`
      ),
      tags: faker.helpers.arrayElements(
        ['简约', '实用', '大气', '温馨', '收纳', '采光好', '动线合理', '环保', '性价比高', '颜值在线'],
        { min: 2, max: 4 }
      ),
      designerName: faker.helpers.maybe(() => faker.person.fullName(), { probability: 0.6 }),
      likes: faker.number.int({ min: 10, max: 2000 }),
      views: faker.number.int({ min: 50, max: 10000 }),
    });
  }

  return inspirations;
}

function createStandardRefs(): StandardRef[] {
  const count = faker.number.int({ min: 1, max: 3 });
  const refs: StandardRef[] = [];
  const used = new Set<string>();

  for (let i = 0; i < count; i++) {
    const base = faker.helpers.arrayElement(GB_STANDARDS);
    const key = `${base.code}-${i}`;
    if (used.has(key)) continue;
    used.add(key);

    refs.push({
      ...base,
      article: faker.helpers.arrayElement(ARTICLE_TEMPLATES),
      content: faker.lorem.sentences({ min: 1, max: 2 }),
    });
  }

  return refs;
}

function createProcessSteps(processName: string): ProcessStep[] {
  const count = faker.number.int({ min: 4, max: 6 });
  return Array.from({ length: count }, (_, i) => ({
    order: i + 1,
    title: `${processName}第${i + 1}步：${faker.lorem.words({ min: 3, max: 6 })}`,
    description: faker.lorem.sentences({ min: 2, max: 4 }),
    keyPoints: faker.helpers.arrayElements(
      ['严格按照图纸施工', '注意成品保护', '施工前弹线定位', '材料进场验收', '隐蔽工程验收', '基层处理到位'],
      { min: 2, max: 4 }
    ),
    imageUrl: faker.helpers.maybe(
      () => faker.image.urlLoremFlickr({ category: 'construction', width: 600, height: 400 }),
      { probability: 0.8 }
    ),
  }));
}

export function createProcesses(): ConstructionProcess[] {
  const processes: ConstructionProcess[] = [];
  let idx = 0;

  for (const stage of PROCESS_STAGES) {
    const names = PROCESS_NAMES[stage];
    for (const name of names) {
      if (faker.helpers.arrayElement([true, true, true, false])) {
        idx++;
        processes.push({
          id: `process-${String(idx).padStart(3, '0')}`,
          stage,
          name,
          standardRefs: createStandardRefs(),
          steps: createProcessSteps(name),
          images: Array.from({ length: faker.number.int({ min: 2, max: 4 }) }, () =>
            faker.image.urlLoremFlickr({ category: 'construction', width: 600, height: 400 })
          ),
          videoUrl: faker.helpers.maybe(() => 'https://example.com/video.mp4', { probability: 0.3 }),
          commonProblems: faker.helpers.arrayElements(
            ['施工人员不按规范操作', '材料质量参差不齐', '天气影响进度', '交叉施工协调问题', '业主临时变更'],
            { min: 1, max: 3 }
          ),
        });
      }
    }
  }

  return processes;
}

export function createPitfalls(count = 30): PitfallGuide[] {
  const pitfalls: PitfallGuide[] = [];
  const riskLevels: PitfallGuide['riskLevel'][] = ['low', 'medium', 'high'];

  for (let i = 0; i < count; i++) {
    const stage = PITFALL_STAGES[i % PITFALL_STAGES.length];
    const titles = PITFALL_TITLES[stage];
    const title = titles[i % titles.length];
    const riskLevel = riskLevels[i % riskLevels.length];

    pitfalls.push({
      id: `pitfall-${String(i + 1).padStart(3, '0')}`,
      stage,
      title,
      riskLevel,
      description: faker.lorem.sentences({ min: 2, max: 4 }),
      symptoms: faker.helpers.arrayElements(
        ['渗水漏水现象', '墙面开裂', '空鼓脱落', '异味刺鼻', '功能失效', '外观瑕疵', '安全隐患'],
        { min: 2, max: 4 }
      ),
      solutions: faker.helpers.arrayElements(
        ['选择正规施工队', '签订详细合同', '加强现场监督', '做好隐蔽验收', '留存证据维权', '购买正规材料'],
        { min: 2, max: 4 }
      ),
      relatedProcessIds: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
        `process-${String(faker.number.int({ min: 1, max: 25 })).padStart(3, '0')}`
      ),
      views: faker.number.int({ min: 100, max: 50000 }),
    });
  }

  return pitfalls;
}

function createComments(answerId: string, count: number): Comment[] {
  return Array.from({ length: count }, (_, j) => ({
    id: `comment-${answerId}-${j}`,
    authorId: `user-${faker.string.uuid().slice(0, 8)}`,
    authorName: faker.person.fullName(),
    content: faker.lorem.sentences({ min: 1, max: 3 }),
    createdAt: faker.date.recent({ days: 30 }).toISOString(),
  }));
}

function createAnswers(questionId: string): CommunityAnswer[] {
  const answerCount = faker.number.int({ min: 2, max: 5 });
  return Array.from({ length: answerCount }, (_, j) => {
    const isExpert = faker.helpers.maybe(() => true, { probability: 0.4 });
    return {
      id: `answer-${questionId}-${j}`,
      authorId: isExpert ? `user-expert-00${faker.number.int({ min: 1, max: 3 })}` : `user-${faker.string.uuid().slice(0, 8)}`,
      authorName: isExpert ? `${faker.person.lastName()}专家` : faker.person.fullName(),
      isExpert,
      isCertified: isExpert && faker.helpers.maybe(() => true, { probability: 0.8 }),
      content: faker.lorem.sentences({ min: 3, max: 6 }),
      voteCount: faker.number.int({ min: 0, max: 200 }),
      comments: createComments(`answer-${questionId}-${j}`, faker.number.int({ min: 0, max: 3 })),
      createdAt: faker.date.recent({ days: 60 }).toISOString(),
    };
  });
}

export function createQuestions(count = 20): CommunityQuestion[] {
  const clusterTags = ['水电改造', '材料选购', '设计风格', '施工工艺', '合同签订', '验收标准', '售后保修', '软装搭配'];
  const questions: CommunityQuestion[] = [];
  const questionTemplates = [
    '装修水电改造需要注意什么？',
    '如何选择靠谱的装修公司？',
    '北欧风格和现代简约怎么选？',
    '瓷砖铺贴空鼓率标准是多少？',
    '装修合同应该关注哪些条款？',
    '乳胶漆和墙纸哪个更环保？',
    '定制衣柜需要注意哪些细节？',
    '卫生间防水怎么做才靠谱？',
    '验收时如何检查施工质量？',
    '装修增项太多怎么办？',
  ];

  for (let i = 0; i < count; i++) {
    questions.push({
      id: `question-${String(i + 1).padStart(3, '0')}`,
      ownerId: `user-owner-00${faker.number.int({ min: 1, max: 2 })}`,
      ownerName: faker.helpers.arrayElement(['张先生', '李女士', '王小姐', '赵先生', '陈女士']),
      clusterTag: faker.helpers.arrayElement(clusterTags),
      title: i < questionTemplates.length ? questionTemplates[i] : faker.lorem.sentence({ min: 6, max: 15 }),
      content: faker.lorem.sentences({ min: 3, max: 6 }),
      images: faker.helpers.maybe(
        () =>
          Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () =>
            faker.image.urlLoremFlickr({ category: 'interior', width: 600, height: 400 })
          ),
        { probability: 0.5 }
      ),
      stageTag: faker.helpers.maybe(() => STAGE_NAMES[faker.helpers.arrayElement(PROCESS_STAGES)], { probability: 0.7 }),
      answers: createAnswers(`question-${i + 1}`),
      voteCount: faker.number.int({ min: 0, max: 300 }),
      viewCount: faker.number.int({ min: 20, max: 10000 }),
      createdAt: faker.date.recent({ days: 180 }).toISOString(),
    });
  }

  return questions;
}

function createTasks(projectId: string): ProjectTask[] {
  const taskCount = faker.number.int({ min: 15, max: 25 });
  const taskNames = [
    '量房设计', '方案确认', '材料采购', '主体拆改', '水电改造',
    '防水工程', '木工工程', '泥瓦工程', '油漆工程', '厨卫吊顶',
    '橱柜安装', '木门安装', '地板铺设', '开关插座', '灯具安装',
    '五金洁具', '窗帘安装', '开荒保洁', '家具进场', '家电安装',
    '软装搭配', '竣工验收', '整改维修', '交付使用', '保修服务',
  ];
  const assignees = ['张工', '李工', '王工', '赵工', '陈工', '刘工'];

  const tasks: ProjectTask[] = [];
  let offset = 0;

  for (let i = 0; i < taskCount; i++) {
    const duration = faker.number.int({ min: 1, max: 7 });
    const statusPool: ProjectTask['status'][] = ['not_started', 'in_progress', 'completed', 'delayed'];
    const milestone = i % 5 === 0;

    tasks.push({
      id: `task-${projectId}-${String(i + 1).padStart(3, '0')}`,
      name: taskNames[i % taskNames.length],
      parentId: milestone ? undefined : tasks[Math.max(0, i - 1)]?.id,
      startOffset: offset,
      duration,
      actualStartOffset: faker.helpers.maybe(() => offset + faker.number.int({ min: -1, max: 1 }), {
        probability: 0.6,
      }),
      actualDuration: faker.helpers.maybe(() => duration + faker.number.int({ min: -1, max: 2 }), {
        probability: 0.5,
      }),
      status: statusPool[faker.number.int({ min: 0, max: 3 })],
      assignee: faker.helpers.arrayElement(assignees),
      milestone,
    });

    offset += duration + faker.number.int({ min: 0, max: 1 });
  }

  return tasks;
}

export function createProjects(count = 5): Project[] {
  const projects: Project[] = [];
  const statuses: Project['status'][] = ['planning', 'in_progress', 'delayed', 'completed'];

  for (let i = 0; i < count; i++) {
    const startDate = faker.date.recent({ days: 120 });
    const totalDays = faker.number.int({ min: 60, max: 150 });
    const endDate = new Date(startDate.getTime() + totalDays * 24 * 60 * 60 * 1000);

    projects.push({
      id: `project-${String(i + 1).padStart(3, '0')}`,
      name: `${faker.location.city()}${faker.person.lastName()}宅装修工程`,
      ownerId: `user-owner-00${faker.number.int({ min: 1, max: 2 })}`,
      companyId: `company-${String(faker.number.int({ min: 1, max: 6 })).padStart(3, '0')}`,
      address: `${faker.location.streetAddress()}`,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      actualStartDate: faker.helpers.maybe(() => startDate.toISOString(), { probability: 0.7 }),
      actualEndDate: faker.helpers.maybe(
        () => new Date(endDate.getTime() + faker.number.int({ min: -5, max: 15 }) * 24 * 60 * 60 * 1000).toISOString(),
        { probability: 0.3 }
      ),
      status: statuses[i % statuses.length],
      tasks: createTasks(`project-${i + 1}`),
    });
  }

  return projects;
}

export function createSKUs(count = 200): MaterialSKU[] {
  const skus: MaterialSKU[] = [];

  const materialConfig: {
    cat: MaterialSKU['materialCategory'];
    categoryName: string;
    subCategories: string[];
    brands: string[];
    units: string[];
  }[] = [
    {
      cat: 'floor',
      categoryName: '地板',
      subCategories: ['实木地板', '复合地板', '强化地板', '竹地板'],
      brands: ['圣象', '大自然', '德尔', '生活家', '菲林格尔'],
      units: ['㎡'],
    },
    {
      cat: 'wall',
      categoryName: '墙纸墙布',
      subCategories: ['PVC墙纸', '无纺布墙纸', '墙布', '硅藻泥'],
      brands: ['玉兰', '欧雅', '瑞宝', '柔然', '格莱美'],
      units: ['卷', '㎡'],
    },
    {
      cat: 'tile',
      categoryName: '瓷砖',
      subCategories: ['抛光砖', '仿古砖', '大理石砖', '马赛克', '通体砖'],
      brands: ['东鹏', '马可波罗', '诺贝尔', '冠珠', '蒙娜丽莎'],
      units: ['片', '㎡'],
    },
    {
      cat: 'cabinet',
      categoryName: '橱柜',
      subCategories: ['地柜', '吊柜', '台面', '五金配件'],
      brands: ['欧派', '索菲亚', '尚品宅配', '志邦', '我乐'],
      units: ['延米', '套'],
    },
    {
      cat: 'door',
      categoryName: '门',
      subCategories: ['实木门', '复合门', '卫生间门', '防盗门'],
      brands: ['TATA', '梦天', '美心', '盼盼', '王力'],
      units: ['樘'],
    },
    {
      cat: 'bath',
      categoryName: '卫浴',
      subCategories: ['马桶', '洗手盆', '花洒', '浴缸', '淋浴房'],
      brands: ['TOTO', '科勒', '九牧', '箭牌', '恒洁'],
      units: ['个', '套'],
    },
    {
      cat: 'lamp',
      categoryName: '灯具',
      subCategories: ['吸顶灯', '吊灯', '壁灯', '筒灯', '射灯'],
      brands: ['欧普', '雷士', '飞利浦', '松下', '三雄极光'],
      units: ['个', '套'],
    },
    {
      cat: 'other',
      categoryName: '其他',
      subCategories: ['五金件', '开关插座', '胶水辅料', '防水卷材'],
      brands: ['公牛', '西门子', '施耐德', '东方雨虹', '德高'],
      units: ['个', '盒', '卷', '桶'],
    },
  ];

  for (let i = 0; i < count; i++) {
    const config = materialConfig[i % materialConfig.length];
    const sub = config.subCategories[i % config.subCategories.length];

    skus.push({
      id: `sku-${String(i + 1).padStart(3, '0')}`,
      skuCode: `SKU${config.cat.toUpperCase().slice(0, 2)}${String(i + 1).padStart(5, '0')}`,
      name: `${faker.helpers.arrayElement(config.brands)} ${sub} ${faker.helpers.arrayElement(['经典款', '豪华款', '经济款', '时尚款'])}`,
      category: config.categoryName,
      subCategory: sub,
      brand: faker.helpers.arrayElement(config.brands),
      spec: `${faker.number.int({ min: 800, max: 2400 })}×${faker.number.int({ min: 100, max: 1200 })}×${faker.number.int({ min: 5, max: 50 })}mm`,
      unit: faker.helpers.arrayElement(config.units),
      price: faker.number.int({ min: 10, max: 5000 }),
      stock: faker.number.int({ min: 0, max: 1000 }),
      supplierId: `supplier-00${faker.number.int({ min: 1, max: 3 })}`,
      imageUrl: faker.image.urlLoremFlickr({ category: 'product', width: 400, height: 400 }) + `?lock=${i}`,
      materialCategory: config.cat,
      applicableStyle: faker.helpers.arrayElements(DESIGN_STYLES, { min: 2, max: 5 }),
    });
  }

  return skus;
}

export function createSupplierConfigs(): SupplierAPIConfig[] {
  const names = ['东方建材供应链', '家居优品直供平台', '全球家居集采中心'];
  return names.map((name, i) => ({
    id: `supplier-00${i + 1}`,
    supplierName: name,
    apiEndpoint: `https://api.supplier${i + 1}.example.com/v1`,
    apiKey: faker.string.alphanumeric(32),
    syncInterval: faker.number.int({ min: 15, max: 120 }),
    lastSyncAt: faker.date.recent({ days: 7 }).toISOString(),
  }));
}

function createStatement(): Statement {
  return {
    content: faker.lorem.sentences({ min: 3, max: 6 }),
    images: Array.from({ length: faker.number.int({ min: 2, max: 5 }) }, () =>
      faker.image.urlLoremFlickr({ category: 'evidence', width: 600, height: 400 })
    ),
    submittedAt: faker.date.recent({ days: 30 }).toISOString(),
  };
}

function createEvidences(caseId: string): Evidence[] {
  const count = faker.number.int({ min: 3, max: 8 });
  return Array.from({ length: count }, (_, i) => ({
    id: `evidence-${caseId}-${i}`,
    submittedBy: faker.helpers.arrayElement(['owner', 'company', 'mediator'] as const),
    type: faker.helpers.arrayElement(['image', 'document', 'contract', 'video'] as const),
    url: faker.image.urlLoremFlickr({ category: 'document', width: 800, height: 600 }),
    description: faker.lorem.sentences({ min: 1, max: 2 }),
    uploadedAt: faker.date.recent({ days: 45 }).toISOString(),
  }));
}

function createMediationLogs(caseId: string): MediationLog[] {
  const count = faker.number.int({ min: 2, max: 6 });
  const actions: MediationLog['action'][] = ['note', 'proposal', 'meeting', 'escalate'];
  const logs: MediationLog[] = [];
  for (let i = 0; i < count; i++) {
    logs.push({
      id: `mediation-${caseId}-${i}`,
      mediatorId: 'user-admin-001',
      mediatorName: '王调解员',
      action: actions[i % actions.length],
      content: faker.lorem.sentences({ min: 2, max: 4 }),
      createdAt: faker.date.recent({ days: 20 - i * 3 }).toISOString(),
    });
  }
  return logs;
}

export function createDisputes(count = 4): DisputeCase[] {
  const statuses: DisputeCase['status'][] = ['new', 'mediating', 'arbitrating', 'closed'];
  const categories: DisputeCase['category'][] = ['quality', 'schedule', 'price', 'material', 'service', 'other'];
  const titles = [
    '瓷砖大面积空鼓脱落争议',
    '工期延误45天索赔纠纷',
    '材料品牌与合同不符',
    '增项费用超额争议',
  ];

  return statuses.slice(0, count).map((status, i) => {
    const caseId = `dispute-${String(i + 1).padStart(3, '0')}`;
    const caseNumber = `JF${new Date().getFullYear()}${String(i + 1).padStart(6, '0')}`;

    const result: DisputeCase = {
      id: caseId,
      caseNumber,
      projectId: `project-${String(i + 1).padStart(3, '0')}`,
      ownerId: `user-owner-00${faker.number.int({ min: 1, max: 2 })}`,
      companyId: `company-${String(faker.number.int({ min: 1, max: 6 })).padStart(3, '0')}`,
      title: titles[i % titles.length],
      category: categories[i % categories.length],
      status,
      ownerStatement: createStatement(),
      companyStatement: createStatement(),
      evidences: createEvidences(caseId),
      mediationLogs: createMediationLogs(caseId),
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
    };

    if (status === 'closed') {
      result.arbitrationResult = {
        expertIds: ['user-expert-001', 'user-expert-002'],
        conclusion: faker.lorem.sentences({ min: 2, max: 4 }),
        decision: faker.helpers.arrayElement([
          '装修公司赔偿业主20000元',
          '双方各承担50%责任',
          '业主诉求部分支持',
          '装修公司限期整改完毕',
        ]),
        issuedAt: faker.date.recent({ days: 5 }).toISOString(),
        accepted: faker.helpers.arrayElement([true, true, false]),
      };
    }

    return result;
  });
}

export function createAppointments(count = 6): MeasurementAppointment[] {
  const statuses: MeasurementAppointment['status'][] = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'completed'];
  const appointments: MeasurementAppointment[] = [];

  for (let i = 0; i < count; i++) {
    const status = statuses[i % statuses.length];
    const appointmentId = `appointment-${String(i + 1).padStart(3, '0')}`;
    const ownerId = `user-owner-00${(i % 2) + 1}`;

    const appointment: MeasurementAppointment = {
      id: appointmentId,
      ownerId,
      companyId: `company-${String((i % 6) + 1).padStart(3, '0')}`,
      address: `${faker.location.city()}${faker.location.streetAddress()}`,
      contactName: faker.helpers.arrayElement(['张先生', '李女士', '王小姐', '赵先生']),
      contactPhone: `138${faker.string.numeric(8)}`,
      scheduledTime: faker.date.soon({ days: 30, refDate: faker.date.recent({ days: 10 }) }).toISOString(),
      status,
      remark: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.4 }),
    };

    if (status === 'completed' || status === 'in_progress') {
      appointment.record = createMeasurementRecord(ownerId);
    }

    appointments.push(appointment);
  }

  return appointments;
}

function createMeasurementRecord(measuredBy: string): MeasurementRecord {
  return {
    area: faker.number.float({ min: 60, max: 180, fractionDigits: 1 }),
    rooms: createRooms(faker.number.int({ min: 3, max: 6 })),
    photos: Array.from({ length: 6 }, () =>
      faker.image.urlLoremFlickr({ category: 'house', width: 800, height: 600 })
    ),
    notes: faker.lorem.sentences({ min: 2, max: 4 }),
    measuredBy,
    measuredAt: faker.date.recent({ days: 5 }).toISOString(),
  };
}

function createWalls(roomWidth: number, roomLength: number): WallConfig[] {
  const positions: WallConfig['position'][] = ['north', 'south', 'east', 'west'];
  const wallWidths = [roomWidth, roomWidth, roomLength, roomLength];

  return positions.map((pos, i) => {
    const width = wallWidths[i];
    const hasOpening = faker.helpers.maybe(() => true, { probability: 0.6 });

    return {
      id: `wall-${pos}-${faker.string.uuid().slice(0, 8)}`,
      position: pos,
      width,
      openings: hasOpening
        ? [
            {
              type: pos === 'north' || pos === 'south' ? 'window' : 'door',
              width: faker.number.float({ min: 0.8, max: 2.4, fractionDigits: 1 }),
              height: faker.number.float({ min: 1.5, max: 2.4, fractionDigits: 1 }),
              offsetFromLeft: faker.number.float({ min: 0.2, max: width - 1, fractionDigits: 1 }),
            },
          ]
        : [],
    };
  });
}

function createRooms(count: number): RoomConfig[] {
  const rooms: RoomConfig[] = [];
  const usedTypes = new Set<RoomConfig['type']>();
  const typePriority: RoomConfig['type'][] = ['living', 'bedroom', 'bedroom', 'kitchen', 'bathroom', 'dining', 'balcony'];

  for (let i = 0; i < count; i++) {
    const type = typePriority[i % typePriority.length];
    const names = ROOM_NAMES[type];
    const nameIndex = i < names.length ? i : i - Math.floor(i / names.length) * names.length;

    const roomWidth = faker.number.float({ min: 2.4, max: 6, fractionDigits: 1 });
    const roomLength = faker.number.float({ min: 2.4, max: 8, fractionDigits: 1 });

    rooms.push({
      id: `room-${faker.string.uuid().slice(0, 8)}`,
      type,
      name: type === 'bedroom' && usedTypes.has(type) ? names[1] : names[nameIndex % names.length],
      width: roomWidth,
      length: roomLength,
      height: faker.helpers.arrayElement([2.7, 2.8, 2.9, 3.0]),
      walls: createWalls(roomWidth, roomLength),
    });
    usedTypes.add(type);
  }

  return rooms;
}

export function create3DPlans(ownerId: string): DesignPlan3D[] {
  const planStyles: DesignStyle[] = ['modern', 'nordic', 'chinese'];
  const tiers: DesignPlan3D['budgetTier'][] = ['economy', 'quality', 'luxury'];
  const planNames = ['现代简约三居室', '北欧温馨两居室', '新中式四居室'];

  return planStyles.map((style, i) => {
    const rooms = createRooms(faker.number.int({ min: 4, max: 6 }));
    const furnitureCount = faker.number.int({ min: 8, max: 20 });
    const furnitureItems: FurnitureItem[] = Array.from({ length: furnitureCount }, (_, j) => ({
      id: `furniture-${i}-${j}`,
      category: FURNITURE_CATEGORIES[j % FURNITURE_CATEGORIES.length],
      modelUrl: `/models/furniture/${style}-${j}.glb`,
      position: [
        faker.number.float({ min: -5, max: 5, fractionDigits: 2 }),
        faker.number.float({ min: 0, max: 1, fractionDigits: 2 }),
        faker.number.float({ min: -5, max: 5, fractionDigits: 2 }),
      ],
      rotation: [0, faker.number.float({ min: 0, max: Math.PI * 2, fractionDigits: 2 }), 0],
      scale: [
        faker.number.float({ min: 0.8, max: 1.2, fractionDigits: 2 }),
        faker.number.float({ min: 0.8, max: 1.2, fractionDigits: 2 }),
        faker.number.float({ min: 0.8, max: 1.2, fractionDigits: 2 }),
      ],
      materialId: `sku-${String(faker.number.int({ min: 1, max: 200 })).padStart(3, '0')}`,
    }));

    return {
      id: `3dplan-${String(i + 1).padStart(3, '0')}`,
      name: planNames[i],
      ownerId,
      floorPlanUrl: faker.image.urlLoremFlickr({ category: 'floorplan', width: 1200, height: 800 }),
      rooms,
      style,
      budgetTier: tiers[i],
      totalBudget: [80000, 150000, 300000][i],
      furnitureItems,
      createdAt: faker.date.past({ years: 1 }).toISOString(),
    };
  });
}

export function createQuotes(): DecorationQuote[] {
  const cities = ['北京', '上海', '广州'];
  const areas = [80, 120, 160];
  const houseTypes = ['两室一厅', '三室两厅', '四室两厅'];
  const craftLevels: DecorationQuote['craftLevel'][] = ['basic', 'standard', 'premium'];
  const tiers: DecorationQuote['tier'][] = ['economy', 'quality', 'luxury'];

  const quotes: DecorationQuote[] = [];

  for (const city of cities) {
    for (let i = 0; i < areas.length; i++) {
      for (let j = 0; j < tiers.length; j++) {
        const items = createQuoteItems(areas[i], tiers[j]);
        const mainMaterialTotal = items
          .filter((it) => it.category === 'main_material')
          .reduce((s, it) => s + it.unitPrice * it.quantity, 0);
        const auxMaterialTotal = items
          .filter((it) => it.category === 'aux_material')
          .reduce((s, it) => s + it.unitPrice * it.quantity, 0);
        const laborTotal = items
          .filter((it) => it.category === 'labor')
          .reduce((s, it) => s + it.unitPrice * it.quantity, 0);
        const designTotal = items
          .filter((it) => it.category === 'design')
          .reduce((s, it) => s + it.unitPrice * it.quantity, 0);
        const managementTotal = items
          .filter((it) => it.category === 'management')
          .reduce((s, it) => s + it.unitPrice * it.quantity, 0);

        quotes.push({
          id: `quote-${city}-${areas[i]}-${tiers[j]}`,
          planName: `${houseTypes[i]}${tiers[j] === 'economy' ? '经济型' : tiers[j] === 'quality' ? '品质型' : '豪华型'}套餐`,
          city,
          area: areas[i],
          houseType: houseTypes[i],
          craftLevel: craftLevels[j],
          tier: tiers[j],
          items,
          totalPrice: mainMaterialTotal + auxMaterialTotal + laborTotal + designTotal + managementTotal,
          mainMaterialTotal,
          auxMaterialTotal,
          laborTotal,
          designTotal,
          managementTotal,
          generatedAt: new Date(Date.now() - 180 * 86400000).toISOString(),
        });
      }
    }
  }

  return quotes;
}

function createQuoteItems(area: number, tier: DecorationQuote['tier']): QuoteItem[] {
  const multiplier = tier === 'economy' ? 0.8 : tier === 'quality' ? 1 : 1.5;
  const baseItems: Omit<QuoteItem, 'quantity' | 'unitPrice'>[] = [
    { category: 'main_material', subCategory: '地板', name: '实木复合地板', unit: '㎡', brand: '圣象', spec: '1215×165×15mm' },
    { category: 'main_material', subCategory: '瓷砖', name: '客厅抛光砖', unit: '㎡', brand: '东鹏', spec: '800×800mm' },
    { category: 'main_material', subCategory: '瓷砖', name: '厨房墙砖', unit: '㎡', brand: '马可波罗', spec: '300×600mm' },
    { category: 'main_material', subCategory: '瓷砖', name: '卫生间地砖', unit: '㎡', brand: '诺贝尔', spec: '300×300mm' },
    { category: 'main_material', subCategory: '橱柜', name: '定制地柜', unit: '延米', brand: '欧派', spec: '石英石台面' },
    { category: 'main_material', subCategory: '橱柜', name: '定制吊柜', unit: '延米', brand: '欧派', spec: '吸塑门板' },
    { category: 'main_material', subCategory: '门', name: '实木复合门', unit: '樘', brand: 'TATA', spec: '2000×900mm' },
    { category: 'main_material', subCategory: '卫浴', name: '马桶', unit: '个', brand: 'TOTO', spec: '虹吸式' },
    { category: 'main_material', subCategory: '卫浴', name: '花洒套装', unit: '套', brand: '科勒', spec: '恒温' },
    { category: 'main_material', subCategory: '灯具', name: '客餐厅吊灯', unit: '个', brand: '欧普' },
    { category: 'aux_material', subCategory: '水电', name: 'PPR水管', unit: 'm', brand: '伟星' },
    { category: 'aux_material', subCategory: '水电', name: '电线电缆', unit: 'm', brand: '远东' },
    { category: 'aux_material', subCategory: '泥工', name: '水泥河沙', unit: '㎡', brand: '海螺' },
    { category: 'aux_material', subCategory: '木工', name: '板材龙骨', unit: '㎡', brand: '兔宝宝' },
    { category: 'aux_material', subCategory: '油漆', name: '乳胶漆', unit: '桶', brand: '立邦' },
    { category: 'labor', subCategory: '水电', name: '水电改造人工费', unit: '㎡' },
    { category: 'labor', subCategory: '泥工', name: '瓷砖铺贴人工费', unit: '㎡' },
    { category: 'labor', subCategory: '木工', name: '吊顶柜体人工费', unit: '㎡' },
    { category: 'labor', subCategory: '油漆', name: '墙面粉刷人工费', unit: '㎡' },
    { category: 'labor', subCategory: '安装', name: '灯具洁具安装', unit: '项' },
    { category: 'design', subCategory: '设计', name: '平面方案设计', unit: '项' },
    { category: 'design', subCategory: '设计', name: '效果图制作', unit: '张' },
    { category: 'design', subCategory: '设计', name: '施工图纸', unit: '套' },
    { category: 'management', subCategory: '管理', name: '项目管理费', unit: '项' },
    { category: 'management', subCategory: '管理', name: '垃圾清运费', unit: '项' },
    { category: 'management', subCategory: '管理', name: '成品保护费', unit: '项' },
  ];

  return baseItems.map((item) => {
    let quantity = 1;
    if (item.unit === '㎡') quantity = area * (faker.number.float({ min: 0.5, max: 2.5, fractionDigits: 1 }));
    else if (item.unit === 'm') quantity = area * faker.number.float({ min: 1, max: 4, fractionDigits: 1 });
    else if (item.unit === '延米') quantity = faker.number.float({ min: 2, max: 6, fractionDigits: 1 });
    else if (item.subCategory === '门') quantity = faker.number.int({ min: 3, max: 6 });
    else if (item.unit === '张') quantity = faker.number.int({ min: 3, max: 10 });
    else if (item.unit === '套') quantity = 1;
    else if (item.unit === '樘') quantity = faker.number.int({ min: 3, max: 6 });

    const baseUnitPrices: Record<string, number> = {
      '实木复合地板': 260,
      '客厅抛光砖': 180,
      '厨房墙砖': 120,
      '卫生间地砖': 90,
      '定制地柜': 2200,
      '定制吊柜': 1200,
      '实木复合门': 2800,
      '马桶': 3500,
      '花洒套装': 2500,
      '客餐厅吊灯': 1800,
      'PPR水管': 45,
      '电线电缆': 8,
      '水泥河沙': 65,
      '板材龙骨': 180,
      '乳胶漆': 680,
      '水电改造人工费': 95,
      '瓷砖铺贴人工费': 75,
      '吊顶柜体人工费': 160,
      '墙面粉刷人工费': 55,
      '灯具洁具安装': 1500,
      '平面方案设计': 3000,
      '效果图制作': 800,
      '施工图纸': 2000,
      '项目管理费': 5000,
      '垃圾清运费': 800,
      '成品保护费': 600,
    };

    return {
      ...item,
      quantity: Math.round(quantity * 100) / 100,
      unitPrice: Math.round((baseUnitPrices[item.name] || 100) * multiplier),
      remark: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.2 }),
    };
  });
}

export function createComparisonPlans(companies: DecorationCompany[]): ComparisonPlan[] {
  const warranties: WarrantyTerm[] = [
    { item: '水电工程', durationMonths: 60, description: '水管、电路质保5年，非人为损坏免费维修' },
    { item: '防水工程', durationMonths: 60, description: '厨卫防水质保5年，渗漏免费返工' },
    { item: '基础装修', durationMonths: 24, description: '墙地砖、吊顶、油漆等质保2年' },
    { item: '定制家具', durationMonths: 36, description: '橱柜、衣柜等定制家具质保3年' },
  ];

  return companies.slice(0, 3).map((company, i) => ({
    id: `compare-plan-${i + 1}`,
    companyId: company.id,
    companyName: company.name,
    planName: `${faker.helpers.arrayElement(['全包整装', '精装套餐', '品质定制'])}方案`,
    totalPrice: faker.number.int({ min: 120000, max: 450000 }),
    constructionPeriod: faker.number.int({ min: 60, max: 120 }),
    materials: [
      { name: '地板', brand: faker.helpers.arrayElement(['圣象', '大自然']), spec: '15mm厚', quantity: 80, unitPrice: 260 },
      { name: '瓷砖', brand: faker.helpers.arrayElement(['东鹏', '马可波罗']), spec: '800×800', quantity: 60, unitPrice: 180 },
      { name: '橱柜', brand: faker.helpers.arrayElement(['欧派', '索菲亚']), spec: '石英石台面', quantity: 5, unitPrice: 2200 },
      { name: '卫浴', brand: faker.helpers.arrayElement(['TOTO', '科勒']), spec: '全套', quantity: 1, unitPrice: 15000 },
    ],
    warrantyTerms: warranties,
    highlights: faker.helpers.arrayElements(
      ['零增项承诺', '十年超长质保', '环保E0级材料', '自有施工队', '3D全景放样', '管家式服务', '分期付款零利息'],
      { min: 3, max: 5 }
    ),
  }));
}
