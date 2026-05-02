import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getCurrentUser, logout as logoutApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)

  const login = async (username, password) => {
    const res = await loginApi(username, password)
    token.value = res.token
    userInfo.value = res.user
    
    localStorage.setItem('token', res.token)
    localStorage.setItem('userInfo', JSON.stringify(res.user))
    
    return res
  }

  const fetchUserInfo = async () => {
    const res = await getCurrentUser()
    userInfo.value = res
    localStorage.setItem('userInfo', JSON.stringify(res))
    return res
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch (e) {
      console.error('退出登录 API 调用失败:', e)
    }
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  const updateUnreadCount = (count) => {
    if (userInfo.value) {
      userInfo.value.unreadCount = count
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    login,
    fetchUserInfo,
    logout,
    updateUnreadCount
  }
})
