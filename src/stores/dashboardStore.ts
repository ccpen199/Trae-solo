import { create } from 'zustand';
import type { DashboardMetrics, OrderAlert, StateStatus } from '@/types';
import { dashboardApi } from '@/services/api';
import { websocketService } from '@/services/websocket';

interface DashboardState {
  metrics: DashboardMetrics | null;
  alerts: OrderAlert[];
  status: StateStatus;
  fetchMetrics: () => Promise<void>;
  addAlert: (alert: OrderAlert) => void;
  markAlertRead: (alertId: string) => void;
  clearAlerts: () => void;
  subscribeRealTime: () => () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  metrics: null,
  alerts: [],
  status: { loading: false, error: null },

  fetchMetrics: async () => {
    set({ status: { loading: true, error: null } });
    try {
      const metrics = await dashboardApi.getMetrics();
      set({ metrics, status: { loading: false, error: null } });
    } catch (error) {
      set({
        status: {
          loading: false,
          error: { code: 500, message: error instanceof Error ? error.message : 'Failed to fetch metrics' },
        },
      });
    }
  },

  addAlert: (alert) => {
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100),
    }));
  },

  markAlertRead: (alertId) => {
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === alertId ? { ...a, read: true } : a)),
    }));
  },

  clearAlerts: () => {
    set({ alerts: [] });
  },

  subscribeRealTime: () => {
    const unsubMetrics = websocketService.onDashboardMetrics((metrics) => {
      set({ metrics });
    });

    const unsubAlerts = websocketService.onOrderAlert((alert) => {
      get().addAlert(alert);
    });

    websocketService.subscribe(['dashboard', 'alerts']);

    return () => {
      unsubMetrics();
      unsubAlerts();
      websocketService.unsubscribe(['dashboard', 'alerts']);
    };
  },
}));
