import { create } from 'zustand';
import { db, generateId } from '@/db';
import type { TimerMode, ReadingSession } from '@/types';
import dayjs from 'dayjs';

type PauseReason = 'user' | 'dwell_timeout' | 'voice_pause' | 'app_background' | null;

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
  pauseReason: PauseReason;
  voiceProgress: number | null;
  targetProgress: number | null;
  sessionStartProgress: number | null;
  lastSaveStatus: 'idle' | 'saving' | 'saved' | 'failed';
  lastSavedAt: string | null;

  startTimer: (bookId?: string) => void;
  pauseTimer: (reason?: PauseReason) => void;
  resumeTimer: () => void;
  stopTimer: () => Promise<ReadingSession | null>;
  switchMode: (mode: TimerMode) => void;
  setBookId: (bookId: string | null) => void;
  loadRecentSessions: () => Promise<void>;
  tick: () => void;
  getSessionsByBook: (bookId: string) => ReadingSession[];
  getTodayTotalSeconds: () => number;
  setTargetProgress: (target: number) => void;
  updateVoiceProgress: (progress: number) => void;
  discardSession: () => void;
  saveSessionSnapshot: () => Promise<void>;
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
  pauseReason: null,
  voiceProgress: null,
  targetProgress: null,
  sessionStartProgress: null,
  lastSaveStatus: 'idle',
  lastSavedAt: null,

  startTimer: (bookId) => {
    const state = get();
    if (state.isRunning) return;

    const now = dayjs().toISOString();
    const interval = setInterval(() => get().tick(), 1000);

    const selectedBookId = bookId ?? state.bookId;
    let startProgress: number | null = null;
    if (selectedBookId) {
      db.books.get(selectedBookId).then(book => {
        if (book) set({ sessionStartProgress: book.progress });
      });
    }

    set({
      isRunning: true,
      isPaused: false,
      startTime: now,
      elapsedSeconds: 0,
      bookId: selectedBookId,
      timerInterval: interval,
      pauseReason: null,
      voiceProgress: null,
      targetProgress: state.targetProgress,
      sessionStartProgress: startProgress,
      lastSaveStatus: 'idle',
      lastSavedAt: null,
    });

    if (state.mode === 'dwell') {
      const handler = () => {
        const s = get();
        if (s.dwellTimeout) clearTimeout(s.dwellTimeout);
        if (!s.isRunning || s.isPaused) return;
        const timeout = setTimeout(() => {
          get().pauseTimer('dwell_timeout');
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
          let wordCount = 0;
          recognition.onresult = (event: any) => {
            const s = get();
            if (s.isRunning && !s.isPaused) {
              for (let i = event.resultIndex; i < event.results.length; i++) {
                wordCount += event.results[i][0].transcript.trim().split(/\s+/).length;
              }
              const prog = Math.min(100, Math.max(0, wordCount * 0.15));
              set({ elapsedSeconds: s.elapsedSeconds + 1, voiceProgress: prog });
            }
          };
          recognition.start();
          set({ voiceRecognition: recognition });
        } else {
          const simInterval = setInterval(() => {
            const s = get();
            if (s.isRunning && !s.isPaused && s.mode === 'voice') {
              const current = s.voiceProgress ?? 0;
              const next = Math.min(100, current + Math.random() * 2.5);
              set({ voiceProgress: next });
            } else {
              clearInterval(simInterval);
            }
          }, 1500);
        }
      } catch {
        // Speech recognition not available, simulate
      }
    }
  },

  pauseTimer: (reason = 'user') => {
    const state = get();
    if (!state.isRunning || state.isPaused) return;
    if (state.timerInterval) clearInterval(state.timerInterval);
    if (state.voiceRecognition) {
      try { state.voiceRecognition.stop(); } catch {}
    }
    set({ isPaused: true, timerInterval: null, pauseReason: reason });
  },

  resumeTimer: () => {
    const state = get();
    if (!state.isRunning || !state.isPaused) return;
    const interval = setInterval(() => get().tick(), 1000);
    set({ isPaused: false, timerInterval: interval, pauseReason: null });
  },

  stopTimer: async () => {
    const state = get();
    if (!state.isRunning) return null;

    if (state.timerInterval) clearInterval(state.timerInterval);
    if (state.voiceRecognition) {
      try { state.voiceRecognition.stop(); } catch {}
    }
    if (state.dwellTimeout) clearTimeout(state.dwellTimeout);

    const now = dayjs().toISOString();
    let progressDelta: number | null = null;
    if (state.bookId && state.sessionStartProgress !== null) {
      const book = await db.books.get(state.bookId);
      if (book) {
        progressDelta = book.progress - state.sessionStartProgress;
      }
    }

    const session: ReadingSession = {
      id: generateId(),
      bookId: state.bookId,
      mode: state.mode,
      durationSeconds: state.elapsedSeconds,
      startTime: state.startTime!,
      endTime: now,
      pauseReason: state.pauseReason,
      voiceProgress: state.voiceProgress,
      targetProgress: state.targetProgress,
      progressDelta: progressDelta,
      savedAt: now,
      status: 'completed',
    };

    set({ lastSaveStatus: 'saving' });
    try {
      await db.readingSessions.add(session);
      set({ lastSaveStatus: 'saved', lastSavedAt: now });
    } catch {
      set({ lastSaveStatus: 'failed' });
    }

    set({
      isRunning: false,
      isPaused: false,
      startTime: null,
      elapsedSeconds: 0,
      timerInterval: null,
      voiceRecognition: null,
      dwellTimeout: null,
      pauseReason: null,
      voiceProgress: null,
      sessionStartProgress: null,
    });

    const sessions = await db.readingSessions
      .orderBy('startTime')
      .reverse()
      .limit(50)
      .toArray();
    set({ sessionLog: sessions });

    return session;
  },

  discardSession: () => {
    const state = get();
    if (!state.isRunning) return;

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
      pauseReason: state.pauseReason,
      status: 'discarded',
    };

    db.readingSessions.add(session);

    set({
      isRunning: false,
      isPaused: false,
      startTime: null,
      elapsedSeconds: 0,
      timerInterval: null,
      voiceRecognition: null,
      dwellTimeout: null,
      pauseReason: null,
      voiceProgress: null,
      sessionStartProgress: null,
      lastSaveStatus: 'idle',
    });
  },

  saveSessionSnapshot: async () => {
    const state = get();
    if (!state.isRunning) return;

    set({ lastSaveStatus: 'saving' });
    const now = dayjs().toISOString();

    try {
      const existing = await db.readingSessions
        .where('startTime')
        .equals(state.startTime!)
        .first();

      if (existing) {
        await db.readingSessions.update(existing.id, {
          durationSeconds: state.elapsedSeconds,
          endTime: now,
          pauseReason: state.pauseReason,
          voiceProgress: state.voiceProgress,
          savedAt: now,
          status: 'active',
        } as any);
      } else {
        const snapshot: ReadingSession = {
          id: generateId(),
          bookId: state.bookId,
          mode: state.mode,
          durationSeconds: state.elapsedSeconds,
          startTime: state.startTime!,
          endTime: now,
          pauseReason: state.pauseReason,
          voiceProgress: state.voiceProgress,
          targetProgress: state.targetProgress,
          savedAt: now,
          status: 'active',
        };
        await db.readingSessions.add(snapshot);
      }
      set({ lastSaveStatus: 'saved', lastSavedAt: now });
    } catch {
      set({ lastSaveStatus: 'failed' });
    }
  },

  switchMode: (mode) => {
    const state = get();
    if (state.isRunning) return;
    set({ mode, voiceProgress: null });
  },

  setBookId: (bookId) => set({ bookId }),

  setTargetProgress: (target) => set({ targetProgress: target }),

  updateVoiceProgress: (progress) => set({ voiceProgress: progress }),

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
