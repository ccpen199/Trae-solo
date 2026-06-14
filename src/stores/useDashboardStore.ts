import { create } from 'zustand';
import { dashboardApi } from '@/utils/api';

interface DashboardState {
  stats: Record<string, unknown> | null;
  trends: Record<string, unknown> | null;
  loading: boolean;
  fetchStats: () => Promise<void>;
  fetchTrends: (period?: number) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  trends: null,
  loading: false,

  fetchStats: async () => {
    set({ loading: true });
    try {
      const res = await dashboardApi.getStats();
      set({ stats: res.data || null });
    } catch {
      set({ stats: null });
    } finally {
      set({ loading: false });
    }
  },

  fetchTrends: async (period) => {
    set({ loading: true });
    try {
      const res = await dashboardApi.getTrends(period);
      set({ trends: res.data || null });
    } catch {
      set({ trends: null });
    } finally {
      set({ loading: false });
    }
  },
}));
