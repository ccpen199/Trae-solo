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
  width: 100%;
}

.el-table {
  .el-tag {
    margin-right: 4px;
  }
}

.page-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 120px);
}

.card-container {
  background-color: #fff;
  border-radius: 4px;
  padding: 20px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background-color: #fff;
  border-radius: 4px;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.timeline-container {
  padding: 10px 0;
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
  
  .detail-label {
    width: 120px;
    text-align: right;
    color: #909399;
    margin-right: 12px;
    flex-shrink: 0;
  }
  
  .detail-value {
    color: #303133;
    word-break: break-all;
  }
}

.form-section {
  margin-bottom: 20px;
  
  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 15px;
    padding-left: 10px;
    border-left: 3px solid #409eff;
  }
}

.stats-card {
  text-align: center;
  padding: 20px;
  
  .stats-value {
    font-size: 32px;
    font-weight: 700;
    color: #409eff;
    margin-bottom: 8px;
  }
  
  .stats-label {
    font-size: 14px;
    color: #909399;
  }
}

.workflow-steps {
  padding: 20px;
  
  .step-active {
    color: #409eff;
    font-weight: 600;
  }
  
  .step-completed {
    color: #67c23a;
  }
  
  .step-pending {
    color: #909399;
  }
}

.el-tabs--border-card {
  background-color: #fff;
  
  .el-tabs__header {
    margin-bottom: 0;
  }
  
  .el-tabs__content {
    padding: 15px;
  }
}

.el-dialog {
  .el-dialog__body {
    padding: 20px;
  }
}
</style>
