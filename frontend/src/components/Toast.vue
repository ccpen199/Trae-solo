<template>
  <Transition name="toast">
    <div v-if="visible" class="toast">
      {{ message }}
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const visible = ref(false)
const message = ref('')
let timer = null

function showToast(event) {
  message.value = event.detail
  visible.value = true
  
  if (timer) {
    clearTimeout(timer)
  }
  
  timer = setTimeout(() => {
    visible.value = false
  }, 2000)
}

onMounted(() => {
  window.addEventListener('showToast', showToast)
})

onUnmounted(() => {
  window.removeEventListener('showToast', showToast)
  if (timer) {
    clearTimeout(timer)
  }
})
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
}
</style>