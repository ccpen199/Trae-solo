<template>
  <div class="inventory-management">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>库存台账</span>
        </div>
      </template>
      <div class="empty-content">
        <el-empty description="暂无库存数据" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.inventory-management {
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
