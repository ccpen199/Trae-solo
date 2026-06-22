// ============================================================
// Mock Data Factory
// 注意：所有字段必须与MongoDB Schema + 前端 DECORATION_STYLES 完全对齐
// ============================================================

export const MOCK_USERS: any[] = [
  {
    _id: 'demo-admin-001',
    username: 'admin',
    email: 'admin@deco.com',
    phone: '13800000000',
    role: 'admin',
    nickname: '平台管理员',
    avatar: '',
    bio: '平台官方管理员账号',
    designerStatus: 'approved',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    _id: 'demo-homeowner-001',
    username: 'homeowner1',
    email: 'owner1@deco.com',
    phone: '13800000001',
    role: 'homeowner',
    nickname: '阳光暖暖',
    avatar: '',
    bio: '新房装修中，坐标上海浦东，120平三房两厅，预算30万',
    preferences: {
      styleTags: ['北欧风格', '现代简约'],
      budgetRange: { min: 200000, max: 400000 },
      materials: ['木饰面', '乳胶漆', '岩板']
    },
    createdAt: '2024-01-15T00:00:00.000Z',
    updatedAt: '2024-01-15T00:00:00.000Z'
  },
  {
    _id: 'demo-homeowner-002',
    username: 'homeowner2',
    email: 'owner2@deco.com',
    phone: '13800000002',
    role: 'homeowner',
    nickname: '山间清风',
    avatar: '',
    bio: '二手房翻新爱好者',
    preferences: {
      styleTags: ['新中式', '日式极简'],
      budgetRange: { min: 150000, max: 250000 },
      materials: ['木饰面', '大理石']
    },
    createdAt: '2024-02-01T00:00:00.000Z',
    updatedAt: '2024-02-01T00:00:00.000Z'
  },
  {
    _id: 'demo-designer-001',
    username: 'designer1',
    email: 'designer1@deco.com',
    phone: '13900000001',
    role: 'designer',
    nickname: '李 · 空间美学',
    avatar: '',
    bio: '10年室内设计经验，擅长北欧/日式风格。毕业于中央美术学院，曾获多项设计大奖。',
    designerStatus: 'approved',
    serviceAreas: ['上海市', '杭州市', '苏州市'],
    serviceRadius: 200,
    credentials: {
      licenseNumber: 'CN-ID-2015-88372',
      certificationType: '国家高级室内设计师',
      issuingAuthority: '中国建筑装饰协会',
      issueDate: '2015-06-01T00:00:00.000Z',
      certificationImages: [],
      verifiedAt: '2023-06-01T00:00:00.000Z'
    },
    qualifications: {
      licenseNumber: 'CN-ID-2015-88372',
      certificationImages: [],
      verifiedAt: '2023-06-01T00:00:00.000Z'
    },
    portfolio: [
      {
        title: '浦东 120㎡ 北欧风三居室',
        description: '全屋定制北欧风设计，温馨舒适，浅色系搭配原木质感，打造自然温暖的家居氛围',
        images: [],
        style: '北欧风格',
        houseType: 'apartment',
        houseArea: 120,
        budgetRange: { min: 250000, max: 400000 }
      },
      {
        title: '静安 89㎡ 日式小户型',
        description: '收纳最大化，多功能空间设计，榻榻米+步入式衣柜',
        images: [],
        style: '日式极简',
        houseType: 'apartment',
        houseArea: 89,
        budgetRange: { min: 150000, max: 250000 }
      },
      {
        title: '徐汇 156㎡ 轻奢大平层',
        description: '精致轻奢，品质生活，金属线条+大理石+皮质家具',
        images: [],
        style: '轻奢风格',
        houseType: 'apartment',
        houseArea: 156,
        budgetRange: { min: 500000, max: 1000000 }
      }
    ],
    statistics: {
      completedProjects: 58,
      rating: 4.8,
      reviewCount: 42,
      avgResponseTime: '2小时内',
      yearsOfExperience: 10
    },
    createdAt: '2023-06-01T00:00:00.000Z',
    updatedAt: '2024-03-01T00:00:00.000Z'
  },
  {
    _id: 'demo-designer-002',
    username: 'designer2',
    email: 'designer2@deco.com',
    phone: '13900000002',
    role: 'designer',
    nickname: '王工工作室',
    avatar: '',
    bio: '8年设计经验，专注新中式设计，传统与现代融合，榫卯工艺爱好者',
    designerStatus: 'approved',
    serviceAreas: ['北京市', '上海市', '南京市'],
    serviceRadius: 300,
    credentials: {
      licenseNumber: 'CN-ID-2016-33291',
      certificationType: '注册室内建筑师',
      issuingAuthority: '全国建筑设计师注册中心',
      issueDate: '2016-06-15T00:00:00.000Z',
      certificationImages: [],
      verifiedAt: '2023-06-15T00:00:00.000Z'
    },
    qualifications: {
      licenseNumber: 'CN-ID-2016-33291',
      certificationImages: [],
      verifiedAt: '2023-06-15T00:00:00.000Z'
    },
    portfolio: [
      {
        title: '北京朝阳 156㎡ 新中式四房',
        description: '典雅大气新中式设计，实木家具+水墨画+宫灯',
        images: [],
        style: '新中式',
        houseType: 'apartment',
        houseArea: 156,
        budgetRange: { min: 400000, max: 800000 }
      },
      {
        title: '北京海淀 220㎡ 新中式别墅',
        description: '四合院灵感，庭院+茶室+书房一体化',
        images: [],
        style: '新中式',
        houseType: 'villa',
        houseArea: 220,
        budgetRange: { min: 1000000, max: 2000000 }
      }
    ],
    statistics: {
      completedProjects: 37,
      rating: 4.7,
      reviewCount: 31,
      avgResponseTime: '4小时内',
      yearsOfExperience: 8
    },
    createdAt: '2023-07-10T00:00:00.000Z',
    updatedAt: '2024-03-05T00:00:00.000Z'
  },
  {
    _id: 'demo-designer-003',
    username: 'designer3',
    email: 'designer3@deco.com',
    phone: '13900000003',
    role: 'designer',
    nickname: 'Zhang · 北欧研究所',
    avatar: '',
    bio: '海归设计师，专注北欧/轻奢风格，米兰理工硕士，曾在芬兰工作3年',
    designerStatus: 'approved',
    serviceAreas: ['上海市', '深圳市', '广州市'],
    serviceRadius: 500,
    credentials: {
      licenseNumber: 'CN-ID-2017-55621',
      certificationType: '意大利注册设计师',
      issuingAuthority: 'Politecnico di Milano',
      issueDate: '2017-08-20T00:00:00.000Z',
      certificationImages: [],
      verifiedAt: '2023-08-20T00:00:00.000Z'
    },
    qualifications: {
      licenseNumber: 'CN-ID-2017-55621',
      certificationImages: [],
      verifiedAt: '2023-08-20T00:00:00.000Z'
    },
    portfolio: [
      {
        title: '深圳南山 96㎡ 轻奢三居',
        description: '精致生活品质感，黄铜+大理石+莫兰迪色系',
        images: [],
        style: '轻奢风格',
        houseType: 'apartment',
        houseArea: 96,
        budgetRange: { min: 300000, max: 600000 }
      },
      {
        title: '广州天河 110㎡ 北欧三居',
        description: '纯白基底+原木+绿植，极简北欧风',
        images: [],
        style: '北欧风格',
        houseType: 'apartment',
        houseArea: 110,
        budgetRange: { min: 280000, max: 450000 }
      }
    ],
    statistics: {
      completedProjects: 29,
      rating: 4.9,
      reviewCount: 26,
      avgResponseTime: '1小时内',
      yearsOfExperience: 6
    },
    createdAt: '2023-09-01T00:00:00.000Z',
    updatedAt: '2024-03-10T00:00:00.000Z'
  },
  {
    _id: 'demo-designer-004',
    username: 'designer4',
    email: 'designer4@deco.com',
    phone: '13900000004',
    role: 'designer',
    nickname: 'Luna · 日式小筑',
    avatar: '',
    bio: '日式原木风专家，5年专注，温暖治愈系，擅长小户型收纳设计',
    designerStatus: 'approved',
    serviceAreas: ['上海市', '杭州市', '成都市'],
    serviceRadius: 150,
    credentials: {
      licenseNumber: 'CN-ID-2018-99123',
      certificationType: '中级室内设计师',
      issuingAuthority: '上海市装饰装修行业协会',
      issueDate: '2018-10-10T00:00:00.000Z',
      certificationImages: [],
      verifiedAt: '2023-10-10T00:00:00.000Z'
    },
    qualifications: {
      licenseNumber: 'CN-ID-2018-99123',
      certificationImages: [],
      verifiedAt: '2023-10-10T00:00:00.000Z'
    },
    portfolio: [
      {
        title: '杭州西湖 75㎡ 日式两居',
        description: '小空间大智慧，全屋收纳系统+榻榻米多功能房',
        images: [],
        style: '日式极简',
        houseType: 'apartment',
        houseArea: 75,
        budgetRange: { min: 120000, max: 200000 }
      },
      {
        title: '成都青羊 65㎡ 原木一居',
        description: '独居女孩的治愈小窝，原木+藤编+暖光',
        images: [],
        style: '日式极简',
        houseType: 'apartment',
        houseArea: 65,
        budgetRange: { min: 100000, max: 180000 }
      }
    ],
    statistics: {
      completedProjects: 21,
      rating: 4.6,
      reviewCount: 18,
      avgResponseTime: '3小时内',
      yearsOfExperience: 5
    },
    createdAt: '2023-10-15T00:00:00.000Z',
    updatedAt: '2024-03-12T00:00:00.000Z'
  }
];

// ============================================================
// MOCK_DIARIES
// 字段对齐：Diary Schema + 前端 DECORATION_STYLES 完整列表
// 覆盖：北欧风格、地中海、日式极简、新中式、现代简约、轻奢风格、美式风格
// 覆盖：全部7个施工阶段 planning → acceptance
// ============================================================
const STAGES = ['planning', 'demolition', 'plumbing_electrical', 'masonry_carpentry', 'painting', 'installation', 'acceptance'];
const STAGE_LABELS: Record<string, string> = {
  planning: '方案设计', demolition: '拆改阶段', plumbing_electrical: '水电阶段',
  masonry_carpentry: '泥木阶段', painting: '油漆阶段', installation: '安装阶段', acceptance: '竣工验收'
};
const DEFAULT_BUDGET_ITEMS = [
  { category: '设计费', description: '设计师全程跟进', estimatedAmount: 15000 },
  { category: '水电改造', description: '全屋水电重新排布', estimatedAmount: 35000 },
  { category: '瓷砖地板', description: '客厅卧室厨卫墙地砖', estimatedAmount: 45000 },
  { category: '木作定制', description: '衣柜鞋柜书柜', estimatedAmount: 60000 },
  { category: '乳胶漆', description: '全屋墙面', estimatedAmount: 18000 },
  { category: '卫浴洁具', description: '马桶台盆龙头', estimatedAmount: 25000 },
  { category: '门窗', description: '断桥铝窗户', estimatedAmount: 30000 },
  { category: '家具家电', description: '沙发床餐桌', estimatedAmount: 60000 }
];
const makeStageHistory = (currentStageIdx: number) => {
  return STAGES.slice(0, currentStageIdx + 1).map((s, i) => ({
    stage: s,
    startedAt: `2026-0${i + 1}-01T00:00:00.000Z`,
    completedAt: i < currentStageIdx ? `2026-0${i + 1}-2${i}T00:00:00.000Z` : undefined,
    description: `${STAGE_LABELS[s]}${i < currentStageIdx ? '已完成' : '进行中'}`
  }));
};

export const MOCK_DIARIES: any[] = [
  // 1. 北欧风格 - 安装阶段
  {
    _id: 'demo-diary-001',
    userId: MOCK_USERS[1],
    title: '浦东120平三房·北欧风装修日记',
    description: '记录120平三房完整装修过程，从拆旧到验收全流程，每一步都是心血。白墙+原木+绿植，打造清新北欧风。',
    coverImage: '',
    constructionStage: 'installation',
    houseType: 'apartment',
    houseArea: 120,
    stageHistory: makeStageHistory(5),
    address: { city: '上海市', district: '浦东新区', detail: '张江路888弄' },
    budget: {
      totalEstimated: 350000,
      totalActual: 247000,
      items: DEFAULT_BUDGET_ITEMS.map((it, i) => ({ ...it, actualAmount: i < 5 ? it.estimatedAmount : undefined }))
    },
    styleTags: ['北欧风格', '现代简约'],
    materialTags: ['木饰面', '乳胶漆', '岩板'],
    aiAnalysis: {
      style: { primary: '北欧风格', confidence: 0.92, secondary: ['日式极简', '现代简约'] },
      materials: [
        { name: '木饰面', category: '墙面', confidence: 0.95, location: '客厅卧室' },
        { name: '乳胶漆', category: '墙面', confidence: 0.88, location: '全屋' },
        { name: '岩板', category: '台面', confidence: 0.75, location: '厨房' }
      ],
      brands: [
        { name: '宜家 IKEA', product: '家具', confidence: 0.8 },
        { name: '索菲亚', product: '定制柜', confidence: 0.7 }
      ],
      colors: ['#F5F5DC', '#D2B48C', '#87CEEB', '#FFFFFF'],
      spatialTags: ['客厅', '卧室', '厨房', '卫浴'],
      analyzedAt: '2026-05-25T10:00:00.000Z'
    },
    likes: ['demo-homeowner-002'], likesCount: 2, views: 1256, shares: 5, commentCount: 3,
    comments: [
      { _id: 'c1', userId: MOCK_USERS[5], username: 'Zhang · 北欧研究所', userAvatar: '', content: '北欧风配这个户型非常合适！橱柜颜色很正', createdAt: '2026-05-22T10:00:00.000Z', likes: 2 }
    ],
    floorPlan: { metadata: { area: 120, rooms: 3, bathrooms: 2, floors: 18, layoutType: '三室两厅' } },
    images: [],
    isPublished: true,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-06-15T15:30:00.000Z'
  },
  // 2. 日式极简 - 油漆阶段
  {
    _id: 'demo-diary-002',
    userId: MOCK_USERS[2],
    title: '静安89㎡两房·日式小户型翻新',
    description: '二手房翻新全记录，收纳是最大需求，想要满满的日式原木感。',
    coverImage: '',
    constructionStage: 'painting',
    houseType: 'apartment',
    houseArea: 89,
    stageHistory: makeStageHistory(4),
    address: { city: '上海市', district: '静安区', detail: '南京西路' },
    budget: {
      totalEstimated: 220000, totalActual: 168000,
      items: [
        { category: '水电', description: '局部改造', estimatedAmount: 22000, actualAmount: 21000 },
        { category: '定制柜', description: '全屋收纳柜', estimatedAmount: 50000, actualAmount: 48000 },
        { category: '榻榻米', description: '多功能房', estimatedAmount: 25000, actualAmount: 24000 },
        { category: '地板', description: '实木复合地板', estimatedAmount: 28000, actualAmount: 27000 },
        { category: '乳胶漆', description: '全屋米白', estimatedAmount: 15000 }
      ]
    },
    styleTags: ['日式极简'],
    materialTags: ['木饰面', '实木地板'],
    aiAnalysis: {
      style: { primary: '日式极简', confidence: 0.88, secondary: ['北欧风格'] },
      materials: [
        { name: '木饰面', category: '全屋', confidence: 0.96, location: '全屋' },
        { name: '榻榻米', category: '家具', confidence: 0.85, location: '次卧' }
      ],
      brands: [
        { name: '无印良品 MUJI', product: '家具', confidence: 0.78 },
        { name: '林氏木业', product: '实木床', confidence: 0.65 }
      ],
      colors: ['#E8E4DF', '#C4A77D', '#FAF0E6'],
      spatialTags: ['客厅', '卧室', '多功能房'],
      analyzedAt: '2026-05-10T00:00:00.000Z'
    },
    likes: ['demo-homeowner-001'], likesCount: 1, views: 820, shares: 2, commentCount: 1,
    comments: [],
    floorPlan: { metadata: { area: 89, rooms: 2, bathrooms: 1, layoutType: '两室一厅' } },
    images: [],
    isPublished: true,
    createdAt: '2026-02-15T08:00:00.000Z',
    updatedAt: '2026-06-10T12:00:00.000Z'
  },
  // 3. 新中式 - 泥木阶段
  {
    _id: 'demo-diary-003',
    userId: MOCK_USERS[1],
    title: '北京朝阳156㎡·新中式大宅装修',
    description: '四房两厅大平层，新中式风格，爸妈喜欢的典雅范儿。实木家具+中式格栅+水墨画背景墙。',
    coverImage: '',
    constructionStage: 'masonry_carpentry',
    houseType: 'apartment',
    houseArea: 156,
    stageHistory: makeStageHistory(3),
    address: { city: '北京市', district: '朝阳区', detail: '建国路' },
    budget: {
      totalEstimated: 650000, totalActual: 208000,
      items: [
        { category: '水电', description: '全屋改造', estimatedAmount: 55000, actualAmount: 58000 },
        { category: '定制柜', description: '新中式木作', estimatedAmount: 150000, actualAmount: 150000 },
        { category: '瓷砖石材', description: '大理石地面', estimatedAmount: 80000 },
        { category: '木作背景墙', description: '中式格栅', estimatedAmount: 60000 }
      ]
    },
    styleTags: ['新中式'],
    materialTags: ['大理石', '木饰面', '护墙板'],
    aiAnalysis: {
      style: { primary: '新中式', confidence: 0.94, secondary: ['轻奢风格'] },
      materials: [
        { name: '大理石', category: '地面', confidence: 0.9, location: '客厅' },
        { name: '木饰面', category: '背景墙', confidence: 0.85, location: '客厅背景墙' },
        { name: '护墙板', category: '墙面', confidence: 0.78, location: '餐厅' }
      ],
      brands: [
        { name: '左右沙发', product: '家具', confidence: 0.75 },
        { name: '东鹏瓷砖', product: '大理石砖', confidence: 0.7 }
      ],
      colors: ['#8B4513', '#F5F5DC', '#C4A77D'],
      spatialTags: ['客厅', '餐厅', '主卧', '书房'],
      analyzedAt: '2026-04-01T00:00:00.000Z'
    },
    likes: [], likesCount: 0, views: 560, shares: 0, commentCount: 0, comments: [],
    floorPlan: { metadata: { area: 156, rooms: 4, bathrooms: 2, layoutType: '四室两厅' } },
    images: [],
    isPublished: true,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-05-20T12:00:00.000Z'
  },
  // 4. 地中海 - 竣工验收
  {
    _id: 'demo-diary-004',
    userId: MOCK_USERS[2],
    title: '厦门思明98㎡·地中海风情两居',
    description: '海边城市的浪漫蓝白梦，拱形门+马赛克+铁艺，把爱琴海搬回家。',
    coverImage: '',
    constructionStage: 'acceptance',
    houseType: 'apartment',
    houseArea: 98,
    stageHistory: makeStageHistory(6),
    address: { city: '厦门市', district: '思明区', detail: '环岛路' },
    budget: {
      totalEstimated: 280000, totalActual: 275000,
      items: DEFAULT_BUDGET_ITEMS.map(it => ({ ...it, actualAmount: it.estimatedAmount }))
    },
    styleTags: ['地中海', '美式风格'],
    materialTags: ['马赛克', '乳胶漆', '铁艺'],
    aiAnalysis: {
      style: { primary: '地中海', confidence: 0.9, secondary: ['美式风格'] },
      materials: [
        { name: '马赛克', category: '地面', confidence: 0.85, location: '厨卫' },
        { name: '乳胶漆', category: '墙面', confidence: 0.88, location: '全屋（蓝白配色）' }
      ],
      brands: [
        { name: '马可波罗', product: '马赛克砖', confidence: 0.72 },
        { name: '立邦', product: '乳胶漆', confidence: 0.8 }
      ],
      colors: ['#006994', '#40E0D0', '#FFFFFF', '#F5F5DC'],
      spatialTags: ['客厅', '厨房', '卫浴', '阳台'],
      analyzedAt: '2026-05-15T00:00:00.000Z'
    },
    likes: ['demo-homeowner-001'], likesCount: 3, views: 1980, shares: 12, commentCount: 5, comments: [],
    floorPlan: { metadata: { area: 98, rooms: 2, bathrooms: 2, layoutType: '两室两厅', hasSeaView: true } },
    images: [],
    isPublished: true,
    createdAt: '2025-12-01T10:00:00.000Z',
    updatedAt: '2026-06-18T12:00:00.000Z'
  },
  // 5. 现代简约 - 水电阶段
  {
    _id: 'demo-diary-005',
    userId: MOCK_USERS[1],
    title: '深圳南山110㎡·现代简约风',
    description: '极简是一种生活态度。黑白灰+无主灯设计+嵌入式收纳。',
    coverImage: '',
    constructionStage: 'plumbing_electrical',
    houseType: 'apartment',
    houseArea: 110,
    stageHistory: makeStageHistory(2),
    address: { city: '深圳市', district: '南山区', detail: '科技园' },
    budget: {
      totalEstimated: 420000, totalActual: 95000,
      items: [
        { category: '设计费', description: '无主灯灯光设计', estimatedAmount: 25000, actualAmount: 25000 },
        { category: '水电', description: '全屋智能水电', estimatedAmount: 70000, actualAmount: 70000 }
      ]
    },
    styleTags: ['现代简约', '轻奢风格'],
    materialTags: ['乳胶漆', '不锈钢', '玻璃'],
    aiAnalysis: {
      style: { primary: '现代简约', confidence: 0.92, secondary: ['轻奢风格'] },
      materials: [
        { name: '乳胶漆', category: '墙面', confidence: 0.9, location: '全屋（哑光白）' },
        { name: '不锈钢', category: '装饰', confidence: 0.75, location: '踢脚线' }
      ],
      brands: [
        { name: '飞利浦', product: '无主灯', confidence: 0.8 },
        { name: '西门子', product: '开关插座', confidence: 0.85 }
      ],
      colors: ['#FFFFFF', '#1A1A1A', '#808080'],
      spatialTags: ['客厅', '卧室', '书房'],
      analyzedAt: '2026-05-20T00:00:00.000Z'
    },
    likes: [], likesCount: 1, views: 720, shares: 3, commentCount: 0, comments: [],
    floorPlan: { metadata: { area: 110, rooms: 3, bathrooms: 2, layoutType: '三室两厅' } },
    images: [],
    isPublished: true,
    createdAt: '2026-04-15T10:00:00.000Z',
    updatedAt: '2026-06-12T12:00:00.000Z'
  },
  // 6. 轻奢风格 - 方案设计
  {
    _id: 'demo-diary-006',
    userId: MOCK_USERS[2],
    title: '杭州西湖145㎡·轻奢大平层装修',
    description: '品质生活从家开始。黄铜线条+大理石+皮质家具+水晶吊灯。',
    coverImage: '',
    constructionStage: 'planning',
    houseType: 'apartment',
    houseArea: 145,
    stageHistory: makeStageHistory(0),
    address: { city: '杭州市', district: '西湖区', detail: '文三路' },
    budget: {
      totalEstimated: 800000, totalActual: 50000,
      items: [
        { category: '设计费', description: '轻奢全案设计', estimatedAmount: 50000, actualAmount: 50000 }
      ]
    },
    styleTags: ['轻奢风格', '现代简约'],
    materialTags: ['大理石', '黄铜', '护墙板'],
    aiAnalysis: {
      style: { primary: '轻奢风格', confidence: 0.9, secondary: ['现代简约'] },
      materials: [
        { name: '大理石', category: '地面', confidence: 0.92, location: '客餐厅' },
        { name: '黄铜', category: '装饰线条', confidence: 0.8, location: '全屋' }
      ],
      brands: [
        { name: '诺贝尔', product: '大理石瓷砖', confidence: 0.78 },
        { name: '欧普', product: '水晶吊灯', confidence: 0.7 }
      ],
      colors: ['#FFD700', '#F5F5F5', '#1A1A1A', '#C0C0C0'],
      spatialTags: ['客厅', '餐厅', '主卧', '衣帽间'],
      analyzedAt: '2026-06-01T00:00:00.000Z'
    },
    likes: [], likesCount: 0, views: 340, shares: 0, commentCount: 0, comments: [],
    floorPlan: { metadata: { area: 145, rooms: 4, bathrooms: 2, layoutType: '四室两厅' } },
    images: [],
    isPublished: true,
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-18T12:00:00.000Z'
  },
  // 7. 美式风格 - 拆改阶段
  {
    _id: 'demo-diary-007',
    userId: MOCK_USERS[1],
    title: '成都天府130㎡·美式复古三居',
    description: '复古绿墙+护墙板+实木家具，打造慵懒美式范儿。',
    coverImage: '',
    constructionStage: 'demolition',
    houseType: 'apartment',
    houseArea: 130,
    stageHistory: makeStageHistory(1),
    address: { city: '成都市', district: '天府新区', detail: '天府大道' },
    budget: {
      totalEstimated: 380000, totalActual: 25000,
      items: [
        { category: '拆改', description: '非承重墙拆除', estimatedAmount: 25000, actualAmount: 25000 }
      ]
    },
    styleTags: ['美式风格', '法式风格'],
    materialTags: ['护墙板', '实木地板', '乳胶漆'],
    aiAnalysis: {
      style: { primary: '美式风格', confidence: 0.88, secondary: ['法式风格'] },
      materials: [
        { name: '护墙板', category: '墙面', confidence: 0.85, location: '客餐厅' },
        { name: '实木地板', category: '地面', confidence: 0.9, location: '卧室' }
      ],
      brands: [
        { name: '圣象', product: '实木地板', confidence: 0.82 },
        { name: '多乐士', product: '乳胶漆（复古绿）', confidence: 0.75 }
      ],
      colors: ['#8B4513', '#2E4A3F', '#F5DEB3'],
      spatialTags: ['客厅', '餐厅', '主卧'],
      analyzedAt: '2026-06-05T00:00:00.000Z'
    },
    likes: [], likesCount: 0, views: 210, shares: 0, commentCount: 0, comments: [],
    floorPlan: { metadata: { area: 130, rooms: 3, bathrooms: 2, layoutType: '三室两厅' } },
    images: [],
    isPublished: true,
    createdAt: '2026-05-25T10:00:00.000Z',
    updatedAt: '2026-06-15T12:00:00.000Z'
  }
];

export const MOCK_TRANSACTIONS: any[] = [
  {
    _id: 'demo-tx-001',
    diaryId: MOCK_DIARIES[0],
    homeownerId: MOCK_USERS[1],
    designerId: MOCK_USERS[3],
    projectName: '浦东120平三房北欧风设计施工',
    totalAmount: 350000,
    depositAmount: 70000,
    depositStatus: 'held',
    depositPaidAt: '2026-03-15T10:00:00.000Z',
    stages: [
      { stageIndex: 0, stageName: '方案设计', percentage: 6, amount: 21000, status: 'released', releasedAt: '2026-03-10T00:00:00.000Z' },
      { stageIndex: 1, stageName: '拆改工程', percentage: 9, amount: 31500, status: 'released', requestedAt: '2026-03-20T18:00:00.000Z', confirmedByHomeownerAt: '2026-03-21T09:00:00.000Z', releasedAt: '2026-03-21T09:00:00.000Z' },
      { stageIndex: 2, stageName: '水电工程', percentage: 16, amount: 56000, status: 'released', requestedAt: '2026-04-10T00:00:00.000Z', confirmedByHomeownerAt: '2026-04-12T09:00:00.000Z', releasedAt: '2026-04-12T09:00:00.000Z' },
      { stageIndex: 3, stageName: '泥木工程', percentage: 22, amount: 77000, status: 'released', requestedAt: '2026-05-10T00:00:00.000Z', confirmedByHomeownerAt: '2026-05-12T09:00:00.000Z', releasedAt: '2026-05-12T09:00:00.000Z' },
      { stageIndex: 4, stageName: '油漆工程', percentage: 12, amount: 42000, status: 'released', requestedAt: '2026-06-01T00:00:00.000Z', confirmedByHomeownerAt: '2026-06-03T09:00:00.000Z', releasedAt: '2026-06-03T09:00:00.000Z' },
      { stageIndex: 5, stageName: '安装工程', percentage: 15, amount: 52500, status: 'held', requestedAt: '2026-06-18T00:00:00.000Z' },
      { stageIndex: 6, stageName: '竣工验收', percentage: 20, amount: 59500, status: 'pending' }
    ],
    paymentMethod: 'alipay',
    status: 'in_progress',
    escrowAccount: 'escrow@deco-platform.com',
    acceptanceReport: {
      signedByHomeowner: false,
      signedByDesigner: true,
      signedAt: null,
      reportImages: [],
      overallRating: null,
      qualityRating: null,
      scheduleRating: null,
      attitudeRating: null,
      comment: null
    },
    messages: [
      { userId: 'demo-homeowner-001', content: '已付定金，期待合作！', timestamp: '2026-03-15T10:05:00.000Z' },
      { userId: 'demo-designer-001', content: '感谢信任，明日进场勘察～', timestamp: '2026-03-15T10:30:00.000Z' },
      { userId: 'demo-designer-001', content: '设计师申请「安装工程」阶段验收，金额 ¥52,500。', timestamp: '2026-06-18T10:00:00.000Z' }
    ],
    createdAt: '2026-03-15T10:00:00.000Z',
    updatedAt: '2026-06-18T10:00:00.000Z'
  }
];

export const MOCK_REPORTS: any[] = [
  {
    _id: 'demo-report-001',
    reporterId: 'demo-homeowner-001',
    targetType: 'comment',
    targetId: 'c1',
    targetUserId: 'demo-homeowner-002',
    reportType: 'spam',
    description: '评论区出现违规推广链接',
    evidenceImages: [],
    contentSnapshot: {
      originalContent: '想了解报价可加我wx 138xxxxxxx，有优惠',
      contentType: 'comment',
      createdAt: '2026-03-20T12:00:00.000Z'
    },
    status: 'pending',
    relatedReports: [],
    createdAt: '2026-03-20T12:30:00.000Z',
    updatedAt: '2026-03-20T12:30:00.000Z'
  }
];

export function findMockUser(account: string): any {
  return MOCK_USERS.find(u =>
    u.username === account || u.email === account || u.phone === account
  );
}

export function findMockUserById(id: string): any {
  return MOCK_USERS.find(u => u._id === id);
}

export function getApprovedDesigners(): any[] {
  return MOCK_USERS.filter(u => u.role === 'designer' && u.designerStatus === 'approved');
}
