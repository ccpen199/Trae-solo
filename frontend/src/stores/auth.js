import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import request from '../utils/request'

const safeParseJSON = (str, defaultValue = null) => {
  if (!str) return defaultValue
  try {
    const parsed = JSON.parse(str)
    return parsed !== undefined ? parsed : defaultValue
  } catch {
    return defaultValue
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(safeParseJSON(localStorage.getItem('user')))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const userName = computed(() => user.value?.name || '')
  const userRole = computed(() => user.value?.role || '')

  const login = async (username, password) => {
    const data = await request.post('/auth/login', { username, password })
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  }

  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const checkAuth = async () => {
    try {
      const data = await request.get('/auth/me')
      user.value = data.user
      localStorage.setItem('user', JSON.stringify(data.user))
      return data
    } catch (err) {
      token.value = ''
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      throw err
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    userName,
    userRole,
    login,
    logout,
    checkAuth,
  }
})
