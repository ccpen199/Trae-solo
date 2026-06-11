import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, VentRecord, EmotionClustering, RiskLevel } from '@/types';

interface ProfileState {
  profile: UserProfile | null;
  ventRecord: VentRecord | null;
  riskLevel: RiskLevel;
  emotionClustering: EmotionClustering | null;
  setProfile: (profile: UserProfile | null) => void;
  setVentRecord: (ventRecord: VentRecord | null) => void;
  setRiskLevel: (riskLevel: RiskLevel) => void;
  setEmotionClustering: (clustering: EmotionClustering | null) => void;
  clearAll: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      profile: null,
      ventRecord: null,
      riskLevel: 'low',
      emotionClustering: null,
      setProfile: (profile) => set({ profile }),
      setVentRecord: (ventRecord) => set({ ventRecord }),
      setRiskLevel: (riskLevel) => set({ riskLevel }),
      setEmotionClustering: (emotionClustering) => set({ emotionClustering }),
      clearAll: () => set({ profile: null, ventRecord: null, riskLevel: 'low', emotionClustering: null }),
    }),
    {
      name: 'mindisland-profile',
    }
  )
);
