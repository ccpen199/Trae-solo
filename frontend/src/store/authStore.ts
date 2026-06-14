import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { post, get } from '@/utils/request'

export interface UserInfo {
  id: string
  phone: string
  name: string
  avatar?: string
  role?: string
  email?: string
  idCard?: string
  status?: string
  createdAt?: string
}

interface LoginRequest {
  phone: string
  password: string
}

interface RegisterRequest {
  phone: string
  password: string
  name: string
}

interface UpdateUserParams {
  name?: string
  email?: string
  avatar?: string
  gender?: string
  birthday?: string
}

interface AuthState {
  token: string
  user: UserInfo | null
  isAuthenticated: boolean
  login: (params: LoginRequest) => Promise<any>
  logout: () => void
  register: (params: RegisterRequest) => Promise<any>
  fetchUserInfo: () => Promise<UserInfo | null>
  updateUserInfo: (params: UpdateUserParams) => Promise<boolean>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: '',
      user: null,
      isAuthenticated: false,

      login: async (params: LoginRequest) => {
        try {
          const res = await post('/auth/login', params)
          if (res.ok) {
            const { token, user } = res.data
            set({
              token,
              user,
              isAuthenticated: true,
            })
            return { success: true, data: res.data }
          }
          return { success: false, message: res.message || '登录失败' }
        } catch (error: any) {
          return { success: false, message: error.message || '登录失败' }
        }
      },

      logout: () => {
        set({
          token: '',
          user: null,
          isAuthenticated: false,
        })
        localStorage.removeItem('auth-storage')
      },

      register: async (params: RegisterRequest) => {
        try {
          const res = await post('/auth/register', params)
          if (res.ok) {
            return { success: true, data: res.data }
          }
          return { success: false, message: res.message || '注册失败' }
        } catch (error: any) {
          return { success: false, message: error.message || '注册失败' }
        }
      },

      fetchUserInfo: async () => {
        try {
          const res = await get('/auth/me')
          if (res.ok) {
            set({ user: res.data })
            return res.data
          }
          return null
        } catch (error) {
          console.error('Fetch user info error:', error)
          return null
        }
      },

      updateUserInfo: async (params: UpdateUserParams) => {
        try {
          const res = await post('/auth/profile', params)
          if (res.ok) {
            set((state) => ({
              user: state.user ? { ...state.user, ...params } : null,
            }))
            return true
          }
          return false
        } catch (error) {
          console.error('Update user info error:', error)
          return false
        }
      },
    }),
    {
      name: 'auth-storage',
    },
  ),
)
