import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  
  const isLoggedIn = computed(() => !!token.value)
  
  const isAdmin = computed(() => {
    if (!userInfo.value) return false
    const roles = userInfo.value.roles || []
    return roles.some(r => ['SUPER_ADMIN', 'ADMIN', 'MODERATOR'].includes(r))
  })
  
  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }
  
  function setUserInfo(info) {
    userInfo.value = info
    localStorage.setItem('user', JSON.stringify(info))
  }
  
  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
  
  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    setToken,
    setUserInfo,
    logout
  }
})
