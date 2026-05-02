<template>
  <div class="todos-page">
    <div class="page-header flex justify-between items-center mb-4">
      <div>
        <h2 class="page-title">我的待办</h2>
        <p class="page-subtitle">查看和处理分配给您的任务和事项</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <el-row :gutter="20" class="mb-4">
      <el-col :span="8">
        <div class="stat-card stat-todo">
          <div class="stat-icon-wrapper">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todo }}</div>
            <div class="stat-label">待办任务</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card stat-progress">
          <div class="stat-icon-wrapper">
            <el-icon><Loading /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.inProgress }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card stat-overdue">
          <div class="stat-icon-wrapper">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.overdue }}</div>
            <div class="stat-label">已逾期</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-card>
      <template #header>
        <div class="card-header flex justify-between items-center">
          <div class="filter-bar">
            <el-radio-group v-model="filterStatus" @change="refreshData">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="todo">待办</el-radio-button>
              <el-radio-button label="in_progress">进行中</el-radio-button>
              <el-radio-button label="review">待审核</el-radio-button>
              <el-radio-button label="done">已完成</el-radio-button>
            </el-radio-group>
          </div>
          <div class="view-toggle">
            <el-radio-group v-model="viewMode">
              <el-radio-button label="list">
                <el-icon><List /></el-icon>
              </el-radio-button>
              <el-radio-button label="board">
                <el-icon><Grid /></el-icon>
              </el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </template>

      <div v-loading="loading">
        <template v-if="viewMode === 'list'">
          <div v-if="todos.length > 0" class="todo-list">
            <div
              v-for="todo in todos"
              :key="todo.id"
              class="todo-item"
              :class="{ 'is-done': todo.status === 'done', 'is-overdue': isOverdue(todo) }"
            >
              <div class="todo-checkbox" @click="toggleStatus(todo)">
                <el-icon v-if="todo.status === 'done'" class="check-icon"><CircleCheck /></el-icon>
                <div v-else class="empty-circle"></div>
              </div>
              
              <div class="todo-content">
                <div class="todo-header">
                  <span class="todo-title">{{ todo.name }}</span>
                  <div class="todo-tags">
                    <el-tag :type="getPriorityType(todo.priority)" size="small" effect="light">
                      {{ getPriorityLabel(todo.priority) }}
                    </el-tag>
                    <el-tag :type="getStatusType(todo.status)" size="small">
                      {{ getStatusLabel(todo.status) }}
                    </el-tag>
                  </div>
                </div>
                
                <div class="todo-meta">
                  <span class="todo-project">
                    <el-icon><Folder /></el-icon>
                    {{ todo.project_name || '-' }}
                  </span>
                  <span class="todo-assignee" v-if="todo.assignee_name">
                    <el-icon><User /></el-icon>
                    {{ todo.assignee_name }}
                  </span>
                  <span class="todo-due" :class="{ 'overdue': isOverdue(todo) }">
                    <el-icon><Calendar /></el-icon>
                    {{ todo.due_date || '未设置截止日期' }}
                    <span v-if="isOverdue(todo)" class="overdue-badge">已逾期</span>
                  </span>
                  <span class="todo-time">
                    <el-icon><Clock /></el-icon>
                    {{ formatTime(todo.created_at) }}
                  </span>
                </div>

                <div v-if="todo.description" class="todo-description">
                  {{ todo.description }}
                </div>
              </div>

              <div class="todo-actions">
                <router-link :to="`/projects/${todo.project_id}/kanban`">
                  <el-button type="primary" link size="small">
                    <el-icon><View /></el-icon>
                    查看
                  </el-button>
                </router-link>
              </div>
            </div>
          </div>
        </template>

        <template v-else>
          <div class="board-view">
            <div v-for="column in boardColumns" :key="column.status" class="board-column">
              <div class="board-column-header">
                <span class="column-name">{{ column.name }}</span>
                <el-tag :type="column.tagType" size="small">{{ column.tasks.length }}</el-tag>
              </div>
              
              <div class="board-tasks">
                <div
                  v-for="task in column.tasks"
                  :key="task.id"
                  class="board-task-card"
                  :class="{ 'is-overdue': isOverdue(task) }"
                >
                  <div class="task-card-title">{{ task.name }}</div>
                  <div class="task-card-meta">
                    <el-tag :type="getPriorityType(task.priority)" size="small">
                      {{ getPriorityLabel(task.priority) }}
                    </el-tag>
                    <span class="task-project">{{ task.project_name }}</span>
                  </div>
                  <div v-if="task.due_date" class="task-card-due" :class="{ 'overdue': isOverdue(task) }">
                    <el-icon><Calendar /></el-icon>
                    {{ task.due_date }}
                  </div>
                </div>
                
                <el-empty v-if="column.tasks.length === 0" :description="`暂无${column.name}任务`" />
              </div>
            </div>
          </div>
        </template>

        <el-empty v-if="todos.length === 0" description="暂无待办任务" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const todos = ref([])
const filterStatus = ref('')
const viewMode = ref('list')

const boardColumns = computed(() => [
  { status: 'todo', name: '待办', tagType: 'info', tasks: todos.value.filter(t => t.status === 'todo') },
  { status: 'in_progress', name: '进行中', tagType: 'primary', tasks: todos.value.filter(t => t.status === 'in_progress') },
  { status: 'review', name: '待审核', tagType: 'warning', tasks: todos.value.filter(t => t.status === 'review') },
  { status: 'done', name: '已完成', tagType: 'success', tasks: todos.value.filter(t => t.status === 'done') }
])

const stats = computed(() => {
  const list = todos.value
  return {
    todo: list.filter(t => t.status === 'todo').length,
    inProgress: list.filter(t => t.status === 'in_progress').length,
    overdue: list.filter(t => isOverdue(t)).length
  }
})

const fetchTodos = async () => {
  loading.value = true
  try {
    const params = {}
    if (filterStatus.value) params.status = filterStatus.value

    const response = await api.get('/dashboard/todos', { params })
    if (response.success) {
      todos.value = response.data || []
    }
  } catch (error) {
    console.error('获取待办列表失败:', error)
    ElMessage.error('获取待办列表失败')
  } finally {
    loading.value = false
  }
}

const refreshData = () => {
  fetchTodos()
}

const isOverdue = (todo) => {
  if (!todo.due_date || todo.status === 'done') return false
  return dayjs(todo.due_date).isBefore(dayjs(), 'day')
}

const getPriorityType = (priority) => {
  const map = { high: 'danger', medium: 'warning', low: 'success' }
  return map[priority] || 'info'
}

const getPriorityLabel = (priority) => {
  const map = { high: '高', medium: '中', low: '低' }
  return map[priority] || priority
}

const getStatusType = (status) => {
  const map = {
    todo: 'info',
    in_progress: 'primary',
    review: 'warning',
    done: 'success'
  }
  return map[status] || 'info'
}

const getStatusLabel = (status) => {
  const map = {
    todo: '待办',
    in_progress: '进行中',
    review: '待审核',
    done: '已完成'
  }
  return map[status] || status
}

const formatTime = (time) => {
  if (!time) return ''
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const toggleStatus = async (todo) => {
  if (todo.status === 'done') return
  try {
    const response = await api.put(`/tasks/${todo.id}`, {
      status: 'done',
      progress: 100
    })
    if (response.success) {
      ElMessage.success('任务已标记为完成')
      refreshData()
    }
  } catch (error) {
    console.error('更新任务状态失败:', error)
    ElMessage.error('更新任务状态失败')
  }
}

onMounted(() => {
  fetchTodos()
})
</script>

<style scoped>
.todos-page {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-card.stat-todo {
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
}

.stat-card.stat-progress {
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
}

.stat-card.stat-overdue {
  background: linear-gradient(135deg, #fef0f0 0%, #fde2e2 100%);
}

.stat-icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  background: #409eff;
  font-size: 24px;
}

.stat-card.stat-todo .stat-icon-wrapper {
  background: #909399;
}

.stat-card.stat-progress .stat-icon-wrapper {
  background: #409eff;
}

.stat-card.stat-overdue .stat-icon-wrapper {
  background: #f56c6c;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 13px;
  color: #606266;
  margin-top: 4px;
}

.filter-bar {
  display: flex;
  gap: 12px;
}

.view-toggle {
  display: flex;
  gap: 8px;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.2s;
}

.todo-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.todo-item.is-done {
  opacity: 0.6;
  background: #fafafa;
}

.todo-item.is-overdue {
  border-left: 4px solid #f56c6c;
}

.todo-checkbox {
  cursor: pointer;
  flex-shrink: 0;
  margin-top: 4px;
}

.check-icon {
  font-size: 24px;
  color: #67c23a;
}

.empty-circle {
  width: 24px;
  height: 24px;
  border: 2px solid #c0c4cc;
  border-radius: 50%;
}

.empty-circle:hover {
  border-color: #409eff;
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.todo-title {
  font-weight: 600;
  color: #303133;
  font-size: 15px;
}

.todo-item.is-done .todo-title {
  text-decoration: line-through;
  color: #909399;
}

.todo-tags {
  display: flex;
  gap: 8px;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #909399;
}

.todo-meta > span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.todo-due.overdue {
  color: #f56c6c;
}

.overdue-badge {
  background: #fef0f0;
  color: #f56c6c;
  padding: 0 6px;
  border-radius: 4px;
  margin-left: 4px;
}

.todo-description {
  margin-top: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

.todo-actions {
  flex-shrink: 0;
}

.board-view {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.board-column {
  min-width: 280px;
  flex-shrink: 0;
}

.board-column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px 8px 0 0;
  margin-bottom: 12px;
}

.column-name {
  font-weight: 600;
  color: #303133;
}

.board-tasks {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.board-task-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;
}

.board-task-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.15);
}

.board-task-card.is-overdue {
  border-left: 3px solid #f56c6c;
}

.task-card-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  font-size: 13px;
}

.task-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.task-project {
  font-size: 12px;
  color: #909399;
}

.task-card-due {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #909399;
}

.task-card-due.overdue {
  color: #f56c6c;
}
</style>
