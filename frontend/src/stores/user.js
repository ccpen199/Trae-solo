import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => userInfo.value?.role || '')
  const isLeadLawyer = computed(() => role.value === 'lead_lawyer')
  const isAssistant = computed(() => role.value === 'assistant')
  const isClient = computed(() => role.value === 'client')
  const isFinance = computed(() => role.value === 'finance')
  const isLawyer = computed(() => isLeadLawyer.value || isAssistant.value)

  async function login(username, password) {
    const result = await authApi.login({ username, password })
    token.value = result.token
    userInfo.value = result.user
    
    localStorage.setItem('token', result.token)
    localStorage.setItem('user', JSON.stringify(result.user))
    
    return result
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  async function fetchUserInfo() {
    if (token.value) {
      try {
        const user = await authApi.getMe()
        userInfo.value = user
        localStorage.setItem('user', JSON.stringify(user))
      } catch (e) {
        logout()
      }
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    role,
    isLeadLawyer,
    isAssistant,
    isClient,
    isFinance,
    isLawyer,
    login,
    logout,
    fetchUserInfo
  }
})
