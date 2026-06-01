import { create } from 'zustand'
import type { Cluster, User } from '../types'
import { TOKEN_KEY } from '../api/client'

interface AppState {
  token: string | null
  user: User | null
  currentCluster: Cluster | null
  clusters: Cluster[]

  setToken: (token: string | null) => void
  setUser: (user: User | null) => void
  setCurrentCluster: (cluster: Cluster | null) => void
  setClusters: (clusters: Cluster[]) => void
  logout: () => void
}

const initialToken = localStorage.getItem(TOKEN_KEY)
const initialUser = (() => {
  try {
    const raw = localStorage.getItem('k8s_gov_user')
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
})()

export const useAppStore = create<AppState>((set) => ({
  token: initialToken,
  user: initialUser,
  currentCluster: null,
  clusters: [],

  setToken: (token) => {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
    set({ token })
  },
  setUser: (user) => {
    if (user) localStorage.setItem('k8s_gov_user', JSON.stringify(user))
    else localStorage.removeItem('k8s_gov_user')
    set({ user })
  },
  setCurrentCluster: (currentCluster) => set({ currentCluster }),
  setClusters: (clusters) => set({ clusters }),
  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('k8s_gov_user')
    set({ token: null, user: null, currentCluster: null })
  },
}))
