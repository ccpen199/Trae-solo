import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import router from '@/router'
import * as api from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => user.value?.role || '')
  const userName = computed(() => user.value?.name || '')

  async function login(username, password) {
    const res = await api.login(username, password)
    token.value = res.access_token
    user.value = res.user
    localStorage.setItem('token', res.access_token)
    localStorage.setItem('user', JSON.stringify(res.user))
    return res
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  async function fetchCurrentUser() {
    if (!token.value) return
    try {
      const res = await api.getCurrentUser()
      user.value = res
      localStorage.setItem('user', JSON.stringify(res))
    } catch (e) {
      logout()
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    role,
    userName,
    login,
    logout,
    fetchCurrentUser
  }
})
