import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  
  const role = computed(() => userInfo.value?.role || '')
  const roleName = computed(() => {
    const names = {
      customer: '客户',
      finance: '财务会计',
      tax: '税务接口人',
      sales: '销售运营'
    }
    return names[role.value] || role.value
  })

  const isCustomer = computed(() => role.value === 'customer')
  const isFinance = computed(() => role.value === 'finance')
  const isTax = computed(() => role.value === 'tax')
  const isSales = computed(() => role.value === 'sales')
  const isInternal = computed(() => isFinance.value || isTax.value || isSales.value)

  async function login(username, password) {
    const res = await api.post('/auth/login', { username, password })
    token.value = res.token
    userInfo.value = res.user
    
    localStorage.setItem('token', res.token)
    localStorage.setItem('userInfo', JSON.stringify(res.user))
    
    return res
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      console.log('Logout API error:', e)
    }
    
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  async function getCurrentUser() {
    if (!token.value) return null
    
    try {
      const res = await api.get('/auth/me')
      userInfo.value = res.user
      localStorage.setItem('userInfo', JSON.stringify(res.user))
      return res
    } catch (e) {
      token.value = ''
      userInfo.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      throw e
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    role,
    roleName,
    isCustomer,
    isFinance,
    isTax,
    isSales,
    isInternal,
    login,
    logout,
    getCurrentUser
  }
})
