<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.layout-container {
  height: 100vh;
}

.main-content {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
  overflow-y: auto;
}

.page-card {
  margin-bottom: 20px;
}

.status-tag {
  margin-right: 8px;
}

.order-card {
  margin-bottom: 15px;
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.order-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.timeline-item {
  padding-bottom: 20px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #409eff;
}

.stat-label {
  color: #909399;
  margin-top: 8px;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
  font-size: 24px;
}

.sidebar-menu {
  border-right: none;
}

.header-user {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 20px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.badge-wrapper {
  position: relative;
  display: inline-block;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.empty-container {
  text-align: center;
  padding: 60px 0;
  color: #909399;
}
</style>
