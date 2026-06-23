import http from './http';
import type {
  LoginRequest, LoginResponse, User, Device, Order, Reservation, WorkOrder,
  PaginatedResponse, UsageStats, FunnelData, HeatmapData, RevenueData,
  StreakData, Area, Package, WorkOrderSummary, RewardCoupon, RewardRecord
} from '../types';

export const authApi = {
  login: (data: LoginRequest) => http.post<any, LoginResponse>('/auth/login', data),
  getMe: () => http.get<any, User>('/auth/me'),
  sendCode: (phone: string) => http.post<any, { success: boolean; message: string }>('/auth/send-code', { phone })
};

export const deviceApi = {
  getList: (params?: { areaId?: string; status?: string; type?: string; page?: number; pageSize?: number }) => {
    return http.get<any, Device[]>('/devices', { params }).then(items => ({
      items: items || [],
      total: (items || []).length,
      page: params?.page || 1,
      pageSize: params?.pageSize || 50
    }));
  },
  getDetail: (id: string) => http.get<any, Device>(`/devices/${id}`),
  createDevice: (data: Partial<Device>) => http.post<any, Device>('/devices', data),
  updateDevice: (id: string, data: Partial<Device>) => http.put<any, Device>(`/devices/${id}`, data),
  updateStatus: (id: string, status: string) => http.put<any, Device>(`/devices/${id}/status`, { status }),
  sendCommand: (deviceId: string, command: string, params?: Record<string, any>) =>
    http.post<any, { success: boolean }>(`/devices/${deviceId}/command`, { command, params }),
  getCommands: (deviceId: string) => http.get<any, any[]>(`/devices/${deviceId}/commands`),
  heartbeat: (id: string) => http.post<any, { success: boolean }>(`/devices/${id}/heartbeat`)
};

export const orderApi = {
  createOrder: (data: { deviceId: string; packageId?: string; type?: string; duration?: number }) =>
    http.post<any, Order>('/orders', data),
  startDevice: (orderId: string) => http.post<any, Order>(`/orders/${orderId}/start`),
  finishOrder: (orderId: string) => http.post<any, Order>(`/orders/${orderId}/finish`),
  getMyOrders: (params?: { status?: string; page?: number; pageSize?: number }) =>
    http.get<any, PaginatedResponse<Order>>('/orders', { params }),
  payOrder: (orderId: string, data: { payMethod: string }) =>
    http.post<any, Order>(`/orders/${orderId}/pay`, data),
  refundOrder: (orderId: string, reason?: string) =>
    http.post<any, Order>(`/orders/${orderId}/refund`, { reason })
};

export const reservationApi = {
  create: (data: { deviceId: string; startTime: string; endTime: string; amount?: number }) =>
    http.post<any, Reservation>('/reservations', data),
  cancel: (id: string) => http.post<any, Reservation>(`/reservations/${id}/cancel`),
  getMyReservations: (params?: { status?: string; page?: number; pageSize?: number }) =>
    http.get<any, PaginatedResponse<Reservation>>('/reservations', { params })
};

export const workorderApi = {
  create: (data: { deviceId: string; description: string; type?: string; priority?: string }) =>
    http.post<any, WorkOrder>('/workorders', {
      deviceId: data.deviceId,
      description: data.description,
      type: data.type || 'repair',
      priority: data.priority || 'medium'
    }),
  list: (params?: { status?: string; priority?: string; page?: number; pageSize?: number }) =>
    http.get<any, PaginatedResponse<WorkOrder>>('/workorders', { params }),
  getMy: (params?: { status?: string; priority?: string; page?: number; pageSize?: number }) =>
    http.get<any, PaginatedResponse<WorkOrder>>('/workorders', { params }),
  update: (id: string, data: Partial<WorkOrder>) => http.put<any, WorkOrder>(`/workorders/${id}`, data),
  assign: (id: string, handlerId: string) => http.put<any, WorkOrder>(`/workorders/${id}/assign`, { handlerId })
};

export const analyticsApi = {
  getUsage: (params?: { startDate?: string; endDate?: string; areaId?: string }) =>
    http.get<any, UsageStats>('/analytics/usage', { params }),
  getFunnel: (params?: { startDate?: string; endDate?: string }) =>
    http.get<any, FunnelData[]>('/analytics/funnel', { params }),
  getHeatmap: (params?: { startDate?: string; endDate?: string }) =>
    http.get<any, any[]>('/analytics/heatmap', { params }).then((raw) =>
      (raw || []).map(r => ({
        day: r.day ?? r.weekday ?? 0,
        hour: r.hour ?? 0,
        value: r.value ?? r.count ?? 0
      })) as HeatmapData[]
    ),
  getDeviceHeatmap: () => http.get<any, any[]>('/analytics/devices/heatmap'),
  getRevenue: (params?: { startDate?: string; endDate?: string; areaId?: string }) =>
    http.get<any, RevenueData>('/analytics/revenue', { params })
};

export const rewardsApi = {
  getRecords: () => http.get<any, any>('/rewards/records')
    .then((res) => res.items || res || [])
    .catch(() => [] as RewardRecord[]),
  getCoupons: () => http.get<any, RewardCoupon[]>('/rewards/coupons'),
  useCoupon: (couponId: string) => http.post<any, { success: boolean }>(`/rewards/coupons/${couponId}/use`),
  getStreak: () => http.get<any, any>('/rewards/streak').then((raw) => ({
    currentStreak: raw.currentStreak || 0,
    longestStreak: raw.longestStreak || 0,
    totalPoints: raw.totalPoints || 0,
    canCheckIn: raw.canCheckIn ?? !raw.todayCheckedIn,
    checkInDates: raw.checkInDates || []
  }) as StreakData),
  checkIn: () => http.post<any, any>('/rewards/checkin').then((raw) => ({
    currentStreak: raw.currentStreak || 1,
    longestStreak: raw.longestStreak || 1,
    totalPoints: (raw.checkInDates?.length || 0) * 10 + 10,
    canCheckIn: false,
    checkInDates: raw.checkInDates || []
  }) as StreakData)
};

export const adminApi = {
  getAreas: () => http.get<any, any>('/admin/areas').then(res => res.items || res || [] as Area[]),
  createArea: (data: { name: string; lat: number; lng: number; propertyManagerId?: string }) =>
    http.post<any, Area>('/admin/areas', data),
  getPackages: (params?: { deviceType?: string; type?: string; pageSize?: number }) => {
    const p: any = {};
    if (params?.deviceType) p.deviceType = params.deviceType;
    else if (params?.type) p.deviceType = params.type;
    return http.get<any, any>('/admin/packages', { params: p }).then(res => res.items || res || [] as Package[]);
  },
  createPackage: (data: Omit<Package, 'id'>) => http.post<any, Package>('/admin/packages', data),
  updatePackage: (id: string, data: Partial<Package>) => http.put<any, Package>(`/admin/packages/${id}`, data),
  getUsers: (params?: { role?: string; pageSize?: number }) =>
    http.get<any, any>('/admin/users', { params }).then(res => res.items || res || [] as User[]),
  getWorkorderSummary: () => http.get<any, WorkOrderSummary>('/admin/workorders/summary')
};
