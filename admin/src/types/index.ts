export interface User {
  id: string;
  username: string;
  name: string;
  role: 'super_admin' | 'admin' | 'scenic_admin' | 'merchant_admin';
  district?: string;
  scenicId?: string;
  merchantId?: string;
  avatar?: string;
  lastLoginAt?: Date;
}

export interface Citizen {
  id: string;
  idCardNumber: string;
  name: string;
  gender: 'male' | 'female';
  phone: string;
  realNameVerified: boolean;
  realNameVerifiedAt?: Date;
  faceVerified: boolean;
  district: string;
  address?: string;
  createdAt: Date;
}

export interface ElectronicCard {
  id: string;
  citizenId: string;
  cardType: 'social_security' | 'medical_insurance' | 'driver_license' | 'transport';
  cardNumber: string;
  cardName: string;
  status: 'active' | 'inactive' | 'lost';
  boundAt: Date;
}

export interface TransportCard {
  id: string;
  citizenId: string;
  citizenName: string;
  cardNo: string;
  balance: number;
  status: 'active' | 'inactive' | 'lost' | 'closed';
  nfcEnabled: boolean;
  cityCode: string;
  cityName: string;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  cardId: string;
  citizenName: string;
  cardNo: string;
  type: 'recharge' | 'consume' | 'refund';
  amount: number;
  balanceAfter: number;
  cityCode?: string;
  cityName?: string;
  routeName?: string;
  discountApplied?: number;
  originalAmount?: number;
  status: 'success' | 'pending' | 'failed' | 'risk_flagged';
  riskReason?: string;
  createdAt: Date;
}

export interface ScenicSpot {
  id: string;
  name: string;
  district: string;
  address: string;
  coverImage: string;
  maxDailyCapacity: number;
  currentVisitorCount: number;
  openTime: string;
  closeTime: string;
  ticketPrice: number;
  isActive: boolean;
  rating: number;
  reviewCount: number;
  tags: string[];
}

export interface Reservation {
  id: string;
  citizenId: string;
  citizenName: string;
  scenicId: string;
  scenicName: string;
  visitorCount: number;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in';
  checkedInAt?: Date;
  createdAt: Date;
}

export interface Enterprise {
  id: string;
  name: string;
  unifiedSocialCreditCode: string;
  legalPersonName: string;
  industry: string;
  district: string;
  contactName: string;
  contactPhone: string;
  verifiedStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  rejectReason?: string;
  createdAt: Date;
}

export interface Merchant {
  id: string;
  name: string;
  category: string;
  district: string;
  verifiedStatus: 'pending' | 'verified' | 'rejected';
  isActive: boolean;
  rating: number;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  targetId?: string;
  targetType?: string;
  ip: string;
  isSensitive: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export interface DashboardData {
  overview: {
    totalCitizens: number;
    todayNewCitizens: number;
    totalTransactions: number;
    todayTransactions: number;
    totalRevenue: number;
    todayRevenue: number;
    activeUsers7d: number;
    citizensGrowth: number;
    transactionsGrowth: number;
    revenueGrowth: number;
  };
  districtStats: Array<{
    district: string;
    citizenCount: number;
    transactionCount: number;
    revenue: number;
  }>;
  scenicHeatmap: Array<{
    scenicId: string;
    scenicName: string;
    district: string;
    todayVisitorCount: number;
    currentVisitorCount: number;
    heatLevel: number;
  }>;
  transportTopCities: Array<{
    cityCode: string;
    cityName: string;
    transactionCount: number;
    totalAmount: number;
  }>;
  weeklyTrend: Array<{
    date: string;
    newCitizens: number;
    transactions: number;
    revenue: number;
  }>;
}

export interface FusingRule {
  id: string;
  name: string;
  module: string;
  ruleType: 'frequency' | 'amount' | 'duplicate' | 'abnormal_pattern';
  threshold: number;
  timeWindow: number;
  action: 'block' | 'review' | 'alert';
  isActive: boolean;
  description: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}
