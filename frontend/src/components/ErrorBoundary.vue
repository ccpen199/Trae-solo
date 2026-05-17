<template>
  <div class="error-boundary">
    <slot />
  </div>
</template>

<script setup>
</script>

<style lang="less" scoped>
.error-boundary {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.error-content {
  text-align: center;
  padding: 40px;
}

.error-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

h3 {
  color: #333;
  margin-bottom: 12px;
}

p {
  color: #666;
  margin-bottom: 24px;
}
</style>
