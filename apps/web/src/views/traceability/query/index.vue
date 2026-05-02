<template>
  <div class="traceability-query">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>批次追溯</span>
        </div>
      </template>
      <div class="empty-content">
        <el-empty description="暂无追溯数据" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.traceability-query {
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
