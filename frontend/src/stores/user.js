import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isOperator = computed(() => user.value?.role === 'operator' || user.value?.role === 'admin')
  const isBarOwner = computed(() => user.value?.role === 'bar_owner' || isOperator.value)

  async function initUser() {
    if (!token.value) return
    try {
      const res = await api.get('/auth/me')
      if (res.success) {
        user.value = res.data
      }
    } catch (e) {
      console.error('获取用户信息失败:', e)
    }
  }

  async function login(credentials) {
    loading.value = true
    try {
      const res = await api.post('/auth/login', credentials)
      if (res.success) {
        token.value = res.data.token
        user.value = res.data.user
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
      }
      return res
    } finally {
      loading.value = false
    }
  }

  async function register(userData) {
    loading.value = true
    try {
      const res = await api.post('/auth/register', userData)
      if (res.success) {
        token.value = res.data.token
        user.value = res.data.user
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
      }
      return res
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function restoreFromStorage() {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (e) {
        console.error('解析用户信息失败:', e)
      }
    }
  }

  async function updateProfile(data) {
    const res = await api.put('/auth/me', data)
    if (res.success) {
      user.value = { ...user.value, ...res.data }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
    return res
  }

  return {
    token,
    user,
    loading,
    isLoggedIn,
    isAdmin,
    isOperator,
    isBarOwner,
    initUser,
    login,
    register,
    logout,
    restoreFromStorage,
    updateProfile
  }
})
