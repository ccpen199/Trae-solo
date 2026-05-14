import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'admin',
    username: (state) => state.user?.nickname || state.user?.username || ''
  },

  actions: {
    async login(username, password) {
      const res = await request.post('/auth/login', { username, password })
      this.token = res.data?.token || ''
      this.user = res.data?.user || null
      
      if (this.token) {
        localStorage.setItem('token', this.token)
      }
      if (this.user) {
        localStorage.setItem('user', JSON.stringify(this.user))
      }
      
      return res.data
    },

    async register(username, password, nickname) {
      const res = await request.post('/auth/register', { username, password, nickname })
      this.token = res.data?.token || ''
      this.user = res.data?.user || null
      
      if (this.token) {
        localStorage.setItem('token', this.token)
      }
      if (this.user) {
        localStorage.setItem('user', JSON.stringify(this.user))
      }
      
      return res.data
    },

    async fetchProfile() {
      try {
        const res = await request.get('/auth/me')
        this.user = res.data
        if (this.user) {
          localStorage.setItem('user', JSON.stringify(this.user))
        }
        return this.user
      } catch (e) {
        this.logout()
        throw e
      }
    },

    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
