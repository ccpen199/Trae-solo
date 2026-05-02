import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '@/api'

export interface User {
  id: number
  username: string
  email: string | null
  phone: string | null
  full_name: string
  role: string
  is_active: boolean
  credit_score: number
  total_service_hours: number
  created_at: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)

  async function login(username: string, password: string) {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const response = await apiClient.post<{
      access_token: string
      token_type: string
      user: User
    }>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    token.value = response.data.access_token
    user.value = response.data.user
    localStorage.setItem('token', response.data.access_token)
    localStorage.setItem('user', JSON.stringify(response.data.user))

    return response.data
  }

  async function register(userData: {
    username: string
    password: string
    full_name: string
    email?: string
    phone?: string
    role?: string
  }) {
    const response = await apiClient.post<User>('/auth/register', userData)
    return response.data
  }

  async function fetchCurrentUser() {
    const response = await apiClient.get<User>('/auth/me')
    user.value = response.data
    localStorage.setItem('user', JSON.stringify(response.data))
    return response.data
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function loadStoredUser() {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser)
      } catch {
        user.value = null
      }
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    fetchCurrentUser,
    logout,
    loadStoredUser,
  }
})
