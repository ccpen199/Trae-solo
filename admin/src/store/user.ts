import { defineStore } from 'pinia'
import router from '@/router'

interface UserInfo {
  id: string
  username: string
  realName: string
  avatar: string
  role: 'admin' | 'staff'
  department: string
  permissions: string[]
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    userInfo: null as UserInfo | null
  }),

  actions: {
    async login(username: string, password: string) {
      await new Promise(r => setTimeout(r, 800))

      if (!username || !password) {
        throw new Error('请输入用户名和密码')
      }

      this.token = `mock-token-${Date.now()}`
      localStorage.setItem('admin_token', this.token)

      this.userInfo = {
        id: 'ADMIN-001',
        username,
        realName: '超级管理员',
        avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
        role: 'admin',
        department: '郑州市大数据管理局',
        permissions: ['*']
      }
    },

    async fetchUserInfo() {
      await new Promise(r => setTimeout(r, 200))
      this.userInfo = this.userInfo || {
        id: 'ADMIN-001',
        username: 'admin',
        realName: '超级管理员',
        avatar: 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
        role: 'admin',
        department: '郑州市大数据管理局',
        permissions: ['*']
      }
    },

    async logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('admin_token')
      await router.push('/login')
    }
  }
})
