import { defineStore } from 'pinia'
import { login, logout, getCurrentUser } from '@/api/auth'
import router from '@/router'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    roles: []
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    isSystemAdmin: (state) => state.userInfo?.role?.code === 'SYSTEM_ADMIN',
    isTeachingAdmin: (state) => 
      state.userInfo?.role?.code === 'TEACHING_ADMIN' || 
      state.userInfo?.role?.code === 'SYSTEM_ADMIN',
    isTeacherOrAdmin: (state) => 
      ['SYSTEM_ADMIN', 'TEACHING_ADMIN', 'TEACHER'].includes(state.userInfo?.role?.code),
    isStudent: (state) => state.userInfo?.role?.code === 'STUDENT',
    userName: (state) => state.userInfo?.name || '',
    userRole: (state) => state.userInfo?.role?.name || ''
  },

  actions: {
    async login(loginForm) {
      try {
        const res = await login(loginForm)
        this.token = res.data.token
        this.userInfo = res.data.user
        
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('userInfo', JSON.stringify(res.data.user))
        
        return res
      } catch (error) {
        throw error
      }
    },

    async getCurrentUserInfo() {
      try {
        const res = await getCurrentUser()
        this.userInfo = res.data
        localStorage.setItem('userInfo', JSON.stringify(res.data))
        return res
      } catch (error) {
        this.logout()
        throw error
      }
    },

    async logout() {
      try {
        await logout()
      } catch (error) {
        console.error('登出API调用失败:', error)
      } finally {
        this.token = ''
        this.userInfo = null
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        router.push('/login')
      }
    },

    hasPermission(permission) {
      const rolePermissions = {
        'SYSTEM_ADMIN': [
          'dashboard',
          'user:list', 'user:create', 'user:update', 'user:delete',
          'department:list', 'department:create', 'department:update', 'department:delete',
          'class:list', 'class:create', 'class:update', 'class:delete',
          'student:list', 'student:create', 'student:update', 'student:delete',
          'course:list', 'course:create', 'course:update', 'course:delete',
          'grade:list', 'grade:create', 'grade:update', 'grade:delete', 'grade:statistics'
        ],
        'TEACHING_ADMIN': [
          'dashboard',
          'user:list', 'user:update',
          'department:list', 'department:create', 'department:update',
          'class:list', 'class:create', 'class:update',
          'student:list', 'student:create', 'student:update',
          'course:list', 'course:create', 'course:update',
          'grade:list', 'grade:create', 'grade:update', 'grade:delete', 'grade:statistics'
        ],
        'TEACHER': [
          'dashboard',
          'course:list',
          'grade:list', 'grade:create', 'grade:update', 'grade:statistics'
        ],
        'STUDENT': [
          'dashboard',
          'grade:my'
        ]
      }

      const userRole = this.userInfo?.role?.code
      if (!userRole) return false

      const permissions = rolePermissions[userRole] || []
      return permissions.includes(permission)
    }
  }
})
