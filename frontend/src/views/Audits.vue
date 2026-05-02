<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <span>审计日志</span>
      </template>
      <el-table :data="logs" stripe v-loading="loading">
        <el-table-column prop="action_type" label="操作类型" />
        <el-table-column prop="target_type" label="目标类型" />
        <el-table-column prop="operator_name" label="操作人" />
        <el-table-column prop="operator_role_name" label="角色" />
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="created_at" label="操作时间" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { reportApi } from '../api'

const logs = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const result = await reportApi.getAuditTrails({ page_size: 50 })
    logs.value = result.data.logs
  } catch (error) {
    console.error('加载审计日志失败:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-container {
  padding: 0;
}
</style>
