import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getProfile } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

  const isLoggedIn = computed(() => !!token.value)
  const roleCode = computed(() => userInfo.value?.role_code || '')
  const roleName = computed(() => userInfo.value?.role_name || '')
  const userName = computed(() => userInfo.value?.real_name || userInfo.value?.username || '')

  async function handleLogin(loginData) {
    const res = await login(loginData)
    token.value = res.token
    userInfo.value = res.user
    localStorage.setItem('token', res.token)
    localStorage.setItem('userInfo', JSON.stringify(res.user))
    return res
  }

  async function handleLogout() {
    try {
      await logout()
    } catch (e) {
      console.error('Logout API error:', e)
    } finally {
      token.value = ''
      userInfo.value = {}
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }

  async function fetchUserInfo() {
    const res = await getProfile()
    userInfo.value = res
    localStorage.setItem('userInfo', JSON.stringify(res))
    return res
  }

  function hasPermission(permission) {
    if (roleCode.value === 'admin') return true
    const permissions = userInfo.value?.permissions?.split(',') || []
    return permissions.includes(permission) || permissions.includes('all')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    roleCode,
    roleName,
    userName,
    handleLogin,
    handleLogout,
    fetchUserInfo,
    hasPermission
  }
})
