import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface User {
  id: number
  phone: string
  nickname: string
  avatar: string
  balance: number
  total_invest: number
  total_earnings: number
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setUser(newUser: User) {
    user.value = newUser
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function updateBalance(balance: number) {
    if (user.value) {
      user.value.balance = balance
      localStorage.setItem('user', JSON.stringify(user.value))
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    setToken,
    setUser,
    logout,
    updateBalance
  }
})
