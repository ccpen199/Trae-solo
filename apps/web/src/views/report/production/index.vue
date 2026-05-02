<template>
  <div class="production-report">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>生产报表</span>
        </div>
      </template>
      <div class="empty-content">
        <el-empty description="暂无生产报表数据" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.production-report {
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
