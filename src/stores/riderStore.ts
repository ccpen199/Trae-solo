import { create } from 'zustand';
import type { Rider, RiderStatus, RiderLocation, QueryParams, StateStatus, PaginationParams, CreditRecord } from '@/types';
import { riderApi } from '@/services/api';
import { websocketService } from '@/services/websocket';

interface RiderState {
  riders: Rider[];
  selectedRider: Rider | null;
  riderLocations: Map<string, RiderLocation>;
  creditRecords: CreditRecord[];
  pagination: PaginationParams;
  status: StateStatus;
  fetchRiders: (params?: QueryParams) => Promise<void>;
  fetchRiderById: (id: string) => Promise<void>;
  createRider: (data: Partial<Rider>) => Promise<Rider>;
  updateRider: (id: string, data: Partial<Rider>) => Promise<void>;
  updateRiderStatus: (id: string, status: RiderStatus) => Promise<void>;
  fetchCreditRecords: (riderId: string) => Promise<void>;
  setSelectedRider: (rider: Rider | null) => void;
  setPagination: (pagination: Partial<PaginationParams>) => void;
  subscribeRealTime: () => () => void;
}

export const useRiderStore = create<RiderState>((set, get) => ({
  riders: [],
  selectedRider: null,
  riderLocations: new Map(),
  creditRecords: [],
  pagination: { page: 1, pageSize: 20, total: 0 },
  status: { loading: false, error: null },

  fetchRiders: async (params) => {
    set({ status: { loading: true, error: null } });
    try {
      const result = await riderApi.getList(params);
      set({
        riders: result.riders,
        pagination: {
          page: params?.page || 1,
          pageSize: params?.pageSize || 20,
          total: result.total,
        },
        status: { loading: false, error: null },
      });
    } catch (error) {
      set({
        status: {
          loading: false,
          error: { code: 500, message: error instanceof Error ? error.message : 'Failed to fetch riders' },
        },
      });
    }
  },

  fetchRiderById: async (id) => {
    set({ status: { loading: true, error: null } });
    try {
      const rider = await riderApi.getById(id);
      set({ selectedRider: rider, status: { loading: false, error: null } });
    } catch (error) {
      set({
        status: {
          loading: false,
          error: { code: 500, message: error instanceof Error ? error.message : 'Failed to fetch rider' },
        },
      });
    }
  },

  createRider: async (data) => {
    set({ status: { loading: true, error: null } });
    try {
      const rider = await riderApi.create(data);
      set({ status: { loading: false, error: null } });
      return rider;
    } catch (error) {
      set({
        status: {
          loading: false,
          error: { code: 500, message: error instanceof Error ? error.message : 'Failed to create rider' },
        },
      });
      throw error;
    }
  },

  updateRider: async (id, data) => {
    set({ status: { loading: true, error: null } });
    try {
      const updatedRider = await riderApi.update(id, data);
      set((state) => ({
        riders: state.riders.map((r) => (r.id === id ? updatedRider : r)),
        selectedRider: state.selectedRider?.id === id ? updatedRider : state.selectedRider,
        status: { loading: false, error: null },
      }));
    } catch (error) {
      set({
        status: {
          loading: false,
          error: { code: 500, message: error instanceof Error ? error.message : 'Failed to update rider' },
        },
      });
    }
  },

  updateRiderStatus: async (id, status) => {
    set({ status: { loading: true, error: null } });
    try {
      const updatedRider = await riderApi.updateStatus(id, status);
      set((state) => ({
        riders: state.riders.map((r) => (r.id === id ? updatedRider : r)),
        selectedRider: state.selectedRider?.id === id ? updatedRider : state.selectedRider,
        status: { loading: false, error: null },
      }));
    } catch (error) {
      set({
        status: {
          loading: false,
          error: { code: 500, message: error instanceof Error ? error.message : 'Failed to update rider status' },
        },
      });
    }
  },

  fetchCreditRecords: async (riderId) => {
    set({ status: { loading: true, error: null } });
    try {
      const records = await riderApi.getCreditRecords(riderId);
      set({ creditRecords: records, status: { loading: false, error: null } });
    } catch (error) {
      set({
        status: {
          loading: false,
          error: { code: 500, message: error instanceof Error ? error.message : 'Failed to fetch credit records' },
        },
      });
    }
  },

  setSelectedRider: (rider) => {
    set({ selectedRider: rider });
  },

  setPagination: (pagination) => {
    set((state) => ({
      pagination: { ...state.pagination, ...pagination },
    }));
  },

  subscribeRealTime: () => {
    const unsubLocation = websocketService.onRiderLocation((location) => {
      const riderId = location.riderId || location.rider_id!;
      set((state) => {
        const newLocations = new Map(state.riderLocations);
        newLocations.set(riderId, location);
        return {
          riderLocations: newLocations,
          riders: state.riders.map((r) =>
            r.id === riderId
              ? { ...r, current_lat: location.lat, current_lng: location.lng }
              : r
          ),
        };
      });
    });

    websocketService.subscribe(['riders']);

    return () => {
      unsubLocation();
      websocketService.unsubscribe(['riders']);
    };
  },
}));
