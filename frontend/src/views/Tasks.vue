<template>
  <div class="tasks-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>任务列表</span>
          <el-button type="primary" @click="goToCreate" v-if="userStore.allowedActions.includes('create')">
            <el-icon><Plus /></el-icon> 新建任务
          </el-button>
        </div>
      </template>
      
      <el-form :inline="true" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="loadTasks">
            <el-option label="草稿" value="draft" />
            <el-option label="待配置" value="pending_config" />
            <el-option label="待触发" value="pending_trigger" />
            <el-option label="待进度" value="pending_progress" />
            <el-option label="待奖励" value="pending_reward" />
            <el-option label="待分析" value="pending_analysis" />
            <el-option label="已完成" value="completed" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.task_type" placeholder="全部类型" clearable @change="loadTasks">
            <el-option label="日常任务" value="daily" />
            <el-option label="主线任务" value="main" />
            <el-option label="支线任务" value="side" />
            <el-option label="活动任务" value="event" />
            <el-option label="成就任务" value="achievement" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button @click="loadTasks">
            <el-icon><Search /></el-icon> 查询
          </el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tasks" stripe v-loading="loading">
        <el-table-column prop="task_name" label="任务名称" min-width="150" />
        <el-table-column prop="task_code" label="任务代码" width="150" />
        <el-table-column prop="task_type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getTypeName(row.task_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target_count" label="目标" width="80" />
        <el-table-column prop="priority" label="优先级" width="80">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">{{ row.priority }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusName(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="viewDetail(row)">详情</el-button>
            <el-button 
              link 
              type="success" 
              @click="configureTask(row)" 
              v-if="row.status === 'draft' && userStore.allowedActions.includes('update')"
            >
              配置
            </el-button>
            <el-button 
              link 
              type="primary" 
              @click="publishTask(row)" 
              v-if="row.status === 'pending_config' && userStore.allowedActions.includes('publish')"
            >
              发布
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '../stores/user'
import { taskApi } from '../api'
import { Plus, Search } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const tasks = ref([])
const loading = ref(false)
const filters = ref({
  status: '',
  task_type: ''
})

const goToCreate = () => {
  router.push('/tasks/create')
}

const viewDetail = (row) => {
  router.push(`/tasks/${row.task_uuid}`)
}

const configureTask = async (row) => {
  try {
    await taskApi.configureTask(row.task_uuid)
    ElMessage.success('任务配置完成')
    loadTasks()
  } catch (error) {
    console.error('配置任务失败:', error)
  }
}

const publishTask = async (row) => {
  try {
    await ElMessageBox.confirm('确定要发布此任务吗？发布后玩家将可以触发该任务。', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await taskApi.publishTask(row.task_uuid)
    ElMessage.success('任务发布成功')
    loadTasks()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布任务失败:', error)
    }
  }
}

const loadTasks = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.task_type) params.task_type = filters.value.task_type
    
    const result = await taskApi.getTasks(params)
    tasks.value = result.data
  } catch (error) {
    console.error('加载任务列表失败:', error)
  } finally {
    loading.value = false
  }
}

const getTypeName = (type) => {
  const names = {
    'daily': '日常',
    'main': '主线',
    'side': '支线',
    'event': '活动',
    'achievement': '成就'
  }
  return names[type] || type
}

const getPriorityType = (priority) => {
  if (priority >= 9) return 'danger'
  if (priority >= 6) return 'warning'
  if (priority >= 3) return 'primary'
  return 'info'
}

const getStatusType = (status) => {
  const types = {
    'draft': 'info',
    'pending_config': 'warning',
    'pending_trigger': 'primary',
    'pending_progress': 'info',
    'pending_reward': 'success',
    'pending_analysis': 'warning',
    'completed': 'success',
    'archived': 'info'
  }
  return types[status] || 'info'
}

const getStatusName = (status) => {
  const names = {
    'draft': '草稿',
    'pending_config': '待配置',
    'pending_trigger': '待触发',
    'pending_progress': '待进度',
    'pending_reward': '待奖励',
    'pending_analysis': '待分析',
    'completed': '已完成',
    'archived': '已归档'
  }
  return names[status] || status
}

onMounted(() => {
  loadTasks()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-form {
  margin-bottom: 16px;
}
</style>
