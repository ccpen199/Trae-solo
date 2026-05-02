import { defineStore } from 'pinia'
import { login, logout, getUserInfo } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { resetRouter } from '@/router'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: getToken(),
    name: '',
    realName: '',
    avatar: '',
    orgId: null,
    orgName: '',
    orgPath: '',
    dataScope: '',
    roles: [],
    permissions: [],
    dynamicRoutes: []
  }),

  getters: {
    hasPermission: (state) => (permission) => {
      return state.permissions.includes(permission)
    },
    isAdmin: (state) => {
      return state.roles.includes('SUPER_ADMIN') || state.dataScope === 'ALL'
    }
  },

  actions: {
    async login(userInfo) {
      const { username, password } = userInfo
      try {
        const res = await login({ username: username.trim(), password })
        const token = res.data?.token || res.data
        this.token = token
        setToken(token)
        return res
      } catch (error) {
        throw error
      }
    },

    async getUserInfo() {
      try {
        const res = await getUserInfo()
        const user = res.data
        this.name = user.username || ''
        this.realName = user.realName || ''
        this.avatar = user.avatar || ''
        this.orgId = user.orgId
        this.orgName = user.orgName || ''
        this.orgPath = user.orgPath || ''
        this.dataScope = user.dataScope || ''
        this.roles = user.roles || []
        this.permissions = user.permissions || []
        return user
      } catch (error) {
        throw error
      }
    },

    async logout() {
      try {
        await logout()
      } catch (error) {
        console.error('Logout API error:', error)
      } finally {
        this.token = ''
        this.name = ''
        this.realName = ''
        this.avatar = ''
        this.orgId = null
        this.orgName = ''
        this.orgPath = ''
        this.dataScope = ''
        this.roles = []
        this.permissions = []
        this.dynamicRoutes = []
        removeToken()
        resetRouter()
      }
    },

    resetToken() {
      this.token = ''
      removeToken()
    }
  }
})
