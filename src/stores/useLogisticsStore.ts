import { create } from 'zustand';
import { logisticsApi } from '@/utils/api';

interface LogisticsState {
  logisticsOrders: unknown[];
  total: number;
  loading: boolean;
  fetchLogisticsOrders: (filters?: Record<string, string | number>) => Promise<void>;
  dispatchOrder: (data: Record<string, unknown>) => Promise<unknown>;
}

export const useLogisticsStore = create<LogisticsState>((set) => ({
  logisticsOrders: [],
  total: 0,
  loading: false,

  fetchLogisticsOrders: async (filters) => {
    set({ loading: true });
    try {
      const res = await logisticsApi.getLogisticsOrders(filters);
      set({ logisticsOrders: res.data?.list || [], total: res.data?.total || 0 });
    } catch {
      set({ logisticsOrders: [], total: 0 });
    } finally {
      set({ loading: false });
    }
  },

  dispatchOrder: async (data) => {
    set({ loading: true });
    try {
      const res = await logisticsApi.dispatchOrder(data);
      return res.data;
    } finally {
      set({ loading: false });
    }
  },
}));
