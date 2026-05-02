import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role || '')
  const merchantId = computed(() => userInfo.value?.merchant_id || null)
  const username = computed(() => userInfo.value?.username || '')

  async function login(username, password) {
    const response = await api.post('/v1/auth/login', {
      username,
      password
    })
    
    if (response.access_token) {
      token.value = response.access_token
      userInfo.value = response.user
      
      localStorage.setItem('token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    
    return response
  }

  async function register(userData) {
    const response = await api.post('/v1/auth/register', userData)
    return response
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function fetchCurrentUser() {
    try {
      const response = await api.get('/v1/auth/me')
      if (response.success) {
        userInfo.value = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
      }
      return response
    } catch (error) {
      throw error
    }
  }

  function hasRole(roles) {
    if (!userInfo.value) return false
    return roles.includes(userInfo.value.role)
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    userRole,
    merchantId,
    username,
    login,
    register,
    logout,
    fetchCurrentUser,
    hasRole
  }
})
