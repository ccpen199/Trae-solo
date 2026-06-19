import { create } from 'zustand';
import type {
  Inventory,
  InventoryLog,
  PaginationRequest,
  PaginationResponse,
  ReplenishmentRecord,
  ReconciliationRecord,
  InventoryAlert,
  VerificationSourceDistribution,
  InventoryTrendData,
  InventoryAlertStatus,
} from '@shared/types';
import { mockInventoryService } from '../services/mockService';

interface InventoryState {
  inventoryList: Inventory[];
  inventoryLogs: InventoryLog[];
  replenishmentRecords: ReplenishmentRecord[];
  reconciliationRecords: ReconciliationRecord[];
  inventoryAlerts: InventoryAlert[];
  verificationSourceDistribution: VerificationSourceDistribution | null;
  inventoryTrend: InventoryTrendData[];
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };
  replenishmentPagination: { page: number; pageSize: number; total: number };
  fetchInventory: (params?: PaginationRequest & { lowStock?: boolean }) => Promise<void>;
  fetchInventoryLogs: (inventoryId: string) => Promise<void>;
  replenishInventory: (inventoryId: string, quantity: number, remark?: string) => Promise<void>;
  adjustInventory: (inventoryId: string, quantity: number, remark?: string) => Promise<void>;
  fetchVerificationSourceDistribution: (inventoryId: string) => Promise<void>;
  fetchInventoryTrend: (inventoryId: string, days?: number) => Promise<void>;
  fetchReplenishmentRecords: (params?: PaginationRequest & { inventoryId?: string; status?: string }) => Promise<void>;
  createReplenishment: (data: Partial<ReplenishmentRecord>) => Promise<void>;
  approveReplenishment: (id: string) => Promise<void>;
  cancelReplenishment: (id: string) => Promise<void>;
  fetchReconciliationRecords: (params?: PaginationRequest & { inventoryId?: string; status?: string }) => Promise<void>;
  fetchInventoryAlerts: (params?: PaginationRequest & { inventoryId?: string; level?: string; status?: string }) => Promise<void>;
  handleInventoryAlert: (id: string, status: InventoryAlertStatus, notes?: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  inventoryList: [],
  inventoryLogs: [],
  replenishmentRecords: [],
  reconciliationRecords: [],
  inventoryAlerts: [],
  verificationSourceDistribution: null,
  inventoryTrend: [],
  isLoading: false,
  error: null,
  pagination: { page: 1, pageSize: 10, total: 0 },
  replenishmentPagination: { page: 1, pageSize: 10, total: 0 },
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
  fetchVerificationSourceDistribution: async (inventoryId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await mockInventoryService.getVerificationSourceDistribution(inventoryId);
      set({ verificationSourceDistribution: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取核销来源分布失败', isLoading: false });
    }
  },
  fetchInventoryTrend: async (inventoryId, days = 7) => {
    set({ isLoading: true, error: null });
    try {
      const data = await mockInventoryService.getInventoryTrend(inventoryId, days);
      set({ inventoryTrend: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取库存趋势失败', isLoading: false });
    }
  },
  fetchReplenishmentRecords: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockInventoryService.getReplenishmentRecords(params);
      set({
        replenishmentRecords: response.items,
        replenishmentPagination: { page: response.page, pageSize: response.pageSize, total: response.total },
        isLoading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取补货记录失败', isLoading: false });
    }
  },
  createReplenishment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      await mockInventoryService.createReplenishment(data);
      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建补货申请失败', isLoading: false });
      throw err;
    }
  },
  approveReplenishment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await mockInventoryService.approveReplenishment(id);
      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '审批补货失败', isLoading: false });
      throw err;
    }
  },
  cancelReplenishment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await mockInventoryService.cancelReplenishment(id);
      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '取消补货失败', isLoading: false });
      throw err;
    }
  },
  fetchReconciliationRecords: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockInventoryService.getReconciliationRecords(params);
      set({ reconciliationRecords: response.items, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取对账记录失败', isLoading: false });
    }
  },
  fetchInventoryAlerts: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockInventoryService.getInventoryAlerts(params);
      set({ inventoryAlerts: response.items, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取库存预警失败', isLoading: false });
    }
  },
  handleInventoryAlert: async (id, status, notes) => {
    set({ isLoading: true, error: null });
    try {
      await mockInventoryService.handleInventoryAlert(id, status, notes);
      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '处理预警失败', isLoading: false });
      throw err;
    }
  },
}));
