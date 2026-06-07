import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: number
  username: string
  role: string
  phone?: string
  email?: string
  avatar?: string
  certificationType?: string
  certificationStatus?: string
}

export interface DanmakuMessage {
  id: number
  userId: number
  username: string
  content: string
  color?: string
  createdAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  login: (user: User, token: string) => void
  logout: () => void
  register: (user: User, token: string) => void
  updateUser: (updates: Partial<User>) => void
}

interface LiveState {
  currentLive: {
    id: number | null
    title: string
    hostName: string
    hostAvatar: string
    viewerCount: number
  }
  danmakuList: DanmakuMessage[]
  addDanmaku: (danmaku: DanmakuMessage) => void
  setCurrentLive: (live: LiveState['currentLive']) => void
  setViewerCount: (count: number) => void
  clearLive: () => void
}

interface UIState {
  loginModalVisible: boolean
  showLoginModal: () => void
  hideLoginModal: () => void
  activeFilters: {
    propertyType?: string
    listingType?: string
    priceRange?: [number, number]
    layout?: string
    city?: string
    liveCategory?: string
    liveStatus?: string
    contentType?: string
  }
  setFilter: (key: keyof UIState['activeFilters'], value: unknown) => void
  clearFilters: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      register: (user, token) => set({ user, token }),
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

export const useLiveStore = create<LiveState>((set) => ({
  currentLive: {
    id: null,
    title: '',
    hostName: '',
    hostAvatar: '',
    viewerCount: 0,
  },
  danmakuList: [],
  addDanmaku: (danmaku) =>
    set((state) => ({
      danmakuList: [...state.danmakuList.slice(-50), danmaku],
    })),
  setCurrentLive: (live) => set({ currentLive: live, danmakuList: [] }),
  setViewerCount: (count) =>
    set((state) => ({
      currentLive: { ...state.currentLive, viewerCount: count },
    })),
  clearLive: () =>
    set({
      currentLive: { id: null, title: '', hostName: '', hostAvatar: '', viewerCount: 0 },
      danmakuList: [],
    }),
}))

export const useUIStore = create<UIState>((set) => ({
  loginModalVisible: false,
  showLoginModal: () => set({ loginModalVisible: true }),
  hideLoginModal: () => set({ loginModalVisible: false }),
  activeFilters: {},
  setFilter: (key, value) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, [key]: value },
    })),
  clearFilters: () => set({ activeFilters: {} }),
}))
