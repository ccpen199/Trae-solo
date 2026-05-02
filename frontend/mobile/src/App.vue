<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  font-family: 'Helvetica Neue', Arial, sans-serif;
}

:root {
  --primary-color: #409EFF;
  --secondary-color: #67c23a;
  --danger-color: #f56c6c;
  --warning-color: #e6a23c;
  --info-color: #909399;
  --border-color: #e4e7ed;
  --background-color: #f5f7fa;
}

body {
  background-color: var(--background-color);
  color: #333;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .el-button {
    padding: 12px 20px;
    font-size: 16px;
  }
  
  .el-input__inner {
    height: 44px;
    font-size: 16px;
  }
}
</style>