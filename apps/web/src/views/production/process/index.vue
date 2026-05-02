<template>
  <div class="process-management">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>工序上报</span>
        </div>
      </template>
      <div class="empty-content">
        <el-empty description="暂无工序上报数据" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.process-management {
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
