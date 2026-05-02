<template>
  <div class="credit-records">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>诚信分记录</span>
          <el-tag :type="creditTagType">当前积分: {{ authStore.user?.credit_score || 0 }}</el-tag>
        </div>
      </template>

      <el-table :data="records" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="change" label="积分变动" width="120">
          <template #default="scope">
            <span :class="scope.row.change > 0 ? 'positive' : 'negative'">
              {{ scope.row.change > 0 ? '+' : '' }}{{ scope.row.change }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="当前余额" width="120">
          <template #default="scope">
            <span style="font-weight: bold">{{ scope.row.balance }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="变动原因" min-width="200" />
        <el-table-column label="发生时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/api'
import type { CreditRecordResponse } from '@/types'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const loading = ref(false)
const records = ref<CreditRecordResponse[]>([])

const creditTagType = computed(() => {
  const score = authStore.user?.credit_score || 0
  if (score >= 150) return 'success'
  if (score >= 100) return ''
  if (score >= 50) return 'warning'
  return 'danger'
})

const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
}

const fetchRecords = async () => {
  loading.value = true
  try {
    const response = await apiClient.get<CreditRecordResponse[]>('/users/me/credit-records')
    records.value = response.data
  } catch (error) {
    console.error('Failed to fetch credit records:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRecords()
})
</script>

<style scoped>
.credit-records {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.positive {
  color: #67C23A;
  font-weight: bold;
}

.negative {
  color: #F56C6C;
  font-weight: bold;
}
</style>
