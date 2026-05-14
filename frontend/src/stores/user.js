import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, userApi, orderApi, cartApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))
  const isLoggedIn = computed(() => !!token.value && !!userInfo.value)
  const user = computed(() => userInfo.value)

  async function login(loginType, params) {
    let res
    switch (loginType) {
      case 'phone':
        res = await authApi.loginPhone(params.phone, params.code)
        break
      case 'wechat':
        res = await authApi.loginWechat(params.openId, params.nickname, params.avatar)
        break
      case 'qq':
        res = await authApi.loginQQ(params.openId, params.nickname, params.avatar)
        break
      default:
        throw new Error('未知登录类型')
    }

    if (res.success) {
      token.value = res.data.token
      userInfo.value = res.data.user
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('userInfo', JSON.stringify(res.data.user))
    }

    return res
  }

  async function refreshProfile() {
    if (!isLoggedIn.value) return
    try {
      const res = await userApi.getProfile()
      if (res.success && res.data) {
        userInfo.value = res.data
        localStorage.setItem('userInfo', JSON.stringify(res.data))
      }
    } catch (e) {
      console.error('刷新用户信息失败:', e)
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return {
    token,
    userInfo,
    user,
    isLoggedIn,
    login,
    refreshProfile,
    logout
  }
})
