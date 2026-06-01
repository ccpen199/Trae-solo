<template>
  <div class="task-detail">
    <div class="page-header">
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>任务详情</h2>
      <el-button type="success" @click="retryTask">
        <el-icon><Refresh /></el-icon> 重试
      </el-button>
    </div>
    
    <el-card v-if="task">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="任务ID">{{ task.id }}</el-descriptions-item>
        <el-descriptions-item label="配置名称">{{ task.config_name }}</el-descriptions-item>
        <el-descriptions-item label="应用">{{ task.app_name }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag size="small">{{ task.task_type === 'manual' ? '手动' : '自动' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType[task.status]" size="small">{{ statusText[task.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">{{ task.priority }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ task.creator_name }}</el-descriptions-item>
        <el-descriptions-item label="目标URL">{{ task.config_url }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatTime(task.created_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
    
    <el-card style="margin-top: 20px;">
      <template #header><span>请求体</span></template>
      <pre class="json-preview">{{ task?.payload || '{}' }}</pre>
    </el-card>
    
    <el-card style="margin-top: 20px;">
      <template #header><span>执行日志</span></template>
      <el-table :data="task?.logs || []" size="small">
        <el-table-column prop="id" label="日志ID" width="200" />
        <el-table-column prop="request_method" label="方法" width="80">
          <template #default="{ row }">
            <el-tag size="small" type="primary">{{ row.request_method }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="response_status" label="状态码" width="100">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">{{ row.response_status || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="100">{{ row.duration }}ms</el-table-column>
        <el-table-column prop="retry_count" label="重试" width="80" />
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-card style="margin-top: 20px;">
      <template #header><span>异常记录</span></template>
      <el-table :data="task?.exceptions || []" size="small" v-if="task?.exceptions?.length">
        <el-table-column prop="error_type" label="错误类型" width="150" />
        <el-table-column prop="error_message" label="错误信息" show-overflow-tooltip />
        <el-table-column prop="handled" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.handled ? 'success' : 'warning'" size="small">{{ row.handled ? '已处理' : '待处理' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无异常记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { executions } from '@/api'

const route = useRoute()
const task = ref(null)

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
  try {
    task.value = await executions.getTask(route.params.id)
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const retryTask = async () => {
  try {
    await executions.retryTask(route.params.id)
    ElMessage.success('重试任务已提交')
    loadData()
  } catch (e) {
    ElMessage.error(e.error || '重试失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  flex: 1;
}

.json-preview {
  background: #1e293b;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  margin: 0;
  white-space: pre-wrap;
  max-height: 300px;
  overflow: auto;
}
</style>
