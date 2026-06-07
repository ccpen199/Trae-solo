import { create } from 'zustand'

interface User {
  id: number
  username: string
  role: string
  real_name: string
  phone?: string
}

interface Taxpayer {
  id: number
  user_id: number
  name: string
  type: string
  unified_code?: string
  id_number?: string
  legal_person?: string
  address?: string
  industry?: string
  scale?: string
  region?: string
}

interface AppState {
  user: User | null
  token: string | null
  taxpayers: Taxpayer[]
  currentTaxpayer: Taxpayer | null
  sidebarCollapsed: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setTaxpayers: (taxpayers: Taxpayer[]) => void
  setCurrentTaxpayer: (taxpayer: Taxpayer | null) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  user: JSON.parse(localStorage.getItem('etax_user') || 'null'),
  token: localStorage.getItem('etax_token'),
  taxpayers: [],
  currentTaxpayer: JSON.parse(localStorage.getItem('etax_current_taxpayer') || 'null'),
  sidebarCollapsed: false,
  setUser: (user) => {
    if (user) localStorage.setItem('etax_user', JSON.stringify(user))
    else localStorage.removeItem('etax_user')
    set({ user })
  },
  setToken: (token) => {
    if (token) {
      localStorage.setItem('etax_token', token)
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('etax_token')
      localStorage.removeItem('token')
    }
    set({ token })
  },
  setTaxpayers: (taxpayers) => set({ taxpayers }),
  setCurrentTaxpayer: (taxpayer) => {
    if (taxpayer) localStorage.setItem('etax_current_taxpayer', JSON.stringify(taxpayer))
    else localStorage.removeItem('etax_current_taxpayer')
    set({ currentTaxpayer: taxpayer })
  },
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  logout: () => {
    localStorage.removeItem('etax_token')
    localStorage.removeItem('token')
    localStorage.removeItem('etax_user')
    localStorage.removeItem('etax_current_taxpayer')
    set({ user: null, token: null, taxpayers: [], currentTaxpayer: null })
  },
}))
