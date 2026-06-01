<template>
  <div class="executions">
    <div class="page-header">
      <h2>执行任务</h2>
    </div>
    
    <el-card>
      <el-form :inline="true" class="filter-form">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable>
            <el-option label="待执行" value="pending" />
            <el-option label="执行中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item label="配置">
          <el-select v-model="filters.config_id" placeholder="全部" clearable>
            <el-option v-for="c in configs" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
      
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="id" label="任务ID" width="200">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/executions/tasks/${row.id}`)">
              {{ row.id }}
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="config_name" label="配置名称" width="150" />
        <el-table-column prop="app_name" label="应用" width="120" />
        <el-table-column prop="task_type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.task_type === 'manual' ? '手动' : row.task_type === 'retry' ? '重试' : '自动' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]" size="small">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="创建人" width="120" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" link @click="$router.push(`/executions/tasks/${row.id}`)">
              详情
            </el-button>
            <el-button size="small" type="success" link @click="retryTask(row.id)">
              重试
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { executions, configs as configApi } from '@/api'

const list = ref([])
const configs = ref([])
const loading = ref(false)

const filters = reactive({
  status: '',
  config_id: ''
})

const statusType = {
  pending: 'info',
  running: 'warning',
  completed: 'success',
  failed: 'danger'
}

const statusText = {
  pending: '待执行',
  running: '执行中',
  completed: '已完成',
  failed: '失败'
}

const formatTime = (t) => t ? new Date(t).toLocaleString() : '-'

const loadData = async () => {
  loading.value = true
  try {
    const result = await executions.listTasks(filters)
    list.value = result.tasks || []
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

const loadConfigs = async () => {
  configs.value = await configApi.list()
}

const resetFilters = () => {
  filters.status = ''
  filters.config_id = ''
  loadData()
}

const retryTask = async (taskId) => {
  try {
    await executions.retryTask(taskId)
    ElMessage.success('重试任务已提交')
    loadData()
  } catch (e) {
    ElMessage.error(e.error || '重试失败')
  }
}

onMounted(() => {
  loadData()
  loadConfigs()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
}

.filter-form {
  margin-bottom: 20px;
}
</style>
