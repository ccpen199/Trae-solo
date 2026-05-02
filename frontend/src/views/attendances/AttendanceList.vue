<template>
  <div class="attendance-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>考勤记录</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="待签到" value="pending" />
            <el-option label="已签到" value="checked_in" />
            <el-option label="已签出" value="checked_out" />
            <el-option label="缺勤" value="absent" />
            <el-option label="异常" value="anomaly" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchAttendances">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="attendances" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="活动名称" min-width="180">
          <template #default="scope">
            {{ activityMap[scope.row.activity_id]?.title || scope.row.activity_id }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="签到时间" width="180">
          <template #default="scope">
            {{ scope.row.check_in_time ? formatDateTime(scope.row.check_in_time) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="签出时间" width="180">
          <template #default="scope">
            {{ scope.row.check_out_time ? formatDateTime(scope.row.check_out_time) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="实际时长(小时)" width="120">
          <template #default="scope">
            {{ scope.row.actual_duration?.toFixed(1) || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button
              type="success"
              link
              @click="handleVerify(scope.row)"
              v-if="scope.row.status === 'checked_out' && ['organizer', 'admin'].includes(authStore.user?.role || '')"
            >
              核销
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/api'
import type { AttendanceResponse, ActivityResponse, IncentiveResponse } from '@/types'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const loading = ref(false)
const attendances = ref<AttendanceResponse[]>([])
const activityMap = ref<Record<number, ActivityResponse>>({})

const searchForm = reactive({
  status: '',
})

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'info',
    checked_in: 'primary',
    checked_out: 'success',
    absent: 'danger',
    anomaly: 'warning',
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待签到',
    checked_in: '已签到',
    checked_out: '已签出',
    absent: '缺勤',
    anomaly: '异常',
  }
  return textMap[status] || status
}

const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

const fetchAttendances = async () => {
  loading.value = true
  try {
    const params: Record<string, unknown> = {}
    if (searchForm.status) {
      params.status = searchForm.status
    }
    if (authStore.user?.role === 'volunteer') {
      params.volunteer_id = authStore.user.id
    }

    const response = await apiClient.get<AttendanceResponse[]>('/attendances', { params })
    attendances.value = response.data

    const activityIds = [...new Set(response.data.map((a: AttendanceResponse) => a.activity_id))]
    for (const id of activityIds) {
      if (!activityMap.value[id]) {
        try {
          const activityResponse = await apiClient.get<ActivityResponse>(`/activities/${id}`)
          activityMap.value[id] = activityResponse.data
        } catch {
          // ignore
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch attendances:', error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.status = ''
  fetchAttendances()
}

const handleVerify = async (row: AttendanceResponse) => {
  try {
    await ElMessageBox.confirm(
      '确定要核销该考勤记录吗？系统将自动计算诚信分并颁发符合条件的荣誉勋章。',
      '确认核销',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const response = await apiClient.post<IncentiveResponse>(`/attendances/${row.id}/verify`)
    const incentive = response.data

    let message = `核销成功！诚信分变动: ${incentive.credit_change > 0 ? '+' : ''}${incentive.credit_change}, 当前积分: ${incentive.new_balance}`
    if (incentive.awarded_badges.length > 0) {
      message += `\n恭喜获得新勋章: ${incentive.awarded_badges.join(', ')}`
    }

    ElMessage.success({
      message,
      duration: 5000,
    })

    fetchAttendances()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('Failed to verify:', error)
    }
  }
}

onMounted(() => {
  fetchAttendances()
})
</script>

<style scoped>
.attendance-list {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>
