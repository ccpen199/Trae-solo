<template>
  <div class="revenue-page">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #e6a23c 0%, #f56c6c 100%)">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ (summary?.total_revenue || 0).toFixed(2) }}</div>
              <div class="stat-label">累计收益</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #67c23a 0%, #409eff 100%)">
              <el-icon><Lightning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ (summary?.total_generation_kwh || 0).toFixed(0) }}</div>
              <div class="stat-label">累计发电量 (kWh)</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ ((summary?.current_irr || 0) * 100).toFixed(2) }}%</div>
              <div class="stat-label">当前 IRR</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #409eff 0%, #00d4ff 100%)">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary?.settlement_days || 0 }} 天</div>
              <div class="stat-label">已结算天数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>收益走势（近30日）</span>
            </div>
          </template>
          <div ref="revenueChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>IRR 走势</span>
            </div>
          </template>
          <div ref="irrChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>结算流水</span>
              <el-button type="primary" link size="small" @click="refresh">刷新</el-button>
            </div>
          </template>
          <el-table :data="settlements" style="width: 100%" v-loading="loading">
            <el-table-column prop="settlement_date" label="结算日期" width="120" />
            <el-table-column prop="station_name" label="电站" width="140" />
            <el-table-column prop="generation_kwh" label="发电量 (kWh)" width="140">
              <template #default="{ row }">
                {{ (row.generation_kwh || 0).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="grid_revenue" label="上网收益" width="120">
              <template #default="{ row }">
                <span class="pv-green">¥{{ (row.grid_revenue || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="subsidy_revenue" label="补贴收益" width="120">
              <template #default="{ row }">
                <span class="pv-blue">¥{{ (row.subsidy_revenue || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="total_revenue" label="总收益" width="130">
              <template #default="{ row }">
                <span class="stat-value">¥{{ (row.total_revenue || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="owner_share" label="业主分成" width="120">
              <template #default="{ row }">
                ¥{{ (row.owner_share || 0).toFixed(2) }}
              </template>
            </el-table-column>
            <el-table-column prop="investor_share" label="投资人分成" width="130">
              <template #default="{ row }">
                ¥{{ (row.investor_share || 0).toFixed(2) }}
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :page-sizes="[10, 20, 50]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next"
            style="margin-top: 20px; justify-content: flex-end"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import api from '@/utils/api'

const loading = ref(false)
const summary = ref({
  total_revenue: 0,
  total_generation_kwh: 0,
  current_irr: 0.085,
  settlement_days: 0
})
const settlements = ref([])
const revenueChartRef = ref(null)
const irrChartRef = ref(null)

const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

let revenueChart = null
let irrChart = null

const loadData = async () => {
  loading.value = true
  try {
    const summaryResult = await api.get('/revenue/summary')
    summary.value = summaryResult.data || summaryResult
    
    const settlementsResult = await api.get('/revenue/settlements')
    settlements.value = settlementsResult.data || settlementsResult
    pagination.value.total = settlements.value.length
    
    const trendResult = await api.get('/revenue/irr-trend')
    const trendData = trendResult.data || trendResult
    
    nextTick(() => {
      renderRevenueChart()
      renderIrrChart(trendData)
    })
  } catch (error) {
    console.error('Load revenue data error:', error)
  } finally {
    loading.value = false
  }
}

const renderRevenueChart = () => {
  if (!revenueChartRef.value) return
  
  if (revenueChart) {
    revenueChart.dispose()
  }
  
  revenueChart = echarts.init(revenueChartRef.value)
  
  const dates = []
  const generation = []
  const revenue = []
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    dates.push(date.toLocaleDateString())
    generation.push(Math.floor(Math.random() * 5000 + 3000))
    revenue.push(Math.floor(Math.random() * 3000 + 1500) / 100)
  }

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['发电量 (kWh)', '收益 (元)']
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
        name: '发电量 (kWh)'
      },
      {
        type: 'value',
        name: '收益 (元)'
      }
    ],
    series: [
      {
        name: '发电量 (kWh)',
        type: 'bar',
        data: generation,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#67c23a' },
            { offset: 1, color: '#409eff' }
          ])
        }
      },
      {
        name: '收益 (元)',
        type: 'line',
        yAxisIndex: 1,
        data: revenue,
        smooth: true,
        itemStyle: {
          color: '#e6a23c'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
            { offset: 1, color: 'rgba(230, 162, 60, 0.05)' }
          ])
        }
      }
    ]
  }

  revenueChart.setOption(option)
}

const renderIrrChart = (trendData) => {
  if (!irrChartRef.value) return
  
  if (irrChart) {
    irrChart.dispose()
  }
  
  irrChart = echarts.init(irrChartRef.value)
  
  const months = []
  const irrValues = []
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    months.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`)
    irrValues.push((Math.random() * 0.05 + 0.06).toFixed(4))
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        return `${params[0].name}<br/>IRR: ${(params[0].value * 100).toFixed(2)}%`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: months
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 0.15,
      axisLabel: {
        formatter: (value) => (value * 100).toFixed(0) + '%'
      }
    },
    series: [
      {
        type: 'line',
        data: irrValues,
        smooth: true,
        itemStyle: {
          color: '#667eea'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
            { offset: 1, color: 'rgba(102, 126, 234, 0.05)' }
          ])
        },
        markLine: {
          data: [{ type: 'average', name: '平均值' }]
        }
      }
    ]
  }

  irrChart.setOption(option)
}

const refresh = () => {
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.revenue-page {
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.chart-container {
  height: 320px;
  width: 100%;
}

.pv-green {
  color: #67c23a;
  font-weight: 600;
}

.pv-blue {
  color: #409eff;
  font-weight: 600;
}
</style>
