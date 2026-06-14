import { create } from 'zustand'
import { mockUsers } from '../data/mockData'
import { api } from '../lib/api'
import type { User, AuthMethod, City } from '../types'

export interface LoginCredentials {
  idCard?: string
  phone?: string
  password: string
}

interface UserState {
  user: User | null
  isAuthenticated: boolean
  authMethod: AuthMethod | null
  loading: boolean
  login: (method: AuthMethod, credentials: LoginCredentials) => Promise<boolean>
  logout: () => void
  updateUserCity: (city: City) => void
}

const STORAGE_KEY = 'gov_user_session'

function loadFromStorage(): { user: User | null; isAuthenticated: boolean; authMethod: AuthMethod | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed?.isAuthenticated && parsed?.user) {
        return { user: parsed.user, isAuthenticated: true, authMethod: parsed.authMethod || null }
      }
    }
  } catch {
    // ignore
  }
  return { user: null, isAuthenticated: false, authMethod: null }
}

function saveToStorage(user: User, authMethod: AuthMethod) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, isAuthenticated: true, authMethod }))
  } catch {
    // ignore
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

function loginWithMock(method: AuthMethod, credentials: LoginCredentials): User | null {
  if (credentials.password !== '123456') return null

  let matchedUser: User | undefined

  if ((method === 'idcard' || method === 'socialcard' || method === 'medicalcard') && credentials.idCard) {
    matchedUser = mockUsers.find((u) => u.idCard === credentials.idCard)
    if (!matchedUser) {
      matchedUser = {
        id: 'U' + String(Date.now()).slice(-6),
        idCard: credentials.idCard,
        name: `用户${credentials.idCard.slice(-4)}`,
        phone: '138****8888',
        city: 'chengdu',
        district: '锦江区',
        address: '四川省成都市锦江区',
        authMethod: method,
        lastLoginTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        isRealNameVerified: true,
      }
    } else {
      matchedUser = { ...matchedUser, authMethod: method, lastLoginTime: new Date().toISOString().replace('T', ' ').slice(0, 19) }
    }
  } else if (method === 'phone' && credentials.phone) {
    matchedUser = mockUsers.find((u) => u.phone === credentials.phone)
    if (!matchedUser) {
      matchedUser = {
        id: 'U' + String(Date.now()).slice(-6),
        idCard: '510104********1234',
        name: `用户${credentials.phone.slice(-4)}`,
        phone: credentials.phone,
        city: 'chengdu',
        district: '锦江区',
        address: '四川省成都市锦江区',
        authMethod: method,
        lastLoginTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        isRealNameVerified: true,
      }
    } else {
      matchedUser = { ...matchedUser, authMethod: method, lastLoginTime: new Date().toISOString().replace('T', ' ').slice(0, 19) }
    }
  } else if (method === 'face') {
    matchedUser = mockUsers[0]
      ? { ...mockUsers[0], authMethod: method, lastLoginTime: new Date().toISOString().replace('T', ' ').slice(0, 19) }
      : undefined
  }

  return matchedUser || null
}

const saved = loadFromStorage()

export const useUserStore = create<UserState>((set, get) => ({
  user: saved.user,
  isAuthenticated: saved.isAuthenticated,
  authMethod: saved.authMethod,
  loading: false,

  login: async (method, credentials) => {
    set({ loading: true })

    try {
      const result = await api.login(method, credentials)
      if (result?.user) {
        const user = { ...result.user, authMethod: method, lastLoginTime: new Date().toISOString().replace('T', ' ').slice(0, 19) }
        set({ user, isAuthenticated: true, authMethod: method, loading: false })
        saveToStorage(user, method)
        return true
      }
    } catch {
      // API failed, fall through to mock
    }

    const mockUser = loginWithMock(method, credentials)
    if (mockUser) {
      set({ user: mockUser, isAuthenticated: true, authMethod: method, loading: false })
      saveToStorage(mockUser, method)
      return true
    }

    set({ loading: false })
    return false
  },

  logout: () => {
    api.logout().catch(() => {})
    clearStorage()
    set({ user: null, isAuthenticated: false, authMethod: null, loading: false })
  },

  updateUserCity: (city) => {
    const { user, isAuthenticated, authMethod } = get()
    if (user) {
      const updatedUser = { ...user, city }
      set({ user: updatedUser })
      if (isAuthenticated) saveToStorage(updatedUser, authMethod!)
    }
  },
}))
