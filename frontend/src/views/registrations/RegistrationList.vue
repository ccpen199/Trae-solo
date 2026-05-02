<template>
  <div class="registration-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>报名管理</span>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="待审核" value="pending" />
            <el-option label="已通过" value="approved" />
            <el-option label="已拒绝" value="rejected" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchRegistrations">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="registrations" style="width: 100%" v-loading="loading">
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
        <el-table-column label="报名时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="审核时间" width="180">
          <template #default="scope">
            {{ scope.row.reviewed_at ? formatDateTime(scope.row.reviewed_at) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right" v-if="['organizer', 'admin'].includes(authStore.user?.role || '')">
          <template #default="scope">
            <template v-if="scope.row.status === 'pending'">
              <el-button type="success" link @click="handleReview(scope.row, 'approved')">通过</el-button>
              <el-button type="danger" link @click="handleReview(scope.row, 'rejected')">拒绝</el-button>
            </template>
            <el-button type="info" link @click="viewDetail(scope.row)" v-else>查看</el-button>
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
import type { RegistrationResponse, ActivityResponse } from '@/types'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const loading = ref(false)
const registrations = ref<RegistrationResponse[]>([])
const activityMap = ref<Record<number, ActivityResponse>>({})

const searchForm = reactive({
  status: '',
})

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'danger',
    cancelled: 'info',
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已拒绝',
    cancelled: '已取消',
  }
  return textMap[status] || status
}

const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

const fetchRegistrations = async () => {
  loading.value = true
  try {
    const params: Record<string, unknown> = {}
    if (searchForm.status) {
      params.status = searchForm.status
    }

    const response = await apiClient.get<RegistrationResponse[]>('/registrations', { params })
    registrations.value = response.data

    const activityIds = [...new Set(response.data.map((r: RegistrationResponse) => r.activity_id))]
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
    console.error('Failed to fetch registrations:', error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.status = ''
  fetchRegistrations()
}

const viewDetail = (row: RegistrationResponse) => {
  ElMessage.info('查看详情功能开发中')
}

const handleReview = async (row: RegistrationResponse, status: string) => {
  try {
    const action = status === 'approved' ? '通过' : '拒绝'
    await ElMessageBox.confirm(`确定要${action}该报名吗？`, '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await apiClient.put(`/registrations/${row.id}/review`, {
      status,
      message: '',
    })

    ElMessage.success(`已${action}报名`)
    fetchRegistrations()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('Failed to review:', error)
    }
  }
}

onMounted(() => {
  fetchRegistrations()
})
</script>

<style scoped>
.registration-list {
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
