<template>
  <div class="profile">
    <el-card>
      <template #header>
        <span>个人信息</span>
      </template>

      <el-descriptions :column="2" border v-if="authStore.user">
        <el-descriptions-item label="用户名">{{ authStore.user.username }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ authStore.user.full_name }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ authStore.user.email || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ authStore.user.phone || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="角色">
          <el-tag :type="roleTagType">{{ roleText }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="账户状态">
          <el-tag :type="authStore.user.is_active ? 'success' : 'danger'">
            {{ authStore.user.is_active ? '正常' : '已禁用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="诚信分">
          <el-progress
            :percentage="Math.min(100, (authStore.user.credit_score / 200) * 100)"
            :color="creditColor"
          >
            <span style="font-size: 16px; color: #303133">{{ authStore.user.credit_score }}</span>
          </el-progress>
        </el-descriptions-item>
        <el-descriptions-item label="总服务时长">
          <span style="font-size: 18px; font-weight: bold; color: #409EFF">
            {{ authStore.user.total_service_hours?.toFixed(1) || 0 }} 小时
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="注册时间" :span="2">
          {{ formatDateTime(authStore.user.created_at) }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>快速统计</span>
          </template>
          <el-row :gutter="10">
            <el-col :span="8">
              <el-statistic title="活动参与" :value="stats.activities || 0" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="获得勋章" :value="stats.badges || 0" />
            </el-col>
            <el-col :span="8">
              <el-statistic title="积分记录" :value="stats.credits || 0" />
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>快捷入口</span>
          </template>
          <el-row :gutter="10">
            <el-col :span="8">
              <el-button type="primary" style="width: 100%" @click="$router.push('/dashboard/activities')">
                浏览活动
              </el-button>
            </el-col>
            <el-col :span="8">
              <el-button type="success" style="width: 100%" @click="$router.push('/dashboard/shifts')">
                我的排班
              </el-button>
            </el-col>
            <el-col :span="8">
              <el-button type="warning" style="width: 100%" @click="$router.push('/dashboard/badges')">
                荣誉勋章
              </el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/api'
import dayjs from 'dayjs'

const authStore = useAuthStore()

const stats = ref({
  activities: 0,
  badges: 0,
  credits: 0,
})

const roleText = computed(() => {
  const roleMap: Record<string, string> = {
    volunteer: '志愿者',
    organizer: '活动组织者',
    admin: '系统管理员',
    reviewer: '荣誉评审员',
  }
  return roleMap[authStore.user?.role || ''] || '未知'
})

const roleTagType = computed(() => {
  const typeMap: Record<string, string> = {
    volunteer: '',
    organizer: 'primary',
    admin: 'danger',
    reviewer: 'warning',
  }
  return typeMap[authStore.user?.role || ''] || 'info'
})

const creditColor = computed(() => {
  const score = authStore.user?.credit_score || 0
  if (score >= 150) return '#67C23A'
  if (score >= 100) return '#409EFF'
  if (score >= 50) return '#E6A23C'
  return '#F56C6C'
})

const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm:ss')
}

const fetchStats = async () => {
  try {
    const [regResponse, badgeResponse, creditResponse] = await Promise.all([
      apiClient.get('/registrations', { params: { status: 'approved' } }),
      apiClient.get('/users/me/badges', { params: { limit: 1 } }),
      apiClient.get('/users/me/credit-records', { params: { limit: 1 } }),
    ])

    stats.value = {
      activities: regResponse.data.length,
      badges: badgeResponse.data.length,
      credits: creditResponse.data.length,
    }
  } catch (error) {
    console.error('Failed to fetch stats:', error)
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.profile {
  padding: 0;
}
</style>
