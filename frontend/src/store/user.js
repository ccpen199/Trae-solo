import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, register, getCurrentUser } from '@/api/auth'
import { getBalance } from '@/api/points'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  // 登录
  const handleLogin = async (username, password) => {
    const res = await login({ username, password })
    token.value = res.data.token
    userInfo.value = res.data.user
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userInfo', JSON.stringify(res.data.user))
    return res
  }

  // 注册
  const handleRegister = async (username, password, nickname) => {
    const res = await register({ username, password, nickname })
    token.value = res.data.token
    userInfo.value = res.data.user
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('userInfo', JSON.stringify(res.data.user))
    return res
  }

  // 退出登录
  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  // 检查登录状态并刷新用户信息
  const checkAuth = async () => {
    if (token.value) {
      try {
        const [userRes, pointsRes] = await Promise.all([
          getCurrentUser(),
          getBalance(),
        ])
        userInfo.value = {
          ...userRes.data,
          points: pointsRes.data.balance,
        }
        localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
      } catch (err) {
        console.error('获取用户信息失败:', err)
      }
    }
  }

  // 更新积分
  const updatePoints = async () => {
    if (token.value) {
      try {
        const res = await getBalance()
        if (userInfo.value) {
          userInfo.value.points = res.data.balance
          localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
        }
      } catch (err) {
        console.error('更新积分失败:', err)
      }
    }
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    login: handleLogin,
    register: handleRegister,
    logout,
    checkAuth,
    updatePoints,
  }
})
