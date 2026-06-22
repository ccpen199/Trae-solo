import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  role: 'resident' | 'admin' | 'worker';
  address?: string;
}

export interface AlertItem {
  id: string;
  level: 'blue' | 'yellow' | 'orange' | 'red';
  title: string;
  content: string;
  timestamp: string;
}

interface AppState {
  elderlyMode: boolean;
  highContrast: boolean;
  voiceEnabled: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  user: User | null;
  activeAlerts: AlertItem[];
  _forceRender: number;
  toggleElderlyMode: () => void;
  toggleHighContrast: () => void;
  toggleVoiceEnabled: () => void;
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  setUser: (user: User | null) => void;
  addAlert: (alert: AlertItem) => void;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
  setAlerts: (alerts: AlertItem[]) => void;
}

function applyAccessibilityClasses(state: Partial<Pick<AppState, 'elderlyMode' | 'highContrast' | 'fontSize'>>) {
  if (typeof document === 'undefined') return;
  const html = document.documentElement;
  html.classList.toggle('elderly-mode', state.elderlyMode === true);
  html.classList.toggle('high-contrast', state.highContrast === true);
  html.classList.remove('font-normal', 'font-large', 'font-xlarge');
  html.classList.add(`font-${state.fontSize || 'normal'}`);
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      elderlyMode: false,
      highContrast: false,
      voiceEnabled: true,
      fontSize: 'normal',
      user: null,
      activeAlerts: [],
      _forceRender: 0,

      toggleElderlyMode: () =>
        set(() => {
          const state = get();
          const next = !state.elderlyMode;
          applyAccessibilityClasses({ elderlyMode: next, highContrast: state.highContrast, fontSize: state.fontSize });
          return { elderlyMode: next, _forceRender: state._forceRender + 1 };
        }),

      toggleHighContrast: () =>
        set(() => {
          const state = get();
          const next = !state.highContrast;
          applyAccessibilityClasses({ elderlyMode: state.elderlyMode, highContrast: next, fontSize: state.fontSize });
          return { highContrast: next, _forceRender: state._forceRender + 1 };
        }),

      toggleVoiceEnabled: () =>
        set((s) => ({ voiceEnabled: !s.voiceEnabled, _forceRender: s._forceRender + 1 })),

      setFontSize: (size) =>
        set((s) => {
          applyAccessibilityClasses({ elderlyMode: s.elderlyMode, highContrast: s.highContrast, fontSize: size });
          return { fontSize: size, _forceRender: s._forceRender + 1 };
        }),

      setUser: (user) => set({ user }),
      addAlert: (alert) =>
        set((state) => ({
          activeAlerts: [alert, ...state.activeAlerts],
        })),
      removeAlert: (id) =>
        set((state) => ({
          activeAlerts: state.activeAlerts.filter((a) => a.id !== id),
        })),
      clearAlerts: () => set({ activeAlerts: [] }),
      setAlerts: (alerts) => set({ activeAlerts: alerts }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        elderlyMode: state.elderlyMode,
        highContrast: state.highContrast,
        voiceEnabled: state.voiceEnabled,
        fontSize: state.fontSize,
        user: state.user,
      }),
    },
  ),
);

export function initAccessibility() {
  const state = useAppStore.getState();
  applyAccessibilityClasses({
    elderlyMode: state.elderlyMode,
    highContrast: state.highContrast,
    fontSize: state.fontSize,
  });
}

export function speak(text: string) {
  const state = useAppStore.getState();
  if (!state.voiceEnabled) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    utter.rate = 0.9;
    utter.pitch = 1;
    window.speechSynthesis.speak(utter);
  } catch {
    /* noop */
  }
}
