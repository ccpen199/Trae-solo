import { create } from 'zustand';
import type { VerificationRecord, VerificationTrendData, PaginationRequest, PaginationResponse, DashboardStats } from '@shared/types';
import { mockVerificationService } from '../services/mockService';

interface VerificationState {
  records: VerificationRecord[];
  trendData: VerificationTrendData[];
  stats: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };
  fetchRecords: (params?: PaginationRequest & { startDate?: string; endDate?: string; status?: string }) => Promise<void>;
  fetchTrendData: (days?: number) => Promise<void>;
  fetchStats: () => Promise<void>;
  exportRecords: (params?: { startDate?: string; endDate?: string }) => Promise<Blob>;
  reverseVerification: (id: string, reason: string) => Promise<void>;
}

export const useVerificationStore = create<VerificationState>((set) => ({
  records: [],
  trendData: [],
  stats: null,
  isLoading: false,
  error: null,
  pagination: { page: 1, pageSize: 10, total: 0 },
  fetchRecords: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockVerificationService.getRecords(params);
      set({ records: response.items, pagination: { page: response.page, pageSize: response.pageSize, total: response.total }, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取核销记录失败', isLoading: false });
    }
  },
  fetchTrendData: async (days = 30) => {
    set({ isLoading: true, error: null });
    try {
      const data = await mockVerificationService.getTrendData(days);
      set({ trendData: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取趋势数据失败', isLoading: false });
    }
  },
  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await mockVerificationService.getStats();
      set({ stats, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取统计数据失败', isLoading: false });
    }
  },
  exportRecords: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const blob = await mockVerificationService.exportRecords(params);
      set({ isLoading: false });
      return blob;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '导出失败', isLoading: false });
      throw err;
    }
  },
  reverseVerification: async (id, reason) => {
    set({ isLoading: true, error: null });
    try {
      await mockVerificationService.reverse(id, reason);
      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '撤销核销失败', isLoading: false });
      throw err;
    }
  },
}));
