<template>
  <router-view />
</template>

<script setup>
import { onErrorCaptured } from 'vue'
import { ElMessage } from 'element-plus'

onErrorCaptured((err) => {
  console.error('Global error:', err)
  ElMessage.error('页面加载失败，请刷新重试')
  return true
})
</script>