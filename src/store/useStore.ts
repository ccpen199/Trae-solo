import { create } from 'zustand';
import type { AppStore } from '../../shared/types';
import {
  mockUser,
  mockOrders,
  mockQualityOrders,
  mockPricingRules,
  mockPayouts,
  mockCouriers,
  mockProcessors,
  mockAnalytics,
  brandList,
  mockAddresses,
  mockTimeWindows,
  mockMaterialTraces,
  mockDonationFlows,
} from '../data/mockData';

export const useStore = create<AppStore>((set) => ({
  currentUser: mockUser,
  bookingInfo: {
    category: null,
    condition: 7,
  },
  orders: mockOrders,
  currentOrder: null,
  qualityOrders: mockQualityOrders,
  pricingRules: mockPricingRules,
  payouts: mockPayouts,
  couriers: mockCouriers,
  processors: mockProcessors,
  materialTraces: mockMaterialTraces,
  donationFlows: mockDonationFlows,
  analytics: mockAnalytics,
  brands: brandList,
  addresses: mockAddresses,
  timeWindows: mockTimeWindows,
  navigation: {
    currentPage: '/user/home',
    sidebarCollapsed: false,
    activeTab: 'overview',
  },

  setCurrentUser: (user) => set({ currentUser: user }),

  updateBookingInfo: (info) =>
    set((state) => ({
      bookingInfo: { ...state.bookingInfo, ...info },
    })),

  resetBookingInfo: () =>
    set({
      bookingInfo: {
        category: null,
        condition: 7,
      },
    }),

  setOrders: (orders) => set({ orders }),

  addOrder: (order) =>
    set((state) => ({
      orders: [order, ...state.orders],
    })),

  updateOrder: (id, updates) =>
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      ),
      currentOrder:
        state.currentOrder?.id === id
          ? { ...state.currentOrder, ...updates }
          : state.currentOrder,
    })),

  deleteOrder: (id) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
      currentOrder: state.currentOrder?.id === id ? null : state.currentOrder,
    })),

  setCurrentOrder: (order) => set({ currentOrder: order }),

  setQualityOrders: (orders) => set({ qualityOrders: orders }),

  addQualityOrder: (order) =>
    set((state) => ({
      qualityOrders: [order, ...state.qualityOrders],
    })),

  updateQualityOrder: (id, updates) =>
    set((state) => ({
      qualityOrders: state.qualityOrders.map((q) =>
        q.id === id ? { ...q, ...updates } : q
      ),
    })),

  setPricingRules: (rules) => set({ pricingRules: rules }),

  addPricingRule: (rule) =>
    set((state) => ({
      pricingRules: [rule, ...state.pricingRules],
    })),

  updatePricingRule: (id, updates) =>
    set((state) => ({
      pricingRules: state.pricingRules.map((r) =>
        r.id === id ? { ...r, ...updates } : r
      ),
    })),

  deletePricingRule: (id) =>
    set((state) => ({
      pricingRules: state.pricingRules.filter((r) => r.id !== id),
    })),

  setPayouts: (payouts) => set({ payouts }),

  updatePayout: (id, updates) =>
    set((state) => ({
      payouts: state.payouts.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  setCouriers: (couriers) => set({ couriers }),

  addCourier: (courier) =>
    set((state) => ({
      couriers: [...state.couriers, courier],
    })),

  updateCourier: (id, updates) =>
    set((state) => ({
      couriers: state.couriers.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  setProcessors: (processors) => set({ processors }),

  addProcessor: (processor) =>
    set((state) => ({
      processors: [...state.processors, processor],
    })),

  updateProcessor: (id, updates) =>
    set((state) => ({
      processors: state.processors.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),

  setAnalytics: (data) => set({ analytics: data }),

  setNavigation: (nav) =>
    set((state) => ({
      navigation: { ...state.navigation, ...nav },
    })),
}));
