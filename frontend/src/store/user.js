import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || '')
  const isOnline = ref(window.navigator.onLine)

  const isLoggedIn = computed(() => !!token.value)

  function setUser(userData, tokenString) {
    user.value = userData
    token.value = tokenString
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
    }
    if (tokenString) {
      localStorage.setItem('token', tokenString)
    }
  }

  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  async function fetchProfile() {
    try {
      const data = await authApi.getProfile()
      if (data?.user) {
        user.value = data.user
        localStorage.setItem('user', JSON.stringify(data.user))
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
    }
  }

  function updateOnlineStatus(status) {
    isOnline.value = status
  }

  return {
    user,
    token,
    isOnline,
    isLoggedIn,
    setUser,
    logout,
    fetchProfile,
    updateOnlineStatus
  }
})
