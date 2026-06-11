import { faker } from '@faker-js/faker/locale/zh_CN';

export type PropertyCategory = 'secondhand' | 'new' | 'rental' | 'overseas' | 'vacation';
export type PricePointType = 'listing' | 'transaction' | 'average';
export type VerificationNodeType = 'broker' | 'owner' | 'vr' | 'chain';
export type VerificationStatus = 'verified' | 'pending' | 'rejected';
export type AlertType = 'overpriced' | 'underpriced' | 'sudden_drop' | 'sudden_rise';
export type RiskLevel = 'low' | 'medium' | 'high';
export type ActivityType = 'mass_delisting' | 'price_manipulation' | 'duplicate_listing' | 'fake_info';
export type Severity = 'warning' | 'danger';
export type HealthLevel = 'healthy' | 'caution' | 'warning';
export type UserRole = 'user' | 'broker' | 'owner' | 'admin' | 'regulator';
export type SubscriptionTargetType = 'property' | 'district' | 'community';
export type ReportStatus = 'pending' | 'reviewing' | 'resolved' | 'rejected';

export interface PricePoint {
  date: string;
  price: number;
  type: PricePointType;
}

export interface VerificationNode {
  type: VerificationNodeType;
  status: VerificationStatus;
  timestamp: string;
  operator: string;
  evidence?: string;
  hash?: string;
}

export interface Property {
  id: string;
  category: PropertyCategory;
  title: string;
  price: number;
  unitPrice: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  floor: string;
  orientation: string;
  decoration: string;
  address: string;
  district: string;
  districtCode: string;
  city: string;
  coordinates: { lat: number; lng: number };
  images: string[];
  vrUrl?: string;
  description: string;
  isVerified: boolean;
  verificationChain?: VerificationNode[];
  priceHistory: PricePoint[];
  listingDate: string;
  source: string;
  brokerName?: string;
  brokerCompany?: string;
}

export interface DistrictPrice {
  districtCode: string;
  districtName: string;
  avgPrice: number;
  change7d: number;
  change30d: number;
  totalListings: number;
  coordinates: number[][];
}

export interface PriceAlert {
  id: string;
  propertyId: string;
  propertyTitle: string;
  type: AlertType;
  deviation: number;
  threshold: number;
  districtAvgPrice: number;
  createdAt: string;
}

export interface CompetitorItem {
  id: string;
  propertyId: string;
  title: string;
  distance: number;
  price: number;
  unitPrice: number;
  area: number;
  bedrooms: number;
  deviation: number;
  source: string;
}

export interface SnapshotData {
  date: string;
  district: string;
  avgPrice: number;
  totalListings: number;
  transactionVolume: number;
  priceDistribution: { range: string; count: number }[];
  topProperties: { id: string; title: string; price: number }[];
}

export interface Subscription {
  id: string;
  targetType: SubscriptionTargetType;
  targetId: string;
  targetName: string;
  priceThreshold: number;
  isActive: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  propertyId: string;
  propertyTitle: string;
  reportType: string;
  description: string;
  evidenceUrls: string[];
  status: ReportStatus;
  createdAt: string;
  resolution?: string;
}

export interface SuspiciousActivity {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  severity: Severity;
}

export interface AgentRiskProfile {
  agentId: string;
  agentName: string;
  company: string;
  riskScore: number;
  riskLevel: RiskLevel;
  suspiciousActivities: SuspiciousActivity[];
  totalListings: number;
  verifiedRate: number;
}

export interface MarketHealth {
  city: string;
  supplyDemandRatio: number;
  inventoryCycle: number;
  priceVolatility: number;
  transactionActivity: number;
  healthScore: number;
  healthLevel: HealthLevel;
}

export interface MarketOverview {
  city: string;
  category: PropertyCategory;
  totalListings: number;
  avgPrice: number;
  priceChange7d: number;
  priceChange30d: number;
  transactionVolume7d: number;
  transactionVolume30d: number;
  hotDistricts: { name: string; avgPrice: number; change7d: number }[];
  priceDistribution: { range: string; count: number; percentage: number }[];
}

export interface AdminDashboardData {
  totalUsers: number;
  totalBrokers: number;
  totalListings: number;
  pendingVerifications: number;
  pendingReports: number;
  highRiskAgents: number;
  dailyTransactions: number;
  dailyNewListings: number;
  recentReports: Report[];
  recentActivities: SuspiciousActivity[];
  marketTrend: { date: string; listings: number; transactions: number }[];
}

export interface User {
  id: string;
  phone: string;
  email?: string;
  role: UserRole;
  name: string;
  isVerified: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

const districts = [
  { code: '110101', name: '东城区' },
  { code: '110102', name: '西城区' },
  { code: '110105', name: '朝阳区' },
  { code: '110106', name: '丰台区' },
  { code: '110107', name: '石景山区' },
  { code: '110108', name: '海淀区' },
  { code: '110109', name: '门头沟区' },
  { code: '110111', name: '房山区' },
  { code: '110112', name: '通州区' },
  { code: '110113', name: '顺义区' },
  { code: '110114', name: '昌平区' },
  { code: '110115', name: '大兴区' },
  { code: '110116', name: '怀柔区' },
  { code: '110117', name: '平谷区' },
  { code: '110118', name: '密云区' },
  { code: '110119', name: '延庆区' },
];

const orientations = ['东', '南', '西', '北', '东南', '西南', '东北', '西北'];
const decorations = ['毛坯', '简装', '精装', '豪装'];
const sources = ['链家', '贝壳', '安居客', '58同城', '我爱我家', '中原地产'];
const categories: PropertyCategory[] = ['secondhand', 'new', 'rental', 'overseas', 'vacation'];

const generateRandomNormal = (mean: number, stdDev: number): number => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + stdDev * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const generatePriceHistory = (basePrice: number, days: number): PricePoint[] => {
  const history: PricePoint[] = [];
  let currentPrice = basePrice;
  const today = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const change = generateRandomNormal(0, basePrice * 0.005);
    currentPrice = Math.max(currentPrice + change, basePrice * 0.7);

    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(currentPrice),
      type: i % 10 === 0 ? 'transaction' : 'listing',
    });
  }

  history.push({
    date: today.toISOString().split('T')[0],
    price: Math.round(basePrice * (1 + (Math.random() - 0.5) * 0.05)),
    type: 'average',
  });

  return history;
};

const generateVerificationChain = (): VerificationNode[] => {
  return [
    {
      type: 'broker',
      status: 'verified',
      timestamp: faker.date.recent({ days: 30 }).toISOString(),
      operator: faker.person.fullName(),
      evidence: faker.string.uuid(),
    },
    {
      type: 'owner',
      status: 'verified',
      timestamp: faker.date.recent({ days: 25 }).toISOString(),
      operator: faker.person.fullName(),
      evidence: faker.string.uuid(),
    },
    {
      type: 'vr',
      status: 'verified',
      timestamp: faker.date.recent({ days: 20 }).toISOString(),
      operator: 'VR系统',
      evidence: faker.internet.url(),
    },
    {
      type: 'chain',
      status: 'verified',
      timestamp: faker.date.recent({ days: 15 }).toISOString(),
      operator: '区块链存证',
      hash: '0x' + faker.string.hexadecimal({ length: 40 }).substring(2),
    },
  ];
};

export const generateProperties = (count: number): Property[] => {
  const properties: Property[] = [];

  for (let i = 0; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const district = districts[Math.floor(Math.random() * districts.length)];
    const area = Math.round(generateRandomNormal(90, 30));
    const isRental = category === 'rental';
    const basePricePerSqm = isRental
      ? generateRandomNormal(80, 20)
      : generateRandomNormal(60000, 15000) * (district.code === '110101' || district.code === '110102' || district.code === '110108' ? 1.3 : 1);

    const unitPrice = Math.round(Math.abs(basePricePerSqm));
    const price = Math.round(unitPrice * area);
    const bedrooms = Math.floor(Math.random() * 4) + 1;
    const bathrooms = Math.max(1, bedrooms - 1);
    const isVerified = Math.random() > 0.2;

    properties.push({
      id: faker.string.uuid(),
      category,
      title: `${district.name} ${bedrooms}室${bathrooms}卫 ${faker.lorem.words({ min: 2, max: 4 })}`,
      price,
      unitPrice,
      area: Math.max(30, area),
      bedrooms,
      bathrooms,
      floor: `${Math.floor(Math.random() * 30) + 1}/${Math.floor(Math.random() * 10) + 30}层`,
      orientation: orientations[Math.floor(Math.random() * orientations.length)],
      decoration: decorations[Math.floor(Math.random() * decorations.length)],
      address: `${district.name}${faker.location.street()}${Math.floor(Math.random() * 100) + 1}号`,
      district: district.name,
      districtCode: district.code,
      city: '北京市',
      coordinates: {
        lat: 39.9 + (Math.random() - 0.5) * 0.4,
        lng: 116.4 + (Math.random() - 0.5) * 0.4,
      },
      images: Array.from({ length: Math.floor(Math.random() * 5) + 3 }, () =>
        `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('现代简约风格客厅装修 房产照片 真实感')}&image_size=square_hd`
      ),
      vrUrl: Math.random() > 0.5 ? faker.internet.url() : undefined,
      description: faker.lorem.paragraph({ min: 3, max: 5 }),
      isVerified,
      verificationChain: isVerified ? generateVerificationChain() : undefined,
      priceHistory: generatePriceHistory(price, Math.floor(Math.random() * 150) + 30),
      listingDate: faker.date.recent({ days: 180 }).toISOString().split('T')[0],
      source: sources[Math.floor(Math.random() * sources.length)],
      brokerName: faker.person.fullName(),
      brokerCompany: faker.company.name(),
    });
  }

  return properties;
};

export const generateDistrictPrices = (): DistrictPrice[] => {
  return districts.map((district) => {
    const basePrice = district.code === '110101' || district.code === '110102'
      ? 120000
      : district.code === '110108' || district.code === '110105'
      ? 90000
      : 60000;

    const avgPrice = Math.round(basePrice * (1 + (Math.random() - 0.5) * 0.2));
    const change7d = parseFloat(((Math.random() - 0.5) * 5).toFixed(2));
    const change30d = parseFloat(((Math.random() - 0.5) * 10).toFixed(2));

    const centerLat = 39.9 + (Math.random() - 0.5) * 0.2;
    const centerLng = 116.4 + (Math.random() - 0.5) * 0.2;
    const radius = 0.05 + Math.random() * 0.05;

    return {
      districtCode: district.code,
      districtName: district.name,
      avgPrice,
      change7d,
      change30d,
      totalListings: Math.floor(Math.random() * 500) + 50,
      coordinates: [
        [centerLng - radius, centerLat - radius],
        [centerLng + radius, centerLat - radius],
        [centerLng + radius, centerLat + radius],
        [centerLng - radius, centerLat + radius],
        [centerLng - radius, centerLat - radius],
      ],
    };
  });
};

export const generatePriceAlerts = (properties: Property[], count: number): PriceAlert[] => {
  const alerts: PriceAlert[] = [];
  const alertTypes: AlertType[] = ['overpriced', 'underpriced', 'sudden_drop', 'sudden_rise'];

  for (let i = 0; i < count; i++) {
    const property = properties[Math.floor(Math.random() * properties.length)];
    const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const deviation = parseFloat(((Math.random() * 20) + 15).toFixed(2));
    const districtAvg = property.unitPrice * (1 + (Math.random() - 0.5) * 0.1);

    alerts.push({
      id: faker.string.uuid(),
      propertyId: property.id,
      propertyTitle: property.title,
      type,
      deviation,
      threshold: 15,
      districtAvgPrice: Math.round(districtAvg),
      createdAt: faker.date.recent({ days: 7 }).toISOString(),
    });
  }

  return alerts;
};

export const generateCompetitorMatrix = (property: Property, radius: number = 3): CompetitorItem[] => {
  const competitors: CompetitorItem[] = [];
  const count = Math.floor(Math.random() * 8) + 5;

  for (let i = 0; i < count; i++) {
    const distance = parseFloat((Math.random() * radius).toFixed(2));
    const priceDeviation = (Math.random() - 0.5) * 0.3;
    const area = property.area * (1 + (Math.random() - 0.5) * 0.2);
    const unitPrice = property.unitPrice * (1 + priceDeviation);

    competitors.push({
      id: faker.string.uuid(),
      propertyId: faker.string.uuid(),
      title: `${property.district} ${Math.floor(Math.random() * 4) + 1}室${Math.floor(Math.random() * 2) + 1}卫 优质房源`,
      distance,
      price: Math.round(unitPrice * area),
      unitPrice: Math.round(unitPrice),
      area: Math.round(area),
      bedrooms: Math.floor(Math.random() * 4) + 1,
      deviation: parseFloat((priceDeviation * 100).toFixed(2)),
      source: sources[Math.floor(Math.random() * sources.length)],
    });
  }

  return competitors.sort((a, b) => a.distance - b.distance);
};

export const generateTimeMachineSnapshot = (date: string, districtName: string): SnapshotData => {
  const snapshotDate = new Date(date);
  const yearsAgo = (new Date().getTime() - snapshotDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  const priceMultiplier = Math.max(0.4, 1 - yearsAgo * 0.1);

  const basePrice = (districtName === '东城区' || districtName === '西城区' ? 80000 : 50000) * priceMultiplier;

  return {
    date,
    district: districtName,
    avgPrice: Math.round(basePrice * (1 + (Math.random() - 0.5) * 0.1)),
    totalListings: Math.floor(Math.random() * 300) + 100,
    transactionVolume: Math.floor(Math.random() * 50) + 10,
    priceDistribution: [
      { range: '300万以下', count: Math.floor(Math.random() * 50) + 20 },
      { range: '300-500万', count: Math.floor(Math.random() * 80) + 40 },
      { range: '500-800万', count: Math.floor(Math.random() * 60) + 30 },
      { range: '800-1000万', count: Math.floor(Math.random() * 40) + 15 },
      { range: '1000万以上', count: Math.floor(Math.random() * 30) + 5 },
    ],
    topProperties: Array.from({ length: 5 }, () => ({
      id: faker.string.uuid(),
      title: `${districtName} 优质${Math.floor(Math.random() * 3) + 2}居室`,
      price: Math.round(basePrice * (80 + Math.random() * 40)),
    })),
  };
};

export const generateSubscriptions = (count: number): Subscription[] => {
  const targetTypes: SubscriptionTargetType[] = ['property', 'district', 'community'];
  const subscriptions: Subscription[] = [];

  for (let i = 0; i < count; i++) {
    const type = targetTypes[Math.floor(Math.random() * targetTypes.length)];
    subscriptions.push({
      id: faker.string.uuid(),
      targetType: type,
      targetId: faker.string.uuid(),
      targetName: type === 'district'
        ? districts[Math.floor(Math.random() * districts.length)].name
        : type === 'community'
        ? `${faker.location.city()}小区`
        : `${districts[Math.floor(Math.random() * districts.length)].name} 房源`,
      priceThreshold: parseFloat(((Math.random() * 10) + 2).toFixed(2)),
      isActive: Math.random() > 0.2,
      createdAt: faker.date.recent({ days: 90 }).toISOString(),
    });
  }

  return subscriptions;
};

export const generateReports = (properties: Property[], count: number): Report[] => {
  const reports: Report[] = [];
  const statuses: ReportStatus[] = ['pending', 'reviewing', 'resolved', 'rejected'];
  const reportTypes = ['虚假房源', '价格欺诈', '图片不实', '信息不全', '违规发布'];

  for (let i = 0; i < count; i++) {
    const property = properties[Math.floor(Math.random() * properties.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    reports.push({
      id: faker.string.uuid(),
      propertyId: property.id,
      propertyTitle: property.title,
      reportType: reportTypes[Math.floor(Math.random() * reportTypes.length)],
      description: faker.lorem.paragraph(),
      evidenceUrls: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => faker.internet.url()),
      status,
      createdAt: faker.date.recent({ days: 30 }).toISOString(),
      resolution: status === 'resolved' || status === 'rejected' ? faker.lorem.sentence() : undefined,
    });
  }

  return reports;
};

export const generateAgentRisks = (count: number): AgentRiskProfile[] => {
  const agents: AgentRiskProfile[] = [];
  const riskLevels: RiskLevel[] = ['low', 'medium', 'high'];
  const activityTypes: ActivityType[] = ['mass_delisting', 'price_manipulation', 'duplicate_listing', 'fake_info'];
  const severities: Severity[] = ['warning', 'danger'];

  for (let i = 0; i < count; i++) {
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    const riskScore = riskLevel === 'low'
      ? Math.floor(Math.random() * 30)
      : riskLevel === 'medium'
      ? Math.floor(Math.random() * 40) + 30
      : Math.floor(Math.random() * 30) + 70;

    const activityCount = riskLevel === 'low' ? 0 : riskLevel === 'medium' ? 1 : Math.floor(Math.random() * 3) + 2;
    const activities: SuspiciousActivity[] = [];

    for (let j = 0; j < activityCount; j++) {
      activities.push({
        id: faker.string.uuid(),
        type: activityTypes[Math.floor(Math.random() * activityTypes.length)],
        description: faker.lorem.sentence(),
        timestamp: faker.date.recent({ days: 30 }).toISOString(),
        severity: severities[Math.floor(Math.random() * severities.length)],
      });
    }

    agents.push({
      agentId: faker.string.uuid(),
      agentName: faker.person.fullName(),
      company: faker.company.name(),
      riskScore,
      riskLevel,
      suspiciousActivities: activities,
      totalListings: Math.floor(Math.random() * 200) + 20,
      verifiedRate: parseFloat((1 - riskScore / 200).toFixed(2)),
    });
  }

  return agents;
};

export const generateMarketHealth = (): MarketHealth => {
  const supplyDemandRatio = parseFloat((0.8 + Math.random() * 0.6).toFixed(2));
  const inventoryCycle = parseFloat((3 + Math.random() * 9).toFixed(1));
  const priceVolatility = parseFloat((Math.random() * 5).toFixed(2));
  const transactionActivity = parseFloat((0.5 + Math.random() * 0.5).toFixed(2));

  const healthScore = Math.round(
    (1 - Math.abs(supplyDemandRatio - 1) * 0.5) * 25 +
    (1 - inventoryCycle / 12) * 25 +
    (1 - priceVolatility / 10) * 25 +
    transactionActivity * 25
  );

  const healthLevel = healthScore >= 75 ? 'healthy' : healthScore >= 50 ? 'caution' : 'warning';

  return {
    city: '北京市',
    supplyDemandRatio,
    inventoryCycle,
    priceVolatility,
    transactionActivity,
    healthScore,
    healthLevel,
  };
};

export const generateMarketOverview = (category: PropertyCategory): MarketOverview => {
  const isRental = category === 'rental';
  const basePrice = isRental ? 70 : 65000;

  const hotDistricts = districts
    .slice(0, 6)
    .map((d) => ({
      name: d.name,
      avgPrice: Math.round(basePrice * (d.code === '110101' || d.code === '110102' ? 1.5 : 1) * (1 + (Math.random() - 0.5) * 0.1)),
      change7d: parseFloat(((Math.random() - 0.5) * 4).toFixed(2)),
    }));

  const totalListings = Math.floor(Math.random() * 5000) + 1000;

  return {
    city: '北京市',
    category,
    totalListings,
    avgPrice: Math.round(basePrice * (1 + (Math.random() - 0.5) * 0.1)),
    priceChange7d: parseFloat(((Math.random() - 0.5) * 3).toFixed(2)),
    priceChange30d: parseFloat(((Math.random() - 0.5) * 6).toFixed(2)),
    transactionVolume7d: Math.floor(Math.random() * 200) + 50,
    transactionVolume30d: Math.floor(Math.random() * 800) + 200,
    hotDistricts,
    priceDistribution: [
      { range: isRental ? '3000以下' : '300万以下', count: Math.floor(totalListings * 0.25), percentage: 25 },
      { range: isRental ? '3000-5000' : '300-500万', count: Math.floor(totalListings * 0.35), percentage: 35 },
      { range: isRental ? '5000-8000' : '500-800万', count: Math.floor(totalListings * 0.25), percentage: 25 },
      { range: isRental ? '8000-10000' : '800-1000万', count: Math.floor(totalListings * 0.1), percentage: 10 },
      { range: isRental ? '10000以上' : '1000万以上', count: Math.floor(totalListings * 0.05), percentage: 5 },
    ],
  };
};

export const generateAdminDashboard = (reports: Report[]): AdminDashboardData => {
  const today = new Date();
  const marketTrend = [];

  for (let i = 14; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    marketTrend.push({
      date: date.toISOString().split('T')[0],
      listings: Math.floor(Math.random() * 200) + 100,
      transactions: Math.floor(Math.random() * 80) + 20,
    });
  }

  return {
    totalUsers: Math.floor(Math.random() * 5000) + 1000,
    totalBrokers: Math.floor(Math.random() * 200) + 50,
    totalListings: Math.floor(Math.random() * 10000) + 5000,
    pendingVerifications: Math.floor(Math.random() * 50) + 10,
    pendingReports: reports.filter(r => r.status === 'pending' || r.status === 'reviewing').length,
    highRiskAgents: Math.floor(Math.random() * 10) + 2,
    dailyTransactions: Math.floor(Math.random() * 100) + 30,
    dailyNewListings: Math.floor(Math.random() * 200) + 50,
    recentReports: reports.slice(0, 5),
    recentActivities: Array.from({ length: 5 }, () => ({
      id: faker.string.uuid(),
      type: 'price_manipulation' as ActivityType,
      description: faker.lorem.sentence(),
      timestamp: faker.date.recent({ days: 1 }).toISOString(),
      severity: 'warning' as Severity,
    })),
    marketTrend,
  };
};

export const mockProperties: Property[] = generateProperties(100);
export const mockDistrictPrices: DistrictPrice[] = generateDistrictPrices();
export const mockPriceAlerts: PriceAlert[] = generatePriceAlerts(mockProperties, 20);
export const mockSubscriptions: Subscription[] = generateSubscriptions(8);
export const mockReports: Report[] = generateReports(mockProperties, 15);
export const mockAgentRisks: AgentRiskProfile[] = generateAgentRisks(12);
export const mockMarketHealth: MarketHealth = generateMarketHealth();
export const mockMarketOverview: { [key in PropertyCategory]: MarketOverview } = {
  secondhand: generateMarketOverview('secondhand'),
  new: generateMarketOverview('new'),
  rental: generateMarketOverview('rental'),
  overseas: generateMarketOverview('overseas'),
  vacation: generateMarketOverview('vacation'),
};
export const mockAdminDashboard: AdminDashboardData = generateAdminDashboard(mockReports);

export const mockUser: User = {
  id: faker.string.uuid(),
  phone: '13800138000',
  email: 'user@example.com',
  role: 'user',
  name: '张三',
  isVerified: true,
};

export const mockAdminUser: User = {
  id: faker.string.uuid(),
  phone: '13900139000',
  email: 'admin@example.com',
  role: 'admin',
  name: '管理员',
  isVerified: true,
};
