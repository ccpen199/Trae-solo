<template>
  <div class="shift-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的排班</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="待确认" value="pending" />
            <el-option label="已确认" value="confirmed" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchShifts">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="shifts" style="width: 100%" v-loading="loading">
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
        <el-table-column label="排班时间" min-width="250">
          <template #default="scope">
            <div>{{ formatDateTime(scope.row.start_time) }}</div>
            <div style="font-size: 12px; color: #909399">
              至 {{ formatDateTime(scope.row.end_time) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="确认时间" width="180">
          <template #default="scope">
            {{ scope.row.confirmed_at ? formatDateTime(scope.row.confirmed_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="viewWorkOrder(scope.row)">
              派工单
            </el-button>
            <el-button
              type="success"
              link
              @click="handleConfirm(scope.row)"
              v-if="scope.row.status === 'pending'"
            >
              确认排班
            </el-button>
            <el-button
              type="warning"
              link
              @click="handleCheckIn(scope.row)"
              v-if="['confirmed', 'in_progress'].includes(scope.row.status) && authStore.user?.role === 'volunteer'"
            >
              签到/签出
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showWorkOrderDialog" title="电子派工单" width="500px">
      <el-descriptions :column="1" border v-if="workOrder">
        <el-descriptions-item label="派工单编号">{{ workOrder.order_code }}</el-descriptions-item>
        <el-descriptions-item label="活动名称">{{ activityMap[workOrder.activity_id]?.title }}</el-descriptions-item>
        <el-descriptions-item label="签发时间">{{ formatDateTime(workOrder.issued_at) }}</el-descriptions-item>
        <el-descriptions-item label="任务说明">{{ workOrder.tasks }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog v-model="showAttendanceDialog" title="签到/签出" width="400px">
      <el-form :model="attendanceForm" label-width="80px">
        <el-form-item label="纬度">
          <el-input-number v-model="attendanceForm.latitude" :precision="6" :step="0.000001" style="width: 100%" />
        </el-form-item>
        <el-form-item label="经度">
          <el-input-number v-model="attendanceForm.longitude" :precision="6" :step="0.000001" style="width: 100%" />
        </el-form-item>
        <el-form-item>
          <el-text type="info" size="small">
            提示：实际使用时，这些坐标会通过 GPS 自动获取。
            这里使用演示坐标：纬度 39.9042, 经度 116.4074 (北京)
          </el-text>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAttendanceDialog = false">取消</el-button>
        <el-button type="primary" @click="doCheckIn" v-if="currentAttendanceStatus === 'pending'">
          签到
        </el-button>
        <el-button type="success" @click="doCheckOut" v-else-if="currentAttendanceStatus === 'checked_in'">
          签出
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/api'
import type { ShiftResponse, ActivityResponse, WorkOrderResponse, AttendanceResponse } from '@/types'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const loading = ref(false)
const shifts = ref<ShiftResponse[]>([])
const activityMap = ref<Record<number, ActivityResponse>>({})
const workOrder = ref<WorkOrderResponse | null>(null)
const currentShift = ref<ShiftResponse | null>(null)
const currentAttendance = ref<AttendanceResponse | null>(null)

const showWorkOrderDialog = ref(false)
const showAttendanceDialog = ref(false)

const searchForm = reactive({
  status: '',
})

const attendanceForm = reactive({
  latitude: 39.9042,
  longitude: 116.4074,
})

const currentAttendanceStatus = computed(() => {
  return currentAttendance.value?.status || 'pending'
})

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'warning',
    confirmed: 'primary',
    in_progress: 'success',
    completed: 'info',
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    in_progress: '进行中',
    completed: '已完成',
  }
  return textMap[status] || status
}

const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

const fetchShifts = async () => {
  loading.value = true
  try {
    const params: Record<string, unknown> = {}
    if (searchForm.status) {
      params.status = searchForm.status
    }
    if (authStore.user?.role === 'volunteer') {
      params.volunteer_id = authStore.user.id
    }

    const response = await apiClient.get<ShiftResponse[]>('/shifts', { params })
    shifts.value = response.data

    const activityIds = [...new Set(response.data.map((s: ShiftResponse) => s.activity_id))]
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
    console.error('Failed to fetch shifts:', error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.status = ''
  fetchShifts()
}

const viewWorkOrder = async (row: ShiftResponse) => {
  try {
    const response = await apiClient.get<WorkOrderResponse>(`/shifts/${row.id}/work-order`)
    workOrder.value = response.data
    showWorkOrderDialog.value = true
  } catch (error) {
    ElMessage.error('获取派工单失败')
  }
}

const handleConfirm = async (row: ShiftResponse) => {
  try {
    await ElMessageBox.confirm('确定要确认该排班吗？', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await apiClient.post(`/shifts/${row.id}/confirm`)
    ElMessage.success('排班已确认')
    fetchShifts()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('Failed to confirm:', error)
    }
  }
}

const handleCheckIn = async (row: ShiftResponse) => {
  currentShift.value = row
  currentAttendance.value = null
  showAttendanceDialog.value = true
}

const doCheckIn = async () => {
  if (!currentShift.value) return

  try {
    const response = await apiClient.post<AttendanceResponse>('/attendances/check-in', {
      shift_id: currentShift.value.id,
      latitude: attendanceForm.latitude,
      longitude: attendanceForm.longitude,
    })
    currentAttendance.value = response.data
    ElMessage.success('签到成功')
    showAttendanceDialog.value = false
    fetchShifts()
  } catch (error) {
    console.error('Check-in failed:', error)
  }
}

const doCheckOut = async () => {
  if (!currentShift.value) return

  try {
    const response = await apiClient.post<AttendanceResponse>('/attendances/check-out', {
      shift_id: currentShift.value.id,
      latitude: attendanceForm.latitude,
      longitude: attendanceForm.longitude,
    })
    currentAttendance.value = response.data
    ElMessage.success('签出成功')
    showAttendanceDialog.value = false
    fetchShifts()
  } catch (error) {
    console.error('Check-out failed:', error)
  }
}

onMounted(() => {
  fetchShifts()
})
</script>

<style scoped>
.shift-list {
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
