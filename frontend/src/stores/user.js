import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(localStorage.getItem('gov_user') || 'null'))
  const token = ref(localStorage.getItem('gov_token') || '')
  const admin = ref(JSON.parse(localStorage.getItem('admin_user') || 'null'))
  const adminToken = ref(localStorage.getItem('admin_token') || '')
  const elderMode = ref(localStorage.getItem('elder_mode') === 'true')

  const isLoggedIn = computed(() => !!token.value)
  const isAdminLoggedIn = computed(() => !!adminToken.value)

  async function login(phone, userType = 'personal') {
    const res = await authApi.login({ phone, userType, authType: 'yuesheng_code' })
    if (res.success) {
      token.value = res.token
      user.value = res.user
      localStorage.setItem('gov_token', res.token)
      localStorage.setItem('gov_user', JSON.stringify(res.user))
    }
    return res
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('gov_token')
    localStorage.removeItem('gov_user')
  }

  async function adminLogin(username, password) {
    const res = await authApi.adminLogin({ username, password })
    if (res.success) {
      adminToken.value = res.token
      admin.value = res.admin
      localStorage.setItem('admin_token', res.token)
      localStorage.setItem('admin_user', JSON.stringify(res.admin))
    }
    return res
  }

  function adminLogout() {
    adminToken.value = ''
    admin.value = null
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  function toggleElderMode() {
    elderMode.value = !elderMode.value
    localStorage.setItem('elder_mode', elderMode.value.toString())
  }

  return {
    user,
    token,
    admin,
    adminToken,
    elderMode,
    isLoggedIn,
    isAdminLoggedIn,
    login,
    logout,
    adminLogin,
    adminLogout,
    toggleElderMode
  }
})
