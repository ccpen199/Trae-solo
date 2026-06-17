import { create } from 'zustand';
import type { Device, DeviceGroup } from '@/types';
import { devicesApi } from '@/services/api';

interface DeviceState {
  devices: Device[];
  deviceGroups: DeviceGroup[];
  selectedDevice: Device | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageSize: number;
}

interface DeviceActions {
  fetchDevices: (params?: { page?: number; pageSize?: number; groupId?: string; status?: string }) => Promise<void>;
  fetchDeviceGroups: () => Promise<void>;
  fetchDeviceDetail: (id: string) => Promise<Device | undefined>;
  setSelectedDevice: (device: Device | null) => void;
  addDevice: (device: Device) => void;
  updateDevice: (id: string, data: Partial<Device>) => void;
  removeDevice: (id: string) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState: DeviceState = {
  devices: [],
  deviceGroups: [],
  selectedDevice: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  pageSize: 20,
};

export const useDeviceStore = create<DeviceState & DeviceActions>((set, get) => ({
  ...initialState,

  fetchDevices: async (params) => {
    set({ loading: true, error: null });
    try {
      const result = await devicesApi.getDeviceList({
        page: params?.page || get().page,
        pageSize: params?.pageSize || get().pageSize,
        groupId: params?.groupId,
        status: params?.status,
      });
      const deviceList = Array.isArray(result) ? result : (result as any).list || [];
      const total = Array.isArray(result) ? result.length : (result as any).total || deviceList.length;
      set({
        devices: deviceList,
        total,
        page: params?.page || get().page,
        pageSize: params?.pageSize || get().pageSize,
      });
    } catch (error: any) {
      set({ error: error.message || '获取设备列表失败' });
    } finally {
      set({ loading: false });
    }
  },

  fetchDeviceGroups: async () => {
    try {
      const groups = await devicesApi.getDeviceGroups();
      set({ deviceGroups: groups });
    } catch (error: any) {
      console.error('获取设备分组失败:', error.message);
    }
  },

  fetchDeviceDetail: async (id) => {
    const existing = get().devices.find((d) => d.id === id);
    if (existing) {
      set({ selectedDevice: existing });
      return existing;
    }
    try {
      const device = await devicesApi.getDevice(id);
      set({ selectedDevice: device });
      return device;
    } catch (error: any) {
      set({ error: error.message || '获取设备详情失败' });
    }
  },

  setSelectedDevice: (device) => {
    set({ selectedDevice: device });
  },

  addDevice: (device) => {
    set((state) => ({
      devices: [device, ...state.devices],
      total: state.total + 1,
    }));
  },

  updateDevice: (id, data) => {
    set((state) => ({
      devices: state.devices.map((d) => (d.id === id ? { ...d, ...data } : d)),
      selectedDevice:
        state.selectedDevice?.id === id
          ? { ...state.selectedDevice, ...data }
          : state.selectedDevice,
    }));
  },

  removeDevice: (id) => {
    set((state) => ({
      devices: state.devices.filter((d) => d.id !== id),
      total: state.total - 1,
      selectedDevice: state.selectedDevice?.id === id ? null : state.selectedDevice,
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

export default useDeviceStore;
