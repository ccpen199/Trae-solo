import { defineStore } from 'pinia'
import api from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    permissions: []
  }),
  
  getters: {
    isLoggedIn: (state) => !!state.token,
    roleName: (state) => state.user?.role?.name || '',
    roleDisplayName: (state) => state.user?.role?.displayName || '',
    hasPermission: (state) => (permission) => {
      if (!state.user?.role?.permissions) return false
      if (state.user.role.name === 'admin') return true
      return state.user.role.permissions.includes(permission)
    }
  },
  
  actions: {
    async login(username, password) {
      const result = await api.auth.login({ username, password })
      const { token, user } = result.data
      
      this.token = token
      this.user = user
      this.permissions = user.role?.permissions || []
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      return result
    },
    
    async logout() {
      try {
        await api.auth.logout()
      } catch (e) {
        console.log('Logout API failed, but still clear local data')
      }
      
      this.token = ''
      this.user = null
      this.permissions = []
      
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    
    async getCurrentUser() {
      const result = await api.auth.getCurrentUser()
      const user = result.data
      
      this.user = user
      this.permissions = user.role?.permissions || []
      
      localStorage.setItem('user', JSON.stringify(user))
      
      return result
    }
  }
})
