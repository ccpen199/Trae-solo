import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  Citizen,
  TransportCard,
  Transaction,
  ScenicSpot,
  Reservation,
  Enterprise,
  Merchant,
  AuditLog,
  DashboardData,
  FusingRule,
  PaginatedResponse,
} from '@/types';
import {
  mockUser,
  mockCitizens,
  mockTransportCards,
  mockTransactions,
  mockScenics,
  mockReservations,
  mockEnterprises,
  mockMerchants,
  mockAuditLogs,
  mockDashboardData,
  mockFusingRules,
} from '@/data/mock';

interface AppState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  dashboardData: DashboardData | null;
  citizens: Citizen[];
  transportCards: TransportCard[];
  transactions: Transaction[];
  scenics: ScenicSpot[];
  reservations: Reservation[];
  enterprises: Enterprise[];
  merchants: Merchant[];
  auditLogs: AuditLog[];
  fusingRules: FusingRule[];
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loadDashboardData: () => Promise<void>;
  loadCitizens: (page?: number, pageSize?: number, filters?: Record<string, unknown>) => Promise<PaginatedResponse<Citizen>>;
  loadTransactions: (page?: number, pageSize?: number, filters?: Record<string, unknown>) => Promise<PaginatedResponse<Transaction>>;
  loadScenics: (page?: number, pageSize?: number) => Promise<PaginatedResponse<ScenicSpot>>;
  loadEnterprises: (page?: number, pageSize?: number) => Promise<PaginatedResponse<Enterprise>>;
  loadMerchants: (page?: number, pageSize?: number) => Promise<PaginatedResponse<Merchant>>;
  loadAuditLogs: (page?: number, pageSize?: number) => Promise<PaginatedResponse<AuditLog>>;
  loadFusingRules: () => Promise<FusingRule[]>;
  toggleFusingRule: (id: string) => Promise<void>;
  verifyEnterprise: (id: string, pass: boolean, reason?: string) => Promise<void>;
  verifyMerchant: (id: string, pass: boolean, reason?: string) => Promise<void>;
  updateScenicCapacity: (scenicId: string, capacity: number) => Promise<void>;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      loading: false,
      dashboardData: null,
      citizens: [],
      transportCards: [],
      transactions: [],
      scenics: [],
      reservations: [],
      enterprises: [],
      merchants: [],
      auditLogs: [],
      fusingRules: [],

      login: async (username: string, password: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 1000));
        if (username === 'admin' && password === 'admin123') {
          set({ isAuthenticated: true, user: mockUser, loading: false });
          return true;
        }
        set({ loading: false });
        return false;
      },

      logout: () => {
        set({ isAuthenticated: false, user: null });
      },

      loadDashboardData: async () => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));
        set({ dashboardData: mockDashboardData, loading: false });
      },

      loadCitizens: async (page = 1, pageSize = 10, filters = {}) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        let data = [...mockCitizens];
        if (filters.district) {
          data = data.filter((c) => c.district === filters.district);
        }
        if (filters.verified !== undefined) {
          data = data.filter((c) => c.realNameVerified === filters.verified);
        }
        const start = (page - 1) * pageSize;
        const list = data.slice(start, start + pageSize);
        set({ citizens: data, loading: false });
        return { list, total: data.length, page, pageSize };
      },

      loadTransactions: async (page = 1, pageSize = 10, filters = {}) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        let data = [...mockTransactions];
        if (filters.type) {
          data = data.filter((t) => t.type === filters.type);
        }
        if (filters.status) {
          data = data.filter((t) => t.status === filters.status);
        }
        const start = (page - 1) * pageSize;
        const list = data.slice(start, start + pageSize);
        set({ transactions: data, loading: false });
        return { list, total: data.length, page, pageSize };
      },

      loadScenics: async (page = 1, pageSize = 10) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        const start = (page - 1) * pageSize;
        const list = mockScenics.slice(start, start + pageSize);
        set({ scenics: mockScenics, loading: false });
        return { list, total: mockScenics.length, page, pageSize };
      },

      loadEnterprises: async (page = 1, pageSize = 10) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        const start = (page - 1) * pageSize;
        const list = mockEnterprises.slice(start, start + pageSize);
        set({ enterprises: mockEnterprises, loading: false });
        return { list, total: mockEnterprises.length, page, pageSize };
      },

      loadMerchants: async (page = 1, pageSize = 10) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        const start = (page - 1) * pageSize;
        const list = mockMerchants.slice(start, start + pageSize);
        set({ merchants: mockMerchants, loading: false });
        return { list, total: mockMerchants.length, page, pageSize };
      },

      loadAuditLogs: async (page = 1, pageSize = 10) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        const start = (page - 1) * pageSize;
        const list = mockAuditLogs.slice(start, start + pageSize);
        set({ auditLogs: mockAuditLogs, loading: false });
        return { list, total: mockAuditLogs.length, page, pageSize };
      },

      loadFusingRules: async () => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set({ fusingRules: mockFusingRules, loading: false });
        return mockFusingRules;
      },

      toggleFusingRule: async (id: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 300));
        set((state) => ({
          fusingRules: state.fusingRules.map((r) =>
            r.id === id ? { ...r, isActive: !r.isActive } : r
          ),
          loading: false,
        }));
      },

      verifyEnterprise: async (id: string, pass: boolean, reason?: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));
        set((state) => ({
          enterprises: state.enterprises.map((e) =>
            e.id === id
              ? {
                  ...e,
                  verifiedStatus: pass ? 'verified' : 'rejected',
                  verifiedAt: pass ? new Date() : undefined,
                  rejectReason: pass ? undefined : reason,
                }
              : e
          ),
          loading: false,
        }));
      },

      verifyMerchant: async (id: string, pass: boolean, reason?: string) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));
        set((state) => ({
          merchants: state.merchants.map((m) =>
            m.id === id
              ? {
                  ...m,
                  verifiedStatus: pass ? 'verified' : 'rejected',
                }
              : m
          ),
          loading: false,
        }));
      },

      updateScenicCapacity: async (scenicId: string, capacity: number) => {
        set({ loading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));
        set((state) => ({
          scenics: state.scenics.map((s) =>
            s.id === scenicId ? { ...s, maxDailyCapacity: capacity } : s
          ),
          loading: false,
        }));
      },
    }),
    {
      name: 'admin-store',
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, user: state.user }),
    }
  )
);
