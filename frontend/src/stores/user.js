import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const userType = ref(localStorage.getItem('userType') || null)
  const token = ref(localStorage.getItem('token') || null)

  const isLoggedIn = computed(() => !!token.value)
  const isClient = computed(() => userType.value === 'client')
  const isCourier = computed(() => userType.value === 'courier')
  const isAdmin = computed(() => userType.value === 'admin')

  const setUser = (userData, type, tokenData) => {
    user.value = userData
    userType.value = type
    token.value = tokenData
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('userType', type)
    localStorage.setItem('token', tokenData)
  }

  const logout = () => {
    user.value = null
    userType.value = null
    token.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('userType')
    localStorage.removeItem('token')
  }

  return {
    user,
    userType,
    token,
    isLoggedIn,
    isClient,
    isCourier,
    isAdmin,
    setUser,
    logout
  }
})
