import { create } from 'zustand';
import type { Order, OrderStatus, QueryParams, StateStatus, PaginationParams } from '@/types';
import { orderApi } from '@/services/api';
import { websocketService } from '@/services/websocket';

interface OrderState {
  orders: Order[];
  selectedOrder: Order | null;
  pagination: PaginationParams;
  status: StateStatus;
  fetchOrders: (params?: QueryParams) => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  createOrder: (data: Partial<Order>) => Promise<Order>;
  updateOrder: (id: string, data: Partial<Order>) => Promise<void>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  assignRider: (orderId: string, riderId: string) => Promise<void>;
  cancelOrder: (id: string, reason?: string) => Promise<void>;
  setSelectedOrder: (order: Order | null) => void;
  setPagination: (pagination: Partial<PaginationParams>) => void;
  subscribeRealTime: () => () => void;
}

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: [],
  selectedOrder: null,
  pagination: { page: 1, pageSize: 20, total: 0 },
  status: { loading: false, error: null },

  fetchOrders: async (params) => {
    set({ status: { loading: true, error: null } });
    try {
      const result = await orderApi.getList(params);
      set({
        orders: result.orders,
        pagination: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 20,
          total: result.total,
        },
        status: { loading: false, error: null },
      });
    } catch (error) {
      set({
        status: {
          loading: false,
          error: { code: 500, message: error instanceof Error ? error.message : 'Failed to fetch orders' },
        },
      });
    }
  },

  fetchOrderById: async (id) => {
    set({ status: { loading: true, error: null } });
    try {
      const order = await orderApi.getById(id);
      set({ selectedOrder: order, status: { loading: false, error: null } });
    } catch (error) {
      set({
        status: {
          loading: false,
          error: { code: 500, message: error instanceof Error ? error.message : 'Failed to fetch order' },
        },
      });
    }
  },

  createOrder: async (data) => {
    set({ status: { loading: true, error: null } });
    try {
      const order = await orderApi.create(data);
      set({ status: { loading: false, error: null } });
      return order;
    } catch (error) {
      set({
        status: {
          loading: false,
          error: { code: 500, message: error instanceof Error ? error.message : 'Failed to create order' },
        },
      });
      throw error;
    }
  },

  updateOrder: async (id, data) => {
    set({ status: { loading: true, error: null } });
    try {
      const updatedOrder = await orderApi.update(id, data);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? updatedOrder : o)),
        selectedOrder: state.selectedOrder?.id === id ? updatedOrder : state.selectedOrder,
        status: { loading: false, error: null },
      }));
    } catch (error) {
      set({
        status: {
          loading: false,
          error: { code: 500, message: error instanceof Error ? error.message : 'Failed to update order' },
        },
      });
    }
  },

  updateOrderStatus: async (id, status) => {
    set({ status: { loading: true, error: null } });
    try {
      const updatedOrder = await orderApi.updateStatus(id, status);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? updatedOrder : o)),
        selectedOrder: state.selectedOrder?.id === id ? updatedOrder : state.selectedOrder,
        status: { loading: false, error: null },
      }));
    } catch (error) {
      set({
        status: {
          loading: false,
          error: { code: 500, message: error instanceof Error ? error.message : 'Failed to update order status' },
        },
      });
    }
  },

  assignRider: async (orderId, riderId) => {
    set({ status: { loading: true, error: null } });
    try {
      const updatedOrder = await orderApi.assignRider(orderId, riderId);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? updatedOrder : o)),
        selectedOrder: state.selectedOrder?.id === orderId ? updatedOrder : state.selectedOrder,
        status: { loading: false, error: null },
      }));
    } catch (error) {
      set({
        status: {
          loading: false,
          error: { code: 500, message: error instanceof Error ? error.message : 'Failed to assign rider' },
        },
      });
    }
  },

  cancelOrder: async (id, reason) => {
    set({ status: { loading: true, error: null } });
    try {
      await orderApi.cancel(id, reason);
      set((state) => ({
        orders: state.orders.map((o) => (o.id === id ? { ...o, status: 'cancelled' as OrderStatus } : o)),
        status: { loading: false, error: null },
      }));
    } catch (error) {
      set({
        status: {
          loading: false,
          error: { code: 500, message: error instanceof Error ? error.message : 'Failed to cancel order' },
        },
      });
    }
  },

  setSelectedOrder: (order) => {
    set({ selectedOrder: order });
  },

  setPagination: (pagination) => {
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    }));
  },

  subscribeRealTime: () => {
    const unsubStatus = websocketService.onOrderStatusChange(({ orderId, status }) => {
      set((state) => ({
        orders: state.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
        selectedOrder: state.selectedOrder?.id === orderId ? { ...state.selectedOrder, status } : state.selectedOrder,
      }));
    });

    const unsubNewOrder = websocketService.onNewOrder((order) => {
      set((state) => ({
        orders: [order, ...state.orders],
        pagination: { ...state.pagination, total: state.pagination.total + 1 },
      }));
    });

    websocketService.subscribe(['orders']);

    return () => {
      unsubStatus();
      unsubNewOrder();
      websocketService.unsubscribe(['orders']);
    };
  },
}));
