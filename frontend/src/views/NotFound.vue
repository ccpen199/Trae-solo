<template>
  <div class="not-found">
    <div class="container">
      <div class="content">
        <h1>404</h1>
        <h2>页面不存在</h2>
        <p>抱歉，您访问的页面不存在或已被移除</p>
        <el-button type="primary" size="large" @click="$router.push('/')">返回首页</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.not-found {
  min-height: calc(100vh - 70px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  
  .content {
    text-align: center;
    
    h1 {
      font-size: 120px;
      font-weight: 700;
      color: #1e88e5;
      margin: 0;
      line-height: 1;
    }
    
    h2 {
      font-size: 28px;
      color: #303133;
      margin: 20px 0 12px;
    }
    
    p {
      font-size: 15px;
      color: #909399;
      margin-bottom: 30px;
    }
  }
}
</style>
