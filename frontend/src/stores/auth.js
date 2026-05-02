import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api'
import { ElMessage } from 'element-plus'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role || '')
  const userName = computed(() => user.value?.name || '')

  async function login(username, password) {
    try {
      const result = await authApi.login({ username, password })
      
      token.value = result.token
      user.value = result.user
      
      localStorage.setItem('token', result.token)
      localStorage.setItem('user', JSON.stringify(result.user))
      
      ElMessage.success('登录成功')
      return true
    } catch (error) {
      ElMessage.error(error.response?.data?.error || '登录失败')
      return false
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    ElMessage.success('已退出登录')
  }

  async function refreshUserInfo() {
    try {
      const result = await authApi.getMe()
      user.value = result.user
      localStorage.setItem('user', JSON.stringify(result.user))
    } catch (error) {
      console.error('刷新用户信息失败:', error)
    }
  }

  function hasPermission(permission) {
    const rolePermissions = {
      dispatcher: ['schedule:create', 'schedule:edit', 'schedule:submit', 'schedule:withdraw', 'route:view', 'station:view', 'vehicle:view', 'driver:view', 'alarm:view', 'statistics:view'],
      driver: ['schedule:view', 'task:execute', 'track:submit', 'arrival:confirm'],
      passenger: ['route:view', 'schedule:view', 'arrival:query'],
      operator: ['schedule:review', 'schedule:approve', 'schedule:reject', 'statistics:view', 'report:export'],
      maintenance: ['vehicle:view', 'alarm:view', 'maintenance:record']
    }

    const permissions = rolePermissions[userRole.value] || []
    return permissions.includes(permission)
  }

  return {
    token,
    user,
    isAuthenticated,
    userRole,
    userName,
    login,
    logout,
    refreshUserInfo,
    hasPermission
  }
})
