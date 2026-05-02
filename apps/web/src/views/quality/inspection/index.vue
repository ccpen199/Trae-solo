<template>
  <div class="inspection-management">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>批次质检</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 新增质检
          </el-button>
        </div>
      </template>
      <div class="empty-content">
        <el-empty description="暂无质检记录" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'

const handleAdd = () => {
  // 新增质检逻辑
}
</script>

<style lang="scss" scoped>
.inspection-management {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .empty-content {
    padding: 50px;
  }
}
</style>
