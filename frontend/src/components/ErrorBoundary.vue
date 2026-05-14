<template>
  <div v-if="hasError" class="error-boundary">
    <el-empty description="页面加载失败">
      <el-button type="primary" @click="retry">点击重试</el-button>
    </el-empty>
  </div>
  <slot v-else></slot>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue';

const hasError = ref(false);
const error = ref(null);

onErrorCaptured((err, instance, info) => {
  console.error('Component error:', err, info);
  hasError.value = true;
  error.value = err;
  return true;
});

const retry = () => {
  hasError.value = false;
  error.value = null;
  window.location.reload();
};
</script>

<style scoped>
.error-boundary {
  padding: 60px 20px;
  text-align: center;
}
</style>
