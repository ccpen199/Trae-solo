<template>
  <div class="notfound-container">
    <div class="notfound-content">
      <div class="notfound-illustration">
        <div class="leaf leaf-1">
          <el-icon :size="80"><ChatDotRound /></el-icon>
        </div>
        <div class="leaf leaf-2">
          <el-icon :size="60"><DataLine /></el-icon>
        </div>
        <h1 class="error-code">404</h1>
      </div>
      <h2 class="error-title">页面走丢了</h2>
      <p class="error-desc">抱歉，您访问的页面不存在或已被移除</p>
      <div class="error-actions">
        <el-button type="primary" size="large" @click="goHome">
          <el-icon><House /></el-icon>
          返回首页
        </el-button>
        <el-button size="large" @click="goBack">
          <el-icon><Back /></el-icon>
          返回上一页
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { House, Back, ChatDotRound, DataLine } from '@element-plus/icons-vue'

const router = useRouter()

const goHome = () => {
  router.push('/dashboard')
}

const goBack = () => {
  router.back()
}
</script>

<style scoped>
.notfound-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%);
  position: relative;
  overflow: hidden;
}

.notfound-content {
  text-align: center;
  position: relative;
  z-index: 1;
}

.notfound-illustration {
  position: relative;
  margin-bottom: 24px;
}

.error-code {
  font-size: 120px;
  font-weight: 800;
  margin: 0;
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 8px;
}

.leaf {
  position: absolute;
  color: #81c784;
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
}

.leaf-1 {
  top: -20px;
  left: -60px;
  animation-delay: 0s;
}

.leaf-2 {
  bottom: 20px;
  right: -50px;
  animation-delay: 1.5s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-15px) rotate(10deg);
  }
}

.error-title {
  font-size: 24px;
  font-weight: 600;
  color: #2e7d32;
  margin: 0 0 12px 0;
}

.error-desc {
  font-size: 15px;
  color: #66bb6a;
  margin: 0 0 32px 0;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.error-actions :deep(.el-button) {
  padding: 0 28px;
}
</style>
