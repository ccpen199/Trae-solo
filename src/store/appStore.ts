import { create } from 'zustand';
import type {
  ServiceDemand,
  Dispute,
  Evidence,
  ServiceProvider,
  GeoPoint,
  ChatMessage,
  OrderInfo,
} from '@/types';
import {
  CURRENT_CITY,
  CURRENT_LOCATION,
  CURRENT_GRID_CODE,
  mockDisputes,
  mockHistoryOrders,
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
  historyOrders: OrderInfo[];
  addDispute: (dispute: Omit<Dispute, 'id' | 'createdAt' | 'status' | 'statusLabel' | 'compensationStandard' | 'compensationAmount' | 'result' | 'timeline' | 'messages' | 'progress' | 'orderInfo'> & { orderInfo: OrderInfo }) => void;
  addEvidence: (disputeId: string, evidence: Evidence) => void;
  addMessage: (disputeId: string, message: Omit<ChatMessage, 'id' | 'time'>) => void;

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
  historyOrders: mockHistoryOrders,
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
          progress: 10,
          timeline: [
            { label: '提交纠纷', time: new Date().toLocaleString('zh-CN'), done: true, description: '用户提交纠纷申请' },
            { label: '客服介入', time: '待处理', done: false },
            { label: '核实证据', time: '待处理', done: false },
            { label: '仲裁结果', time: '待处理', done: false },
            { label: '赔付完成', time: '待处理', done: false },
          ],
          messages: [
            { id: `m-${Date.now()}`, sender: 'user', senderName: '我', content: dispute.description, time: new Date().toLocaleString('zh-CN'), avatar: '' },
          ],
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
  addMessage: (disputeId, message) =>
    set((state) => ({
      disputes: state.disputes.map((d) =>
        d.id === disputeId
          ? { ...d, messages: [...d.messages, { ...message, id: `m-${Date.now()}`, time: new Date().toLocaleString('zh-CN') }] }
          : d
      ),
    })),

  selectedProviderId: null,
  setSelectedProviderId: (selectedProviderId) => set({ selectedProviderId }),
}));
