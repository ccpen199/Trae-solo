import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  const initUser = async () => {
    if (token.value) {
      try {
        const res = await api.get('/auth/profile')
        if (res.success) {
          user.value = res.data
          localStorage.setItem('user', JSON.stringify(res.data))
        }
      } catch (error) {
        console.error('Init user error:', error)
        logout()
      }
    }
  }

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    if (res.success) {
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
    }
    return res
  }

  const register = async (data) => {
    const res = await api.post('/auth/register', data)
    if (res.success) {
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
    }
    return res
  }

  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data)
    if (res.success) {
      user.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
    }
    return res
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    initUser,
    login,
    register,
    logout,
    updateProfile
  }
})
