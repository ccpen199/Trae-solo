import type {
  ServiceGrid,
  ServiceProvider,
  VirtualResource,
  StarLevelRule,
  CompensationRule,
  GrowthMetrics,
  Dispute,
  Review,
  ServiceCategory,
} from '@/types';

const CITY_CENTER = { lat: 31.2304, lng: 121.4737 };

const genReviews = (seed: number): Review[] => {
  const samples = [
    { content: '师傅非常专业，提前到达，干活细致！', tags: ['准时', '专业', '干净'] },
    { content: '服务态度很好，问题处理得很满意。', tags: ['态度好', '满意'] },
    { content: '性价比高，以后还会选择这家。', tags: ['性价比高', '回头客'] },
    { content: '响应速度快，约好时间很快就来了。', tags: ['响应快', '准时'] },
    { content: '整体不错，细节处理也到位。', tags: ['细致', '推荐'] },
  ];
  return samples.slice(0, 3 + (seed % 2)).map((s, i) => ({
    id: `r-${seed}-${i}`,
    userName: ['王女士', '李先生', '张阿姨', '陈先生', '刘小姐'][i],
    rating: 4.5 + (i % 2) * 0.5,
    content: s.content,
    date: `2026-0${1 + (i % 6)}-${10 + i * 3}`,
    tags: s.tags,
  }));
};

export const mockGrids = Array.from({ length: 25 }, (_, i) => {
  const row = Math.floor(i / 5);
  const col = i % 5;
  const latOffset = (row - 2) * 0.0045;
  const lngOffset = (col - 2) * 0.0055;
  const categories: ServiceCategory[] = ['餐饮', '家政', '维修', '快递', '保洁', '搬家', '美容', '教育'];
  const selectedCats = categories.filter((_, idx) => (i + idx) % 3 === 0).slice(0, 4);
  return {
    id: `grid-${i}`,
    code: `G${String(row + 1).padStart(2, '0')}${String(col + 1).padStart(2, '0')}`,
    name: ['人民广场', '南京东路', '陆家嘴', '静安寺', '徐家汇', '淮海路', '五角场', '四川北路', '中山公园', '虹桥'][i % 10] + '片区',
    center: {
      lat: CITY_CENTER.lat + latOffset,
      lng: CITY_CENTER.lng + lngOffset,
    },
    bounds: [
      CITY_CENTER.lat + latOffset - 0.00225,
      CITY_CENTER.lng + lngOffset - 0.00275,
      CITY_CENTER.lat + latOffset + 0.00225,
      CITY_CENTER.lng + lngOffset + 0.00275,
    ],
    categories: selectedCats.length > 0 ? selectedCats : (['餐饮', '家政'] as ServiceCategory[]),
    providerIds: [],
    heatLevel: 1 + (i * 7) % 5,
  };
}) as ServiceGrid[];

const providerNames = [
  { name: '洁净家家政', cat: '家政' as const },
  { name: '快修侠家电维修', cat: '维修' as const },
  { name: '顺风快递驿站', cat: '快递' as const },
  { name: '川香阁私房菜', cat: '餐饮' as const },
  { name: '美之约美容SPA', cat: '美容' as const },
  { name: '金牌搬家服务', cat: '搬家' as const },
  { name: '名师一对一教育', cat: '教育' as const },
  { name: '亮洁保洁服务', cat: '保洁' as const },
  { name: '老上海本帮菜', cat: '餐饮' as const },
  { name: '无忧家政服务', cat: '家政' as const },
  { name: '速达家电维修', cat: '维修' as const },
  { name: '韵达快递代收点', cat: '快递' as const },
  { name: '清雅美容会所', cat: '美容' as const },
  { name: '安心搬家公司', cat: '搬家' as const },
  { name: '启智教育培训', cat: '教育' as const },
  { name: '净新保洁中心', cat: '保洁' as const },
  { name: '粤味轩茶餐厅', cat: '餐饮' as const },
  { name: '邻里家政互助', cat: '家政' as const },
  { name: '精诚家电修理', cat: '维修' as const },
  { name: '中通快递网点', cat: '快递' as const },
];

export const mockProviders: ServiceProvider[] = providerNames.map((p, i) => {
  const gridIdx = i % mockGrids.length;
  const grid = mockGrids[gridIdx];
  const starLevel = ((i % 5) + 1) as 1 | 2 | 3 | 4 | 5;
  const goodRate = 0.8 + (starLevel * 0.032) + (i % 3) * 0.01;
  const responseSpeed = 60 - starLevel * 10 - (i % 3) * 5;
  const orderCount = 50 + starLevel * 400 + i * 20;
  const trafficWeight = [0.6, 0.8, 1.0, 1.3, 1.8][starLevel - 1];
  mockGrids[gridIdx].providerIds.push(`p-${i}`);
  return {
    id: `p-${i}`,
    name: p.name,
    avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(p.name)}&backgroundColor=${['FF6B35', '0A2540', '2DD4A8', '8FAAD1'][i % 4]}`,
    category: p.cat,
    gridId: grid.id,
    location: grid.center,
    address: grid.name + `${(i % 99) + 1}号`,
    starLevel,
    orderCount,
    goodRate: Math.round(goodRate * 100) / 100,
    responseSpeed,
    trafficWeight,
    description: `${p.name}成立于2020年，专业${p.cat}服务，拥有资深团队，服务千家万户。`,
    priceRange: ['¥50-200', '¥80-500', '¥10-30', '¥30-150', '¥100-1000', '¥200-2000', '¥150-500/时', '¥25-80/时'][i % 8],
    reviews: genReviews(i),
  };
});

export const mockVirtualResources: VirtualResource[] = [
  {
    id: 'vr-1',
    type: 'ar_clothing',
    title: '春夏新款优雅连衣裙',
    thumbnail: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
    resourceUrl: '',
    providerId: 'p-4',
    providerName: '美之约美容SPA',
    price: '¥599',
    tags: ['新品', '显瘦', '通勤'],
  },
  {
    id: 'vr-2',
    type: 'ar_clothing',
    title: '商务休闲西装外套',
    thumbnail: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600',
    resourceUrl: '',
    providerId: 'p-12',
    providerName: '清雅美容会所',
    price: '¥1299',
    tags: ['商务', '韩版', '修身'],
  },
  {
    id: 'vr-3',
    type: 'vr_house',
    title: '陆家嘴精装两室一厅',
    thumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
    resourceUrl: '',
    providerId: 'p-3',
    providerName: '川香阁私房菜',
    address: '陆家嘴环路1000号',
    price: '¥9800/月',
    tags: ['近地铁', '精装修', '拎包入住'],
  },
  {
    id: 'vr-4',
    type: 'vr_house',
    title: '静安寺电梯三居室',
    thumbnail: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    resourceUrl: '',
    providerId: 'p-8',
    providerName: '老上海本帮菜',
    address: '南京西路1266号',
    price: '¥15800/月',
    tags: ['学区房', '电梯房', '南北通'],
  },
  {
    id: 'vr-5',
    type: 'shop_360',
    title: '川香阁·正宗川菜体验',
    thumbnail: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800',
    resourceUrl: '',
    providerId: 'p-3',
    providerName: '川香阁私房菜',
    address: '人民广场227号',
    tags: ['川菜', '网红店', '聚餐'],
  },
  {
    id: 'vr-6',
    type: 'shop_360',
    title: '老上海本帮菜·怀旧味道',
    thumbnail: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
    resourceUrl: '',
    providerId: 'p-8',
    providerName: '老上海本帮菜',
    address: '南京东路88号',
    tags: ['本帮菜', '老字号', '环境优雅'],
  },
];

export const mockStarRules: StarLevelRule[] = [
  { star: 1, orderCount: 50, goodRate: 0.80, responseSpeed: 60, trafficWeight: 0.6, privileges: ['基础流量曝光'] },
  { star: 2, orderCount: 200, goodRate: 0.85, responseSpeed: 45, trafficWeight: 0.8, privileges: ['基础流量曝光', '搜索加权'] },
  { star: 3, orderCount: 500, goodRate: 0.90, responseSpeed: 30, trafficWeight: 1.0, privileges: ['基础流量曝光', '搜索加权', '首页推荐资格'] },
  { star: 4, orderCount: 1000, goodRate: 0.93, responseSpeed: 20, trafficWeight: 1.3, privileges: ['基础流量曝光', '搜索加权', '首页推荐资格', '专属客服', '平台活动优先'] },
  { star: 5, orderCount: 2000, goodRate: 0.96, responseSpeed: 10, trafficWeight: 1.8, privileges: ['基础流量曝光', '搜索加权', '首页推荐资格', '专属客服', '平台活动优先', '品牌标识认证', '最高流量权重'] },
];

export const mockCompensationRules: CompensationRule[] = [
  { type: 'service_quality', typeLabel: '服务质量问题', ratio: '30%-100%', maxAmount: 2000, description: '服务未达标、与描述不符等质量问题，按比例赔偿服务费用' },
  { type: 'delay', typeLabel: '服务延误', ratio: '每小时10%', maxAmount: 500, description: '服务商未按约定时间到达或完成，按延误时长计算赔偿' },
  { type: 'overcharge', typeLabel: '乱收费', ratio: '超额+20%', maxAmount: 1000, description: '未明码标价、额外收费，退还超额部分并补偿20%' },
  { type: 'damage', typeLabel: '物品损坏', ratio: '定损金额', maxAmount: 5000, description: '服务过程中造成用户物品损坏，按定损金额赔偿' },
];

export const mockGrowthMetrics: GrowthMetrics = {
  providerId: 'p-1',
  orderTrend: [
    { date: '1月', value: 42 },
    { date: '2月', value: 58 },
    { date: '3月', value: 75 },
    { date: '4月', value: 92 },
    { date: '5月', value: 118 },
    { date: '6月', value: 145 },
  ],
  rateTrend: [
    { date: '1月', value: 86 },
    { date: '2月', value: 88 },
    { date: '3月', value: 90 },
    { date: '4月', value: 91 },
    { date: '5月', value: 93 },
    { date: '6月', value: 95 },
  ],
  speedTrend: [
    { date: '1月', value: 45 },
    { date: '2月', value: 40 },
    { date: '3月', value: 35 },
    { date: '4月', value: 30 },
    { date: '5月', value: 22 },
    { date: '6月', value: 15 },
  ],
  radar: [
    { dimension: '服务质量', value: 92, fullMark: 100 },
    { dimension: '响应速度', value: 88, fullMark: 100 },
    { dimension: '准时履约', value: 95, fullMark: 100 },
    { dimension: '用户评价', value: 90, fullMark: 100 },
    { dimension: '投诉率', value: 96, fullMark: 100 },
  ],
};

export const mockDisputes: Dispute[] = [
  {
    id: 'd-1',
    orderId: 'ORD-2026-0615-001',
    type: 'service_quality',
    typeLabel: '服务质量问题',
    description: '家电清洗后仍有异味，清洁不彻底，多处污渍未处理。',
    evidences: [
      { id: 'e-1', type: 'image', url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300', name: '清洗前后对比.jpg' },
      { id: 'e-2', type: 'image', url: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=300', name: '残留污渍特写.jpg' },
    ],
    status: 'reviewing',
    statusLabel: '客服审核中',
    compensationStandard: '服务质量问题 · 赔付比例50%',
    compensationAmount: 150,
    result: '平台客服已介入，正在与服务商沟通核实',
    createdAt: '2026-06-15 14:30',
    csAgent: '客服小王',
  },
  {
    id: 'd-2',
    orderId: 'ORD-2026-0610-008',
    type: 'delay',
    typeLabel: '服务延误',
    description: '约定上午9点到家，结果下午2点才到，延误5小时。',
    evidences: [
      { id: 'e-3', type: 'image', url: 'https://images.unsplash.com/photo-1501139083538-0139583c060f?w=300', name: '聊天记录截图.png' },
    ],
    status: 'resolved',
    statusLabel: '已完成仲裁',
    compensationStandard: '服务延误 · 每小时10%，共计50%',
    compensationAmount: 90,
    result: '已按标准赔付 ¥90，款项1-3个工作日到账',
    createdAt: '2026-06-10 10:15',
    csAgent: '客服小李',
  },
];

export const CITIES = ['上海市', '北京市', '广州市', '深圳市', '杭州市', '成都市', '武汉市', '南京市'];

export const CURRENT_CITY = '上海市';
export const CURRENT_LOCATION = CITY_CENTER;
export const CURRENT_GRID_CODE = 'G0303';
