<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <Layout>
    <div class="not-found-page">
      <div class="container">
        <div class="not-found-content">
          <div class="error-code">404</div>
          <h1 class="error-title">页面不存在</h1>
          <p class="error-desc">抱歉，您访问的页面不存在或已被移除</p>
          <div class="error-actions">
            <el-button type="primary" size="large" @click="router.push('/home')">
              返回首页
            </el-button>
            <el-button size="large" @click="router.back()">
              返回上页
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<style scoped>
.not-found-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.not-found-content {
  text-align: center;
  padding: 60px 20px;
}

.error-code {
  font-size: 120px;
  font-weight: 800;
  color: #409eff;
  line-height: 1;
  margin-bottom: 20px;
  text-shadow: 4px 4px 0 rgba(64, 158, 255, 0.1);
}

.error-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 12px;
}

.error-desc {
  font-size: 16px;
  color: #909399;
  margin: 0 0 40px;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
