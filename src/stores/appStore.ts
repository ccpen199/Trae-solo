import { create } from 'zustand';
import type {
  UserRole,
  RiderProfile,
  Order,
  OrderEvidence,
  User,
  UserWallet,
  FinanceLedger,
  GeoPoint,
  OrderStatus,
  TrackPoint,
  ToastType,
} from '@/types';
import {
  generateMockRiders,
  generateMockOrders,
  generateMockEvidences,
  generateMockUsers,
  generateMockWallets,
  generateMockFinanceLedgers,
} from '@/utils/mockData';

interface Toast {
  message: string;
  type: ToastType;
}

export interface ToastState {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface AppState {
  currentRole: UserRole;
  isSidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toast: Toast | null;
  toasts: ToastState[];
  mockRiders: RiderProfile[];
  mockOrders: Order[];
  mockEvidences: OrderEvidence[];
  mockUsers: User[];
  mockWallets: UserWallet[];
  mockLedgers: FinanceLedger[];
  currentUserId: string;
  currentRiderId: string;
  setRole: (role: UserRole) => void;
  toggleSidebar: () => void;
  showToast: (message: string, type?: Toast['type']) => void;
  clearToast: () => void;
  addToast: (toast: Omit<ToastState, 'id'>) => void;
  removeToast: (id: string) => void;
  updateRiderLocation: (riderId: string, location: GeoPoint) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  assignOrderRider: (orderId: string, riderId: string) => void;
  addTrackPoint: (orderId: string, trackPoint: TrackPoint) => void;
  initMockData: () => void;
}

let toastCounter = 0;

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: 'user',
  isSidebarOpen: true,
  sidebarCollapsed: false,
  toast: null,
  toasts: [],
  mockRiders: [],
  mockOrders: [],
  mockEvidences: [],
  mockUsers: [],
  mockWallets: [],
  mockLedgers: [],
  currentUserId: 'u_demo_user',
  currentRiderId: 'r_demo_rider',

  setRole: (role) => set({ currentRole: role }),

  toggleSidebar: () =>
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
      sidebarCollapsed: state.isSidebarOpen,
    })),

  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => {
      get().clearToast();
    }, 3000);
  },

  clearToast: () => set({ toast: null }),

  addToast: (toast) =>
    set((state) => {
      const id = `toast_${Date.now()}_${toastCounter++}`;
      const newToast = { ...toast, id };
      const duration = toast.duration ?? 3000;
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
      return { toasts: [...state.toasts, newToast] };
    }),

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  updateRiderLocation: (riderId, location) =>
    set((state) => ({
      mockRiders: state.mockRiders.map((rider) =>
        rider.userId === riderId ? { ...rider, location } : rider
      ),
    })),

  updateOrderStatus: (orderId, status) =>
    set((state) => ({
      mockOrders: state.mockOrders.map((order) =>
        order.id === orderId ? { ...order, status } : order
      ),
    })),

  assignOrderRider: (orderId, riderId) =>
    set((state) => ({
      mockOrders: state.mockOrders.map((order) =>
        order.id === orderId
          ? { ...order, riderId, acceptedAt: new Date() }
          : order
      ),
    })),

  addTrackPoint: (_orderId, _trackPoint) => {},

  initMockData: () => {
    const mockUsers = generateMockUsers(25);
    const mockRiders = generateMockRiders(20);
    const mockOrders = generateMockOrders(15, mockRiders, mockUsers);
    const mockEvidences = generateMockEvidences(mockOrders);
    const mockWallets = generateMockWallets(mockUsers);
    const mockLedgers = generateMockFinanceLedgers(mockOrders);
    set({
      mockUsers,
      mockRiders,
      mockOrders,
      mockEvidences,
      mockWallets,
      mockLedgers,
    });
  },
}));

useAppStore.getState().initMockData();

export default useAppStore;
