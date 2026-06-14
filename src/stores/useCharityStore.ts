import { create } from 'zustand';
import { charityApi } from '@/utils/api';

interface CharityState {
  donations: unknown[];
  projects: unknown[];
  total: number;
  loading: boolean;
  fetchDonations: (userId?: string) => Promise<void>;
  fetchProjects: () => Promise<void>;
  donate: (data: Record<string, unknown>) => Promise<unknown>;
}

export const useCharityStore = create<CharityState>((set) => ({
  donations: [],
  projects: [],
  total: 0,
  loading: false,

  fetchDonations: async (userId) => {
    set({ loading: true });
    try {
      const res = await charityApi.getDonations(userId ? { user_id: userId } : undefined);
      set({ donations: res.data?.list || [], total: res.data?.total || 0 });
    } catch {
      set({ donations: [], total: 0 });
    } finally {
      set({ loading: false });
    }
  },

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const res = await charityApi.getProjects();
      set({ projects: res.data || [] });
    } catch {
      set({ projects: [] });
    } finally {
      set({ loading: false });
    }
  },

  donate: async (data) => {
    set({ loading: true });
    try {
      const res = await charityApi.donate(data);
      return res.data;
    } finally {
      set({ loading: false });
    }
  },
}));
