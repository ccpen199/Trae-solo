import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value && !!user.value)

  const login = async (username, password) => {
    const result = await authApi.login({ username, password })
    if (result.success) {
      token.value = result.access_token
      user.value = result.user
      localStorage.setItem('token', result.access_token)
      localStorage.setItem('user', JSON.stringify(result.user))
    }
    return result
  }

  const register = async (userData) => {
    return await authApi.register(userData)
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const fetchCurrentUser = async () => {
    try {
      const result = await authApi.getCurrentUser()
      if (result.success) {
        user.value = result.user
        localStorage.setItem('user', JSON.stringify(result.user))
      }
    } catch (error) {
      logout()
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    register,
    logout,
    fetchCurrentUser
  }
})
