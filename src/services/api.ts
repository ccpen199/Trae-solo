import axios from 'axios';
import {
  Property,
  PropertyCategory,
  PricePoint,
  MarketOverview,
  DistrictPrice,
  PriceAlert,
  CompetitorItem,
  SnapshotData,
  Subscription,
  Report,
  AdminDashboardData,
  AgentRiskProfile,
  MarketHealth,
  LoginResponse,
  TransactionRecord,
  PriceBracketVolume,
  HousingTypeDistribution,
  TransactionStats,
  PriceForecastData,
  DistrictComparisonItem,
  CompetitorAnalysis,
  mockProperties,
  mockDistrictPrices,
  mockPriceAlerts,
  mockSubscriptions,
  mockReports,
  mockAgentRisks,
  mockMarketHealth,
  mockMarketOverview,
  mockAdminDashboard,
  mockUser,
  mockAdminUser,
  generateCompetitorMatrix,
  generateTimeMachineSnapshot,
  generateTransactionRecords,
  generatePriceBracketVolumes,
  generateHousingTypeDistribution,
  generateTransactionStats,
  generatePriceForecast,
  generateDistrictComparison,
  generateCompetitorAnalysis,
  enhanceCompetitorMatrix,
} from '@/mock/data';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface GetPropertiesParams {
  category?: PropertyCategory;
  page?: number;
  pageSize?: number;
  filters?: {
    priceMin?: number;
    priceMax?: number;
    areaMin?: number;
    areaMax?: number;
    bedrooms?: number[];
    district?: string;
    isVerified?: boolean;
  };
}

interface GetPropertiesResponse {
  data: Property[];
  total: number;
  page: number;
  pageSize: number;
}

export const getProperties = async (params: GetPropertiesParams = {}): Promise<GetPropertiesResponse> => {
  await delay(300 + Math.random() * 500);

  let filtered = [...mockProperties];

  if (params.category) {
    filtered = filtered.filter(p => p.category === params.category);
  }

  if (params.filters) {
    const { priceMin, priceMax, areaMin, areaMax, bedrooms, district, isVerified } = params.filters;

    if (priceMin !== undefined) {
      filtered = filtered.filter(p => p.price >= priceMin);
    }
    if (priceMax !== undefined) {
      filtered = filtered.filter(p => p.price <= priceMax);
    }
    if (areaMin !== undefined) {
      filtered = filtered.filter(p => p.area >= areaMin);
    }
    if (areaMax !== undefined) {
      filtered = filtered.filter(p => p.area <= areaMax);
    }
    if (bedrooms && bedrooms.length > 0) {
      filtered = filtered.filter(p => bedrooms.includes(p.bedrooms));
    }
    if (district) {
      filtered = filtered.filter(p => p.district === district);
    }
    if (isVerified !== undefined) {
      filtered = filtered.filter(p => p.isVerified === isVerified);
    }
  }

  const page = params.page || 1;
  const pageSize = params.pageSize || 20;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return {
    data: filtered.slice(startIndex, endIndex),
    total: filtered.length,
    page,
    pageSize,
  };
};

export const getProperty = async (id: string): Promise<Property> => {
  await delay(200 + Math.random() * 300);

  const property = mockProperties.find(p => p.id === id);
  if (!property) {
    throw new Error('房源不存在');
  }
  return property;
};

interface GetPriceHistoryParams {
  id: string;
  range?: '30d' | '90d' | '180d' | 'all';
}

export const getPropertyPriceHistory = async (params: GetPriceHistoryParams): Promise<PricePoint[]> => {
  await delay(200 + Math.random() * 300);

  const property = mockProperties.find(p => p.id === params.id);
  if (!property) {
    throw new Error('房源不存在');
  }

  let history = [...property.priceHistory];

  if (params.range && params.range !== 'all') {
    const days = params.range === '30d' ? 30 : params.range === '90d' ? 90 : 180;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    history = history.filter(p => new Date(p.date) >= cutoffDate);
  }

  return history;
};

interface GetMarketOverviewParams {
  city?: string;
  category?: PropertyCategory;
}

export const getMarketOverview = async (params: GetMarketOverviewParams = {}): Promise<MarketOverview> => {
  await delay(300 + Math.random() * 500);

  const category = params.category || 'secondhand';
  return mockMarketOverview[category];
};

interface GetDistrictPricesParams {
  city?: string;
  category?: PropertyCategory;
  timeRange?: '7d' | '30d' | '90d';
}

export const getDistrictPrices = async (params: GetDistrictPricesParams = {}): Promise<DistrictPrice[]> => {
  await delay(300 + Math.random() * 500);

  return mockDistrictPrices;
};

interface GetPriceComparisonParams {
  propertyId: string;
  range?: number;
}

export const getPriceComparison = async (params: GetPriceComparisonParams): Promise<Property[]> => {
  await delay(300 + Math.random() * 500);

  const property = mockProperties.find(p => p.id === params.propertyId);
  if (!property) {
    throw new Error('房源不存在');
  }

  const similar = mockProperties
    .filter(p =>
      p.id !== property.id &&
      p.category === property.category &&
      p.district === property.district &&
      p.bedrooms === property.bedrooms &&
      Math.abs(p.area - property.area) <= property.area * 0.2
    )
    .slice(0, 10);

  return similar;
};

interface GetPriceAlertsParams {
  district?: string;
  threshold?: number;
}

export const getPriceAlerts = async (params: GetPriceAlertsParams = {}): Promise<PriceAlert[]> => {
  await delay(200 + Math.random() * 300);

  let alerts = [...mockPriceAlerts];

  if (params.district) {
    alerts = alerts.filter(a => {
      const property = mockProperties.find(p => p.id === a.propertyId);
      return property?.district === params.district;
    });
  }

  if (params.threshold) {
    alerts = alerts.filter(a => a.deviation >= params.threshold);
  }

  return alerts;
};

interface GetCompetitorMatrixParams {
  propertyId: string;
  radius?: number;
}

export const getCompetitorMatrix = async (params: GetCompetitorMatrixParams): Promise<CompetitorItem[]> => {
  await delay(300 + Math.random() * 500);

  const property = mockProperties.find(p => p.id === params.propertyId);
  if (!property) {
    throw new Error('房源不存在');
  }

  const matrix = generateCompetitorMatrix(property, params.radius || 3);
  return enhanceCompetitorMatrix(matrix);
};

interface GetTimeMachineSnapshotParams {
  date: string;
  district?: string;
}

export const getTimeMachineSnapshot = async (params: GetTimeMachineSnapshotParams): Promise<SnapshotData> => {
  await delay(400 + Math.random() * 600);

  return generateTimeMachineSnapshot(params.date, params.district || '朝阳区');
};

interface CreateSubscriptionParams {
  targetId: string;
  targetType: 'property' | 'district' | 'community';
  targetName: string;
  threshold: number;
}

export const createSubscription = async (params: CreateSubscriptionParams): Promise<Subscription> => {
  await delay(300 + Math.random() * 400);

  const newSubscription: Subscription = {
    id: crypto.randomUUID(),
    targetType: params.targetType,
    targetId: params.targetId,
    targetName: params.targetName,
    priceThreshold: params.threshold,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  mockSubscriptions.unshift(newSubscription);
  return newSubscription;
};

export const getSubscriptions = async (): Promise<Subscription[]> => {
  await delay(200 + Math.random() * 300);

  return mockSubscriptions;
};

export const deleteSubscription = async (id: string): Promise<boolean> => {
  await delay(200 + Math.random() * 300);

  const index = mockSubscriptions.findIndex(s => s.id === id);
  if (index !== -1) {
    mockSubscriptions.splice(index, 1);
    return true;
  }
  return false;
};

interface CreateReportParams {
  propertyId: string;
  type: string;
  evidence: string[];
  description: string;
}

export const createReport = async (params: CreateReportParams): Promise<Report> => {
  await delay(400 + Math.random() * 600);

  const property = mockProperties.find(p => p.id === params.propertyId);

  const newReport: Report = {
    id: crypto.randomUUID(),
    propertyId: params.propertyId,
    propertyTitle: property?.title || '未知房源',
    reportType: params.type,
    description: params.description,
    evidenceUrls: params.evidence,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  mockReports.unshift(newReport);
  return newReport;
};

export const getReport = async (id: string): Promise<Report> => {
  await delay(200 + Math.random() * 300);

  const report = mockReports.find(r => r.id === id);
  if (!report) {
    throw new Error('举报记录不存在');
  }
  return report;
};

export const getAdminDashboard = async (): Promise<AdminDashboardData> => {
  await delay(500 + Math.random() * 800);

  return mockAdminDashboard;
};

export const getAgentRisks = async (): Promise<AgentRiskProfile[]> => {
  await delay(300 + Math.random() * 500);

  return mockAgentRisks;
};

interface GetMarketHealthParams {
  city?: string;
}

export const getMarketHealth = async (params: GetMarketHealthParams = {}): Promise<MarketHealth> => {
  await delay(300 + Math.random() * 500);

  return mockMarketHealth;
};

interface GetTransactionRecordsParams {
  district?: string;
  category?: PropertyCategory;
  days?: number;
}

export const getTransactionRecords = async (params: GetTransactionRecordsParams = {}): Promise<TransactionRecord[]> => {
  await delay(300 + Math.random() * 400);

  const basePrice = params.category === 'rental' ? 80 : 65000;
  return generateTransactionRecords(50, basePrice);
};

interface GetPriceBracketVolumesParams {
  district?: string;
  category?: PropertyCategory;
}

export const getPriceBracketVolumes = async (params: GetPriceBracketVolumesParams = {}): Promise<PriceBracketVolume[]> => {
  await delay(200 + Math.random() * 300);

  const isRental = params.category === 'rental';
  return generatePriceBracketVolumes(200, isRental);
};

interface GetHousingTypeDistributionParams {
  district?: string;
  category?: PropertyCategory;
}

export const getHousingTypeDistribution = async (params: GetHousingTypeDistributionParams = {}): Promise<HousingTypeDistribution[]> => {
  await delay(200 + Math.random() * 300);

  return generateHousingTypeDistribution(200);
};

interface GetTransactionStatsParams {
  district?: string;
  category?: PropertyCategory;
}

export const getTransactionStats = async (params: GetTransactionStatsParams = {}): Promise<TransactionStats> => {
  await delay(200 + Math.random() * 300);

  const basePrice = params.category === 'rental' ? 80 : 65000;
  return generateTransactionStats(basePrice);
};

interface GetPriceForecastParams {
  district?: string;
  category?: PropertyCategory;
}

export const getPriceForecast = async (params: GetPriceForecastParams = {}): Promise<PriceForecastData> => {
  await delay(400 + Math.random() * 400);

  const basePrice = params.category === 'rental' ? 80 : 65000;
  return generatePriceForecast(basePrice);
};

interface GetDistrictComparisonParams {
  districts: string[];
  category?: PropertyCategory;
}

export const getDistrictComparison = async (params: GetDistrictComparisonParams): Promise<DistrictComparisonItem[]> => {
  await delay(300 + Math.random() * 400);

  return generateDistrictComparison(params.districts);
};

export const getCompetitorAnalysis = async (): Promise<CompetitorAnalysis> => {
  await delay(200 + Math.random() * 300);

  return generateCompetitorAnalysis();
};

interface LoginParams {
  username: string;
  password: string;
  role?: 'user' | 'admin' | 'broker';
}

export const login = async (params: LoginParams): Promise<LoginResponse> => {
  await delay(500 + Math.random() * 800);

  const isAdmin = params.role === 'admin' || params.username.includes('admin');
  const user = isAdmin ? mockAdminUser : mockUser;

  const response: LoginResponse = {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
      btoa(JSON.stringify({ userId: user.id, role: user.role, exp: Date.now() + 86400000 })) +
      '.signature',
    user,
  };

  localStorage.setItem('token', response.token);
  localStorage.setItem('user', JSON.stringify(response.user));

  return response;
};

export type ApiClient = typeof apiClient;
export default apiClient;
