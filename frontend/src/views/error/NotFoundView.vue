<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="error-message">
        <h2>页面不存在</h2>
        <p>抱歉，您访问的页面不存在或已被移除</p>
      </div>
      <el-button type="primary" size="large" @click="goHome">
        <el-icon><House /></el-icon>
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => {
  router.push('/')
}
</script>

<style scoped lang="scss">
.not-found-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.not-found-content {
  text-align: center;
  color: #fff;
}

.error-code {
  font-size: 180px;
  font-weight: 700;
  line-height: 1;
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  opacity: 0.8;
}

.error-message {
  margin: 30px 0 50px;
  
  h2 {
    margin: 0 0 10px;
    font-size: 28px;
    font-weight: 500;
  }
  
  p {
    margin: 0;
    font-size: 16px;
    opacity: 0.8;
  }
}
</style>
