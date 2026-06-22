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
      styleTags: ['北欧', '现代简约'],
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
      styleTags: ['新中式', '日式'],
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
    qualifications: {
      licenseNumber: 'CN-ID-2015-88372',
      certificationImages: [],
      verifiedAt: '2023-06-01T00:00:00.000Z'
    },
    portfolio: [
      {
        title: '浦东 120㎡ 北欧风三居室',
        description: '全屋定制北欧风设计，温馨舒适，浅色系',
        images: [],
        style: '北欧',
        budgetRange: { min: 250000, max: 400000 }
      },
      {
        title: '静安 89㎡ 日式小户型',
        description: '收纳最大化，多功能空间',
        images: [],
        style: '日式',
        budgetRange: { min: 150000, max: 250000 }
      },
      {
        title: '徐汇 156㎡ 轻奢大平层',
        description: '精致轻奢，品质生活',
        images: [],
        style: '轻奢',
        budgetRange: { min: 500000, max: 1000000 }
      }
    ],
    statistics: {
      completedProjects: 58,
      rating: 4.8,
      reviewCount: 42
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
    bio: '8年设计经验，专注新中式设计，传统与现代融合',
    designerStatus: 'approved',
    serviceAreas: ['北京市', '上海市', '南京市'],
    qualifications: {
      licenseNumber: 'CN-ID-2016-33291',
      certificationImages: [],
      verifiedAt: '2023-06-15T00:00:00.000Z'
    },
    portfolio: [
      {
        title: '北京朝阳 156㎡ 新中式四房',
        description: '典雅大气新中式设计',
        images: [],
        style: '新中式',
        budgetRange: { min: 400000, max: 800000 }
      }
    ],
    statistics: {
      completedProjects: 37,
      rating: 4.7,
      reviewCount: 31
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
    bio: '海归设计师，专注北欧/轻奢风格，米兰理工硕士',
    designerStatus: 'approved',
    serviceAreas: ['上海市', '深圳市', '广州市'],
    qualifications: {
      licenseNumber: 'CN-ID-2017-55621',
      certificationImages: [],
      verifiedAt: '2023-08-20T00:00:00.000Z'
    },
    portfolio: [
      {
        title: '深圳南山 96㎡ 轻奢三居',
        description: '精致生活品质感',
        images: [],
        style: '轻奢',
        budgetRange: { min: 300000, max: 600000 }
      }
    ],
    statistics: {
      completedProjects: 29,
      rating: 4.9,
      reviewCount: 26
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
    bio: '日式原木风专家，5年专注，温暖治愈系',
    designerStatus: 'approved',
    serviceAreas: ['上海市', '杭州市', '成都市'],
    qualifications: {
      licenseNumber: 'CN-ID-2018-99123',
      certificationImages: [],
      verifiedAt: '2023-10-10T00:00:00.000Z'
    },
    portfolio: [
      {
        title: '杭州西湖 75㎡ 日式两居',
        description: '小空间大智慧',
        images: [],
        style: '日式',
        budgetRange: { min: 120000, max: 200000 }
      }
    ],
    statistics: {
      completedProjects: 21,
      rating: 4.6,
      reviewCount: 18
    },
    createdAt: '2023-10-15T00:00:00.000Z',
    updatedAt: '2024-03-12T00:00:00.000Z'
  }
];

export const MOCK_DIARIES: any[] = [
  {
    _id: 'demo-diary-001',
    userId: MOCK_USERS[1],
    title: '浦东120平三房·北欧风装修日记',
    description: '记录120平三房完整装修过程，从拆旧到验收全流程，每一步都是心血',
    coverImage: '',
    constructionStage: 'plumbing_electrical',
    houseType: 'apartment',
    houseArea: 120,
    stageHistory: [
      { stage: 'planning', startedAt: '2026-03-01T00:00:00.000Z', completedAt: '2026-03-10T00:00:00.000Z', description: '方案设计与报价确认，前后改了三稿' },
      { stage: 'demolition', startedAt: '2026-03-11T00:00:00.000Z', completedAt: '2026-03-20T00:00:00.000Z', description: '拆旧完成，格局改造中' },
      { stage: 'plumbing_electrical', startedAt: '2026-03-21T00:00:00.000Z', description: '水电施工中，强电箱移位' }
    ],
    address: {
      city: '上海市',
      district: '浦东新区',
      detail: '张江路888弄'
    },
    budget: {
      totalEstimated: 350000,
      totalActual: 47000,
      items: [
        { category: '水电改造', description: '全屋水电重新排布', estimatedAmount: 35000, actualAmount: 32000, date: '2026-03-25' },
        { category: '瓷砖地板', description: '客厅卧室厨卫墙地砖', estimatedAmount: 45000 },
        { category: '木作定制', description: '衣柜鞋柜书柜', estimatedAmount: 60000 },
        { category: '乳胶漆', description: '全屋墙面', estimatedAmount: 18000 },
        { category: '厨卫吊顶', description: '集成吊顶+浴霸', estimatedAmount: 12000 },
        { category: '卫浴洁具', description: '马桶台盆龙头', estimatedAmount: 25000 },
        { category: '门窗', description: '断桥铝窗户', estimatedAmount: 30000 },
        { category: '家具家电', description: '沙发床餐桌', estimatedAmount: 60000 },
        { category: '设计费', description: '设计师全程跟进', estimatedAmount: 15000, actualAmount: 15000 },
        { category: '软装', description: '窗帘灯具装饰画', estimatedAmount: 25000 }
      ]
    },
    styleTags: ['北欧', '现代简约'],
    materialTags: ['木饰面', '乳胶漆', '岩板'],
    aiAnalysis: {
      style: { primary: '北欧', confidence: 0.92, secondary: ['日式', '现代简约'] },
      materials: [
        { name: '木饰面', category: '墙面', confidence: 0.95, location: '客厅卧室' },
        { name: '乳胶漆', category: '墙面', confidence: 0.88, location: '全屋' },
        { name: '岩板', category: '台面', confidence: 0.75, location: '厨房' }
      ],
      brands: [
        { name: '宜家', product: '家具', confidence: 0.8 },
        { name: '索菲亚', product: '定制柜', confidence: 0.7 }
      ],
      colors: ['#F5F5DC', '#D2B48C', '#87CEEB', '#FFFFFF'],
      spatialTags: ['客厅', '卧室', '厨房', '卫浴'],
      analyzedAt: '2026-03-25T10:00:00.000Z'
    },
    likes: [],
    likesCount: 2,
    views: 1256,
    shares: 5,
    commentCount: 1,
    comments: [
      {
        _id: 'c1',
        userId: MOCK_USERS[5],
        username: 'Zhang · 北欧研究所',
        userAvatar: '',
        content: '北欧风配这个户型非常合适！期待后续更新',
        createdAt: '2026-03-22T10:00:00.000Z',
        likes: 0
      }
    ],
    floorPlan: {
      metadata: { area: 120, rooms: 3, bathrooms: 2, floors: 18 }
    },
    images: [],
    isPublished: true,
    createdAt: '2026-03-01T10:00:00.000Z',
    updatedAt: '2026-03-25T15:30:00.000Z'
  },
  {
    _id: 'demo-diary-002',
    userId: MOCK_USERS[2],
    title: '静安89㎡两房·日式小户型翻新',
    description: '二手房翻新全记录，收纳是最大需求，想要满满的日式感',
    coverImage: '',
    constructionStage: 'painting',
    houseType: 'apartment',
    houseArea: 89,
    stageHistory: [
      { stage: 'planning', startedAt: '2026-04-01T00:00:00.000Z', completedAt: '2026-04-08T00:00:00.000Z' },
      { stage: 'demolition', startedAt: '2026-04-09T00:00:00.000Z', completedAt: '2026-04-15T00:00:00.000Z' },
      { stage: 'plumbing_electrical', startedAt: '2026-04-16T00:00:00.000Z', completedAt: '2026-04-30T00:00:00.000Z' },
      { stage: 'masonry_carpentry', startedAt: '2026-05-01T00:00:00.000Z', completedAt: '2026-05-20T00:00:00.000Z' },
      { stage: 'painting', startedAt: '2026-05-21T00:00:00.000Z', description: '油漆阶段' }
    ],
    address: {
      city: '上海市',
      district: '静安区',
      detail: '南京西路'
    },
    budget: {
      totalEstimated: 220000,
      totalActual: 21000,
      items: [
        { category: '水电', description: '局部改造', estimatedAmount: 22000, actualAmount: 21000 },
        { category: '定制柜', description: '全屋收纳柜', estimatedAmount: 50000 }
      ]
    },
    styleTags: ['日式'],
    materialTags: ['木饰面'],
    aiAnalysis: {
      style: { primary: '日式', confidence: 0.88, secondary: ['北欧'] },
      materials: [
        { name: '木饰面', category: '全屋', confidence: 0.96, location: '全屋' }
      ],
      brands: [
        { name: '无印良品', product: '家具', confidence: 0.7 }
      ],
      colors: ['#E8E4DF'],
      analyzedAt: '2026-05-01T00:00:00.000Z'
    },
    likes: [],
    likesCount: 1,
    views: 820,
    shares: 2,
    commentCount: 0,
    comments: [],
    images: [],
    floorPlan: { metadata: { area: 89, rooms: 2, bathrooms: 1 } },
    isPublished: true,
    createdAt: '2026-04-01T08:00:00.000Z',
    updatedAt: '2026-05-22T12:00:00.000Z'
  },
  {
    _id: 'demo-diary-003',
    userId: MOCK_USERS[1],
    title: '北京朝阳156㎡·新中式大宅装修',
    description: '四房两厅大平层，新中式风格，爸妈喜欢的典雅范儿',
    coverImage: '',
    constructionStage: 'masonry_carpentry',
    houseType: 'apartment',
    houseArea: 156,
    stageHistory: [
      { stage: 'planning', startedAt: '2026-02-01T00:00:00.000Z', completedAt: '2026-02-15T00:00:00.000Z' },
      { stage: 'demolition', startedAt: '2026-02-16T00:00:00.000Z', completedAt: '2026-02-25T00:00:00.000Z' },
      { stage: 'plumbing_electrical', startedAt: '2026-02-26T00:00:00.000Z', completedAt: '2026-03-15T00:00:00.000Z' },
      { stage: 'masonry_carpentry', startedAt: '2026-03-16T00:00:00.000Z', description: '泥木施工' }
    ],
    address: {
      city: '北京市',
      district: '朝阳区',
      detail: '建国路'
    },
    budget: {
      totalEstimated: 650000,
      totalActual: 58000,
      items: [
        { category: '水电', description: '全屋改造', estimatedAmount: 55000, actualAmount: 58000 },
        { category: '定制柜', description: '新中式木作', estimatedAmount: 150000 }
      ]
    },
    styleTags: ['新中式'],
    materialTags: ['大理石', '木饰面'],
    aiAnalysis: {
      style: { primary: '新中式', confidence: 0.94, secondary: ['轻奢'] },
      materials: [
        { name: '大理石', category: '地面', confidence: 0.9, location: '客厅' },
        { name: '木饰面', category: '背景墙', confidence: 0.85, location: '客厅背景墙' }
      ],
      brands: [
        { name: '左右沙发', product: '家具', confidence: 0.75 }
      ],
      colors: ['#8B4513', '#F5F5DC'],
      analyzedAt: '2026-03-01T00:00:00.000Z'
    },
    likes: [],
    likesCount: 0,
    views: 560,
    shares: 0,
    commentCount: 0,
    comments: [],
    images: [],
    floorPlan: { metadata: { area: 156, rooms: 4, bathrooms: 2 } },
    isPublished: true,
    createdAt: '2026-02-01T10:00:00.000Z',
    updatedAt: '2026-03-16T12:00:00.000Z'
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
      { stageIndex: 2, stageName: '水电工程', percentage: 16, amount: 56000, status: 'held', requestedAt: '2026-03-30T00:00:00.000Z' },
      { stageIndex: 3, stageName: '泥木工程', percentage: 22, amount: 77000, status: 'pending' },
      { stageIndex: 4, stageName: '油漆工程', percentage: 12, amount: 42000, status: 'pending' },
      { stageIndex: 5, stageName: '安装工程', percentage: 15, amount: 52500, status: 'pending' },
      { stageIndex: 6, stageName: '竣工验收', percentage: 20, amount: 59500, status: 'pending' }
    ],
    paymentMethod: 'alipay',
    status: 'in_progress',
    escrowAccount: 'escrow@deco-platform.com',
    messages: [
      { userId: 'demo-homeowner-001', content: '已付定金，期待合作！', timestamp: '2026-03-15T10:05:00.000Z' },
      { userId: 'demo-designer-001', content: '感谢信任，明日进场勘察～', timestamp: '2026-03-15T10:30:00.000Z' },
      { userId: 'demo-designer-001', content: '设计师申请「拆改工程」阶段验收，金额 ¥31,500。', timestamp: '2026-03-20T18:00:00.000Z' },
      { userId: 'demo-homeowner-001', content: '业主已确认「拆改工程」验收通过！款项已释放。', timestamp: '2026-03-21T09:00:00.000Z' }
    ],
    createdAt: '2026-03-15T10:00:00.000Z',
    updatedAt: '2026-03-30T10:00:00.000Z'
  }
];

export const MOCK_REPORTS: any[] = [
  {
    _id: 'demo-report-001',
    reporterId: 'demo-homeowner-001',
    targetType: 'comment' as const,
    targetId: 'c1',
    targetUserId: 'demo-homeowner-002',
    reportType: 'spam' as const,
    description: '评论区出现违规推广链接',
    evidenceImages: [],
    contentSnapshot: {
      originalContent: '想了解报价可加我wx 138xxxxxxx，有优惠',
      contentType: 'comment',
      createdAt: '2026-03-20T12:00:00.000Z'
    },
    status: 'pending' as const,
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
