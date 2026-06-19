import http from './http';
import type {
  LoginRequest,
  LoginResponse,
  User,
  Device,
  DeviceStatus,
  DeviceCommand,
  Order,
  Reservation,
  WorkOrder,
  PaginatedResponse,
  UsageStats,
  FunnelData,
  HeatmapData,
  RevenueData,
  Reward,
  Coupon,
  StreakData,
  Area,
  Package,
  WorkOrderSummary
} from '../types';

export const authApi = {
  login: (data: LoginRequest) => {
    return http.post<any, LoginResponse>('/auth/login', data);
  },
  getMe: () => {
    return http.get<any, User>('/auth/me');
  },
  sendCode: (phone: string) => {
    return http.post<any, { success: boolean }>('/auth/send-code', { phone });
  }
};

export const deviceApi = {
  getList: (params?: { areaId?: string; status?: string; type?: string; page?: number; pageSize?: number }) => {
    return http.get<any, PaginatedResponse<Device>>('/devices', { params });
  },
  getDetail: (id: string) => {
    return http.get<any, Device>(`/devices/${id}`);
  },
  sendCommand: (data: DeviceCommand) => {
    return http.post<any, { success: boolean }>(`/devices/${data.deviceId}/command`, data);
  },
  getStatus: (id: string) => {
    return http.get<any, DeviceStatus>(`/devices/${id}/status`);
  }
};

export const orderApi = {
  createOrder: (data: { deviceId: string; packageId: string }) => {
    return http.post<any, Order>('/orders', data);
  },
  startDevice: (orderId: string) => {
    return http.post<any, Order>(`/orders/${orderId}/start`);
  },
  finishOrder: (orderId: string) => {
    return http.post<any, Order>(`/orders/${orderId}/finish`);
  },
  getMyOrders: (params?: { status?: string; page?: number; pageSize?: number }) => {
    return http.get<any, PaginatedResponse<Order>>('/orders/my', { params });
  },
  payOrder: (orderId: string, data: { paymentMethod: string }) => {
    return http.post<any, Order>(`/orders/${orderId}/pay`, data);
  },
  refundOrder: (orderId: string, reason?: string) => {
    return http.post<any, Order>(`/orders/${orderId}/refund`, { reason });
  }
};

export const reservationApi = {
  create: (data: { deviceId: string; startTime: string; endTime: string }) => {
    return http.post<any, Reservation>('/reservations', data);
  },
  cancel: (id: string) => {
    return http.post<any, Reservation>(`/reservations/${id}/cancel`);
  },
  getMyReservations: (params?: { status?: string; page?: number; pageSize?: number }) => {
    return http.get<any, PaginatedResponse<Reservation>>('/reservations/my', { params });
  }
};

export const workorderApi = {
  create: (data: { title: string; description: string; deviceId: string; priority?: string }) => {
    return http.post<any, WorkOrder>('/workorders', data);
  },
  list: (params?: { status?: string; priority?: string; assigneeId?: string; page?: number; pageSize?: number }) => {
    return http.get<any, PaginatedResponse<WorkOrder>>('/workorders', { params });
  },
  update: (id: string, data: Partial<WorkOrder>) => {
    return http.patch<any, WorkOrder>(`/workorders/${id}`, data);
  },
  assign: (id: string, assigneeId: string) => {
    return http.post<any, WorkOrder>(`/workorders/${id}/assign`, { assigneeId });
  }
};

export const analyticsApi = {
  getUsage: (params?: { startDate?: string; endDate?: string; areaId?: string }) => {
    return http.get<any, UsageStats>('/analytics/usage', { params });
  },
  getFunnel: (params?: { startDate?: string; endDate?: string }) => {
    return http.get<any, FunnelData[]>('/analytics/funnel', { params });
  },
  getHeatmap: (params?: { startDate?: string; endDate?: string; deviceId?: string }) => {
    return http.get<any, HeatmapData[]>('/analytics/heatmap', { params });
  },
  getRevenue: (params?: { startDate?: string; endDate?: string; areaId?: string }) => {
    return http.get<any, RevenueData>('/analytics/revenue', { params });
  }
};

export const rewardsApi = {
  getRewards: () => {
    return http.get<any, Reward[]>('/rewards');
  },
  getCoupons: () => {
    return http.get<any, Coupon[]>('/rewards/coupons');
  },
  useCoupon: (couponId: string) => {
    return http.post<any, { success: boolean }>(`/rewards/coupons/${couponId}/use`);
  },
  getStreak: () => {
    return http.get<any, StreakData>('/rewards/streak');
  },
  checkIn: () => {
    return http.post<any, StreakData>('/rewards/checkin');
  }
};

export const adminApi = {
  getAreas: (params?: { page?: number; pageSize?: number }) => {
    return http.get<any, PaginatedResponse<Area>>('/admin/areas', { params });
  },
  createArea: (data: { name: string; address: string }) => {
    return http.post<any, Area>('/admin/areas', data);
  },
  getPackages: (params?: { type?: string; isActive?: boolean; page?: number; pageSize?: number }) => {
    return http.get<any, PaginatedResponse<Package>>('/admin/packages', { params });
  },
  createPackage: (data: Omit<Package, 'id' | 'createdAt'>) => {
    return http.post<any, Package>('/admin/packages', data);
  },
  updatePackage: (id: string, data: Partial<Package>) => {
    return http.patch<any, Package>(`/admin/packages/${id}`, data);
  },
  getUsers: (params?: { role?: string; page?: number; pageSize?: number }) => {
    return http.get<any, PaginatedResponse<User>>('/admin/users', { params });
  },
  getWorkorderSummary: () => {
    return http.get<any, WorkOrderSummary>('/admin/workorders/summary');
  }
};
