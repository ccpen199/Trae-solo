<template>
  <div>
    <div class="page-card">
      <h2 class="page-title">总览看板</h2>
      <div class="stat-grid" v-if="stats">
        <div class="stat-card">
          <div class="label">应用总数</div>
          <div class="value primary">{{ stats.applications }}</div>
        </div>
        <div class="stat-card">
          <div class="label">活跃应用</div>
          <div class="value success">{{ stats.activeApps }}</div>
        </div>
        <div class="stat-card">
          <div class="label">待处理任务</div>
          <div class="value warning">{{ stats.tasksCreated }}</div>
        </div>
        <div class="stat-card">
          <div class="label">已执行任务</div>
          <div class="value success">{{ stats.tasksExecuted }}</div>
        </div>
        <div class="stat-card">
          <div class="label">任务失败</div>
          <div class="value danger">{{ stats.tasksFailed }}</div>
        </div>
        <div class="stat-card">
          <div class="label">未结变更单</div>
          <div class="value warning">{{ stats.ordersOpen }}</div>
        </div>
        <div class="stat-card">
          <div class="label">未处理告警</div>
          <div class="value danger">{{ stats.alertsOpen }}</div>
        </div>
        <div class="stat-card">
          <div class="label">严重告警</div>
          <div class="value danger">{{ stats.alertsCritical }}</div>
        </div>
        <div class="stat-card">
          <div class="label">今日执行</div>
          <div class="value primary">{{ stats.executionsToday }}</div>
        </div>
      </div>
    </div>

    <div class="page-card">
      <h2 class="page-title">最近任务</h2>
      <el-table :data="stats?.recentTasks || []" size="small" stripe>
        <el-table-column prop="task_no" label="任务编号" width="200" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="app_name" label="应用" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/tasks/${row.id}`)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="page-card">
      <h2 class="page-title">最近变更单</h2>
      <el-table :data="stats?.recentOrders || []" size="small" stripe>
        <el-table-column prop="order_no" label="变更编号" width="200" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="app_name" label="应用" width="150" />
        <el-table-column prop="risk_level" label="风险" width="80">
          <template #default="{ row }">
            <el-tag :type="riskType(row.risk_level)" size="small">{{ row.risk_level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button link type="primary" @click="$router.push(`/change-orders/${row.id}`)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="page-card">
      <h2 class="page-title">最近告警</h2>
      <el-table :data="stats?.recentAlerts || []" size="small" stripe>
        <el-table-column prop="alert_no" label="告警编号" width="200" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="severity" label="严重度" width="80">
          <template #default="{ row }">
            <el-tag :type="riskType(row.severity)" size="small">{{ row.severity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
      </el-table>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { DashboardAPI } from '../api'

const stats = ref(null)
onMounted(async () => {
  const res = await DashboardAPI.stats()
  if (res?.code === 0) stats.value = res.data
})

function statusType(s) {
  return { active: 'success', inactive: 'info', pending: 'warning', submitted: 'warning',
    approved: 'success', executed: 'success', failed: 'danger', rejected: 'danger',
    closed: 'info', reviewing: 'warning', open: 'danger', watching: 'warning',
    blocked: 'danger', created: 'info', draft: 'info' }[s] || ''
}
function riskType(s) {
  return { low: 'success', medium: 'warning', high: 'danger', critical: 'danger',
    info: 'info' }[s] || ''
}
</script>
