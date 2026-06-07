<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getDashboardStatsApi } from '@/api/admin'
import { getDeviceStatsApi } from '@/api/device'
import { getOrderStatsApi } from '@/api/order'
import * as echarts from 'echarts'

const loading = ref(false)
const stats = ref({
  totalDevices: 0,
  onlineDevices: 0,
  todayOrders: 0,
  todayRevenue: 0,
  totalRevenue: 0,
  totalUsers: 0,
  activeAlerts: 0,
  pendingWorkOrders: 0
})

const orderChartRef = ref<HTMLDivElement>()
const deviceChartRef = ref<HTMLDivElement>()
let orderChart: echarts.ECharts | null = null
let deviceChart: echarts.ECharts | null = null

async function loadStats() {
  loading.value = true
  try {
    const [dashboardRes, deviceRes, orderRes] = await Promise.all([
      getDashboardStatsApi().catch(() => ({ data: {} })),
      getDeviceStatsApi().catch(() => ({ data: {} })),
      getOrderStatsApi().catch(() => ({ data: {} }))
    ])

    const data = { ...dashboardRes.data, ...deviceRes.data, ...orderRes.data }
    stats.value = {
      totalDevices: data.totalDevices || 0,
      onlineDevices: data.onlineDevices || 0,
      todayOrders: data.todayOrders || 0,
      todayRevenue: data.todayRevenue || 0,
      totalRevenue: data.totalRevenue || 0,
      totalUsers: data.totalUsers || 0,
      activeAlerts: data.activeAlerts || 0,
      pendingWorkOrders: data.pendingWorkOrders || 0
    }

    setTimeout(initCharts, 100)
  } catch (error) {
    console.error('Load stats error:', error)
  } finally {
    loading.value = false
  }
}

function initCharts() {
  if (orderChartRef.value) {
    orderChart = echarts.init(orderChartRef.value)
    const orderOption = {
      title: { text: '近7日订单趋势', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'axis' },
      legend: { data: ['订单数', '收入'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      },
      yAxis: [
        { type: 'value', name: '订单数' },
        { type: 'value', name: '收入(元)' }
      ],
      series: [
        {
          name: '订单数',
          type: 'bar',
          data: [120, 132, 101, 134, 90, 230, 210]
        },
        {
          name: '收入',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: [600, 660, 505, 670, 450, 1150, 1050]
        }
      ]
    }
    orderChart.setOption(orderOption)
  }

  if (deviceChartRef.value) {
    deviceChart = echarts.init(deviceChartRef.value)
    const deviceOption = {
      title: { text: '设备状态分布', left: 'center', textStyle: { fontSize: 16 } },
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', left: 'left' },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['55%', '50%'],
          avoidLabelOverlap: false,
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 16, fontWeight: 'bold' }
          },
          data: [
            { value: 1048, name: '空闲', itemStyle: { color: '#67c23a' } },
            { value: 735, name: '运行中', itemStyle: { color: '#409eff' } },
            { value: 234, name: '已暂停', itemStyle: { color: '#e6a23c' } },
            { value: 135, name: '故障', itemStyle: { color: '#f56c6c' } },
            { value: 148, name: '维护中', itemStyle: { color: '#909399' } }
          ]
        }
      ]
    }
    deviceChart.setOption(deviceOption)
  }
}

const statCards = [
  { label: '设备总数', key: 'totalDevices', icon: 'Cpu', color: '#409eff' },
  { label: '在线设备', key: 'onlineDevices', icon: 'Connection', color: '#67c23a' },
  { label: '今日订单', key: 'todayOrders', icon: 'ShoppingCart', color: '#e6a23c' },
  { label: '今日收入', key: 'todayRevenue', icon: 'Money', color: '#f56c6c', prefix: '¥' },
  { label: '累计收入', key: 'totalRevenue', icon: 'Wallet', color: '#909399', prefix: '¥' },
  { label: '用户总数', key: 'totalUsers', icon: 'User', color: '#67c23a' },
  { label: '活动告警', key: 'activeAlerts', icon: 'Bell', color: '#f56c6c' },
  { label: '待处理工单', key: 'pendingWorkOrders', icon: 'Document', color: '#e6a23c' }
]

onMounted(() => {
  loadStats()
})
</script>

<template>
  <div class="dashboard-page">
    <el-row :gutter="20">
      <el-col
        v-for="card in statCards"
        :key="card.key"
        :xs="12"
        :sm="8"
        :md="6"
        class="stat-col"
      >
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">{{ card.label }}</div>
              <div class="stat-value">
                <span v-if="card.prefix">{{ card.prefix }}</span>
                {{ (stats as any)[card.key] }}
              </div>
            </div>
            <div class="stat-icon" :style="{ background: card.color + '20', color: card.color }">
              <el-icon :size="28">
                <component :is="card.icon" />
              </el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :xs="24" :lg="14">
        <el-card class="chart-card">
          <div ref="orderChartRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="10">
        <el-card class="chart-card">
          <div ref="deviceChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style lang="scss" scoped>
.dashboard-page {
  .stat-col {
    margin-bottom: 20px;
  }

  .stat-card {
    .stat-content {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .stat-info {
        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #303133;
        }
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .chart-row {
    .chart-card {
      .chart {
        height: 350px;
        width: 100%;
      }
    }
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    .stat-col {
      margin-bottom: 12px;
    }

    .chart-row {
      .chart-card {
        .chart {
          height: 250px;
        }
      }
    }
  }
}
</style>
