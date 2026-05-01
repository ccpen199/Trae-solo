import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = '/api/v1';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        const traceId = localStorage.getItem('traceId') || this.generateTraceId();
        if (config.headers) {
          config.headers['X-Trace-Id'] = traceId;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        if (error.response) {
          const { status, data } = error.response;
          
          if (status === 401) {
            message.error('登录已过期，请重新登录');
            useAuthStore.getState().logout();
            window.location.href = '/login';
          } else if (status === 403) {
            message.error('权限不足，无法执行此操作');
          } else if (status === 404) {
            message.error('请求的资源不存在');
          } else if (status === 429) {
            message.error('请求过于频繁，请稍后再试');
          } else if (status >= 500) {
            message.error('服务器错误，请稍后再试');
          } else if (data?.error) {
            message.error(data.error);
          }
        } else if (error.code === 'ECONNABORTED') {
          message.error('请求超时，请稍后再试');
        } else {
          message.error('网络错误，请检查网络连接');
        }
        
        return Promise.reject(error);
      }
    );
  }

  private generateTraceId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  async download(url: string, data?: any): Promise<Blob> {
    const response = await this.client.post(url, data, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export const api = new ApiService();

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  
  register: (data: { username: string; email: string; password: string; role?: string }) =>
    api.post('/auth/register', data),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh-token', { refreshToken }),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
  
  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { oldPassword, newPassword }),
  
  listUsers: (params?: { role?: string; isActive?: boolean; page?: number; limit?: number }) =>
    api.get('/auth/users', { params })
};

export const couponApi = {
  createTemplate: (data: any) =>
    api.post('/coupons/templates', data),
  
  listTemplates: (params?: { status?: string; type?: string; budgetId?: string; page?: number; limit?: number }) =>
    api.get('/coupons/templates', { params }),
  
  getTemplate: (templateId: string) =>
    api.get(`/coupons/templates/${templateId}`),
  
  updateTemplate: (templateId: string, data: any) =>
    api.put(`/coupons/templates/${templateId}`, data),
  
  approveTemplate: (templateId: string) =>
    api.post(`/coupons/templates/${templateId}/approve`),
  
  distributeCoupons: (data: { templateId: string; userIds: string[]; distributionChannel?: string; storeId?: string }) =>
    api.post('/coupons/distribute', data),
  
  getMyCoupons: (params?: { status?: string; templateId?: string; page?: number; limit?: number }) =>
    api.get('/coupons/my-coupons', { params }),
  
  cancelCoupon: (couponId: string) =>
    api.post(`/coupons/${couponId}/cancel`),
  
  refundCoupon: (couponId: string, extendValidity?: boolean) =>
    api.post(`/coupons/${couponId}/refund`, { extendValidity })
};

export const orderApi = {
  calculateDiscount: (data: { orderAmount: number; storeId?: string; productCategories?: string[] }) =>
    api.post('/orders/calculate-discount', data),
  
  createOrder: (data: { storeId: string; originalAmount: number; productItems: any[]; couponIds?: string[] }) =>
    api.post('/orders', data),
  
  payOrder: (orderId: string) =>
    api.post(`/orders/${orderId}/pay`),
  
  refundOrder: (orderId: string, refundStrategy?: string) =>
    api.post(`/orders/${orderId}/refund`, { refundStrategy }),
  
  getOrder: (orderId: string) =>
    api.get(`/orders/${orderId}`),
  
  listOrders: (params?: { status?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    api.get('/orders', { params })
};

export const financeApi = {
  listBudgets: (params?: { status?: string; ownerId?: string; page?: number; limit?: number }) =>
    api.get('/finance/budgets', { params }),
  
  getBudget: (budgetId: string) =>
    api.get(`/finance/budgets/${budgetId}`),
  
  getBudgetReport: (budgetId: string) =>
    api.get(`/finance/budgets/${budgetId}/report`),
  
  getSubsidySummary: (params?: { startDate?: string; endDate?: string; storeId?: string; status?: string }) =>
    api.get('/finance/subsidy-summary', { params }),
  
  exportReport: (data: {
    format?: 'excel' | 'csv' | 'json';
    startDate?: string;
    endDate?: string;
    budgetIds?: string[];
    storeIds?: string[];
    includeTemplates?: boolean;
    includeOrders?: boolean;
    includeAuditTrail?: boolean;
  }) =>
    api.post('/finance/export', data),
  
  getAuditLogs: (params?: {
    userId?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    traceId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) =>
    api.get('/finance/audit-logs', { params }),
  
  getCouponAuditTrail: (couponId: string) =>
    api.get(`/finance/audit-logs/coupon/${couponId}`),
  
  getTraceLogs: (traceId: string) =>
    api.get(`/finance/audit-logs/trace/${traceId}`),
  
  getUserActivity: (userId: string, days?: number) =>
    api.get(`/finance/user-activity/${userId}`, { params: { days } })
};

export default api;
