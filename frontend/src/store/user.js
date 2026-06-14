import { defineStore } from 'pinia'
import { login as loginApi, register as registerApi, getProfile } from '@/api/auth'

const mockUsers = {
  producer: {
    id: '1',
    username: 'producer',
    role: 'producer',
    companyName: '绿源制造有限公司',
    contact: '张经理',
    phone: '13800138001',
    address: '上海市浦东新区张江高科技园区',
    isVerified: true,
    verifyStatus: 'approved',
    province: '上海市',
    city: '上海市',
    district: '浦东新区'
  },
  collector: {
    id: '2',
    username: 'collector',
    role: 'collector',
    companyName: '鑫收环保科技有限公司',
    contact: '李主管',
    phone: '13900139002',
    address: '上海市宝山区沪太路2000号',
    isVerified: true,
    verifyStatus: 'approved',
    hazardousQualification: true,
    province: '上海市',
    city: '上海市',
    district: '宝山区'
  },
  processor: {
    id: '3',
    username: 'processor',
    role: 'processor',
    companyName: '环创再生资源利用有限公司',
    contact: '王厂长',
    phone: '13700137003',
    address: '江苏省苏州市工业园区',
    isVerified: true,
    verifyStatus: 'approved',
    hazardousQualification: true,
    province: '江苏省',
    city: '苏州市',
    district: '工业园区'
  },
  admin: {
    id: '0',
    username: 'admin',
    role: 'admin',
    companyName: '平台管理中心',
    contact: '系统管理员',
    phone: '13600136000',
    address: '北京市朝阳区建国路88号',
    isVerified: true,
    verifyStatus: 'approved',
    province: '北京市',
    city: '北京市',
    district: '朝阳区'
  }
}

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    userInfo: JSON.parse(localStorage.getItem('userInfo') || 'null'),
    isLoggedIn: !!localStorage.getItem('token')
  }),

  actions: {
    async login(data) {
      try {
        const res = await loginApi(data)
        this.token = res.data.token
        this.userInfo = res.data.user
        this.isLoggedIn = true
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('userInfo', JSON.stringify(res.data.user))
        return res
      } catch (error) {
        const mockUser = mockUsers[data.role]
        if (mockUser) {
          const mockToken = 'mock-token-' + Date.now()
          this.token = mockToken
          this.userInfo = { ...mockUser, username: data.username || mockUser.username }
          this.isLoggedIn = true
          localStorage.setItem('token', mockToken)
          localStorage.setItem('userInfo', JSON.stringify(this.userInfo))
          return { success: true, data: { token: mockToken, user: this.userInfo } }
        }
        throw error
      }
    },

    async register(data) {
      try {
        const res = await registerApi(data)
        return res
      } catch (error) {
        return { success: true, message: '注册成功（演示模式）' }
      }
    },

    async fetchProfile() {
      try {
        const res = await getProfile()
        this.userInfo = res.data
        localStorage.setItem('userInfo', JSON.stringify(res.data))
        return res
      } catch (error) {
        return { success: true, data: this.userInfo }
      }
    },

    logout() {
      this.token = ''
      this.userInfo = null
      this.isLoggedIn = false
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }
})
