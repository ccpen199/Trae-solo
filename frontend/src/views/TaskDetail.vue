<template>
  <div class="task-detail-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>任务详情</span>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>
      
      <el-descriptions :column="2" border v-if="task">
        <el-descriptions-item label="任务名称">{{ task.task_name }}</el-descriptions-item>
        <el-descriptions-item label="任务代码">{{ task.task_code }}</el-descriptions-item>
        <el-descriptions-item label="任务类型">{{ getTypeName(task.task_type) }}</el-descriptions-item>
        <el-descriptions-item label="优先级">{{ task.priority }}</el-descriptions-item>
        <el-descriptions-item label="触发事件">{{ task.trigger_event_code }}</el-descriptions-item>
        <el-descriptions-item label="目标次数">{{ task.target_count }}</el-descriptions-item>
        <el-descriptions-item label="是否日常">{{ task.is_daily ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="是否可重复">{{ task.is_repeatable ? '是' : '否' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(task.status)">{{ getStatusName(task.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ task.created_at }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ task.description || '无' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <span>关联奖励</span>
      </template>
      <el-table :data="rewards" stripe>
        <el-table-column prop="reward_name" label="奖励名称" />
        <el-table-column prop="reward_type" label="类型">
          <template #default="{ row }">
            <el-tag size="small">{{ row.reward_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="reward_value" label="价值" />
        <el-table-column prop="reward_quantity" label="数量" />
      </el-table>
    </el-card>

    <el-card style="margin-top: 20px;">
      <template #header>
        <span>可用操作</span>
      </template>
      <div class="actions">
        <el-button 
          type="success" 
          @click="configureTask" 
          v-if="task?.status === 'draft'"
        >
          完成配置
        </el-button>
        <el-button 
          type="primary" 
          @click="publishTask" 
          v-if="task?.status === 'pending_config'"
        >
          发布任务
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { taskApi } from '../api'

const router = useRouter()
const route = useRoute()

const task = ref(null)
const rewards = ref([])
const loading = ref(false)

const goBack = () => {
  router.push('/tasks')
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

const configureTask = async () => {
  try {
    await taskApi.configureTask(route.params.taskUuid)
    ElMessage.success('任务配置完成')
    loadTask()
  } catch (error) {
    console.error('配置任务失败:', error)
  }
}

const publishTask = async () => {
  try {
    await ElMessageBox.confirm('确定要发布此任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await taskApi.publishTask(route.params.taskUuid)
    ElMessage.success('任务发布成功')
    loadTask()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('发布任务失败:', error)
    }
  }
}

const loadTask = async () => {
  loading.value = true
  try {
    const result = await taskApi.getTask(route.params.taskUuid)
    task.value = result.data
    rewards.value = result.data.rewards || []
  } catch (error) {
    console.error('加载任务失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTask()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  gap: 12px;
}
</style>
