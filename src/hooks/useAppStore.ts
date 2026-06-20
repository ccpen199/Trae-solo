import { create } from 'zustand'

interface AppState {
  currentUserId: string
  favorites: string[]
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUserId: 'user-001',
  favorites: [],
  toggleFavorite: (id: string) => {
    set((state) => ({
      favorites: state.favorites.includes(id)
        ? state.favorites.filter((f) => f !== id)
        : [...state.favorites, id],
    }))
  },
  isFavorite: (id: string) => {
    return get().favorites.includes(id)
  },
}))
