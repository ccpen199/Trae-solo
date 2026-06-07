import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authAPI } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value && ['admin', 'expert'].includes(user.value.role))
  const isExpert = computed(() => user.value?.role === 'expert')
  const isSuperAdmin = computed(() => user.value?.role === 'admin')

  async function login(username, password) {
    const response = await authAPI.login({ username, password })
    const { token: newToken, user: userData } = response.data
    token.value = newToken
    user.value = userData
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(userData))
    return userData
  }

  async function register(username, password) {
    const response = await authAPI.register({ username, password })
    const { token: newToken, user: userData } = response.data
    token.value = newToken
    user.value = userData
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(userData))
    return userData
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
    isExpert,
    isSuperAdmin,
    login,
    register,
    logout
  }
})
