import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userApi } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  const setUserInfo = (info) => {
    userInfo.value = info
    if (info) {
      localStorage.setItem('user', JSON.stringify(info))
    } else {
      localStorage.removeItem('user')
    }
  }

  const login = async (loginData) => {
    const result = await userApi.login(loginData)
    setToken(result.data.token)
    setUserInfo(result.data.user)
    return result
  }

  const register = async (registerData) => {
    const result = await userApi.register(registerData)
    if (result.data.token) {
      setToken(result.data.token)
      setUserInfo(result.data.user)
    }
    return result
  }

  const logout = () => {
    setToken('')
    setUserInfo(null)
  }

  const fetchProfile = async () => {
    const result = await userApi.getProfile()
    setUserInfo(result.data)
    return result
  }

  const updateProfile = async (data) => {
    const result = await userApi.updateProfile(data)
    setUserInfo(result.data)
    return result
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    setToken,
    setUserInfo,
    login,
    register,
    logout,
    fetchProfile,
    updateProfile
  }
})
