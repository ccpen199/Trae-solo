import { http } from './request';
import type {
  Order,
  Withdrawal,
  PaginatedResponse,
  PaginationParams,
  Rider,
  GpsTrack,
  Medal,
  Review,
} from '../types';

export interface RiderDashboard {
  todayOrders: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalOrders: number;
  rating: number;
  level: number;
  onlineMinutes: number;
  currentOrder?: Order;
  weeklyStats: Array<{ date: string; orders: number; earnings: number }>;
}

export interface ApplyWithdrawParams {
  amount: number;
  payMethod: 'wechat' | 'alipay' | 'bank';
  payAccount: string;
}

export type ReceiveMode = 'grab' | 'dispatch' | 'mixed';

export interface RiderSettings {
  autoAccept: boolean;
  notification: boolean;
  maxDistance: number;
  minAmount: number;
  categories: string[];
  receiveMode: ReceiveMode;
}

export interface RiderGrowth {
  level: number;
  currentExp: number;
  nextLevelExp: number;
  totalOrders: number;
  medals: Medal[];
  monthlyOrders: Array<{ month: string; orders: number }>;
}

export interface EarningRecord {
  id: string;
  orderNo?: string;
  orderId?: string;
  type: 'delivery_fee' | 'reward' | 'subsidy' | 'deduction' | 'withdrawal';
  amount: number;
  description: string;
  createdAt: string;
}

export interface EarningsData {
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  total: number;
  weeklyTrend: Array<{ date: string; amount: number }>;
  records: EarningRecord[];
}

export interface BankCard {
  id: string;
  bankName: string;
  cardNumber: string;
  cardHolder: string;
  isDefault: boolean;
}

export interface VehicleInfo {
  type: string;
  plateNumber: string;
  insuranceExpireDate: string;
}

export interface ServiceArea {
  id: string;
  name: string;
  city: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  type: 'high_temp' | 'festival' | 'health_check' | 'other';
  status: 'available' | 'registered' | 'completed' | 'expired';
  startDate: string;
  endDate: string;
}

export const riderApi = {
  getDashboard(): Promise<RiderDashboard> {
    return http.get<RiderDashboard>('/rider/dashboard');
  },

  getOrderHall(
    params?: PaginationParams & {
      category?: string;
      maxDistance?: number;
      sortBy?: 'price' | 'distance';
      urgentFirst?: boolean;
    }
  ): Promise<PaginatedResponse<Order>> {
    return http.get<PaginatedResponse<Order>>('/rider/hall', params);
  },

  grabOrder(id: string): Promise<Order> {
    return http.post<Order>(`/rider/orders/${id}/grab`);
  },

  acceptOrder(id: string): Promise<Order> {
    return http.post<Order>(`/rider/orders/${id}/accept`);
  },

  getMyTasks(
    params?: PaginationParams & { status?: string }
  ): Promise<PaginatedResponse<Order>> {
    return http.get<PaginatedResponse<Order>>('/rider/tasks', params);
  },

  pickupOrder(id: string): Promise<Order> {
    return http.post<Order>(`/rider/orders/${id}/pickup`);
  },

  deliverOrder(id: string): Promise<Order> {
    return http.post<Order>(`/rider/orders/${id}/deliver`);
  },

  getEarnings(params?: {
    period?: 'today' | 'week' | 'month' | 'custom';
    startDate?: string;
    endDate?: string;
  }): Promise<EarningsData> {
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

  reportLocation(
    location: { lat: number; lng: number },
    timestamp: string
  ): Promise<GpsTrack> {
    return http.post<GpsTrack>('/rider/location', { location, timestamp });
  },

  toggleOnline(online: boolean): Promise<Rider> {
    return http.post<Rider>('/rider/online', { online });
  },

  getProfile(): Promise<Rider> {
    return http.get<Rider>('/rider/profile');
  },

  getBankCards(): Promise<BankCard[]> {
    return http.get<BankCard[]>('/rider/bank-cards');
  },

  getVehicleInfo(): Promise<VehicleInfo> {
    return http.get<VehicleInfo>('/rider/vehicle');
  },

  getServiceAreas(): Promise<ServiceArea[]> {
    return http.get<ServiceArea[]>('/rider/service-areas');
  },

  getActivities(): Promise<Activity[]> {
    return http.get<Activity[]>('/rider/activities');
  },

  getOrderReview(orderId: string): Promise<Review> {
    return http.get<Review>(`/rider/orders/${orderId}/review`);
  },
};
