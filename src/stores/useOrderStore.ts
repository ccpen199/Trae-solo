import { create } from 'zustand';
import { orderApi } from '@/utils/api';

interface OrderState {
  orders: unknown[];
  currentOrder: Record<string, unknown> | null;
  total: number;
  loading: boolean;
  fetchOrders: (filters?: Record<string, string | number>) => Promise<void>;
  fetchOrderDetail: (id: string) => Promise<void>;
  createOrder: (data: Record<string, unknown>) => Promise<unknown>;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  currentOrder: null,
  total: 0,
  loading: false,

  fetchOrders: async (filters) => {
    set({ loading: true });
    try {
      const res = await orderApi.getOrders(filters);
      set({ orders: res.data?.list || [], total: res.data?.total || 0 });
    } catch {
      set({ orders: [], total: 0 });
    } finally {
      set({ loading: false });
    }
  },

  fetchOrderDetail: async (id) => {
    set({ loading: true });
    try {
      const res = await orderApi.getOrderDetail(id);
      set({ currentOrder: res.data || null });
    } catch {
      set({ currentOrder: null });
    } finally {
      set({ loading: false });
    }
  },

  createOrder: async (data) => {
    set({ loading: true });
    try {
      const res = await orderApi.createOrder(data);
      return res.data;
    } finally {
      set({ loading: false });
    }
  },
}));
