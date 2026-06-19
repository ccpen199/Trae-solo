import type { BannerItem, CategoryItem, CouponInstance, Merchant, RecommendedCoupon, UserProfile, VerificationRecord } from '../types';

const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number): number => Math.random() * (max - min) + min;

const now = Date.now();
const oneDay = 24 * 60 * 60 * 1000;
const oneWeek = 7 * oneDay;
const twoWeeks = 14 * oneDay;
const threeWeeks = 21 * oneDay;
const oneMonth = 30 * oneDay;

export const mockBanners: BannerItem[] = [
  {
    id: '1',
    title: '沈阳市惠民消费节盛大启动',
    imageUrl: 'https://picsum.photos/id/1058/750/400',
    activityId: 'act-001'
  },
  {
    id: '2',
    title: '餐饮美食周 满200减80',
    imageUrl: 'https://picsum.photos/id/292/750/400',
    activityId: 'act-002'
  },
  {
    id: '3',
    title: '端午特惠 粽享好礼',
    imageUrl: 'https://picsum.photos/id/312/750/400',
    activityId: 'act-003'
  }
];

export const mockCategories: CategoryItem[] = [
  { id: 'all', name: '全部', icon: '🎁', color: '#1E40AF' },
  { id: 'food', name: '餐饮美食', icon: '🍜', color: '#F97316' },
  { id: 'shopping', name: '购物商超', icon: '🛒', color: '#8B5CF6' },
  { id: 'entertainment', name: '休闲娱乐', icon: '🎮', color: '#EC4899' },
  { id: 'service', name: '生活服务', icon: '🏠', color: '#10B981' },
  { id: 'travel', name: '文旅出行', icon: '✈️', color: '#06B6D4' }
];

export const mockDistricts = [
  { id: 'all', name: '全市' },
  { id: 'hunnan', name: '浑南区' },
  { id: 'heping', name: '和平区' },
  { id: 'shenhe', name: '沈河区' },
  { id: 'dadong', name: '大东区' },
  { id: 'huanggu', name: '皇姑区' },
  { id: 'tiexi', name: '铁西区' },
  { id: 'yuhong', name: '于洪区' },
  { id: 'sujiatun', name: '苏家屯区' }
];

export const mockCouponActivities = [
  {
    id: 'act-001',
    name: '沈阳市消费节通用券',
    type: 'fixed' as const,
    value: 50,
    threshold: 200,
    startTime: new Date(now - oneWeek).toISOString(),
    endTime: new Date(now + oneMonth).toISOString(),
    description: '全市通用消费券，满200元立减50元',
    applicableMerchants: ['mer-001', 'mer-002', 'mer-003', 'mer-004', 'mer-005'],
    useRules: ['单笔消费满200元可用', '不与其他优惠叠加', '每用户限领3张'],
    category: 'all',
    district: 'all'
  },
  {
    id: 'act-002',
    name: '餐饮美食专享券',
    type: 'threshold' as const,
    value: 80,
    threshold: 200,
    startTime: new Date(now - 3 * oneDay).toISOString(),
    endTime: new Date(now + twoWeeks).toISOString(),
    description: '餐饮美食周专属，满200减80',
    applicableMerchants: ['mer-001', 'mer-006', 'mer-007'],
    useRules: ['仅限餐饮类商户使用', '单笔消费满200元可用', '节假日通用'],
    category: 'food',
    district: 'all'
  },
  {
    id: 'act-003',
    name: '商超购物折扣券',
    type: 'discount' as const,
    value: 0.85,
    threshold: 0,
    startTime: new Date(now - oneDay).toISOString(),
    endTime: new Date(now + threeWeeks).toISOString(),
    description: '全市重点商超85折优惠',
    applicableMerchants: ['mer-002', 'mer-008'],
    useRules: ['单笔最高优惠200元', '烟酒特例品除外', '不限使用次数'],
    category: 'shopping',
    district: 'all'
  },
  {
    id: 'act-004',
    name: '浑南区专属券',
    type: 'fixed' as const,
    value: 30,
    threshold: 100,
    startTime: new Date(now - 2 * oneDay).toISOString(),
    endTime: new Date(now + 20 * oneDay).toISOString(),
    description: '浑南区定向发放，满100减30',
    applicableMerchants: ['mer-003', 'mer-009'],
    useRules: ['仅限浑南区商户使用', '单笔消费满100元可用', '每人限领2张'],
    category: 'all',
    district: 'hunnan'
  },
  {
    id: 'act-005',
    name: '文旅惠民券',
    type: 'fixed' as const,
    value: 100,
    threshold: 300,
    startTime: new Date(now).toISOString(),
    endTime: new Date(now + 2 * oneMonth).toISOString(),
    description: '景区门票、酒店住宿通用',
    applicableMerchants: ['mer-005', 'mer-010'],
    useRules: ['满300元可用', '可用于景区门票和酒店', '节假日通用'],
    category: 'travel',
    district: 'all'
  }
];

const generateCouponData = (activity: any, baseData: Omit<CouponInstance, 'merchantId' | 'type' | 'value' | 'threshold' | 'validStart' | 'validEnd' | 'district' | 'claimLimit' | 'totalClaimed' | 'totalUsed' | 'redemptionRate'>): CouponInstance => {
  const claimLimit = randomInt(2, 5);
  const totalClaimed = randomInt(1000, 50000);
  const totalUsed = Math.floor(totalClaimed * randomFloat(0.4, 0.8));
  const redemptionRate = Number((totalUsed / totalClaimed * 100).toFixed(1));

  return {
    ...baseData,
    merchantId: activity.applicableMerchants[0] || 'mer-001',
    type: activity.type,
    value: activity.value,
    threshold: activity.threshold,
    validStart: activity.startTime,
    validEnd: activity.endTime,
    district: activity.district !== 'all' ? activity.district : undefined,
    claimLimit,
    totalClaimed,
    totalUsed,
    redemptionRate,
    activity
  };
};

export const mockCoupons: CouponInstance[] = [
  generateCouponData(mockCouponActivities[0], {
    id: 'cou-001',
    activityId: 'act-001',
    code: 'SY2024000001',
    status: 'available',
    issuedAt: new Date(now - 2 * oneDay).toISOString(),
    expiresAt: new Date(now + oneMonth).toISOString(),
    activity: mockCouponActivities[0]
  }),
  generateCouponData(mockCouponActivities[1], {
    id: 'cou-002',
    activityId: 'act-002',
    code: 'SY2024000002',
    status: 'available',
    issuedAt: new Date(now - oneDay).toISOString(),
    expiresAt: new Date(now + twoWeeks).toISOString(),
    activity: mockCouponActivities[1]
  }),
  generateCouponData(mockCouponActivities[2], {
    id: 'cou-003',
    activityId: 'act-003',
    code: 'SY2024000003',
    status: 'available',
    issuedAt: new Date(now - 3 * oneDay).toISOString(),
    expiresAt: new Date(now + threeWeeks).toISOString(),
    activity: mockCouponActivities[2]
  }),
  generateCouponData(mockCouponActivities[0], {
    id: 'cou-004',
    activityId: 'act-001',
    code: 'SY2024000004',
    status: 'available',
    issuedAt: new Date(now - 5 * oneDay).toISOString(),
    expiresAt: new Date(now + 25 * oneDay).toISOString(),
    activity: mockCouponActivities[0]
  }),
  generateCouponData(mockCouponActivities[3], {
    id: 'cou-005',
    activityId: 'act-004',
    code: 'SY2024000005',
    status: 'available',
    issuedAt: new Date(now - oneDay).toISOString(),
    expiresAt: new Date(now + 20 * oneDay).toISOString(),
    activity: mockCouponActivities[3]
  }),
  generateCouponData(mockCouponActivities[1], {
    id: 'cou-006',
    activityId: 'act-002',
    code: 'SY2024000006',
    status: 'used',
    issuedAt: new Date(now - 10 * oneDay).toISOString(),
    expiresAt: new Date(now + oneWeek).toISOString(),
    usedAt: new Date(now - 3 * oneDay).toISOString(),
    activity: mockCouponActivities[1]
  }),
  generateCouponData(mockCouponActivities[0], {
    id: 'cou-007',
    activityId: 'act-001',
    code: 'SY2024000007',
    status: 'used',
    issuedAt: new Date(now - 15 * oneDay).toISOString(),
    expiresAt: new Date(now - 5 * oneDay).toISOString(),
    usedAt: new Date(now - 8 * oneDay).toISOString(),
    activity: mockCouponActivities[0]
  }),
  generateCouponData(mockCouponActivities[2], {
    id: 'cou-008',
    activityId: 'act-003',
    code: 'SY2024000008',
    status: 'expired',
    issuedAt: new Date(now - 2 * oneMonth).toISOString(),
    expiresAt: new Date(now - oneMonth).toISOString(),
    activity: mockCouponActivities[2]
  })
];

export const mockMerchants: Merchant[] = [
  {
    id: 'mer-001',
    name: '老边饺子馆（中街店）',
    category: 'food',
    district: 'shenhe',
    address: '沈河区中街路206号',
    location: { latitude: 41.8057, longitude: 123.4315 },
    contactPhone: '024-24865321',
    businessHours: '10:00-21:00',
    rating: 4.8,
    imageUrl: 'https://picsum.photos/id/431/300/200',
    distance: 1.2,
    couponCount: 3,
    description: '沈阳老字号，百年传承，经典东北菜'
  },
  {
    id: 'mer-002',
    name: '华润万家（奥体店）',
    category: 'shopping',
    district: 'hunnan',
    address: '浑南区营盘北街5号',
    location: { latitude: 41.7598, longitude: 123.4387 },
    contactPhone: '024-23456789',
    businessHours: '08:30-22:00',
    rating: 4.6,
    imageUrl: 'https://picsum.photos/id/225/300/200',
    distance: 3.5,
    couponCount: 2,
    description: '大型综合超市，品类齐全，品质保证'
  },
  {
    id: 'mer-003',
    name: '万达广场（浑南店）',
    category: 'shopping',
    district: 'hunnan',
    address: '浑南区全运路109号',
    location: { latitude: 41.7428, longitude: 123.4567 },
    contactPhone: '024-31234567',
    businessHours: '10:00-22:00',
    rating: 4.7,
    imageUrl: 'https://picsum.photos/id/103/300/200',
    distance: 5.8,
    couponCount: 5,
    description: '集购物、餐饮、娱乐于一体的综合商业体'
  },
  {
    id: 'mer-004',
    name: '西塔大冷面',
    category: 'food',
    district: 'heping',
    address: '和平区西塔街68号',
    location: { latitude: 41.7986, longitude: 123.4156 },
    contactPhone: '024-23467890',
    businessHours: '11:00-20:30',
    rating: 4.9,
    imageUrl: 'https://picsum.photos/id/326/300/200',
    distance: 2.3,
    couponCount: 1,
    description: '正宗朝鲜族冷面，沈阳特色美食'
  },
  {
    id: 'mer-005',
    name: '沈阳故宫博物院',
    category: 'travel',
    district: 'shenhe',
    address: '沈河区沈阳路171号',
    location: { latitude: 41.8067, longitude: 123.4489 },
    contactPhone: '024-24843001',
    businessHours: '09:00-17:00',
    rating: 4.9,
    imageUrl: 'https://picsum.photos/id/1044/300/200',
    distance: 1.8,
    couponCount: 2,
    description: '世界文化遗产，清朝开国皇宫'
  },
  {
    id: 'mer-006',
    name: '马家烧麦（太原街店）',
    category: 'food',
    district: 'heping',
    address: '和平区太原北街12号',
    location: { latitude: 41.8012, longitude: 123.4089 },
    contactPhone: '024-23836655',
    businessHours: '10:00-21:00',
    rating: 4.7,
    imageUrl: 'https://picsum.photos/id/570/300/200',
    distance: 2.8,
    couponCount: 2,
    description: '中华老字号，沈阳特色烧麦'
  },
  {
    id: 'mer-007',
    name: '韩都烤肉（西塔店）',
    category: 'food',
    district: 'heping',
    address: '和平区西塔街85号',
    location: { latitude: 41.7978, longitude: 123.4178 },
    contactPhone: '024-23478901',
    businessHours: '11:00-23:00',
    rating: 4.6,
    imageUrl: 'https://picsum.photos/id/580/300/200',
    distance: 2.5,
    couponCount: 1,
    description: '正宗韩式烤肉，新鲜食材'
  },
  {
    id: 'mer-008',
    name: '大悦城（中街店）',
    category: 'shopping',
    district: 'shenhe',
    address: '沈河区小东路6号',
    location: { latitude: 41.8078, longitude: 123.4356 },
    contactPhone: '024-24357888',
    businessHours: '10:00-22:00',
    rating: 4.8,
    imageUrl: 'https://picsum.photos/id/119/300/200',
    distance: 1.5,
    couponCount: 4,
    description: '年轻时尚购物中心，潮流品牌聚集地'
  },
  {
    id: 'mer-009',
    name: '全运路万达广场',
    category: 'shopping',
    district: 'hunnan',
    address: '浑南区全运路88号',
    location: { latitude: 41.7345, longitude: 123.4512 },
    contactPhone: '024-31345678',
    businessHours: '10:00-22:00',
    rating: 4.7,
    imageUrl: 'https://picsum.photos/id/230/300/200',
    distance: 6.2,
    couponCount: 3,
    description: '浑南新区核心商圈'
  },
  {
    id: 'mer-010',
    name: '棋盘山国际风景旅游开发区',
    category: 'travel',
    district: 'hunnan',
    address: '浑南区棋盘山国际旅游开发区',
    location: { latitude: 41.9234, longitude: 123.6789 },
    contactPhone: '024-88050808',
    businessHours: '08:30-17:30',
    rating: 4.8,
    imageUrl: 'https://picsum.photos/id/1039/300/200',
    distance: 25.5,
    couponCount: 2,
    description: '国家4A级旅游景区，自然风光秀美'
  },
  {
    id: 'mer-011',
    name: '北市场花鸟鱼虫市场',
    category: 'service',
    district: 'heping',
    address: '和平区北市一街11号',
    location: { latitude: 41.8023, longitude: 123.4234 },
    contactPhone: '024-22856789',
    businessHours: '09:00-18:00',
    rating: 4.5,
    imageUrl: 'https://picsum.photos/id/201/300/200',
    distance: 1.9,
    couponCount: 1,
    description: '百年历史的传统花鸟鱼虫市场'
  },
  {
    id: 'mer-012',
    name: '刘老根大舞台（沈阳站店）',
    category: 'entertainment',
    district: 'heping',
    address: '和平区中山路5号',
    location: { latitude: 41.7956, longitude: 123.4067 },
    contactPhone: '024-23256789',
    businessHours: '19:00-21:30',
    rating: 4.9,
    imageUrl: 'https://picsum.photos/id/160/300/200',
    distance: 3.1,
    couponCount: 2,
    description: '本山传媒旗下二人转剧场'
  }
];

export const mockRecommendedCoupons: RecommendedCoupon[] = [
  {
    activityId: 'act-001',
    activity: mockCouponActivities[0],
    score: 95,
    reason: '您常去的商家可使用',
    matchType: 'category'
  },
  {
    activityId: 'act-002',
    activity: mockCouponActivities[1],
    score: 88,
    reason: '美食爱好者专属',
    matchType: 'category'
  },
  {
    activityId: 'act-004',
    activity: mockCouponActivities[3],
    score: 82,
    reason: '您所在区域专属',
    matchType: 'district'
  },
  {
    activityId: 'act-005',
    activity: mockCouponActivities[4],
    score: 78,
    reason: '本季热门活动',
    matchType: 'trending'
  }
];

export const mockUserProfile: UserProfile = {
  userId: 'user-001',
  realName: '张惠民',
  phone: '138****1234',
  idCard: '21010***********1234',
  isVerified: true,
  avatarUrl: 'https://picsum.photos/id/64/200/200',
  totalCoupons: 12,
  usedCoupons: 8,
  totalSaved: 680.50,
  consumptionTier: 'medium',
  preferredCategories: ['food', 'shopping'],
  preferredDistricts: ['shenhe', 'hunnan']
};

export const mockVerificationHistory: VerificationRecord[] = [
  {
    id: 'ver-001',
    activityId: 'act-002',
    couponCode: 'SY2024000006',
    merchantName: '老边饺子馆（中街店）',
    originalAmount: 268.00,
    discountAmount: 80.00,
    amount: 188.00,
    verifiedAt: new Date(now - 3 * oneDay).toISOString(),
    status: 'success',
    activity: mockCouponActivities[1]
  },
  {
    id: 'ver-002',
    activityId: 'act-001',
    couponCode: 'SY2024000007',
    merchantName: '华润万家（奥体店）',
    originalAmount: 256.80,
    discountAmount: 50.00,
    amount: 206.80,
    verifiedAt: new Date(now - 8 * oneDay).toISOString(),
    status: 'success',
    activity: mockCouponActivities[0]
  },
  {
    id: 'ver-003',
    activityId: 'act-003',
    couponCode: 'SY2024000009',
    merchantName: '大悦城（中街店）',
    originalAmount: 599.00,
    discountAmount: 89.85,
    amount: 509.15,
    verifiedAt: new Date(now - 12 * oneDay).toISOString(),
    status: 'success',
    activity: mockCouponActivities[2]
  },
  {
    id: 'ver-004',
    activityId: 'act-001',
    couponCode: 'SY2024000010',
    merchantName: '西塔大冷面',
    originalAmount: 203.50,
    discountAmount: 50.00,
    amount: 153.50,
    verifiedAt: new Date(now - 15 * oneDay).toISOString(),
    status: 'success',
    activity: mockCouponActivities[0]
  },
  {
    id: 'ver-005',
    activityId: 'act-005',
    couponCode: 'SY2024000011',
    merchantName: '沈阳故宫博物院',
    originalAmount: 360.00,
    discountAmount: 100.00,
    amount: 260.00,
    verifiedAt: new Date(now - 20 * oneDay).toISOString(),
    status: 'success',
    activity: mockCouponActivities[4]
  }
];
