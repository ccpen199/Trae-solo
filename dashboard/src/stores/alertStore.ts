import { create } from 'zustand';
import type { Alert, PaginationRequest, PaginationResponse } from '@shared/types';
import { mockAlertService } from '../services/mockService';

interface AlertState {
  alerts: Alert[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };
  fetchAlerts: (params?: PaginationRequest & { type?: string; level?: string; read?: boolean }) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissAlert: (id: string) => Promise<void>;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  pagination: { page: 1, pageSize: 10, total: 0 },
  fetchAlerts: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockAlertService.getAlerts(params);
      set({ alerts: response.items, pagination: { page: response.page, pageSize: response.pageSize, total: response.total }, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取告警列表失败', isLoading: false });
    }
  },
  fetchUnreadCount: async () => {
    try {
      const count = await mockAlertService.getUnreadCount();
      set({ unreadCount: count });
    } catch (err) {
      console.error('获取未读告警数量失败', err);
    }
  },
  markAsRead: async (id) => {
    try {
      await mockAlertService.markAsRead(id);
      set((state) => ({
        alerts: state.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '标记已读失败' });
      throw err;
    }
  },
  markAllAsRead: async () => {
    try {
      await mockAlertService.markAllAsRead();
      set((state) => ({
        alerts: state.alerts.map((a) => ({ ...a, read: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '全部标记已读失败' });
      throw err;
    }
  },
  dismissAlert: async (id) => {
    try {
      await mockAlertService.dismiss(id);
      set((state) => ({
        alerts: state.alerts.filter((a) => a.id !== id),
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '忽略告警失败' });
      throw err;
    }
  },
}));
