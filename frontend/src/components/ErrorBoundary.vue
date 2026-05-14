<template>
  <div v-if="hasError" class="error-boundary">
    <el-empty description="页面加载失败">
      <el-button type="primary" @click="resetError">
        点击重试
      </el-button>
    </el-empty>
  </div>
  <slot v-else />
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorMessage = ref('')

onErrorCaptured((err, instance, info) => {
  console.error('ErrorBoundary 捕获错误:', err, info)
  hasError.value = true
  errorMessage.value = err?.message || '未知错误'
  return false
})

function resetError() {
  hasError.value = false
  errorMessage.value = ''
  window.location.reload()
}
</script>

<style scoped>
.error-boundary {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
