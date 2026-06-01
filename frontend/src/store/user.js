import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../api'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref(null)
  const balance = ref(0)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!currentUser.value)

    async function login(userId) {
    loading.value = true
    try {
      console.log('api.getUser 开始请求:', `/api/users/${userId}`)
      const user = await api.getUser(userId)
      console.log('获取用户成功:', user)
      currentUser.value = user
      balance.value = user.balance
      localStorage.setItem('currentUserId', userId)
      return true
    } catch (e) {
      console.error('登录失败:', e)
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    currentUser.value = null
    balance.value = 0
    localStorage.removeItem('currentUserId')
  }

  async function refreshBalance() {
    if (!currentUser.value) return
    try {
      const data = await api.getBalance(currentUser.value.id)
      balance.value = data.balance
    } catch (e) {}
  }

  function initFromStorage() {
    const userId = localStorage.getItem('currentUserId')
    if (userId) return login(userId)
    return Promise.resolve(false)
  }

  return {
    currentUser,
    balance,
    loading,
    isLoggedIn,
    login,
    logout,
    refreshBalance,
    initFromStorage
  }
})
