import { create } from 'zustand';
import type { Casting, CastingApplication, ApplicationStatus, CastingRequirement } from '@shared/types';
import { mockCastings, mockCastingApplications } from '../data/mockData';

interface CastingState {
  castings: Casting[];
  currentCasting: Casting | null;
  applications: CastingApplication[];
  loading: boolean;
  error: string | null;
}

interface CastingActions {
  fetchCastings: () => Promise<void>;
  fetchCastingById: (id: string) => Promise<Casting | null>;
  createCasting: (casting: Omit<Casting, 'id' | 'createdAt'>) => Promise<Casting | null>;
  applyToCasting: (castingId: string, artistProfileId: string, coverLetter?: string) => Promise<CastingApplication | null>;
  fetchApplications: (castingId?: string) => Promise<CastingApplication[]>;
  updateApplicationStatus: (applicationId: string, status: ApplicationStatus) => Promise<boolean>;
  clearCurrentCasting: () => void;
  clearError: () => void;
}

type CastingStore = CastingState & CastingActions;

const generateId = (prefix: string): string => {
  return prefix + '-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
};

export const useCastingStore = create<CastingStore>((set, get) => ({
  castings: mockCastings,
  currentCasting: null,
  applications: mockCastingApplications,
  loading: false,
  error: null,

  fetchCastings: async () => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ castings: mockCastings, loading: false });
    } catch (error) {
      set({ error: '获取选角列表失败', loading: false });
    }
  },

  fetchCastingById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      const casting = get().castings.find(c => c.id === id) || mockCastings.find(c => c.id === id);
      if (casting) {
        set({ currentCasting: casting, loading: false });
        return casting;
      }
      set({ error: '未找到该选角', loading: false });
      return null;
    } catch (error) {
      set({ error: '获取选角详情失败', loading: false });
      return null;
    }
  },

  createCasting: async (casting: Omit<Casting, 'id' | 'createdAt'>) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newCasting: Casting = {
        ...casting,
        id: generateId('casting'),
        createdAt: new Date(),
      };
      
      set((state) => ({
        castings: [...state.castings, newCasting],
        currentCasting: newCasting,
        loading: false,
      }));
      
      return newCasting;
    } catch (error) {
      set({ error: '创建选角失败', loading: false });
      return null;
    }
  },

  applyToCasting: async (castingId: string, artistProfileId: string, coverLetter?: string) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const existing = get().applications.find(
        a => a.castingId === castingId && a.artistProfileId === artistProfileId
      );
      
      if (existing) {
        set({ error: '您已经申请过该选角', loading: false });
        return null;
      }
      
      const newApplication: CastingApplication = {
        id: generateId('app'),
        castingId,
        artistProfileId,
        status: 'pending',
        coverLetter,
        appliedAt: new Date(),
      };
      
      set((state) => ({
        applications: [...state.applications, newApplication],
        loading: false,
      }));
      
      return newApplication;
    } catch (error) {
      set({ error: '申请选角失败', loading: false });
      return null;
    }
  },

  fetchApplications: async (castingId?: string) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 250));
      
      let applications = get().applications;
      
      if (castingId) {
        applications = applications.filter(a => a.castingId === castingId);
      }
      
      set({ loading: false });
      return applications;
    } catch (error) {
      set({ error: '获取申请列表失败', loading: false });
      return [];
    }
  },

  updateApplicationStatus: async (applicationId: string, status: ApplicationStatus) => {
    set({ loading: true, error: null });
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      set((state) => ({
        applications: state.applications.map(a =>
          a.id === applicationId ? { ...a, status } : a
        ),
        loading: false,
      }));
      
      return true;
    } catch (error) {
      set({ error: '更新申请状态失败', loading: false });
      return false;
    }
  },

  clearCurrentCasting: () => {
    set({ currentCasting: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));

export default useCastingStore;
