<template>
  <div class="badges">
    <el-card>
      <template #header>
        <span>我的荣誉勋章</span>
      </template>

      <el-empty v-if="userBadges.length === 0" description="暂无荣誉勋章" />

      <el-row :gutter="20" v-else>
        <el-col :span="6" v-for="item in userBadges" :key="item.id">
          <el-card shadow="hover" class="badge-card">
            <div class="badge-icon-wrapper">
              <el-icon :size="64" :color="getBadgeColor(item.badge.tier)"><Trophy /></el-icon>
            </div>
            <div class="badge-info">
              <div class="badge-name">{{ item.badge.name }}</div>
              <el-tag :type="getBadgeTagType(item.badge.tier)" size="small">
                {{ getBadgeTierText(item.badge.tier) }}
              </el-tag>
              <div class="badge-desc">{{ item.badge.description }}</div>
              <div class="badge-time">
                获得时间: {{ formatDateTime(item.awarded_at) }}
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <span>所有可获得的勋章</span>
      </template>

      <el-row :gutter="20">
        <el-col :span="6" v-for="badge in allBadges" :key="badge.id">
          <el-card class="badge-card locked-card" :class="{ 'unlocked': hasBadge(badge.id) }">
            <div class="badge-icon-wrapper">
              <el-icon :size="64" :color="hasBadge(badge.id) ? getBadgeColor(badge.tier) : '#c0c4cc'"><Trophy /></el-icon>
            </div>
            <div class="badge-info">
              <div class="badge-name">{{ badge.name }}</div>
              <el-tag :type="hasBadge(badge.id) ? getBadgeTagType(badge.tier) : 'info'" size="small">
                {{ getBadgeTierText(badge.tier) }}
              </el-tag>
              <div class="badge-desc">{{ badge.description }}</div>
              <div class="badge-requirement">
                条件: {{ getRequirementText(badge) }}
              </div>
              <el-tag v-if="hasBadge(badge.id)" type="success" size="small" style="margin-top: 8px">
                已获得
              </el-tag>
              <el-tag v-else type="info" size="small" style="margin-top: 8px">
                未获得
              </el-tag>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiClient } from '@/api'
import type { UserBadgeResponse, BadgeResponse } from '@/types'
import dayjs from 'dayjs'
import { Trophy } from '@element-plus/icons-vue'

const userBadges = ref<UserBadgeResponse[]>([])
const allBadges = ref<BadgeResponse[]>([])

const formatDateTime = (dateStr: string) => {
  return dayjs(dateStr).format('YYYY-MM-DD HH:mm')
}

const getBadgeColor = (tier: string) => {
  const colorMap: Record<string, string> = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
  }
  return colorMap[tier] || '#909399'
}

const getBadgeTagType = (tier: string) => {
  const typeMap: Record<string, string> = {
    bronze: '',
    silver: 'info',
    gold: 'warning',
    platinum: 'primary',
  }
  return typeMap[tier] || 'info'
}

const getBadgeTierText = (tier: string) => {
  const textMap: Record<string, string> = {
    bronze: '青铜',
    silver: '白银',
    gold: '黄金',
    platinum: '铂金',
  }
  return textMap[tier] || ''
}

const getRequirementText = (badge: BadgeResponse) => {
  const typeMap: Record<string, string> = {
    total_hours: `服务满 ${badge.requirement_value} 小时`,
    credit_score: `诚信分达到 ${badge.requirement_value} 分`,
    activity_count: `参与 ${badge.requirement_value} 次活动`,
  }
  return typeMap[badge.requirement_type] || badge.requirement_type
}

const hasBadge = (badgeId: number) => {
  return userBadges.value.some((b) => b.badge_id === badgeId)
}

const fetchUserBadges = async () => {
  try {
    const response = await apiClient.get<UserBadgeResponse[]>('/users/me/badges')
    userBadges.value = response.data
  } catch (error) {
    console.error('Failed to fetch user badges:', error)
  }
}

const fetchAllBadges = async () => {
  try {
    const response = await apiClient.get<BadgeResponse[]>('/badges')
    allBadges.value = response.data
  } catch (error) {
    console.error('Failed to fetch all badges:', error)
  }
}

onMounted(() => {
  fetchUserBadges()
  fetchAllBadges()
})
</script>

<style scoped>
.badges {
  padding: 0;
}

.badge-card {
  text-align: center;
  min-height: 280px;
}

.badge-icon-wrapper {
  margin-bottom: 16px;
}

.badge-info {
  text-align: left;
}

.badge-name {
  font-weight: bold;
  font-size: 16px;
  color: #303133;
  margin-bottom: 8px;
}

.badge-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
  margin-bottom: 8px;
}

.badge-requirement {
  font-size: 12px;
  color: #606266;
}

.badge-time {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.locked-card {
  opacity: 0.7;
}

.unlocked {
  opacity: 1;
}
</style>
