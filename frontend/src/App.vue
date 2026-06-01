<script setup>
import { onErrorCaptured, ref } from 'vue'
import { useUserStore } from './store/user'

const userStore = useUserStore()
const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err) => {
  console.error('Global error:', err)
  hasError.value = true
  errorMessage.value = err.message || '页面加载失败'
  return false
})

function retry() {
  hasError.value = false
  window.location.reload()
}

userStore.initFromStorage()
</script>

<template>
  <div v-if="hasError" class="error-boundary flex flex-col items-center justify-center h-full">
    <div class="text-48 mb-16">⚠️</div>
    <div class="text-16 text-secondary mb-24">{{ errorMessage }}</div>
    <button class="btn btn-primary" @click="retry">点击重试</button>
  </div>
  <router-view v-else />
</template>

<style scoped>
.error-boundary {
  background: var(--bg-gray);
}

.text-48 {
  font-size: 48px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mb-24 {
  margin-bottom: 24px;
}
</style>
