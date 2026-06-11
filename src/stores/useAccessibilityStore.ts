import { create } from "zustand"

interface AccessibilityState {
  highContrast: boolean
  fontSize: number
  voiceNavigation: boolean
  toggleHighContrast: () => void
  setFontSize: (size: number) => void
  toggleVoiceNavigation: () => void
}

export const useAccessibilityStore = create<AccessibilityState>((set) => ({
  highContrast: false,
  fontSize: 16,
  voiceNavigation: false,
  toggleHighContrast: () =>
    set((state) => ({ highContrast: !state.highContrast })),
  setFontSize: (size) => set({ fontSize: size }),
  toggleVoiceNavigation: () =>
    set((state) => ({ voiceNavigation: !state.voiceNavigation })),
}))
