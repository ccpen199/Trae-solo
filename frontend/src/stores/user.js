import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getProfile } from '../api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('yijie_token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('yijie_user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  const setToken = (newToken) => {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('yijie_token', newToken)
    } else {
      localStorage.removeItem('yijie_token')
    }
  }

  const setUserInfo = (info) => {
    userInfo.value = info
    if (info) {
      localStorage.setItem('yijie_user', JSON.stringify(info))
    } else {
      localStorage.removeItem('yijie_user')
    }
  }

  const initFromStorage = () => {
    const storedToken = localStorage.getItem('yijie_token')
    const storedUser = localStorage.getItem('yijie_user')
    
    if (storedToken) {
      token.value = storedToken
    }
    if (storedUser) {
      userInfo.value = JSON.parse(storedUser)
    }
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('yijie_token')
    localStorage.removeItem('yijie_user')
  }

  const fetchUserInfo = async () => {
    if (!token.value) return
    
    try {
      const res = await getProfile()
      if (res.code === 200) {
        setUserInfo(res.data)
      }
    } catch (e) {
      console.error('获取用户信息失败:', e)
    }
  }

  const updateBalance = (newBalance) => {
    if (userInfo.value) {
      userInfo.value.balance = newBalance
      setUserInfo(userInfo.value)
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    setToken,
    setUserInfo,
    initFromStorage,
    logout,
    fetchUserInfo,
    updateBalance
  }
})
