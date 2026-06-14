import { create } from 'zustand';
import { api } from '@/utils/api';

export interface AuditLog {
  id: number;
  action: string;
  action_label: string;
  processed_by: number;
  processed_by_name: string;
  processed_at: string;
  note: string;
}

export interface Alert {
  id: number;
  type: string;
  level: 'critical' | 'warning' | 'info';
  vehicle_id: number;
  vehicle_plate: string;
  driver_id: number;
  driver_name: string;
  lat: number;
  lng: number;
  status: 'pending' | 'acknowledged' | 'resolved' | 'dismissed';
  processed_by: number;
  processed_by_name: string;
  processed_at: string;
  confirm_note: string;
  resolve_note: string;
  confirm_at: string;
  confirm_by: number;
  confirm_by_name: string;
  resolve_at: string;
  resolve_by: number;
  resolve_by_name: string;
  remark: string;
  timestamp: string;
  audit_logs: AuditLog[];
}

interface AlertFilters {
  type?: string;
  level?: string;
  status?: string;
  vehicleId?: number;
  startTime?: string;
  endTime?: string;
  page?: number;
  pageSize?: number;
}

interface AlertState {
  alerts: Alert[];
  filters: AlertFilters;
  loading: boolean;
  total: number;
  fetchAlerts: (overrideFilters?: Partial<AlertFilters>) => Promise<void>;
  processAlert: (id: number, action: 'acknowledge' | 'resolve' | 'dismiss', remark?: string) => Promise<void>;
  setFilters: (filters: Partial<AlertFilters>) => void;
  addAlert: (alert: Alert) => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
  alerts: [],
  filters: {},
  loading: false,
  total: 0,

  fetchAlerts: async (overrideFilters?: Partial<AlertFilters>) => {
    set({ loading: true });
    try {
      const merged = { ...get().filters, ...overrideFilters };
      const params = new URLSearchParams();
      params.set('page', String(merged.page || 1));
      params.set('pageSize', String(merged.pageSize || 20));
      if (merged.type) params.set('type', merged.type);
      if (merged.level) params.set('level', merged.level);
      if (merged.status) params.set('status', merged.status);
      if (merged.vehicleId) params.set('vehicleId', String(merged.vehicleId));
      if (merged.startTime) params.set('startTime', merged.startTime);
      if (merged.endTime) params.set('endTime', merged.endTime);
      const res = await api.get<{ list: Alert[]; total: number }>(`/api/alerts?${params.toString()}`);
      set({ alerts: res.list, total: res.total, loading: false, filters: merged });
    } catch {
      set({ loading: false });
    }
  },

  processAlert: async (id, action, remark) => {
    const updated = await api.put<Alert>(`/api/alerts/${id}/process`, { action, remark });
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, ...updated } : a
      ),
    }));
  },

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
}));
