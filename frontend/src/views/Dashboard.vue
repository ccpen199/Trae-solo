<template>
  <div class="dashboard">
    <div class="page-header">
      <h1 class="page-title">运营概览</h1>
      <p class="page-subtitle">实时监控行李运输状态和异常情况</p>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card primary">
          <div class="stat-value">{{ overview?.total_baggage || 0 }}</div>
          <div class="stat-label">托运行李总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card success">
          <div class="stat-value">{{ overview?.total_picked_up || 0 }}</div>
          <div class="stat-label">已领取行李</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card danger">
          <div class="stat-value">{{ overview?.total_exceptions || 0 }}</div>
          <div class="stat-label">异常总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card warning">
          <div class="stat-value">{{ overview?.open_exceptions || 0 }}</div>
          <div class="stat-label">待处理异常</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-value text-xl">{{ overview?.pickup_rate || '0%' }}</div>
          <div class="stat-label">正常领取率</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-value text-xl">{{ overview?.exception_rate || '0%' }}</div>
          <div class="stat-label">异常率</div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="stat-card">
          <div class="stat-value text-xl">¥{{ overview?.compensation_total || 0 }}</div>
          <div class="stat-label">累计赔付金额</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">异常类型分布</h3>
          <div ref="exceptionTypeChart" style="height: 300px;"></div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">每日趋势</h3>
          <div ref="trendChart" style="height: 300px;"></div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mt-5">
      <el-col :span="12">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4 flex items-center justify-between">
            <span>节点缺失告警</span>
            <el-tag type="danger" size="small">
              共 {{ alerts?.count || 0 }} 条
            </el-tag>
          </h3>
          <div v-if="alerts?.alerts?.length > 0" class="alert-list max-h-80 overflow-auto">
            <div v-for="alert in alerts.alerts.slice(0, 10)" :key="alert.id" class="alert-item p-3 border-b">
              <div class="flex justify-between items-center">
                <div>
                  <span class="font-semibold">{{ alert.baggage_tag }}</span>
                  <span class="ml-2 text-sm text-gray-500">{{ alert.passenger_name }}</span>
                </div>
                <el-tag :type="alert.alert_type === 'critical' ? 'danger' : 'warning'" size="small">
                  {{ alert.alert_type === 'critical' ? '严重' : '警告' }}
                </el-tag>
              </div>
              <div class="text-sm text-gray-600 mt-1">
                {{ alert.flight_no }} · {{ alert.departure }} → {{ alert.destination }}
              </div>
              <div class="text-sm text-red-500 mt-1">
                缺失节点：{{ alert.missing_nodes.join('、') }}
              </div>
            </div>
          </div>
          <div v-else class="empty-state" style="padding: 40px 20px;">
            <div class="empty-text">暂无节点缺失告警</div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card">
          <h3 class="text-lg font-semibold mb-4">异常航线 TOP 10</h3>
          <el-table :data="exceptionRoutes?.data || []" size="small">
            <el-table-column prop="departure" label="出发" width="80" />
            <el-table-column prop="destination" label="到达" width="80" />
            <el-table-column prop="exception_count" label="异常数" width="80" align="center" />
            <el-table-column prop="total_baggage" label="总数" width="80" align="center" />
            <el-table-column label="异常率">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.exception_rate }}%</el-tag>
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
import { statsApi, nodeApi } from '../api'

const overview = ref(null)
const alerts = ref(null)
const exceptionRoutes = ref(null)
const exceptionTypeChart = ref(null)
const trendChart = ref(null)

let exceptionTypeChartInstance = null
let trendChartInstance = null

async function loadData() {
  try {
    const [overviewData, alertsData, typeData, trendData, routeData] = await Promise.all([
      statsApi.getOverview(7),
      nodeApi.getAlerts(24),
      statsApi.getExceptionsByType(30),
      statsApi.getDailyTrend(14),
      statsApi.getExceptionsByRoute(30, 10)
    ])
    
    overview.value = overviewData
    alerts.value = alertsData
    exceptionRoutes.value = routeData
    
    await nextTick()
    renderExceptionTypeChart(typeData.data)
    renderTrendChart(trendData.data)
  } catch (err) {
    console.error('Load dashboard data error:', err)
  }
}

function renderExceptionTypeChart(data) {
  if (!exceptionTypeChart.value) return
  
  if (exceptionTypeChartInstance) {
    exceptionTypeChartInstance.dispose()
  }
  
  exceptionTypeChartInstance = echarts.init(exceptionTypeChart.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
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
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        data: data.map(item => ({
          value: item.count,
          name: item.exception_name
        }))
      }
    ]
  }
  
  exceptionTypeChartInstance.setOption(option)
}

function renderTrendChart(data) {
  if (!trendChart.value) return
  
  if (trendChartInstance) {
    trendChartInstance.dispose()
  }
  
  trendChartInstance = echarts.init(trendChart.value)
  
  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['托运行李', '异常行李']
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item.date)
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '托运行李',
        type: 'line',
        data: data.map(item => item.baggage_count),
        smooth: true,
        lineStyle: { color: '#409eff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      },
      {
        name: '异常行李',
        type: 'line',
        data: data.map(item => item.exception_count),
        smooth: true,
        lineStyle: { color: '#f56c6c' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
            { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
          ])
        }
      }
    ]
  }
  
  trendChartInstance.setOption(option)
}

onMounted(() => {
  loadData()
  
  window.addEventListener('resize', () => {
    exceptionTypeChartInstance?.resize()
    trendChartInstance?.resize()
  })
})
</script>

<style scoped>
.stats-row {
  margin-bottom: 20px;
}

.text-xl {
  font-size: 24px;
}

.max-h-80 {
  max-height: 320px;
}

.overflow-auto {
  overflow-y: auto;
}

.p-3 {
  padding: 12px;
}

.border-b {
  border-bottom: 1px solid #ebeef5;
}

.ml-2 {
  margin-left: 8px;
}

.mt-5 {
  margin-top: 20px;
}

.mt-1 {
  margin-top: 4px;
}

.justify-between {
  justify-content: space-between;
}

.alert-list::-webkit-scrollbar {
  width: 6px;
}

.alert-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.alert-list::-webkit-scrollbar-thumb {
  background: #c0c4cc;
  border-radius: 3px;
}
</style>
