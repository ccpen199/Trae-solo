import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin')
  const isCustomerService = computed(() => userInfo.value?.role === 'customer_service')
  const isAppraiser = computed(() => userInfo.value?.role === 'appraiser')
  const isSeller = computed(() => userInfo.value?.role === 'seller' || isAdmin.value)

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUserInfo = (info) => {
    userInfo.value = info
    if (info) {
      localStorage.setItem('user', JSON.stringify(info))
    } else {
      localStorage.removeItem('user')
    }
  }

  const login = async (loginForm) => {
    const result = await authApi.login(loginForm)
    setToken(result.data.token)
    setUserInfo(result.data.user)
    return result
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      console.error('Logout error:', e)
    }
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const fetchUserInfo = async () => {
    try {
      const result = await authApi.getCurrentUser()
      setUserInfo(result.data)
      return result
    } catch (e) {
      token.value = ''
      userInfo.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      throw e
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    isCustomerService,
    isAppraiser,
    isSeller,
    setToken,
    setUserInfo,
    login,
    logout,
    fetchUserInfo
  }
})

export const useProductStore = defineStore('product', () => {
  const categories = ref([])
  const brands = ref([])

  return {
    categories,
    brands
  }
})

export const useChatStore = defineStore('chat', () => {
  const sessions = ref([])
  const currentSession = ref(null)
  const messages = ref([])
  const unreadCount = ref(0)

  const updateUnreadCount = () => {
    unreadCount.value = sessions.value.reduce((sum, s) => sum + (s.unreadCount || 0), 0)
  }

  return {
    sessions,
    currentSession,
    messages,
    unreadCount,
    updateUnreadCount
  }
})
