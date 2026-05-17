import { defineStore } from 'pinia'
import request from '@/utils/request'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || ''
  }),

  getters: {
    isLoggedIn: (state) => !!state.token
  },

  actions: {
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },

    setUser(user) {
      this.user = user
    },

    async loginWithCode(phone, code) {
      const res = await request.post('/auth/login-code', { phone, code })
      this.setToken(res.data.token)
      this.setUser(res.data.user)
      return res
    },

    async loginWithPassword(phone, password) {
      const res = await request.post('/auth/login-password', { phone, password })
      this.setToken(res.data.token)
      this.setUser(res.data.user)
      return res
    },

    async thirdPartyLogin(thirdPartyId, thirdPartyType, nickname, avatar) {
      const res = await request.post('/auth/third-party', { thirdPartyId, thirdPartyType, nickname, avatar })
      this.setToken(res.data.token)
      this.setUser(res.data.user)
      return res
    },

    async register(phone, password, code, nickname) {
      const res = await request.post('/auth/register', { phone, password, code, nickname })
      this.setToken(res.data.token)
      this.setUser(res.data.user)
      return res
    },

    async sendCode(phone) {
      return await request.post('/auth/send-code', { phone })
    },

    async fetchUserInfo() {
      if (!this.token) return
      try {
        const res = await request.get('/auth/me')
        this.setUser(res.data)
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    },

    async updateProfile(data) {
      const res = await request.put('/auth/profile', data)
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
