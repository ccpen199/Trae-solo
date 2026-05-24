import { ref } from 'vue'

const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const userType = ref(localStorage.getItem('userType') || '')

export const useUserStore = () => {
  const updateUser = (data) => {
    const current = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const updated = { ...current, ...data }
    localStorage.setItem('userInfo', JSON.stringify(updated))
    userInfo.value = { ...updated }
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('user-updated', { detail: updated }))
    }, 0)
    return updated
  }

  const refreshUser = () => {
    const stored = JSON.parse(localStorage.getItem('userInfo') || '{}')
    userInfo.value = { ...stored }
    userType.value = localStorage.getItem('userType') || ''
    return userInfo.value
  }

  const clearUser = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userType')
    localStorage.removeItem('userInfo')
    userInfo.value = {}
    userType.value = ''
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('user-updated', { detail: {} }))
    }, 0)
  }

  return {
    userInfo,
    userType,
    updateUser,
    refreshUser,
    clearUser
  }
}
