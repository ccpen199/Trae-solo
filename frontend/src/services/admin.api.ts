import { http } from './request';
import type {
  Rider,
  DisputeTicket,
  Withdrawal,
  PaginatedResponse,
  PaginationParams,
  Order,
} from '../types';

export interface AdminStats {
  totalOrders: number;
  todayOrders: number;
  activeRiders: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingTickets: number;
  completionRate: number;
}

export interface HeatmapPoint {
  lat: number;
  lng: number;
  weight: number;
}

export interface RiderActivity {
  riderId: string;
  riderName: string;
  online: boolean;
  orders: number;
  location?: { lat: number; lng: number };
  lastActive: string;
}

export interface AnomalyItem {
  id: string;
  type: string;
  description: string;
  level: 'low' | 'medium' | 'high';
  orderId?: string;
  riderId?: string;
  createdAt: string;
}

export interface CityStats {
  cityCode: string;
  cityName: string;
  orderCount: number;
  riderCount: number;
  revenue: number;
}

export interface FinanceOverview {
  totalRevenue: number;
  platformFee: number;
  riderPayout: number;
  merchantPayout: number;
  pendingWithdrawals: number;
  dailyData: Array<{ date: string; revenue: number; orders: number }>;
}

export const adminApi = {
  getStats(): Promise<AdminStats> {
    return http.get<AdminStats>('/admin/stats');
  },

  getHeatmap(params?: { cityCode?: string }): Promise<HeatmapPoint[]> {
    return http.get<HeatmapPoint[]>('/admin/heatmap', params);
  },

  getRiders(params?: PaginationParams & { status?: string }): Promise<PaginatedResponse<RiderActivity>> {
    return http.get<PaginatedResponse<RiderActivity>>('/admin/riders', params);
  },

  getAnomaly(params?: PaginationParams): Promise<PaginatedResponse<AnomalyItem>> {
    return http.get<PaginatedResponse<AnomalyItem>>('/admin/anomaly', params);
  },

  getTickets(params?: PaginationParams & { status?: string }): Promise<PaginatedResponse<DisputeTicket>> {
    return http.get<PaginatedResponse<DisputeTicket>>('/admin/tickets', params);
  },

  getTicketDetail(id: string): Promise<DisputeTicket> {
    return http.get<DisputeTicket>(`/admin/tickets/${id}`);
  },

  resolveTicket(id: string, resolution: string): Promise<DisputeTicket> {
    return http.post<DisputeTicket>(`/admin/tickets/${id}/resolve`, { resolution });
  },

  transferOrder(orderId: string, toRiderId: string): Promise<Order> {
    return http.post<Order>(`/admin/orders/${orderId}/transfer`, { toRiderId });
  },

  fuseRegion(region: string, enabled: boolean): Promise<void> {
    return http.post<void>('/admin/fuse', { region, enabled });
  },

  getCities(): Promise<CityStats[]> {
    return http.get<CityStats[]>('/admin/cities');
  },

  getFinance(params?: { period?: 'week' | 'month' }): Promise<FinanceOverview> {
    return http.get<FinanceOverview>('/admin/finance', params);
  },

  getWithdrawals(params?: PaginationParams & { status?: string }): Promise<PaginatedResponse<Withdrawal>> {
    return http.get<PaginatedResponse<Withdrawal>>('/admin/withdrawals', params);
  },

  approveWithdrawal(id: string): Promise<Withdrawal> {
    return http.post<Withdrawal>(`/admin/withdrawals/${id}/approve`);
  },

  rejectWithdrawal(id: string, reason: string): Promise<Withdrawal> {
    return http.post<Withdrawal>(`/admin/withdrawals/${id}/reject`, { reason });
  },

  banRider(id: string, reason: string): Promise<Rider> {
    return http.post<Rider>(`/admin/riders/${id}/ban`, { reason });
  },
};
