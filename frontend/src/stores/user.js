import { defineStore } from 'pinia'
import { ref } from 'vue'
import request from '@/utils/request'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  const setToken = (newToken) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const logout = () => {
    userInfo.value = null
    token.value = ''
    localStorage.removeItem('token')
  }

  const login = async (username, password) => {
    const response = await request.post('/auth/login', {
      username,
      password
    })
    setToken(response.access_token)
    userInfo.value = response.user
    return response
  }

  const getUserInfo = async () => {
    const response = await request.get('/auth/me')
    userInfo.value = response
    return response
  }

  return {
    userInfo,
    token,
    setToken,
    logout,
    login,
    getUserInfo
  }
})
