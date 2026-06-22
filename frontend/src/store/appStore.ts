import { create } from 'zustand';
import type { User, RiskStatus } from '../types';
import { userApi, riskApi } from '../services';
import { getDefaultUserId, setDefaultUserId } from '../services/api';

interface AppState {
  currentUser: User | null;
  currentUserId: string;
  riskStatus: RiskStatus | null;
  loading: boolean;
  error: string | null;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  setCurrentUserId: (id: string) => void;
  fetchCurrentUser: () => Promise<void>;
  fetchRiskStatus: () => Promise<void>;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  currentUserId: getDefaultUserId(),
  riskStatus: null,
  loading: false,
  error: null,
  toast: null,
  setCurrentUserId: (id: string) => {
    setDefaultUserId(id);
    set({ currentUserId: id });
    void get().fetchCurrentUser();
  },
  fetchCurrentUser: async () => {
    set({ loading: true });
    try {
      const user = await userApi.getMe();
      set({ currentUser: user, loading: false, error: null });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },
  fetchRiskStatus: async () => {
    try {
      const status = await riskApi.getStatus();
      set({ riskStatus: status });
    } catch (e) {
      console.error(e);
    }
  },
  showToast: (message, type = 'info') => {
    set({ toast: { message, type } });
    setTimeout(() => set({ toast: null }), 3000);
  },
  clearToast: () => set({ toast: null }),
}));
