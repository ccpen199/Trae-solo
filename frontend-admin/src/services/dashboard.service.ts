import { get } from './http';

export interface DashboardOverview {
  totalRiders: number;
  onlineRiders: number;
  realtimeOnlineCount: number;
  todayOrders: number;
  completedOrders: number;
  pendingTasks: number;
  todayRevenue: number;
  completionRate: string;
}

export interface HotspotData {
  name: string;
  location: { latitude: number; longitude: number };
  radius: number;
  orderCount: number;
  riderCount: number;
  heatLevel: number;
  peakHours: string[];
}

export interface AcceptRateTrend {
  date: string;
  count: number;
  revenue: number;
}

export interface FulfillmentStats {
  averageDeliveryTime: number;
  onTimeRate: number;
  completionRate: number;
  exceptionRate: number;
}

export const dashboardService = {
  getOverview(): Promise<DashboardOverview> {
    return get('/admin/dashboard/overview');
  },

  getHotspots(): Promise<HotspotData[]> {
    return get('/admin/hotspots');
  },

  getAcceptRateTrend(params?: { period?: string }): Promise<AcceptRateTrend[]> {
    return get('/admin/statistics/orders', { params });
  },

  getFulfillmentStats(): Promise<FulfillmentStats> {
    return get('/admin/dashboard/fulfillment');
  },
};
