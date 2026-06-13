import { create } from 'zustand'
import { mockUsers } from '../data/mockData'
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
  restoreSession: () => void
}

const STORAGE_KEY = 'gov_user_session'

const saveToStorage = (state: Pick<UserState, 'user' | 'isAuthenticated' | 'authMethod'>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

const loadFromStorage = (): Pick<UserState, 'user' | 'isAuthenticated' | 'authMethod'> | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch {
    // ignore
  }
  return null
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  authMethod: null,
  loading: false,

  login: async (method, credentials) => {
    set({ loading: true })

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const { password } = credentials
    if (password !== '123456') {
      set({ loading: false })
      return false
    }

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
        matchedUser = {
          ...matchedUser,
          authMethod: method,
          lastLoginTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        }
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
        matchedUser = {
          ...matchedUser,
          authMethod: method,
          lastLoginTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
        }
      }
    } else if (method === 'face') {
      matchedUser = mockUsers[0]
        ? {
            ...mockUsers[0],
            authMethod: method,
            lastLoginTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
          }
        : undefined
    }

    if (!matchedUser) {
      set({ loading: false })
      return false
    }

    const newState = {
      user: matchedUser,
      isAuthenticated: true,
      authMethod: method,
      loading: false,
    }
    set(newState)
    saveToStorage(newState)
    return true
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      authMethod: null,
      loading: false,
    })
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  },

  updateUserCity: (city) => {
    const { user } = get()
    if (user) {
      const updatedUser = { ...user, city }
      set({ user: updatedUser })
      saveToStorage({
        user: updatedUser,
        isAuthenticated: get().isAuthenticated,
        authMethod: get().authMethod,
      })
    }
  },

  restoreSession: () => {
    const saved = loadFromStorage()
    if (saved && saved.user) {
      set({
        user: saved.user,
        isAuthenticated: saved.isAuthenticated,
        authMethod: saved.authMethod,
      })
    }
  },
}))
