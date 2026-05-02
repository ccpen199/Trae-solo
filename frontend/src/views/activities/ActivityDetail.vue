<template>
  <div class="activity-detail">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <el-button type="text" @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
          <span>{{ activity?.title }}</span>
        </div>
      </template>

      <el-descriptions :column="2" border v-if="activity">
        <el-descriptions-item label="活动状态" :span="2">
          <el-tag :type="getStatusType(activity.status)">{{ getStatusText(activity.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="活动地点">{{ activity.location }}</el-descriptions-item>
        <el-descriptions-item label="签到范围">{{ activity.location_radius }} 米</el-descriptions-item>
        <el-descriptions-item label="开始时间">{{ formatDateTime(activity.start_time) }}</el-descriptions-item>
        <el-descriptions-item label="结束时间">{{ formatDateTime(activity.end_time) }}</el-descriptions-item>
        <el-descriptions-item label="报名人数">{{ activity.current_volunteers }} / {{ activity.max_volunteers }}</el-descriptions-item>
        <el-descriptions-item label="所需技能">
          <el-tag
            v-for="skill in activity.required_skills"
            :key="skill.id"
            size="small"
            style="margin-right: 4px"
          >
            {{ skill.name }}
          </el-tag>
          <el-text v-if="!activity.required_skills?.length" type="info" size="small">
            无特殊要求
          </el-text>
        </el-descriptions-item>
        <el-descriptions-item label="活动描述" :span="2">
          {{ activity.description }}
        </el-descriptions-item>
      </el-descriptions>

      <el-divider />

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card v-if="['organizer', 'admin'].includes(authStore.user?.role || '')">
            <template #header>
              <span>管理操作</span>
            </template>
            <el-row :gutter="10">
              <el-col :span="8" v-if="activity?.status === 'published'">
                <el-button type="primary" style="width: 100%" @click="handleAutoSchedule">
                  自动排班
                </el-button>
              </el-col>
              <el-col :span="8" v-if="activity?.status === 'scheduled'">
                <el-button type="success" style="width: 100%" @click="handleStartActivity">
                  开始活动
                </el-button>
              </el-col>
              <el-col :span="8" v-if="['published', 'scheduled'].includes(activity?.status || '')">
                <el-button type="danger" style="width: 100%" @click="handleCancelActivity">
                  取消活动
                </el-button>
              </el-col>
            </el-row>
          </el-card>
        </el-col>

        <el-col :span="12" v-if="authStore.user?.role === 'volunteer'">
          <el-card>
            <template #header>
              <span>我的操作</span>
            </template>
            <el-button
              type="primary"
              style="width: 100%"
              @click="handleRegister"
              v-if="!isRegistered && ['published', 'recruiting'].includes(activity?.status || '')"
            >
              立即报名
            </el-button>
            <el-tag type="warning" v-if="isRegistered && registrationStatus === 'pending'">
              报名审核中
            </el-tag>
            <el-tag type="success" v-if="isRegistered && registrationStatus === 'approved'">
              报名已通过
            </el-tag>
            <el-tag type="danger" v-if="isRegistered && registrationStatus === 'rejected'">
              报名已拒绝
            </el-tag>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/api'
import type { ActivityResponse, RegistrationResponse } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const loading = ref(false)
const activity = ref<ActivityResponse | null>(null)
const myRegistration = ref<RegistrationResponse | null>(null)

const activityId = computed(() => parseInt(route.params.id as string))

const isRegistered = computed(() => !!myRegistration.value)
const registrationStatus = computed(() => myRegistration.value?.status)

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

const goBack = () => {
  router.push('/dashboard/activities')
}

const fetchActivity = async () => {
  loading.value = true
  try {
    const response = await apiClient.get<ActivityResponse>(`/activities/${activityId.value}`)
    activity.value = response.data
  } catch (error) {
    console.error('Failed to fetch activity:', error)
    ElMessage.error('活动不存在')
    router.push('/dashboard/activities')
  } finally {
    loading.value = false
  }
}

const fetchMyRegistration = async () => {
  if (authStore.user?.role !== 'volunteer') return
  try {
    const response = await apiClient.get<RegistrationResponse[]>('/registrations', {
      params: {
        volunteer_id: authStore.user.id,
        activity_id: activityId.value,
      },
    })
    if (response.data.length > 0) {
      myRegistration.value = response.data[0]
    }
  } catch (error) {
    console.error('Failed to fetch registration:', error)
  }
}

const handleRegister = async () => {
  try {
    await apiClient.post('/registrations', {
      activity_id: activityId.value,
      message: '',
    })
    ElMessage.success('报名成功，等待审核')
    fetchMyRegistration()
  } catch (error) {
    console.error('Failed to register:', error)
  }
}

const handleAutoSchedule = async () => {
  try {
    await ElMessageBox.confirm('确定要自动排班吗？系统将根据报名情况自动分配排班。', '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    const response = await apiClient.post(`/shifts/auto-schedule/${activityId.value}`)
    ElMessage.success(`排班完成，共生成 ${response.data.length} 个排班`)
    fetchActivity()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('Failed to schedule:', error)
    }
  }
}

const handleStartActivity = async () => {
  try {
    await apiClient.put(`/activities/${activityId.value}`, {
      status: 'in_progress',
    })
    ElMessage.success('活动已开始')
    fetchActivity()
  } catch (error) {
    console.error('Failed to start activity:', error)
  }
}

const handleCancelActivity = async () => {
  try {
    await ElMessageBox.confirm('确定要取消该活动吗？此操作不可撤销。', '确认取消', {
      confirmButtonText: '确定取消',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await apiClient.delete(`/activities/${activityId.value}`)
    ElMessage.success('活动已取消')
    router.push('/dashboard/activities')
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('Failed to cancel activity:', error)
    }
  }
}

onMounted(() => {
  fetchActivity()
  fetchMyRegistration()
})
</script>

<style scoped>
.activity-detail {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
