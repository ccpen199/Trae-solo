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

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f7fa;
}

.status-tag-pending { --el-tag-bg-color: #fdf6ec; --el-tag-text-color: #e6a23c; --el-tag-border-color: #faecd8; }
.status-tag-active { --el-tag-bg-color: #ecf5ff; --el-tag-text-color: #409eff; --el-tag-border-color: #b3d8ff; }
.status-tag-hearing { --el-tag-bg-color: #f0f9eb; --el-tag-text-color: #67c23a; --el-tag-border-color: #c2e7b0; }
.status-tag-executing { --el-tag-bg-color: #f4f4f5; --el-tag-text-color: #909399; --el-tag-border-color: #e9e9eb; }
.status-tag-closed { --el-tag-bg-color: #fef0f0; --el-tag-text-color: #f56c6c; --el-tag-border-color: #fbc4c4; }
.status-tag-archived { --el-tag-bg-color: #909399; --el-tag-text-color: #fff; --el-tag-border-color: #909399; }

.role-tag-lead_lawyer { --el-tag-bg-color: #409eff; --el-tag-text-color: #fff; }
.role-tag-assistant { --el-tag-bg-color: #67c23a; --el-tag-text-color: #fff; }
.role-tag-client { --el-tag-bg-color: #e6a23c; --el-tag-text-color: #fff; }
.role-tag-finance { --el-tag-bg-color: #909399; --el-tag-text-color: #fff; }
</style>
