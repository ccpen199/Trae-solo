import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/request'

interface User {
  id: string
  username: string
  email: string
  role: string
  nickname: string
  avatar: string | null
  phone: string | null
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || '')

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const setUser = (newUser: User) => {
    user.value = newUser
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  }

  const fetchUserInfo = async () => {
    if (!token.value) return

    try {
      const response = await api.get('/users/profile')
      if (response.data.success) {
        user.value = response.data.data
      }
    } catch (error) {
      logout()
    }
  }

  const initStore = () => {
    if (token.value) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      fetchUserInfo()
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    userRole,
    setToken,
    setUser,
    logout,
    fetchUserInfo,
    initStore
  }
})
