import { create } from 'zustand';
import type { Service, Alert, RealTimeMetrics } from '../types';

interface AppState {
  services: Service[];
  alerts: Alert[];
  metrics: RealTimeMetrics | null;
  selectedService: Service | null;
  isLoading: boolean;
  error: string | null;

  setServices: (services: Service[]) => void;
  setAlerts: (alerts: Alert[]) => void;
  setMetrics: (metrics: RealTimeMetrics) => void;
  setSelectedService: (service: Service | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addService: (service: Service) => void;
  updateService: (service: Service) => void;
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  services: [],
  alerts: [],
  metrics: null,
  selectedService: null,
  isLoading: false,
  error: null,

  setServices: (services) => set({ services }),
  setAlerts: (alerts) => set({ alerts }),
  setMetrics: (metrics) => set({ metrics }),
  setSelectedService: (service) => set({ selectedService: service }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  addService: (service) =>
    set((state) => ({
      services: [...state.services, service],
    })),

  updateService: (service) =>
    set((state) => ({
      services: state.services.map((s) =>
        s.id === service.id ? service : s
      ),
      selectedService:
        state.selectedService?.id === service.id
          ? service
          : state.selectedService,
    })),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100),
    })),

  acknowledgeAlert: (alertId) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, is_acknowledged: true } : a
      ),
    })),
}));
