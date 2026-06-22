import { create } from 'zustand';
import type { HeatmapData, DailyStats } from '../types';
import { mockBaoliaos } from '../data/mockBaoliaos';
import { mockUsers } from '../data/mockUsers';
import { huizhouDistricts } from '../utils/location';

interface AdminStoreState {
  heatmapData: HeatmapData[];
  dailyStats: DailyStats[];
}

interface AdminStoreActions {
  fetchHeatmapData: (dateRange?: string[], district?: string) => Promise<void>;
  fetchDailyStats: (days?: number) => Promise<void>;
  getBaoliaoStats: () => Promise<{ total: number; pending: number; approved: number; rejected: number }>;
  getUserStats: () => Promise<{ total: number; activeToday: number; newToday: number }>;
}

type AdminStore = AdminStoreState & AdminStoreActions;

export const useAdminStore = create<AdminStore>((set, get) => ({
  heatmapData: [],
  dailyStats: [],

  fetchHeatmapData: async (dateRange?: string[], district?: string): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    let districts = huizhouDistricts;
    if (district) {
      districts = huizhouDistricts.filter(d => d.name === district);
    }

    const heatmapData: HeatmapData[] = districts.map(d => {
      const count = Math.floor(Math.random() * 100) + 10;
      const positive = Math.floor(count * 0.3);
      const neutral = Math.floor(count * 0.4);
      const negative = count - positive - neutral;

      return {
        district: d.name,
        count,
        positive,
        neutral,
        negative,
        center: d.center,
      };
    });

    set({ heatmapData });
  },

  fetchDailyStats: async (days: number = 7): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 500));

    const dailyStats: DailyStats[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      const baoliaoCount = Math.floor(Math.random() * 50) + 20;
      const userCount = Math.floor(Math.random() * 100) + 50;
      const activityCount = Math.floor(Math.random() * 20) + 5;
      const positiveRate = 0.3 + Math.random() * 0.4;

      dailyStats.push({
        date: dateStr,
        baoliaoCount,
        userCount,
        activityCount,
        positiveRate,
      });
    }

    set({ dailyStats });
  },

  getBaoliaoStats: async (): Promise<{ total: number; pending: number; approved: number; rejected: number }> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const total = mockBaoliaos.length;
    const pending = mockBaoliaos.filter(b => b.status === 'pending').length;
    const approved = mockBaoliaos.filter(b => b.status === 'approved').length;
    const rejected = mockBaoliaos.filter(b => b.status === 'rejected').length;

    return { total, pending, approved, rejected };
  },

  getUserStats: async (): Promise<{ total: number; activeToday: number; newToday: number }> => {
    await new Promise(resolve => setTimeout(resolve, 300));

    const total = mockUsers.length;
    const activeToday = mockUsers.filter(u => u.lastLoginAt && new Date(u.lastLoginAt).toDateString() === new Date().toDateString()).length;
    const newToday = mockUsers.filter(u => u.createdAt && new Date(u.createdAt).toDateString() === new Date().toDateString()).length;

    return { total, activeToday, newToday: newToday || 2 };
  },
}));
