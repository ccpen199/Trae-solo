import { faker } from '@faker-js/faker/locale/zh_CN';
import type {
  Property,
  PricePoint,
  DistrictPrice,
  MarketOverview,
  AgentRiskProfile,
  PriceAlert,
  MarketHealth,
  PropertyType,
  District,
  Broker,
  VerificationNode,
  RiskLevel,
  MarketStatus,
} from '../../shared/types';

const BEIJING_DISTRICTS: Omit<District, 'id' | 'priceChange7d' | 'priceChange30d' | 'priceChange90d' | 'propertyCount'>[] = [
  { name: '朝阳区', city: '北京', area: 470.8, avgPrice: 78500, lat: 39.9219, lng: 116.4438 },
  { name: '海淀区', city: '北京', area: 430.8, avgPrice: 98600, lat: 39.9590, lng: 116.2980 },
  { name: '西城区', city: '北京', area: 50.53, avgPrice: 142000, lat: 39.9128, lng: 116.3634 },
  { name: '东城区', city: '北京', area: 41.84, avgPrice: 135000, lat: 39.9147, lng: 116.4108 },
  { name: '丰台区', city: '北京', area: 305.8, avgPrice: 62300, lat: 39.8581, lng: 116.2869 },
  { name: '通州区', city: '北京', area: 906.0, avgPrice: 51200, lat: 39.9087, lng: 116.6560 },
  { name: '昌平区', city: '北京', area: 1343.5, avgPrice: 48500, lat: 40.2200, lng: 116.2317 },
  { name: '大兴区', city: '北京', area: 1036.3, avgPrice: 46800, lat: 39.7289, lng: 116.3381 },
  { name: '顺义区', city: '北京', area: 1021.0, avgPrice: 49200, lat: 40.1290, lng: 116.6540 },
  { name: '石景山区', city: '北京', area: 85.74, avgPrice: 65700, lat: 39.9066, lng: 116.2229 },
];

const COMMUNITY_NAMES = [
  '万科城市花园', '保利中央公园', '中海国际社区', '碧桂园凤凰城',
  '恒大华府', '融创壹号院', '龙湖天街', '华润橡树湾',
  '绿地世纪城', '金地格林小镇', '阳光100', '华贸城',
  '奥林匹克花园', '珠江帝景', '富力城', '合生汇',
  '远洋天地', '首开智慧社', '城建世华龙樾', '金茂府',
];

const ORIENTATIONS = ['南北通透', '朝南', '朝东', '朝西', '朝北', '东南', '西南'];
const DECORATIONS = ['精装修', '简装修', '毛坯', '豪华装修'];
const FEATURES = [
  '近地铁', '学区房', '满五唯一', '南北通透', '采光好',
  '精装修', '拎包入住', '带车位', '电梯房', '低楼层',
  '高楼层', '中间楼层', '独门独户', '落地窗', '阳台',
  '集中供暖', '天然气', '民水民电', '物业服务好', '新小区',
];

const BROKER_COMPANIES = [
  '链家地产', '我爱我家', '中原地产', '21世纪不动产',
  '贝壳找房', '安居客', '房天下', '麦田房产',
];

const generateId = (): string => faker.string.uuid();

const generatePhone = (): string => `1${faker.string.numeric(10)}`;

const randomPick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const randomPicks = <T>(arr: T[], min: number, max: number): T[] => {
  const count = faker.number.int({ min, max });
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const generateHash = (): string => faker.string.hexadecimal({ length: 64, casing: 'lower' }).slice(2);

const getDistrictBasePrice = (districtName: string): number => {
  const district = BEIJING_DISTRICTS.find(d => d.name === districtName);
  return district ? district.avgPrice : 60000;
};

const generatePrice = (basePrice: number, type: PropertyType): { price: number; unit: 'yuan' | 'yuan/sqm' | 'yuan/month' } => {
  const variance = faker.number.float({ min: 0.7, max: 1.4 });
  if (type === 'rental') {
    const area = faker.number.int({ min: 40, max: 180 });
    return {
      price: Math.round(basePrice * area * 0.06 * variance),
      unit: 'yuan/month',
    };
  }
  if (type === 'new') {
    return {
      price: Math.round(basePrice * variance),
      unit: 'yuan/sqm',
    };
  }
  return {
    price: Math.round(basePrice * variance),
    unit: 'yuan/sqm',
  };
};

const generateVerificationNodes = (propertyId: string, isVerified: boolean): VerificationNode[] => {
  const steps = [
    { title: '房源发布', description: '经纪人提交房源信息' },
    { title: '经纪人实名认证', description: '验证经纪人身份信息及执业资质' },
    { title: '业主产权授权', description: '业主确认房源产权并授权发布' },
    { title: 'VR视频录制', description: '拍摄VR视频并嵌入防伪水印' },
    { title: '链上存证', description: '房源信息哈希上链存证' },
    { title: '数据清洗', description: '12层数据清洗引擎校验' },
    { title: '真房源认证', description: '通过真房源认证，授予认证标识' },
  ];

  let previousHash = '0'.repeat(64);
  const nodes: VerificationNode[] = [];

  const verifiedSteps = isVerified ? steps.length : faker.number.int({ min: 1, max: steps.length - 2 });

  for (let i = 0; i < verifiedSteps; i++) {
    const hash = generateHash();
    nodes.push({
      id: generateId(),
      propertyId,
      step: i + 1,
      title: steps[i].title,
      description: steps[i].description,
      status: i < verifiedSteps - 1 ? 'verified' : (isVerified ? 'verified' : 'pending'),
      operator: randomPick(['系统自动', '张审核', '李审核', '王审核']),
      timestamp: faker.date.recent({ days: 30 }).toISOString(),
      hash,
      previousHash,
      evidence: i >= 3 ? [faker.image.urlLoremFlickr({ category: 'business' })] : undefined,
    });
    previousHash = hash;
  }

  return nodes;
};

export const generatePriceHistory = (propertyId: string, basePrice: number, months: number = 6): PricePoint[] => {
  const history: PricePoint[] = [];
  let currentPrice = basePrice;

  for (let i = months; i >= 0; i--) {
    const date = faker.date.recent({ days: i * 30 });
    const change = faker.number.float({ min: -0.08, max: 0.08 });
    currentPrice = Math.round(currentPrice * (1 + change));

    history.push({
      id: generateId(),
      propertyId,
      price: currentPrice,
      date: date.toISOString().split('T')[0],
      type: randomPick(['listing', 'transaction', 'assessment']),
      source: randomPick(['链家', '贝壳', '安居客', '我爱我家', '平台自主']),
    });
  }

  return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

export const generateProperty = (override?: Partial<Property>): Property => {
  const district = randomPick(BEIJING_DISTRICTS);
  const type: PropertyType = randomPick(['secondhand', 'new', 'rental', 'overseas', 'vacation']);
  const basePrice = getDistrictBasePrice(district.name);
  const { price, unit } = generatePrice(basePrice, type);
  const area = faker.number.int({ min: 40, max: 250 });
  const bedrooms = faker.number.int({ min: 1, max: 5 });
  const bathrooms = Math.max(1, bedrooms - faker.number.int({ min: 0, max: 1 }));
  const isVerified = faker.datatype.boolean(0.75);
  const totalFloors = faker.number.int({ min: 6, max: 33 });
  const floorNum = faker.number.int({ min: 1, max: totalFloors });
  const listedAt = faker.date.recent({ days: 90 });
  const lastUpdated = faker.date.between({ from: listedAt, to: new Date() });

  const priceHistory = generatePriceHistory(generateId(), price);
  const currentPrice = priceHistory[priceHistory.length - 1]?.price || price;
  const avgDistrictPrice = district.avgPrice;
  const deviation = ((currentPrice - avgDistrictPrice) / avgDistrictPrice) * 100;

  return {
    id: generateId(),
    title: `${district.name}${randomPick(COMMUNITY_NAMES)}${bedrooms}室${bathrooms}卫`,
    type,
    status: randomPick(['pending', 'verified', 'listed', 'sold', 'flagged']),
    price: currentPrice,
    unit,
    area,
    bedrooms,
    bathrooms,
    floor: `${floorNum}/${totalFloors}`,
    totalFloors,
    orientation: randomPick(ORIENTATIONS),
    decoration: randomPick(DECORATIONS),
    yearBuilt: faker.number.int({ min: 1990, max: 2024 }),
    address: `${district.name}${faker.location.street()}${faker.number.int({ min: 1, max: 999 })}号`,
    districtId: generateId(),
    districtName: district.name,
    communityName: randomPick(COMMUNITY_NAMES),
    lat: district.lat + faker.number.float({ min: -0.05, max: 0.05 }),
    lng: district.lng + faker.number.float({ min: -0.05, max: 0.05 }),
    description: faker.lorem.paragraph({ min: 2, max: 4 }),
    images: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () =>
      faker.image.urlLoremFlickr({ category: 'house' })
    ),
    features: randomPicks(FEATURES, 3, 8),
    tags: randomPicks(['近地铁', '学区房', '满五唯一', '急售', '新上', '有钥匙', '看房方便'], 1, 4),
    brokerId: generateId(),
    brokerName: faker.person.fullName(),
    ownerId: generateId(),
    isVerified,
    verificationNodes: isVerified ? generateVerificationNodes(generateId(), isVerified) : undefined,
    priceHistory,
    currentPriceDeviation: Number(deviation.toFixed(2)),
    listedAt: listedAt.toISOString(),
    lastUpdated: lastUpdated.toISOString(),
    transactionDate: faker.datatype.boolean(0.2) ? faker.date.recent({ days: 30 }).toISOString() : undefined,
    transactionPrice: faker.datatype.boolean(0.2) ? Math.round(currentPrice * 0.95) : undefined,
    views: faker.number.int({ min: 50, max: 5000 }),
    favorites: faker.number.int({ min: 5, max: 500 }),
    inquiries: faker.number.int({ min: 0, max: 100 }),
    ...override,
  };
};

export const generateDistrictPrices = (count: number = 10): DistrictPrice[] => {
  return BEIJING_DISTRICTS.slice(0, count).map((district, index) => {
    const priceChange = faker.number.float({ min: -5, max: 5 });
    const avgPrice = Math.round(district.avgPrice * (1 + priceChange / 100));

    return {
      id: generateId(),
      districtId: `district-${index + 1}`,
      districtName: district.name,
      date: new Date().toISOString().split('T')[0],
      avgPrice,
      transactionCount: faker.number.int({ min: 20, max: 200 }),
      priceChange: Math.round(priceChange * 100) / 100,
      priceChangePercent: Math.round(priceChange * 100) / 100,
      supplyDemandRatio: Number(faker.number.float({ min: 0.8, max: 1.8 }).toFixed(2)),
    };
  });
};

export const generateMarketOverview = (): MarketOverview => {
  const types: PropertyType[] = ['secondhand', 'new', 'rental', 'overseas', 'vacation'];
  const typeNames: Record<PropertyType, string> = {
    secondhand: '二手房',
    new: '新房',
    rental: '租赁',
    overseas: '海外',
    vacation: '旅居',
  };

  const avgPriceChange7d = faker.number.float({ min: -2, max: 2 });
  const avgPriceChange30d = faker.number.float({ min: -5, max: 5 });

  return {
    city: '北京',
    date: new Date().toISOString().split('T')[0],
    totalListings: faker.number.int({ min: 50000, max: 80000 }),
    totalTransactions: faker.number.int({ min: 2000, max: 5000 }),
    avgPrice: 75600,
    avgPriceChange7d: Number(avgPriceChange7d.toFixed(2)),
    avgPriceChange30d: Number(avgPriceChange30d.toFixed(2)),
    supplyDemandRatio: Number(faker.number.float({ min: 1.0, max: 1.5 }).toFixed(2)),
    inventoryTurnoverDays: faker.number.int({ min: 45, max: 90 }),
    byType: types.map(type => ({
      type,
      count: faker.number.int({ min: 5000, max: 25000 }),
      avgPrice: type === 'rental'
        ? faker.number.int({ min: 6000, max: 15000 })
        : faker.number.int({ min: 40000, max: 120000 }),
      priceChange: Number(faker.number.float({ min: -3, max: 3 }).toFixed(2)),
    })),
    topDistricts: generateDistrictPrices(10),
    hotCommunities: Array.from({ length: 5 }, () => {
      const district = randomPick(BEIJING_DISTRICTS);
      return {
        id: generateId(),
        name: randomPick(COMMUNITY_NAMES),
        districtName: district.name,
        avgPrice: Math.round(district.avgPrice * faker.number.float({ min: 0.9, max: 1.2 })),
        priceChange: Number(faker.number.float({ min: -4, max: 4 }).toFixed(2)),
        transactionCount: faker.number.int({ min: 10, max: 50 }),
      };
    }),
  };
};

const generateRiskFactors = () => {
  const factors = [
    { factor: '虚假房源举报', weight: 0.25, description: '近30天收到虚假房源举报次数' },
    { factor: '价格异常波动', weight: 0.2, description: '挂牌价格短期内大幅调整次数' },
    { factor: '集中下架行为', weight: 0.2, description: '短时间内批量下架再上架行为' },
    { factor: '房源重复发布', weight: 0.15, description: '同一房源多次重复发布' },
    { factor: '客户投诉率', weight: 0.2, description: '客户投诉占总房源比例' },
  ];
  return factors.map(f => ({
    ...f,
    weight: Number(f.weight.toFixed(2)),
  }));
};

export const generateAgentRiskProfiles = (count: number = 10): AgentRiskProfile[] => {
  return Array.from({ length: count }, () => {
    const riskScore = faker.number.int({ min: 0, max: 100 });
    let riskLevel: RiskLevel;
    if (riskScore < 25) riskLevel = 'low';
    else if (riskScore < 50) riskLevel = 'medium';
    else if (riskScore < 75) riskLevel = 'high';
    else riskLevel = 'critical';

    const totalListings = faker.number.int({ min: 20, max: 200 });
    const flaggedListings = Math.round(totalListings * (riskScore / 200));
    const verifiedListings = Math.round(totalListings * (1 - riskScore / 200));

    return {
      id: generateId(),
      brokerId: generateId(),
      brokerName: faker.person.fullName(),
      riskScore,
      riskLevel,
      totalListings,
      flaggedListings,
      verifiedListings,
      recentActivities: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
        faker.lorem.sentence({ min: 5, max: 10 })
      ),
      lastAssessment: faker.date.recent({ days: 7 }).toISOString(),
      riskFactors: generateRiskFactors(),
    };
  });
};

export const generatePriceAlerts = (count: number = 10): PriceAlert[] => {
  const alertTypes: Array<'price_drop' | 'price_rise' | 'new_listing' | 'deviation'> = ['price_drop', 'price_rise', 'new_listing', 'deviation'];
  const targetTypes: Array<'property' | 'district' | 'community'> = ['property', 'district', 'community'];

  return Array.from({ length: count }, () => {
    const type = randomPick(alertTypes);
    const targetType = randomPick(targetTypes);
    const district = randomPick(BEIJING_DISTRICTS);

    let targetName = '';
    if (targetType === 'district') {
      targetName = district.name;
    } else if (targetType === 'community') {
      targetName = randomPick(COMMUNITY_NAMES);
    } else {
      targetName = `${district.name}${randomPick(COMMUNITY_NAMES)}`;
    }

    return {
      id: generateId(),
      userId: generateId(),
      type,
      threshold: type === 'price_drop' || type === 'price_rise'
        ? faker.number.int({ min: 3, max: 15 })
        : faker.number.int({ min: 10, max: 50 }),
      thresholdType: randomPick(['absolute', 'percentage']),
      targetType,
      targetId: generateId(),
      targetName,
      isActive: faker.datatype.boolean(0.8),
      createdAt: faker.date.recent({ days: 30 }).toISOString(),
      lastTriggeredAt: faker.datatype.boolean(0.5) ? faker.date.recent({ days: 7 }).toISOString() : undefined,
    };
  });
};

export const generateMarketHealth = (): MarketHealth => {
  const overallScore = faker.number.int({ min: 50, max: 90 });
  let status: MarketStatus;
  if (overallScore >= 80) status = 'hot';
  else if (overallScore >= 65) status = 'stable';
  else if (overallScore >= 55) status = 'cooling';
  else status = 'sluggish';

  const indicators = [
    { name: '供需平衡指数', value: Number(faker.number.float({ min: 0.8, max: 1.5 }).toFixed(2)), score: faker.number.int({ min: 60, max: 95 }), trend: randomPick(['up', 'down', 'stable'] as const) },
    { name: '价格稳定性', value: Number(faker.number.float({ min: 0.5, max: 2.0 }).toFixed(2)), score: faker.number.int({ min: 55, max: 90 }), trend: randomPick(['up', 'down', 'stable'] as const) },
    { name: '市场活跃度', value: faker.number.int({ min: 40, max: 85 }), score: faker.number.int({ min: 50, max: 90 }), trend: randomPick(['up', 'down', 'stable'] as const) },
    { name: '库存去化能力', value: faker.number.int({ min: 30, max: 90 }), score: faker.number.int({ min: 45, max: 95 }), trend: randomPick(['up', 'down', 'stable'] as const) },
    { name: '政策合规性', value: faker.number.int({ min: 70, max: 95 }), score: faker.number.int({ min: 70, max: 95 }), trend: randomPick(['up', 'down', 'stable'] as const) },
  ];

  return {
    id: generateId(),
    city: '北京',
    date: new Date().toISOString().split('T')[0],
    status,
    overallScore,
    supplyDemandRatio: Number(faker.number.float({ min: 0.9, max: 1.6 }).toFixed(2)),
    inventoryTurnoverDays: faker.number.int({ min: 40, max: 100 }),
    priceVolatilityIndex: Number(faker.number.float({ min: 0.5, max: 2.5 }).toFixed(2)),
    transactionVolume: faker.number.int({ min: 2000, max: 6000 }),
    transactionVolumeChange: Number(faker.number.float({ min: -15, max: 15 }).toFixed(2)),
    avgPrice: 75600,
    avgPriceChange: Number(faker.number.float({ min: -3, max: 3 }).toFixed(2)),
    newListings: faker.number.int({ min: 3000, max: 8000 }),
    newListingsChange: Number(faker.number.float({ min: -10, max: 10 }).toFixed(2)),
    indicators,
  };
};

export const generateBroker = (override?: Partial<Broker>): Broker => {
  return {
    id: generateId(),
    userId: generateId(),
    name: faker.person.fullName(),
    phone: generatePhone(),
    company: randomPick(BROKER_COMPANIES),
    licenseNumber: `京房经字第${faker.string.numeric(8)}号`,
    isVerified: faker.datatype.boolean(0.9),
    avatar: faker.image.avatar(),
    totalListings: faker.number.int({ min: 10, max: 150 }),
    verifiedListings: faker.number.int({ min: 8, max: 140 }),
    rating: Number(faker.number.float({ min: 3.0, max: 5.0 }).toFixed(1)),
    reviewCount: faker.number.int({ min: 5, max: 200 }),
    riskScore: faker.number.int({ min: 5, max: 70 }),
    createdAt: faker.date.past({ years: 5 }).toISOString(),
    specialties: randomPicks(['二手房', '新房', '租赁', '豪宅', '学区房', '地铁房'], 2, 4),
    districts: randomPicks(BEIJING_DISTRICTS.map(d => d.name), 1, 3),
    ...override,
  };
};

export const generateDistricts = (): District[] => {
  return BEIJING_DISTRICTS.map((district, index) => ({
    ...district,
    id: `district-${index + 1}`,
    propertyCount: faker.number.int({ min: 2000, max: 10000 }),
    priceChange7d: Number(faker.number.float({ min: -2, max: 2 }).toFixed(2)),
    priceChange30d: Number(faker.number.float({ min: -5, max: 5 }).toFixed(2)),
    priceChange90d: Number(faker.number.float({ min: -8, max: 8 }).toFixed(2)),
  }));
};
