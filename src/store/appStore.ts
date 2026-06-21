import { create } from 'zustand';
import type {
  ServiceDemand,
  Dispute,
  Evidence,
  ServiceProvider,
  GeoPoint,
} from '@/types';
import {
  CURRENT_CITY,
  CURRENT_LOCATION,
  CURRENT_GRID_CODE,
  mockDisputes,
} from '@/data/mockData';

interface AppState {
  city: string;
  setCity: (city: string) => void;

  location: GeoPoint;
  setLocation: (loc: GeoPoint) => void;

  currentGridCode: string;
  setCurrentGridCode: (code: string) => void;

  demands: ServiceDemand[];
  addDemand: (demand: Omit<ServiceDemand, 'id' | 'createdAt' | 'status' | 'matchedProviders'>) => void;
  updateDemand: (id: string, data: Partial<ServiceDemand>) => void;

  matchedProviders: ServiceProvider[];
  setMatchedProviders: (providers: ServiceProvider[]) => void;

  disputes: Dispute[];
  addDispute: (dispute: Omit<Dispute, 'id' | 'createdAt' | 'status' | 'statusLabel' | 'compensationStandard' | 'compensationAmount' | 'result'>) => void;
  addEvidence: (disputeId: string, evidence: Evidence) => void;

  selectedProviderId: string | null;
  setSelectedProviderId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  city: CURRENT_CITY,
  setCity: (city) => set({ city }),

  location: CURRENT_LOCATION,
  setLocation: (location) => set({ location }),

  currentGridCode: CURRENT_GRID_CODE,
  setCurrentGridCode: (currentGridCode) => set({ currentGridCode }),

  demands: [],
  addDemand: (demand) =>
    set((state) => ({
      demands: [
        {
          ...demand,
          id: `demand-${Date.now()}`,
          createdAt: new Date().toISOString(),
          status: 'pending',
          matchedProviders: [],
        },
        ...state.demands,
      ],
    })),
  updateDemand: (id, data) =>
    set((state) => ({
      demands: state.demands.map((d) => (d.id === id ? { ...d, ...data } : d)),
    })),

  matchedProviders: [],
  setMatchedProviders: (matchedProviders) => set({ matchedProviders }),

  disputes: mockDisputes,
  addDispute: (dispute) =>
    set((state) => ({
      disputes: [
        {
          ...dispute,
          id: `d-${Date.now()}`,
          createdAt: new Date().toLocaleString('zh-CN'),
          status: 'submitted',
          statusLabel: '已提交待审核',
          compensationStandard: '等待平台匹配',
          compensationAmount: 0,
          result: '平台客服将在24小时内联系您',
        },
        ...state.disputes,
      ],
    })),
  addEvidence: (disputeId, evidence) =>
    set((state) => ({
      disputes: state.disputes.map((d) =>
        d.id === disputeId ? { ...d, evidences: [...d.evidences, evidence] } : d
      ),
    })),

  selectedProviderId: null,
  setSelectedProviderId: (selectedProviderId) => set({ selectedProviderId }),
}));
