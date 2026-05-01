import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export interface User {
  id: string
  phone: string
  nickname: string | null
  avatar: string | null
  role: string
  distributorId: string | null
  referralCode: string | null
  distributorStatus: string | null
  joinDate: string | null
  virtualAccount?: {
    totalBalance: number
    frozenBalance: number
    availableBalance: number
    totalEarnings: number
    totalWithdrawn: number
  }
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isLoggedIn = computed(() => !!token.value)

  const isAdmin = computed(() => user.value?.role === 'ADMIN')
  const isFinance = computed(() => user.value?.role === 'FINANCE' || user.value?.role === 'ADMIN')
  const isOperator = computed(() => user.value?.role === 'OPERATOR' || user.value?.role === 'ADMIN')
  const isDistributor = computed(() => user.value?.role === 'DISTRIBUTOR')

  async function login(phone: string, password: string) {
    const result = await api.post('/auth/login', { phone, password })
    token.value = result.token
    user.value = result.user
    localStorage.setItem('token', result.token)
    localStorage.setItem('user', JSON.stringify(result.user))
    return result
  }

  async function register(phone: string, password: string, referralCode?: string) {
    const result = await api.post('/auth/register', { phone, password, referralCode })
    return result
  }

  async function applyDistributor() {
    const result = await api.post('/auth/apply-distributor')
    if (result.success) {
      user.value = result.user
      localStorage.setItem('user', JSON.stringify(result.user))
    }
    return result
  }

  async function fetchProfile() {
    if (!token.value) return
    try {
      const result = await api.get('/auth/profile')
      user.value = result.user
      localStorage.setItem('user', JSON.stringify(result.user))
    } catch (e) {
      console.error('获取用户信息失败', e)
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function restoreFromStorage() {
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (e) {
        console.error('解析用户信息失败', e)
      }
    }
    token.value = savedToken
  }

  return {
    user,
    token,
    isLoggedIn,
    isAdmin,
    isFinance,
    isOperator,
    isDistributor,
    login,
    register,
    applyDistributor,
    fetchProfile,
    logout,
    restoreFromStorage,
  }
})
