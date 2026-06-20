// 订单全局状态：Zustand Store

import { create } from 'zustand';
import type { Order, PageResult } from '@/types';
import { http } from '@/api/http';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;

  fetchOrders: (params?: { userId?: string; status?: string; page?: number; pageSize?: number }) => Promise<void>;
  createOrder: (payload: Partial<Order>) => Promise<Order | null>;
  fetchOrderDetail: (id: string) => Promise<Order | null>;
  signAgreement: (id: string) => Promise<boolean>;
  setCurrentOrder: (o: Order | null) => void;
  resetOrders: () => void;
}

export const useOrderStore = create<OrderState>()((set, get) => ({
  orders: [],
  currentOrder: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  pageSize: 10,

  fetchOrders: async (params) => {
    set({ loading: true, error: null });
    try {
      const query = new URLSearchParams();
      if (params?.userId) query.set('userId', params.userId);
      if (params?.status) query.set('status', params.status);
      const page = params?.page ?? get().page;
      const pageSize = params?.pageSize ?? get().pageSize;
      query.set('page', String(page));
      query.set('pageSize', String(pageSize));
      const res = await http.get<PageResult<Order>>(`/api/orders?${query.toString()}`);
      set({
        orders: res.data.list,
        total: res.data.total,
        page,
        pageSize,
        loading: false,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '加载订单失败';
      set({ error: msg, loading: false });
    }
  },

  createOrder: async (payload) => {
    set({ loading: true, error: null });
    try {
      const res = await http.post<Order>('/api/orders', payload);
      set((st) => ({
        orders: [res.data, ...st.orders],
        currentOrder: res.data,
        loading: false,
      }));
      return res.data;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '创建订单失败';
      set({ error: msg, loading: false });
      return null;
    }
  },

  fetchOrderDetail: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await http.get<Order & { inspector?: unknown }>(`/api/orders/${id}`);
      set({ currentOrder: res.data, loading: false });
      return res.data;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '加载订单详情失败';
      set({ error: msg, loading: false });
      return null;
    }
  },

  signAgreement: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await http.post<Order>(`/api/orders/${id}/sign`);
      set((st) => ({
        currentOrder: res.data,
        orders: st.orders.map((o) => (o.id === id ? res.data : o)),
        loading: false,
      }));
      return true;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '签署协议失败';
      set({ error: msg, loading: false });
      return false;
    }
  },

  setCurrentOrder: (o) => set({ currentOrder: o }),
  resetOrders: () => set({ orders: [], currentOrder: null, total: 0, page: 1 }),
}));

export default useOrderStore;
