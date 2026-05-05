import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'
import * as authApi from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  const setUser = (newUser) => {
    user.value = newUser
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser))
    } else {
      localStorage.removeItem('user')
    }
  }

  const login = async (credentials) => {
    const response = await authApi.login(credentials)
    if (response.success) {
      setToken(response.data.token)
      setUser(response.data.user)
    }
    return response
  }

  const register = async (userData) => {
    const response = await authApi.register(userData)
    if (response.success) {
      setToken(response.data.token)
      setUser(response.data.user)
    }
    return response
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      console.error('Logout API error:', e)
    }
    setToken(null)
    setUser(null)
    router.push({ name: 'Home' })
  }

  const fetchCurrentUser = async () => {
    if (!token.value) return null
    try {
      const response = await authApi.getCurrentUser()
      if (response.success) {
        setUser(response.data.user)
        return response.data.user
      }
    } catch (e) {
      setToken(null)
      setUser(null)
    }
    return null
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    setToken,
    setUser,
    login,
    register,
    logout,
    fetchCurrentUser
  }
})
