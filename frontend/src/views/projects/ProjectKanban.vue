<template>
  <div class="kanban-page">
    <div class="page-header flex justify-between items-center mb-4">
      <div>
        <el-breadcrumb separator="/" class="mb-2">
          <el-breadcrumb-item :to="{ path: '/projects' }">项目列表</el-breadcrumb-item>
          <el-breadcrumb-item>{{ project?.name }}</el-breadcrumb-item>
          <el-breadcrumb-item>任务看板</el-breadcrumb-item>
        </el-breadcrumb>
        <h2 class="page-title">任务看板</h2>
      </div>
      <div class="header-actions">
        <el-button @click="showGantt">
          <el-icon><Calendar /></el-icon>
          甘特图
        </el-button>
        <el-button
          type="primary"
          @click="showCreateTaskDialog = true"
          v-if="canEdit"
        >
          <el-icon><Plus /></el-icon>
          新建任务
        </el-button>
      </div>
    </div>

    <div v-loading="loading" class="kanban-container">
      <div 
        v-for="column in columns" 
        :key="column.id"
        class="kanban-column"
      >
        <div class="kanban-column-header">
          <span class="kanban-column-title">{{ column.name }}</span>
          <span class="kanban-column-count">{{ column.tasks.length }}</span>
        </div>
        
        <draggable
          v-model="column.tasks"
          group="tasks"
          animation="150"
          handle=".task-drag-handle"
          ghost-class="dragging-ghost"
          chosen-class="dragging-chosen"
          @end="handleDrop(column, $event)"
          class="kanban-task-list"
        >
          <div
            v-for="task in column.tasks"
            :key="task.id"
            class="kanban-task-card"
            @click="handleTaskClick(task)"
          >
            <div class="task-drag-handle">
              <el-icon><Rank /></el-icon>
            </div>
            
            <div class="kanban-task-title">{{ task.name }}</div>
            
            <div class="kanban-task-tags" v-if="task.tags && task.tags.length > 0">
              <el-tag
                v-for="tag in task.tags.slice(0, 2)"
                :key="tag"
                size="small"
                effect="plain"
              >
                {{ tag }}
              </el-tag>
              <span v-if="task.tags.length > 2" class="more-tags">
                +{{ task.tags.length - 2 }}
              </span>
            </div>
            
            <div class="kanban-task-footer">
              <div class="task-actions">
                <el-tag
                  :type="getPriorityType(task.priority)"
                  size="small"
                  effect="light"
                >
                  {{ getPriorityLabel(task.priority) }}
                </el-tag>
              </div>
              
              <div class="task-assignee">
                <div v-if="task.assignee_name" class="user-avatar-mini">
                  {{ task.assignee_name.charAt(0) }}
                </div>
                <span v-else class="no-assignee">
                  <el-icon><User /></el-icon>
                </span>
              </div>
            </div>
          </div>
          
          <div v-if="column.tasks.length === 0" class="empty-column">
            <el-icon><Plus /></el-icon>
            <span>拖拽任务到此处</span>
          </div>
        </draggable>
      </div>
    </div>

    <el-dialog
      v-model="showCreateTaskDialog"
      title="新建任务"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="createTaskFormRef"
        :model="createTaskForm"
        :rules="createTaskRules"
        label-width="80px"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="createTaskForm.name" placeholder="请输入任务名称" />
        </el-form-item>
        
        <el-form-item label="任务描述">
          <el-input
            v-model="createTaskForm.description"
            type="textarea"
            :rows="2"
            placeholder="请输入任务描述"
          />
        </el-form-item>
        
        <el-form-item label="优先级" prop="priority">
          <el-select v-model="createTaskForm.priority" placeholder="请选择优先级" style="width: 100%">
            <el-option label="高优先级" value="high" />
            <el-option label="中优先级" value="medium" />
            <el-option label="低优先级" value="low" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="负责人">
          <el-select v-model="createTaskForm.assignee_id" placeholder="请选择负责人" filterable clearable style="width: 100%">
            <el-option
              v-for="user in users"
              :key="user.id"
              :label="user.name"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="createTaskForm.due_date"
            type="date"
            placeholder="选择截止日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="预估工时">
          <el-input-number
            v-model="createTaskForm.estimated_hours"
            :min="0"
            placeholder="预估工时(小时)"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="任务列">
          <el-select v-model="createTaskForm.column_id" placeholder="请选择任务列" style="width: 100%">
            <el-option
              v-for="col in columns"
              :key="col.id"
              :label="col.name"
              :value="col.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCreateTaskDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreateTask">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="showTaskDetail"
      title="任务详情"
      width="600px"
    >
      <el-descriptions :column="1" border v-if="currentTask">
        <el-descriptions-item label="任务名称">{{ currentTask.name }}</el-descriptions-item>
        <el-descriptions-item label="任务编号">{{ currentTask.task_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(currentTask.status)">
            {{ getStatusLabel(currentTask.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityType(currentTask.priority)">
            {{ getPriorityLabel(currentTask.priority) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="负责人">{{ currentTask.assignee_name || '未分配' }}</el-descriptions-item>
        <el-descriptions-item label="报告人">{{ currentTask.reporter_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="截止日期">{{ currentTask.due_date || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="预估工时">{{ currentTask.estimated_hours || '-' }} 小时</el-descriptions-item>
        <el-descriptions-item label="实际工时">{{ currentTask.actual_hours || '-' }} 小时</el-descriptions-item>
        <el-descriptions-item label="进度">
          <el-progress :percentage="currentTask.progress || 0" />
        </el-descriptions-item>
        <el-descriptions-item label="任务描述" v-if="currentTask.description">
          {{ currentTask.description }}
        </el-descriptions-item>
      </el-descriptions>
      
      <template #footer>
        <el-button @click="showTaskDetail = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import draggable from 'vuedraggable'
import api from '@/api'

const route = useRoute()
const router = useRouter()

const projectId = computed(() => route.params.id)
const loading = ref(false)
const creating = ref(false)
const project = ref(null)
const columns = ref([])
const users = ref([])
const showCreateTaskDialog = ref(false)
const showTaskDetail = ref(false)
const currentTask = ref(null)
const createTaskFormRef = ref(null)

const canEdit = computed(() => {
  return true
})

const createTaskForm = reactive({
  name: '',
  description: '',
  priority: 'medium',
  assignee_id: '',
  due_date: '',
  estimated_hours: undefined,
  column_id: ''
})

const createTaskRules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' }
  ]
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
    high: '高',
    medium: '中',
    low: '低'
  }
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

const fetchKanban = async () => {
  loading.value = true
  try {
    const response = await api.get(`/tasks/kanban/${projectId.value}`)
    if (response.success) {
      columns.value = response.data || []
    }
  } catch (error) {
    console.error('获取看板数据失败:', error)
    ElMessage.error('获取看板数据失败')
  } finally {
    loading.value = false
  }
}

const fetchUsers = async () => {
  try {
    const response = await api.get('/auth/users')
    if (response.success) {
      users.value = response.data || []
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

const handleDrop = async (column, event) => {
  const { from, to, item } = event
  const task = item.element
  const taskId = item.dataset.id || task.id
  
  if (!taskId) return
  
  const newIndex = to.index
  const newColumnId = column.id
  
  try {
    await api.post(`/tasks/${taskId}/move`, {
      column_id: newColumnId,
      index: newIndex
    })
    ElMessage.success('任务状态已更新')
    fetchKanban()
  } catch (error) {
    console.error('移动任务失败:', error)
    ElMessage.error('移动任务失败')
    fetchKanban()
  }
}

const handleCreateTask = async () => {
  const valid = await createTaskFormRef.value.validate().catch(() => false)
  if (!valid) return

  creating.value = true
  try {
    const data = {
      ...createTaskForm,
      project_id: projectId.value
    }
    
    const response = await api.post('/tasks', data)
    if (response.success) {
      ElMessage.success('任务创建成功')
      showCreateTaskDialog.value = false
      resetCreateTaskForm()
      fetchKanban()
    }
  } catch (error) {
    console.error('创建任务失败:', error)
    ElMessage.error(error.message || '创建任务失败')
  } finally {
    creating.value = false
  }
}

const resetCreateTaskForm = () => {
  createTaskForm.name = ''
  createTaskForm.description = ''
  createTaskForm.priority = 'medium'
  createTaskForm.assignee_id = ''
  createTaskForm.due_date = ''
  createTaskForm.estimated_hours = undefined
  createTaskForm.column_id = columns.value[0]?.id || ''
}

const handleTaskClick = (task) => {
  currentTask.value = task
  showTaskDetail.value = true
}

const showGantt = () => {
  router.push(`/projects/${projectId.value}/gantt`)
}

onMounted(() => {
  fetchProject()
  fetchKanban()
  fetchUsers()
})
</script>

<style scoped>
.kanban-page {
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

.kanban-container {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 16px 0;
}

.kanban-column {
  min-width: 300px;
  max-width: 300px;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.kanban-column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 0 8px;
}

.kanban-column-title {
  font-weight: 600;
  color: #303133;
}

.kanban-column-count {
  background: #e4e7ed;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  color: #606266;
}

.kanban-task-list {
  flex: 1;
  min-height: 100px;
}

.kanban-task-card {
  background: white;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 8px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.2s;
}

.kanban-task-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.task-drag-handle {
  color: #c0c4cc;
  font-size: 16px;
  cursor: grab;
  margin-bottom: 8px;
}

.task-drag-handle:active {
  cursor: grabbing;
}

.kanban-task-title {
  font-weight: 500;
  margin-bottom: 8px;
  color: #303133;
  line-height: 1.5;
}

.kanban-task-tags {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.more-tags {
  font-size: 12px;
  color: #909399;
  padding: 0 4px;
}

.kanban-task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-assignee {
  display: flex;
  align-items: center;
}

.user-avatar-mini {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 10px;
  font-weight: 500;
}

.no-assignee {
  color: #c0c4cc;
  font-size: 18px;
}

.empty-column {
  text-align: center;
  padding: 24px;
  color: #c0c4cc;
  font-size: 12px;
  border: 2px dashed #e4e7ed;
  border-radius: 6px;
  min-height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.empty-column .el-icon {
  font-size: 24px;
}

.dragging-ghost {
  opacity: 0.5;
  background: #f4f4f5;
}

.dragging-chosen {
  transform: rotate(3deg);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}
</style>
