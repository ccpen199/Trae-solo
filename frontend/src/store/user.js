import { defineStore } from 'pinia'
import { ref } from 'vue'
import { login, register, getProfile } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUserInfo = (info) => {
    userInfo.value = info
  }

  const handleLogin = async (loginData) => {
    const res = await login(loginData)
    setToken(res.data.token)
    setUserInfo(res.data.user)
    return res
  }

  const handleRegister = async (registerData) => {
    const res = await register(registerData)
    setToken(res.data.token)
    setUserInfo(res.data.user)
    return res
  }

  const fetchUserInfo = async () => {
    if (!token.value) return null
    try {
      const res = await getProfile()
      setUserInfo(res.data)
      return res.data
    } catch (error) {
      console.error('获取用户信息失败:', error)
      return null
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    userInfo,
    setToken,
    setUserInfo,
    handleLogin,
    handleRegister,
    fetchUserInfo,
    logout
  }
})
