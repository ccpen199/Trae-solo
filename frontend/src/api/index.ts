import axios from 'axios';
import type {
  ApiResponse, User, Device, Booking, Order, WorkOrder, Package, Voucher, UserVoucher,
  PaginatedResponse, DeviceUsage, FunnelEvent
} from '@/types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const source = localStorage.getItem('source') || 'web';
    config.headers.source = source;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: { phone?: string; password?: string; openid?: string; alipayId?: string; nickname?: string; avatar?: string }) =>
    api.post<any, ApiResponse<{ token: string; user: User }>>('/auth/login', data),
  
  register: (data: { phone: string; password: string; nickname?: string; role?: string }) =>
    api.post<any, ApiResponse<{ token: string; user: User }>>('/auth/register', data),
  
  getProfile: () =>
    api.get<any, ApiResponse<User>>('/auth/profile'),
  
  updateProfile: (data: Partial<User>) =>
    api.put<any, ApiResponse<User>>('/auth/profile', data),
};

export const deviceApi = {
  getDevices: (params?: any) =>
    api.get<any, ApiResponse<PaginatedResponse<Device>>>('/devices', { params }),
  
  getDeviceById: (id: string) =>
    api.get<any, ApiResponse<Device>>(`/devices/${id}`),
  
  getDeviceByCode: (code: string) =>
    api.get<any, ApiResponse<Device>>(`/devices/code/${code}`),
  
  getDeviceStatus: (id: string) =>
    api.get<any, ApiResponse<any>>(`/devices/${id}/status`),
  
  getDeviceHeatmap: (params?: any) =>
    api.get<any, ApiResponse<any[]>>('/devices/heatmap', { params }),
  
  syncOfflineCommands: (id: string) =>
    api.get<any, ApiResponse<any[]>>(`/devices/${id}/sync-offline`),
  
  createDevice: (data: Partial<Device>) =>
    api.post<any, ApiResponse<Device>>('/devices', data),
  
  updateDevice: (id: string, data: Partial<Device>) =>
    api.put<any, ApiResponse<Device>>(`/devices/${id}`, data),
  
  updateDeviceStatus: (id: string, status: string) =>
    api.put<any, ApiResponse<Device>>(`/devices/${id}/status`, { status }),
};

export const bookingApi = {
  getBookings: (params?: any) =>
    api.get<any, ApiResponse<PaginatedResponse<Booking>>>('/bookings', { params }),
  
  getBookingById: (id: string) =>
    api.get<any, ApiResponse<Booking>>(`/bookings/${id}`),
  
  getAvailableSlots: (params: { deviceId: string; date: string }) =>
    api.get<any, ApiResponse<{ booked: any[]; available: string[] }>>('/bookings/slots', { params }),
  
  createBooking: (data: Partial<Booking>) =>
    api.post<any, ApiResponse<Booking>>('/bookings', data),
  
  confirmBooking: (id: string) =>
    api.post<any, ApiResponse<Booking>>(`/bookings/${id}/confirm`),
  
  cancelBooking: (id: string, reason?: string) =>
    api.post<any, ApiResponse<Booking>>(`/bookings/${id}/cancel`, { reason }),
  
  startBooking: (id: string) =>
    api.post<any, ApiResponse<{ booking: Booking; deviceResult: any }>>(`/bookings/${id}/start`),
  
  completeBooking: (id: string, data?: { usedDuration?: number; interruptReason?: string }) =>
    api.post<any, ApiResponse<{ booking: Booking; deviceResult: any }>>(`/bookings/${id}/complete`, data),
};

export const orderApi = {
  getOrders: (params?: any) =>
    api.get<any, ApiResponse<PaginatedResponse<Order>>>('/orders', { params }),
  
  getOrderById: (id: string) =>
    api.get<any, ApiResponse<Order>>(`/orders/${id}`),
  
  getWallet: () =>
    api.get<any, ApiResponse<{
      balance: number;
      ecoPoints: number;
      streakDays: number;
      transactions: Order[];
    }>>('/orders/wallet'),
  
  createOrder: (data: Partial<Order>) =>
    api.post<any, ApiResponse<Order>>('/orders', data),
  
  payOrder: (id: string, data: { paymentMethod: string; transactionId?: string }) =>
    api.post<any, ApiResponse<Order>>(`/orders/${id}/pay`, data),
  
  completeOrder: (id: string) =>
    api.post<any, ApiResponse<Order>>(`/orders/${id}/complete`),
  
  recharge: (data: { amount: number; paymentMethod: string }) =>
    api.post<any, ApiResponse<{ order: Order; newBalance: number }>>('/orders/recharge', data),
  
  handleInterrupt: (data: { orderId: string; interruptReason: string }) =>
    api.post<any, ApiResponse<{ order: Order; refundAmount: number; usedDuration: number }>>('/orders/interrupt', data),
};

export const workOrderApi = {
  getWorkOrders: (params?: any) =>
    api.get<any, ApiResponse<PaginatedResponse<WorkOrder> & { stats: any }>>('/work-orders', { params }),
  
  getWorkOrderById: (id: string) =>
    api.get<any, ApiResponse<WorkOrder>>(`/work-orders/${id}`),
  
  createWorkOrder: (data: Partial<WorkOrder>) =>
    api.post<any, ApiResponse<WorkOrder>>('/work-orders', data),
  
  assignWorkOrder: (id: string, data: { assigneeId: string; estimatedTime?: string }) =>
    api.post<any, ApiResponse<WorkOrder>>(`/work-orders/${id}/assign`, data),
  
  updateWorkOrderStatus: (id: string, data: any) =>
    api.post<any, ApiResponse<WorkOrder>>(`/work-orders/${id}/status`, data),
};

export const packageApi = {
  getPackages: (params?: any) =>
    api.get<any, ApiResponse<PaginatedResponse<Package>>>('/packages', { params }),
  
  getPackageById: (id: string) =>
    api.get<any, ApiResponse<Package>>(`/packages/${id}`),
  
  createPackage: (data: Partial<Package>) =>
    api.post<any, ApiResponse<Package>>('/packages', data),
  
  updatePackage: (id: string, data: Partial<Package>) =>
    api.put<any, ApiResponse<Package>>(`/packages/${id}`, data),
  
  updatePackageStatus: (id: string, status: string) =>
    api.put<any, ApiResponse<Package>>(`/packages/${id}/status`, { status }),
};

export const analyticsApi = {
  getCommunityOverview: (params?: { communityId?: string }) =>
    api.get<any, ApiResponse<any>>('/analytics/community-overview', { params }),
  
  getFunnelAnalysis: (params?: any) =>
    api.get<any, ApiResponse<{
      funnel: Record<string, number>;
      conversionRates: Record<string, string>;
      totalUsers: number;
      totalEvents: number;
    }>>('/analytics/funnel', { params }),
  
  getUsageStatistics: (params?: any) =>
    api.get<any, ApiResponse<any>>('/analytics/usage', { params }),
  
  getDeviceStatistics: (params?: any) =>
    api.get<any, ApiResponse<any>>('/analytics/devices', { params }),
  
  getGridOperations: (params?: any) =>
    api.get<any, ApiResponse<any[]>>('/analytics/grid-operations', { params }),
  
  getEcoIncentiveStats: (params?: any) =>
    api.get<any, ApiResponse<any>>('/analytics/eco-incentive', { params }),
};

export const ecoApi = {
  getMyEcoStatus: () =>
    api.get<any, ApiResponse<{
      ecoPoints: number;
      streakDays: number;
      streakInfo: any;
      nextReward: any;
      availableVouchers: UserVoucher[];
      recentLogs: any[];
    }>>('/eco/status'),
  
  getAvailableVouchers: (params?: { deviceType?: string }) =>
    api.get<any, ApiResponse<Voucher[]>>('/eco/vouchers/available', { params }),
  
  getMyVouchers: (params?: { used?: boolean }) =>
    api.get<any, ApiResponse<{
      valid: UserVoucher[];
      used: UserVoucher[];
      expired: UserVoucher[];
      total: number;
    }>>('/eco/vouchers', { params }),
  
  claimVoucher: (voucherId: string) =>
    api.post<any, ApiResponse<any>>('/eco/vouchers/claim', { voucherId }),
  
  getEcoLeaderboard: (params?: { communityId?: string; limit?: number }) =>
    api.get<any, ApiResponse<{
      leaderboard: any[];
      myRank: number;
      myStreakDays: number;
      myEcoPoints: number;
    }>>('/eco/leaderboard', { params }),
};

export default api;
