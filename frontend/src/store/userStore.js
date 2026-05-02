import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)
  const token = ref(null)

  const isLoggedIn = computed(() => !!userInfo.value)
  const userName = computed(() => userInfo.value?.name || '')
  const userRole = computed(() => userInfo.value?.role || '')
  const userRoleLabel = computed(() => userInfo.value?.roleLabel || '')

  const setUser = (user) => {
    userInfo.value = user
    localStorage.setItem('user', JSON.stringify(user))
  }

  const clearUser = () => {
    userInfo.value = null
    token.value = null
    localStorage.removeItem('user')
  }

  const initUser = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        userInfo.value = JSON.parse(storedUser)
      } catch (e) {
        console.error('Parse stored user error:', e)
        clearUser()
      }
    }
  }

  const login = async (username, password) => {
    const result = await authApi.login({ username, password })
    if (result.success) {
      setUser(result.data)
      return result.data
    }
    return null
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      console.error('Logout error:', e)
    }
    clearUser()
  }

  return {
    userInfo,
    token,
    isLoggedIn,
    userName,
    userRole,
    userRoleLabel,
    setUser,
    clearUser,
    initUser,
    login,
    logout,
  }
})
