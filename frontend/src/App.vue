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

.el-table {
  .el-table__header-wrapper {
    th {
      background-color: #f5f7fa !important;
    }
  }
}

.status-tag {
  &.pending_collect {
    background-color: #e6f7ff;
    color: #1890ff;
    border-color: #91d5ff;
  }
  &.pending_parse {
    background-color: #fff7e6;
    color: #fa8c16;
    border-color: #ffd591;
  }
  &.pending_query {
    background-color: #f6ffed;
    color: #52c41a;
    border-color: #b7eb8f;
  }
  &.pending_alert {
    background-color: #fff1f0;
    color: #f5222d;
    border-color: #ffa39e;
  }
  &.archived {
    background-color: #f0f0f0;
    color: #8c8c8c;
    border-color: #d9d9d9;
  }
}
</style>
