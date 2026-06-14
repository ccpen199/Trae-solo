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
  restoreSession: () => void
  syncLoginSuccess: (user: User, method: AuthMethod) => void
}

const STORAGE_KEY = 'gov_user_session'
const LOGIN_EVENT_KEY = 'gov_login_success'

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

function loginWithMock(method: AuthMethod, credentials: LoginCredentials): User | null {
  const { password } = credentials
  if (password !== '123456') return null

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

  return matchedUser || null
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  authMethod: null,
  loading: false,

  login: async (method, credentials) => {
    console.log('[Auth] 开始登录', { method, hasIdCard: !!credentials.idCard, hasPhone: !!credentials.phone })
    set({ loading: true })

    try {
      const result = await api.login(method, credentials)
      if (result && result.user) {
        console.log('[Auth] API 登录成功:', result.user.name)
        const newState = {
          user: result.user,
          isAuthenticated: true as const,
          authMethod: result.authMethod || method,
          loading: false,
        }
        set(newState)
        saveToStorage(newState)
        try {
          window.dispatchEvent(new CustomEvent(LOGIN_EVENT_KEY, { detail: newState }))
        } catch {
          // ignore
        }
        return true
      }
    } catch (e) {
      console.warn('[Auth] API 登录异常，回退 mock:', e)
    }

    const mockUser = loginWithMock(method, credentials)
    if (mockUser) {
      console.log('[Auth] Mock 登录成功:', mockUser.name)
      const newState = {
        user: mockUser,
        isAuthenticated: true as const,
        authMethod: method,
        loading: false,
      }
      set(newState)
      saveToStorage(newState)
      try {
        window.dispatchEvent(new CustomEvent(LOGIN_EVENT_KEY, { detail: newState }))
      } catch {
        // ignore
      }
      return true
    }

    console.warn('[Auth] 登录失败')
    set({ loading: false })
    return false
  },

  syncLoginSuccess: (user: User, method: AuthMethod) => {
    const newState = {
      user,
      isAuthenticated: true as const,
      authMethod: method,
      loading: false,
    }
    set(newState)
    saveToStorage(newState)
  },

  logout: () => {
    console.log('[Auth] 退出登录')
    api.logout().catch(() => {
      // ignore
    })
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
    if (saved && saved.user && saved.isAuthenticated) {
      console.log('[Auth] 恢复会话:', saved.user.name)
      set({
        user: saved.user,
        isAuthenticated: saved.isAuthenticated,
        authMethod: saved.authMethod,
      })
    } else {
      console.log('[Auth] 无有效会话，保持未登录状态')
    }
  },
}))
