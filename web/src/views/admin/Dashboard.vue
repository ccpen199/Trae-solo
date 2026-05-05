<template>
  <div class="dashboard-page">
    <h2 class="page-title">数据概览</h2>

    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon users">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.users }}</div>
            <div class="stat-label">注册会员</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon resources">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.resources }}</div>
            <div class="stat-label">资源总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon groups">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.groups }}</div>
            <div class="stat-label">小组总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon comments">
            <el-icon><ChatLineRound /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.comments }}</div>
            <div class="stat-label">评论总数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :lg="12" :xs="24">
        <el-card class="activity-card">
          <template #header>
            <span>最近活动</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in activities"
              :key="index"
              :timestamp="activity.time"
              placement="top"
            >
              <p>{{ activity.content }}</p>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
      <el-col :lg="12" :xs="24">
        <el-card class="pending-card">
          <template #header>
            <span>待审核</span>
          </template>
          <div class="pending-list">
            <div class="pending-item">
              <div class="pending-icon users-pending">
                <el-icon><User /></el-icon>
              </div>
              <div class="pending-info">
                <div class="pending-count">{{ pending.users }}</div>
                <div class="pending-label">待审核用户</div>
              </div>
            </div>
            <div class="pending-item">
              <div class="pending-icon resources-pending">
                <el-icon><Document /></el-icon>
              </div>
              <div class="pending-info">
                <div class="pending-count">{{ pending.resources }}</div>
                <div class="pending-label">待审核资源</div>
              </div>
            </div>
            <div class="pending-item">
              <div class="pending-icon comments-pending">
                <el-icon><ChatLineRound /></el-icon>
              </div>
              <div class="pending-info">
                <div class="pending-count">{{ pending.comments }}</div>
                <div class="pending-label">待审核评论</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getAdminStats } from '@/api'
import { User, Document, ChatDotRound, ChatLineRound } from '@element-plus/icons-vue'

const stats = reactive({
  users: 0,
  resources: 0,
  groups: 0,
  comments: 0
})

const pending = reactive({
  users: 0,
  resources: 0,
  comments: 0
})

const activities = ref([
  { content: '用户 test123 注册了账号', time: '2026-05-03 10:30' },
  { content: '用户 admin 发布了新资源', time: '2026-05-03 09:15' },
  { content: '小组「技术交流」有新帖子', time: '2026-05-03 08:45' },
  { content: '用户 user001 上传了 5 张照片', time: '2026-05-02 18:20' },
  { content: '管理员审核通过了 3 个用户', time: '2026-05-02 15:00' }
])

const fetchStats = async () => {
  try {
    const res = await getAdminStats()
    const data = res.data || {}
    stats.users = data.users?.total || 0
    stats.resources = data.resources?.total || 0
    stats.groups = data.groups?.total || 0
    stats.comments = data.comments?.total || 0
    pending.users = data.users?.pending || 0
    pending.resources = data.resources?.pending || 0
    pending.comments = data.comments?.pending || 0
  } catch (e) {
    console.error('Fetch stats error:', e)
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.dashboard-page {
  padding: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 24px;
}

.stat-cards {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.stat-icon.users {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.resources {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.groups {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.comments {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.activity-card,
.pending-card {
  min-height: 300px;
}

.pending-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pending-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.pending-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
}

.pending-icon.users-pending {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.pending-icon.resources-pending {
  background: linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%);
}

.pending-icon.comments-pending {
  background: linear-gradient(135deg, #fccb90 0%, #d57eeb 100%);
}

.pending-count {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.pending-label {
  font-size: 13px;
  color: #909399;
}
</style>
