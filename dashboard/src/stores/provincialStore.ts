import { create } from 'zustand';
import type { ProvincialSettlementRecord, ProvincialPlatformConfig, PaginationRequest } from '@shared/types';
import { mockProvincialService } from '../services/mockService';

interface ProvincialState {
  settlements: ProvincialSettlementRecord[];
  config: ProvincialPlatformConfig | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };
  fetchSettlements: (params?: PaginationRequest & { status?: string }) => Promise<void>;
  fetchConfig: () => Promise<void>;
  updateConfig: (config: Partial<ProvincialPlatformConfig>) => Promise<ProvincialPlatformConfig>;
  syncBatch: (batchId: string) => Promise<void>;
  confirmBatch: (batchId: string) => Promise<void>;
  batchSync: () => Promise<{ success: number; failed: number }>;
}

export const useProvincialStore = create<ProvincialState>((set) => ({
  settlements: [],
  config: null,
  isLoading: false,
  isSyncing: false,
  error: null,
  pagination: { page: 1, pageSize: 10, total: 0 },
  fetchSettlements: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockProvincialService.getSettlements(params);
      set({
        settlements: response.items,
        pagination: { page: response.page, pageSize: response.pageSize, total: response.total },
        isLoading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取省级结算记录失败', isLoading: false });
    }
  },
  fetchConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      const config = await mockProvincialService.getConfig();
      set({ config, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取配置失败', isLoading: false });
    }
  },
  updateConfig: async (config) => {
    set({ isLoading: true, error: null });
    try {
      const updatedConfig = await mockProvincialService.updateConfig(config);
      set({ config: updatedConfig, isLoading: false });
      return updatedConfig;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新配置失败', isLoading: false });
      throw err;
    }
  },
  syncBatch: async (batchId) => {
    set({ isSyncing: true, error: null });
    try {
      await mockProvincialService.syncBatch(batchId);
      set({ isSyncing: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '同步批次失败', isSyncing: false });
      throw err;
    }
  },
  confirmBatch: async (batchId) => {
    set({ isSyncing: true, error: null });
    try {
      await mockProvincialService.confirmBatch(batchId);
      set({ isSyncing: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '确认批次失败', isSyncing: false });
      throw err;
    }
  },
  batchSync: async () => {
    set({ isSyncing: true, error: null });
    try {
      const result = await mockProvincialService.batchSync();
      set({ isSyncing: false });
      return result;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '批量同步失败', isSyncing: false });
      throw err;
    }
  },
}));
