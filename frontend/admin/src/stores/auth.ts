import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export interface User {
  id: string
  username: string
  name: string
  role: string
  phone?: string
  avatar?: string
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  CASHIER = 'cashier',
  WAITER = 'waiter',
  CHEF = 'chef',
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value)

  const isAdmin = computed(() => user.value?.role === UserRole.ADMIN)
  const isManager = computed(() =>
    [UserRole.ADMIN, UserRole.MANAGER].includes(user.value?.role as UserRole)
  )
  const isCashier = computed(() =>
    [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER].includes(user.value?.role as UserRole)
  )
  const isWaiter = computed(() =>
    [UserRole.ADMIN, UserRole.MANAGER, UserRole.WAITER].includes(user.value?.role as UserRole)
  )
  const isChef = computed(() =>
    [UserRole.ADMIN, UserRole.MANAGER, UserRole.CHEF].includes(user.value?.role as UserRole)
  )

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const clearToken = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    delete axios.defaults.headers.common['Authorization']
  }

  const login = async (username: string, password: string) => {
    loading.value = true
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password,
      })

      const { accessToken, user: userData } = response.data

      setToken(accessToken)
      user.value = userData

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || '登录失败',
      }
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    clearToken()
  }

  const fetchUserProfile = async () => {
    if (!token.value) return

    try {
      const response = await axios.get('/api/auth/profile')
      user.value = response.data
    } catch (error) {
      clearToken()
    }
  }

  const restoreToken = () => {
    if (token.value) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      fetchUserProfile()
    }
  }

  const hasRole = (role: string) => {
    return user.value?.role === role
  }

  const hasAnyRole = (roles: string[]) => {
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isManager,
    isCashier,
    isWaiter,
    isChef,
    setToken,
    clearToken,
    login,
    logout,
    fetchUserProfile,
    restoreToken,
    hasRole,
    hasAnyRole,
  }
})
