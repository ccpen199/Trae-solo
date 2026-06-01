import { create } from 'zustand'
import { auth as authApi } from '@/api/client'
import type { User } from '@/types'
import { roleLabels } from '@/types'

export { roleLabels }

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'auth_user'
const AUTH_KEY = 'auth_authenticated'

export interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  error: string | null
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string, role: string) => Promise<boolean>
  logout: () => void
  init: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  isAuthenticated: false,
  error: null,

  init: () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const userStr = localStorage.getItem(USER_KEY)
      const auth = localStorage.getItem(AUTH_KEY)
      if (token && userStr && auth === 'true') {
        const user = JSON.parse(userStr)
        set({
          token,
          user,
          isAuthenticated: true,
        })
      }
    } catch (e) {
      console.error('Auth init failed:', e)
    }
  },

  login: async (username: string, password: string): Promise<boolean> => {
    set({ loading: true, error: null })
    try {
      const response = await authApi.login(username, password)
      localStorage.setItem(TOKEN_KEY, response.token)
      localStorage.setItem(USER_KEY, JSON.stringify(response.user))
      localStorage.setItem(AUTH_KEY, 'true')
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : '登录失败'
      let errorMsg = '登录失败，请稍后重试'
      if (msg.includes('invalid credentials')) {
        errorMsg = '用户名或密码错误，请检查后重试'
      } else if (msg.includes('failed')) {
        errorMsg = '网络连接失败，请检查后端服务是否启动'
      } else if (msg.includes('404')) {
        errorMsg = '接口地址错误，请检查配置'
      } else {
        errorMsg = msg
      }
      set({ loading: false, error: errorMsg })
      return false
    }
  },

  register: async (username: string, password: string, role: string): Promise<boolean> => {
    set({ loading: true, error: null })
    try {
      const response = await authApi.register(username, password, role)
      localStorage.setItem(TOKEN_KEY, response.token)
      localStorage.setItem(USER_KEY, JSON.stringify(response.user))
      localStorage.setItem(AUTH_KEY, 'true')
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        loading: false,
        error: null,
      })
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : '注册失败'
      let errorMsg = '注册失败，请稍后重试'
      if (msg.includes('username already exists')) {
        errorMsg = '该用户名已被注册，请使用其他用户名'
      } else if (msg.includes('required')) {
        errorMsg = '请填写完整的注册信息'
      } else if (msg.includes('invalid role')) {
        errorMsg = '角色选择无效'
      } else if (msg.includes('failed')) {
        errorMsg = '网络连接失败，请检查后端服务是否启动'
      } else {
        errorMsg = msg
      }
      set({ loading: false, error: errorMsg })
      return false
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(AUTH_KEY)
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    })
  },
}))
