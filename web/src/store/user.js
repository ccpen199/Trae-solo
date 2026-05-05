import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)
  
  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role || '')
  
  async function login(username, password) {
    try {
      const res = await request.post('/api/auth/login', {
        username,
        password
      })
      
      if (res.success) {
        token.value = res.data.token
        userInfo.value = res.data.user
        localStorage.setItem('token', res.data.token)
        return { success: true, message: '登录成功' }
      } else {
        return { success: false, message: res.message || '登录失败' }
      }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || '登录失败，请稍后重试' 
      }
    }
  }
  
  async function fetchUserInfo() {
    try {
      const res = await request.get('/api/auth/me')
      if (res.success) {
        userInfo.value = res.data
        return res.data
      } else {
        throw new Error(res.message)
      }
    } catch (error) {
      throw error
    }
  }
  
  async function logout() {
    try {
      await request.post('/api/auth/logout')
    } catch (error) {
      console.log('Logout API error:', error)
    } finally {
      token.value = ''
      userInfo.value = null
      localStorage.removeItem('token')
    }
  }
  
  async function changePassword(oldPassword, newPassword) {
    try {
      const res = await request.put('/api/auth/change-password', {
        oldPassword,
        newPassword
      })
      return res
    } catch (error) {
      return { success: false, message: error.response?.data?.message || '密码修改失败' }
    }
  }
  
  return {
    token,
    userInfo,
    isLoggedIn,
    userRole,
    login,
    fetchUserInfo,
    logout,
    changePassword
  }
})
