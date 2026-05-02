<template>
  <div class="product-inbound-management">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>成品入库</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon> 成品入库
          </el-button>
        </div>
      </template>
      <div class="empty-content">
        <el-empty description="暂无成品入库记录" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'

const handleAdd = () => {
  // 成品入库逻辑
}
</script>

<style lang="scss" scoped>
.product-inbound-management {
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
