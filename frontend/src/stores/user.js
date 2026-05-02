import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const permissions = ref(null)
  const token = ref(localStorage.getItem('token') || '')
  const userUuid = ref(localStorage.getItem('user_uuid') || '')

  const isLoggedIn = computed(() => !!user.value)
  const roleCode = computed(() => user.value?.role_code || '')
  const roleName = computed(() => user.value?.role_name || '')
  const visibleModules = computed(() => permissions.value?.visibleModules || [])
  const allowedActions = computed(() => permissions.value?.allowedActions || [])

  const isPlayer = computed(() => roleCode.value === 'player')
  const isPlanner = computed(() => roleCode.value === 'planner')
  const isOperator = computed(() => roleCode.value === 'operator')
  const isCustomerService = computed(() => roleCode.value === 'customer_service')

  async function login(username, password) {
    const result = await authApi.login(username, password)
    user.value = result.data.user
    permissions.value = result.data.permissions
    userUuid.value = result.data.user.user_uuid
    
    localStorage.setItem('user_uuid', result.data.user.user_uuid)
    
    return result
  }

  async function getCurrentUser() {
    if (!userUuid.value) {
      return null
    }
    
    try {
      const result = await authApi.getCurrentUser()
      user.value = result.data.user
      permissions.value = result.data.permissions
      return result
    } catch (error) {
      logout()
      return null
    }
  }

  function logout() {
    user.value = null
    permissions.value = null
    token.value = ''
    userUuid.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('user_uuid')
  }

  function hasPermission(module, action) {
    if (!visibleModules.value.includes(module)) {
      return false
    }
    if (!allowedActions.value.includes(action) && !allowedActions.value.includes('*')) {
      return false
    }
    return true
  }

  return {
    user,
    permissions,
    token,
    userUuid,
    isLoggedIn,
    roleCode,
    roleName,
    visibleModules,
    allowedActions,
    isPlayer,
    isPlanner,
    isOperator,
    isCustomerService,
    login,
    getCurrentUser,
    logout,
    hasPermission
  }
})
