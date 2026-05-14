import { defineStore } from 'pinia'
import request from '../utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || ''
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    hasPlanet: (state) => !!state.user?.planet_id,
    currentUserId: (state) => state.user?.id
  },

  actions: {
    async sendCode(phone) {
      const res = await request.post('/auth/send-code', { phone })
      return res
    },

    async register(data) {
      const res = await request.post('/auth/register', data)
      if (res.data?.token) {
        this.token = res.data.token
        localStorage.setItem('token', res.data.token)
        await this.fetchUser()
      }
      return res
    },

    async login(phone, password) {
      const res = await request.post('/auth/login', { phone, password })
      if (res.data?.token) {
        this.token = res.data.token
        localStorage.setItem('token', res.data.token)
        this.user = res.data.user
      }
      return res
    },

    async fetchUser() {
      const res = await request.get('/auth/me')
      this.user = res.data
      return res
    },

    logout() {
      this.user = null
      this.token = ''
      localStorage.removeItem('token')
    }
  }
})
