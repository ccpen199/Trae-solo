import { defineStore } from 'pinia'
import { login, register, getProfile, updateProfile, updatePassword } from '@/api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('user')) || null
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isAdmin: (state) => state.userInfo?.role === 'admin'
  },

  actions: {
    async login(userData) {
      const res = await login(userData)
      if (res.success) {
        this.token = res.token
        this.userInfo = res.user
        localStorage.setItem('token', res.token)
        localStorage.setItem('user', JSON.stringify(res.user))
      }
      return res
    },

    async register(userData) {
      const res = await register(userData)
      return res
    },

    async fetchProfile() {
      const res = await getProfile()
      if (res.success) {
        this.userInfo = res.user
        localStorage.setItem('user', JSON.stringify(res.user))
      }
      return res
    },

    async updateUserProfile(data) {
      const res = await updateProfile(data)
      if (res.success) {
        this.userInfo = res.user
        localStorage.setItem('user', JSON.stringify(res.user))
      }
      return res
    },

    async changePassword(data) {
      const res = await updatePassword(data)
      return res
    },

    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }
})
