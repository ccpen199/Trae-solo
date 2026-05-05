import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserProfile, login, register, sendVerificationCode } from '@/api/user'
import { showToast } from 'vant'

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || '')
  
  const isLoggedIn = computed(() => !!token.value && !!user.value)

  const setUser = (userData, tokenData) => {
    user.value = userData
    token.value = tokenData
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', tokenData)
  }

  const clearUser = () => {
    user.value = null
    token.value = ''
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  const handleLogin = async (params) => {
    try {
      const res = await login(params)
      if (res.success) {
        setUser(res.data.user, res.data.token)
        showToast('登录成功')
        return true
      }
      return false
    } catch (error) {
      showToast(error.message || '登录失败')
      return false
    }
  }

  const handleRegister = async (params) => {
    try {
      const res = await register(params)
      if (res.success) {
        setUser(res.data.user, res.data.token)
        showToast('注册成功')
        return true
      }
      return false
    } catch (error) {
      showToast(error.message || '注册失败')
      return false
    }
  }

  const handleSendCode = async (phone, type) => {
    try {
      const res = await sendVerificationCode(phone, type)
      if (res.success) {
        showToast('验证码已发送')
        return res.data
      }
      return null
    } catch (error) {
      showToast(error.message || '发送失败')
      return null
    }
  }

  const getProfile = async () => {
    try {
      const res = await getUserProfile()
      if (res.success) {
        user.value = res.data
        localStorage.setItem('user', JSON.stringify(res.data))
      }
      return res
    } catch (error) {
      clearUser()
      throw error
    }
  }

  const logout = () => {
    clearUser()
    showToast('已退出登录')
  }

  return {
    user,
    token,
    isLoggedIn,
    setUser,
    clearUser,
    handleLogin,
    handleRegister,
    handleSendCode,
    getProfile,
    logout
  }
})
