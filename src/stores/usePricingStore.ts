import { create } from 'zustand';
import { pricingApi } from '@/utils/api';

interface PricingState {
  rules: unknown[];
  loading: boolean;
  fetchRules: (params?: Record<string, string | number>) => Promise<void>;
  createRule: (data: Record<string, unknown> | { [key: string]: unknown }) => Promise<unknown>;
  updateRule: (id: string, data: Record<string, unknown> | { [key: string]: unknown }) => Promise<unknown>;
  calculatePrice: (data: Record<string, unknown> | { [key: string]: unknown }) => Promise<unknown>;
}

export const usePricingStore = create<PricingState>((set) => ({
  rules: [],
  loading: false,

  fetchRules: async (params) => {
    set({ loading: true });
    try {
      const res = await pricingApi.getRules(params);
      set({ rules: res.data || [] });
    } catch {
      set({ rules: [] });
    } finally {
      set({ loading: false });
    }
  },

  createRule: async (data) => {
    set({ loading: true });
    try {
      const res = await pricingApi.createRule(data);
      return res.data;
    } finally {
      set({ loading: false });
    }
  },

  updateRule: async (id, data) => {
    set({ loading: true });
    try {
      const res = await pricingApi.updateRule(id, data);
      return res.data;
    } finally {
      set({ loading: false });
    }
  },

  calculatePrice: async (data) => {
    set({ loading: true });
    try {
      const res = await pricingApi.calculatePrice(data);
      return res.data;
    } finally {
      set({ loading: false });
    }
  },
}));
