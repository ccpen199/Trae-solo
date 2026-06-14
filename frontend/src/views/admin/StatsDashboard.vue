<template>
  <div class="stats-dashboard-container">
    <div class="stats-cards">
      <el-card class="stat-card stat-card-1" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">总用户数</p>
            <p class="stat-value">{{ stats.totalUsers }} <span class="stat-unit">人</span></p>
            <p class="stat-trend">
              <el-icon class="trend-up"><ArrowUp /></el-icon>
              本月新增 +128
            </p>
          </div>
          <div class="stat-icon">
            <el-icon :size="36"><User /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card stat-card-2" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">总订单数</p>
            <p class="stat-value">{{ stats.totalOrders }} <span class="stat-unit">单</span></p>
            <p class="stat-trend">
              <el-icon class="trend-up"><ArrowUp /></el-icon>
              本月新增 +356
            </p>
          </div>
          <div class="stat-icon">
            <el-icon :size="36"><Document /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card stat-card-3" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">总回收量</p>
            <p class="stat-value">{{ stats.totalRecycle }} <span class="stat-unit">吨</span></p>
            <p class="stat-trend">
              <el-icon class="trend-up"><ArrowUp /></el-icon>
              本月新增 +2,458
            </p>
          </div>
          <div class="stat-icon">
            <el-icon :size="36"><TrendCharts /></el-icon>
          </div>
        </div>
      </el-card>

      <el-card class="stat-card stat-card-4" shadow="hover">
        <div class="stat-content">
          <div class="stat-info">
            <p class="stat-label">存证数量</p>
            <p class="stat-value">{{ stats.totalRecords }} <span class="stat-unit">条</span></p>
            <p class="stat-trend">
              <el-icon class="trend-up"><ArrowUp /></el-icon>
              今日新增 +89
            </p>
          </div>
          <div class="stat-icon">
            <el-icon :size="36"><Coin /></el-icon>
          </div>
        </div>
      </el-card>
    </div>

    <div class="charts-row charts-row-1">
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">月度回收量趋势</span>
            <el-select v-model="recycleChartType" size="small" style="width: 120px">
              <el-option label="近6个月" value="6" />
              <el-option label="近12个月" value="12" />
            </el-select>
          </div>
        </template>
        <div ref="barChartRef" class="chart-container"></div>
      </el-card>

      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">用户角色分布</span>
          </div>
        </template>
        <div ref="rolePieChartRef" class="chart-container"></div>
      </el-card>
    </div>

    <div class="charts-row charts-row-2">
      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">废弃物分类占比</span>
          </div>
        </template>
        <div ref="wastePieChartRef" class="chart-container"></div>
      </el-card>

      <el-card class="chart-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span class="card-title">各省份回收量</span>
            <span class="card-subtitle">TOP 10</span>
          </div>
        </template>
        <div ref="provinceBarChartRef" class="chart-container"></div>
      </el-card>
    </div>

    <el-card class="orders-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span class="card-title">近期交易记录</span>
          <el-button type="primary" link>查看全部</el-button>
        </div>
      </template>
      <el-table :data="recentOrders" style="width: 100%">
        <el-table-column prop="orderNo" label="订单编号" width="180" />
        <el-table-column prop="wasteType" label="废弃物类型" width="140" />
        <el-table-column prop="buyer" label="买方" width="180" />
        <el-table-column prop="seller" label="卖方" width="180" />
        <el-table-column prop="weight" label="重量（吨）" width="120" />
        <el-table-column prop="amount" label="金额（元）" width="140">
          <template #default="scope">
            <span class="amount-text">¥{{ scope.row.amount.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="statusTypeMap[scope.row.status]" effect="light" size="small">
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
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import {
  ArrowUp, User, Document, TrendCharts, Coin
} from '@element-plus/icons-vue'

const barChartRef = ref(null)
const rolePieChartRef = ref(null)
const wastePieChartRef = ref(null)
const provinceBarChartRef = ref(null)
const recycleChartType = ref('6')

let barChart = null
let rolePieChart = null
let wastePieChart = null
let provinceBarChart = null

const stats = ref({
  totalUsers: 3256,
  totalOrders: 8642,
  totalRecycle: 156800,
  totalRecords: 42358
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

const recentOrders = ref([
  {
    orderNo: 'DD202406140001',
    wasteType: '废塑料',
    buyer: '绿源再生资源',
    seller: '鑫源回收',
    weight: 12.5,
    amount: 8750,
    status: 'processing',
    createTime: '2024-06-14 09:30:25'
  },
  {
    orderNo: 'DD202406140002',
    wasteType: '废金属',
    buyer: '宝盛金属',
    seller: '金诚回收',
    weight: 8.3,
    amount: 12450,
    status: 'pending',
    createTime: '2024-06-14 10:15:42'
  },
  {
    orderNo: 'DD202406140003',
    wasteType: '废纸',
    buyer: '华丰纸业',
    seller: '顺达回收',
    weight: 25.6,
    amount: 5120,
    status: 'completed',
    createTime: '2024-06-14 08:45:10'
  },
  {
    orderNo: 'DD202406140004',
    wasteType: '废玻璃',
    buyer: '明晶玻璃',
    seller: '绿源回收',
    weight: 6.8,
    amount: 2040,
    status: 'processing',
    createTime: '2024-06-14 11:20:33'
  },
  {
    orderNo: 'DD202406140005',
    wasteType: '废电子',
    buyer: '金源电子',
    seller: '恒泰回收',
    weight: 3.2,
    amount: 9600,
    status: 'pending',
    createTime: '2024-06-14 13:05:18'
  },
  {
    orderNo: 'DD202406140006',
    wasteType: '危废',
    buyer: '安泰环保',
    seller: '恒泰危废',
    weight: 2.5,
    amount: 18750,
    status: 'completed',
    createTime: '2024-06-14 07:50:00'
  }
])

const initBarChart = () => {
  if (!barChartRef.value) return
  barChart = echarts.init(barChartRef.value)
  
  const months = recycleChartType.value === '6'
    ? ['1月', '2月', '3月', '4月', '5月', '6月']
    : ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  
  const data = recycleChartType.value === '6'
    ? [18500, 21200, 19800, 24500, 28600, 32100]
    : [15600, 18500, 21200, 19800, 22400, 24500, 26800, 25200, 27800, 30200, 28600, 32100]

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8f5e9',
      borderWidth: 1,
      textStyle: { color: '#333' },
      formatter: '{b}<br/>回收量: {c} 吨'
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
      data: months,
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      axisLabel: { color: '#666' }
    },
    yAxis: {
      type: 'value',
      name: '吨',
      nameTextStyle: { color: '#999' },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { color: '#666' }
    },
    series: [
      {
        name: '回收量',
        type: 'bar',
        barWidth: '40%',
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#66bb6a' },
              { offset: 1, color: '#a5d6a7' }
            ]
          }
        },
        data: data
      }
    ]
  }
  barChart.setOption(option)
}

const initRolePieChart = () => {
  if (!rolePieChartRef.value) return
  rolePieChart = echarts.init(rolePieChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8f5e9',
      borderWidth: 1,
      textStyle: { color: '#333' },
      formatter: '{b}: {c}人 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { color: '#666', fontSize: 13 }
    },
    series: [
      {
        name: '用户角色',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 18, fontWeight: 'bold', color: '#333' },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        labelLine: { show: false },
        data: [
          { value: 1256, name: '产废方', itemStyle: { color: '#66bb6a' } },
          { value: 892, name: '收废商', itemStyle: { color: '#4fc3f7' } },
          { value: 658, name: '利废厂', itemStyle: { color: '#ffb74d' } },
          { value: 450, name: '管理员', itemStyle: { color: '#ba68c8' } }
        ]
      }
    ]
  }
  rolePieChart.setOption(option)
}

const initWastePieChart = () => {
  if (!wastePieChartRef.value) return
  wastePieChart = echarts.init(wastePieChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8f5e9',
      borderWidth: 1,
      textStyle: { color: '#333' },
      formatter: '{b}: {c}吨 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      itemWidth: 12,
      itemHeight: 12,
      textStyle: { color: '#666', fontSize: 13 }
    },
    series: [
      {
        name: '废弃物分类',
        type: 'pie',
        radius: '65%',
        center: ['35%', '50%'],
        roseType: 'radius',
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: { show: false },
        labelLine: { show: false },
        data: [
          { value: 45600, name: '废塑料', itemStyle: { color: '#66bb6a' } },
          { value: 38200, name: '废金属', itemStyle: { color: '#81c784' } },
          { value: 28500, name: '废纸', itemStyle: { color: '#a5d6a7' } },
          { value: 15800, name: '废玻璃', itemStyle: { color: '#c5e1a5' } },
          { value: 12600, name: '废电子', itemStyle: { color: '#dcedc8' } },
          { value: 16100, name: '其他', itemStyle: { color: '#e8f5e9' } }
        ]
      }
    ]
  }
  wastePieChart.setOption(option)
}

const initProvinceBarChart = () => {
  if (!provinceBarChartRef.value) return
  provinceBarChart = echarts.init(provinceBarChartRef.value)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8f5e9',
      borderWidth: 1,
      textStyle: { color: '#333' },
      formatter: '{b}: {c} 吨'
    },
    grid: {
      left: '3%',
      right: '8%',
      bottom: '3%',
      top: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } },
      axisLabel: { color: '#666' }
    },
    yAxis: {
      type: 'category',
      data: ['江苏省', '广东省', '浙江省', '山东省', '河北省', '上海市', '四川省', '湖北省', '福建省', '安徽省'],
      axisLine: { lineStyle: { color: '#e0e0e0' } },
      axisLabel: { color: '#666', fontSize: 12 }
    },
    series: [
      {
        name: '回收量',
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          borderRadius: [0, 6, 6, 0],
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#a5d6a7' },
              { offset: 1, color: '#43a047' }
            ]
          }
        },
        data: [28500, 25600, 22800, 19600, 16500, 14200, 12800, 11500, 10200, 8900]
      }
    ]
  }
  provinceBarChart.setOption(option)
}

const handleResize = () => {
  barChart?.resize()
  rolePieChart?.resize()
  wastePieChart?.resize()
  provinceBarChart?.resize()
}

onMounted(() => {
  initBarChart()
  initRolePieChart()
  initWastePieChart()
  initProvinceBarChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  barChart?.dispose()
  rolePieChart?.dispose()
  wastePieChart?.dispose()
  provinceBarChart?.dispose()
})
</script>

<style scoped>
.stats-dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-cards {
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
  font-weight: 700;
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

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-card-1 .stat-icon {
  background: linear-gradient(135deg, #66bb6a 0%, #43a047 100%);
}

.stat-card-2 .stat-icon {
  background: linear-gradient(135deg, #4fc3f7 0%, #0288d1 100%);
}

.stat-card-3 .stat-icon {
  background: linear-gradient(135deg, #ffb74d 0%, #f57c00 100%);
}

.stat-card-4 .stat-icon {
  background: linear-gradient(135deg, #ba68c8 0%, #7b1fa2 100%);
}

.charts-row {
  display: grid;
  gap: 20px;
}

.charts-row-1 {
  grid-template-columns: 1.5fr 1fr;
}

.charts-row-2 {
  grid-template-columns: 1fr 1.2fr;
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

.card-subtitle {
  font-size: 12px;
  color: #909399;
}

.chart-container {
  width: 100%;
  height: 300px;
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
  font-weight: 600;
}
</style>
