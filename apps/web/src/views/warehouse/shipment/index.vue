<template>
  <div class="shipment-management">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>销售发货</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 发货出库
          </el-button>
        </div>
      </template>
      <div class="empty-content">
        <el-empty description="暂无发货记录" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'

const handleAdd = () => {
  // 发货出库逻辑
}
</script>

<style lang="scss" scoped>
.shipment-management {
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
