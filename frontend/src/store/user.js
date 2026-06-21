import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)
  const isElderMode = ref(false)
  const currentUserId = ref(1)

  const userName = computed(() => userInfo.value?.real_name || '游客')

  function setUserInfo(info) {
    userInfo.value = info
  }

  function toggleElderMode(enabled) {
    isElderMode.value = enabled !== undefined ? enabled : !isElderMode.value
    localStorage.setItem('elderMode', isElderMode.value)
  }

  function initElderMode() {
    const saved = localStorage.getItem('elderMode')
    if (saved !== null) {
      isElderMode.value = saved === 'true'
    }
  }

  return {
    userInfo,
    isElderMode,
    currentUserId,
    userName,
    setUserInfo,
    toggleElderMode,
    initElderMode
  }
})
