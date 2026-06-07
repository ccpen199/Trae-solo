import { useAuthStore } from '@/store/authStore';

const API_BASE = '/api';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

async function request<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {}, requireAuth = true } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (requireAuth) {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || '请求失败',
      };
    }

    return {
      success: true,
      data: data.data,
      message: data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '网络错误',
    };
  }
}

export const api = {
  get: <T>(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T>(endpoint: string, body?: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T>(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};

export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ token: string; user: unknown }>(
      '/auth/login',
      { username, password },
      { requireAuth: false }
    ),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

export const cabinetApi = {
  getAll: () => api.get('/cabinets'),
  getById: (id: string) => api.get(`/cabinets/${id}`),
  create: (data: unknown) => api.post('/cabinets', data),
  update: (id: string, data: unknown) => api.put(`/cabinets/${id}`, data),
  delete: (id: string) => api.delete(`/cabinets/${id}`),
  getCompartments: (cabinetId: string) =>
    api.get(`/cabinets/${cabinetId}/compartments`),
  getAlerts: () => api.get('/cabinets/alerts'),
  resolveAlert: (id: string) => api.post(`/cabinets/alerts/${id}/resolve`),
  restock: (id: string) => api.post(`/cabinets/${id}/restock`),
};

export const compartmentApi = {
  getAll: (params?: string) => api.get(`/compartments${params ? `?${params}` : ''}`),
  getById: (id: string) => api.get(`/compartments/${id}`),
  update: (id: string, data: unknown) => api.put(`/compartments/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/compartments/${id}/status`, { status }),
};

export const packageApi = {
  getAll: (params?: string) => api.get(`/packages${params ? `?${params}` : ''}`),
  getById: (id: string) => api.get(`/packages/${id}`),
  create: (data: unknown) => api.post('/packages', data),
  update: (id: string, data: unknown) => api.put(`/packages/${id}`, data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/packages/${id}/status`, { status }),
  getTracking: (id: string) => api.get(`/packages/${id}/tracking`),
  sendNotification: (id: string) =>
    api.post(`/packages/${id}/notify`),
};

export const shippingApi = {
  calculate: (data: unknown) => api.post('/shipping/calculate', data),
  createOrder: (data: unknown) => api.post('/shipping/orders', data),
  getCompanies: () => api.get('/shipping/companies'),
};

export const storageApi = {
  getPrices: () => api.get('/storage/prices'),
  getActive: () => api.get('/storage/active'),
  create: (data: unknown) => api.post('/storage', data),
  settle: (id: string) => api.post(`/storage/${id}/settle`),
};

export const laundryApi = {
  getAll: () => api.get('/laundry'),
  getById: (id: string) => api.get(`/laundry/${id}`),
  create: (data: unknown) => api.post('/laundry', data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/laundry/${id}/status`, { status }),
  updatePrice: (id: string, price: number) =>
    api.patch(`/laundry/${id}/price`, { price }),
};

export const housekeepingApi = {
  getAll: () => api.get('/housekeeping'),
  getById: (id: string) => api.get(`/housekeeping/${id}`),
  create: (data: unknown) => api.post('/housekeeping', data),
  assignStaff: (id: string, staffId: string) =>
    api.post(`/housekeeping/${id}/assign`, { staffId }),
  getMatchingStaff: (id: string) =>
    api.get(`/housekeeping/${id}/matching-staff`),
};

export const notificationApi = {
  getAll: (params?: string) => api.get(`/notifications${params ? `?${params}` : ''}`),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/mark-all-read'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export const couponApi = {
  getAvailable: () => api.get('/coupons/available'),
  getMyCoupons: () => api.get('/coupons/my'),
  claim: (id: string) => api.post(`/coupons/${id}/claim`),
  getUsageHistory: () => api.get('/coupons/usage-history'),
  getCampaigns: () => api.get('/coupons/campaigns'),
  createCampaign: (data: unknown) => api.post('/coupons/campaigns', data),
};

export const adminApi = {
  getCabinetStats: () => api.get('/admin/cabinet-stats'),
  getFaultAlerts: () => api.get('/admin/fault-alerts'),
  resolveAlert: (id: string) => api.post(`/admin/alerts/${id}/resolve`),
  getMetrics: () => api.get('/admin/metrics'),
  getReviews: () => api.get('/admin/reviews'),
  getUserSegments: () => api.get('/admin/user-segments'),
  createCouponCampaign: (data: unknown) => api.post('/admin/coupon-campaigns', data),
  getRecommendationStats: () => api.get('/admin/recommendation-stats'),
  pushCoupons: (campaignId: string) => api.post('/admin/push-coupons', { campaignId }),
};

export interface Cabinet {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'maintenance';
  totalCompartments: number;
  occupiedCompartments: number;
  temperature?: number;
  humidity?: number;
  lastHeartbeat?: string;
  createdAt?: string;
}

export interface Compartment {
  id: string;
  cabinetId: string;
  cabinetName?: string;
  code: string;
  status: 'empty' | 'occupied' | 'reserved' | 'maintenance';
  size: 'small' | 'medium' | 'large';
  temperatureZone?: 'normal' | 'cool' | 'frozen';
  currentPackageId?: string;
  lastUsedAt?: string;
}

export interface PackageItem {
  id: string;
  trackingNumber: string;
  type: 'send' | 'receive' | 'storage';
  status: string;
  cabinetId?: string;
  cabinetName?: string;
  compartmentId?: string;
  compartmentCode?: string;
  senderName?: string;
  senderPhone?: string;
  receiverName?: string;
  receiverPhone?: string;
  weight?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  id: string;
  status: string;
  location: string;
  description: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'package' | 'shipping' | 'alert' | 'coupon' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Alert {
  id: string;
  cabinetId: string;
  cabinetName: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}
