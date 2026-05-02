<template>
  <div class="dashboard-page">
    <div class="page-header mb-4">
      <h2 class="page-title">工作台</h2>
      <p class="page-subtitle">欢迎回来，{{ userStore.user?.name }}，查看今天的工作安排</p>
    </div>

    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <div class="dashboard-stat-card">
          <div class="flex justify-between items-center">
            <div>
              <div class="dashboard-stat-value">{{ stats.projects.total }}</div>
              <div class="dashboard-stat-label">项目总数</div>
            </div>
            <el-icon class="stat-icon" style="color: #409eff"><Folder /></el-icon>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="dashboard-stat-card">
          <div class="flex justify-between items-center">
            <div>
              <div class="dashboard-stat-value">{{ stats.myTasks.total }}</div>
              <div class="dashboard-stat-label">我的待办</div>
            </div>
            <el-icon class="stat-icon" style="color: #67c23a"><Document /></el-icon>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="dashboard-stat-card">
          <div class="flex justify-between items-center">
            <div>
              <div class="dashboard-stat-value" style="color: #f56c6c">{{ stats.exceptions.pending }}</div>
              <div class="dashboard-stat-label">待处理异常</div>
            </div>
            <el-icon class="stat-icon" style="color: #f56c6c"><Warning /></el-icon>
          </div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="dashboard-stat-card">
          <div class="flex justify-between items-center">
            <div>
              <div class="dashboard-stat-value" style="color: #e6a23c">{{ stats.notifications.unread }}</div>
              <div class="dashboard-stat-label">未读通知</div>
            </div>
            <el-icon class="stat-icon" style="color: #e6a23c"><Bell /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="mb-4">
          <template #header>
            <div class="card-header">
              <span class="card-title">项目状态看板</span>
              <router-link to="/projects" class="card-link">查看全部</router-link>
            </div>
          </template>
          
          <div class="status-board">
            <div 
              v-for="column in statusBoard" 
              :key="column.stateCode"
              class="status-column"
            >
              <div class="status-column-header">
                <span class="status-name">{{ column.stateName }}</span>
                <span class="status-count">{{ column.projects.length }}</span>
              </div>
              
              <div class="status-projects">
                <router-link
                  v-for="project in column.projects.slice(0, 3)"
                  :key="project.id"
                  :to="`/projects/${project.id}`"
                  class="mini-project-card"
                >
                  <div class="mini-project-name">{{ project.name }}</div>
                  <div class="mini-project-info">
                    <span class="mini-project-no">{{ project.project_no }}</span>
                    <span class="mini-project-progress">{{ project.progress }}%</span>
                  </div>
                  <div class="progress-bar" style="margin-top: 8px">
                    <div 
                      class="progress-bar-fill" 
                      :style="{ width: `${project.progress}%` }"
                    ></div>
                  </div>
                </router-link>
                
                <div v-if="column.projects.length === 0" class="empty-column">
                  <el-icon><Empty /></el-icon>
                  <span>暂无项目</span>
                </div>
                
                <div v-if="column.projects.length > 3" class="more-projects">
                  还有 {{ column.projects.length - 3 }} 个项目...
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">我的待办任务</span>
              <router-link to="/todos" class="card-link">查看全部</router-link>
            </div>
          </template>
          
          <div v-if="myTasks.length > 0" class="task-list">
            <div 
              v-for="task in myTasks.slice(0, 5)" 
              :key="task.id"
              class="task-item"
            >
              <div class="task-info">
                <el-tag :type="getPriorityType(task.priority)" size="small">
                  {{ getPriorityLabel(task.priority) }}
                </el-tag>
                <span class="task-name">{{ task.name }}</span>
                <span class="task-project">({{ task.project_name }})</span>
              </div>
              <div class="task-action">
                <router-link :to="`/projects/${task.project_id}/kanban`">
                  <el-button type="primary" link size="small">处理</el-button>
                </router-link>
              </div>
            </div>
          </div>
          
          <el-empty v-else description="暂无待办任务" />
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="mb-4">
          <template #header>
            <div class="card-header">
              <span class="card-title">异常队列</span>
              <router-link to="/exceptions" class="card-link">查看全部</router-link>
            </div>
          </template>
          
          <div v-if="exceptions.length > 0" class="exception-list">
            <div 
              v-for="exception in exceptions.slice(0, 5)" 
              :key="exception.id"
              class="exception-item exception-pending"
              :class="`exception-type-${exception.type}`"
            >
              <div class="exception-title">
                <span class="badge-dot" :class="`badge-dot-${exception.priority}`"></span>
                {{ exception.title }}
              </div>
              <div class="exception-meta">
                <span class="exception-type-tag">{{ getExceptionTypeLabel(exception.type) }}</span>
                <span class="exception-time">{{ formatTime(exception.created_at) }}</span>
              </div>
            </div>
          </div>
          
          <el-empty v-else description="暂无异常" />
        </el-card>

        <el-card>
          <template #header>
            <div class="card-header">
              <span class="card-title">最近通知</span>
            </div>
          </template>
          
          <div v-if="recentNotifications.length > 0" class="notification-list">
            <div 
              v-for="notif in recentNotifications.slice(0, 5)" 
              :key="notif.id"
              class="notification-item"
              :class="{ 'is-unread': !notif.is_read }"
              @click="markAsRead(notif)"
            >
              <div class="notification-title">{{ notif.title }}</div>
              <div class="notification-content">{{ notif.content }}</div>
              <div class="notification-time">{{ formatTime(notif.created_at) }}</div>
            </div>
          </div>
          
          <el-empty v-else description="暂无通知" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import api from '@/api'
import dayjs from 'dayjs'

const userStore = useUserStore()

const loading = ref(false)
const statusBoard = ref([])
const myTasks = ref([])
const exceptions = ref([])
const recentNotifications = ref([])

const stats = computed(() => ({
  projects: {
    total: statusBoard.value.reduce((sum, col) => sum + col.projects.length, 0)
  },
  myTasks: {
    total: myTasks.value.length
  },
  exceptions: {
    pending: exceptions.value.filter(e => e.status === 'pending').length
  },
  notifications: {
    unread: recentNotifications.value.filter(n => !n.is_read).length
  }
}))

const fetchDashboard = async () => {
  loading.value = true
  try {
    const response = await api.get('/dashboard')
    if (response.success) {
      const data = response.data
      statusBoard.value = data.projectBoard || []
      myTasks.value = data.myTasks || []
      exceptions.value = data.exceptions || []
      recentNotifications.value = data.recentNotifications || []
    }
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
  } finally {
    loading.value = false
  }
}

const getPriorityType = (priority) => {
  const map = {
    high: 'danger',
    medium: 'warning',
    low: 'success'
  }
  return map[priority] || 'info'
}

const getPriorityLabel = (priority) => {
  const map = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级'
  }
  return map[priority] || priority
}

const getExceptionTypeLabel = (type) => {
  const map = {
    edit_conflict: '编辑冲突',
    license_expired: '授权过期',
    audit_rejected: '审核驳回',
    version_rollback: '版本回退',
    link_expired: '外链失效',
    task_overdue: '任务逾期',
    milestone_at_risk: '里程碑风险',
    approval_pending: '待审批'
  }
  return map[type] || type
}

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('MM-DD HH:mm')
}

const markAsRead = async (notif) => {
  if (notif.is_read) return
  try {
    await api.put(`/dashboard/notifications/${notif.id}/read`)
    notif.is_read = 1
  } catch (error) {
    console.error('标记已读失败:', error)
  }
}

onMounted(() => {
  fetchDashboard()
})
</script>

<style scoped>
.dashboard-page {
  width: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.stat-icon {
  font-size: 48px;
  opacity: 0.3;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-weight: 600;
  color: #303133;
}

.card-link {
  color: #409eff;
  font-size: 12px;
  text-decoration: none;
}

.card-link:hover {
  text-decoration: underline;
}

.status-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.status-column {
  min-width: 200px;
  flex-shrink: 0;
}

.status-column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 12px;
}

.status-name {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}

.status-count {
  background: #e4e7ed;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #606266;
}

.mini-project-card {
  background: white;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e4e7ed;
  text-decoration: none;
  display: block;
  transition: all 0.2s;
}

.mini-project-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.mini-project-name {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-project-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.mini-project-no {
  color: #909399;
}

.mini-project-progress {
  color: #409eff;
  font-weight: 500;
}

.empty-column {
  text-align: center;
  padding: 24px;
  color: #909399;
  font-size: 12px;
}

.empty-column .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
  display: block;
}

.more-projects {
  text-align: center;
  color: #909399;
  font-size: 12px;
  padding: 8px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.task-name {
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-project {
  color: #909399;
  font-size: 12px;
  flex-shrink: 0;
}

.exception-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exception-item {
  padding: 12px;
  background: white;
  border-radius: 6px;
  border-left: 4px solid #f56c6c;
}

.exception-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 6px;
}

.exception-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
}

.exception-type-tag {
  color: #909399;
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 4px;
}

.exception-time {
  color: #c0c4cc;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notification-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.notification-item:hover {
  background: #ecf5ff;
}

.notification-item.is-unread {
  background: white;
  border-left: 3px solid #409eff;
}

.notification-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.notification-content {
  font-size: 12px;
  color: #606266;
  margin-bottom: 6px;
  line-height: 1.5;
}

.notification-time {
  font-size: 11px;
  color: #c0c4cc;
}
</style>
