import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Order {
  id: number;
  service_name: string;
  patient_name: string;
  patient_address: string;
  scheduled_time: string;
  status: 'pending' | 'dispatched' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  nurse_name?: string;
  nurse_id?: number;
  family_id: number;
  service_id: number;
  notes?: string;
  created_at: string;
  before_photo?: string;
  after_photo?: string;
  family_confirmed?: boolean;
  gps_points?: { lat: number; lng: number; timestamp: string }[];
  rating?: number;
}

interface OrderFilters {
  status?: string;
  page?: number;
}

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
  fetchOrders: (filters?: OrderFilters) => Promise<void>;
  fetchOrder: (id: number) => Promise<void>;
  createOrder: (data: Record<string, unknown>) => Promise<void>;
  acceptOrder: (id: number) => Promise<void>;
  updateOrderStatus: (id: number, status: string) => Promise<void>;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: [],
  currentOrder: null,
  loading: false,

  fetchOrders: async (filters) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.set('status', filters.status);
      if (filters?.page) params.set('page', String(filters.page));
      const data = await api<Order[]>(`/orders?${params.toString()}`);
      set({ orders: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchOrder: async (id) => {
    set({ loading: true });
    try {
      const data = await api<Order>(`/orders/${id}`);
      set({ currentOrder: data, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createOrder: async (orderData) => {
    await api('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  acceptOrder: async (id) => {
    await api(`/orders/${id}/accept`, { method: 'POST' });
  },

  updateOrderStatus: async (id, status) => {
    await api(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
}));
