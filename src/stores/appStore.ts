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
  updateLedger: (ledgerId: string, updates: Partial<FinanceLedger>) => void;
  addLedger: (ledger: FinanceLedger) => void;
  retryLedger: (ledgerId: string) => Promise<void>;
  compensateLedger: (ledgerId: string, amount: number, reason: string, account?: string) => void;
  closeLedgerManual: (ledgerId: string, remark: string) => void;
  markLedgerReviewing: (ledgerId: string) => void;
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

  updateLedger: (ledgerId, updates) =>
    set((state) => ({
      mockLedgers: state.mockLedgers.map((l) =>
        l.id === ledgerId ? { ...l, ...updates } : l
      ),
    })),

  addLedger: (ledger) =>
    set((state) => ({
      mockLedgers: [ledger, ...state.mockLedgers],
    })),

  retryLedger: async (ledgerId) => {
    const { updateLedger, addToast, mockLedgers } = get();
    const ledger = mockLedgers.find((l) => l.id === ledgerId);
    if (!ledger) return;

    updateLedger(ledgerId, { status: 'retrying' });
    addToast({ message: `流水 ${ledgerId.slice(-8)} 已进入重试队列`, type: 'info' });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const success = Math.random() > 0.3;
    if (success) {
      updateLedger(ledgerId, {
        status: 'success',
        settledAt: new Date(),
        channelTxnId: `ch_${Date.now().toString(36)}`,
        retryCount: (ledger.retryCount ?? 0) + 1,
      });
      addToast({ message: `流水 ${ledgerId.slice(-8)} 重试成功`, type: 'success' });
    } else {
      updateLedger(ledgerId, {
        status: 'failed',
        retryCount: (ledger.retryCount ?? 0) + 1,
        failureReason: '通道超时，重试失败',
        failReason: '通道超时，重试失败',
      });
      addToast({ message: `流水 ${ledgerId.slice(-8)} 重试失败，已累计重试 ${(ledger.retryCount ?? 0) + 1} 次`, type: 'error' });
    }
  },

  compensateLedger: (ledgerId, amount, reason, account) => {
    const { updateLedger, addLedger, addToast, mockLedgers } = get();
    const ledger = mockLedgers.find((l) => l.id === ledgerId);
    if (!ledger) return;

    const newLedger: FinanceLedger = {
      id: `fnc_${Date.now().toString(36)}`,
      orderId: ledger.orderId,
      relatedLedgerId: ledger.id,
      userId: ledger.userId,
      riderId: ledger.riderId,
      accountType: ledger.accountType,
      direction: 'debit',
      amount,
      type: 'compensation',
      channel: ledger.channel,
      channelTxnId: `ch_${Date.now().toString(36)}`,
      status: 'compensated',
      createdAt: new Date(),
      settledAt: new Date(),
      reviewedBy: '财务管理员',
      reviewedAt: new Date(),
      handlerName: '财务管理员',
      handledAt: new Date(),
      remark: reason,
      balanceAfter: ledger.balanceAfter ? ledger.balanceAfter + amount : undefined,
    };

    addLedger(newLedger);
    updateLedger(ledgerId, {
      status: 'compensated',
      reviewNote: `已补偿 ¥${amount.toFixed(2)}，原因：${reason}${account ? `，账户：${account}` : ''}`,
      reviewedBy: '财务管理员',
      reviewedAt: new Date(),
      handlerName: '财务管理员',
      handledAt: new Date(),
      remark: reason,
    });

    addToast({ message: `补偿流水已生成 ¥${amount.toFixed(2)}`, type: 'success' });
  },

  closeLedgerManual: (ledgerId, remark) => {
    const { updateLedger, addToast } = get();
    updateLedger(ledgerId, {
      status: 'manual_closed',
      remark,
      handlerName: '财务管理员',
      handledAt: new Date(),
      reviewNote: `人工关闭：${remark}`,
      reviewedBy: '财务管理员',
      reviewedAt: new Date(),
    });
    addToast({ message: `流水 ${ledgerId.slice(-8)} 已标记为人工处理`, type: 'success' });
  },

  markLedgerReviewing: (ledgerId) => {
    const { updateLedger, addToast } = get();
    updateLedger(ledgerId, {
      status: 'reviewing',
      handlerName: '财务管理员',
      handledAt: new Date(),
    });
    addToast({ message: `流水 ${ledgerId.slice(-8)} 已进入复核状态`, type: 'info' });
  },

  initMockData: () => {
    const mockUsers = generateMockUsers(25);
    const mockRiders = generateMockRiders(20);
    const mockOrders = generateMockOrders(15, mockRiders, mockUsers);
    const mockEvidences = generateMockEvidences(mockOrders);
    const mockWallets = generateMockWallets(mockUsers);
    const mockLedgers = generateMockFinanceLedgers(mockOrders, mockUsers, mockRiders);
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
