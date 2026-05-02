import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login, getCurrentUser } from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  const isLoggedIn = computed(() => !!token.value && !!user.value)
  const role = computed(() => user.value?.role || '')
  const roleText = computed(() => {
    const map = {
      developer: '开发人员',
      tester: '测试人员',
      ops: '运维人员',
      release_manager: '发布经理'
    }
    return map[role.value] || role.value
  })

  // 登录
  async function doLogin(username, password) {
    const res = await login(username, password)
    if (res.success) {
      user.value = res.data.user
      token.value = res.data.token
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      return { success: true }
    } else {
      return { success: false, error: res.error }
    }
  }

  // 获取当前用户信息
  async function fetchCurrentUser() {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      user.value = JSON.parse(savedUser)
    }
    
    try {
      const res = await getCurrentUser()
      if (res.success) {
        user.value = res.data
        localStorage.setItem('user', JSON.stringify(res.data))
      }
    } catch (e) {
      console.error('获取用户信息失败', e)
    }
  }

  // 登出
  function logout() {
    user.value = null
    token.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    user,
    token,
    isLoggedIn,
    role,
    roleText,
    doLogin,
    fetchCurrentUser,
    logout
  }
})
