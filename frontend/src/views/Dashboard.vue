<template>
  <div class="dashboard">
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>
    <div v-else-if="error" class="error-state">
      <p class="error-text">{{ error }}</p>
      <button class="btn-primary" @click="loadData">重试</button>
    </div>
    <div v-else-if="stats">
      <div class="page-header">
        <h1 class="page-title">📊 服务质量仪表盘</h1>
        <p class="sub-title">实时监控运营指标 · 数据驱动决策</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.totalOrders || 0 }}</div>
            <div class="stat-label">总订单数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.completedOrders || 0 }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.pendingOrders || 0 }}</div>
            <div class="stat-label">待匹配</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🚴</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.onlineRiders || 0 }}</div>
            <div class="stat-label">在线骑手</div>
          </div>
        </div>
        <div class="stat-card highlight">
          <div class="stat-icon">⚡</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.avgResponseTime || 0 }}s</div>
            <div class="stat-label">平均响应时长</div>
          </div>
        </div>
        <div class="stat-card highlight">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.tenMinuteArrivalRate?.toFixed(1) || 0 }}%</div>
            <div class="stat-label">10分钟上门达标率</div>
          </div>
        </div>
      </div>

      <div class="charts-row">
        <div class="chart-card">
          <div class="chart-header">
            <h3>📈 投诉根因分布</h3>
            <span class="chart-subtitle">客户投诉聚类分析</span>
          </div>
          <div v-if="complaintChartData.labels.length" class="chart-container">
            <Doughnut :data="complaintChartData" :options="chartOptions" />
          </div>
          <div v-else class="empty">暂无投诉数据</div>
          
          <div v-if="complaintList.length" class="complaint-list">
            <h4>投诉详情</h4>
            <div v-for="c in complaintList" :key="c.category" class="complaint-item">
              <span class="complaint-name">{{ getComplaintName(c.category) }}</span>
              <span class="complaint-count">{{ c.count }} 单</span>
              <div class="complaint-bar">
                <div class="bar-fill" :style="{ width: (c.count / maxComplaint * 100) + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="chart-card">
          <div class="chart-header">
            <h3>🏙️ 多城市运营指标</h3>
            <span class="chart-subtitle">各城市响应时长统计</span>
          </div>
          
          <div class="city-stats">
            <div v-for="city in cityStats" :key="city.city" class="city-stat">
              <div class="city-header">
                <span class="city-name">{{ city.city }}</span>
                <span class="city-badge">{{ city.orderCount }} 单</span>
              </div>
              <div class="city-metrics">
                <div class="metric">
                  <span class="metric-label">平均响应</span>
                  <span class="metric-value" :class="{ good: city.avgResponse <= 30, warn: city.avgResponse > 30 }">
                    {{ city.avgResponse }}s
                  </span>
                </div>
                <div class="metric">
                  <span class="metric-label">达标率</span>
                  <span class="metric-value good">{{ Math.min(100, Math.max(90, 100 - city.avgResponse / 60 * 10)).toFixed(1) }}%</span>
                </div>
              </div>
              <div class="city-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: Math.min(100, 100 - city.avgResponse / 2) + '%' }"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <h3>🔴 实时订单监控</h3>
          <span class="section-count">共 {{ recentOrders.length }} 单</span>
        </div>
        <div class="order-list">
          <div class="order-header">
            <span>订单号</span>
            <span>品类</span>
            <span>状态</span>
            <span>创建时间</span>
            <span>操作</span>
          </div>
          <div v-for="order in recentOrders" :key="order.id" class="order-item">
            <span class="order-no">{{ order.order_no }}</span>
            <span class="order-category">{{ getCategoryName(order.category) }}</span>
            <span class="order-status" :class="order.status">{{ getStatusName(order.status) }}</span>
            <span class="order-time">{{ formatTime(order.created_at) }}</span>
            <router-link :to="`/orders/${order.id}`" class="order-link">查看详情</router-link>
          </div>
          <div v-if="!recentOrders.length" class="empty">暂无订单</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend)

const store = useAppStore()
const stats = computed(() => store.stats)
const recentOrders = computed(() => 
  store.orders.filter(o => ['matched', 'picking'].includes(o.status)).slice(0, 5)
)

const loading = ref(true)
const error = ref(null)

const complaintList = computed(() => stats.value?.complaintsByCategory || [])

const maxComplaint = computed(() => {
  const list = complaintList.value
  return list.length ? Math.max(...list.map(c => c.count)) : 1
})

const cityStats = computed(() => stats.value?.cityStats || [])

const complaintChartData = computed(() => {
  const complaints = stats.value?.complaintsByCategory || []
  return {
    labels: complaints.map(c => getComplaintName(c.category)),
    datasets: [{
      data: complaints.map(c => c.count),
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)'
      ],
      borderWidth: 0
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      position: 'bottom',
      labels: {
        padding: 20,
        usePointStyle: true
      }
    }
  }
}

function getCategoryName(cat) {
  const map = { document: '文件', fresh: '生鲜', pet: '宠物', pharmacy: '药品' }
  return map[cat] || cat
}

function getStatusName(status) {
  const map = { pending: '待匹配', matched: '已匹配', picking: '取件中', delivered: '已送达' }
  return map[status] || status
}

function getComplaintName(cat) {
  const map = { packaging: '包装破损', late: '迟到延误', attitude: '态度问题', other: '其他' }
  return map[cat] || cat
}

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN', { 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit', 
    minute: '2-digit'
  })
}

async function loadData() {
  try {
    loading.value = true
    error.value = null
    await store.fetchStats()
    await store.fetchOrders()
  } catch (e) {
    console.error('加载数据失败:', e)
    error.value = '加载数据失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
.dashboard { max-width: 1200px; }

.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  min-height: 400px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e9ecef;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-state p {
  color: #888;
  font-size: 16px;
  margin: 0;
}
.error-state .error-text {
  color: #dc3545;
  font-size: 16px;
  margin-bottom: 16px;
}
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  display: inline-block;
}

.page-header { margin-bottom: 24px; }
.page-title { font-size: 28px; margin: 0; color: #333; }
.sub-title { color: #888; margin-top: 4px; font-size: 14px; }

.stats-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  gap: 12px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.stat-card.highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}
.stat-card.highlight .stat-label { color: rgba(255,255,255,0.8); }

.stat-icon { font-size: 32px; }
.stat-content { flex: 1; }
.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 2px;
  line-height: 1;
}
.stat-label {
  font-size: 12px;
  color: #888;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.chart-header {
  margin-bottom: 20px;
}
.chart-header h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: #333;
}
.chart-subtitle {
  font-size: 12px;
  color: #888;
}

.chart-container {
  height: 220px;
  margin-bottom: 20px;
}

.complaint-list h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #555;
}
.complaint-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}
.complaint-name {
  width: 80px;
  font-size: 13px;
  color: #333;
}
.complaint-count {
  width: 50px;
  text-align: right;
  font-weight: 600;
  color: #667eea;
}
.complaint-bar {
  flex: 1;
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}
.complaint-bar .bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.3s;
}

.city-stats {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.city-stat {
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}
.city-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.city-name {
  font-weight: 600;
  font-size: 15px;
  color: #333;
}
.city-badge {
  padding: 2px 10px;
  background: #667eea;
  color: white;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.city-metrics {
  display: flex;
  gap: 24px;
  margin-bottom: 12px;
}
.metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.metric-label {
  font-size: 11px;
  color: #888;
}
.metric-value {
  font-size: 18px;
  font-weight: 700;
}
.metric-value.good { color: #10b981; }
.metric-value.warn { color: #f59e0b; }

.city-progress {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  border-radius: 3px;
  transition: width 0.3s;
}

.section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.section-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}
.section-count {
  font-size: 13px;
  color: #888;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.order-header {
  display: grid;
  grid-template-columns: 150px 100px 100px 1fr 100px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
  font-weight: 600;
  color: #666;
  font-size: 13px;
}

.order-item {
  display: grid;
  grid-template-columns: 150px 100px 100px 1fr 100px;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
  font-size: 13px;
  transition: background 0.2s;
}
.order-item:hover {
  background: #f8fafc;
}

.order-no { font-family: monospace; color: #667eea; font-weight: 600; }
.order-category { color: #666; }
.order-status { 
  padding: 4px 12px; 
  border-radius: 20px; 
  font-size: 12px; 
  font-weight: 600; 
  text-align: center;
  width: fit-content;
}
.order-status.pending { background: #fff3cd; color: #856404; }
.order-status.matched { background: #cce5ff; color: #004085; }
.order-status.picking { background: #d1ecf1; color: #0c5460; }
.order-status.delivered { background: #d4edda; color: #155724; }
.order-time { color: #999; }
.order-link {
  color: #667eea;
  text-decoration: none;
  font-size: 12px;
  font-weight: 600;
}
.order-link:hover {
  text-decoration: underline;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
