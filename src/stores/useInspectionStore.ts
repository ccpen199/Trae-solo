import { create } from 'zustand';
import { inspectionApi } from '@/utils/api';

interface InspectionState {
  inspections: unknown[];
  currentInspection: Record<string, unknown> | null;
  total: number;
  loading: boolean;
  fetchInspections: (filters?: Record<string, string | number>) => Promise<void>;
  fetchInspectionDetail: (id: string) => Promise<void>;
  checkStep: (id: string, data: Record<string, unknown>) => Promise<unknown>;
  aiScreen: (id: string) => Promise<unknown>;
}

export const useInspectionStore = create<InspectionState>((set) => ({
  inspections: [],
  currentInspection: null,
  total: 0,
  loading: false,

  fetchInspections: async (filters) => {
    set({ loading: true });
    try {
      const res = await inspectionApi.getInspections(filters);
      set({ inspections: res.data?.list || [], total: res.data?.total || 0 });
    } catch {
      set({ inspections: [], total: 0 });
    } finally {
      set({ loading: false });
    }
  },

  fetchInspectionDetail: async (id) => {
    set({ loading: true });
    try {
      const res = await inspectionApi.getInspectionDetail(id);
      set({ currentInspection: res.data || null });
    } catch {
      set({ currentInspection: null });
    } finally {
      set({ loading: false });
    }
  },

  checkStep: async (id, data) => {
    set({ loading: true });
    try {
      const res = await inspectionApi.checkStep(id, data);
      return res.data;
    } finally {
      set({ loading: false });
    }
  },

  aiScreen: async (id) => {
    set({ loading: true });
    try {
      const res = await inspectionApi.aiScreen(id);
      return res.data;
    } finally {
      set({ loading: false });
    }
  },
}));
