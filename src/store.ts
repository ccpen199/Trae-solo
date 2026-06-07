import { create } from 'zustand'

export interface User {
  id: number
  name: string
  phone: string
  role: string
  avatar?: string
}

interface AppState {
  currentUser: User | null
  sidebarCollapsed: boolean
  setUser: (user: User | null) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: { id: 1, name: '系统管理员', phone: '13800000001', role: 'admin' },
  sidebarCollapsed: false,
  setUser: (user) => set({ currentUser: user }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))

export const apiFetch = async <T = any>(url: string, options?: RequestInit): Promise<T> => {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    const data = await res.json()
    return data
  } catch (e: any) {
    console.error('[apiFetch] error:', url, e.message)
    return { success: false, error: e.message || '网络请求失败', data: null } as any
  }
}
