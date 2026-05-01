import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => set({
        token,
        user,
        isAuthenticated: true
      }),

      updateUser: (user) => set({ user }),

      logout: () => set({
        token: null,
        user: null,
        isAuthenticated: false
      })
    }),
    {
      name: 'auth-storage'
    }
  )
);

const useLiveStore = create((set, get) => ({
  currentLive: null,
  viewerCount: 0,
  likeCount: 0,
  messages: [],
  products: [],
  activeFlashSales: [],
  isLive: false,

  setCurrentLive: (live) => set({ currentLive: live, isLive: live?.status === 'live' }),

  setViewerCount: (count) => set({ viewerCount: count }),

  setLikeCount: (count) => set({ likeCount: count }),

  addMessage: (message) => set((state) => ({
    messages: [...state.messages.slice(-200), message]
  })),

  setProducts: (products) => set({ products }),

  setActiveFlashSales: (sales) => set({ activeFlashSales: sales }),

  addFlashSale: (sale) => set((state) => ({
    activeFlashSales: [...state.activeFlashSales, sale]
  })),

  removeFlashSale: (saleId) => set((state) => ({
    activeFlashSales: state.activeFlashSales.filter(s => s.id !== saleId)
  })),

  clearLive: () => set({
    currentLive: null,
    viewerCount: 0,
    likeCount: 0,
    messages: [],
    products: [],
    activeFlashSales: [],
    isLive: false
  })
}));

const useOrderStore = create((set) => ({
  orders: [],
  total: 0,

  setOrders: (orders, total) => set({ orders, total }),

  addOrder: (order) => set((state) => ({
    orders: [order, ...state.orders],
    total: state.total + 1
  })),

  updateOrderStatus: (orderId, status) => set((state) => ({
    orders: state.orders.map(o => 
      o.id === orderId ? { ...o, status } : o
    )
  }))
}));

export { useAuthStore, useLiveStore, useOrderStore };
