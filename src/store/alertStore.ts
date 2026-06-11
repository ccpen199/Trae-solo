import { create } from 'zustand';
import { alertApi } from '@/api/endpoints';
import type {
  AlertRecord,
  AlertQueryParams,
  AlertProcessRequest,
  AlertStatus,
} from '@shared/types';

interface AlertState {
  alerts: AlertRecord[];
  unreadCount: number;
  fetchAlerts: (params?: AlertQueryParams) => Promise<AlertRecord[]>;
  processAlert: (id: number, data: AlertProcessRequest) => Promise<AlertRecord>;
  markAsRead: (id: number) => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  unreadCount: 0,

  fetchAlerts: async (params?: AlertQueryParams) => {
    const response = await alertApi.getList(params || {});
    const unreadCount = response.list.filter(
      (alert) => alert.status === 'pending'
    ).length;
    set({
      alerts: response.list,
      unreadCount,
    });
    return response.list;
  },

  processAlert: async (id: number, data: AlertProcessRequest) => {
    const updatedAlert = await alertApi.processAlert(id, data);
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === id ? updatedAlert : alert
      ),
      unreadCount:
        data.status !== 'pending'
          ? state.unreadCount - 1
          : state.unreadCount,
    }));
    return updatedAlert;
  },

  markAsRead: (id: number) => {
    const { alerts } = get();
    const alert = alerts.find((a) => a.id === id);
    if (alert && alert.status === 'pending') {
      set((state) => ({
        alerts: state.alerts.map((a) =>
          a.id === id ? { ...a, status: 'processing' as AlertStatus } : a
        ),
        unreadCount: state.unreadCount - 1,
      }));
    }
  },
}));
