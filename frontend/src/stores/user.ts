import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginApi, registerApi, getUserInfoApi } from '@/api/auth'

export interface UserInfo {
  id: number
  phone: string
  nickname: string
  role: 'user' | 'property' | 'manufacturer' | 'platform' | 'ops' | 'admin'
  avatar?: string
  balance?: number
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const userInfo = ref<UserInfo | null>(null)
  const adminRoles = ['admin', 'platform', 'ops', 'property', 'manufacturer']

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => adminRoles.includes(userInfo.value?.role || ''))

  async function login(phone: string, password: string) {
    console.log('[Store login] Starting login with phone:', phone)
    try {
      const res = await loginApi({ phone, password })
      console.log('[Store login] API response:', res)
      
      if (!res?.data?.token) {
        console.error('[Store login] No token in response')
        throw new Error(res?.message || '登录失败：未获取到令牌')
      }
      
      if (!res?.data?.user) {
        console.error('[Store login] No user in response')
        throw new Error(res?.message || '登录失败：未获取到用户信息')
      }
      
      token.value = res.data.token
      userInfo.value = res.data.user
      localStorage.setItem('token', res.data.token)
      console.log('[Store login] Login completed, userInfo:', userInfo.value)
      
      return res
    } catch (error) {
      console.error('[Store login] Error:', error)
      throw error
    }
  }

  async function register(data: { phone: string; password: string; username: string }) {
    const res = await registerApi(data)
    return res
  }

  async function fetchUserInfo() {
    console.log('[Store fetchUserInfo] Starting...')
    try {
      const res = await getUserInfoApi()
      console.log('[Store fetchUserInfo] API response:', res)
      
      if (!res?.data) {
        console.error('[Store fetchUserInfo] No data in response')
        throw new Error(res?.message || '获取用户信息失败')
      }
      
      userInfo.value = res.data
      console.log('[Store fetchUserInfo] UserInfo set:', userInfo.value)
      return res
    } catch (error) {
      console.error('[Store fetchUserInfo] Error:', error)
      throw error
    }
  }

  function logout() {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    isAdmin,
    login,
    register,
    fetchUserInfo,
    logout
  }
})
