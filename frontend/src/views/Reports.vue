<template>
  <div class="reports">
    <div class="page-header">
      <h2>报表分析</h2>
      <el-button type="primary" @click="exportTasks">
        <el-icon><Download /></el-icon> 导出任务数据
      </el-button>
    </div>
    
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header><span>任务执行趋势</span></template>
          <div ref="taskChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span>成功率趋势</span></template>
          <div ref="rateChart" style="height: 350px;"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header><span>失败率 TOP 10</span></template>
          <el-table :data="topFailures">
            <el-table-column prop="config_name" label="配置名称" width="200" />
            <el-table-column prop="app_name" label="应用" width="150" />
            <el-table-column prop="failure_count" label="失败次数" width="120">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.failure_count }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="last_failure" label="最近失败时间" width="180">
              <template #default="{ row }">{{ formatTime(row.last_failure) }}</template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="$router.push(`/configs/${row.config_id}`)">
                  查看配置
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { reports } from '@/api'
import * as echarts from 'echarts'

const topFailures = ref([])
const taskChart = ref(null)
const rateChart = ref(null)
let taskChartInstance = null
let rateChartInstance = null

const formatTime = (t) => t ? new Date(t).toLocaleString() : '-'

const loadData = async () => {
  try {
    const trends = await reports.trends()
    const top = await reports.topFailures()
    topFailures.value = top
    
    renderTaskChart(trends.taskTrends)
    renderRateChart(trends.successRateTrends)
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const renderTaskChart = (data) => {
  if (!taskChart.value) return
  taskChartInstance = echarts.init(taskChart.value)
  taskChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['总任务', '成功', '失败'] },
    xAxis: { type: 'category', data: (data || []).map(d => d.period).reverse() },
    yAxis: { type: 'value' },
    series: [
      { name: '总任务', type: 'line', smooth: true, data: (data || []).map(d => d.total).reverse() },
      { name: '成功', type: 'bar', data: (data || []).map(d => d.completed).reverse(), itemStyle: { color: '#10b981' } },
      { name: '失败', type: 'bar', data: (data || []).map(d => d.failed).reverse(), itemStyle: { color: '#ef4444' } }
    ]
  })
}

const renderRateChart = (data) => {
  if (!rateChart.value) return
  rateChartInstance = echarts.init(rateChart.value)
  rateChartInstance.setOption({
    tooltip: { trigger: 'axis', formatter: '{b}<br/>成功率: {c}%' },
    xAxis: { type: 'category', data: (data || []).map(d => d.period).reverse() },
    yAxis: { type: 'value', max: 100, name: '成功率 %' },
    series: [{
      name: '成功率', type: 'line', smooth: true, data: (data || []).map(d => d.success_rate || 0).reverse(),
      areaStyle: { color: 'rgba(59, 130, 246, 0.3)' },
      lineStyle: { color: '#3b82f6', width: 2 },
      itemStyle: { color: '#3b82f6' }
    }]
  })
}

const exportTasks = async () => {
  try {
    const data = await reports.exportTasks()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webhook-tasks-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', () => {
    taskChartInstance?.resize()
    rateChartInstance?.resize()
  })
})

onUnmounted(() => {
  taskChartInstance?.dispose()
  rateChartInstance?.dispose()
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
</style>
