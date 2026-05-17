import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import request from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('petlove_token'))
  const user = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('petlove_token', newToken)
  }

  const setUser = (newUser: User) => {
    user.value = newUser
  }

  const login = async (username: string, password: string) => {
    const res = await request.post('/auth/login', { username, password })
    setToken(res.data.token)
    setUser(res.data.user)
    return res
  }

  const register = async (username: string, password: string, nickname?: string) => {
    const res = await request.post('/auth/register', { username, password, nickname })
    setToken(res.data.token)
    setUser(res.data.user)
    return res
  }

  const fetchUserProfile = async () => {
    const res = await request.get('/auth/profile')
    setUser(res.data)
    return res
  }

  const updateProfile = async (data: Partial<User>) => {
    const res = await request.put('/auth/profile', data)
    setUser(res.data)
    return res
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('petlove_token')
  }

  return {
    token,
    user,
    isLoggedIn,
    login,
    register,
    fetchUserProfile,
    updateProfile,
    logout
  }
})
