<template>
  <div class="gantt-page">
    <div class="page-header flex justify-between items-center mb-4">
      <div>
        <el-breadcrumb separator="/" class="mb-2">
          <el-breadcrumb-item :to="{ path: '/projects' }">项目列表</el-breadcrumb-item>
          <el-breadcrumb-item>{{ project?.name }}</el-breadcrumb-item>
          <el-breadcrumb-item>甘特图</el-breadcrumb-item>
        </el-breadcrumb>
        <h2 class="page-title">项目甘特图</h2>
      </div>
      <div class="header-actions">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回看板
        </el-button>
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <el-card v-loading="loading">
      <div class="gantt-controls mb-4">
        <div class="gantt-stats">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-item">
                <span class="stat-label">总任务数</span>
                <span class="stat-value">{{ ganttData.tasks.length }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <span class="stat-label">已完成</span>
                <span class="stat-value" style="color: #67c23a">{{ completedCount }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <span class="stat-label">进行中</span>
                <span class="stat-value" style="color: #409eff">{{ inProgressCount }}</span>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <span class="stat-label">里程碑数</span>
                <span class="stat-value" style="color: #e6a23c">{{ ganttData.milestones.length }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>

      <div class="gantt-container" ref="ganttContainer">
        <div class="gantt-header">
          <div class="gantt-header-left">任务名称</div>
          <div class="gantt-header-right">时间轴</div>
        </div>
        
        <div class="gantt-body">
          <div class="gantt-timeline-header" v-if="dateHeaders.length > 0">
            <div class="gantt-date-row">
              <div 
                v-for="(date, idx) in dateHeaders" 
                :key="idx"
                class="gantt-date-cell"
                :style="{ width: dayWidth + 'px' }"
              >
                <div class="date-day">{{ date.day }}</div>
                <div class="date-month">{{ date.month }}</div>
              </div>
            </div>
          </div>

          <div class="gantt-rows">
            <div v-if="ganttData.milestones.length > 0" class="gantt-section-title">
              <el-icon><Flag /></el-icon>
              里程碑
            </div>
            
            <div 
              v-for="milestone in ganttData.milestones" 
              :key="milestone.id"
              class="gantt-row"
            >
              <div class="gantt-row-left">
                <div class="task-name milestone-name">
                  <el-tag :type="getMilestoneStatusType(milestone)" size="small">
                    {{ getMilestoneStatusLabel(milestone) }}
                  </el-tag>
                  {{ milestone.name }}
                </div>
              </div>
              <div class="gantt-row-right">
                <div 
                  class="milestone-marker"
                  :style="{ left: getMilestonePosition(milestone) + 'px' }"
                  :title="milestone.name + ' - ' + (milestone.due_date || '未设置')"
                >
                  <el-icon class="milestone-icon"><Flag /></el-icon>
                </div>
              </div>
            </div>

            <div v-if="ganttData.tasks.length > 0" class="gantt-section-title">
              <el-icon><Document /></el-icon>
              任务
            </div>

            <div 
              v-for="task in sortedTasks" 
              :key="task.id"
              class="gantt-row"
              :class="{ 'task-done': task.status === 'done' }"
            >
              <div class="gantt-row-left">
                <div class="task-name">
                  <el-tag :type="getTaskStatusType(task.status)" size="small" effect="light">
                    {{ getTaskStatusLabel(task.status) }}
                  </el-tag>
                  <span class="task-title">{{ task.name }}</span>
                  <span class="task-assignee" v-if="task.assignee_name">
                    ({{ task.assignee_name }})
                  </span>
                </div>
              </div>
              <div class="gantt-row-right">
                <div 
                  v-if="task.start_date || task.due_date"
                  class="task-bar"
                  :class="{ 'task-bar-done': task.status === 'done' }"
                  :style="getTaskBarStyle(task)"
                  :title="`${task.name} | 进度: ${task.progress || 0}%`"
                >
                  <div 
                    class="task-bar-progress" 
                    :style="{ width: `${task.progress || 0}%` }"
                  ></div>
                  <span class="task-bar-label" v-if="getTaskBarWidth(task) > 80">
                    {{ task.progress || 0 }}%
                  </span>
                </div>
                <div v-else class="no-date-indicator">
                  <el-icon><Calendar /></el-icon>
                  <span>未设置日期</span>
                </div>
              </div>
            </div>

            <el-empty v-if="ganttData.tasks.length === 0 && ganttData.milestones.length === 0" description="暂无任务和里程碑数据" />
          </div>
        </div>
      </div>

      <div class="gantt-legend mt-4">
        <div class="legend-item">
          <div class="legend-color task-bar-color"></div>
          <span>进行中</span>
        </div>
        <div class="legend-item">
          <div class="legend-color task-bar-done-color"></div>
          <span>已完成</span>
        </div>
        <div class="legend-item">
          <div class="legend-color milestone-color"></div>
          <span>里程碑</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '@/api'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => route.params.id)
const loading = ref(false)
const project = ref(null)
const ganttData = ref({ tasks: [], milestones: [] })
const dateHeaders = ref([])
const dayWidth = 40

const startDate = ref(null)
const endDate = ref(null)

const completedCount = computed(() => {
  return ganttData.value.tasks.filter(t => t.status === 'done').length
})

const inProgressCount = computed(() => {
  return ganttData.value.tasks.filter(t => t.status === 'in_progress').length
})

const sortedTasks = computed(() => {
  const order = { todo: 0, in_progress: 1, review: 2, done: 3 }
  return [...ganttData.value.tasks].sort((a, b) => {
    return order[a.status] - order[b.status]
  })
})

const fetchProject = async () => {
  try {
    const response = await api.get(`/projects/${projectId.value}`)
    if (response.success) {
      project.value = response.data
    }
  } catch (error) {
    console.error('获取项目信息失败:', error)
  }
}

const fetchGanttData = async () => {
  loading.value = true
  try {
    const response = await api.get(`/tasks/gantt/${projectId.value}`)
    if (response.success) {
      ganttData.value = response.data || { tasks: [], milestones: [] }
      calculateDateRange()
    }
  } catch (error) {
    console.error('获取甘特图数据失败:', error)
    ElMessage.error('获取甘特图数据失败')
  } finally {
    loading.value = false
  }
}

const calculateDateRange = () => {
  const allDates = []
  
  ganttData.value.tasks.forEach(task => {
    if (task.start_date) allDates.push(dayjs(task.start_date))
    if (task.due_date) allDates.push(dayjs(task.due_date))
    if (task.end_date) allDates.push(dayjs(task.end_date))
  })
  
  ganttData.value.milestones.forEach(milestone => {
    if (milestone.due_date) allDates.push(dayjs(milestone.due_date))
  })

  if (allDates.length === 0) {
    const today = dayjs()
    startDate.value = today.subtract(7, 'day')
    endDate.value = today.add(30, 'day')
  } else {
    const minDate = dayjs.min(allDates)
    const maxDate = dayjs.max(allDates)
    startDate.value = minDate.subtract(7, 'day')
    endDate.value = maxDate.add(7, 'day')
  }

  generateDateHeaders()
}

const generateDateHeaders = () => {
  if (!startDate.value || !endDate.value) return
  
  dateHeaders.value = []
  let current = startDate.value.startOf('day')
  const end = endDate.value.endOf('day')

  while (current.isBefore(end) || current.isSame(end)) {
    dateHeaders.value.push({
      day: current.format('DD'),
      month: current.format('MM'),
      date: current.clone()
    })
    current = current.add(1, 'day')
  }
}

const getDatePosition = (dateStr) => {
  if (!dateStr || !startDate.value) return 0
  const date = dayjs(dateStr)
  const diff = date.diff(startDate.value, 'day')
  return Math.max(0, diff * dayWidth + dayWidth / 2)
}

const getTaskBarStyle = (task) => {
  const start = task.start_date ? dayjs(task.start_date) : (task.due_date ? dayjs(task.due_date).subtract(3, 'day') : null)
  const end = task.due_date ? dayjs(task.due_date) : (task.start_date ? dayjs(task.start_date).add(3, 'day') : null)
  
  if (!start || !end) return { left: '0px', width: '0px' }
  
  const left = getDatePosition(start.format('YYYY-MM-DD'))
  const width = Math.max(dayWidth * 2, end.diff(start, 'day') * dayWidth)
  
  return {
    left: left + 'px',
    width: width + 'px'
  }
}

const getTaskBarWidth = (task) => {
  const style = getTaskBarStyle(task)
  return parseInt(style.width) || 0
}

const getMilestonePosition = (milestone) => {
  if (!milestone.due_date) return 50
  return getDatePosition(milestone.due_date) - 10
}

const getTaskStatusType = (status) => {
  const map = {
    todo: 'info',
    in_progress: 'primary',
    review: 'warning',
    done: 'success'
  }
  return map[status] || 'info'
}

const getTaskStatusLabel = (status) => {
  const map = {
    todo: '待办',
    in_progress: '进行中',
    review: '待审核',
    done: '已完成'
  }
  return map[status] || status
}

const getMilestoneStatusType = (milestone) => {
  if (milestone.status === 'completed') return 'success'
  if (milestone.due_date && dayjs(milestone.due_date).isBefore(dayjs())) return 'danger'
  return 'warning'
}

const getMilestoneStatusLabel = (milestone) => {
  if (milestone.status === 'completed') return '已完成'
  if (milestone.due_date && dayjs(milestone.due_date).isBefore(dayjs())) return '已逾期'
  return '进行中'
}

const goBack = () => {
  router.push(`/projects/${projectId.value}/kanban`)
}

const refreshData = () => {
  fetchGanttData()
}

onMounted(() => {
  fetchProject()
  fetchGanttData()
})
</script>

<style scoped>
.gantt-page {
  width: 100%;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 8px 0 0 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.gantt-controls {
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.gantt-container {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.gantt-header {
  display: flex;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.gantt-header-left {
  width: 300px;
  min-width: 300px;
  padding: 12px 16px;
  font-weight: 600;
  color: #303133;
  border-right: 1px solid #e4e7ed;
}

.gantt-header-right {
  flex: 1;
  min-width: 0;
  padding: 12px 16px;
  font-weight: 600;
  color: #303133;
}

.gantt-body {
  display: flex;
  flex-direction: column;
}

.gantt-timeline-header {
  display: flex;
  border-bottom: 1px solid #e4e7ed;
}

.gantt-timeline-header .gantt-row-left {
  background: #fafafa;
}

.gantt-date-row {
  display: flex;
  flex: 1;
  overflow-x: auto;
}

.gantt-date-cell {
  min-width: 40px;
  padding: 8px 0;
  text-align: center;
  border-right: 1px solid #e4e7ed;
  font-size: 12px;
}

.gantt-date-cell:last-child {
  border-right: none;
}

.date-day {
  font-weight: 600;
  color: #303133;
}

.date-month {
  font-size: 10px;
  color: #909399;
}

.gantt-rows {
  display: flex;
  flex-direction: column;
}

.gantt-section-title {
  padding: 12px 16px;
  background: #f5f7fa;
  font-weight: 600;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #e4e7ed;
}

.gantt-row {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  min-height: 48px;
}

.gantt-row:hover {
  background: #fafafa;
}

.gantt-row-left {
  width: 300px;
  min-width: 300px;
  padding: 12px 16px;
  border-right: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
}

.gantt-row-right {
  flex: 1;
  min-width: 0;
  padding: 8px 16px;
  position: relative;
  overflow-x: auto;
}

.task-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #303133;
}

.task-title {
  font-weight: 500;
}

.task-assignee {
  color: #909399;
  font-size: 12px;
}

.milestone-name {
  font-weight: 500;
}

.task-bar {
  position: absolute;
  height: 28px;
  top: 50%;
  transform: translateY(-50%);
  background: #409eff;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.task-bar:hover {
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.task-bar-done {
  background: #95d475;
}

.task-bar-progress {
  position: absolute;
  height: 100%;
  background: rgba(255, 255, 255, 0.3);
  top: 0;
  left: 0;
}

.task-bar-label {
  position: absolute;
  width: 100%;
  text-align: center;
  color: white;
  font-size: 11px;
  font-weight: 500;
  line-height: 28px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.milestone-marker {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.milestone-icon {
  font-size: 20px;
  color: #e6a23c;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
}

.no-date-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #c0c4cc;
}

.task-done .task-title {
  text-decoration: line-through;
  color: #909399;
}

.gantt-legend {
  display: flex;
  gap: 24px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #606266;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.task-bar-color {
  background: #409eff;
}

.task-bar-done-color {
  background: #95d475;
}

.milestone-color {
  background: #e6a23c;
}
</style>
