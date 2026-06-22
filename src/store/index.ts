import { create } from 'zustand'
import type { User } from '@/types'

interface StoreState {
  currentTownship: string
  setCurrentTownship: (t: string) => void
  user: User | null
  setUser: (u: User | null) => void
  interestTags: string[]
  setInterestTags: (tags: string[]) => void
  searchHistory: string[]
  addSearchHistory: (term: string) => void
  clearSearchHistory: () => void
  favorites: string[]
  toggleFavorite: (id: string) => void
  notifications: number
}

export const useStore = create<StoreState>((set) => ({
  currentTownship: '乌峰街道',
  setCurrentTownship: (t) => set({ currentTownship: t }),
  user: {
    id: 'u1',
    phone: '13800000000',
    nickname: '镇雄小伙',
    avatar: '',
    interestTags: ['招聘', '美食', '房产'],
    location: { township: '乌峰街道' },
    role: 'user',
    publishedPosts: [],
    favorites: ['p1', 'p3'],
  },
  setUser: (u) => set({ user: u }),
  interestTags: ['招聘', '美食', '房产'],
  setInterestTags: (tags) => set({ interestTags: tags }),
  searchHistory: ['镇雄招聘', '乌峰租房', '泼机美食'],
  addSearchHistory: (term) =>
    set((state) => ({
      searchHistory: [term, ...state.searchHistory.filter((s) => s !== term)],
    })),
  clearSearchHistory: () => set({ searchHistory: [] }),
  favorites: ['p1', 'p3'],
  toggleFavorite: (id) =>
    set((state) => ({
      favorites: state.favorites.includes(id)
        ? state.favorites.filter((f) => f !== id)
        : [...state.favorites, id],
    })),
  notifications: 3,
}))
