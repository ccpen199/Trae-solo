<template>
  <div class="admin-anomalies">
    <el-card>
      <template #header>
        <span>异常管理</span>
      </template>

      <el-table :data="anomalies" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="anomaly_type" label="异常类型" width="150">
          <template #default="scope">
            <el-tag type="danger">{{ getAnomalyTypeText(scope.row.anomaly_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="异常描述" min-width="200" />
        <el-table-column prop="is_verified" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.is_verified ? 'success' : 'warning'">
              {{ scope.row.is_verified ? '已核实' : '待核实' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="核实时间" width="180">
          <template #default="scope">
            {{ scope.row.verified_at ? formatDateTime(scope.row.verified_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="发生时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              link
              @click="handleVerify(scope.row)"
              v-if="!scope.row.is_verified && ['admin', 'reviewer'].includes(authStore.user?.role || '')"
            >
              核实处理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showVerifyDialog" title="核实异常" width="500px">
      <el-form :model="verifyForm" label-width="80px">
        <el-form-item label="处理措施">
          <el-input
            v-model="verifyForm.action_taken"
            type="textarea"
            :rows="4"
            placeholder="请输入处理措施"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showVerifyDialog = false">取消</el-button>
        <el-button type="primary" @click="doVerify">确认核实</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/api'
import type { AnomalyRecordResponse } from '@/types'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const loading = ref(false)
const anomalies = ref<AnomalyRecordResponse[]>([])
const currentAnomaly = ref<AnomalyRecordResponse | null>(null)
const showVerifyDialog = ref(false)

const verifyForm = reactive({
  action_taken: '',
})

const getAnomalyTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    early_leave: '早退',
    late_arrival: '迟到',
    location_mismatch: '位置不匹配',
    suspicious_duration: '时长异常',
    data_fraud: '数据造假',
  }
  return typeMap[type] || type
}

const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
}

const fetchAnomalies = async () => {
  loading.value = true
  try {
    const response = await apiClient.get<AnomalyRecordResponse[]>('/anomalies')
    anomalies.value = response.data
  } catch (error) {
    console.error('Failed to fetch anomalies:', error)
  } finally {
    loading.value = false
  }
}

const handleVerify = (row: AnomalyRecordResponse) => {
  currentAnomaly.value = row
  verifyForm.action_taken = ''
  showVerifyDialog.value = true
}

const doVerify = async () => {
  if (!currentAnomaly.value || !verifyForm.action_taken.trim()) {
    ElMessage.warning('请输入处理措施')
    return
  }

  try {
    await apiClient.put(`/anomalies/${currentAnomaly.value.id}/verify`, null, {
      params: { action_taken: verifyForm.action_taken },
    })
    ElMessage.success('核实完成')
    showVerifyDialog.value = false
    fetchAnomalies()
  } catch (error) {
    console.error('Failed to verify:', error)
  }
}

onMounted(() => {
  fetchAnomalies()
})
</script>

<style scoped>
.admin-anomalies {
  padding: 0;
}
</style>
