import { create } from 'zustand';
import { db, generateId } from '@/db';
import type { TimerMode, ReadingSession } from '@/types';
import dayjs from 'dayjs';

interface TimerStore {
  isRunning: boolean;
  isPaused: boolean;
  mode: TimerMode;
  bookId: string | null;
  startTime: string | null;
  elapsedSeconds: number;
  sessionLog: ReadingSession[];
  timerInterval: ReturnType<typeof setInterval> | null;
  dwellTimeout: ReturnType<typeof setTimeout> | null;
  voiceRecognition: any | null;

  startTimer: (bookId?: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => Promise<ReadingSession | null>;
  switchMode: (mode: TimerMode) => void;
  setBookId: (bookId: string | null) => void;
  loadRecentSessions: () => Promise<void>;
  tick: () => void;
  getSessionsByBook: (bookId: string) => ReadingSession[];
  getTodayTotalSeconds: () => number;
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  isRunning: false,
  isPaused: false,
  mode: 'manual',
  bookId: null,
  startTime: null,
  elapsedSeconds: 0,
  sessionLog: [],
  timerInterval: null,
  dwellTimeout: null,
  voiceRecognition: null,

  startTimer: (bookId) => {
    const state = get();
    if (state.isRunning) return;

    const now = dayjs().toISOString();
    const interval = setInterval(() => get().tick(), 1000);

    set({
      isRunning: true,
      isPaused: false,
      startTime: now,
      elapsedSeconds: 0,
      bookId: bookId ?? state.bookId,
      timerInterval: interval,
    });

    if (state.mode === 'dwell') {
      const handler = () => {
        const s = get();
        if (s.dwellTimeout) clearTimeout(s.dwellTimeout);
        if (!s.isRunning || s.isPaused) return;
        const timeout = setTimeout(() => {
          get().pauseTimer();
        }, 300000);
        set({ dwellTimeout: timeout });
      };
      window.addEventListener('mousemove', handler);
      window.addEventListener('keydown', handler);
      window.addEventListener('scroll', handler);
    }

    if (state.mode === 'voice') {
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.lang = 'zh-CN';
          recognition.onresult = () => {
            const s = get();
            if (s.isRunning && !s.isPaused) {
              set({ elapsedSeconds: s.elapsedSeconds + 1 });
            }
          };
          recognition.start();
          set({ voiceRecognition: recognition });
        }
      } catch {
        // Speech recognition not available
      }
    }
  },

  pauseTimer: () => {
    const state = get();
    if (!state.isRunning || state.isPaused) return;
    if (state.timerInterval) clearInterval(state.timerInterval);
    if (state.voiceRecognition) {
      try { state.voiceRecognition.stop(); } catch {}
    }
    set({ isPaused: true, timerInterval: null });
  },

  resumeTimer: () => {
    const state = get();
    if (!state.isRunning || !state.isPaused) return;
    const interval = setInterval(() => get().tick(), 1000);
    set({ isPaused: false, timerInterval: interval });
  },

  stopTimer: async () => {
    const state = get();
    if (!state.isRunning) return null;

    if (state.timerInterval) clearInterval(state.timerInterval);
    if (state.voiceRecognition) {
      try { state.voiceRecognition.stop(); } catch {}
    }
    if (state.dwellTimeout) clearTimeout(state.dwellTimeout);

    const session: ReadingSession = {
      id: generateId(),
      bookId: state.bookId,
      mode: state.mode,
      durationSeconds: state.elapsedSeconds,
      startTime: state.startTime!,
      endTime: dayjs().toISOString(),
    };

    await db.readingSessions.add(session);

    set({
      isRunning: false,
      isPaused: false,
      startTime: null,
      elapsedSeconds: 0,
      timerInterval: null,
      voiceRecognition: null,
      dwellTimeout: null,
    });

    return session;
  },

  switchMode: (mode) => {
    const state = get();
    if (state.isRunning) return;
    set({ mode });
  },

  setBookId: (bookId) => set({ bookId }),

  loadRecentSessions: async () => {
    const sessions = await db.readingSessions
      .orderBy('startTime')
      .reverse()
      .limit(50)
      .toArray();
    set({ sessionLog: sessions });
  },

  tick: () => {
    set(state => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
  },

  getSessionsByBook: (bookId) => {
    return get().sessionLog.filter(s => s.bookId === bookId);
  },

  getTodayTotalSeconds: () => {
    const today = dayjs().format('YYYY-MM-DD');
    return get().sessionLog
      .filter(s => dayjs(s.startTime).format('YYYY-MM-DD') === today)
      .reduce((sum, s) => sum + s.durationSeconds, 0);
  },
}));
