import { create } from 'zustand';
import type { Inventory, InventoryLog, PaginationRequest, PaginationResponse } from '@shared/types';
import { mockInventoryService } from '../services/mockService';

interface InventoryState {
  inventoryList: Inventory[];
  inventoryLogs: InventoryLog[];
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };
  fetchInventory: (params?: PaginationRequest & { lowStock?: boolean }) => Promise<void>;
  fetchInventoryLogs: (inventoryId: string) => Promise<void>;
  replenishInventory: (inventoryId: string, quantity: number, remark?: string) => Promise<void>;
  adjustInventory: (inventoryId: string, quantity: number, remark?: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  inventoryList: [],
  inventoryLogs: [],
  isLoading: false,
  error: null,
  pagination: { page: 1, pageSize: 10, total: 0 },
  fetchInventory: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockInventoryService.getInventoryList(params);
      set({ inventoryList: response.items, pagination: { page: response.page, pageSize: response.pageSize, total: response.total }, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取库存列表失败', isLoading: false });
    }
  },
  fetchInventoryLogs: async (inventoryId) => {
    set({ isLoading: true, error: null });
    try {
      const logs = await mockInventoryService.getInventoryLogs(inventoryId);
      set({ inventoryLogs: logs, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取库存日志失败', isLoading: false });
    }
  },
  replenishInventory: async (inventoryId, quantity, remark) => {
    set({ isLoading: true, error: null });
    try {
      await mockInventoryService.replenish(inventoryId, quantity, remark);
      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '补货失败', isLoading: false });
      throw err;
    }
  },
  adjustInventory: async (inventoryId, quantity, remark) => {
    set({ isLoading: true, error: null });
    try {
      await mockInventoryService.adjust(inventoryId, quantity, remark);
      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '调整库存失败', isLoading: false });
      throw err;
    }
  },
}));
