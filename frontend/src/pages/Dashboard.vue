<template>
  <div>
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="4">
        <el-card shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div style="color: #909399; font-size: 14px">应用总数</div>
              <div style="font-size: 28px; font-weight: bold; margin-top: 8px; color: #409eff">{{ stats.applications }}</div>
            </div>
            <el-icon size="40" style="color: #409eff"><App /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div style="color: #909399; font-size: 14px">环境数量</div>
              <div style="font-size: 28px; font-weight: bold; margin-top: 8px; color: #67c23a">{{ stats.environments }}</div>
            </div>
            <el-icon size="40" style="color: #67c23a"><Server /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div style="color: #909399; font-size: 14px">活跃密钥</div>
              <div style="font-size: 28px; font-weight: bold; margin-top: 8px; color: #e6a23c">{{ stats.active_secrets }}</div>
            </div>
            <el-icon size="40" style="color: #e6a23c"><Key /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div style="color: #909399; font-size: 14px">待处理告警</div>
              <div style="font-size: 28px; font-weight: bold; margin-top: 8px; color: #f56c6c">{{ stats.open_alerts }}</div>
            </div>
            <el-icon size="40" style="color: #f56c6c"><Warning /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div style="color: #909399; font-size: 14px">待审批变更</div>
              <div style="font-size: 28px; font-weight: bold; margin-top: 8px; color: #909399">{{ stats.pending_changes }}</div>
            </div>
            <el-icon size="40" style="color: #909399"><Document /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
              <div style="color: #909399; font-size: 14px">执行中任务</div>
              <div style="font-size: 28px; font-weight: bold; margin-top: 8px; color: #9b59b6">{{ stats.running_tasks }}</div>
            </div>
            <el-icon size="40" style="color: #9b59b6"><Loading /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span style="font-weight: bold">最近变更单</span>
              <el-button type="primary" link @click="$router.push('/change-orders')">查看全部</el-button>
            </div>
          </template>
          <el-table v-if="recentChanges.length > 0" :data="recentChanges" size="small">
            <el-table-column prop="change_no" label="变更单号" width="150" />
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div v-else style="padding: 60px 20px; text-align: center; color: #909399">
            <el-icon size="48" style="margin-bottom: 12px; color: #c0c4cc"><Document /></el-icon>
            <div style="font-size: 14px; margin-bottom: 8px">暂无变更单</div>
            <div style="font-size: 12px; color: #c0c4cc; margin-bottom: 16px">接入应用后，可通过变更单管理配置发布流程</div>
            <el-button type="primary" size="small" @click="$router.push('/applications')">前往接入应用</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center">
              <span style="font-weight: bold">最近执行任务</span>
              <el-button type="primary" link @click="$router.push('/tasks')">查看全部</el-button>
            </div>
          </template>
          <el-table v-if="recentTasks.length > 0" :data="recentTasks" size="small">
            <el-table-column prop="task_id" label="任务ID" width="150" />
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getTaskStatusType(row.status)" size="small">{{ getTaskStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div v-else style="padding: 60px 20px; text-align: center; color: #909399">
            <el-icon size="48" style="margin-bottom: 12px; color: #c0c4cc"><Loading /></el-icon>
            <div style="font-size: 14px; margin-bottom: 8px">暂无执行任务</div>
            <div style="font-size: 12px; color: #c0c4cc; margin-bottom: 16px">变更单审批通过后，执行任务将自动生成</div>
            <el-button type="primary" size="small" @click="$router.push('/change-orders')">创建变更单</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { dashboardApi, changeApi, taskApi } from '../api'

const stats = ref({
  applications: 0,
  environments: 0,
  active_secrets: 0,
  open_alerts: 0,
  pending_changes: 0,
  running_tasks: 0
})

const recentChanges = ref([])
const recentTasks = ref([])

async function loadStats() {
  try {
    const res = await dashboardApi.stats()
    stats.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function loadRecentChanges() {
  try {
    const res = await changeApi.list({ page_size: 5 })
    recentChanges.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function loadRecentTasks() {
  try {
    const res = await taskApi.list({ page_size: 5 })
    recentTasks.value = res.data
  } catch (e) {
    console.error(e)
  }
}

function getStatusType(status) {
  const map = { pending: 'warning', approved: 'info', executed: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { pending: '待审批', approved: '已批准', executed: '已执行', rejected: '已拒绝' }
  return map[status] || status
}

function getTaskStatusType(status) {
  const map = { pending: 'info', running: 'warning', success: 'success', failed: 'danger' }
  return map[status] || 'info'
}

function getTaskStatusText(status) {
  const map = { pending: '待执行', running: '执行中', success: '成功', failed: '失败' }
  return map[status] || status
}

onMounted(() => {
  loadStats()
  loadRecentChanges()
  loadRecentTasks()
})
</script>
