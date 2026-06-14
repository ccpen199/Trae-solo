<template>
  <div class="dashboard-container">
    <el-card class="welcome-card" shadow="never">
      <div class="welcome-content">
        <div class="welcome-text">
          <h2 class="welcome-title">
            欢迎回来，{{ userInfo?.username || '用户' }}
            <el-tag type="success" effect="dark" class="role-tag">
              {{ roleText }}
            </el-tag>
          </h2>
          <p class="welcome-desc">今天是 {{ currentDate }}，祝您工作愉快！</p>
        </div>
        <div class="welcome-icon">
          <el-icon :size="64"><Sunny /></el-icon>
        </div>
      </div>
    </el-card>

    <div class="stats-grid">
      <el-card class="stat-card stat-card-1" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">今日回收量</p>
            <p class="stat-value">{{ stats.todayRecycle }} <span class="stat-unit">吨</span></p>
            <p class="stat-trend">
              <el-icon class="trend-up"><ArrowUp /></el-icon>
              较昨日 +12.5%
            </p>
          </div>
          <div class="stat-icon stat-icon-1">
            <el-icon :size="32"><TrendCharts /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card stat-card-2" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">今日订单数</p>
            <p class="stat-value">{{ stats.todayOrders }} <span class="stat-unit">单</span></p>
            <p class="stat-trend">
              <el-icon class="trend-up"><ArrowUp /></el-icon>
              较昨日 +8.3%
            </p>
          </div>
          <div class="stat-icon stat-icon-2">
            <el-icon :size="32"><Document /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card stat-card-3" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">在途车辆数</p>
            <p class="stat-value">{{ stats.onwayVehicles }} <span class="stat-unit">辆</span></p>
            <p class="stat-trend">
              <el-icon class="trend-down"><ArrowDown /></el-icon>
              较昨日 -3.2%
            </p>
          </div>
          <div class="stat-icon stat-icon-3">
            <el-icon :size="32"><Van /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card stat-card-4" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">累计存证数</p>
            <p class="stat-value">{{ stats.totalRecords }} <span class="stat-unit">条</span></p>
            <p class="stat-trend">
              <el-icon class="trend-up"><ArrowUp /></el-icon>
              较昨日 +156
            </p>
          </div>
          <div class="stat-icon stat-icon-4">
            <el-icon :size="32"><Coin /></el-icon>
          </div>
        </div>
      </el-card>
    </div>

    <div class="charts-row">
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">近7日回收量趋势</span>
          </div>
        </template>
        <div ref="lineChartRef" class="chart-container"></div>
      </el-card>

      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">废弃物分类占比</span>
          </div>
        </template>
        <div ref="pieChartRef" class="chart-container"></div>
      </el-card>
    </div>

    <el-card class="orders-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">最新订单</span>
          <el-button type="primary" link @click="viewAllOrders">查看全部</el-button>
        </div>
      </template>
      <el-table :data="orderList" style="width: 100%">
        <el-table-column prop="orderNo" label="订单编号" width="180" />
        <el-table-column prop="wasteType" label="废弃物类型" width="140" />
        <el-table-column prop="weight" label="重量（吨）" width="120" />
        <el-table-column prop="amount" label="金额（元）" width="140">
          <template #default="scope">
            <span class="amount-text">¥{{ scope.row.amount.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="statusTypeMap[scope.row.status]" effect="light">
              {{ statusTextMap[scope.row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import { useUserStore } from '@/store/user'
import {
  Sunny, ArrowUp, ArrowDown, TrendCharts, Document, Van, Coin
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()
const lineChartRef = ref(null)
const pieChartRef = ref(null)
let lineChart = null
let pieChart = null

const userInfo = computed(() => userStore.userInfo)

const roleText = computed(() => {
  const roleMap = {
    producer: '产废方',
    collector: '收废商',
    processor: '利废厂',
    admin: '管理员'
  }
  return roleMap[userInfo.value?.role] || '用户'
})

const currentDate = computed(() => {
  return dayjs().format('YYYY年MM月DD日 dddd')
})

const stats = ref({
  todayRecycle: 328.5,
  todayOrders: 86,
  onwayVehicles: 42,
  totalRecords: 12580
})

const statusTypeMap = {
  pending: 'warning',
  processing: 'primary',
  completed: 'success',
  cancelled: 'info'
}

const statusTextMap = {
  pending: '待处理',
  processing: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}

const orderList = ref([
  {
    orderNo: 'DD202406140001',
    wasteType: '废塑料',
    weight: 12.5,
    amount: 8750,
    status: 'processing',
    createTime: '2024-06-14 09:30:25'
  },
  {
    orderNo: 'DD202406140002',
    wasteType: '废金属',
    weight: 8.3,
    amount: 12450,
    status: 'pending',
    createTime: '2024-06-14 10:15:42'
  },
  {
    orderNo: 'DD202406140003',
    wasteType: '废纸',
    weight: 25.6,
    amount: 5120,
    status: 'completed',
    createTime: '2024-06-14 08:45:10'
  },
  {
    orderNo: 'DD202406140004',
    wasteType: '废玻璃',
    weight: 6.8,
    amount: 2040,
    status: 'processing',
    createTime: '2024-06-14 11:20:33'
  },
  {
    orderNo: 'DD202406140005',
    wasteType: '废电子',
    weight: 3.2,
    amount: 9600,
    status: 'pending',
    createTime: '2024-06-14 13:05:18'
  }
])

const initLineChart = () => {
  if (!lineChartRef.value) return
  lineChart = echarts.init(lineChartRef.value)
  const dates = []
  for (let i = 6; i >= 0; i--) {
    dates.push(dayjs().subtract(i, 'day').format('MM-DD'))
  }
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8f5e9',
      borderWidth: 1,
      textStyle: {
        color: '#333'
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
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#e0e0e0'
        }
      },
      axisLabel: {
        color: '#666'
      }
    },
    yAxis: {
      type: 'value',
      name: '吨',
      nameTextStyle: {
        color: '#999'
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0'
        }
      },
      axisLabel: {
        color: '#666'
      }
    },
    series: [
      {
        name: '回收量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: [
              { offset: 0, color: '#81c784' },
              { offset: 1, color: '#43a047' }
            ]
          }
        },
        itemStyle: {
          color: '#43a047',
          borderWidth: 2,
          borderColor: '#fff'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(102, 187, 106, 0.3)' },
              { offset: 1, color: 'rgba(102, 187, 106, 0.05)' }
            ]
          }
        },
        data: [285, 310, 295, 330, 308, 298, 328.5]
      }
    ]
  }
  lineChart.setOption(option)
}

const initPieChart = () => {
  if (!pieChartRef.value) return
  pieChart = echarts.init(pieChartRef.value)
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8f5e9',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      formatter: '{b}: {c}吨 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: {
        color: '#666',
        fontSize: 13
      }
    },
    series: [
      {
        name: '废弃物分类',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
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
            fontSize: 18,
            fontWeight: 'bold',
            color: '#333'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 125.6, name: '废塑料', itemStyle: { color: '#66bb6a' } },
          { value: 98.3, name: '废金属', itemStyle: { color: '#81c784' } },
          { value: 76.5, name: '废纸', itemStyle: { color: '#a5d6a7' } },
          { value: 45.2, name: '废玻璃', itemStyle: { color: '#c5e1a5' } },
          { value: 32.8, name: '废电子', itemStyle: { color: '#dcedc8' } }
        ]
      }
    ]
  }
  pieChart.setOption(option)
}

const handleResize = () => {
  lineChart?.resize()
  pieChart?.resize()
}

const viewAllOrders = () => {
  const role = userInfo.value?.role
  if (role === 'producer') {
    router.push('/producer/orders')
  } else if (role === 'collector') {
    router.push('/collector/orders')
  } else if (role === 'processor') {
    router.push('/processor/purchases')
  }
}

onMounted(() => {
  initLineChart()
  initPieChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  lineChart?.dispose()
  pieChart?.dispose()
})
</script>

<style scoped>
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-card {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
  border: none;
  border-radius: 12px;
  color: #fff;
}

.welcome-card :deep(.el-card__body) {
  padding: 24px 28px;
}

.welcome-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.welcome-title {
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.role-tag {
  font-size: 13px;
  font-weight: normal;
}

.welcome-desc {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

.welcome-icon {
  opacity: 0.8;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  border-radius: 12px;
  overflow: hidden;
}

.stat-card :deep(.el-card__body) {
  padding: 20px;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin: 0 0 8px 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.stat-unit {
  font-size: 14px;
  font-weight: normal;
  color: #909399;
}

.stat-trend {
  font-size: 12px;
  color: #909399;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-icon-1 {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
}

.stat-icon-2 {
  background: linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%);
}

.stat-icon-3 {
  background: linear-gradient(135deg, #ffb74d 0%, #f57c00 100%);
}

.stat-icon-4 {
  background: linear-gradient(135deg, #ba68c8 0%, #7b1fa2 100%);
}

.charts-row {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 20px;
}

.chart-card {
  border-radius: 12px;
}

.chart-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.chart-card :deep(.el-card__body) {
  padding: 16px 20px 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.chart-container {
  width: 100%;
  height: 320px;
}

.orders-card {
  border-radius: 12px;
}

.orders-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.orders-card :deep(.el-card__body) {
  padding: 16px 20px 20px;
}

.amount-text {
  color: #e6a23c;
  font-weight: 500;
}
</style>
