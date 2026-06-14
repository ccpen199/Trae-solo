import { create } from 'zustand';
import { settlementApi } from '@/utils/api';

interface SettlementState {
  settlements: unknown[];
  total: number;
  loading: boolean;
  fetchSettlements: (filters?: Record<string, string | number>) => Promise<void>;
  executeSettlement: (id: string, data?: Record<string, unknown>) => Promise<unknown>;
  batchSettlement: (ids: string[]) => Promise<unknown>;
}

export const useSettlementStore = create<SettlementState>((set) => ({
  settlements: [],
  total: 0,
  loading: false,

  fetchSettlements: async (filters) => {
    set({ loading: true });
    try {
      const res = await settlementApi.getSettlements(filters);
      set({ settlements: res.data?.list || [], total: res.data?.total || 0 });
    } catch {
      set({ settlements: [], total: 0 });
    } finally {
      set({ loading: false });
    }
  },

  executeSettlement: async (id, data) => {
    set({ loading: true });
    try {
      const res = await settlementApi.executeSettlement(id, data);
      return res.data;
    } finally {
      set({ loading: false });
    }
  },

  batchSettlement: async (ids) => {
    set({ loading: true });
    try {
      const res = await settlementApi.batchSettlement(ids);
      return res.data;
    } finally {
      set({ loading: false });
    }
  },
}));
