<template>
  <div class="inspection-detail">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <h3>质检详情</h3>
          <el-button type="primary" @click="goBack">返回列表</el-button>
        </div>
      </template>
      <div class="detail-content">
        <p>质检详情功能开发中...</p>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push('/quality/inspections')
}
</script>

<style scoped>
.inspection-detail {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  color: #303133;
}

.detail-content {
  padding: 40px;
  text-align: center;
  color: #909399;
  font-size: 16px;
}
</style>
