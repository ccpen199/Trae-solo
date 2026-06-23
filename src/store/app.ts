import { create } from 'zustand'
import type { UserRole, User } from '../types'
import { mockUsers } from '../data/mock'

interface AppState {
  currentRole: UserRole
  currentUser: User
  sidebarCollapsed: boolean
  setCurrentRole: (role: UserRole) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentRole: 'operator',
  currentUser: mockUsers[2],
  sidebarCollapsed: false,
  setCurrentRole: (role: UserRole) => {
    const userMap: Record<UserRole, User> = {
      shipper: mockUsers[0],
      carrier: mockUsers[1],
      operator: mockUsers[2],
    }
    set({ currentRole: role, currentUser: userMap[role] })
  },
  toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
}))
