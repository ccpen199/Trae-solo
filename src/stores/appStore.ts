import { create } from 'zustand'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

interface AppState {
  sidebarCollapsed: boolean
  currentUser: { name: string; role: string }
  globalLoading: boolean
  toasts: Toast[]
  toggleSidebar: () => void
  setGlobalLoading: (loading: boolean) => void
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void
  removeToast: (id: number) => void
}

let toastId = 0

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  currentUser: { name: '管理员', role: '超级管理员' },
  globalLoading: false,
  toasts: [],
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setGlobalLoading: (loading) => set({ globalLoading: loading }),
  addToast: (message, type = 'info') => {
    const id = ++toastId
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
