<template>
  <div class="app">
    <router-view v-slot="{ Component }">
      <div v-if="error" class="error-state">
        <div class="icon">⚠️</div>
        <p>加载失败</p>
        <button @click="handleRetry">点击重试</button>
      </div>
      <component 
        :is="Component" 
        v-else
        @error="handleError"
      />
    </router-view>
    <Toast />
  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import Toast from './components/Toast.vue'

const error = ref(false)

function handleError() {
  error.value = true
}

function handleRetry() {
  error.value = false
  window.location.reload()
}

provide('toast', {
  show: (message) => {
    const event = new CustomEvent('showToast', { detail: message })
    window.dispatchEvent(event)
  }
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: #f5f5f5;
}
</style>