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

html, body {
  width: 100%;
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

.el-table {
  .el-table__cell {
    padding: 12px 0;
  }
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.search-form {
  .el-form-item {
    margin-bottom: 16px;
  }
}

.card-container {
  margin-bottom: 20px;
}

.status-tag {
  cursor: default;
}
</style>
