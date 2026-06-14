import { create } from 'zustand';
import { estimateApi } from '@/utils/api';

interface EstimateState {
  estimateResult: Record<string, unknown> | null;
  loading: boolean;
  submitEstimate: (data: Record<string, unknown>) => Promise<unknown>;
}

export const useEstimateStore = create<EstimateState>((set) => ({
  estimateResult: null,
  loading: false,

  submitEstimate: async (data) => {
    set({ loading: true });
    try {
      const res = await estimateApi.submitEstimate(data);
      set({ estimateResult: res.data || null });
      return res.data;
    } catch {
      set({ estimateResult: null });
      return null;
    } finally {
      set({ loading: false });
    }
  },
}));
