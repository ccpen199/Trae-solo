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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.el-table {
  font-size: 14px;
}

.status-tag-pending_code { background-color: #e6f7ff; color: #1890ff; }
.status-tag-pending_trigger { background-color: #fff7e6; color: #fa8c16; }
.status-tag-pending_build { background-color: #f6ffed; color: #52c41a; }
.status-tag-pending_deploy { background-color: #fff0f6; color: #eb2f96; }
.status-tag-pending_monitor { background-color: #f9f0ff; color: #722ed1; }
.status-tag-completed { background-color: #f6ffed; color: #52c41a; }
.status-tag-failed { background-color: #fff2f0; color: #ff4d4f; }
.status-tag-rolled_back { background-color: #fffbe6; color: #faad14; }
</style>
