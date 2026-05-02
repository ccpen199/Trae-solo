import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)
  const role = ref('')

  const isLoggedIn = computed(() => !!token.value)

  async function login(loginData) {
    const res = await authApi.login(loginData)
    token.value = res.token
    userInfo.value = res.user
    role.value = res.user.role
    localStorage.setItem('token', res.token)
    return res
  }

  async function logout() {
    await authApi.logout()
    token.value = ''
    userInfo.value = null
    role.value = ''
    localStorage.removeItem('token')
  }

  async function fetchProfile() {
    if (!token.value) return
    const res = await authApi.profile()
    userInfo.value = res.user
    role.value = res.user.role
  }

  return {
    token,
    userInfo,
    role,
    isLoggedIn,
    login,
    logout,
    fetchProfile
  }
})
