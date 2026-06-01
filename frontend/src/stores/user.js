import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || '{}')
  }),
  getters: {
    isLoggedIn: (state) => !!state.token && !!state.user?.id,
    userRole: (state) => state.user?.role || '',
    userName: (state) => state.user?.nickname || state.user?.username || '',
    isAdmin: (state) => state.user?.role === 'admin',
    isModerator: (state) => state.user?.role === 'moderator' || state.user?.role === 'admin',
    isCS: (state) => state.user?.role === 'cs' || state.user?.role === 'admin',
    canViewReports: (state) => ['moderator', 'admin'].includes(state.user?.role),
    canViewStatistics: (state) => ['moderator', 'admin', 'cs'].includes(state.user?.role),
    canManageUsers: (state) => state.user?.role === 'admin',
    canViewAudit: (state) => state.user?.role === 'admin'
  },
  actions: {
    login(token, user) {
      this.token = token
      this.user = user
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    },
    logout() {
      this.token = ''
      this.user = {}
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    syncFromStorage() {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr)
          this.token = token
          this.user = user
        } catch (e) {
          this.logout()
        }
      } else {
        this.logout()
      }
    },
    updateUser(user) {
      this.user = { ...this.user, ...user }
      localStorage.setItem('user', JSON.stringify(this.user))
    }
  }
})
