<template>
  <div class="dashboard-page">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardData?.stations?.total || 0 }}</div>
              <div class="stat-label">电站总数</div>
            </div>
          </div>
          <div class="stat-footer">
            <span class="pv-green">运行中: {{ dashboardData?.stations?.operating || 0 }}</span>
            <span class="pv-red">异常: {{ dashboardData?.stations?.abnormal || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #67c23a 0%, #409eff 100%)">
              <el-icon><Cpu /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ dashboardData?.inverters?.total || 0 }}</div>
              <div class="stat-label">设备总数</div>
            </div>
          </div>
          <div class="stat-footer">
            <span class="pv-green">在线: {{ dashboardData?.inverters?.operating || 0 }}</span>
            <span class="pv-red">故障: {{ dashboardData?.inverters?.fault || 0 }}</span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #e6a23c 0%, #f56c6c 100%)">
              <el-icon><Tools /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ (dashboardData?.revenue?.total_revenue / 10000).toFixed(2) }}</div>
              <div class="stat-label">本月收益 (万元)</div>
            </div>
          </div>
          <div class="stat-footer">
            <span class="pv-blue">发电: {{ (dashboardData?.revenue?.total_generation_kwh || 0).toFixed(0) }} kWh</span>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #409eff 0%, #00d4ff 100%)">
              <el-icon><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ activeFaults?.length || 0 }}</div>
              <div class="stat-label">活跃故障</div>
            </div>
          </div>
          <div class="stat-footer">
            <span class="pv-orange">待处理工单: {{ pendingOrders }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>近7日发电量趋势</span>
            </div>
          </template>
          <div ref="generationChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>电站健康分布</span>
            </div>
          </template>
          <div ref="healthChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>活跃故障告警</span>
              <el-button type="primary" link size="small" @click="goToMaintenance">查看全部</el-button>
            </div>
          </template>
          <el-table :data="activeFaults" style="width: 100%" v-loading="loading">
            <el-table-column prop="station_name" label="电站" width="140" />
            <el-table-column prop="fault_description" label="故障描述" min-width="180" />
            <el-table-column prop="severity" label="严重程度" width="100">
              <template #default="{ row }">
                <el-tag :type="getSeverityType(row.severity)">{{ getSeverityLabel(row.severity) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="detected_time" label="检测时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.detected_time) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>待处理工单</span>
              <el-button type="primary" link size="small" @click="goToMaintenance">查看全部</el-button>
            </div>
          </template>
          <el-table :data="pendingMaintenanceOrders" style="width: 100%" v-loading="loading">
            <el-table-column prop="station_name" label="电站" width="140" />
            <el-table-column prop="problem_description" label="问题描述" min-width="180" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import api from '@/utils/api'

const router = useRouter()

const loading = ref(false)
const dashboardData = ref(null)
const activeFaults = ref([])
const pendingMaintenanceOrders = ref([])
const generationChartRef = ref(null)
const healthChartRef = ref(null)

let generationChart = null
let healthChart = null

const pendingOrders = ref(0)

const loadDashboardData = async () => {
  loading.value = true
  try {
    const overview = await api.get('/dashboard/overview')
    dashboardData.value = {
      stations: {
        total: overview.stations?.total || 0,
        operating: overview.stations?.operating || 0,
        abnormal: overview.stations?.abnormal || 0
      },
      inverters: {
        total: overview.inverters?.total || 0,
        operating: overview.inverters?.operating || 0,
        fault: overview.inverters?.fault || 0
      },
      revenue: {
        total_revenue: overview.revenue_last_30d?.total_revenue || 0,
        total_generation_kwh: overview.revenue_last_30d?.total_generation_kwh || 0
      }
    }

    activeFaults.value = overview.active_faults || []
    
    pendingMaintenanceOrders.value = [
      ...(overview.maintenance?.pending_orders || 0),
      ...(overview.cleaning?.pending_orders || 0)
    ]
    pendingOrders.value = overview.maintenance?.pending_orders || 0 + overview.cleaning?.pending_orders || 0

    nextTick(() => {
      renderGenerationChart(overview.generation_last_7d || [])
      renderHealthChart(overview)
    })
  } catch (error) {
    console.error('Load dashboard error:', error)
  } finally {
    loading.value = false
  }
}

const renderGenerationChart = (data) => {
  if (!generationChartRef.value) return
  
  if (generationChart) {
    generationChart.dispose()
  }
  
  generationChart = echarts.init(generationChartRef.value)
  
  const dates = data.map(d => d.record_date)
  const generation = data.map(d => d.total_kwh)
  const prValues = data.map(d => d.avg_pr)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['发电量 (kWh)', '平均 PR']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: [
      {
        type: 'value',
        name: '发电量 (kWh)',
        position: 'left'
      },
      {
        type: 'value',
        name: 'PR',
        position: 'right',
        min: 0,
        max: 1
      }
    ],
    series: [
      {
        name: '发电量 (kWh)',
        type: 'bar',
        data: generation,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' }
          ])
        }
      },
      {
        name: '平均 PR',
        type: 'line',
        yAxisIndex: 1,
        data: prValues,
        smooth: true,
        itemStyle: {
          color: '#67c23a'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        }
      }
    ]
  }

  generationChart.setOption(option)
}

const renderHealthChart = (overview) => {
  if (!healthChartRef.value) return
  
  if (healthChart) {
    healthChart.dispose()
  }
  
  healthChart = echarts.init(healthChartRef.value)

  const healthData = [
    { name: '优秀', value: 1, itemStyle: { color: '#67c23a' } },
    { name: '良好', value: 2, itemStyle: { color: '#409eff' } },
    { name: '一般', value: 0, itemStyle: { color: '#e6a23c' } },
    { name: '较差', value: 0, itemStyle: { color: '#f56c6c' } }
  ]

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold'
          }
        },
        data: healthData
      }
    ]
  }

  healthChart.setOption(option)
}

const getSeverityType = (severity) => {
  const types = {
    critical: 'danger',
    major: 'warning',
    minor: 'info',
    warning: 'info'
  }
  return types[severity] || 'info'
}

const getSeverityLabel = (severity) => {
  const labels = {
    critical: '严重',
    major: '主要',
    minor: '次要',
    warning: '警告'
  }
  return labels[severity] || severity
}

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    dispatched: 'primary',
    accepted: 'info',
    in_progress: 'danger',
    completed: 'success',
    verified: 'success'
  }
  return types[status] || 'info'
}

const getStatusLabel = (status) => {
  const labels = {
    pending: '待处理',
    dispatched: '已派发',
    accepted: '已接单',
    in_progress: '处理中',
    completed: '已完成',
    verified: '已验收'
  }
  return labels[status] || status
}

const formatTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').substring(0, 19)
}

const goToMaintenance = () => {
  router.push('/maintenance')
}

const handleResize = () => {
  generationChart?.resize()
  healthChart?.resize()
}

onMounted(() => {
  loadDashboardData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  generationChart?.dispose()
  healthChart?.dispose()
})
</script>

<style scoped>
.dashboard-page {
  height: 100%;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-content {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.stat-icon .el-icon {
  font-size: 28px;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 6px;
}

.stat-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 15px;
}

.chart-container {
  height: 320px;
  width: 100%;
}
</style>
