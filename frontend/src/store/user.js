import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      adminToken: null,
      admin: null,

      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      updateUser: (user) => set({ user }),

      adminLogin: (admin, token) => set({ admin, adminToken: token }),
      adminLogout: () => set({ admin: null, adminToken: null })
    }),
    {
      name: 'user-storage'
    }
  )
)

export default useUserStore
