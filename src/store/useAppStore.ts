import { create } from 'zustand';
import type {
  User,
  SleepSession,
  MorningAssessment,
  AudioTrack,
  SleepImprovementPlan,
  RiskAssessment,
  ReferralRecord,
  HospitalInfo,
  RealtimeMonitorData,
  SensorStatus,
} from '@/types';
import {
  mockUser,
  mockSleepSessions,
  mockMorningAssessments,
  mockAudioTracks,
  mockImprovementPlan,
  mockRiskAssessments,
  mockReferralRecord,
  mockHospitals,
} from '@/data/mockData';

interface AppState {
  user: User;
  sleepSessions: SleepSession[];
  morningAssessments: MorningAssessment[];
  audioTracks: AudioTrack[];
  improvementPlan: SleepImprovementPlan;
  riskAssessments: RiskAssessment[];
  referralRecords: ReferralRecord[];
  hospitals: HospitalInfo[];

  currentAudio: AudioTrack | null;
  isPlaying: boolean;
  audioProgress: number;
  sleepTimer: number | null;
  favorites: string[];

  monitorData: RealtimeMonitorData;

  toggleFavorite: (id: string) => void;
  setCurrentAudio: (track: AudioTrack | null) => void;
  setPlaying: (playing: boolean) => void;
  setAudioProgress: (progress: number) => void;
  setSleepTimer: (minutes: number | null) => void;

  startMonitoring: () => void;
  stopMonitoring: () => void;
  updateMonitorData: (data: Partial<RealtimeMonitorData>) => void;

  completeTask: (taskId: string) => void;
  submitMorningAssessment: (data: Partial<MorningAssessment>) => void;
  toggleMedicalShare: (allowed: boolean) => void;

  createReferral: (assessmentId: string) => ReferralRecord | null;
  getLatestSession: () => SleepSession | undefined;
  getSessionById: (id: string) => SleepSession | undefined;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: mockUser,
  sleepSessions: mockSleepSessions,
  morningAssessments: mockMorningAssessments,
  audioTracks: mockAudioTracks,
  improvementPlan: mockImprovementPlan,
  riskAssessments: mockRiskAssessments,
  referralRecords: [mockReferralRecord],
  hospitals: mockHospitals,

  currentAudio: mockAudioTracks[0],
  isPlaying: false,
  audioProgress: 0,
  sleepTimer: null,
  favorites: mockAudioTracks.filter((t) => t.favorited).map((t) => t.id),

  monitorData: {
    micLevel: 0,
    micStatus: 'idle',
    motionLevel: 0,
    motionStatus: 'idle',
    breathingRate: 16,
    isMonitoring: false,
    elapsedSeconds: 0,
    environmentNoise: 30,
    waveBuffer: { breathing: [], motion: [] },
  },

  toggleFavorite: (id) =>
    set((state) => {
      const favs = state.favorites.includes(id)
        ? state.favorites.filter((f) => f !== id)
        : [...state.favorites, id];
      return {
        favorites: favs,
        audioTracks: state.audioTracks.map((t) =>
          t.id === id ? { ...t, favorited: !t.favorited } : t
        ),
      };
    }),

  setCurrentAudio: (track) => set({ currentAudio: track, audioProgress: 0 }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setAudioProgress: (progress) => set({ audioProgress: progress }),
  setSleepTimer: (minutes) => set({ sleepTimer: minutes }),

  startMonitoring: () =>
    set((state) => ({
      monitorData: {
        ...state.monitorData,
        isMonitoring: true,
        micStatus: 'active',
        motionStatus: 'active',
        elapsedSeconds: 0,
        waveBuffer: { breathing: [], motion: [] },
      },
    })),

  stopMonitoring: () =>
    set((state) => ({
      monitorData: {
        ...state.monitorData,
        isMonitoring: false,
        micStatus: 'idle',
        motionStatus: 'idle',
      },
    })),

  updateMonitorData: (data) =>
    set((state) => ({
      monitorData: { ...state.monitorData, ...data },
    })),

  completeTask: (taskId) =>
    set((state) => {
      const plan = state.improvementPlan;
      const updatedTasks = plan.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: !t.completed, completedAt: t.completed ? undefined : new Date().toISOString() } : t
      );
      const newPoints = updatedTasks.filter((t) => t.completed).length * 15;
      return {
        improvementPlan: { ...plan, tasks: updatedTasks, totalPoints: newPoints },
      };
    }),

  submitMorningAssessment: (data) => {
    const latest = get().getLatestSession();
    if (!latest) return;
    const assessment: MorningAssessment = {
      id: `ma-${Date.now()}`,
      sessionId: latest.id,
      userId: get().user.id,
      assessedAt: new Date().toISOString(),
      alertness: 3,
      sleepQuality: 7,
      mood: 60,
      thoughtInterference: 2,
      ...data,
    };
    set((state) => ({
      morningAssessments: [assessment, ...state.morningAssessments],
    }));
  },

  toggleMedicalShare: (allowed) =>
    set((state) => ({
      user: { ...state.user, settings: { ...state.user.settings, medicalShareAllowed: allowed } },
    })),

  createReferral: (assessmentId) => {
    const assessment = get().riskAssessments.find((a) => a.id === assessmentId);
    const latest = get().getLatestSession();
    if (!assessment || !latest) return null;
    const hospital = get().hospitals[0];
    const referral: ReferralRecord = {
      id: `referral-${Date.now()}`,
      userId: get().user.id,
      assessmentId,
      sessionId: latest.id,
      createdAt: new Date().toISOString(),
      status: 'pending_auth',
      consentGiven: false,
      matchedHospital: hospital,
    };
    set((state) => ({
      referralRecords: [...state.referralRecords, referral],
    }));
    return referral;
  },

  getLatestSession: () => {
    const sessions = get().sleepSessions;
    return sessions.length > 0 ? sessions[sessions.length - 1] : undefined;
  },

  getSessionById: (id) => get().sleepSessions.find((s) => s.id === id),
}));

export default useAppStore;
