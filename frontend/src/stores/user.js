import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  const isLoggedIn = computed(() => !!token.value)
  const isProjectManager = computed(() => user.value?.role === 'project_manager')
  const isManagement = computed(() => user.value?.role === 'management')
  const isTester = computed(() => user.value?.role === 'tester')
  const isCustomer = computed(() => user.value?.role === 'customer')
  const isMember = computed(() => user.value?.role === 'member')

  const roleLabels = {
    project_manager: '项目经理',
    member: '开发成员',
    tester: '测试人员',
    customer: '客户代表',
    management: '管理层'
  }

  const roleName = computed(() => roleLabels[user.value?.role] || '未知角色')

  async function login(username, password) {
    const response = await api.post('/auth/login', { username, password })
    
    if (response.success) {
      token.value = response.data.token
      user.value = response.data.user
      localStorage.setItem('token', token.value)
      return response
    } else {
      throw new Error(response.message)
    }
  }

  async function fetchUserInfo() {
    const response = await api.get('/auth/me')
    
    if (response.success) {
      user.value = response.data
      return response
    } else {
      throw new Error(response.message)
    }
  }

  async function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
  }

  return {
    user,
    token,
    isLoggedIn,
    isProjectManager,
    isManagement,
    isTester,
    isCustomer,
    isMember,
    roleName,
    login,
    fetchUserInfo,
    logout
  }
})
