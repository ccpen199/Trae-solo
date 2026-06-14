import { create } from 'zustand';
import { processorApi } from '@/utils/api';

interface ProcessorState {
  processors: unknown[];
  total: number;
  loading: boolean;
  fetchProcessors: (params?: Record<string, string | number>) => Promise<void>;
  auditProcessor: (id: string, data: Record<string, unknown>) => Promise<unknown>;
}

export const useProcessorStore = create<ProcessorState>((set) => ({
  processors: [],
  total: 0,
  loading: false,

  fetchProcessors: async (params) => {
    set({ loading: true });
    try {
      const res = await processorApi.getProcessors(params);
      set({ processors: res.data?.list || [], total: res.data?.total || 0 });
    } catch {
      set({ processors: [], total: 0 });
    } finally {
      set({ loading: false });
    }
  },

  auditProcessor: async (id, data) => {
    set({ loading: true });
    try {
      const res = await processorApi.auditProcessor(id, data);
      return res.data;
    } finally {
      set({ loading: false });
    }
  },
}));
