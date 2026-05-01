<template>
  <div class="not-found-page">
    <div class="not-found-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面不存在</h2>
      <p class="error-description">
        抱歉，您访问的页面不存在或已被移除。
      </p>
      <div class="error-actions">
        <router-link to="/">
          <el-button type="primary" size="large">
            <el-icon><HomeFilled /></el-icon>
            返回首页
          </el-button>
        </router-link>
        <el-button size="large" @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回上一页
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.not-found-page {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: -20px;
  width: calc(100% + 40px);
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
}

.not-found-content {
  text-align: center;
  padding: 40px;
}

.error-code {
  font-size: 120px;
  font-weight: 700;
  color: #409eff;
  margin: 0;
  line-height: 1;
  text-shadow: 4px 4px 0 rgba(64, 158, 255, 0.2);
}

.error-title {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 20px 0 12px;
}

.error-description {
  font-size: 16px;
  color: #909399;
  margin-bottom: 32px;
}

.error-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
