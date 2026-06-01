import axios from 'axios';
import type { 
  Farmer, CreditApproval, Order, Repayment, Product, 
  Cooperative, Store, CollectionTask, AuditLog, DashboardOverview,
  ApiResponse 
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export const farmerApi = {
  list: (params?: { page?: number; pageSize?: number; keyword?: string; status?: string }) =>
    api.get<ApiResponse<Farmer[]>>('/farmers', { params }),
  get: (id: number) =>
    api.get<ApiResponse<Farmer>>(`/farmers/${id}`),
  create: (data: Farmer) =>
    api.post<ApiResponse<Farmer>>('/farmers', data),
  update: (id: number, data: Farmer) =>
    api.put<ApiResponse<Farmer>>(`/farmers/${id}`, data),
  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/farmers/${id}`),
};

export const creditApi = {
  list: (params?: { page?: number; pageSize?: number; farmer_id?: number; status?: string }) =>
    api.get<ApiResponse<CreditApproval[]>>('/credits', { params }),
  get: (id: number) =>
    api.get<ApiResponse<CreditApproval>>(`/credits/${id}`),
  getAvailable: (farmerId: number) =>
    api.get<ApiResponse<CreditApproval[]>>(`/credits/farmer/${farmerId}/available`),
  calculate: (data: { farmer_id: number; requested_amount: number; cooperative_id?: number }) =>
    api.post<ApiResponse<any>>('/credits/calculate', data),
  create: (data: CreditApproval) =>
    api.post<ApiResponse<CreditApproval>>('/credits', data),
  approve: (id: number, data: { approved_amount: number; approval_notes: string }) =>
    api.put<ApiResponse<void>>(`/credits/${id}/approve`, data),
  reject: (id: number, data: { approval_notes: string }) =>
    api.put<ApiResponse<void>>(`/credits/${id}/reject`, data),
};

export const orderApi = {
  list: (params?: { page?: number; pageSize?: number; farmer_id?: number; store_id?: number; status?: string }) =>
    api.get<ApiResponse<Order[]>>('/orders', { params }),
  get: (id: number) =>
    api.get<ApiResponse<Order>>(`/orders/${id}`),
  create: (data: any) =>
    api.post<ApiResponse<{ id: number }>>('/orders', data),
  sign: (id: number) =>
    api.put<ApiResponse<void>>(`/orders/${id}/sign`),
  cancel: (id: number) =>
    api.put<ApiResponse<void>>(`/orders/${id}/cancel`),
};

export const repaymentApi = {
  list: (params?: { page?: number; pageSize?: number; farmer_id?: number; status?: string; is_overdue?: number }) =>
    api.get<ApiResponse<Repayment[]>>('/repayments', { params }),
  get: (id: number) =>
    api.get<ApiResponse<Repayment>>(`/repayments/${id}`),
  pay: (id: number, data: any) =>
    api.post<ApiResponse<void>>(`/repayments/${id}/pay`, data),
  extend: (id: number, data: { extension_days: number; extension_reason: string }) =>
    api.put<ApiResponse<void>>(`/repayments/${id}/extend`, data),
  reduce: (id: number, data: { reduction_amount: number; reduction_reason: string }) =>
    api.put<ApiResponse<void>>(`/repayments/${id}/reduce`, data),
  checkOverdue: () =>
    api.post<ApiResponse<void>>('/repayments/check-overdue'),
};

export const commonApi = {
  getCooperatives: (params?: { status?: string }) =>
    api.get<ApiResponse<Cooperative[]>>('/common/cooperatives', { params }),
  getStores: (params?: { status?: string; cooperative_id?: number }) =>
    api.get<ApiResponse<Store[]>>('/common/stores', { params }),
  getProducts: (params?: { status?: string; store_id?: number; category?: string }) =>
    api.get<ApiResponse<Product[]>>('/common/products', { params }),
  getCategories: () =>
    api.get<ApiResponse<string[]>>('/common/categories'),
};

export const dashboardApi = {
  getOverview: () =>
    api.get<ApiResponse<DashboardOverview>>('/dashboard/overview'),
  getOverdueFarmers: (params?: { page?: number; pageSize?: number }) =>
    api.get<ApiResponse<any[]>>('/dashboard/overdue-farmers', { params }),
  getStoreRisk: () =>
    api.get<ApiResponse<any[]>>('/dashboard/store-risk'),
  getCreditUsage: () =>
    api.get<ApiResponse<any[]>>('/dashboard/credit-usage'),
  getCropCycleRepayment: () =>
    api.get<ApiResponse<any[]>>('/dashboard/crop-cycle-repayment'),
  getBadDebtTrend: () =>
    api.get<ApiResponse<any[]>>('/dashboard/bad-debt-trend'),
  getCollectionTasks: (params?: { page?: number; pageSize?: number; status?: string; assignee?: string }) =>
    api.get<ApiResponse<CollectionTask[]>>('/dashboard/collection-tasks', { params }),
  createCollectionTask: (data: any) =>
    api.post<ApiResponse<{ id: number }>>('/dashboard/collection-tasks', data),
  updateCollectionTask: (id: number, data: any) =>
    api.put<ApiResponse<void>>(`/dashboard/collection-tasks/${id}`, data),
  getAuditLogs: (params?: { page?: number; pageSize?: number; table_name?: string; action?: string }) =>
    api.get<ApiResponse<AuditLog[]>>('/dashboard/audit-logs', { params }),
};

export default api;
