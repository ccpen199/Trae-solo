import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, logout, getUserInfo } from '@/api/auth'

export interface UserInfo {
  id: number
  username: string
  nickname: string
  phone: string
  avatar: string
  roleType: number
  roleName: string
  merchantId: number
  storeId: number
  storeName: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const userInfo = ref<UserInfo | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isMerchant = computed(() => userInfo.value?.roleType === 1)
  const isClerk = computed(() => userInfo.value?.roleType === 2)
  const isRider = computed(() => userInfo.value?.roleType === 3)
  const isAdmin = computed(() => userInfo.value?.roleType === 5)

  async function handleLogin(username: string, password: string) {
    const res = await login({ username, password })
    if (res.code === 200) {
      token.value = res.data.token
      localStorage.setItem('token', res.data.token)
      await fetchUserInfo()
    }
    return res
  }

  async function fetchUserInfo() {
    if (!token.value) return null
    try {
      const res = await getUserInfo()
      if (res.code === 200) {
        userInfo.value = res.data
      }
      return res
    } catch {
      clearAuth()
      return null
    }
  }

  async function handleLogout() {
    if (token.value) {
      try {
        await logout()
      } catch {
        // ignore
      }
    }
    clearAuth()
  }

  function clearAuth() {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('token')
  }

  function hasPermission(permission: string): boolean {
    if (isAdmin.value) return true
    const rolePermissions: Record<number, string[]> = {
      1: ['order:view', 'order:receive', 'order:print', 'aftersale:view', 'aftersale:process', 
          'platform:auth', 'goods:manage', 'statistics:view', 'audit:view'],
      2: ['order:view', 'order:receive', 'order:print', 'aftersale:view'],
      3: ['order:view', 'order:deliver'],
      4: ['statistics:view']
    }
    const roleType = userInfo.value?.roleType
    if (!roleType) return false
    return rolePermissions[roleType]?.includes(permission) ?? false
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isMerchant,
    isClerk,
    isRider,
    isAdmin,
    handleLogin,
    fetchUserInfo,
    handleLogout,
    clearAuth,
    hasPermission
  }
})
