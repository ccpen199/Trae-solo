<template>
  <div class="dashboard">
    <h2>概览面板</h2>
    
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon size="32" color="#3b82f6"><OfficeBuilding /></el-icon>
            <div>
            <div class="stat-value">{{ summary.apps?.total || 0 }}</div>
            <div class="stat-label">应用数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon size="32" color="#10b981"><Setting /></el-icon>
            <div>
            <div class="stat-value">{{ summary.configs?.total || 0 }}</div>
            <div class="stat-label">Webhook配置</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon size="32" color="#f59e0b"><Clock /></el-icon>
            <div>
            <div class="stat-value">{{ pendingChanges }}</div>
            <div class="stat-label">待审批变更</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card warning">
          <div class="stat-content">
            <el-icon size="32" color="#ef4444"><Warning /></el-icon>
            <div>
            <div class="stat-value">{{ summary.activeAlerts || 0 }}</div>
            <div class="stat-label">活跃告警</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
          <div class="card-header">
            <span>任务执行统计</span>
          </div>
          </template>
          <div ref="taskChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
          <div class="card-header">
            <span>成功率趋势</span>
          </div>
          </template>
          <div ref="rateChart" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
          <div class="card-header">
            <span>最近失败记录</span>
            <el-button type="primary" link @click="$router.push('/executions')">查看全部</el-button>
          </div>
          </template>
          <el-table :data="summary.recentFailures || []" size="small">
            <el-table-column prop="config_name" label="配置名称" />
            <el-table-column prop="app_name" label="应用" />
            <el-table-column prop="error_message" label="错误信息" show-overflow-tooltip />
            <el-table-column prop="created_at" label="时间" width="180">
              <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
          <div class="card-header">
            <span>失败率 TOP 10</span>
          </div>
          </template>
          <el-table :data="topFailures" size="small">
            <el-table-column prop="config_name" label="配置名称" />
            <el-table-column prop="app_name" label="应用" />
            <el-table-column prop="failure_count" label="失败次数" width="100">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.failure_count }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="last_failure" label="最近失败" width="180">
              <template #default="{ row }">{{ formatTime(row.last_failure) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { reports } from '@/api'
import * as echarts from 'echarts'
import { OfficeBuilding, Setting, Clock, Warning } from '@element-plus/icons-vue'

const summary = ref({})
const topFailures = ref([])
const taskChart = ref(null)
const rateChart = ref(null)
let taskChartInstance = null
let rateChartInstance = null

const pendingChanges = ref(0)

const formatTime = (t) => t ? new Date(t).toLocaleString() : '-'

const fetchData = async () => {
  try {
    summary.value = await reports.summary()
    pendingChanges.value = summary.value.pendingChanges || 0
    
    const trends = await reports.trends()
    const top = await reports.topFailures()
    topFailures.value = top
    
    renderTaskChart(trends.taskTrends)
    renderRateChart(trends.successRateTrends)
  } catch (e) {
    console.error(e)
  }
}

const renderTaskChart = (data) => {
  if (!taskChart.value) return
  taskChartInstance = echarts.init(taskChart.value)
  taskChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['完成', '失败'] },
    xAxis: { type: 'category', data: (data || []).map(d => d.period).reverse() },
    yAxis: { type: 'value' },
    series: [
      { name: '完成', type: 'bar', data: (data || []).map(d => d.completed).reverse(), itemStyle: { color: '#10b981' } },
      { name: '失败', type: 'bar', data: (data || []).map(d => d.failed).reverse(), itemStyle: { color: '#ef4444' } }
    ]
  })
}

const renderRateChart = (data) => {
  if (!rateChart.value) return
  rateChartInstance = echarts.init(rateChart.value)
  rateChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: (data || []).map(d => d.period).reverse() },
    yAxis: { type: 'value', max: 100, name: '%' },
    series: [{
      name: '成功率', type: 'line', smooth: true, data: (data || []).map(d => d.success_rate || 0).reverse(), areaStyle: {}
    }]
  })
}

onMounted(() => {
  fetchData()
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
.dashboard h2 {
  margin: 0 0 20px;
  font-size: 24px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
}

.stat-card.warning {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}
</style>
