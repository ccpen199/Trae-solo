import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getUserInfo } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)

  const isLoggedIn = computed(() => !!token.value)
  const roleCode = computed(() => userInfo.value?.role?.code || '')
  const isAdmin = computed(() => roleCode.value === 'super_admin')
  const isSales = computed(() => roleCode.value === 'sales' || isAdmin.value)
  const isWarehouse = computed(() => roleCode.value === 'warehouse' || isAdmin.value)
  const isFinance = computed(() => roleCode.value === 'finance' || isAdmin.value)
  const isCustomerService = computed(() => roleCode.value === 'customer_service' || isAdmin.value)

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setUserInfo(info) {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  async function doLogin(loginData) {
    const res = await login(loginData)
    setToken(res.data.token)
    setUserInfo(res.data.user)
    return res
  }

  async function fetchUserInfo() {
    const res = await getUserInfo()
    setUserInfo(res.data)
    return res
  }

  async function doLogout() {
    try {
      await logout()
    } catch (e) {
      console.error('Logout error:', e)
    }
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  function initFromStorage() {
    const storedUserInfo = localStorage.getItem('userInfo')
    if (storedUserInfo) {
      try {
        userInfo.value = JSON.parse(storedUserInfo)
      } catch (e) {
        console.error('Parse userInfo error:', e)
      }
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    roleCode,
    isAdmin,
    isSales,
    isWarehouse,
    isFinance,
    isCustomerService,
    setToken,
    setUserInfo,
    doLogin,
    fetchUserInfo,
    doLogout,
    initFromStorage
  }
})
