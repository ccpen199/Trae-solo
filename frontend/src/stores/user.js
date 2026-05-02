import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => userInfo.value?.role || '')
  const roleLabel = computed(() => {
    const labels = {
      admin: '系统管理员',
      station_owner: '电站业主',
      maintenance_worker: '运维工人',
      investor: '投资人',
      equipment_vendor: '设备厂商'
    }
    return labels[role.value] || role.value
  })

  async function login(username, password) {
    const result = await api.post('/auth/login', { username, password })
    
    token.value = result.token
    userInfo.value = result.user
    
    localStorage.setItem('token', result.token)
    localStorage.setItem('userInfo', JSON.stringify(result.user))
    
    return result
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch (e) {
      console.log('Logout API error:', e)
    }
    
    token.value = ''
    userInfo.value = null
    
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  async function fetchUserInfo() {
    if (!token.value) return
    
    try {
      const result = await api.get('/auth/me')
      userInfo.value = result
      localStorage.setItem('userInfo', JSON.stringify(result))
    } catch (e) {
      console.log('Fetch user info error:', e)
    }
  }

  function hasRole(...roles) {
    if (!userInfo.value) return false
    return roles.includes(userInfo.value.role)
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    role,
    roleLabel,
    login,
    logout,
    fetchUserInfo,
    hasRole
  }
})
