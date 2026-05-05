<template>
  <div class="error-page">
    <van-empty description="页面不存在" image="error">
      <template #description>
        <p>抱歉，您访问的页面不存在</p>
      </template>
      <van-button type="primary" round @click="goHome">返回首页</van-button>
    </van-empty>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/home')
}
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
