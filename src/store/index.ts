import { create } from 'zustand'
import type { User, NamingInput, BaZiResult, NameProposal } from '@/types'

interface UserStore {
  user: User | null
  isLoggedIn: boolean
  favorites: string[]
  setUser: (user: User | null) => void
  login: (user: User) => void
  logout: () => void
  addFavorite: (nameId: string) => void
  removeFavorite: (nameId: string) => void
  toggleFavorite: (nameId: string) => void
  isFavorite: (nameId: string) => boolean
}

interface NamingStore {
  currentInput: Partial<NamingInput> | null
  baZiResult: BaZiResult | null
  nameProposals: NameProposal[]
  isGenerating: boolean
  setCurrentInput: (input: Partial<NamingInput>) => void
  resetCurrentInput: () => void
  setBaZiResult: (result: BaZiResult | null) => void
  setNameProposals: (proposals: NameProposal[]) => void
  appendNameProposals: (proposals: NameProposal[]) => void
  setIsGenerating: (generating: boolean) => void
  clearAll: () => void
}

type AppStore = UserStore & NamingStore

const defaultNamingInput: Partial<NamingInput> = {
  isLunarCalendar: false,
  gender: 'neutral',
  fiveElementsPreference: { metal: 50, wood: 50, water: 50, fire: 50, earth: 50 },
  forbiddenCharacters: [],
  style: [],
  nameLength: 'double',
}

export const useAppStore = create<AppStore>((set, get) => ({
  user: null,
  isLoggedIn: false,
  favorites: [],
  currentInput: { ...defaultNamingInput },
  baZiResult: null,
  nameProposals: [],
  isGenerating: false,

  setUser: (user) => set({ user, isLoggedIn: !!user }),
  login: (user) => set({ user, isLoggedIn: true }),
  logout: () => set({ user: null, isLoggedIn: false, favorites: [] }),

  addFavorite: (nameId) => {
    const { favorites } = get()
    if (!favorites.includes(nameId)) {
      set({ favorites: [...favorites, nameId] })
    }
  },
  removeFavorite: (nameId) => {
    set({ favorites: get().favorites.filter((id) => id !== nameId) })
  },
  toggleFavorite: (nameId) => {
    const { favorites } = get()
    if (favorites.includes(nameId)) {
      set({ favorites: favorites.filter((id) => id !== nameId) })
    } else {
      set({ favorites: [...favorites, nameId] })
    }
  },
  isFavorite: (nameId) => get().favorites.includes(nameId),

  setCurrentInput: (input) => {
    set({ currentInput: { ...get().currentInput, ...input } })
  },
  resetCurrentInput: () => set({ currentInput: { ...defaultNamingInput } }),

  setBaZiResult: (result) => set({ baZiResult: result }),
  setNameProposals: (proposals) => set({ nameProposals: proposals }),
  appendNameProposals: (proposals) => {
    set({ nameProposals: [...get().nameProposals, ...proposals] })
  },
  setIsGenerating: (generating) => set({ isGenerating: generating }),

  clearAll: () =>
    set({
      currentInput: { ...defaultNamingInput },
      baZiResult: null,
      nameProposals: [],
      isGenerating: false,
    }),
}))
