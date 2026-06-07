import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

const getHomePath = (role) => {
  if (role === 'couple') return '/dashboard/home'
  if (role === 'merchant') return '/dashboard/merchant/dashboard'
  if (role === 'admin') return '/dashboard/admin/dashboard'
  return '/dashboard/home'
}

const STORAGE_KEYS = {
  TOKEN: 'wedding_token',
  USER: 'wedding_user'
}

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem(STORAGE_KEYS.TOKEN) || '')
  const user = ref(JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const homePath = computed(() => getHomePath(user.value?.role))

  async function login(credentials) {
    try {
      const res = await api.post('/auth/login', credentials)
      token.value = res.data.token
      user.value = res.data.user
      localStorage.setItem(STORAGE_KEYS.TOKEN, res.data.token)
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(res.data.user))
      return { success: true, data: res.data, homePath: getHomePath(res.data.user?.role) }
    } catch (e) {
      return { 
        success: false, 
        status: e.response?.status || 0,
        message: e.response?.data?.message || '登录失败'
      }
    }
  }

  async function register(data) {
    const res = await api.post('/auth/register', data)
    return res.data
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
  }

  async function updateProfile(data) {
    const res = await api.put('/user/profile', data)
    user.value = { ...user.value, ...res.data }
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user.value))
    return res.data
  }

  return { token, user, isLoggedIn, homePath, login, register, logout, updateProfile, getHomePath }
})
