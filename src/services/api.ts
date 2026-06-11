import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type {
  Order,
  Rider,
  DashboardMetrics,
  ApiResponse,
  OrderStatus,
  RiderStatus,
  PricingConfig,
  Waybill,
  Compensation,
  CreditRecord,
  QueryParams,
} from '@/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const data = response.data;
      if (data.success) {
        return data.data as unknown as AxiosResponse;
      }
      return Promise.reject(new Error(data.error || data.message || 'Request failed'));
    },
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

const request = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const response = await apiClient.request<unknown, T>(config);
  return response;
};

export const dashboardApi = {
  getMetrics: (): Promise<DashboardMetrics> =>
    request<DashboardMetrics>({
      method: 'GET',
      url: '/dashboard/metrics',
    }),
};

export const orderApi = {
  getList: (params?: QueryParams): Promise<{ orders: Order[]; total: number }> =>
    request({
      method: 'GET',
      url: '/orders',
      params,
    }),

  getById: (id: string): Promise<Order> =>
    request<Order>({
      method: 'GET',
      url: `/orders/${id}`,
    }),

  create: (data: Partial<Order>): Promise<Order> =>
    request<Order>({
      method: 'POST',
      url: '/orders',
      data,
    }),

  update: (id: string, data: Partial<Order>): Promise<Order> =>
    request<Order>({
      method: 'PUT',
      url: `/orders/${id}`,
      data,
    }),

  updateStatus: (id: string, status: OrderStatus): Promise<Order> =>
    request<Order>({
      method: 'PATCH',
      url: `/orders/${id}/status`,
      data: { status },
    }),

  assignRider: (orderId: string, riderId: string): Promise<Order> =>
    request<Order>({
      method: 'POST',
      url: `/orders/${orderId}/assign`,
      data: { riderId },
    }),

  cancel: (id: string, reason?: string): Promise<void> =>
    request<void>({
      method: 'POST',
      url: `/orders/${id}/cancel`,
      data: { reason },
    }),
};

export const riderApi = {
  getList: (params?: QueryParams): Promise<{ riders: Rider[]; total: number }> =>
    request({
      method: 'GET',
      url: '/riders',
      params,
    }),

  getById: (id: string): Promise<Rider> =>
    request<Rider>({
      method: 'GET',
      url: `/riders/${id}`,
    }),

  create: (data: Partial<Rider>): Promise<Rider> =>
    request<Rider>({
      method: 'POST',
      url: '/riders',
      data,
    }),

  update: (id: string, data: Partial<Rider>): Promise<Rider> =>
    request<Rider>({
      method: 'PUT',
      url: `/riders/${id}`,
      data,
    }),

  updateStatus: (id: string, status: RiderStatus): Promise<Rider> =>
    request<Rider>({
      method: 'PATCH',
      url: `/riders/${id}/status`,
      data: { status },
    }),

  getCreditRecords: (riderId: string): Promise<CreditRecord[]> =>
    request<CreditRecord[]>({
      method: 'GET',
      url: `/riders/${riderId}/credits`,
    }),
};

export const pricingApi = {
  getConfig: (): Promise<PricingConfig> =>
    request<PricingConfig>({
      method: 'GET',
      url: '/pricing/config',
    }),

  updateConfig: (data: Partial<PricingConfig>): Promise<PricingConfig> =>
    request<PricingConfig>({
      method: 'PUT',
      url: '/pricing/config',
      data,
    }),

  calculate: (data: {
    distanceKm: number;
    weight: number;
    goodsType: string;
    weatherCondition?: string;
    isPeakHour?: boolean;
  }): Promise<{ estimatedPrice: number; breakdown: unknown }> =>
    request({
      method: 'POST',
      url: '/pricing/calculate',
      data,
    }),
};

export const waybillApi = {
  getList: (params?: QueryParams): Promise<{ waybills: Waybill[]; total: number }> =>
    request({
      method: 'GET',
      url: '/waybills',
      params,
    }),

  getById: (id: string): Promise<Waybill> =>
    request<Waybill>({
      method: 'GET',
      url: `/waybills/${id}`,
    }),

  generate: (orderId: string): Promise<Waybill> =>
    request<Waybill>({
      method: 'POST',
      url: '/waybills/generate',
      data: { orderId },
    }),

  print: (id: string): Promise<{ pdfUrl: string }> =>
    request({
      method: 'POST',
      url: `/waybills/${id}/print`,
    }),

  void: (id: string, reason?: string): Promise<void> =>
    request<void>({
      method: 'POST',
      url: `/waybills/${id}/void`,
      data: { reason },
    }),
};

export const compensationApi = {
  getList: (params?: QueryParams): Promise<{ compensations: Compensation[]; total: number }> =>
    request({
      method: 'GET',
      url: '/compensations',
      params,
    }),

  create: (data: Partial<Compensation>): Promise<Compensation> =>
    request<Compensation>({
      method: 'POST',
      url: '/compensations',
      data,
    }),

  approve: (id: string): Promise<Compensation> =>
    request<Compensation>({
      method: 'POST',
      url: `/compensations/${id}/approve`,
    }),

  reject: (id: string, reason: string): Promise<Compensation> =>
    request<Compensation>({
      method: 'POST',
      url: `/compensations/${id}/reject`,
      data: { reason },
    }),

  issue: (id: string): Promise<Compensation> =>
    request<Compensation>({
      method: 'POST',
      url: `/compensations/${id}/issue`,
    }),
};

export const authApi = {
  login: (data: { username: string; password: string }): Promise<{ token: string; user: { id: string; name: string; role: string } }> =>
    request({
      method: 'POST',
      url: '/auth/login',
      data,
    }),

  logout: (): Promise<void> =>
    request<void>({
      method: 'POST',
      url: '/auth/logout',
    }),
};

export default apiClient;
