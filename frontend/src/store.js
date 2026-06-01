import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      login: (token, user) => set({ token, user, isLoggedIn: true }),
      logout: () => set({ token: null, user: null, isLoggedIn: false }),
      updateUser: (user) => set({ user })
    }),
    {
      name: 'auth-storage'
    }
  )
);

export const useFocusStore = create((set) => ({
  isRunning: false,
  isBreak: false,
  duration: 25 * 60,
  timeLeft: 25 * 60,
  mode: 'normal',
  recordId: null,
  settings: {
    focusDuration: 25,
    breakDuration: 5,
    longBreakDuration: 15,
    pomodorosBeforeLongBreak: 4
  },
  
  start: (duration, mode = 'normal') => set({ 
    isRunning: true, 
    duration: duration * 60, 
    timeLeft: duration * 60, 
    mode,
    isBreak: false
  }),
  
  startBreak: (isLong = false) => set((state) => ({
    isRunning: true,
    isBreak: true,
    duration: isLong ? state.settings.longBreakDuration * 60 : state.settings.breakDuration * 60,
    timeLeft: isLong ? state.settings.longBreakDuration * 60 : state.settings.breakDuration * 60
  })),
  
  pause: () => set({ isRunning: false }),
  resume: () => set({ isRunning: true }),
  stop: () => set({ isRunning: false, isBreak: false, recordId: null }),
  
  tick: () => set((state) => ({
    timeLeft: Math.max(0, state.timeLeft - 1)
  })),
  
  setRecordId: (id) => set({ recordId: id }),
  
  updateSettings: (settings) => set((state) => ({
    settings: { ...state.settings, ...settings }
  }))
}));

export const useSleepStore = create((set) => ({
  isRunning: false,
  type: 'sleep',
  duration: 45,
  timeLeft: 45 * 60,
  sound: 'rain',
  wakeTask: null,
  recordId: null,
  wakeTime: null,
  
  start: (type, duration, sound, wakeTask) => set({
    isRunning: true,
    type,
    duration,
    timeLeft: duration * 60,
    sound: sound || 'rain',
    wakeTask
  }),
  
  stop: () => set({ isRunning: false, recordId: null, wakeTime: null }),
  
  tick: () => set((state) => ({
    timeLeft: Math.max(0, state.timeLeft - 1)
  })),
  
  setRecordId: (id) => set({ recordId: id }),
  
  setWakeTime: (time) => set({ wakeTime: time })
}));

export const useBreathStore = create((set) => ({
  isRunning: false,
  duration: 5,
  breaths: 0,
  sound: 'ocean',
  recordId: null,
  phase: 'inhale',
  phaseTime: 4,
  
  start: (duration, sound) => set({
    isRunning: true,
    duration,
    sound: sound || 'ocean',
    breaths: 0,
    phase: 'inhale',
    phaseTime: 4
  }),
  
  stop: () => set({ isRunning: false, recordId: null }),
  
  tick: () => set((state) => {
    let newPhaseTime = state.phaseTime - 1;
    let newPhase = state.phase;
    let newBreaths = state.breaths;
    
    if (newPhaseTime <= 0) {
      if (state.phase === 'inhale') {
        newPhase = 'hold';
        newPhaseTime = 4;
      } else if (state.phase === 'hold') {
        newPhase = 'exhale';
        newPhaseTime = 4;
      } else {
        newPhase = 'inhale';
        newPhaseTime = 4;
        newBreaths += 1;
      }
    }
    
    return {
      phaseTime: newPhaseTime,
      phase: newPhase,
      breaths: newBreaths
    };
  }),
  
  setRecordId: (id) => set({ recordId: id })
}));

export const useDailyStore = create((set) => ({
  quote: null,
  loading: false,
  offline: false,
  
  setQuote: (quote) => set({ quote }),
  setLoading: (loading) => set({ loading }),
  setOffline: (offline) => set({ offline })
}));
