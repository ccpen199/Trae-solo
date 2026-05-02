import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '@/utils/request'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const role = computed(() => user.value?.role || '')
  const username = computed(() => user.value?.username || '')
  const name = computed(() => user.value?.name || '')

  async function login(username, password) {
    const res = await request.post('/auth/login', { username, password })
    
    token.value = res.data.token
    user.value = res.data.user
    
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    
    return res
  }

  async function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function getCurrentUser() {
    try {
      const res = await request.get('/auth/me')
      user.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
      return res
    } catch (err) {
      logout()
      throw err
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    role,
    username,
    name,
    login,
    logout,
    getCurrentUser
  }
})
