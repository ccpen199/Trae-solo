import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  async function login(username, password) {
    const result = await authApi.login({ username, password })
    token.value = result.data.token
    user.value = result.data.user
    localStorage.setItem('token', result.data.token)
    localStorage.setItem('user', JSON.stringify(result.data.user))
    return result
  }

  async function register(data) {
    return await authApi.register(data)
  }

  async function fetchCurrentUser() {
    if (!token.value) return
    try {
      const result = await authApi.getCurrentUser()
      user.value = result.data
      localStorage.setItem('user', JSON.stringify(result.data))
    } catch (error) {
      logout()
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    login,
    register,
    fetchCurrentUser,
    logout
  }
})
