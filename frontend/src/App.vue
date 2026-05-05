<template>
  <router-view />
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
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.el-menu {
  border-right: none;
}

.el-table {
  margin-top: 16px;
}

.el-pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

.stat-card {
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
}

.stat-card .value {
  font-size: 32px;
  font-weight: bold;
  margin: 10px 0;
}

.stat-card .label {
  font-size: 14px;
  opacity: 0.9;
}

.page-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.page-header h2 {
  font-size: 20px;
  color: #303133;
  margin: 0;
}

.page-header .description {
  color: #909399;
  font-size: 14px;
  margin-top: 8px;
}

.form-dialog {
  width: 600px;
}

.detail-card {
  margin-bottom: 20px;
}

.detail-label {
  color: #909399;
  font-size: 13px;
}

.detail-value {
  color: #303133;
  font-size: 14px;
  margin-top: 4px;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-active {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.status-cleared {
  background-color: #f4f4f5;
  color: #909399;
}

.status-repaired {
  background-color: #f0f9eb;
  color: #67c23a;
}

.severity-high {
  background-color: #fef0f0;
  color: #f56c6c;
}

.severity-medium {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.severity-low {
  background-color: #ecf5ff;
  color: #409eff;
}
</style>
