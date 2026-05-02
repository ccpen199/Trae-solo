<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-code">404</div>
      <div class="error-message">
        <h2>页面不存在</h2>
        <p>抱歉，您访问的页面不存在或已被移除</p>
      </div>
      <div class="error-actions">
        <el-button type="primary" @click="goHome">返回首页</el-button>
        <el-button @click="goBack">返回上页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  router.push('/')
}

function goBack() {
  router.go(-1)
}
</script>

<style lang="scss" scoped>
.error-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  .error-content {
    text-align: center;
    color: #fff;

    .error-code {
      font-size: 150px;
      font-weight: 700;
      text-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      margin-bottom: 20px;
      animation: bounce 2s infinite;
    }

    .error-message {
      margin-bottom: 40px;

      h2 {
        font-size: 32px;
        margin-bottom: 16px;
        font-weight: 600;
      }

      p {
        font-size: 16px;
        opacity: 0.9;
      }
    }

    .error-actions {
      display: flex;
      justify-content: center;
      gap: 16px;

      .el-button {
        padding: 12px 32px;
        font-size: 16px;
        border-radius: 8px;
      }
    }
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}
</style>
