import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  login: (token, user) => set({ token, user, isAuthenticated: true }),
  logout: () => set({ token: null, user: null, isAuthenticated: false }),
  updateUser: (user) => set({ user })
}))

export const useAppStore = create((set) => ({
  loading: false,
  toast: null,

  setLoading: (loading) => set({ loading }),
  showToast: (message, type = 'info') => set({ toast: { message, type } }),
  hideToast: () => set({ toast: null })
}))
