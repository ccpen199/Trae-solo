<template>
  <div class="work-order-management">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>生产工单</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 新增工单
          </el-button>
        </div>
      </template>
      <div class="empty-content">
        <el-empty description="暂无生产工单数据" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'

const handleAdd = () => {
  // 新增工单逻辑
}
</script>

<style lang="scss" scoped>
.work-order-management {
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
