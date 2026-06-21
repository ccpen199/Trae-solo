import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

type Lang = 'zh' | 'it'

interface AppState {
  lang: Lang
  toggleLang: () => void
  setLang: (lang: Lang) => void

  user: User | null
  setUser: (user: User | null) => void
  logout: () => void

  favorites: string[]
  toggleFavorite: (targetId: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      lang: 'zh',
      toggleLang: () => set({ lang: get().lang === 'zh' ? 'it' : 'zh' }),
      setLang: (lang) => set({ lang }),

      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),

      favorites: [],
      toggleFavorite: (targetId) => {
        const { favorites } = get()
        const exists = favorites.includes(targetId)
        set({
          favorites: exists
            ? favorites.filter((id) => id !== targetId)
            : [...favorites, targetId],
        })
      },
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        user: state.user,
        lang: state.lang,
        favorites: state.favorites,
      }),
    },
  ),
)
