import { create } from 'zustand'

export type FontSize = 'normal' | 'large' | 'xlarge'

interface AccessibilityState {
  voiceNavigation: boolean
  highContrast: boolean
  fontSize: FontSize
  screenReader: boolean
  toggleVoiceNavigation: () => void
  toggleHighContrast: () => void
  setFontSize: (size: FontSize) => void
  toggleScreenReader: () => void
  resetSettings: () => void
  speak: (text: string) => void
}

const STORAGE_KEY = 'gov_accessibility'

const DEFAULT_STATE = {
  voiceNavigation: false,
  highContrast: false,
  fontSize: 'normal' as FontSize,
  screenReader: false,
}

const saveToStorage = (
  state: Pick<AccessibilityState, 'voiceNavigation' | 'highContrast' | 'fontSize' | 'screenReader'>
) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

const loadFromStorage = (): Partial<typeof DEFAULT_STATE> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // ignore
  }
  return {}
}

const applyHighContrastClass = (enabled: boolean) => {
  if (typeof document === 'undefined') return
  if (enabled) {
    document.body.classList.add('high-contrast')
  } else {
    document.body.classList.remove('high-contrast')
  }
}

const applyFontSizeClass = (size: FontSize) => {
  if (typeof document === 'undefined') return
  document.body.classList.remove('font-large', 'font-xlarge')
  if (size === 'large') {
    document.body.classList.add('font-large')
  } else if (size === 'xlarge') {
    document.body.classList.add('font-xlarge')
  }
}

const saved = loadFromStorage()
const initialState = { ...DEFAULT_STATE, ...saved }

if (typeof document !== 'undefined') {
  applyHighContrastClass(initialState.highContrast)
  applyFontSizeClass(initialState.fontSize)
}

export const useAccessibilityStore = create<AccessibilityState>((set, get) => ({
  ...initialState,

  toggleVoiceNavigation: () => {
    const next = !get().voiceNavigation
    set({ voiceNavigation: next })
    saveToStorage({
      voiceNavigation: next,
      highContrast: get().highContrast,
      fontSize: get().fontSize,
      screenReader: get().screenReader,
    })
  },

  toggleHighContrast: () => {
    const next = !get().highContrast
    applyHighContrastClass(next)
    set({ highContrast: next })
    saveToStorage({
      voiceNavigation: get().voiceNavigation,
      highContrast: next,
      fontSize: get().fontSize,
      screenReader: get().screenReader,
    })
  },

  setFontSize: (size) => {
    applyFontSizeClass(size)
    set({ fontSize: size })
    saveToStorage({
      voiceNavigation: get().voiceNavigation,
      highContrast: get().highContrast,
      fontSize: size,
      screenReader: get().screenReader,
    })
  },

  toggleScreenReader: () => {
    const next = !get().screenReader
    set({ screenReader: next })
    saveToStorage({
      voiceNavigation: get().voiceNavigation,
      highContrast: get().highContrast,
      fontSize: get().fontSize,
      screenReader: next,
    })
  },

  resetSettings: () => {
    applyHighContrastClass(DEFAULT_STATE.highContrast)
    applyFontSizeClass(DEFAULT_STATE.fontSize)
    set(DEFAULT_STATE)
    saveToStorage(DEFAULT_STATE)
  },

  speak: (text) => {
    if (!get().voiceNavigation) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'zh-CN'
      utterance.rate = 1
      utterance.pitch = 1
      window.speechSynthesis.speak(utterance)
    } catch {
      // ignore
    }
  },
}))
