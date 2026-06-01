import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => userInfo.value?.role === 'admin' || userInfo.value?.role === 'hr')
  const isInstructor = computed(() => userInfo.value?.role === 'instructor')

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password })
    token.value = res.token
    userInfo.value = res.user
    localStorage.setItem('token', res.token)
    localStorage.setItem('userInfo', JSON.stringify(res.user))
    api.defaults.headers.common['Authorization'] = `Bearer ${res.token}`
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    delete api.defaults.headers.common['Authorization']
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    isInstructor,
    login,
    logout
  }
})
