import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

interface User {
  id: string
  username: string
  role: string
  displayName: string
  email: string
  storageUsed: number
  storageQuota: number
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  
  const isAdmin = computed(() => user.value?.role === 'admin')
  
  const isCompliance = computed(() => 
    user.value?.role === 'admin' || user.value?.role === 'compliance'
  )
  
  const storagePercentage = computed(() => {
    if (!user.value) return 0
    return Math.round((user.value.storageUsed / user.value.storageQuota) * 100)
  })
  
  async function login(username: string, password: string) {
    const response = await authApi.login(username, password)
    const { token: newToken, user: userData } = response.data
    
    token.value = newToken
    user.value = userData
    
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(userData))
    
    return response.data
  }
  
  async function logout() {
    try {
      await authApi.logout()
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
  
  async function fetchCurrentUser() {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch {
        // fallback to API call
      }
    }
    
    const response = await authApi.getCurrentUser()
    user.value = response.data
    localStorage.setItem('user', JSON.stringify(response.data))
    return response.data
  }
  
  function initializeFromStorage() {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (storedToken) {
      token.value = storedToken
    }
    
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch {
        // ignore invalid data
      }
    }
  }
  
  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isCompliance,
    storagePercentage,
    login,
    logout,
    fetchCurrentUser,
    initializeFromStorage
  }
})
