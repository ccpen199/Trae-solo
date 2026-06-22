import { create } from 'zustand';
import { dashboardService } from '@/services/dashboard.service';
import type { DashboardOverview, HotspotData, AcceptRateTrend, FulfillmentStats } from '@/services/dashboard.service';

interface DashboardState {
  overview: DashboardOverview | null;
  hotspots: HotspotData[];
  acceptRateTrend: AcceptRateTrend[];
  fulfillmentStats: FulfillmentStats | null;
  loading: boolean;
  fetchOverview: () => Promise<void>;
  fetchHotspots: () => Promise<void>;
  fetchAcceptRateTrend: (period?: string) => Promise<void>;
  fetchFulfillmentStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  overview: null,
  hotspots: [],
  acceptRateTrend: [],
  fulfillmentStats: null,
  loading: false,

  fetchOverview: async () => {
    set({ loading: true });
    try {
      const overview = await dashboardService.getOverview();
      set({ overview, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchHotspots: async () => {
    try {
      const hotspots = await dashboardService.getHotspots();
      set({ hotspots });
    } catch {
      // ignore
    }
  },

  fetchAcceptRateTrend: async (period?: string) => {
    try {
      const acceptRateTrend = await dashboardService.getAcceptRateTrend({ period });
      set({ acceptRateTrend });
    } catch {
      // ignore
    }
  },

  fetchFulfillmentStats: async () => {
    try {
      const fulfillmentStats = await dashboardService.getFulfillmentStats();
      set({ fulfillmentStats });
    } catch {
      // ignore
    }
  },
}));
