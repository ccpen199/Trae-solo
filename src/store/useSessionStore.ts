import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session, SessionSummary, MatchResult, EmotionTrend } from '@/types';

interface SessionState {
  sessions: Session[];
  currentSession: Session | null;
  currentSummary: SessionSummary | null;
  matchedCounselors: MatchResult[];
  emotionTrends: EmotionTrend[];
  setSessions: (sessions: Session[]) => void;
  setCurrentSession: (session: Session | null) => void;
  setCurrentSummary: (summary: SessionSummary | null) => void;
  setMatchedCounselors: (results: MatchResult[]) => void;
  setEmotionTrends: (trends: EmotionTrend[]) => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      sessions: [],
      currentSession: null,
      currentSummary: null,
      matchedCounselors: [],
      emotionTrends: [],
      setSessions: (sessions) => set({ sessions }),
      setCurrentSession: (currentSession) => set({ currentSession }),
      setCurrentSummary: (currentSummary) => set({ currentSummary }),
      setMatchedCounselors: (matchedCounselors) => set({ matchedCounselors }),
      setEmotionTrends: (emotionTrends) => set({ emotionTrends }),
    }),
    {
      name: 'mindisland-session',
    }
  )
);
