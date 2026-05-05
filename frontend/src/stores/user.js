import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, getUserInfo, logout as apiLogout } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(null)
  const permissions = ref([])
  const resources = ref([])
  const operations = ref([])

  const isLoggedIn = computed(() => !!token.value)
  const roles = computed(() => userInfo.value?.roles || [])

  async function doLogin(loginForm) {
    try {
      const result = await login(loginForm)
      token.value = result.token
      userInfo.value = result.user
      permissions.value = result.permissions || []
      resources.value = result.resources || []
      operations.value = result.operations || []
      
      localStorage.setItem('token', result.token)
      localStorage.setItem('userInfo', JSON.stringify(result.user))
      localStorage.setItem('permissions', JSON.stringify(result.permissions || []))
      
      return result
    } catch (err) {
      throw err
    }
  }

  async function fetchUserInfo() {
    try {
      const result = await getUserInfo()
      userInfo.value = result.user
      permissions.value = result.permissions || []
      resources.value = result.resources || []
      operations.value = result.operations || []
      
      localStorage.setItem('userInfo', JSON.stringify(result.user))
      localStorage.setItem('permissions', JSON.stringify(result.permissions || []))
      
      return result
    } catch (err) {
      throw err
    }
  }

  async function doLogout() {
    try {
      await apiLogout()
    } finally {
      logout()
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    permissions.value = []
    resources.value = []
    operations.value = []
    
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('permissions')
  }

  function initFromStorage() {
    const storedUserInfo = localStorage.getItem('userInfo')
    const storedPermissions = localStorage.getItem('permissions')
    
    if (storedUserInfo) {
      userInfo.value = JSON.parse(storedUserInfo)
    }
    if (storedPermissions) {
      permissions.value = JSON.parse(storedPermissions)
    }
  }

  function hasPermission(permissionCode) {
    return permissions.value.includes(permissionCode)
  }

  function hasOperation(operationCode) {
    return operations.value.includes(operationCode)
  }

  return {
    token,
    userInfo,
    permissions,
    resources,
    operations,
    isLoggedIn,
    roles,
    doLogin,
    fetchUserInfo,
    doLogout,
    logout,
    initFromStorage,
    hasPermission,
    hasOperation
  }
})
