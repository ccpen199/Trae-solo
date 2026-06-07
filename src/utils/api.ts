import axios, { type AxiosInstance } from 'axios';
import { useAuthStore } from '@/store/authStore';

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface Property {
  id: number;
  projectName: string;
  city: string;
  district: string;
  address: string;
  status: 'available' | 'locked' | 'sold' | 'offline';
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  floor: string;
  orientation: string;
  decoration: string;
  discount: number;
  promotion: string;
  vrShowroomUrl: string;
  vrSalesOfficeUrl: string;
  vrPanoramaUrl: string;
  vrStreetViewUrl: string;
  erpSource: string;
  erpSyncStatus: string;
  erpLastSyncAt: string;
  erpSyncCount: number;
  supplyBatch?: string;
  cityStrategy?: string;
  createdAt: string;
  updatedAt: string;
  order?: PurchaseOrder;
}

export interface PriceChangeLog {
  id: number;
  propertyId: number;
  oldPrice: number;
  newPrice: number;
  changeReason: string;
  changedBy: number;
  erpSource: string;
  discountRate: number;
  promotionCondition: string;
  effectiveDate: string;
  expiryDate: string;
  reviewedBy: number;
  reviewedAt: string;
  reviewStatus: string;
  reviewComment: string;
  createdAt: string;
  changedByUser?: User;
  reviewedByUser?: User;
}

export interface PriceSchedule {
  id: number;
  propertyId: number;
  unitNo: string;
  originalPrice: number;
  currentPrice: number;
  status: string;
}

export interface ChatMessage {
  id: number;
  sessionId: string;
  senderId: number;
  receiverId: number;
  content: string;
  type: 'text' | 'image' | 'file' | 'sop';
  timestamp: string;
  isRead: boolean;
}

export interface ChatSession {
  id: string;
  customerId: number;
  advisorId: number;
  propertyId: number | null;
  lastMessageAt: string;
  customer?: {
    id: number;
    name: string;
    phone: string;
    city: string;
    tags: string[];
  };
  advisor?: {
    id: number;
    name: string;
    phone: string;
  };
  property?: {
    id: number;
    projectName: string;
  };
  lastMessage?: string;
}

export interface SOPTemplate {
  id: number;
  category: string;
  title: string;
  content: string;
  scenario: string;
}

export interface PurchaseOrder {
  id: number;
  orderNo: string;
  propertyId: number;
  userId: number;
  advisorId: number;
  status: 'eligibility_pending' | 'eligibility_pass' | 'subscribed' | 'signed' | 'fund_supervised' | 'loan_pending' | 'completed';
  amount: number;
  caVerified: boolean;
  blockchainHash: string;
  eligibilityStatus: string;
  eligibilityFeedback: string;
  eligibilityVerifiedAt: string;
  lockStatus: string;
  lockExpiresAt: string;
  lockAmount: number;
  subscribeStatus: string;
  subscribeVerifiedAt: string;
  subscribeCertificateNo: string;
  signStatus: string;
  signVerifiedAt: string;
  signContractNo: string;
  signBlockchainHash: string;
  superviseStatus: string;
  superviseBank: string;
  superviseAccountNo: string;
  superviseAmount: number;
  superviseVerifiedAt: string;
  loanStatus: string;
  loanBank: string;
  loanAmount: number;
  loanApprovedAt: string;
  loanFeedback: string;
  createdAt: string;
}

export interface Ticket {
  id: number;
  propertyId: number;
  type: string;
  riskLevel: string;
  aiAnalysis: string;
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  handlerId: number | null;
  createdAt: string;
  property?: Property;
}

export interface User {
  id: number;
  username: string;
  phone: string;
  role: 'customer' | 'advisor' | 'admin';
  name: string;
  city: string;
  tags: string[];
  createdAt: string;
}

export interface DashboardStats {
  totalProperties: number;
  totalSales: number;
  totalRevenue: number;
  pendingTickets: number;
  funnelData: Array<{ name: string; value: number }>;
  channelData: Array<{ name: string; value: number }>;
  trendData: Array<{ date: string; sales: number; revenue: number }>;
}

export interface FollowUpRecord {
  id: number;
  userId: number;
  advisorId: number;
  propertyId: number;
  type: string;
  content: string;
  result: string;
  createdAt: string;
  advisor?: User;
  property?: Property;
}

export interface CustomerTag {
  id: number;
  userId: number;
  tag: string;
  createdBy: number;
  createdAt: string;
  creator?: User;
}

export interface Reminder {
  id: number;
  userId: number;
  advisorId: number;
  type: string;
  title: string;
  content: string;
  remindAt: string;
  status: string;
  createdAt: string;
  advisor?: User;
}

export interface CityStrategy {
  id: number;
  city: string;
  district: string;
  strategy: string;
  targetPriceMin: number;
  targetPriceMax: number;
  priority: number;
  createdAt: string;
}

type ApiClient = Omit<AxiosInstance, 'get' | 'post' | 'put' | 'delete'> & {
  get<T = unknown>(url: string, config?: any): Promise<any>;
  post<T = unknown>(url: string, data?: any, config?: any): Promise<any>;
  put<T = unknown>(url: string, data?: any, config?: any): Promise<any>;
  delete<T = unknown>(url: string, config?: any): Promise<any>;
};

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
}) as ApiClient;

api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

const convertKeysToCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = toCamelCase(key);
      result[camelKey] = convertKeysToCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

api.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && typeof data === 'object') {
      return convertKeysToCamelCase(data);
    }
    return data;
  },
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
