import { create } from 'zustand';
import type { CitizenProfile, CitizenTag, ReminderItem, GovernmentService } from '../types';
import { mockProfile, mockReminders, mockRecommendServices } from '../data/mockServices';

interface UserState {
  profile: CitizenProfile | null;
  reminders: ReminderItem[];
  recommendServices: GovernmentService[];
  recentServices: string[];
  isLoading: boolean;
  error: string | null;

  loadProfile: () => Promise<void>;
  updateProfileTags: (tags: CitizenTag[]) => void;
  addRecentService: (serviceId: string) => void;
  toggleServiceFavorite: (serviceId: string) => void;
  dismissReminder: (reminderId: string) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  reminders: [],
  recommendServices: [],
  recentServices: [],
  isLoading: false,
  error: null,

  loadProfile: async () => {
    console.log('[UserStore] loadProfile start');
    set({ isLoading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      set({
        profile: mockProfile,
        reminders: mockReminders,
        recommendServices: mockRecommendServices,
        recentServices: ['gjj-tq', 'yibao-bx', 'youer-yuan-baoming', 'sbbg-cz'],
        isLoading: false
      });
      console.log('[UserStore] loadProfile success, tags:', mockProfile.tags.length);
    } catch (err) {
      console.error('[UserStore] loadProfile error:', err);
      set({ error: err instanceof Error ? err.message : '加载失败', isLoading: false });
    }
  },

  updateProfileTags: (tags) => {
    const profile = get().profile;
    if (profile) {
      set({ profile: { ...profile, tags } });
    }
  },

  addRecentService: (serviceId) => {
    const recent = get().recentServices.filter(id => id !== serviceId);
    set({ recentServices: [serviceId, ...recent].slice(0, 10) });
  },

  toggleServiceFavorite: (serviceId) => {
    const services = get().recommendServices.map(s =>
      s.id === serviceId ? { ...s, isFavorite: !s.isFavorite } : s
    );
    set({ recommendServices: services });
  },

  dismissReminder: (reminderId) => {
    set({ reminders: get().reminders.filter(r => r.id !== reminderId) });
  }
}));
