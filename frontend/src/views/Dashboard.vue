<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon blue">
              <el-icon :size="28"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total_forms || stats.my_forms || 0 }}</div>
              <div class="stat-label">表单总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon green">
              <el-icon :size="28"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.published_forms || stats.my_published_forms || 0 }}</div>
              <div class="stat-label">已发布</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon orange">
              <el-icon :size="28"><List /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total_submissions || stats.my_submissions || 0 }}</div>
              <div class="stat-label">提交记录</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon red">
              <el-icon :size="28"><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.unread_notifications || 0 }}</div>
              <div class="stat-label">未读通知</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>快速操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/forms/design')">
              <el-icon><EditPen /></el-icon>
              创建新表单
            </el-button>
            <el-button @click="$router.push('/forms')">
              <el-icon><Collection /></el-icon>
              表单列表
            </el-button>
            <el-button @click="$router.push('/submissions')">
              <el-icon><List /></el-icon>
              提交记录
            </el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>最近提交</span>
          </template>
          <div class="recent-submissions">
            <el-empty v-if="recentSubmissions.length === 0" description="暂无提交记录" :image-size="80" />
            <el-timeline v-else>
              <el-timeline-item
                v-for="item in recentSubmissions"
                :key="item.id"
                :timestamp="formatTime(item.created_at)"
                placement="top"
                :type="getStatusType(item.status)"
              >
                <div class="timeline-content">
                  <div class="timeline-title">提交 ID: {{ item.id }}</div>
                  <div class="timeline-status">
                    <el-tag :type="getStatusType(item.status)" size="small">
                      {{ getStatusText(item.status) }}
                    </el-tag>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { commonApi, submissionApi } from '@/api'
import type { FormSubmission } from '@/types'

const stats = ref<Record<string, number>>({})
const recentSubmissions = ref<FormSubmission[]>([])

const fetchStats = async () => {
  try {
    const result = await commonApi.getDashboardStats()
    stats.value = result as Record<string, number>
  } catch (error) {
    console.error('Fetch stats error:', error)
  }
}

const fetchRecentSubmissions = async () => {
  try {
    const result = await submissionApi.list({ page: 1, page_size: 5 })
    recentSubmissions.value = result.data
  } catch (error) {
    console.error('Fetch recent submissions error:', error)
  }
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    draft: 'info',
    submitted: 'warning',
    approved: 'success',
    rejected: 'danger',
    withdrawn: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    draft: '草稿',
    submitted: '已提交',
    approved: '已通过',
    rejected: '已驳回',
    withdrawn: '已撤回'
  }
  return map[status] || status
}

const formatTime = (time: string) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  fetchStats()
  fetchRecentSubmissions()
})
</script>

<style scoped>
.dashboard-container {
  padding: 0;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  height: 120px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-icon.blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.red {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.content-row {
  margin-bottom: 20px;
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  display: flex;
  align-items: center;
  gap: 6px;
}

.recent-submissions {
  min-height: 200px;
}

.timeline-content {
  padding: 8px 0;
}

.timeline-title {
  font-weight: 500;
  font-size: 14px;
}

.timeline-status {
  margin-top: 4px;
}
</style>
