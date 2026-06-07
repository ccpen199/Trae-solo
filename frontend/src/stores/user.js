import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const userInfo = ref(null)

  const isLoggedIn = computed(() => !!token.value)
  const isShipper = computed(() => user.value?.role === 'shipper')
  const isDriver = computed(() => user.value?.role === 'driver')
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(credentials) {
    const res = await authApi.login(credentials)
    token.value = res.data.token
    user.value = res.data.user
    userInfo.value = res.data
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    return res.data
  }

  async function register(data) {
    const res = await authApi.register(data)
    return res.data
  }

  async function fetchProfile() {
    const res = await authApi.profile()
    userInfo.value = res.data
    return res.data
  }

  function logout() {
    token.value = ''
    user.value = null
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    user,
    userInfo,
    isLoggedIn,
    isShipper,
    isDriver,
    isAdmin,
    login,
    register,
    fetchProfile,
    logout
  }
})
