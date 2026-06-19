import type {
  User,
  Order,
  OrderItem,
  OrderStatus,
  QualityOrder,
  PricingRule,
  Payout,
  Courier,
  Processor,
  AnalyticsData,
  TimeWindow,
  Address,
  BrandItem,
  MaterialTrace,
  DonationFlow,
  SopStep,
} from '../../shared/types';

export const brandList: BrandItem[] = [
  { id: 'phone-1', name: 'Apple', category: 'phones' },
  { id: 'phone-2', name: '华为', category: 'phones' },
  { id: 'phone-3', name: '小米', category: 'phones' },
  { id: 'phone-4', name: 'OPPO', category: 'phones' },
  { id: 'phone-5', name: 'vivo', category: 'phones' },
  { id: 'phone-6', name: '荣耀', category: 'phones' },
  { id: 'phone-7', name: '三星', category: 'phones' },
  { id: 'phone-8', name: '魅族', category: 'phones' },
];

export const bookCategories: string[] = [
  '文学小说',
  '经管励志',
  '科技计算机',
  '童书绘本',
  '教材教辅',
  '人文社科',
  '生活艺术',
  '外文原版',
];

export const clothingMaterials: string[] = [
  '纯棉',
  '涤纶',
  '羊毛',
  '丝绸',
  '亚麻',
  '牛仔',
  '针织',
  '混纺',
  '羽绒',
  '皮革',
];

export const mockUser: User = {
  id: 'user-001',
  phone: '138****8888',
  nickname: '环保达人小明',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming',
  wechatOpenId: 'wx_abc123def456',
  totalRecycledKg: 156.8,
  carbonSavedKg: 235.2,
  donationCount: 12,
};

export const mockAddresses: Address[] = [
  {
    id: 'addr-001',
    province: '广东省',
    city: '深圳市',
    district: '南山区',
    detail: '科技园南区粤兴三道6号南京大学深圳产学研大楼A座1001',
    contactName: '小明',
    contactPhone: '138****8888',
    isDefault: true,
  },
  {
    id: 'addr-002',
    province: '广东省',
    city: '深圳市',
    district: '福田区',
    detail: '中心四路1号嘉里建设广场T3座25楼',
    contactName: '小明',
    contactPhone: '138****8888',
  },
];

export const mockTimeWindows: TimeWindow[] = [
  { id: 'tw-001', date: '2026-06-19', startTime: '09:00', endTime: '11:00', available: true },
  { id: 'tw-002', date: '2026-06-19', startTime: '11:00', endTime: '13:00', available: true },
  { id: 'tw-003', date: '2026-06-19', startTime: '14:00', endTime: '16:00', available: false },
  { id: 'tw-004', date: '2026-06-19', startTime: '16:00', endTime: '18:00', available: true },
  { id: 'tw-005', date: '2026-06-20', startTime: '09:00', endTime: '11:00', available: true },
  { id: 'tw-006', date: '2026-06-20', startTime: '14:00', endTime: '16:00', available: true },
];

const createOrderItems = (category: 'clothing' | 'books' | 'phones'): OrderItem[] => {
  if (category === 'phones') {
    return [
      {
        id: 'item-p1',
        name: 'iPhone 13 Pro',
        brand: 'Apple',
        model: 'A2639',
        quantity: 1,
        condition: 8,
        estimatedPrice: 2800,
        images: ['https://picsum.photos/seed/phone1/200/200'],
      },
    ];
  }
  if (category === 'books') {
    return [
      { id: 'item-b1', name: '文学小说类书籍', quantity: 15, condition: 7, estimatedPrice: 18 },
      { id: 'item-b2', name: '科技计算机类书籍', quantity: 8, condition: 8, estimatedPrice: 9.6 },
    ];
  }
  return [
    { id: 'item-c1', name: '夏季T恤', quantity: 10, condition: 7, estimatedPrice: 12.5 },
    { id: 'item-c2', name: '牛仔裤', quantity: 5, condition: 6, estimatedPrice: 8.75 },
    { id: 'item-c3', name: '外套大衣', quantity: 3, condition: 8, estimatedPrice: 15 },
  ];
};

const createTimeline = (status: OrderStatus) => {
  const allSteps: { status: OrderStatus; desc: string }[] = [
    { status: 'pending', desc: '订单已创建，等待快递员接单' },
    { status: 'assigned', desc: '快递员已接单，正在前往取件' },
    { status: 'picked', desc: '快递员已取件，正在运往分拣中心' },
    { status: 'inspecting', desc: '货物已到达，正在进行质检' },
    { status: 'priced', desc: '质检完成，已生成定价' },
    { status: 'confirmed', desc: '用户已确认价格' },
    { status: 'paid', desc: '款项已打款至用户账户' },
    { status: 'completed', desc: '订单已完成' },
  ];
  const statusOrder: OrderStatus[] = [
    'pending', 'assigned', 'picked', 'inspecting', 'priced', 'confirmed', 'paid', 'completed',
  ];
  const idx = statusOrder.indexOf(status);
  return allSteps.slice(0, idx + 1).map((step, i) => ({
    status: step.status,
    time: `2026-06-${10 + i} ${10 + i}:${String(30 - i * 3).padStart(2, '0')}:00`,
    description: step.desc,
  }));
};

export const mockOrders: Order[] = [
  {
    id: 'order-001',
    orderNo: 'RC202606180001',
    userId: 'user-001',
    category: 'phones',
    items: createOrderItems('phones'),
    estimatedPrice: 2800,
    finalPrice: 2650,
    status: 'completed',
    pickupTime: '2026-06-10 10:00:00',
    address: mockAddresses[0],
    courierId: 'courier-001',
    createdAt: '2026-06-09 15:30:00',
    timeline: createTimeline('completed'),
    weightKg: 0.25,
  },
  {
    id: 'order-002',
    orderNo: 'RC202606180002',
    userId: 'user-001',
    category: 'clothing',
    items: createOrderItems('clothing'),
    estimatedPrice: 36.25,
    status: 'priced',
    pickupTime: '2026-06-15 14:00:00',
    address: mockAddresses[0],
    courierId: 'courier-002',
    createdAt: '2026-06-14 09:20:00',
    timeline: createTimeline('priced'),
    weightKg: 8.5,
  },
  {
    id: 'order-003',
    orderNo: 'RC202606180003',
    userId: 'user-001',
    category: 'books',
    items: createOrderItems('books'),
    estimatedPrice: 27.6,
    status: 'inspecting',
    pickupTime: '2026-06-17 09:30:00',
    address: mockAddresses[1],
    courierId: 'courier-001',
    createdAt: '2026-06-16 18:45:00',
    timeline: createTimeline('inspecting'),
    weightKg: 12.3,
  },
  {
    id: 'order-004',
    orderNo: 'RC202606180004',
    userId: 'user-001',
    category: 'clothing',
    items: [{ id: 'item-c4', name: '冬季羽绒服', quantity: 2, condition: 7, estimatedPrice: 20 }],
    estimatedPrice: 20,
    status: 'picked',
    pickupTime: '2026-06-18 16:00:00',
    address: mockAddresses[0],
    courierId: 'courier-003',
    createdAt: '2026-06-17 20:10:00',
    timeline: createTimeline('picked'),
    weightKg: 3.2,
  },
  {
    id: 'order-005',
    orderNo: 'RC202606180005',
    userId: 'user-001',
    category: 'phones',
    items: [
      { id: 'item-p2', name: '华为 Mate 40 Pro', brand: '华为', model: 'NOH-AN00', quantity: 1, condition: 9, estimatedPrice: 3200 },
    ],
    estimatedPrice: 3200,
    status: 'assigned',
    pickupTime: '2026-06-19 10:00:00',
    address: mockAddresses[0],
    courierId: 'courier-002',
    createdAt: '2026-06-18 10:30:00',
    timeline: createTimeline('assigned'),
    weightKg: 0.22,
  },
  {
    id: 'order-006',
    orderNo: 'RC202606180006',
    userId: 'user-001',
    category: 'books',
    items: [{ id: 'item-b3', name: '教材教辅类书籍', quantity: 20, condition: 6, estimatedPrice: 14.4 }],
    estimatedPrice: 14.4,
    status: 'pending',
    pickupTime: '2026-06-20 14:00:00',
    address: mockAddresses[1],
    createdAt: '2026-06-18 11:00:00',
    timeline: createTimeline('pending'),
    weightKg: 8,
  },
];

const createSopSteps = (completedCount: number): SopStep[] => {
  const steps = [
    { id: 'sop-1', name: '外观检查', description: '检查物品外观是否完好、有无明显破损污渍', required: true },
    { id: 'sop-2', name: '称重测量', description: '对物品进行精确称重，记录实际重量', required: true },
    { id: 'sop-3', name: '成色评估', description: '根据成色标准对物品进行1-10级评估', required: true },
    { id: 'sop-4', name: '拍照记录', description: '多角度拍摄物品照片作为存档', required: true },
    { id: 'sop-5', name: '特殊标记', description: '记录物品特殊情况（签名版、限量版等）', required: false },
  ];
  return steps.map((s, i) => ({
    ...s,
    completed: i < completedCount,
    completedAt: i < completedCount ? `2026-06-17 ${10 + i}:00:00` : undefined,
  }));
};

export const mockQualityOrders: QualityOrder[] = [
  {
    id: 'qo-001',
    orderId: 'order-003',
    status: 'ai-screening',
    images: [
      'https://picsum.photos/seed/book1/400/300',
      'https://picsum.photos/seed/book2/400/300',
    ],
    aiResult: {
      categoryConfidence: 0.95,
      detectedCondition: 7,
      defects: ['轻微折痕', '书角磨损'],
      confidence: 0.88,
    },
    sopSteps: createSopSteps(2),
    assignee: '质检师-王工',
    createdAt: '2026-06-17 10:00:00',
  },
  {
    id: 'qo-002',
    orderId: 'order-002',
    status: 'completed',
    images: [
      'https://picsum.photos/seed/cloth1/400/300',
      'https://picsum.photos/seed/cloth2/400/300',
      'https://picsum.photos/seed/cloth3/400/300',
    ],
    aiResult: {
      categoryConfidence: 0.97,
      detectedCondition: 7,
      defects: ['轻微褪色'],
      confidence: 0.92,
    },
    manualResult: {
      inspector: '质检师-李工',
      condition: 7,
      actualWeightKg: 8.5,
      defects: ['轻微褪色', '个别纽扣松动'],
      notes: '整体成色良好，可按正常价格回收',
      images: ['https://picsum.photos/seed/manual1/400/300'],
    },
    sopSteps: createSopSteps(5),
    assignee: '质检师-李工',
    createdAt: '2026-06-15 16:00:00',
  },
  {
    id: 'qo-003',
    orderId: 'order-004',
    status: 'pending',
    images: ['https://picsum.photos/seed/jacket1/400/300'],
    sopSteps: createSopSteps(0),
    createdAt: '2026-06-18 09:00:00',
  },
  {
    id: 'qo-004',
    orderId: 'order-001',
    status: 'manual-inspection',
    images: [
      'https://picsum.photos/seed/iphone1/400/300',
      'https://picsum.photos/seed/iphone2/400/300',
    ],
    aiResult: {
      categoryConfidence: 0.99,
      detectedCondition: 8,
      defects: ['屏幕细微划痕'],
      confidence: 0.96,
    },
    sopSteps: createSopSteps(3),
    assignee: '质检师-张工',
    createdAt: '2026-06-10 14:00:00',
  },
];

export const mockPricingRules: PricingRule[] = [
  {
    id: 'rule-001',
    name: '衣物基础定价',
    category: 'clothing',
    priority: 10,
    enabled: true,
    conditions: [{ field: 'weight', operator: 'gt', value: 0 }],
    formula: {
      type: 'per_kg',
      basePrice: 2.5,
      multipliers: [{ field: 'condition', factor: 0.1 }],
    },
  },
  {
    id: 'rule-002',
    name: '图书基础定价',
    category: 'books',
    priority: 10,
    enabled: true,
    conditions: [{ field: 'weight', operator: 'gt', value: 0 }],
    formula: {
      type: 'per_kg',
      basePrice: 1.2,
      multipliers: [{ field: 'condition', factor: 0.15 }],
    },
  },
  {
    id: 'rule-003',
    name: '手机品牌溢价',
    category: 'phones',
    priority: 5,
    enabled: true,
    conditions: [
      { field: 'brand', operator: 'in', value: ['Apple', '华为', '三星'] },
    ],
    formula: {
      type: 'per_item',
      basePrice: 100,
      multipliers: [
        { field: 'brand', factor: 0.2 },
        { field: 'condition', factor: 0.3 },
      ],
    },
  },
  {
    id: 'rule-004',
    name: '手机普通品牌定价',
    category: 'phones',
    priority: 15,
    enabled: true,
    conditions: [
      { field: 'brand', operator: 'in', value: ['小米', 'OPPO', 'vivo', '荣耀'] },
    ],
    formula: {
      type: 'per_item',
      basePrice: 50,
      multipliers: [{ field: 'condition', factor: 0.25 }],
    },
  },
  {
    id: 'rule-005',
    name: '大重量衣物优惠',
    category: 'clothing',
    priority: 8,
    enabled: false,
    conditions: [{ field: 'weight', operator: 'gte', value: 20 }],
    formula: {
      type: 'per_kg',
      basePrice: 3.0,
      multipliers: [{ field: 'condition', factor: 0.1 }],
    },
  },
];

export const mockPayouts: Payout[] = [
  {
    id: 'payout-001',
    orderId: 'order-001',
    userId: 'user-001',
    amount: 2650,
    method: 'wechat_wallet',
    status: 'success',
    accountInfo: {
      type: 'wechat',
      accountNumber: 'wx_abc123def456',
      accountName: '环保达人小明',
    },
    transactionId: '4200001234202606101234567890',
    createdAt: '2026-06-10 18:00:00',
    paidAt: '2026-06-10 18:05:00',
  },
  {
    id: 'payout-002',
    orderId: 'order-002',
    userId: 'user-001',
    amount: 34.8,
    method: 'bank_card',
    status: 'pending',
    accountInfo: {
      type: 'bank',
      accountNumber: '6222****8888',
      accountName: '张小明',
      bankName: '中国工商银行',
    },
    createdAt: '2026-06-16 09:00:00',
  },
  {
    id: 'payout-003',
    orderId: 'order-007',
    userId: 'user-002',
    amount: 156.5,
    method: 'wechat_wallet',
    status: 'processing',
    accountInfo: {
      type: 'wechat',
      accountNumber: 'wx_xyz789',
      accountName: '李女士',
    },
    createdAt: '2026-06-18 08:30:00',
  },
  {
    id: 'payout-004',
    orderId: 'order-008',
    userId: 'user-003',
    amount: 1250,
    method: 'bank_card',
    status: 'failed',
    accountInfo: {
      type: 'bank',
      accountNumber: '6225****6666',
      accountName: '王先生',
      bankName: '招商银行',
    },
    createdAt: '2026-06-17 14:00:00',
    remark: '银行卡信息有误，请核对后重试',
  },
];

export const mockCouriers: Courier[] = [
  {
    id: 'courier-001',
    name: '张师傅',
    phone: '139****1234',
    status: 'online',
    serviceArea: '南山区科技园片区',
    rating: 4.9,
    orderCount: 568,
    currentLocation: { lat: 22.5431, lng: 113.9522 },
  },
  {
    id: 'courier-002',
    name: '李师傅',
    phone: '138****5678',
    status: 'busy',
    serviceArea: '福田区中心区',
    rating: 4.8,
    orderCount: 423,
    currentLocation: { lat: 22.5400, lng: 114.0579 },
  },
  {
    id: 'courier-003',
    name: '王师傅',
    phone: '137****9012',
    status: 'online',
    serviceArea: '南山区蛇口片区',
    rating: 4.7,
    orderCount: 312,
    currentLocation: { lat: 22.4815, lng: 113.9176 },
  },
  {
    id: 'courier-004',
    name: '赵师傅',
    phone: '136****3456',
    status: 'offline',
    serviceArea: '罗湖区',
    rating: 4.6,
    orderCount: 198,
  },
  {
    id: 'courier-005',
    name: '刘师傅',
    phone: '135****7890',
    status: 'online',
    serviceArea: '宝安区新安街道',
    rating: 4.9,
    orderCount: 675,
    currentLocation: { lat: 22.5548, lng: 113.8848 },
  },
];

export const mockProcessors: Processor[] = [
  {
    id: 'proc-001',
    companyName: '深圳市绿源环保科技有限公司',
    contactName: '陈经理',
    contactPhone: '0755-88881234',
    status: 'approved',
    licenseNo: '440300-2023-HB-00123',
    licenseImages: ['https://picsum.photos/seed/license1/600/400'],
    capacity: '月处理量 500 吨',
    categories: ['clothing', 'books'],
    rating: 4.8,
    address: '深圳市宝安区松岗街道潭头社区环保产业园A栋',
    reviewHistory: [
      {
        id: 'review-001',
        status: 'approved',
        reviewer: '运营管理员',
        comment: '资质齐全，符合环保处理标准',
        createdAt: '2025-12-15 10:00:00',
      },
    ],
  },
  {
    id: 'proc-002',
    companyName: '广东焕新数码回收有限公司',
    contactName: '林总监',
    contactPhone: '0755-66665678',
    status: 'approved',
    licenseNo: '440300-2024-HB-00456',
    licenseImages: [
      'https://picsum.photos/seed/license2/600/400',
      'https://picsum.photos/seed/license3/600/400',
    ],
    capacity: '月处理量 20 万件电子产品',
    categories: ['phones'],
    rating: 4.9,
    address: '东莞市长安镇振安东路环保电子产业园',
    reviewHistory: [
      {
        id: 'review-002',
        status: 'approved',
        reviewer: '运营管理员',
        comment: '电子废弃物处理资质齐全，设备先进',
        createdAt: '2026-01-20 14:30:00',
      },
    ],
  },
  {
    id: 'proc-003',
    companyName: '广州市蓝天再生资源有限公司',
    contactName: '黄经理',
    contactPhone: '020-77779012',
    status: 'reviewing',
    licenseNo: '440100-2026-HB-00078',
    licenseImages: ['https://picsum.photos/seed/license4/600/400'],
    capacity: '月处理量 300 吨',
    categories: ['clothing', 'books', 'phones'],
    rating: 0,
    address: '广州市花都区秀全街环保大道168号',
    reviewHistory: [
      {
        id: 'review-003',
        status: 'pending',
        reviewer: '',
        comment: '',
        createdAt: '2026-06-15 09:00:00',
      },
    ],
  },
  {
    id: 'proc-004',
    companyName: '深圳市恒益环保处理厂',
    contactName: '吴厂长',
    contactPhone: '0755-55553456',
    status: 'rejected',
    licenseNo: '440300-2026-HB-00099',
    licenseImages: ['https://picsum.photos/seed/license5/600/400'],
    capacity: '月处理量 150 吨',
    categories: ['clothing'],
    rating: 0,
    reviewHistory: [
      {
        id: 'review-004',
        status: 'rejected',
        reviewer: '运营管理员',
        comment: '营业执照已过期，请更新后重新提交',
        createdAt: '2026-06-10 16:00:00',
      },
    ],
  },
];

export const mockMaterialTraces: MaterialTrace[] = [
  {
    id: 'trace-001',
    orderId: 'order-001',
    processorId: 'proc-002',
    batchNo: 'BATCH-20260612-PHONE-0089',
    weightKg: 0.25,
    status: '处理完成',
    receivedAt: '2026-06-12 10:00:00',
    processNote: '已完成翻新检测，将进入二手流通渠道',
  },
  {
    id: 'trace-002',
    orderId: 'order-002',
    processorId: 'proc-001',
    batchNo: 'BATCH-20260617-CLOTH-0234',
    weightKg: 8.5,
    status: '分拣中',
    receivedAt: '2026-06-17 14:00:00',
  },
];

export const mockDonationFlows: DonationFlow[] = [
  {
    id: 'donation-001',
    orderId: 'order-001',
    amount: 26.5,
    beneficiary: '中国乡村发展基金会',
    projectName: '美丽乡村图书角计划',
    certificateUrl: 'https://picsum.photos/seed/cert1/800/600',
    donatedAt: '2026-06-10 18:10:00',
    description: '订单收益的1%已捐赠至乡村图书角建设项目',
  },
  {
    id: 'donation-002',
    orderId: 'order-002',
    amount: 0.35,
    beneficiary: '中华环境保护基金会',
    projectName: '绿色回收环保行动',
    donatedAt: '2026-06-16 09:15:00',
    description: '订单收益的1%将用于环保公益宣传',
  },
];

export const mockAnalytics: AnalyticsData = {
  overview: {
    totalOrders: 12856,
    totalRecycledKg: 45678.5,
    totalPayout: 1256890.5,
    activeUsers: 3456,
    pendingQualityOrders: 28,
    pendingPayouts: 56,
  },
  orderTrend: [
    { date: '2026-06-12', count: 380, kg: 1350 },
    { date: '2026-06-13', count: 420, kg: 1480 },
    { date: '2026-06-14', count: 510, kg: 1820 },
    { date: '2026-06-15', count: 475, kg: 1680 },
    { date: '2026-06-16', count: 530, kg: 1920 },
    { date: '2026-06-17', count: 590, kg: 2100 },
    { date: '2026-06-18', count: 620, kg: 2250 },
  ],
  categoryDistribution: [
    { category: '衣物', count: 6850, percentage: 53.3 },
    { category: '图书', count: 3980, percentage: 31.0 },
    { category: '手机数码', count: 2026, percentage: 15.7 },
  ],
  userFrequency: [
    { range: '首次使用', count: 1820 },
    { range: '2-5次', count: 1120 },
    { range: '6-10次', count: 356 },
    { range: '10次以上', count: 160 },
  ],
  regionDistribution: [
    { region: '南山区', count: 4520 },
    { region: '福田区', count: 3280 },
    { region: '宝安区', count: 2150 },
    { region: '罗湖区', count: 1680 },
    { region: '龙岗区', count: 1226 },
  ],
  statusDistribution: [
    { status: '待接单', count: 45 },
    { status: '已接单', count: 78 },
    { status: '已取件', count: 120 },
    { status: '质检中', count: 56 },
    { status: '待确认', count: 34 },
    { status: '已完成', count: 12356 },
    { status: '已取消', count: 167 },
  ],
};
