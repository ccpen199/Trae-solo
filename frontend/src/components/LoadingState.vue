<template>
  <div class="loading-state loading-container">
    <van-loading size="24px" color="#667eea" />
    <span class="loading-text">{{ text }}</span>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: '加载中...'
  }
})
</script>

<style lang="less" scoped>
.loading-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.loading-text {
  color: #999;
  font-size: 14px;
}
</style>
