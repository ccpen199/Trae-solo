<template>
  <div class="error-container">
    <div class="error-icon">❌</div>
    <p class="error-text">{{ message }}</p>
    <van-button type="primary" size="small" @click="$emit('retry')">
      重试
    </van-button>
  </div>
</template>

<script setup>
defineProps({
  message: {
    type: String,
    default: '加载失败，请重试'
  }
})

defineEmits(['retry'])
</script>

<style lang="less" scoped>
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.error-text {
  color: #666;
  margin-bottom: 16px;
  font-size: 14px;
}
</style>
