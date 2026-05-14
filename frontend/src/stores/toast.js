import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToast = defineStore('toast', () => {
  const messages = ref([])
  let idCounter = 0

  function show(message, type = 'info', duration = 3000) {
    const id = ++idCounter
    messages.value.push({ id, message, type })
    
    setTimeout(() => {
      const index = messages.value.findIndex(m => m.id === id)
      if (index > -1) {
        messages.value.splice(index, 1)
      }
    }, duration)
  }

  function success(message, duration = 3000) {
    show(message, 'success', duration)
  }

  function error(message, duration = 3000) {
    show(message, 'error', duration)
  }

  function warning(message, duration = 3000) {
    show(message, 'warning', duration)
  }

  function info(message, duration = 3000) {
    show(message, 'info', duration)
  }

  return {
    messages,
    show,
    success,
    error,
    warning,
    info
  }
})
