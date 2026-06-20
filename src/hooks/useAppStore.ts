import { create } from 'zustand'
import { fetchApi } from '@/lib/api'

interface FavoriteItem {
  id: string
  type: 'case' | 'designer'
}

interface AppState {
  currentUserId: string
  favorites: FavoriteItem[]
  loading: boolean
  initFavorites: (userId: string) => Promise<void>
  toggleFavorite: (targetId: string, type: 'case' | 'designer') => Promise<void>
  isFavorite: (targetId: string) => boolean
  getFavoritesByType: (type: 'case' | 'designer') => string[]
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUserId: 'user-001',
  favorites: [],
  loading: false,

  initFavorites: async (userId: string) => {
    set({ loading: true })
    try {
      const [caseFavs, designerFavs] = await Promise.all([
        fetchApi<Array<{ id: string }>>(`/api/favorites?user_id=${userId}&type=case`),
        fetchApi<Array<{ id: string }>>(`/api/favorites?user_id=${userId}&type=designer`),
      ])
      const favs: FavoriteItem[] = [
        ...(Array.isArray(caseFavs) ? caseFavs.map(f => ({ id: f.id, type: 'case' as const })) : []),
        ...(Array.isArray(designerFavs) ? designerFavs.map(f => ({ id: f.id, type: 'designer' as const })) : []),
      ]
      set({ favorites: favs })
    } catch {
      set({ favorites: [] })
    } finally {
      set({ loading: false })
    }
  },

  toggleFavorite: async (targetId: string, type: 'case' | 'designer') => {
    const { currentUserId, favorites, initFavorites } = get()
    const existing = favorites.find(f => f.id === targetId && f.type === type)

    try {
      if (existing) {
        const resp = await fetchApi<{ success: boolean }>(`/api/favorites/${targetId}`, {
          method: 'DELETE',
        })
        if (resp.success) {
          set({
            favorites: favorites.filter(f => !(f.id === targetId && f.type === type)),
          })
        }
      } else {
        const body = type === 'case'
          ? { user_id: currentUserId, case_id: targetId, target_type: 'case' }
          : { user_id: currentUserId, designer_id: targetId, target_type: 'designer' }
        const resp = await fetchApi<{ success: boolean }>('/api/favorites', {
          method: 'POST',
          body: JSON.stringify(body),
        })
        if (resp.success) {
          set({
            favorites: [...favorites, { id: targetId, type }],
          })
        }
      }
    } catch (e) {
      await initFavorites(currentUserId)
    }
  },

  isFavorite: (targetId: string) => {
    return get().favorites.some(f => f.id === targetId)
  },

  getFavoritesByType: (type: 'case' | 'designer') => {
    return get().favorites.filter(f => f.type === type).map(f => f.id)
  },
}))
