import { create } from 'zustand';
import type { Order, OrderStatus, CartItem, ShippingAddress } from '@/types';

interface OrderState {
  orders: Order[];
  currentOrder: Order | null;
  loading: boolean;
}

interface OrderActions {
  fetchOrders: () => Promise<void>;
  fetchOrderById: (id: string) => Promise<void>;
  createOrder: (items: CartItem[], shippingAddress: ShippingAddress) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
}

export const useOrderStore = create<OrderState & OrderActions>((set) => ({
  orders: [],
  currentOrder: null,
  loading: false,

  fetchOrders: async () => {
    set({ loading: true });
    try {
      set({ loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchOrderById: async (id: string) => {
    set({ loading: true });
    try {
      set({ loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createOrder: async (items: CartItem[], shippingAddress: ShippingAddress) => {
    set({ loading: true });
    try {
      const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      const newOrder: Order = {
        id: Date.now().toString(),
        orderNo: `ORD${Date.now()}`,
        userId: '',
        items,
        totalAmount,
        shippingFee: 0,
        discountAmount: 0,
        payableAmount: totalAmount,
        paymentMethod: '',
        splitDetails: {
          platformFee: 0,
          designerRoyalty: 0,
          factoryCost: 0,
        },
        shippingAddress,
        status: 'pending_payment' as OrderStatus,
        productionNodes: [],
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        orders: [newOrder, ...state.orders],
        currentOrder: newOrder,
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  cancelOrder: async (id: string) => {
    set({ loading: true });
    try {
      set((state) => ({
        orders: state.orders.map((order) =>
          order.id === id ? { ...order, status: 'cancelled' as OrderStatus, cancelledAt: new Date().toISOString() } : order
        ),
        currentOrder:
          state.currentOrder?.id === id
            ? { ...state.currentOrder, status: 'cancelled' as OrderStatus, cancelledAt: new Date().toISOString() }
            : state.currentOrder,
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },
}));
