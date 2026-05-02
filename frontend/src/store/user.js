import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const permissions = ref(null)
  const todoCount = ref(0)

  const isLoggedIn = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role || '')
  const userName = computed(() => userInfo.value?.name || '')

  const login = async (username, password) => {
    const result = await api.post('/auth/login', { username, password })
    token.value = result.token
    userInfo.value = result.user
    localStorage.setItem('token', result.token)
    localStorage.setItem('user', JSON.stringify(result.user))
    return result
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    permissions.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const fetchPermissions = async () => {
    const result = await api.get('/auth/permissions')
    permissions.value = result.permissions
    return result.permissions
  }

  const fetchTodoCount = async () => {
    try {
      const result = await api.get('/orders/todos/count')
      todoCount.value = result.count
    } catch (error) {
      console.error('获取待办数量失败:', error)
    }
  }

  const canAccessPage = (pageName) => {
    if (!permissions.value) return false
    return permissions.value.visiblePages.includes(pageName)
  }

  const canPerformAction = (action) => {
    if (!permissions.value) return false
    return permissions.value.allowedActions.includes(action)
  }

  return {
    token,
    userInfo,
    permissions,
    todoCount,
    isLoggedIn,
    userRole,
    userName,
    login,
    logout,
    fetchPermissions,
    fetchTodoCount,
    canAccessPage,
    canPerformAction
  }
})
