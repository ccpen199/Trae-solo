import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))

  function setUser(user) {
    userInfo.value = user
    localStorage.setItem('userInfo', JSON.stringify(user))
  }

  function logout() {
    userInfo.value = null
    localStorage.removeItem('userInfo')
  }

  return {
    userInfo,
    setUser,
    logout
  }
})
