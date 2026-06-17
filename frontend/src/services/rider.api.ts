import { http } from './request';
import type {
  Order,
  Withdrawal,
  PaginatedResponse,
  PaginationParams,
  Rider,
  GpsTrack,
} from '../types';

export interface RiderDashboard {
  todayOrders: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalOrders: number;
  rating: number;
  level: number;
}

export interface ApplyWithdrawParams {
  amount: number;
  payMethod: 'wechat' | 'alipay' | 'bank';
  payAccount: string;
}

export interface RiderSettings {
  autoAccept: boolean;
  notification: boolean;
  maxDistance: number;
  categories: string[];
}

export interface RiderGrowth {
  level: number;
  currentExp: number;
  nextLevelExp: number;
  totalOrders: number;
  medals: unknown[];
}

export const riderApi = {
  getDashboard(): Promise<RiderDashboard> {
    return http.get<RiderDashboard>('/rider/dashboard');
  },

  getOrderHall(params?: PaginationParams): Promise<PaginatedResponse<Order>> {
    return http.get<PaginatedResponse<Order>>('/rider/hall', params);
  },

  grabOrder(id: string): Promise<Order> {
    return http.post<Order>(`/rider/orders/${id}/grab`);
  },

  acceptOrder(id: string): Promise<Order> {
    return http.post<Order>(`/rider/orders/${id}/accept`);
  },

  getMyTasks(params?: PaginationParams & { status?: string }): Promise<PaginatedResponse<Order>> {
    return http.get<PaginatedResponse<Order>>('/rider/tasks', params);
  },

  pickupOrder(id: string): Promise<Order> {
    return http.post<Order>(`/rider/orders/${id}/pickup`);
  },

  deliverOrder(id: string): Promise<Order> {
    return http.post<Order>(`/rider/orders/${id}/deliver`);
  },

  getEarnings(params?: { period?: 'today' | 'week' | 'month' }): Promise<{
    total: number;
    details: Array<{ date: string; amount: number; orders: number }>;
  }> {
    return http.get('/rider/earnings', params);
  },

  applyWithdraw(params: ApplyWithdrawParams): Promise<Withdrawal> {
    return http.post<Withdrawal>('/rider/withdrawals', params);
  },

  getWithdrawals(params?: PaginationParams): Promise<PaginatedResponse<Withdrawal>> {
    return http.get<PaginatedResponse<Withdrawal>>('/rider/withdrawals', params);
  },

  getGrowth(): Promise<RiderGrowth> {
    return http.get<RiderGrowth>('/rider/growth');
  },

  getSettings(): Promise<RiderSettings> {
    return http.get<RiderSettings>('/rider/settings');
  },

  updateSettings(params: Partial<RiderSettings>): Promise<RiderSettings> {
    return http.put<RiderSettings>('/rider/settings', params);
  },

  reportLocation(location: { lat: number; lng: number }, timestamp: string): Promise<GpsTrack> {
    return http.post<GpsTrack>('/rider/location', { location, timestamp });
  },

  toggleOnline(online: boolean): Promise<Rider> {
    return http.post<Rider>('/rider/online', { online });
  },

  getProfile(): Promise<Rider> {
    return http.get<Rider>('/rider/profile');
  },
};
