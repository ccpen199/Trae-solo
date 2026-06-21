import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, UserProfile, LoginForm, LoginResponse } from '@/types'
import { setToken, getToken, setRefreshToken, getRefreshToken, setUserInfo, getUserInfo, clearAuth, isAuthenticated } from '@/utils/auth'
import { login as apiLogin, logout as apiLogout, getCurrentUser, getUserProfile, refreshToken as apiRefreshToken, verifyRealName } from '@/api/user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(getToken())
  const refreshTokenValue = ref<string | null>(getRefreshToken())
  const userInfo = ref<User | null>(getUserInfo())
  const userProfile = ref<UserProfile | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isLoggedIn = computed(() => isAuthenticated() && !!userInfo.value)
  const isCitizen = computed(() => userInfo.value?.role === 'citizen')
  const isEnterprise = computed(() => userInfo.value?.role === 'enterprise')
  const isDepartmentAdmin = computed(() => userInfo.value?.role === 'department_admin')
  const isPlatformAdmin = computed(() => userInfo.value?.role === 'platform_admin')
  const isAdmin = computed(() => isDepartmentAdmin.value || isPlatformAdmin.value)
  const isVerified = computed(() => !!userInfo.value?.verified)

  async function login(form: LoginForm): Promise<LoginResponse> {
    loading.value = true
    error.value = null
    try {
      const res = await apiLogin(form)
      if (res.code === 0 && res.data) {
        token.value = res.data.token
        refreshTokenValue.value = res.data.refreshToken
        userInfo.value = res.data.user
        setToken(res.data.token)
        setRefreshToken(res.data.refreshToken)
        setUserInfo(res.data.user)
        return res.data
      }
      throw new Error(res.message || '登录失败')
    } catch (e: any) {
      error.value = e.message || '登录失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    loading.value = true
    try {
      await apiLogout()
    } catch (e) {
      console.error('Logout error:', e)
    } finally {
      token.value = null
      refreshTokenValue.value = null
      userInfo.value = null
      userProfile.value = null
      clearAuth()
      loading.value = false
    }
  }

  async function fetchCurrentUser(): Promise<User | null> {
    loading.value = true
    error.value = null
    try {
      const res = await getCurrentUser()
      if (res.code === 0 && res.data) {
        userInfo.value = res.data
        setUserInfo(res.data)
        return res.data
      }
      return null
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchUserProfile(): Promise<UserProfile | null> {
    loading.value = true
    error.value = null
    try {
      const res = await getUserProfile()
      if (res.code === 0 && res.data) {
        userProfile.value = res.data
        return res.data
      }
      return null
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  async function doRefreshToken(): Promise<string | null> {
    if (!refreshTokenValue.value) return null
    try {
      const res = await apiRefreshToken(refreshTokenValue.value)
      if (res.code === 0 && res.data) {
        token.value = res.data.token
        refreshTokenValue.value = res.data.refreshToken
        setToken(res.data.token)
        setRefreshToken(res.data.refreshToken)
        return res.data.token
      }
      return null
    } catch (e) {
      console.error('Refresh token error:', e)
      return null
    }
  }

  async function doVerifyRealName(data: { realName: string; idCard: string; faceImage?: string }): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      const res = await verifyRealName(data)
      if (res.code === 0 && res.data?.verified && userInfo.value) {
        userInfo.value = { ...userInfo.value, verified: true }
        setUserInfo(userInfo.value)
        return true
      }
      return false
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  function updateUserInfo(partial: Partial<User>) {
    if (userInfo.value) {
      userInfo.value = { ...userInfo.value, ...partial }
      setUserInfo(userInfo.value)
    }
  }

  function init() {
    const savedToken = getToken()
    const savedUser = getUserInfo()
    if (savedToken) token.value = savedToken
    if (savedUser) userInfo.value = savedUser
  }

  return {
    token,
    refreshToken: refreshTokenValue,
    userInfo,
    userProfile,
    loading,
    error,
    isLoggedIn,
    isCitizen,
    isEnterprise,
    isDepartmentAdmin,
    isPlatformAdmin,
    isAdmin,
    isVerified,
    login,
    logout,
    fetchCurrentUser,
    fetchUserProfile,
    doRefreshToken,
    doVerifyRealName,
    updateUserInfo,
    init
  }
})
