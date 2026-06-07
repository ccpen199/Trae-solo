import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api'

export type UserRole = 'agent' | 'manager' | 'director' | 'admin' | 'platform' | 'ops'

export interface User {
  id: number
  username: string
  name: string
  phone?: string
  role: UserRole
  org_id: number
  cert_status: 'pending' | 'certified' | 'rejected'
  real_name?: string
  avatar?: string
  org_name?: string
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<{ 
    success: boolean
    error?: string
    message?: string
    code?: string
    role?: UserRole
  }>
  register: (data: { username: string; password: string; name: string; phone?: string }) => Promise<{ success: boolean; error?: string }>
  certify: ((data: { realName: string; idCard: string }) => Promise<{ success: boolean; error?: string }>) & ((realName: string, idCard: string) => Promise<{ success: boolean; error?: string }>)
  fetchMe: () => Promise<{ success: boolean; error?: string }>
  logout: () => void
  hasRole: (...roles: UserRole[]) => boolean
  canEditHouse: (agentId?: number) => boolean
  canDeleteHouse: () => boolean
  canVerifyHouse: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,

      login: async (username, password) => {
        set({ loading: true })
        try {
          const result = await api.post<{ token: string; user: User }>('/auth/login', { username, password })
          const responseRole = result.role as UserRole | undefined
          if (result.success && result.token && result.user) {
            set({ token: result.token, user: result.user, loading: false, isAuthenticated: true })
            return { success: true, message: result.message, error: undefined, code: undefined, role: result.user.role }
          }
          set({ loading: false })
          return { 
            success: false, 
            error: result.error || '登录失败', 
            code: result.code, 
            role: responseRole,
            message: undefined
          }
        } catch (err: any) {
          set({ loading: false })
          return { success: false, error: err.message || '登录失败', code: undefined, role: undefined, message: undefined }
        }
      },

      register: async (data) => {
        set({ loading: true })
        try {
          const result = await api.post<{ user: User }>('/auth/register', data)
          if (result.success) {
            set({ loading: false })
            return { success: true }
          }
          set({ loading: false })
          return { success: false, error: result.error || '注册失败' }
        } catch (err: any) {
          set({ loading: false })
          return { success: false, error: err.message || '注册失败' }
        }
      },

      certify: async (dataOrRealName: string | { realName: string; idCard: string }, maybeIdCard?: string) => {
        set({ loading: true })
        try {
          let body: { realName: string; idCard: string }
          if (typeof dataOrRealName === 'string') {
            body = { realName: dataOrRealName, idCard: maybeIdCard || '' }
          } else {
            body = dataOrRealName
          }

          const result = await api.post('/auth/certify', body)
          if (result.success) {
            set({ loading: false })
            return { success: true }
          }
          set({ loading: false })
          return { success: false, error: result.error || '认证提交失败' }
        } catch (err: any) {
          set({ loading: false })
          return { success: false, error: err.message || '认证提交失败' }
        }
      },

      fetchMe: async () => {
        set({ loading: true })
        try {
          const result = await api.get<{ user: User }>('/auth/me')
          const user = result.data?.user || result.user
          if (result.success && user) {
            set({ user, loading: false, isAuthenticated: true })
            return { success: true }
          }
          set({ loading: false })
          return { success: false, error: result.error || '获取用户信息失败' }
        } catch (err: any) {
          set({ loading: false })
          return { success: false, error: err.message || '获取用户信息失败' }
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
        localStorage.removeItem('token')
      },

      hasRole: (...roles) => {
        const user = get().user
        if (!user) return false
        return roles.includes(user.role)
      },

      canEditHouse: (agentId?: number) => {
        const user = get().user
        if (!user) return false
        if (user.role === 'director' || user.role === 'manager' || user.role === 'admin') return true
        if (agentId !== undefined && user.id === agentId) return true
        return false
      },

      canDeleteHouse: () => {
        const user = get().user
        if (!user) return false
        return user.role === 'director' || user.role === 'manager' || user.role === 'admin'
      },

      canVerifyHouse: () => {
        const user = get().user
        if (!user) return false
        return user.role === 'director' || user.role === 'manager' || user.role === 'admin'
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          state.isAuthenticated = true
        }
      },
    }
  )
)
