<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '@/utils/api'
import websocketService from '@/utils/websocket'
import * as echarts from 'echarts'

const todayRevenue = ref(0)
const todayOrders = ref(0)
const averageOrderValue = ref(0)
const tableUtilization = ref(0)
const topItems = ref<Array<{ name: string; quantity: number }>>([])
const recentOrders = ref<any[]>([])
const tableStatus = ref({
  total: 0,
  vacant: 0,
  occupied: 0,
  cleaning: 0,
  reserved: 0,
})

const fetchDashboardData = async () => {
  try {
    const data = await request.get('/reports/dashboard')
    todayRevenue.value = data.todayRevenue
    todayOrders.value = data.todayOrders
    averageOrderValue.value = data.averageOrderValue
    tableUtilization.value = data.tableUtilization
    topItems.value = data.topItems
    recentOrders.value = data.recentOrders
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
  }
}

const fetchTableStatus = async () => {
  try {
    const data = await request.get('/tables/status/summary')
    tableStatus.value = data
  } catch (error) {
    console.error('获取桌台状态失败:', error)
  }
}

const initRevenueChart = () => {
  const chartDom = document.getElementById('revenue-chart')
  if (!chartDom) return

  const myChart = echarts.init(chartDom)

  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
  const mockData = Array.from({ length: 24 }, () => Math.floor(Math.random() * 2000))

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: '{b}<br/>营收: ¥{c}',
    },
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: {
        interval: 3,
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '¥{value}',
      },
    },
    series: [
      {
        data: mockData,
        type: 'line',
        smooth: true,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' },
          ]),
        },
        lineStyle: {
          color: '#409eff',
          width: 2,
        },
        itemStyle: {
          color: '#409eff',
        },
      },
    ],
  }

  myChart.setOption(option)
}

const initCategoryChart = () => {
  const chartDom = document.getElementById('category-chart')
  if (!chartDom) return

  const myChart = echarts.init(chartDom)

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}份 ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: 1048, name: '热菜', itemStyle: { color: '#409eff' } },
          { value: 735, name: '凉菜', itemStyle: { color: '#67c23a' } },
          { value: 580, name: '主食', itemStyle: { color: '#e6a23c' } },
          { value: 484, name: '饮品', itemStyle: { color: '#f56c6c' } },
          { value: 300, name: '甜点', itemStyle: { color: '#909399' } },
        ],
      },
    ],
  }

  myChart.setOption(option)
}

const formatCurrency = (value: number) => {
  return `¥${value.toFixed(2)}`
}

const getOrderStatusTag = (status: string) => {
  const statusMap: Record<string, { type: string; label: string }> = {
    pending: { type: 'info', label: '待确认' },
    confirmed: { type: 'warning', label: '已确认' },
    preparing: { type: 'primary', label: '制作中' },
    ready: { type: 'success', label: '已出餐' },
    served: { type: '', label: '已上齐' },
    completed: { type: 'success', label: '已完成' },
    cancelled: { type: 'danger', label: '已取消' },
  }
  return statusMap[status] || { type: '', label: status }
}

onMounted(() => {
  fetchDashboardData()
  fetchTableStatus()
  initRevenueChart()
  initCategoryChart()

  websocketService.on('newOrder', () => {
    fetchDashboardData()
  })

  websocketService.on('paymentComplete', () => {
    fetchDashboardData()
  })
})
</script>

<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card revenue-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">今日营收</p>
              <p class="stat-value">{{ formatCurrency(todayRevenue) }}</p>
            </div>
            <div class="stat-icon">
              <el-icon :size="40"><Money /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card orders-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">今日订单</p>
              <p class="stat-value">{{ todayOrders }}</p>
            </div>
            <div class="stat-icon">
              <el-icon :size="40"><Document /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card avg-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">客单价</p>
              <p class="stat-value">{{ formatCurrency(averageOrderValue) }}</p>
            </div>
            <div class="stat-icon">
              <el-icon :size="40"><TrendCharts /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card class="stat-card table-card">
          <div class="stat-content">
            <div class="stat-info">
              <p class="stat-label">上座率</p>
              <p class="stat-value">{{ tableUtilization.toFixed(1) }}%</p>
            </div>
            <div class="stat-icon">
              <el-icon :size="40"><OfficeBuilding /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="16">
        <el-card class="chart-card">
          <template #header>
            <span class="chart-title">今日营收趋势</span>
          </template>
          <div id="revenue-chart" style="height: 300px"></div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="chart-card">
          <template #header>
            <span class="chart-title">菜品分类占比</span>
          </template>
          <div id="category-chart" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="bottom-row">
      <el-col :span="8">
        <el-card class="table-status-card">
          <template #header>
            <span class="chart-title">桌台状态</span>
          </template>
          <div class="table-status-content">
            <div class="status-item">
              <span class="status-label">总台数</span>
              <span class="status-value">{{ tableStatus.total }}</span>
            </div>
            <div class="status-item">
              <span class="status-label">空闲</span>
              <el-tag type="success">{{ tableStatus.vacant }}</el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">使用中</span>
              <el-tag type="warning">{{ tableStatus.occupied }}</el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">清台中</span>
              <el-tag type="info">{{ tableStatus.cleaning }}</el-tag>
            </div>
            <div class="status-item">
              <span class="status-label">预订</span>
              <el-tag>{{ tableStatus.reserved }}</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="top-items-card">
          <template #header>
            <span class="chart-title">热销菜品</span>
          </template>
          <div class="top-items-content">
            <div
              v-for="(item, index) in topItems"
              :key="index"
              class="top-item"
            >
              <span class="item-rank" :class="'rank-' + (index + 1)">
                {{ index + 1 }}
              </span>
              <span class="item-name">{{ item.name }}</span>
              <span class="item-quantity">{{ item.quantity }}份</span>
            </div>
            <div v-if="topItems.length === 0" class="empty-state">
              暂无数据
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="recent-orders-card">
          <template #header>
            <span class="chart-title">最近订单</span>
          </template>
          <div class="recent-orders-content">
            <div
              v-for="order in recentOrders"
              :key="order.id"
              class="recent-order"
            >
              <div class="order-info">
                <span class="order-number">{{ order.orderNumber }}</span>
                <el-tag :type="getOrderStatusTag(order.status).type" size="small">
                  {{ getOrderStatusTag(order.status).label }}
                </el-tag>
              </div>
              <span class="order-amount">{{ formatCurrency(order.totalAmount) }}</span>
            </div>
            <div v-if="recentOrders.length === 0" class="empty-state">
              暂无订单
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-info {
  .stat-label {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: #909399;
  }

  .stat-value {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
    color: #303133;
  }
}

.stat-icon {
  opacity: 0.8;
}

.revenue-card .stat-icon {
  color: #409eff;
}

.orders-card .stat-icon {
  color: #67c23a;
}

.avg-card .stat-icon {
  color: #e6a23c;
}

.table-card .stat-icon {
  color: #f56c6c;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.bottom-row {
  display: flex;
}

.table-status-card,
.top-items-card,
.recent-orders-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.table-status-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .status-label {
    font-size: 14px;
    color: #606266;
  }

  .status-value {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
  }
}

.top-items-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.top-item {
  display: flex;
  align-items: center;
  gap: 12px;

  .item-rank {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    color: #fff;
    background-color: #909399;
  }

  .rank-1 {
    background-color: #f56c6c;
  }

  .rank-2 {
    background-color: #e6a23c;
  }

  .rank-3 {
    background-color: #67c23a;
  }

  .item-name {
    flex: 1;
    font-size: 14px;
    color: #303133;
  }

  .item-quantity {
    font-size: 14px;
    color: #909399;
  }
}

.recent-orders-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-order {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .order-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .order-number {
      font-size: 14px;
      font-weight: 500;
      color: #303133;
    }
  }

  .order-amount {
    font-size: 14px;
    font-weight: 600;
    color: #409eff;
  }
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
}
</style>
