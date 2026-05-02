<template>
  <div class="store-dashboard">
    <div class="dashboard-header">
      <h3>{{ userInfo?.storeName || '门店' }}</h3>
      <p class="date">{{ currentDate }}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><TrendCharts /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">¥{{ dashboardData?.todaySales?.toFixed(2) || '0.00' }}</div>
          <div class="stat-label">今日销售</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><Tickets /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ dashboardData?.todayTransactions || 0 }}</div>
          <div class="stat-label">交易笔数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><Money /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">¥{{ dashboardData?.monthSales?.toFixed(2) || '0.00' }}</div>
          <div class="stat-label">本月销售</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><Warning /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ dashboardData?.lowStockCount || 0 }}</div>
          <div class="stat-label">低库存商品</div>
        </div>
      </div>
    </div>

    <div class="sales-trend">
      <h4>销售趋势</h4>
      <div class="trend-placeholder">
        <p>销售趋势图表</p>
      </div>
    </div>

    <div class="recent-transactions">
      <h4>最近交易</h4>
      <div class="transaction-list">
        <div v-for="(item, index) in recentTransactions" :key="index" class="transaction-item">
          <div class="transaction-content">
            <div class="transaction-time">{{ formatTime(item.time) }}</div>
            <div class="transaction-product">{{ item.product }}</div>
          </div>
          <div class="transaction-amount">
            ¥{{ item.amount.toFixed(2) }}
          </div>
        </div>
        <div v-if="recentTransactions.length === 0" class="empty-transactions">
          <p>暂无交易记录</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { TrendCharts, Tickets, Money, Warning } from '@element-plus/icons-vue'

const dashboardData = ref(null)
const recentTransactions = ref([])

const userInfo = computed(() => {
  const user = localStorage.getItem('userInfo')
  return user ? JSON.parse(user) : null
})

const currentDate = computed(() => {
  const date = new Date()
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

onMounted(() => {
  loadDashboardData()
  loadRecentTransactions()
  // 定时刷新数据
  setInterval(() => {
    loadDashboardData()
    loadRecentTransactions()
  }, 60000)
})

const loadDashboardData = async () => {
  if (!userInfo.value?.storeId) return
  
  try {
    const response = await axios.get(`/api/manager/dashboard?storeId=${userInfo.value.storeId}`)
    if (response.data.success) {
      dashboardData.value = response.data.data
    }
  } catch (error) {
    console.error('加载看板数据失败:', error)
    // 加载模拟数据
    loadMockDashboardData()
  }
}

const loadRecentTransactions = async () => {
  if (!userInfo.value?.storeId) return
  
  try {
    const response = await axios.get(`/api/manager/realtime-sales?storeId=${userInfo.value.storeId}`)
    if (response.data.success && response.data.data.transactions) {
      recentTransactions.value = response.data.data.transactions.slice(0, 5)
    }
  } catch (error) {
    console.error('加载交易数据失败:', error)
    // 加载模拟数据
    loadMockTransactions()
  }
}

const loadMockDashboardData = () => {
  dashboardData.value = {
    todaySales: 1250.5,
    todayTransactions: 25,
    monthSales: 32500.75,
    lowStockCount: 5
  }
}

const loadMockTransactions = () => {
  recentTransactions.value = [
    {
      time: '10:30',
      product: '可口可乐 x 2',
      amount: 7
    },
    {
      time: '10:25',
      product: '康师傅冰红茶 x 1',
      amount: 3
    },
    {
      time: '10:15',
      product: '脉动 x 1',
      amount: 4
    },
    {
      time: '10:05',
      product: '农夫山泉 x 3',
      amount: 6
    },
    {
      time: '09:50',
      product: '百事可乐 x 2',
      amount: 7
    }
  ]
}

const formatTime = (time) => {
  if (!time) return ''
  if (typeof time === 'string' && time.length === 5) {
    return time
  }
  const date = new Date(time)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.store-dashboard {
  padding-bottom: 20px;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 20px;
}

.dashboard-header h3 {
  margin: 0 0 5px 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.date {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 10px;
  padding: 15px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 40px;
  height: 40px;
  background: #f0f9eb;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
}

.stat-icon .el-icon {
  font-size: 20px;
  color: #67c23a;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.sales-trend,
.recent-transactions {
  background: white;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sales-trend h4,
.recent-transactions h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.trend-placeholder {
  height: 200px;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  border-radius: 4px;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-time {
  font-size: 12px;
  color: #909399;
  margin-bottom: 3px;
}

.transaction-product {
  font-size: 14px;
  color: #333;
}

.transaction-amount {
  font-size: 16px;
  font-weight: 600;
  color: #67c23a;
}

.empty-transactions {
  text-align: center;
  padding: 30px 0;
  color: #909399;
}
</style>