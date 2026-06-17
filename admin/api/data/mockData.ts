import type {
  User,
  Citizen,
  TransportCard,
  Transaction,
  ScenicSpot,
  Reservation,
  Enterprise,
  Merchant,
  AuditLog,
  DashboardData,
  FusingRule,
} from '../../src/types/index.js';

export const mockUser: User = {
  id: 'user-001',
  username: 'admin',
  name: '超级管理员',
  role: 'super_admin',
  lastLoginAt: new Date(),
};

export const mockCitizens: Citizen[] = Array.from({ length: 50 }, (_, i) => ({
  id: `citizen-${String(i + 1).padStart(3, '0')}`,
  idCardNumber: `320501********${String(1000 + i).slice(-4)}`,
  name: ['张三', '李四', '王五', '赵六', '陈七', '周八', '吴九', '郑十'][i % 8] + (i > 7 ? i : ''),
  gender: i % 2 === 0 ? 'male' : 'female',
  phone: `138****${String(1000 + i).slice(-4)}`,
  realNameVerified: i < 45,
  realNameVerifiedAt: i < 45 ? new Date(`2024-${String((i % 12) + 1).padStart(2, '0')}-15`) : undefined,
  faceVerified: i < 42,
  district: ['姑苏区', '工业园区', '虎丘区', '吴中区', '相城区', '吴江区', '昆山市', '常熟市', '张家港市', '太仓市'][i % 10],
  address: `江苏省苏州市${['姑苏区', '工业园区', '虎丘区', '吴中区', '相城区', '吴江区', '昆山市', '常熟市', '张家港市', '太仓市'][i % 10]}某某街道${i + 1}号`,
  createdAt: new Date(`2024-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`),
}));

export const mockTransportCards: TransportCard[] = Array.from({ length: 30 }, (_, i) => ({
  id: `tc-${i + 1}`,
  citizenId: `citizen-${String(i + 1).padStart(3, '0')}`,
  citizenName: ['张三', '李四', '王五', '赵六', '陈七', '周八', '吴九', '郑十'][i % 8] + (i > 7 ? i : ''),
  cardNo: `3104 8300 **** ${String(1000 + i).slice(-4)}`,
  balance: Math.round((Math.random() * 500 + 50) * 100) / 100,
  status: i < 25 ? 'active' : i < 28 ? 'lost' : 'closed',
  nfcEnabled: i < 20,
  cityCode: ['3205', '3202', '3204', '3100', '3301'][i % 5],
  cityName: ['苏州市', '无锡市', '常州市', '上海市', '杭州市'][i % 5],
  createdAt: new Date(`2024-${String((i % 6) + 1).padStart(2, '0')}-10`),
}));

export const mockTransactions: Transaction[] = Array.from({ length: 100 }, (_, i) => {
  const type = i % 5 === 0 ? 'recharge' : 'consume';
  const amount = type === 'recharge' ? Math.round((Math.random() * 200 + 50) * 100) / 100 : -Math.round((Math.random() * 10 + 1) * 100) / 100;
  const cities = [
    { code: '3205', name: '苏州市', routes: ['地铁1号线', '地铁2号线', '地铁4号线', '公交1路', '公交88路'] },
    { code: '3202', name: '无锡市', routes: ['地铁1号线', '公交88路', '公交11路'] },
    { code: '3204', name: '常州市', routes: ['BRT1号线', '公交1路', '公交2路'] },
    { code: '3100', name: '上海市', routes: ['地铁1号线', '地铁2号线', '地铁10号线'] },
    { code: '3301', name: '杭州市', routes: ['地铁1号线', '公交10路', '公交K7路'] },
  ];
  const city = cities[i % 5];
  const hasDiscount = type === 'consume' && (city.code === '3205' || city.code === '3202' || city.code === '3204');
  
  return {
    id: `tx-${String(i + 1).padStart(5, '0')}`,
    cardId: `tc-${(i % 30) + 1}`,
    citizenName: ['张三', '李四', '王五', '赵六', '陈七', '周八', '吴九', '郑十'][i % 8],
    cardNo: `3104 8300 **** ${String(1000 + (i % 30)).slice(-4)}`,
    type,
    amount,
    balanceAfter: Math.round((Math.random() * 500 + 100) * 100) / 100,
    cityCode: city.code,
    cityName: city.name,
    routeName: type === 'consume' ? city.routes[i % city.routes.length] : undefined,
    discountApplied: hasDiscount ? Math.round(Math.abs(amount) * 0.2 * 100) / 100 : 0,
    originalAmount: hasDiscount ? Math.round(Math.abs(amount) * 1.2 * 100) / 100 : Math.abs(amount),
    status: i < 95 ? 'success' : i < 98 ? 'risk_flagged' : 'failed',
    riskReason: i >= 95 && i < 98 ? '高频充值，需人工审核' : undefined,
    createdAt: new Date(Date.now() - i * 3600000 * 2),
  };
});

export const mockScenics: ScenicSpot[] = [
  { id: 'scenic-001', name: '拙政园', district: '姑苏区', address: '苏州市姑苏区东北街178号', coverImage: 'https://picsum.photos/id/1039/400/300', maxDailyCapacity: 5000, currentVisitorCount: 3200, openTime: '07:30', closeTime: '17:30', ticketPrice: 70, isActive: true, rating: 4.8, reviewCount: 12580, tags: ['5A景区', '世界文化遗产', '园林'] },
  { id: 'scenic-002', name: '虎丘山风景名胜区', district: '姑苏区', address: '苏州市姑苏区虎丘山门内8号', coverImage: 'https://picsum.photos/id/1015/400/300', maxDailyCapacity: 8000, currentVisitorCount: 4500, openTime: '07:30', closeTime: '18:00', ticketPrice: 60, isActive: true, rating: 4.7, reviewCount: 9860, tags: ['5A景区', '历史文化', '山岳'] },
  { id: 'scenic-003', name: '周庄古镇', district: '昆山市', address: '苏州市昆山市周庄镇全福路', coverImage: 'https://picsum.photos/id/1044/400/300', maxDailyCapacity: 10000, currentVisitorCount: 6800, openTime: '08:00', closeTime: '21:00', ticketPrice: 100, isActive: true, rating: 4.6, reviewCount: 15680, tags: ['5A景区', '古镇', '水乡'] },
  { id: 'scenic-004', name: '留园', district: '姑苏区', address: '苏州市姑苏区留园路338号', coverImage: 'https://picsum.photos/id/1018/400/300', maxDailyCapacity: 3000, currentVisitorCount: 2800, openTime: '07:30', closeTime: '17:30', ticketPrice: 55, isActive: true, rating: 4.7, reviewCount: 8960, tags: ['5A景区', '世界文化遗产', '园林'] },
  { id: 'scenic-005', name: '苏州乐园森林世界', district: '虎丘区', address: '苏州市虎丘区象山路99号', coverImage: 'https://picsum.photos/id/1036/400/300', maxDailyCapacity: 15000, currentVisitorCount: 12000, openTime: '09:30', closeTime: '17:30', ticketPrice: 168, isActive: true, rating: 4.5, reviewCount: 18960, tags: ['4A景区', '主题乐园', '亲子'] },
  { id: 'scenic-006', name: '同里古镇', district: '吴江区', address: '苏州市吴江区同里镇中川路', coverImage: 'https://picsum.photos/id/1039/400/300', maxDailyCapacity: 6000, currentVisitorCount: 3500, openTime: '08:00', closeTime: '17:30', ticketPrice: 80, isActive: true, rating: 4.6, reviewCount: 11250, tags: ['5A景区', '古镇', '水乡'] },
  { id: 'scenic-007', name: '寒山寺', district: '姑苏区', address: '苏州市姑苏区寒山寺弄24号', coverImage: 'https://picsum.photos/id/1044/400/300', maxDailyCapacity: 2000, currentVisitorCount: 1800, openTime: '07:30', closeTime: '17:30', ticketPrice: 20, isActive: true, rating: 4.5, reviewCount: 7890, tags: ['4A景区', '历史文化', '寺庙'] },
  { id: 'scenic-008', name: '天平山风景名胜区', district: '吴中区', address: '苏州市吴中区木渎镇灵天路', coverImage: 'https://picsum.photos/id/1015/400/300', maxDailyCapacity: 5000, currentVisitorCount: 2200, openTime: '08:00', closeTime: '17:00', ticketPrice: 30, isActive: true, rating: 4.6, reviewCount: 6580, tags: ['4A景区', '自然风光', '山岳'] },
  { id: 'scenic-009', name: '金鸡湖景区', district: '工业园区', address: '苏州市工业园区金鸡湖路', coverImage: 'https://picsum.photos/id/1036/400/300', maxDailyCapacity: 20000, currentVisitorCount: 15000, openTime: '全天开放', closeTime: '全天开放', ticketPrice: 0, isActive: true, rating: 4.8, reviewCount: 25680, tags: ['5A景区', '城市景观', '免费'] },
  { id: 'scenic-010', name: '沙家浜风景区', district: '常熟市', address: '苏州市常熟市沙家浜镇', coverImage: 'https://picsum.photos/id/1018/400/300', maxDailyCapacity: 8000, currentVisitorCount: 4200, openTime: '08:00', closeTime: '17:30', ticketPrice: 70, isActive: true, rating: 4.5, reviewCount: 8960, tags: ['5A景区', '红色教育', '湿地'] },
];

export const mockReservations: Reservation[] = Array.from({ length: 40 }, (_, i) => ({
  id: `res-${i + 1}`,
  citizenId: `citizen-${String((i % 50) + 1).padStart(3, '0')}`,
  citizenName: ['张三', '李四', '王五', '赵六', '陈七', '周八', '吴九', '郑十'][i % 8],
  scenicId: `scenic-${String((i % 10) + 1).padStart(3, '0')}`,
  scenicName: ['拙政园', '虎丘山', '周庄古镇', '留园', '苏州乐园', '同里古镇', '寒山寺', '天平山', '金鸡湖', '沙家浜'][i % 10],
  visitorCount: (i % 5) + 1,
  timeSlot: `${['08:00-10:00', '10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-17:30'][i % 5]}`,
  status: i < 25 ? 'checked_in' : i < 35 ? 'confirmed' : 'cancelled',
  checkedInAt: i < 25 ? new Date(Date.now() - i * 3600000) : undefined,
  createdAt: new Date(Date.now() - i * 86400000),
}));

export const mockEnterprises: Enterprise[] = Array.from({ length: 20 }, (_, i) => ({
  id: `ent-${i + 1}`,
  name: `苏州${['科技', '文化', '贸易', '制造', '服务', '咨询', '设计', '教育'][i % 8]}有限公司${i + 1}`,
  unifiedSocialCreditCode: `913205${String(1000000000 + i).slice(-10)}`,
  legalPersonName: ['张三', '李四', '王五', '赵六', '陈七', '周八', '吴九', '郑十'][i % 8],
  industry: ['高新技术', '文化旅游', '商贸服务', '智能制造', '现代服务业'][i % 5],
  district: ['姑苏区', '工业园区', '虎丘区', '吴中区', '相城区', '吴江区'][i % 6],
  contactName: ['张经理', '李经理', '王经理', '赵经理', '陈经理'][i % 5],
  contactPhone: `139****${String(1000 + i).slice(-4)}`,
  verifiedStatus: i < 15 ? 'verified' : i < 18 ? 'pending' : 'rejected',
  verifiedAt: i < 15 ? new Date(`2024-${String((i % 6) + 1).padStart(2, '0')}-20`) : undefined,
  rejectReason: i >= 18 ? '材料不完整，请补充营业执照副本' : undefined,
  createdAt: new Date(`2024-${String((i % 6) + 1).padStart(2, '0')}-10`),
}));

export const mockMerchants: Merchant[] = Array.from({ length: 25 }, (_, i) => ({
  id: `merchant-${i + 1}`,
  name: `${['松鹤楼', '得月楼', '王四酒家', '黄天源', '采芝斋', '叶受和', '陆长兴', '同德兴'][i % 8]}${i > 7 ? `（分店${i}）` : ''}`,
  category: ['餐饮美食', '零售购物', '酒店住宿', '休闲娱乐', '生活服务'][i % 5],
  district: ['姑苏区', '工业园区', '虎丘区', '吴中区', '相城区'][i % 5],
  verifiedStatus: i < 20 ? 'verified' : i < 23 ? 'pending' : 'rejected',
  isActive: i < 18,
  rating: Math.round((4 + Math.random()) * 10) / 10,
  createdAt: new Date(`2024-${String((i % 6) + 1).padStart(2, '0')}-05`),
}));

export const mockAuditLogs: AuditLog[] = Array.from({ length: 60 }, (_, i) => ({
  id: `audit-${i + 1}`,
  userId: 'user-001',
  userName: '超级管理员',
  userRole: 'super_admin',
  action: ['登录', '修改市民信息', '审核企业资质', '配置熔断规则', '查看审计日志', '修改景区限流', '发布政策', '审核商户入驻'][i % 8],
  module: ['身份主干', '交通业务', '文旅业务', '企业服务', '商业服务', '系统管理'][i % 6],
  targetId: i % 3 === 0 ? `target-${i}` : undefined,
  targetType: i % 3 === 0 ? ['citizen', 'enterprise', 'merchant'][i % 3] : undefined,
  ip: `192.168.${i % 255}.${i % 255}`,
  isSensitive: i % 10 === 0,
  riskLevel: i % 15 === 0 ? 'high' : i % 5 === 0 ? 'medium' : 'low',
  createdAt: new Date(Date.now() - i * 3600000 * 6),
}));

export const mockDashboardData: DashboardData = {
  overview: {
    totalCitizens: 1258600,
    todayNewCitizens: 1258,
    totalTransactions: 8563200,
    todayTransactions: 25680,
    totalRevenue: 125860000,
    todayRevenue: 568000,
    activeUsers7d: 456800,
    citizensGrowth: 12.5,
    transactionsGrowth: 8.3,
    revenueGrowth: 15.2,
  },
  districtStats: [
    { district: '姑苏区', citizenCount: 285600, transactionCount: 1856000, revenue: 28560000 },
    { district: '工业园区', citizenCount: 256800, transactionCount: 2156000, revenue: 35680000 },
    { district: '虎丘区', citizenCount: 185600, transactionCount: 1256000, revenue: 18560000 },
    { district: '吴中区', citizenCount: 156800, transactionCount: 986000, revenue: 14560000 },
    { district: '相城区', citizenCount: 125600, transactionCount: 786000, revenue: 11560000 },
    { district: '吴江区', citizenCount: 145600, transactionCount: 856000, revenue: 12560000 },
    { district: '昆山市', citizenCount: 68600, transactionCount: 456000, revenue: 3560000 },
    { district: '常熟市', citizenCount: 58600, transactionCount: 356000, revenue: 2560000 },
    { district: '张家港市', citizenCount: 45600, transactionCount: 256000, revenue: 1560000 },
    { district: '太仓市', citizenCount: 35600, transactionCount: 186000, revenue: 1260000 },
  ],
  scenicHeatmap: [
    { scenicId: 'scenic-001', scenicName: '拙政园', district: '姑苏区', todayVisitorCount: 4850, currentVisitorCount: 3200, heatLevel: 95 },
    { scenicId: 'scenic-002', scenicName: '虎丘山', district: '姑苏区', todayVisitorCount: 6850, currentVisitorCount: 4500, heatLevel: 85 },
    { scenicId: 'scenic-003', scenicName: '周庄古镇', district: '昆山市', todayVisitorCount: 8950, currentVisitorCount: 6800, heatLevel: 90 },
    { scenicId: 'scenic-004', scenicName: '留园', district: '姑苏区', todayVisitorCount: 2950, currentVisitorCount: 2800, heatLevel: 98 },
    { scenicId: 'scenic-005', scenicName: '苏州乐园', district: '虎丘区', todayVisitorCount: 12850, currentVisitorCount: 12000, heatLevel: 80 },
    { scenicId: 'scenic-006', scenicName: '同里古镇', district: '吴江区', todayVisitorCount: 5250, currentVisitorCount: 3500, heatLevel: 58 },
    { scenicId: 'scenic-007', scenicName: '寒山寺', district: '姑苏区', todayVisitorCount: 1950, currentVisitorCount: 1800, heatLevel: 90 },
    { scenicId: 'scenic-008', scenicName: '天平山', district: '吴中区', todayVisitorCount: 2850, currentVisitorCount: 2200, heatLevel: 44 },
    { scenicId: 'scenic-009', scenicName: '金鸡湖', district: '工业园区', todayVisitorCount: 18500, currentVisitorCount: 15000, heatLevel: 75 },
    { scenicId: 'scenic-010', scenicName: '沙家浜', district: '常熟市', todayVisitorCount: 5650, currentVisitorCount: 4200, heatLevel: 52 },
  ],
  transportTopCities: [
    { cityCode: '3205', cityName: '苏州市', transactionCount: 5680000, totalAmount: 89560000 },
    { cityCode: '3202', cityName: '无锡市', transactionCount: 856000, totalAmount: 12850000 },
    { cityCode: '3204', cityName: '常州市', transactionCount: 656000, totalAmount: 9850000 },
    { cityCode: '3100', cityName: '上海市', transactionCount: 456000, totalAmount: 6850000 },
    { cityCode: '3301', cityName: '杭州市', transactionCount: 356000, totalAmount: 5350000 },
    { cityCode: '3201', cityName: '南京市', transactionCount: 256000, totalAmount: 3850000 },
    { cityCode: '3302', cityName: '宁波市', transactionCount: 156000, totalAmount: 2350000 },
    { cityCode: '3206', cityName: '南通市', transactionCount: 126000, totalAmount: 1890000 },
    { cityCode: '3203', cityName: '徐州市', transactionCount: 96000, totalAmount: 1440000 },
    { cityCode: '3210', cityName: '扬州市', transactionCount: 86000, totalAmount: 1290000 },
  ],
  weeklyTrend: Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      newCitizens: Math.floor(Math.random() * 500 + 800),
      transactions: Math.floor(Math.random() * 5000 + 20000),
      revenue: Math.floor(Math.random() * 100000 + 400000),
    };
  }),
};

export const mockFusingRules: FusingRule[] = [
  { id: 'fr-001', name: '异常充值检测', module: 'transport', ruleType: 'amount', threshold: 100000, timeWindow: 3600, action: 'review', isActive: true, description: '单卡单小时充值超过10万需人工审核' },
  { id: 'fr-002', name: '高频充值检测', module: 'transport', ruleType: 'frequency', threshold: 10, timeWindow: 3600, action: 'block', isActive: true, description: '单卡单小时充值超过10次拦截' },
  { id: 'fr-003', name: '重复核销检测', module: 'tourism', ruleType: 'duplicate', threshold: 1, timeWindow: 60, action: 'block', isActive: true, description: '同一预约码1分钟内重复核销拦截' },
  { id: 'fr-004', name: '高频预约检测', module: 'tourism', ruleType: 'frequency', threshold: 5, timeWindow: 3600, action: 'review', isActive: true, description: '同一账号1小时预约超过5次需审核' },
  { id: 'fr-005', name: '异常消费检测', module: 'transport', ruleType: 'abnormal_pattern', threshold: 50, timeWindow: 3600, action: 'block', isActive: true, description: '单卡单小时消费超过50次拦截' },
  { id: 'fr-006', name: '大额补贴检测', module: 'enterprise', ruleType: 'amount', threshold: 1000000, timeWindow: 86400, action: 'review', isActive: true, description: '单笔补贴超过100万需多级审核' },
];

let fusingRulesData = [...mockFusingRules];
let enterprisesData = [...mockEnterprises];
let merchantsData = [...mockMerchants];
let scenicsData = [...mockScenics];

export const getData = () => ({
  mockUser,
  mockCitizens,
  mockTransportCards,
  mockTransactions,
  mockScenics: scenicsData,
  mockReservations,
  mockEnterprises: enterprisesData,
  mockMerchants: merchantsData,
  mockAuditLogs,
  mockDashboardData,
  mockFusingRules: fusingRulesData,
});

export const updateFusingRuleStatus = (id: string) => {
  fusingRulesData = fusingRulesData.map((r) =>
    r.id === id ? { ...r, isActive: !r.isActive } : r
  );
  return fusingRulesData.find((r) => r.id === id);
};

export const updateEnterpriseStatus = (id: string, pass: boolean, reason?: string) => {
  enterprisesData = enterprisesData.map((e) =>
    e.id === id
      ? {
          ...e,
          verifiedStatus: pass ? 'verified' : 'rejected',
          verifiedAt: pass ? new Date() : undefined,
          rejectReason: pass ? undefined : reason,
        }
      : e
  );
  return enterprisesData.find((e) => e.id === id);
};

export const updateMerchantStatus = (id: string, pass: boolean) => {
  merchantsData = merchantsData.map((m) =>
    m.id === id
      ? {
          ...m,
          verifiedStatus: pass ? 'verified' : 'rejected',
        }
      : m
  );
  return merchantsData.find((m) => m.id === id);
};

export const updateScenicCapacity = (scenicId: string, capacity: number) => {
  scenicsData = scenicsData.map((s) =>
    s.id === scenicId ? { ...s, maxDailyCapacity: capacity } : s
  );
  return scenicsData.find((s) => s.id === scenicId);
};
