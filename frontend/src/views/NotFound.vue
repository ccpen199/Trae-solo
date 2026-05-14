<template>
  <div class="not-found-page">
    <el-empty description="页面不存在">
      <router-link to="/">
        <el-button type="primary">返回首页</el-button>
      </router-link>
    </el-empty>
  </div>
</template>

<script setup>
</script>

<style scoped>
.not-found-page {
  min-height: calc(100vh - 200px);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
