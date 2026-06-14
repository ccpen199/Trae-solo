import { create } from 'zustand';
import { api } from '@/utils/api';

export interface Vehicle {
  id: number;
  plate_number: string;
  vin: string;
  org_id: number;
  org_name: string;
  org_path: string;
  device_id: number;
  device_sn: string;
  device_protocol: string;
  driver_id: number;
  driver_name: string;
  status: 'online' | 'offline' | 'alarm';
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  last_location_time: string;
}

interface VehicleFilters {
  orgId?: number;
  status?: string;
  page?: number;
  pageSize?: number;
}

interface VehicleState {
  vehicles: Vehicle[];
  total: number;
  selectedVehicle: Vehicle | null;
  filters: VehicleFilters;
  loading: boolean;
  fetchVehicles: (filters?: Partial<VehicleFilters>) => Promise<void>;
  selectVehicle: (vehicle: Vehicle | null) => void;
  setFilters: (filters: Partial<VehicleFilters>) => void;
  updateVehiclePosition: (id: number, data: Partial<Vehicle>) => void;
}

export const useVehicleStore = create<VehicleState>((set, get) => ({
  vehicles: [],
  total: 0,
  selectedVehicle: null,
  filters: {},
  loading: false,

  fetchVehicles: async (overrideFilters?: Partial<VehicleFilters>) => {
    set({ loading: true });
    try {
      const merged = { ...get().filters, ...overrideFilters };
      const params = new URLSearchParams();
      if (merged.orgId) params.set('orgId', String(merged.orgId));
      if (merged.status && merged.status !== 'all') params.set('status', merged.status);
      params.set('page', String(merged.page || 1));
      params.set('pageSize', String(merged.pageSize || 20));
      const res = await api.get<{ list: Vehicle[]; total: number }>(`/api/vehicles?${params.toString()}`);
      set({ vehicles: res.list, total: res.total, loading: false, filters: merged });
    } catch {
      set({ loading: false });
    }
  },

  selectVehicle: (vehicle) => set({ selectedVehicle: vehicle }),

  setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),

  updateVehiclePosition: (id, data) => {
    set((state) => ({
      vehicles: state.vehicles.map((v) =>
        v.id === id ? { ...v, ...data } : v
      ),
      selectedVehicle:
        state.selectedVehicle?.id === id
          ? { ...state.selectedVehicle, ...data }
          : state.selectedVehicle,
    }));
  },
}));
