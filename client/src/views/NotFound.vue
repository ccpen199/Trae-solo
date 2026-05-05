<template>
  <div class="not-found-page">
    <div class="not-found-container">
      <div class="not-found-code">404</div>
      <h1 class="not-found-title">页面不存在</h1>
      <p class="not-found-description">
        您访问的页面可能已被移动、删除或从未存在。
      </p>
      <div class="not-found-actions">
        <button class="btn btn-primary" @click="goHome">返回首页</button>
        <button class="btn btn-secondary" @click="goBack">返回上一页</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function goHome() {
  router.push('/dashboard');
}

function goBack() {
  router.go(-1);
}
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.not-found-container {
  text-align: center;
  padding: 60px;
  background: white;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 500px;
}

.not-found-code {
  font-size: 120px;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 16px;
}

.not-found-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 12px;
}

.not-found-description {
  font-size: 16px;
  color: #6b7280;
  margin-bottom: 32px;
  line-height: 1.6;
}

.not-found-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

@media (max-width: 576px) {
  .not-found-container {
    margin: 20px;
    padding: 40px 24px;
  }
  
  .not-found-code {
    font-size: 80px;
  }
  
  .not-found-title {
    font-size: 24px;
  }
  
  .not-found-actions {
    flex-direction: column;
  }
  
  .not-found-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
