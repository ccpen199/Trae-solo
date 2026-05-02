import { defineStore } from 'pinia'
import { login, logout, getCurrentUser, getUsers } from '@/api/auth'
import { getUnreadCount } from '@/api/notification'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    unreadCount: 0,
    pendingTodoCount: 0,
    users: []
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    isFinance: (state) => state.user?.role === 'finance',
    isTaxAdvisor: (state) => state.user?.role === 'tax_advisor',
    isEnterpriseManager: (state) => state.user?.role === 'enterprise_manager'
  },

  actions: {
    async login(username, password) {
      const res = await login(username, password)
      this.token = res.data.token
      this.user = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      
      await this.fetchNotificationCount()
      return res
    },

    async logout() {
      try {
        await logout()
      } catch (e) {
        console.error('Logout error:', e)
      }
      this.token = null
      this.user = null
      this.unreadCount = 0
      this.pendingTodoCount = 0
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    async fetchCurrentUser() {
      try {
        const userData = localStorage.getItem('user')
        if (userData) {
          this.user = JSON.parse(userData)
        }
        
        const res = await getCurrentUser()
        this.user = res.data.user
        localStorage.setItem('user', JSON.stringify(res.data.user))
        
        await this.fetchNotificationCount()
        return res
      } catch (error) {
        this.token = null
        this.user = null
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        throw error
      }
    },

    async fetchNotificationCount() {
      try {
        const res = await getUnreadCount()
        this.unreadCount = res.data.unreadCount
        this.pendingTodoCount = res.data.pendingTodoCount
      } catch (e) {
        console.error('Fetch notification count error:', e)
      }
    },

    async fetchUsers(role) {
      const params = {}
      if (role) params.role = role
      const res = await getUsers(params)
      this.users = res.data
      return res
    }
  }
})
