<template>
  <div class="admin-audit-logs">
    <el-card>
      <template #header>
        <span>审计日志</span>
      </template>

      <el-table :data="logs" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="action" label="操作" width="150" />
        <el-table-column prop="table_name" label="数据对象" width="120" />
        <el-table-column prop="record_id" label="记录ID" width="100" />
        <el-table-column prop="user_id" label="操作人" width="100" />
        <el-table-column prop="ip_address" label="IP地址" width="140" />
        <el-table-column label="操作时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column label="详情" min-width="200">
          <template #default="scope">
            <div v-if="scope.row.old_value || scope.row.new_value">
              <el-text type="info" size="small">
                原值: {{ scope.row.old_value || '-' }}
              </el-text>
              <br />
              <el-text type="primary" size="small">
                新值: {{ scope.row.new_value || '-' }}
              </el-text>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiClient } from '@/api'
import type { AuditLogResponse } from '@/types'
import dayjs from 'dayjs'

const loading = ref(false)
const logs = ref<AuditLogResponse[]>([])

const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
}

const fetchLogs = async () => {
  loading.value = true
  try {
    const response = await apiClient.get<AuditLogResponse[]>('/admin/audit-logs')
    logs.value = response.data
  } catch (error) {
    console.error('Failed to fetch audit logs:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.admin-audit-logs {
  padding: 0;
}
</style>
