import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)

  const isLoggedIn = computed(() => !!token.value)
  const isRider = computed(() => userInfo.value?.rider != null)
  const isApproved = computed(() => userInfo.value?.status === 'approved')
  const isOnline = computed(() => userInfo.value?.rider?.isOnline || false)

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUserInfo = (info) => {
    userInfo.value = info
    localStorage.setItem('user', JSON.stringify(info))
  }

  const clearAuth = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const loadStoredUser = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        userInfo.value = JSON.parse(storedUser)
      } catch (e) {
        console.error('解析用户信息失败:', e)
      }
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await authApi.getProfile()
      if (response.data.success) {
        setUserInfo(response.data.data)
        return response.data.data
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      if (error.response?.status === 401) {
        clearAuth()
      }
    }
    return null
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isRider,
    isApproved,
    isOnline,
    setToken,
    setUserInfo,
    clearAuth,
    loadStoredUser,
    fetchProfile
  }
})
