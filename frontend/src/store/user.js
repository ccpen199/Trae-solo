import { defineStore } from 'pinia'
import { login, logout, getCurrentUser } from '@/api/auth'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    permissions: []
  }),

  getters: {
    isLoggedIn: (state) => !!state.token || import.meta.env.DEV,
    isAdmin: (state) => {
      if (!state.userInfo) return false
      const adminRoles = ['super_admin', 'province_admin', 'city_admin', 'county_admin', 'approver', 'staff']
      return state.userInfo.roles?.some(r => adminRoles.includes(r.code))
    },
    isAgent: (state) => {
      if (!state.userInfo) return false
      return state.userInfo.roles?.some(r => r.code === 'agent')
    },
    userLevel: (state) => state.userInfo?.region_level || 'province',
    userRegionCode: (state) => state.userInfo?.region_code || '',
    getDefaultRoute: (state) => () => {
      if (!state.userInfo) return '/'
      const roles = state.userInfo.roles || []
      if (roles.some(r => ['super_admin', 'province_admin', 'city_admin', 'county_admin', 'approver', 'staff'].includes(r.code))) {
        return '/admin'
      }
      if (roles.some(r => r.code === 'agent')) {
        return '/chat'
      }
      return '/'
    }
  },

  actions: {
    async login(credentials) {
      const res = await login(credentials)
      if (res.code === 200) {
        this.token = res.data.token
        this.userInfo = res.data.user
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('userInfo', JSON.stringify(res.data.user))
        ElMessage.success('登录成功')
        return true
      }
      const err = new Error(res.message || '登录失败')
      err.code = res.code
      throw err
    },

    async logout() {
      try {
        await logout()
      } catch (e) {}
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      ElMessage.success('已退出登录')
    },

    async fetchCurrentUser() {
      if (!this.token && !import.meta.env.DEV) return null
      try {
        const res = await getCurrentUser()
        if (res.code === 200) {
          this.userInfo = res.data
          localStorage.setItem('userInfo', JSON.stringify(res.data))
          return res.data
        } else if (res.code === 401) {
          this.token = ''
          this.userInfo = null
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
        }
      } catch (e) {
        this.token = ''
        this.userInfo = null
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
      }
      return null
    }
  }
})
