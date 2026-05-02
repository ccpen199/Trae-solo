<template>
  <div class="activity-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>活动列表</span>
          <el-button
            type="primary"
            v-if="['organizer', 'admin'].includes(authStore.user?.role || '')"
            @click="showCreateDialog = true"
          >
            <el-icon><Plus /></el-icon>
            发布活动
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable>
            <el-option label="已发布" value="published" />
            <el-option label="招募中" value="recruiting" />
            <el-option label="已排班" value="scheduled" />
            <el-option label="进行中" value="in_progress" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchActivities">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="activities" style="width: 100%" v-loading="loading">
        <el-table-column prop="title" label="活动名称" min-width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="location" label="活动地点" min-width="150" />
        <el-table-column label="活动时间" min-width="200">
          <template #default="scope">
            <div>{{ formatDateTime(scope.row.start_time) }}</div>
            <div style="font-size: 12px; color: #909399">
              至 {{ formatDateTime(scope.row.end_time) }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="报名人数" width="120">
          <template #default="scope">
            {{ scope.row.current_volunteers }} / {{ scope.row.max_volunteers }}
          </template>
        </el-table-column>
        <el-table-column label="技能要求" min-width="150">
          <template #default="scope">
            <el-tag
              v-for="skill in scope.row.required_skills"
              :key="skill.id"
              size="small"
              style="margin-right: 4px"
            >
              {{ skill.name }}
            </el-tag>
            <el-text v-if="!scope.row.required_skills?.length" type="info" size="small">
              无特殊要求
            </el-text>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="viewDetail(scope.row)">查看</el-button>
            <el-button
              type="success"
              link
              @click="handleRegister(scope.row)"
              v-if="authStore.user?.role === 'volunteer' && !isRegistered(scope.row.id)"
            >
              报名
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog
      v-model="showCreateDialog"
      title="发布活动"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
      >
        <el-form-item label="活动名称" prop="title">
          <el-input v-model="createForm.title" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入活动描述"
          />
        </el-form-item>
        <el-form-item label="活动地点" prop="location">
          <el-input v-model="createForm.location" placeholder="请输入活动地点" />
        </el-form-item>
        <el-form-item label="位置坐标">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-input v-model="createForm.latitude" placeholder="纬度（选填）" />
            </el-col>
            <el-col :span="12">
              <el-input v-model="createForm.longitude" placeholder="经度（选填）" />
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="签到范围">
          <el-input-number
            v-model="createForm.location_radius"
            :min="50"
            :max="1000"
            :step="50"
          />
          <span style="margin-left: 8px; color: #909399">米</span>
        </el-form-item>
        <el-form-item label="开始时间" prop="start_time">
          <el-date-picker
            v-model="createForm.start_time"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束时间" prop="end_time">
          <el-date-picker
            v-model="createForm.end_time"
            type="datetime"
            placeholder="选择结束时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="最大人数" prop="max_volunteers">
          <el-input-number
            v-model="createForm.max_volunteers"
            :min="1"
            :max="1000"
          />
        </el-form-item>
        <el-form-item label="所需技能">
          <el-select
            v-model="createForm.required_skill_ids"
            multiple
            filterable
            placeholder="请选择所需技能"
            style="width: 100%"
          >
            <el-option
              v-for="skill in allSkills"
              :key="skill.id"
              :label="skill.name"
              :value="skill.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreateActivity">
          发布
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/api'
import type { ActivityResponse, SkillResponse } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()

const loading = ref(false)
const submitting = ref(false)
const showCreateDialog = ref(false)
const createFormRef = ref<FormInstance>()

const activities = ref<ActivityResponse[]>([])
const allSkills = ref<SkillResponse[]>([])
const myRegistrations = ref<number[]>([])

const searchForm = reactive({
  status: '',
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
})

const createForm = reactive({
  title: '',
  description: '',
  location: '',
  latitude: undefined as number | undefined,
  longitude: undefined as number | undefined,
  location_radius: 200,
  start_time: undefined as Date | undefined,
  end_time: undefined as Date | undefined,
  max_volunteers: 10,
  required_skill_ids: [] as number[],
})

const validateEndTime = (rule: unknown, value: Date, callback: (error?: Error) => void) => {
  if (value && createForm.start_time && value <= createForm.start_time) {
    callback(new Error('结束时间必须晚于开始时间'))
  } else {
    callback()
  }
}

const createRules: FormRules = {
  title: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  description: [{ required: true, message: '请输入活动描述', trigger: 'blur' }],
  location: [{ required: true, message: '请输入活动地点', trigger: 'blur' }],
  start_time: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  end_time: [
    { required: true, message: '请选择结束时间', trigger: 'change' },
    { validator: validateEndTime, trigger: 'change' },
  ],
}

const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    draft: 'info',
    published: 'primary',
    recruiting: 'success',
    scheduled: 'warning',
    in_progress: 'danger',
    completed: 'info',
    cancelled: 'info',
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    recruiting: '招募中',
    scheduled: '已排班',
    in_progress: '进行中',
    completed: '已完成',
    cancelled: '已取消',
  }
  return textMap[status] || status
}

const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

const isRegistered = computed(() => (activityId: number) => {
  return myRegistrations.value.includes(activityId)
})

const fetchActivities = async () => {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      skip: (pagination.page - 1) * pagination.pageSize,
      limit: pagination.pageSize,
    }
    if (searchForm.status) {
      params.status = searchForm.status
    }

    const response = await apiClient.get<ActivityResponse[]>('/activities', { params })
    activities.value = response.data
    pagination.total = response.data.length
  } catch (error) {
    console.error('Failed to fetch activities:', error)
  } finally {
    loading.value = false
  }
}

const fetchAllSkills = async () => {
  try {
    const response = await apiClient.get<SkillResponse[]>('/admin/skills')
    allSkills.value = response.data
  } catch (error) {
    console.error('Failed to fetch skills:', error)
  }
}

const fetchMyRegistrations = async () => {
  if (authStore.user?.role !== 'volunteer') return
  try {
    const response = await apiClient.get('/registrations?volunteer_id=' + authStore.user.id)
    myRegistrations.value = response.data.map((r: { activity_id: number }) => r.activity_id)
  } catch (error) {
    console.error('Failed to fetch registrations:', error)
  }
}

const resetSearch = () => {
  searchForm.status = ''
  pagination.page = 1
  fetchActivities()
}

const viewDetail = (row: ActivityResponse) => {
  router.push(`/dashboard/activities/${row.id}`)
}

const handleRegister = async (row: ActivityResponse) => {
  try {
    await apiClient.post('/registrations', {
      activity_id: row.id,
      message: '',
    })
    ElMessage.success('报名成功，等待审核')
    myRegistrations.value.push(row.id)
  } catch (error) {
    console.error('Failed to register:', error)
  }
}

const handleCreateActivity = async () => {
  if (!createFormRef.value) return

  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const data = {
          ...createForm,
          start_time: createForm.start_time?.toISOString(),
          end_time: createForm.end_time?.toISOString(),
        }
        await apiClient.post('/activities', data)
        ElMessage.success('活动发布成功')
        showCreateDialog.value = false
        fetchActivities()
      } catch (error) {
        console.error('Failed to create activity:', error)
      } finally {
        submitting.value = false
      }
    }
  })
}

const handleSizeChange = (size: number) => {
  pagination.pageSize = size
  fetchActivities()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchActivities()
}

onMounted(() => {
  fetchActivities()
  fetchAllSkills()
  fetchMyRegistrations()
})
</script>

<style scoped>
.activity-list {
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
