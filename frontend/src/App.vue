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
  border-right: none !important;
}

.el-card {
  margin-bottom: 16px;
}

.pv-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.pv-green {
  color: #67c23a;
}

.pv-red {
  color: #f56c6c;
}

.pv-orange {
  color: #e6a23c;
}

.pv-blue {
  color: #409eff;
}

.status-tag-operating {
  background-color: #67c23a;
  color: white;
}

.status-tag-fault {
  background-color: #f56c6c;
  color: white;
}

.status-tag-maintenance {
  background-color: #e6a23c;
  color: white;
}

.status-tag-offline {
  background-color: #909399;
  color: white;
}
</style>
