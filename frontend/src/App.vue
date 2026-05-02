<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>

<script setup>
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
}

a {
  text-decoration: none;
  color: inherit;
}

.el-header {
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.el-aside {
  background-color: #fff;
  border-right: 1px solid #eee;
}

.el-main {
  padding: 20px;
}

.main-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.page-header {
  margin-bottom: 20px;
}

.page-card {
  margin-bottom: 20px;
}

.card-hover:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
  transition: all 0.3s ease;
}

.price-tag {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

.status-tag {
  margin-right: 8px;
}

.trust-badge {
  background: linear-gradient(135deg, #67c23a, #95d475);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.danger-badge {
  background: linear-gradient(135deg, #f56c6c, #f78989);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.info-badge {
  background: linear-gradient(135deg, #409eff, #79bbff);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.warning-badge {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.fraud-warning {
  background-color: #fef0f0;
  border: 1px solid #fbc4c4;
  padding: 12px;
  border-radius: 4px;
  color: #f56c6c;
  margin-bottom: 16px;
}

.fraud-warning .el-icon {
  margin-right: 8px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.timeline-step {
  padding: 12px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.image-uploader {
  width: 148px;
  height: 148px;
}

.product-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.chat-message {
  margin-bottom: 16px;
}

.chat-message.is-mine {
  text-align: right;
}

.chat-bubble {
  display: inline-block;
  padding: 10px 16px;
  border-radius: 8px;
  max-width: 70%;
  word-break: break-word;
}

.chat-bubble.is-mine {
  background-color: #409eff;
  color: #fff;
}

.chat-bubble.is-other {
  background-color: #fff;
  color: #333;
  border: 1px solid #eee;
}

.chat-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin: 0 12px;
}

.order-steps {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 20px;
}

.stat-card .stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.stat-card .stat-label {
  color: #909399;
  margin-top: 8px;
}
</style>
