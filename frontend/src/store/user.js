import { defineStore } from 'pinia'
import api from '../utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || ''
  }),

  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },

    setUser(user) {
      this.user = user
    },

    async login(phone, password) {
      const res = await api.post('/auth/login', { phone, password })
      this.setToken(res.data.token)
      this.setUser(res.data.user)
      return res
    },

    async register(phone, code, password, name) {
      const res = await api.post('/auth/register', { phone, code, password, name })
      this.setToken(res.data.token)
      this.setUser(res.data.user)
      return res
    },

    async sendCode(phone) {
      return api.post('/auth/send-code', { phone })
    },

    async getProfile() {
      const res = await api.get('/auth/profile')
      this.setUser(res.data)
      return res
    },

    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
    }
  }
})