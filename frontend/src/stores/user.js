import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)

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
      localStorage.setItem('userInfo', JSON.stringify(info))
    } else {
      localStorage.removeItem('userInfo')
    }
  }

  const initFromStorage = () => {
    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo) {
      try {
        userInfo.value = JSON.parse(storedUserInfo)
      } catch (e) {
        userInfo.value = null
      }
    }
  }

  const login = async (phone, code) => {
    const res = await request.post('/api/auth/login', { phone, code })
    
    if (res.code === 200) {
      setToken(res.data.token)
      setUserInfo(res.data.user)
      ElMessage.success('登录成功')
      return { success: true, isNewUser: res.data.isNewUser }
    } else {
      ElMessage.error(res.message || '登录失败')
      return { success: false }
    }
  }

  const sendSmsCode = async (phone) => {
    const res = await request.post('/api/auth/sms-code', { phone })
    
    if (res.code === 200) {
      ElMessage.success('验证码已发送')
      return { success: true, debugCode: res.data.debugCode }
    } else {
      ElMessage.error(res.message || '发送失败')
      return { success: false }
    }
  }

  const fetchUserInfo = async () => {
    if (!token.value) return null
    
    try {
      const res = await request.get('/api/auth/me')
      if (res.code === 200) {
        setUserInfo(res.data)
        return res.data
      }
    } catch (e) {
      console.error('获取用户信息失败:', e)
    }
    return null
  }

  const logout = () => {
    setToken('')
    setUserInfo(null)
    ElMessage.success('已退出登录')
  }

  const updateUserInfo = async (data) => {
    const res = await request.put('/api/auth/me', data)
    
    if (res.code === 200) {
      setUserInfo(res.data)
      ElMessage.success('更新成功')
      return true
    } else {
      ElMessage.error(res.message || '更新失败')
      return false
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    setToken,
    setUserInfo,
    initFromStorage,
    login,
    sendSmsCode,
    fetchUserInfo,
    logout,
    updateUserInfo
  }
})
