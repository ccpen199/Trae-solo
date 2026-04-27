import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Role } from '@/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)
  const currentRole = computed<Role | null>(() => userInfo.value?.role || null)
  const userName = computed(() => userInfo.value?.name || '')

  const isDesigner = computed(() => currentRole.value === 'designer')
  const isPatternMaker = computed(() => currentRole.value === 'pattern_maker')
  const isPurchaser = computed(() => currentRole.value === 'purchaser')
  const isFactory = computed(() => currentRole.value === 'factory')
  const isAdmin = computed(() => currentRole.value === 'admin')

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setUserInfo(user: User) {
    userInfo.value = user
    localStorage.setItem('userInfo', JSON.stringify(user))
  }

  function initFromStorage() {
    const savedToken = localStorage.getItem('token')
    const savedUserInfo = localStorage.getItem('userInfo')
    
    if (savedToken) {
      token.value = savedToken
    }
    if (savedUserInfo) {
      try {
        userInfo.value = JSON.parse(savedUserInfo)
      } catch {
        userInfo.value = null
      }
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  function getRoleName(role: Role): string {
    const roleMap: Record<Role, string> = {
      designer: '设计师',
      pattern_maker: '版师',
      purchaser: '采购',
      factory: '工厂',
      admin: '管理员',
    }
    return roleMap[role] || role
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    currentRole,
    userName,
    isDesigner,
    isPatternMaker,
    isPurchaser,
    isFactory,
    isAdmin,
    setToken,
    setUserInfo,
    initFromStorage,
    logout,
    getRoleName,
  }
})
