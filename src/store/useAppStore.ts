import { create } from 'zustand'
import type { User, UserRole, Notification, AuditLogEntry } from '@/types'
import { mockUsers, mockNotifications } from '@/mock/data'

const SESSION_KEY = 'may-89120-demo-session'

function isUserRole(value: string | null): value is UserRole {
  return value === 'insured' || value === 'employed' || value === 'retired' || value === 'agent'
}

function readInitialRole(): UserRole | null {
  if (typeof window === 'undefined') return null
  const savedRole = window.localStorage.getItem(SESSION_KEY)
  if (isUserRole(savedRole)) return savedRole
  return null
}

function persistRole(role: UserRole) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(SESSION_KEY, role)
  }
}

function clearPersistedRole() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(SESSION_KEY)
  }
}

interface AppStore {
  user: User | null
  isAuthenticated: boolean
  currentRole: UserRole
  sidebarCollapsed: boolean
  notifications: Notification[]
  auditLogs: AuditLogEntry[]
  login: (role: UserRole) => void
  logout: () => void
  switchRole: (role: UserRole) => void
  toggleSidebar: () => void
  markNotificationRead: (id: string) => void
  addAuditLog: (entry: AuditLogEntry) => void
}

const autoDemoRole: UserRole | null = import.meta.env.VITE_AUTO_DEMO_LOGIN === 'true' ? 'insured' : null
const initialRole = readInitialRole() || autoDemoRole

export const useAppStore = create<AppStore>((set) => ({
  user: initialRole ? mockUsers[initialRole] : null,
  isAuthenticated: Boolean(initialRole),
  currentRole: initialRole || 'insured',
  sidebarCollapsed: false,
  notifications: mockNotifications,
  auditLogs: [],

  login: (role: UserRole) => {
    const user = mockUsers[role]
    persistRole(role)
    set({ user, isAuthenticated: true, currentRole: role })
  },

  logout: () => {
    clearPersistedRole()
    set({ user: null, isAuthenticated: false, currentRole: 'insured' })
  },

  switchRole: (role: UserRole) => {
    const user = mockUsers[role]
    persistRole(role)
    set({ user, currentRole: role })
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
  },

  markNotificationRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }))
  },

  addAuditLog: (entry: AuditLogEntry) => {
    set((state) => ({ auditLogs: [entry, ...state.auditLogs] }))
  },
}))
