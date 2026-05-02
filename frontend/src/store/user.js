import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const user = ref(null)
  const todoCount = ref({ sessionCount: 0, messageCount: 0, totalCount: 0 })

  const setUser = (userData, todoCountData) => {
    user.value = userData
    if (todoCountData) {
      todoCount.value = todoCountData
    }
  }

  const clearUser = () => {
    user.value = null
    todoCount.value = { sessionCount: 0, messageCount: 0, totalCount: 0 }
    localStorage.removeItem('token')
  }

  const fetchUserInfo = async () => {
    const response = await authApi.getCurrentUser()
    setUser(response.user, response.todoCount)
    return response
  }

  const login = async (credentials) => {
    const response = await authApi.login(credentials)
    localStorage.setItem('token', response.token)
    setUser(response.user, response.todoCount)
    return response
  }

  const logout = () => {
    clearUser()
  }

  return {
    user,
    todoCount,
    setUser,
    clearUser,
    fetchUserInfo,
    login,
    logout
  }
})
