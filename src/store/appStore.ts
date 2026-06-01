import { create } from 'zustand';
import { accountApi, transactionApi, dashboardApi } from '../services/api';

interface AppState {
  accounts: any[];
  transactions: any[];
  categories: any[];
  tags: any[];
  dashboardSummary: any;
  trendData: any[];
  structureData: any[];
  isLoading: boolean;
  error: string | null;
  
  loadAccounts: () => Promise<void>;
  loadTransactions: (params?: any) => Promise<void>;
  loadCategories: () => Promise<void>;
  loadTags: () => Promise<void>;
  loadDashboard: () => Promise<void>;
  addAccount: (data: any) => Promise<void>;
  updateAccount: (id: number, data: any) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
  addTransaction: (data: any) => Promise<void>;
  addTransfer: (data: any) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  accounts: [],
  transactions: [],
  categories: [],
  tags: [],
  dashboardSummary: null,
  trendData: [],
  structureData: [],
  isLoading: false,
  error: null,

  loadAccounts: async () => {
    set({ isLoading: true });
    try {
      const response = await accountApi.getAccounts();
      set({ accounts: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  loadTransactions: async (params?: any) => {
    set({ isLoading: true });
    try {
      const response = await transactionApi.getTransactions(params);
      set({ transactions: response.data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  loadCategories: async () => {
    try {
      const response = await transactionApi.getCategories();
      set({ categories: response.data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  loadTags: async () => {
    try {
      const response = await transactionApi.getTags();
      set({ tags: response.data });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  loadDashboard: async () => {
    set({ isLoading: true });
    try {
      const [summaryRes, trendRes, structureRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getTrend(12),
        dashboardApi.getStructure(),
      ]);
      set({
        dashboardSummary: summaryRes.data,
        trendData: trendRes.data,
        structureData: structureRes.data,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  addAccount: async (data: any) => {
    set({ isLoading: true });
    try {
      await accountApi.createAccount(data);
      await get().loadAccounts();
      await get().loadDashboard();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  updateAccount: async (id: number, data: any) => {
    set({ isLoading: true });
    try {
      await accountApi.updateAccount(id, data);
      await get().loadAccounts();
      await get().loadDashboard();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  deleteAccount: async (id: number) => {
    set({ isLoading: true });
    try {
      await accountApi.deleteAccount(id);
      await get().loadAccounts();
      await get().loadDashboard();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  addTransaction: async (data: any) => {
    set({ isLoading: true });
    try {
      await transactionApi.createTransaction(data);
      await get().loadTransactions();
      await get().loadDashboard();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  addTransfer: async (data: any) => {
    set({ isLoading: true });
    try {
      await transactionApi.createTransfer(data);
      await get().loadTransactions();
      await get().loadAccounts();
      set({ isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },
}));
