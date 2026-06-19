import { create } from 'zustand';
import type { RiskEvent, PaginationRequest, PaginationResponse } from '@shared/types';
import { mockRiskService } from '../services/mockService';

interface RiskState {
  events: RiskEvent[];
  selectedEvent: RiskEvent | null;
  riskDistribution: { level: string; count: number }[];
  deviceAccountGraph: { nodes: any[]; edges: any[] };
  isLoading: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };
  fetchEvents: (params?: PaginationRequest & { level?: string; status?: string; type?: string }) => Promise<void>;
  fetchEventById: (id: string) => Promise<RiskEvent | null>;
  fetchRiskDistribution: () => Promise<void>;
  fetchDeviceAccountGraph: (deviceId?: string) => Promise<void>;
  handleEvent: (id: string, status: 'reviewing' | 'resolved' | 'ignored', notes?: string) => Promise<void>;
  setSelectedEvent: (event: RiskEvent | null) => void;
}

export const useRiskStore = create<RiskState>((set) => ({
  events: [],
  selectedEvent: null,
  riskDistribution: [],
  deviceAccountGraph: { nodes: [], edges: [] },
  isLoading: false,
  error: null,
  pagination: { page: 1, pageSize: 10, total: 0 },
  fetchEvents: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await mockRiskService.getEvents(params);
      set({ events: response.items, pagination: { page: response.page, pageSize: response.pageSize, total: response.total }, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取风险事件失败', isLoading: false });
    }
  },
  fetchEventById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const event = await mockRiskService.getEventById(id);
      set({ selectedEvent: event, isLoading: false });
      return event;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取风险事件详情失败', isLoading: false });
      return null;
    }
  },
  fetchRiskDistribution: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await mockRiskService.getRiskDistribution();
      set({ riskDistribution: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取风险分布失败', isLoading: false });
    }
  },
  fetchDeviceAccountGraph: async (deviceId) => {
    set({ isLoading: true, error: null });
    try {
      const data = await mockRiskService.getDeviceAccountGraph(deviceId);
      set({ deviceAccountGraph: data, isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取设备关联图失败', isLoading: false });
    }
  },
  handleEvent: async (id, status, notes) => {
    set({ isLoading: true, error: null });
    try {
      await mockRiskService.handleEvent(id, status, notes);
      set({ isLoading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '处理风险事件失败', isLoading: false });
      throw err;
    }
  },
  setSelectedEvent: (event) => {
    set({ selectedEvent: event });
  },
}));
