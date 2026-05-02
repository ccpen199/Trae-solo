import { defineStore } from 'pinia'
import axios from 'axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: localStorage.getItem('token') || '',
    rolePermissions: {}
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.userInfo?.role || '',
    hasPermission: (state) => (permission) => {
      const role = state.userInfo?.role
      return state.rolePermissions[role]?.includes(permission) || false
    },
    canAccessTask: (state) => (task) => {
      const role = state.userInfo?.role
      if (!role || !task) return false
      if (role === 'shipper') return task.shipper?.userId === state.userInfo.userId
      if (role === 'driver') return task.driver?.userId === state.userInfo.userId
      if (role === 'carrier') return task.carrier?.userId === state.userInfo.userId
      if (role === 'quality_control') return true
      return false
    }
  },
  
  actions: {
    async login(username, password) {
      try {
        const response = await axios.post('/api/users/login', { username, password })
        const apiResponse = response.data
        
        if (apiResponse.success) {
          this.token = apiResponse.data.token
          this.userInfo = apiResponse.data.user
          localStorage.setItem('token', this.token)
          this.loadRolePermissions()
          return { success: true, message: apiResponse.message }
        } else {
          return { success: false, message: apiResponse.message }
        }
      } catch (error) {
        const message = error.response?.data?.message || error.message || '登录失败'
        return { success: false, message }
      }
    },
    
    async register(userData) {
      try {
        const response = await axios.post('/api/users/register', userData)
        const apiResponse = response.data
        return { 
          success: apiResponse.success, 
          message: apiResponse.message,
          data: apiResponse.data
        }
      } catch (error) {
        const message = error.response?.data?.message || error.message || '注册失败'
        return { success: false, message }
      }
    },
    
    logout() {
      this.userInfo = null
      this.token = ''
      localStorage.removeItem('token')
    },
    
    async fetchUserInfo() {
      if (!this.token) return
      try {
        const response = await axios.get('/api/users/info')
        const apiResponse = response.data
        if (apiResponse.success) {
          this.userInfo = apiResponse.data
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error)
      }
    },
    
    loadRolePermissions() {
      this.rolePermissions = {
        shipper: ['task:create', 'task:view', 'task:list', 'temperature:view', 'alarm:view', 'inspection:create', 'report:view'],
        carrier: ['task:assign', 'task:view', 'task:list', 'temperature:view', 'alarm:view', 'report:view'],
        driver: ['task:view', 'task:start', 'task:complete', 'temperature:view', 'alarm:handle', 'inspection:create', 'report:view'],
        quality_control: ['task:view', 'task:list', 'temperature:view', 'alarm:view', 'report:view', 'quality:view']
      }
    }
  }
})
