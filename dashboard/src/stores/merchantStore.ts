import { create } from 'zustand';
import type { Merchant, SettlementRecord, PaginationRequest } from '@shared/types';
import { mockMerchantService } from '../services/mockService';

interface MerchantState {
  merchants: Merchant[];
  selectedMerchant: Merchant | null;
  settlements: SettlementRecord[];
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };
  settlementPagination: { page: number; pageSize: number; total: number };
  fetchMerchants: (params?: PaginationRequest & { status?: string; district?: string; category?: string }) => Promise<void>;
  fetchMerchantById: (id: string) => Promise<Merchant | null>;
  createMerchant: (data: Partial<Merchant>) => Promise<Merchant>;
  updateMerchant: (id: string, data: Partial<Merchant>) => Promise<Merchant>;
  fetchSettlements: (params?: PaginationRequest & { status?: string }) => Promise<void>;
  setSelectedMerchant: (merchant: Merchant | null) => void;
}

export const useMerchantStore = create<MerchantState>((set) => ({
  merchants: [],
  selectedMerchant: null,
  settlements: [],
  isLoading: false,
  error: null,
  pagination: { page: 1, pageSize: 10, total: 0 },
  settlementPagination: { page: 1, pageSize: 10, total: 0 },
  fetchMerchants: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockMerchantService.getMerchants(params);
      set({
        merchants: response.items,
        pagination: { page: response.page, pageSize: response.pageSize, total: response.total },
        isLoading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取商户列表失败', isLoading: false });
    }
  },
  fetchMerchantById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const merchant = await mockMerchantService.getMerchantById(id);
      set({ selectedMerchant: merchant, isLoading: false });
      return merchant;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取商户详情失败', isLoading: false });
      return null;
    }
  },
  createMerchant: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const merchant = await mockMerchantService.createMerchant(data);
      set({ isLoading: false });
      return merchant;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建商户失败', isLoading: false });
      throw err;
    }
  },
  updateMerchant: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const merchant = await mockMerchantService.updateMerchant(id, data);
      set({ isLoading: false });
      return merchant;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '更新商户失败', isLoading: false });
      throw err;
    }
  },
  fetchSettlements: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockMerchantService.getSettlements(params);
      set({
        settlements: response.items,
        settlementPagination: { page: response.page, pageSize: response.pageSize, total: response.total },
        isLoading: false,
      });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取结算记录失败', isLoading: false });
    }
  },
  setSelectedMerchant: (merchant) => {
    set({ selectedMerchant: merchant });
  },
}));
