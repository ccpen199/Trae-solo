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

html, body, #app {
  height: 100%;
  width: 100%;
}

.el-menu {
  border-right: none !important;
}

.status-tag {
  display: inline-flex;
  align-items: center;
}

.timeline-card {
  margin-bottom: 16px;
}

.timeline-card .el-timeline-item__timestamp {
  color: #909399;
}
</style>
