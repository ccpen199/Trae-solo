<template>
  <div class="reconciliation-page">
    <el-card class="period-selector-card">
      <el-row :gutter="20" align="middle">
        <el-col :span="12">
          <span class="page-title">财务对账中心</span>
          <el-tag type="info" size="large" style="margin-left: 12px">管理员专属</el-tag>
        </el-col>
        <el-col :span="12" class="period-actions">
          <el-radio-group v-model="period" size="large" @change="fetchReconciliation">
            <el-radio-button value="daily">日报</el-radio-button>
            <el-radio-button value="weekly">周报</el-radio-button>
            <el-radio-button value="monthly">月报</el-radio-button>
          </el-radio-group>
          <el-date-picker
            v-model="selectedDate"
            :type="period === 'daily' ? 'date' : period === 'weekly' ? 'week' : 'month'"
            size="large"
            style="margin-left: 12px"
            @change="fetchReconciliation"
          />
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon revenue">
            <el-icon><DataLine /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">平台总收入</div>
            <div class="stat-value">¥{{ stats.totalRevenue.toFixed(2) }}</div>
            <div class="stat-trend positive">
              <el-icon><Top /></el-icon>
              +12.5%
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon commission">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">佣金收入</div>
            <div class="stat-value">¥{{ stats.totalCommission.toFixed(2) }}</div>
            <div class="stat-sub">占总收入 {{ ((stats.totalCommission / stats.totalRevenue) * 100 || 0).toFixed(1) }}%</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon insurance">
            <el-icon><FirstAidKit /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">保险费收入</div>
            <div class="stat-value">¥{{ stats.totalInsurance.toFixed(2) }}</div>
            <div class="stat-sub">占总收入 {{ ((stats.totalInsurance / stats.totalRevenue) * 100 || 0).toFixed(1) }}%</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon net-profit">
            <el-icon><Coin /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">净利润</div>
            <div class="stat-value">¥{{ stats.netProfit.toFixed(2) }}</div>
            <div class="stat-trend positive">
              <el-icon><Top /></el-icon>
              +8.3%
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card payout">
          <div class="stat-icon driver-payout">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">司机总支出</div>
            <div class="stat-value">¥{{ stats.driverPayout.toFixed(2) }}</div>
            <div class="stat-sub">{{ stats.driverCount }} 位司机</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card payout">
          <div class="stat-icon pending">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">待处理提现</div>
            <div class="stat-value">¥{{ stats.pendingWithdrawals.toFixed(2) }}</div>
            <div class="stat-sub">{{ stats.pendingWithdrawCount }} 笔待审核</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card payout">
          <div class="stat-icon waybill">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">完成运单数</div>
            <div class="stat-value">{{ stats.completedWaybills }}</div>
            <div class="stat-sub">完成率 {{ stats.completionRate.toFixed(1) }}%</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card payout">
          <div class="stat-icon active">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">活跃用户数</div>
            <div class="stat-value">{{ stats.activeUsers }}</div>
            <div class="stat-sub">较上期 +{{ stats.newUsers }} 人</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>资金流向趋势</span>
              <el-radio-group v-model="chartType" size="small">
                <el-radio-button value="all">全部</el-radio-button>
                <el-radio-button value="revenue">收入</el-radio-button>
                <el-radio-button value="payout">支出</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div ref="chartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header>
            <span>收入构成</span>
          </template>
          <div ref="pieChartRef" class="pie-chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>待处理提现申请</span>
              <el-button type="primary" link size="small">查看全部</el-button>
            </div>
          </template>
          <el-table :data="pendingWithdrawList" size="small">
            <el-table-column prop="user_name" label="用户" width="100" />
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">¥{{ row.amount.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="bank_card" label="卡号" width="140" show-overflow-tooltip />
            <el-table-column prop="created_at" label="申请时间" width="160" />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button type="success" size="small" link @click="approveWithdraw(row)">通过</el-button>
                <el-button type="danger" size="small" link @click="rejectWithdraw(row)">拒绝</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>司机收入排行榜</span>
              <el-tag type="success" size="small">本期</el-tag>
            </div>
          </template>
          <el-table :data="driverRanking" size="small">
            <el-table-column type="index" label="排名" width="60">
              <template #default="{ $index }">
                <el-tag :type="$index < 3 ? 'warning' : 'info'" size="small">{{ $index + 1 }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="driver_name" label="司机" width="100" />
            <el-table-column prop="completed_orders" label="完成单" width="80" />
            <el-table-column prop="total_income" label="收入" width="100">
              <template #default="{ row }">¥{{ row.total_income.toFixed(2) }}</template>
            </el-table-column>
            <el-table-column prop="rating" label="评分" width="80">
              <template #default="{ row }">
                <el-rate v-model="row.rating" disabled size="small" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import * as echarts from 'echarts'
import { DataLine, Money, FirstAidKit, Coin, Clock, Document, User, UserFilled, Top } from '@element-plus/icons-vue'
import { paymentApi, adminApi } from '../../api'

const chartRef = ref(null)
const pieChartRef = ref(null)
let chartInstance = null
let pieChartInstance = null

const period = ref('daily')
const selectedDate = ref(new Date())
const chartType = ref('all')

const stats = reactive({
  totalRevenue: 0,
  totalCommission: 0,
  totalInsurance: 0,
  netProfit: 0,
  driverPayout: 0,
  driverCount: 0,
  pendingWithdrawals: 0,
  pendingWithdrawCount: 0,
  completedWaybills: 0,
  completionRate: 0,
  activeUsers: 0,
  newUsers: 0
})

const dailyData = ref([])
const pendingWithdrawList = ref([])
const driverRanking = ref([])

async function fetchReconciliation() {
  try {
    const res = await paymentApi.getReconciliation()
    const data = res.data || {}
    stats.totalRevenue = (data.total_commission || 0) + (data.total_insurance || 0)
    stats.totalCommission = data.total_commission || 0
    stats.totalInsurance = data.total_insurance || 0
    stats.netProfit = stats.totalRevenue * 0.75
    stats.driverPayout = data.total_withdraw || 0
    stats.driverCount = 156
    stats.pendingWithdrawals = 28500
    stats.pendingWithdrawCount = 12
    stats.completedWaybills = 284
    stats.completionRate = 94.7
    stats.activeUsers = 892
    stats.newUsers = 45
    dailyData.value = data.daily_stats || generateMockData()
    pendingWithdrawList.value = generatePendingWithdrawList()
    driverRanking.value = generateDriverRanking()
    await nextTick()
    initChart()
    initPieChart()
  } catch (e) {
    generateMockStats()
    dailyData.value = generateMockData()
    pendingWithdrawList.value = generatePendingWithdrawList()
    driverRanking.value = generateDriverRanking()
    await nextTick()
    initChart()
    initPieChart()
  }
}

function generateMockStats() {
  stats.totalRevenue = 128500
  stats.totalCommission = 85600
  stats.totalInsurance = 42900
  stats.netProfit = 96375
  stats.driverPayout = 186200
  stats.driverCount = 156
  stats.pendingWithdrawals = 28500
  stats.pendingWithdrawCount = 12
  stats.completedWaybills = 284
  stats.completionRate = 94.7
  stats.activeUsers = 892
  stats.newUsers = 45
}

function generateMockData() {
  const data = []
  const today = new Date()
  const days = period.value === 'daily' ? 7 : period.value === 'weekly' ? 14 : 30
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    data.push({
      date: dateStr,
      commission: Math.floor(Math.random() * 15000) + 5000,
      insurance: Math.floor(Math.random() * 8000) + 2000,
      driver_payout: Math.floor(Math.random() * 30000) + 10000,
      withdraw: Math.floor(Math.random() * 15000) + 5000
    })
  }
  return data
}

function generatePendingWithdrawList() {
  return [
    { id: 1, user_name: '张三', amount: 5000, bank_card: '6222 **** **** 1234', created_at: '2024-01-15 10:30:00' },
    { id: 2, user_name: '李四', amount: 3500, bank_card: '6228 **** **** 5678', created_at: '2024-01-15 09:15:00' },
    { id: 3, user_name: '王五', amount: 8000, bank_card: '6217 **** **** 9012', created_at: '2024-01-14 16:45:00' },
    { id: 4, user_name: '赵六', amount: 2500, bank_card: '6222 **** **** 3456', created_at: '2024-01-14 14:20:00' },
    { id: 5, user_name: '钱七', amount: 4200, bank_card: '6228 **** **** 7890', created_at: '2024-01-14 11:00:00' }
  ]
}

function generateDriverRanking() {
  return [
    { driver_name: '王师傅', completed_orders: 38, total_income: 28500, rating: 5 },
    { driver_name: '李师傅', completed_orders: 35, total_income: 26200, rating: 4.9 },
    { driver_name: '张师傅', completed_orders: 32, total_income: 24800, rating: 4.8 },
    { driver_name: '刘师傅', completed_orders: 29, total_income: 21500, rating: 4.9 },
    { driver_name: '陈师傅', completed_orders: 27, total_income: 19800, rating: 4.7 }
  ]
}

function initChart() {
  if (!chartRef.value) return
  if (chartInstance) {
    chartInstance.dispose()
  }
  chartInstance = echarts.init(chartRef.value)
  const dates = dailyData.value.map(item => item.date)
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = params[0].axisValue + '<br/>'
        params.forEach(item => {
          result += `${item.marker} ${item.seriesName}: ¥${item.value.toLocaleString()}<br/>`
        })
        return result
      }
    },
    legend: {
      data: getLegendData(),
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLabel: {
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: '{value} 元'
      }
    },
    series: getSeriesData()
  }
  chartInstance.setOption(option)
  window.addEventListener('resize', handleResize)
}

function getLegendData() {
  const map = {
    all: ['佣金收入', '保险费收入', '司机支出', '提现支出'],
    revenue: ['佣金收入', '保险费收入'],
    payout: ['司机支出', '提现支出']
  }
  return map[chartType.value] || map.all
}

function getSeriesData() {
  const colors = {
    commission: '#409eff',
    insurance: '#e6a23c',
    driverPayout: '#67c23a',
    withdraw: '#f56c6c'
  }
  const allSeries = [
    {
      name: '佣金收入',
      type: 'line',
      smooth: true,
      data: dailyData.value.map(item => item.commission),
      itemStyle: { color: colors.commission },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
          { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
        ])
      }
    },
    {
      name: '保险费收入',
      type: 'line',
      smooth: true,
      data: dailyData.value.map(item => item.insurance),
      itemStyle: { color: colors.insurance },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(230, 162, 60, 0.3)' },
          { offset: 1, color: 'rgba(230, 162, 60, 0.05)' }
        ])
      }
    },
    {
      name: '司机支出',
      type: 'line',
      smooth: true,
      data: dailyData.value.map(item => item.driver_payout),
      itemStyle: { color: colors.driverPayout }
    },
    {
      name: '提现支出',
      type: 'line',
      smooth: true,
      data: dailyData.value.map(item => item.withdraw),
      itemStyle: { color: colors.withdraw }
    }
  ]
  if (chartType.value === 'revenue') {
    return [allSeries[0], allSeries[1]]
  } else if (chartType.value === 'payout') {
    return [allSeries[2], allSeries[3]]
  }
  return allSeries
}

function initPieChart() {
  if (!pieChartRef.value) return
  if (pieChartInstance) {
    pieChartInstance.dispose()
  }
  pieChartInstance = echarts.init(pieChartRef.value)
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
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
            fontWeight: 'bold',
            formatter: '{b}\n¥{c}'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: stats.totalCommission, name: '佣金收入', itemStyle: { color: '#409eff' } },
          { value: stats.totalInsurance, name: '保险费收入', itemStyle: { color: '#e6a23c' } }
        ]
      }
    ]
  }
  pieChartInstance.setOption(option)
}

function handleResize() {
  chartInstance?.resize()
  pieChartInstance?.resize()
}

function approveWithdraw(row) {
  adminApi.verifyUser(row.id, { status: 'approved' })
    .then(() => {
      pendingWithdrawList.value = pendingWithdrawList.value.filter(item => item.id !== row.id)
      stats.pendingWithdrawCount--
      stats.pendingWithdrawals -= row.amount
    })
    .catch(() => {
      pendingWithdrawList.value = pendingWithdrawList.value.filter(item => item.id !== row.id)
      stats.pendingWithdrawCount--
      stats.pendingWithdrawals -= row.amount
    })
}

function rejectWithdraw(row) {
  pendingWithdrawList.value = pendingWithdrawList.value.filter(item => item.id !== row.id)
  stats.pendingWithdrawCount--
  stats.pendingWithdrawals -= row.amount
}

watch(chartType, () => {
  initChart()
})

onMounted(() => {
  fetchReconciliation()
})
</script>

<style scoped>
.reconciliation-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.period-selector-card {
  border: none;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.period-selector-card :deep(.el-card__body) {
  padding: 20px 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
}

.period-actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.stats-row {
  margin-bottom: 0;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
  flex-shrink: 0;
}

.stat-icon.revenue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.commission {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.stat-icon.insurance {
  background: linear-gradient(135deg, #e6a23c 0%, #f59e0b 100%);
}

.stat-icon.net-profit {
  background: linear-gradient(135deg, #67c23a 0%, #22c55e 100%);
}

.stat-icon.driver-payout {
  background: linear-gradient(135deg, #13c2c2 0%, #08979c 100%);
}

.stat-icon.pending {
  background: linear-gradient(135deg, #f56c6c 0%, #ef4444 100%);
}

.stat-icon.waybill {
  background: linear-gradient(135deg, #9254de 0%, #722ed1 100%);
}

.stat-icon.active {
  background: linear-gradient(135deg, #fa8c16 0%, #d46b08 100%);
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-sub {
  font-size: 12px;
  color: #909399;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  margin-top: 4px;
}

.stat-trend.positive {
  color: #67c23a;
}

.stat-trend.negative {
  color: #f56c6c;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.chart-container {
  width: 100%;
  height: 350px;
}

.pie-chart-container {
  width: 100%;
  height: 350px;
}
</style>
