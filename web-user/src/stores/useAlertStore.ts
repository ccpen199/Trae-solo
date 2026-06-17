import { create } from 'zustand';
import type { AlertEvent } from '@/types';
import { alertsApi } from '@/services/api';

interface AlertState {
  alerts: AlertEvent[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
}

interface AlertActions {
  fetchAlerts: (params?: { page?: number; pageSize?: number; level?: string; read?: boolean; type?: string }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  lockAlert: (id: string) => Promise<void>;
  unlockAlert: (id: string) => Promise<void>;
  addAlert: (alert: AlertEvent) => void;
  updateAlert: (id: string, data: Partial<AlertEvent>) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState: AlertState = {
  alerts: [],
  unreadCount: 0,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  pageSize: 20,
};

export const useAlertStore = create<AlertState & AlertActions>((set, get) => ({
  ...initialState,

  fetchAlerts: async (params) => {
    set({ loading: true, error: null });
    try {
      const result = await alertsApi.getAlertList({
        page: params?.page || get().page,
        pageSize: params?.pageSize || get().pageSize,
        level: params?.level,
        read: params?.read,
        type: params?.type,
      });
      set({
        alerts: result.list,
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      });
    } catch (error: any) {
      set({ error: error.message || '获取告警列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const result = await alertsApi.getUnreadCount();
      set({ unreadCount: result.count });
    } catch (error: any) {
      console.error('获取未读告警数量失败:', error.message);
    }
  },

  markAsRead: async (id) => {
    try {
      await alertsApi.markAsRead(id);
      set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === id ? { ...a, read: true } : a
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error: any) {
      set({ error: error.message || '标记已读失败' });
    }
  },

  markAllAsRead: async () => {
    try {
      await alertsApi.markAllAsRead();
      set((state) => ({
        alerts: state.alerts.map((a) => ({ ...a, read: true })),
        unreadCount: 0,
      }));
    } catch (error: any) {
      set({ error: error.message || '全部标记已读失败' });
    }
  },

  lockAlert: async (id) => {
    try {
      await alertsApi.lockAlert(id);
      set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === id ? { ...a, locked: true } : a
        ),
      }));
    } catch (error: any) {
      set({ error: error.message || '锁定告警失败' });
    }
  },

  unlockAlert: async (id) => {
    try {
      await alertsApi.unlockAlert(id);
      set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === id ? { ...a, locked: false } : a
        ),
      }));
    } catch (error: any) {
      set({ error: error.message || '解锁告警失败' });
    }
  },

  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts],
      total: state.total + 1,
      unreadCount: state.unreadCount + 1,
    }));
  },

  updateAlert: (id, data) => {
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, ...data } : a)),
    }));
  },

  setLoading: (loading) => {
    set({ loading });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set(initialState);
  },
}));

export default useAlertStore;
