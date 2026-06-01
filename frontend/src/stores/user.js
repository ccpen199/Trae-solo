import { ref, computed } from 'vue'

const user = ref(JSON.parse(localStorage.getItem('currentUser') || 'null'))

export function useUserStore() {
  const isLoggedIn = computed(() => !!user.value)
  const currentUser = computed(() => user.value)
  const userRole = computed(() => user.value?.role)
  const userName = computed(() => user.value?.name)

  const login = async (username, password) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || '登录失败')
    }
    
    const userData = await response.json()
    user.value = userData
    localStorage.setItem('currentUser', JSON.stringify(userData))
    return userData
  }

  const logout = () => {
    user.value = null
    localStorage.removeItem('currentUser')
  }

  const canAccessStage = (stage) => {
    if (!user.value) return false
    if (user.value.role === 'admin') return true
    return user.value.role === stage
  }

  const getAccessibleStage = () => {
    if (!user.value) return null
    if (user.value.role === 'admin') return null
    return user.value.role
  }

  return {
    user,
    isLoggedIn,
    currentUser,
    userRole,
    userName,
    login,
    logout,
    canAccessStage,
    getAccessibleStage
  }
}
