import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const isLoading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isEditor = computed(() => user.value?.role === 'editor' || user.value?.role === 'admin')
  const isExpert = computed(() => user.value?.role === 'expert' || user.value?.role === 'admin')

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
  }

  const login = async (credentials) => {
    isLoading.value = true
    try {
      const response = await api.post('/users/login', credentials)
      const { data } = response.data
      
      setToken(data.token)
      setUser(data.user)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || '登录失败' 
      }
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData) => {
    isLoading.value = true
    try {
      const response = await api.post('/users/register', userData)
      const { data } = response.data
      
      setToken(data.token)
      setUser(data.user)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || '注册失败' 
      }
    } finally {
      isLoading.value = false
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const checkAuth = async () => {
    if (!token.value) {
      return false
    }

    try {
      const response = await api.get('/users/me')
      const { data } = response.data
      
      setUser(data)
      return true
    } catch (error) {
      setToken(null)
      setUser(null)
      return false
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/users/profile', profileData)
      const { data } = response.data
      
      if (user.value) {
        user.value.profile = data.profile
      }
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || '更新失败' 
      }
    }
  }

  const updateExpertise = async (expertise) => {
    try {
      const response = await api.put('/users/expertise', { expertise })
      const { data } = response.data
      
      if (user.value) {
        user.value.profile.expertise = expertise
      }
      
      return { success: true, data }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || '更新失败' 
      }
    }
  }

  const refreshUser = async () => {
    if (!token.value) return
    
    try {
      const response = await api.get('/users/me')
      const { data } = response.data
      setUser(data)
    } catch (error) {
      console.error('Failed to refresh user:', error)
    }
  }

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    isAdmin,
    isEditor,
    isExpert,
    login,
    register,
    logout,
    checkAuth,
    updateProfile,
    updateExpertise,
    refreshUser,
    setToken,
    setUser
  }
})
