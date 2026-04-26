import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { Role } from '@/types'
import type { User, LoginResult } from '@/types'

const mockUsers: Record<string, { user: User; token: string; password: string }> = {
  buyer: {
    user: {
      id: 'buyer-001',
      username: 'buyer001',
      realName: '张三采购',
      phone: '13800138001',
      email: 'buyer@example.com',
      role: Role.BUYER,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    token: 'mock-token-buyer-001',
    password: '123456',
  },
  farmer: {
    user: {
      id: 'farmer-001',
      username: 'farmer001',
      realName: '李四农户',
      phone: '13800138002',
      email: 'farmer@example.com',
      role: Role.FARMER,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    token: 'mock-token-farmer-001',
    password: '123456',
  },
  operator: {
    user: {
      id: 'operator-001',
      username: 'operator001',
      realName: '王五运营',
      phone: '13800138003',
      email: 'operator@example.com',
      role: Role.OPERATOR,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    token: 'mock-token-operator-001',
    password: '123456',
  },
  finance: {
    user: {
      id: 'finance-001',
      username: 'finance001',
      realName: '赵六财务',
      phone: '13800138004',
      email: 'finance@example.com',
      role: Role.FINANCE,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    token: 'mock-token-finance-001',
    password: '123456',
  },
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => userInfo.value?.role)
  const isBuyer = computed(() => userInfo.value?.role === Role.BUYER)
  const isFarmer = computed(() => userInfo.value?.role === Role.FARMER)
  const isOperator = computed(() => userInfo.value?.role === Role.OPERATOR)
  const isFinance = computed(() => userInfo.value?.role === Role.FINANCE)
  const isStorage = computed(() => userInfo.value?.role === Role.STORAGE)

  async function login(username: string, password: string): Promise<LoginResult> {
    if (password !== '123456') {
      throw new Error('密码错误，演示密码为 123456')
    }

    let mockUser = mockUsers[username.toLowerCase().replace(/[0-9]/g, '')]
    
    if (!mockUser) {
      mockUser = mockUsers['buyer']
    }

    token.value = mockUser.token
    userInfo.value = mockUser.user
    localStorage.setItem('token', mockUser.token)
    localStorage.setItem('userInfo', JSON.stringify(mockUser.user))

    return {
      access_token: mockUser.token,
      user: mockUser.user,
    }
  }

  async function register(data: {
    username: string
    password: string
    realName: string
    phone: string
    email?: string
    role: Role
  }): Promise<User> {
    return {
      id: `user-${Date.now()}`,
      username: data.username,
      realName: data.realName,
      phone: data.phone,
      email: data.email,
      role: data.role,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  async function fetchUserInfo(): Promise<User> {
    if (userInfo.value) {
      return userInfo.value
    }
    throw new Error('用户未登录')
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  function initFromStorage() {
    const storedToken = localStorage.getItem('token')
    const storedUserInfo = localStorage.getItem('userInfo')
    
    if (storedToken) {
      token.value = storedToken
    }
    
    if (storedUserInfo) {
      try {
        userInfo.value = JSON.parse(storedUserInfo)
      } catch {
        userInfo.value = null
      }
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    role,
    isBuyer,
    isFarmer,
    isOperator,
    isFinance,
    isStorage,
    login,
    register,
    fetchUserInfo,
    logout,
    initFromStorage,
  }
})
