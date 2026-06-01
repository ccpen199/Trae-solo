<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import request from '@/utils/request'

const loading = ref(true)
const error = ref(null)
const summary = ref({})
const trendData = ref([])
const topCostData = ref([])

let trendChart = null
let pieChart = null

const formatCurrency = (value) => {
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(2)}万`
  }
  return `¥${value.toLocaleString()}`
}

const getUsageStatus = (usage) => {
  if (usage >= 100) return 'danger'
  if (usage >= 80) return 'warning'
  return ''
}

const fetchData = async () => {
  try {
    loading.value = true
    error.value = null
    const [summaryRes, trendRes, topCostRes] = await Promise.all([
      request.get('/dashboard/summary'),
      request.get('/dashboard/trend', { params: { group_by: 'date' } }),
      request.get('/dashboard/top-cost', { params: { type: 'product', limit: 10 } })
    ])
    summary.value = summaryRes
    trendData.value = trendRes
    topCostData.value = topCostRes
    await nextTick()
    initCharts()
  } catch (err) {
    error.value = err.message || '加载数据失败'
    console.error('获取看板数据失败:', err)
  } finally {
    loading.value = false
  }
}

const initCharts = () => {
  const trendEl = document.getElementById('trend-chart')
  const pieEl = document.getElementById('pie-chart')

  if (trendEl) {
    trendChart = echarts.init(trendEl)
    const trendOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f1f5f9' },
        formatter: (params) => {
          const date = params[0].axisValue
          const cost = params[0].data
          return `<div>${date}</div><div>成本: ¥${cost.toLocaleString()}</div>`
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: trendData.value.map(item => item.period),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
        axisLabel: {
          color: '#94a3b8',
          fontSize: 11,
          formatter: (value) => value >= 10000 ? `${(value / 10000).toFixed(0)}万` : value
        }
      },
      series: [{
        name: '成本',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#1890ff', width: 2 },
        itemStyle: { color: '#1890ff' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
          ])
        },
        data: trendData.value.map(item => item.total_cost)
      }]
    }
    trendChart.setOption(trendOption)
  }

  if (pieEl) {
    pieChart = echarts.init(pieEl)
    const pieOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        borderColor: '#334155',
        textStyle: { color: '#f1f5f9' },
        formatter: '{b}: ¥{c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '5%',
        top: 'center',
        textStyle: { color: '#94a3b8', fontSize: 12 },
        itemWidth: 12,
        itemHeight: 12
      },
      series: [{
        name: '产品分布',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#1e293b',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
            color: '#f1f5f9'
          }
        },
        labelLine: { show: false },
        data: topCostData.value.map(item => ({
          value: item.total_cost,
          name: item.product
        }))
      }],
      color: ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16', '#2f54eb', '#a0d911']
    }
    pieChart.setOption(pieOption)
  }
}

const handleResize = () => {
  trendChart?.resize()
  pieChart?.resize()
}

onMounted(() => {
  fetchData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  trendChart?.dispose()
  pieChart?.dispose()
})
</script>

<template>
  <div class="dashboard">
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <span class="ml-2">加载中...</span>
    </div>

    <div v-else-if="error" class="error">
      <span>⚠️</span>
      <span>{{ error }}</span>
      <button class="btn btn-primary btn-sm mt-2" @click="fetchData">重试</button>
    </div>

    <template v-else>
      <div class="grid grid-cols-4 gap-4 mb-4">
        <div class="stat-card">
          <div class="stat-label">月度预算</div>
          <div class="stat-value">{{ formatCurrency(summary.total_budget || 0) }}</div>
          <div class="progress-bar mt-2">
            <div
              class="progress-bar-fill"
              :class="getUsageStatus(summary.budget_usage)"
              :style="{ width: Math.min(summary.budget_usage, 100) + '%' }"
            ></div>
          </div>
          <div class="mt-2 text-sm text-secondary">
            使用率: <span :class="summary.budget_usage >= 80 ? 'text-warning' : 'text-success'">{{ summary.budget_usage || 0 }}%</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-label">实际成本</div>
          <div class="stat-value text-primary">{{ formatCurrency(summary.actual_cost || 0) }}</div>
          <div class="stat-change" :class="summary.mom_change >= 0 ? 'up' : 'down'">
            <span>{{ summary.mom_change >= 0 ? '↑' : '↓' }}</span>
            <span>{{ Math.abs(summary.mom_change || 0) }}% 环比</span>
          </div>
          <div class="mt-2 text-sm text-secondary">
            上月: {{ formatCurrency(summary.prev_cost || 0) }}
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-label">剩余预算</div>
          <div class="stat-value" :class="summary.budget_remaining < 0 ? 'text-error' : 'text-success'">
            {{ formatCurrency(summary.budget_remaining || 0) }}
          </div>
          <div class="stat-change down">
            <span>💡</span>
            <span>待优化建议: {{ summary.suggestion_stats?.pending || 0 }} 条</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-label">预计可节省</div>
          <div class="stat-value text-success">{{ formatCurrency(summary.suggestion_stats?.total_potential_saving || 0) }}<span class="text-sm text-secondary">/月</span></div>
          <div class="flex gap-2 mt-2">
            <span class="tag tag-primary">资源: {{ summary.resource_stats?.total || 0 }}</span>
            <span class="tag tag-warning">待认领: {{ summary.resource_stats?.unassigned || 0 }}</span>
          </div>
        </div>
      </div>

      <div v-if="summary.anomaly_growths?.length > 0" class="card mb-4">
        <div class="card-header">
          <h3 class="card-title">⚠️ 异常增长提示</h3>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div
            v-for="(item, index) in summary.anomaly_growths.slice(0, 6)"
            :key="index"
            class="p-3 rounded bg-tertiary"
          >
            <div class="flex justify-between items-center mb-1">
              <span class="font-medium">{{ item.product }}</span>
              <span class="tag tag-error">+{{ item.growth_rate }}%</span>
            </div>
            <div class="text-sm text-secondary">
              {{ item.region }} · ¥{{ item.current_cost.toLocaleString() }}
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📈 成本趋势</h3>
            <div class="text-sm text-secondary">最近30天</div>
          </div>
          <div id="trend-chart" style="height: 320px;"></div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🥧 产品分布</h3>
            <div class="text-sm text-secondary">按产品类型</div>
          </div>
          <div id="pie-chart" style="height: 320px;"></div>
        </div>
      </div>

      <div class="card mt-4">
        <div class="card-header">
          <h3 class="card-title">🏆 TOP 费用来源</h3>
          <div class="text-sm text-secondary">本月</div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>排名</th>
              <th>产品</th>
              <th>费用</th>
              <th>占比</th>
              <th>资源数</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in topCostData.slice(0, 10)" :key="index">
              <td>
                <span
                  class="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold"
                  :class="{
                    'bg-error text-white': index === 0,
                    'bg-warning text-white': index === 1,
                    'bg-primary text-white': index === 2,
                    'bg-tertiary text-secondary': index > 2
                  }"
                >
                  {{ index + 1 }}
                </span>
              </td>
              <td class="font-medium">{{ item.product }}</td>
              <td>¥{{ item.total_cost.toLocaleString() }}</td>
              <td>
                <div class="flex items-center gap-2">
                  <div class="progress-bar" style="width: 100px; height: 6px;">
                    <div class="progress-bar-fill" :style="{ width: item.percentage + '%' }"></div>
                  </div>
                  <span class="text-sm">{{ item.percentage }}%</span>
                </div>
              </td>
              <td>{{ item.resource_count }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  min-height: 100%;
}

.bg-tertiary {
  background: var(--bg-tertiary);
}
</style>
