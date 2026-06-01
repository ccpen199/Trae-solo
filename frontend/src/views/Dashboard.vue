<template>
  <div>
    <div class="page-header">
      <h2 class="page-title">数据看板</h2>
      <el-button type="primary" @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <div class="stat-card">
          <div class="stat-value">{{ overview?.totalCustomers || 0 }}</div>
          <div class="stat-label">客户总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card warning">
          <div class="stat-value">{{ overview?.highRiskCount || 0 }}</div>
          <div class="stat-label">高风险客户</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card info">
          <div class="stat-value">{{ overview?.pendingTasks || 0 }}</div>
          <div class="stat-label">待处理任务</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card success">
          <div class="stat-value">{{ overview?.recoveryRate || 0 }}%</div>
          <div class="stat-label">挽回成功率</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="12">
        <div class="card-wrapper">
          <h3 style="margin-bottom: 16px;">风险等级分布</h3>
          <div ref="riskChartRef" class="chart-container"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-wrapper">
          <h3 style="margin-bottom: 16px;">任务状态分布</h3>
          <div ref="taskChartRef" class="chart-container"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card-wrapper">
          <div class="flex-between" style="margin-bottom: 16px;">
            <h3>最近风险评估</h3>
            <el-button type="text" @click="$router.push('/assessments')">查看全部</el-button>
          </div>
          <el-table :data="recentAssessments" size="small">
            <el-table-column prop="assessment_no" label="评估编号" width="140" />
            <el-table-column prop="customer_name" label="客户名称" />
            <el-table-column prop="risk_score" label="风险分" width="80" align="center">
              <template #default="{ row }">
                <span :class="['risk-badge', `risk-${row.risk_level}`]">{{ row.risk_score }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-wrapper">
          <div class="flex-between" style="margin-bottom: 16px;">
            <h3>最近挽回任务</h3>
            <el-button type="text" @click="$router.push('/tasks')">查看全部</el-button>
          </div>
          <el-table :data="recentTasks" size="small">
            <el-table-column prop="task_no" label="任务编号" width="140" />
            <el-table-column prop="customer_name" label="客户名称" />
            <el-table-column prop="task_title" label="任务标题" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <span :class="['status-badge', `status-${row.status}`]">{{ getTaskStatusText(row.status) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { Refresh } from '@element-plus/icons-vue'
import api from '../api'

const overview = ref({})
const recentAssessments = ref([])
const recentTasks = ref([])
const riskChartRef = ref()
const taskChartRef = ref()
let riskChart = null
let taskChart = null

const loadData = async () => {
  try {
    const res = await api.get('/statistics/dashboard')
    overview.value = res.data.overview
    recentAssessments.value = res.data.recentAssessments
    recentTasks.value = res.data.recentTasks
    
    await nextTick()
    initRiskChart(res.data.riskDistribution)
    initTaskChart(res.data.taskStatusDistribution)
  } catch (e) {
    console.error(e)
  }
}

const initRiskChart = (data) => {
  if (!riskChartRef.value) return
  if (riskChart) riskChart.dispose()
  
  const riskMap = { low: '低风险', medium: '中风险', high: '高风险', critical: '极高风险' }
  const chartData = data.map(item => ({ name: riskMap[item.risk_level] || item.risk_level, value: item.count }))
  
  riskChart = echarts.init(riskChartRef.value)
  riskChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: chartData
    }],
    color: ['#22c55e', '#eab308', '#ef4444', '#7f1d1d']
  })
}

const initTaskChart = (data) => {
  if (!taskChartRef.value) return
  if (taskChart) taskChart.dispose()
  
  const statusMap = { pending: '待处理', processing: '处理中', completed: '已完成', failed: '失败', cancelled: '已取消' }
  const chartData = data.map(item => ({ name: statusMap[item.status] || item.status, value: item.count }))
  
  taskChart = echarts.init(taskChartRef.value)
  taskChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, position: 'outside' },
      data: chartData
    }],
    color: ['#eab308', '#3b82f6', '#22c55e', '#ef4444', '#6b7280']
  })
}

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    auto_blocked: 'danger',
    manual_review: 'primary',
    watching: 'info',
    closed: 'success'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    auto_blocked: '自动拦截',
    manual_review: '人工复核',
    watching: '继续观察',
    closed: '已关闭'
  }
  return texts[status] || status
}

const getTaskStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return texts[status] || status
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', () => {
    riskChart?.resize()
    taskChart?.resize()
  })
})
</script>
