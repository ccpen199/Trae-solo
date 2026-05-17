<template>
  <div id="app" class="fitlife-app">
    <router-view />
  </div>
</template>

<script setup>
import { onErrorCaptured } from 'vue';
import { showToast } from 'vant';

onErrorCaptured((err) => {
  console.error('应用错误:', err);
  showToast('页面加载出错，请刷新重试');
  return false;
});
</script>

<style lang="less">
.fitlife-app {
  width: 100%;
  min-height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  background: #f7f8fa;
  position: relative;
}
</style>
