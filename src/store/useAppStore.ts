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
    set((state) => {
      const elapsed = state.monitorData.elapsedSeconds;
      if (elapsed < 60) {
        return {
          monitorData: {
            ...state.monitorData,
            isMonitoring: false,
            micStatus: 'idle',
            motionStatus: 'idle',
          },
        };
      }
      const now = new Date();
      const startTime = new Date(now.getTime() - elapsed * 1000);
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const fingerprint = btoa(`${sessionId}-${state.user.id}-${elapsed}`).slice(0, 16);

      const totalDuration = Math.floor(elapsed / 60);
      const deep = Math.floor(totalDuration * 0.18);
      const light = Math.floor(totalDuration * 0.45);
      const rem = Math.floor(totalDuration * 0.22);
      const awake = totalDuration - deep - light - rem;
      const sleepEfficiency = Math.round((1 - awake / totalDuration) * 100);

      const newSession: SleepSession = {
        id: sessionId,
        userId: state.user.id,
        startTime: startTime.toISOString(),
        endTime: now.toISOString(),
        totalDuration,
        sleepEfficiency,
        sleepLatency: 12 + Math.floor(Math.random() * 20),
        sleepStages: [
          { stage: 'deep', startTime: 0, duration: deep, confidence: 0.92 },
          { stage: 'light', startTime: deep, duration: light, confidence: 0.88 },
          { stage: 'rem', startTime: deep + light, duration: rem, confidence: 0.85 },
          { stage: 'awake', startTime: deep + light + rem, duration: awake, confidence: 0.95 },
        ],
        breathingMetrics: {
          avgRate: 14 + Math.floor(Math.random() * 4),
          minRate: 10 + Math.floor(Math.random() * 3),
          maxRate: 18 + Math.floor(Math.random() * 4),
          rateSeries: [],
          regularity: 70 + Math.floor(Math.random() * 20),
        },
        movementMetrics: {
          totalTurns: 8 + Math.floor(Math.random() * 15),
          movementIntensity: [],
          restlessPeriods: [],
        },
        snoringMetrics: {
          totalEpisodes: 2 + Math.floor(Math.random() * 8),
          totalDuration: 60 + Math.floor(Math.random() * 180),
          avgLoudness: 40 + Math.floor(Math.random() * 20),
          spectrumHeatmap: [],
          frequencyBands: Array.from({ length: 8 }, (_, i) => ({
            band: `${i * 125}-${(i + 1) * 125}Hz`,
            energy: 20 + Math.floor(Math.random() * 60),
          })),
        },
        apneaEvents: [],
        ahiIndex: Math.random() > 0.7 ? 5 + Math.random() * 10 : Math.random() * 3,
        environmentNoise: state.monitorData.environmentNoise,
        qualityScore: 60 + Math.floor(Math.random() * 35),
        auditInfo: {
          sessionId,
          startTime: startTime.toISOString(),
          endTime: now.toISOString(),
          duration: totalDuration,
          storageVersion: '2.1.0',
          dataFingerprint: `SHA256:${fingerprint}`,
          createdAt: now.toISOString(),
          lastModifiedAt: now.toISOString(),
          deviceModel: 'Web Browser',
          appVersion: '1.0.0',
          checksum: `CRC32:${fingerprint.slice(0, 8)}`,
        },
      };

      return {
        monitorData: {
          ...state.monitorData,
          isMonitoring: false,
          micStatus: 'idle',
          motionStatus: 'idle',
        },
        sleepSessions: [newSession, ...state.sleepSessions],
      };
    }),

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
    const now = new Date().toISOString();
    const referral: ReferralRecord = {
      id: `referral-${Date.now()}`,
      userId: get().user.id,
      assessmentId,
      sessionId: latest.id,
      createdAt: now,
      status: 'pending_auth',
      consentGiven: false,
      matchedHospital: hospital,
      auditTrail: [
        {
          id: `audit-${Date.now()}-init`,
          status: 'pending_auth',
          timestamp: now,
          operator: 'system',
          note: '转诊流程启动，等待用户授权',
          signature: `SIG-${btoa(`referral-${Date.now()}`).slice(0, 12)}`,
        },
      ],
      packagingInfo: undefined,
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
