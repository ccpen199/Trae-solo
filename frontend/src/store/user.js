import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  
  const isLoggedIn = computed(() => !!user.value)
  const userRole = computed(() => user.value?.role)
  const userId = computed(() => user.value?.id)
  
  function setUser(data) {
    user.value = data
    localStorage.setItem('user', JSON.stringify(data))
  }
  
  function logout() {
    user.value = null
    localStorage.removeItem('user')
  }
  
  return { user, isLoggedIn, userRole, userId, setUser, logout }
})
