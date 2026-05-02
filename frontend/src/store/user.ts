import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi, commonApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<User | null>(null)
  const unreadCount = ref(0)

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isConfigurer = computed(() => user.value?.role === 'admin' || user.value?.role === 'configurer')

  async function login(username: string, password: string) {
    const result: any = await authApi.login(username, password)
    token.value = result.access_token
    user.value = result.user
    localStorage.setItem('token', result.access_token)
    localStorage.setItem('user', JSON.stringify(result.user))
    await fetchUnreadCount()
    return result
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch (e) {
      console.error('Logout error:', e)
    }
    token.value = ''
    user.value = null
    unreadCount.value = 0
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function fetchCurrentUser() {
    if (token.value) {
      try {
        const savedUser = localStorage.getItem('user')
        if (savedUser) {
          user.value = JSON.parse(savedUser)
        }
        const result: User = await authApi.getCurrentUser()
        user.value = result
        localStorage.setItem('user', JSON.stringify(result))
      } catch (e) {
        token.value = ''
        user.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
  }

  async function fetchUnreadCount() {
    if (token.value) {
      try {
        const result = await commonApi.getUnreadCount()
        unreadCount.value = result.count
      } catch (e) {
        console.error('Fetch unread count error:', e)
      }
    }
  }

  function restoreFromStorage() {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken) {
      token.value = savedToken
    }
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (e) {
        console.error('Parse user error:', e)
      }
    }
  }

  return {
    token,
    user,
    unreadCount,
    isLoggedIn,
    isAdmin,
    isConfigurer,
    login,
    logout,
    fetchCurrentUser,
    fetchUnreadCount,
    restoreFromStorage
  }
})
