import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { request } from '@/utils/request'

export interface User {
  id: string
  username: string
  nickname: string
  email: string
  phoneNumber: string
  avatarUrl: string
  isSuperAdmin: boolean
  isActive: boolean
  roles?: Role[]
  permissions?: string[]
}

export interface Role {
  id: string
  name: string
  code: string
  roleType: string
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const userInfo = ref<User | null>(null)

  const isLoggedIn = computed(() => !!token.value)
  const isSuperAdmin = computed(() => userInfo.value?.isSuperAdmin || false)

  async function login(username: string, password: string) {
    const response: any = await request.post('/auth/login', { username, password })
    token.value = response.accessToken
    userInfo.value = response.user
    localStorage.setItem('token', response.accessToken)
    return response
  }

  async function getUserInfo() {
    const response: any = await request.get('/auth/profile')
    userInfo.value = response
    return response
  }

  function logout() {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('token')
  }

  async function initUserInfo() {
    if (token.value && !userInfo.value) {
      try {
        await getUserInfo()
      } catch {
        logout()
      }
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isSuperAdmin,
    login,
    getUserInfo,
    logout,
    initUserInfo
  }
})
