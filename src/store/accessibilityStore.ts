import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AccessibilityConfig } from '../../shared/types';

interface AccessibilityStore extends AccessibilityConfig {
  setFontSize: (size: AccessibilityConfig['fontSize']) => void;
  setContrast: (contrast: AccessibilityConfig['contrast']) => void;
  toggleVoiceEnabled: () => void;
  setVoiceSpeed: (speed: number) => void;
  reset: () => void;
}

const defaultConfig: AccessibilityConfig = {
  fontSize: 'normal',
  contrast: 'normal',
  voiceEnabled: false,
  voiceSpeed: 1,
};

export const useAccessibilityStore = create<AccessibilityStore>()(
  persist(
    (set) => ({
      ...defaultConfig,
      setFontSize: (size) => set({ fontSize: size }),
      setContrast: (contrast) => set({ contrast }),
      toggleVoiceEnabled: () => set((state) => ({ voiceEnabled: !state.voiceEnabled })),
      setVoiceSpeed: (speed) => set({ voiceSpeed: speed }),
      reset: () => set(defaultConfig),
    }),
    {
      name: 'accessibility-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
