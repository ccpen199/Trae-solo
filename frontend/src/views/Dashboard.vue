<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF">
              <el-icon :size="32"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.activity_count || 0 }}</div>
              <div class="stat-label">活动总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A">
              <el-icon :size="32"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.user_count || 0 }}</div>
              <div class="stat-label">用户总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon :size="32"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.total_service_hours?.toFixed(1) || 0 }}</div>
              <div class="stat-label">总服务时长(小时)</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F56C6C">
              <el-icon :size="32"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ statistics.pending_anomaly_count || 0 }}</div>
              <div class="stat-label">待处理异常</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>快速操作</span>
          </template>
          <el-row :gutter="10">
            <el-col :span="12" v-if="['organizer', 'admin'].includes(authStore.user?.role || '')">
              <el-button
                type="primary"
                size="large"
                style="width: 100%; height: 60px"
                @click="$router.push('/dashboard/activities')"
              >
                <el-icon><Plus /></el-icon>
                <span style="margin-left: 8px">发布活动</span>
              </el-button>
            </el-col>
            <el-col :span="12" v-if="authStore.user?.role === 'volunteer'">
              <el-button
                type="success"
                size="large"
                style="width: 100%; height: 60px"
                @click="$router.push('/dashboard/activities')"
              >
                <el-icon><Search /></el-icon>
                <span style="margin-left: 8px">浏览活动</span>
              </el-button>
            </el-col>
            <el-col :span="12">
              <el-button
                type="info"
                size="large"
                style="width: 100%; height: 60px"
                @click="$router.push('/dashboard/shifts')"
              >
                <el-icon><Calendar /></el-icon>
                <span style="margin-left: 8px">我的排班</span>
              </el-button>
            </el-col>
            <el-col :span="12">
              <el-button
                type="warning"
                size="large"
                style="width: 100%; height: 60px"
                @click="$router.push('/dashboard/profile')"
              >
                <el-icon><User /></el-icon>
                <span style="margin-left: 8px">个人中心</span>
              </el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <span>个人信息概览</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="姓名">{{ authStore.user?.full_name }}</el-descriptions-item>
            <el-descriptions-item label="角色">{{ roleText }}</el-descriptions-item>
            <el-descriptions-item label="诚信分">
              <el-tag :type="creditTagType">{{ authStore.user?.credit_score }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="总服务时长">{{ authStore.user?.total_service_hours?.toFixed(1) || 0 }} 小时</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px" v-if="authStore.user?.role === 'volunteer'">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>我的荣誉</span>
          </template>
          <el-empty v-if="userBadges.length === 0" description="暂无荣誉勋章" />
          <el-row :gutter="20" v-else>
            <el-col :span="6" v-for="badge in userBadges" :key="badge.id">
              <el-card shadow="hover" class="badge-card">
                <div class="badge-icon">
                  <el-icon :size="48" :color="badgeTierColor(badge.badge.tier)"><Trophy /></el-icon>
                </div>
                <div class="badge-info">
                  <div class="badge-name">{{ badge.badge.name }}</div>
                  <div class="badge-tier">{{ badgeTierText(badge.badge.tier) }}</div>
                </div>
              </el-card>
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
import type { UserBadgeResponse } from '@/types'

const authStore = useAuthStore()

const statistics = ref<Record<string, number>>({})
const userBadges = ref<UserBadgeResponse[]>([])

const roleText = computed(() => {
  const roleMap: Record<string, string> = {
    volunteer: '志愿者',
    organizer: '活动组织者',
    admin: '系统管理员',
    reviewer: '荣誉评审员',
  }
  return roleMap[authStore.user?.role || ''] || '未知'
})

const creditTagType = computed(() => {
  const score = authStore.user?.credit_score || 0
  if (score >= 150) return 'success'
  if (score >= 100) return ''
  if (score >= 50) return 'warning'
  return 'danger'
})

const badgeTierColor = (tier: string) => {
  const colorMap: Record<string, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  }
  return colorMap[tier] || '#909399'
}

const badgeTierText = (tier: string) => {
  const textMap: Record<string, string> = {
    bronze: '青铜',
    silver: '白银',
    gold: '黄金',
    platinum: '铂金',
  }
  return textMap[tier] || ''
}

const fetchStatistics = async () => {
  try {
    const response = await apiClient.get('/admin/statistics')
    statistics.value = response.data
  } catch (error) {
    console.error('Failed to fetch statistics:', error)
  }
}

const fetchUserBadges = async () => {
  try {
    const response = await apiClient.get('/users/me/badges?limit=8')
    userBadges.value = response.data
  } catch (error) {
    console.error('Failed to fetch badges:', error)
  }
}

onMounted(() => {
  if (['admin', 'reviewer'].includes(authStore.user?.role || '')) {
    fetchStatistics()
  }
  if (authStore.user?.role === 'volunteer') {
    fetchUserBadges()
  }
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.badge-card {
  text-align: center;
}

.badge-icon {
  margin-bottom: 12px;
}

.badge-name {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
}

.badge-tier {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
