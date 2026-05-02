import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      login: (token, user) => set({
        token,
        user,
        isAuthenticated: true
      }),
      
      logout: () => set({
        token: null,
        user: null,
        isAuthenticated: false
      }),
      
      updateUser: (user) => set({ user }),
      
      hasRole: (role) => {
        const user = get().user;
        return user?.role === role;
      },
      
      isInvestor: () => get().user?.role === 'investor',
      isRiskOfficer: () => get().user?.role === 'risk_officer',
      isExchangeAdmin: () => get().user?.role === 'exchange_admin',
      isFinancialSettler: () => get().user?.role === 'financial_settler',
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useMarketStore = create((set) => ({
  securities: [],
  selectedSecurity: null,
  orderBook: { bids: [], asks: [] },
  marketData: null,
  subscriptions: new Set(),
  
  setSecurities: (securities) => set({ securities }),
  setSelectedSecurity: (security) => set({ selectedSecurity: security }),
  setOrderBook: (orderBook) => set({ orderBook }),
  setMarketData: (data) => set({ marketData: data }),
  
  updateSecurityPrice: (code, price, volume) => set((state) => ({
    securities: state.securities.map(s => 
      s.code === code ? { ...s, currentPrice: price, volume: (s.volume || 0) + volume } : s
    )
  })),
  
  addSubscription: (code) => set((state) => {
    const newSubs = new Set(state.subscriptions);
    newSubs.add(code);
    return { subscriptions: newSubs };
  }),
  
  removeSubscription: (code) => set((state) => {
    const newSubs = new Set(state.subscriptions);
    newSubs.delete(code);
    return { subscriptions: newSubs };
  }),
}));

export const usePortfolioStore = create((set) => ({
  funds: null,
  positions: [],
  orders: [],
  
  setFunds: (funds) => set({ funds }),
  setPositions: (positions) => set({ positions }),
  setOrders: (orders) => set({ orders }),
  
  addOrder: (order) => set((state) => ({
    orders: [order, ...state.orders]
  })),
  
  updateOrder: (orderId, updates) => set((state) => ({
    orders: state.orders.map(o => 
      o.id === orderId ? { ...o, ...updates } : o
    )
  })),
}));
