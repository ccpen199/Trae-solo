import { create } from 'zustand';
import type {
  DeviceHealth,
  AlertEvent,
  AlertStats,
  OtaStatus,
  VideoLinkStatus,
  SignalHistory,
  BatteryTrend,
} from '@/types';
import { deviceApi, alertApi, otaApi, videoApi } from '@/services/api';

interface AppState {
  devices: DeviceHealth[];
  currentDevice: DeviceHealth | null;
  signalHistory: SignalHistory[];
  batteryTrend: BatteryTrend[];
  alerts: AlertEvent[];
  alertStats: AlertStats | null;
  unreadCount: number;
  otaStatus: OtaStatus | null;
  videoLinkStatus: VideoLinkStatus | null;
  loading: Record<string, boolean>;

  fetchDevices: () => Promise<void>;
  fetchSignalHistory: (deviceId: string) => Promise<void>;
  fetchBatteryTrend: (deviceId: string) => Promise<void>;
  fetchAlerts: () => Promise<void>;
  fetchAlertStats: () => Promise<void>;
  markAlertRead: (id: string) => Promise<void>;
  markAllAlertsRead: () => Promise<void>;
  fetchOtaStatus: () => Promise<void>;
  fetchVideoLinkStatus: () => Promise<void>;
  setCurrentDevice: (device: DeviceHealth | null) => void;
}

const initialStats: AlertStats = {
  today: 0,
  week: 0,
  byType: { visitor: 0, family: 0, pet: 0, motion: 0 },
  byHour: Array(24).fill(0),
};

export const useAppStore = create<AppState>((set, get) => ({
  devices: [],
  currentDevice: null,
  signalHistory: [],
  batteryTrend: [],
  alerts: [],
  alertStats: null,
  unreadCount: 0,
  otaStatus: null,
  videoLinkStatus: null,
  loading: {},

  fetchDevices: async () => {
    set({ loading: { ...get().loading, devices: true } });
    try {
      const data = await deviceApi.getDevices();
      set({ devices: data, currentDevice: data[0] || null });
    } finally {
      set({ loading: { ...get().loading, devices: false } });
    }
  },

  fetchSignalHistory: async (deviceId: string) => {
    set({ loading: { ...get().loading, signal: true } });
    try {
      const data = await deviceApi.getSignalHistory(deviceId);
      set({ signalHistory: data });
    } finally {
      set({ loading: { ...get().loading, signal: false } });
    }
  },

  fetchBatteryTrend: async (deviceId: string) => {
    set({ loading: { ...get().loading, battery: true } });
    try {
      const data = await deviceApi.getBatteryTrend(deviceId);
      set({ batteryTrend: data });
    } finally {
      set({ loading: { ...get().loading, battery: false } });
    }
  },

  fetchAlerts: async () => {
    set({ loading: { ...get().loading, alerts: true } });
    try {
      const data = await alertApi.getAlerts({ limit: 50 });
      const unread = data.filter((a) => !a.read).length;
      set({ alerts: data, unreadCount: unread });
    } finally {
      set({ loading: { ...get().loading, alerts: false } });
    }
  },

  fetchAlertStats: async () => {
    set({ loading: { ...get().loading, alertStats: true } });
    try {
      const data = await alertApi.getStats();
      set({ alertStats: data });
    } catch {
      set({ alertStats: initialStats });
    } finally {
      set({ loading: { ...get().loading, alertStats: false } });
    }
  },

  markAlertRead: async (id: string) => {
    await alertApi.markRead(id);
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAlertsRead: async () => {
    await alertApi.markAllRead();
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    }));
  },

  fetchOtaStatus: async () => {
    try {
      const data = await otaApi.getStatus();
      set({ otaStatus: data });
    } catch {
      // ignore
    }
  },

  fetchVideoLinkStatus: async () => {
    try {
      const data = await videoApi.getLinkStatus();
      set({ videoLinkStatus: data });
    } catch {
      // ignore
    }
  },

  setCurrentDevice: (device) => set({ currentDevice: device }),
}));
