<template>
  <div class="dashboard-page">
    <div class="page-header">
      <div class="page-title">数据概览</div>
      <div class="page-subtitle">
        <span v-if="isAdmin">系统管理员工作台</span>
        <span v-else-if="isOperator">运营工作台</span>
        <span v-else-if="isFinance">财务工作台</span>
        <span v-else-if="isAnchor">主播工作台</span>
        <span v-else>用户工作台</span>
      </div>
    </div>

    <div v-if="loading" class="loading-container">
      <el-icon class="loading-icon"><Loading /></el-icon>
      <div>加载中...</div>
    </div>

    <div v-else-if="overview">
      <el-row :gutter="16">
        <el-col :span="6" v-for="(card, idx) in statCards" :key="idx">
          <div class="stat-card" :class="{ clickable: card.link }" @click="card.link && goToPage(card.link)">
            <div class="stat-icon" :style="{ background: card.color }">
              {{ card.icon }}
            </div>
            <div class="stat-content">
              <div class="stat-label">{{ card.label }}</div>
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-sub" v-if="card.sub">{{ card.sub }}</div>
              <div class="stat-alert" v-if="card.alert" style="color: #f56c6c;">
                {{ card.alert }}
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top: 16px;" v-if="!isAnchor">
        <el-col :span="8">
          <div class="panel-card" :class="{ clickable: true }" @click="goToPage('/risk')">
            <div class="panel-header">
              <span class="panel-title">⚠️ 风控待处理</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="risk-grid">
              <div class="risk-item" v-for="(item, key) in riskItems" :key="key">
                <div class="risk-count" :class="{ highlight: item.count > 0 }">{{ item.count }}</div>
                <div class="risk-label">{{ item.label }}</div>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="panel-card" :class="{ clickable: true }" @click="goToPage('/risk')">
            <div class="panel-header">
              <span class="panel-title">❄️ 冻结收益</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="risk-grid">
              <div class="risk-item">
                <div class="risk-count highlight">{{ frozenCount }}</div>
                <div class="risk-label">冻结中</div>
              </div>
              <div class="risk-item">
                <div class="risk-count" style="color: #e6a23c;">¥{{ frozenAmount }}</div>
                <div class="risk-label">冻结金额</div>
              </div>
              <div class="risk-item">
                <div class="risk-count">{{ releasedCount }}</div>
                <div class="risk-label">已解冻</div>
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="panel-card" :class="{ clickable: true }" @click="goToPage('/activities')">
            <div class="panel-header">
              <span class="panel-title">📊 活动效果 TOP3</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="activity-list">
              <div class="activity-item" v-for="(act, idx) in topActivities" :key="act.id">
                <span class="activity-rank">{{ idx + 1 }}</span>
                <span class="activity-name">{{ act.name }}</span>
                <span class="activity-stats">{{ act.order_count }}单 ¥{{ act.total_amount }}</span>
              </div>
              <div v-if="topActivities.length === 0" class="empty-tip">
                暂无活动数据
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top: 16px;">
        <el-col :span="12">
          <div class="panel-card">
            <div class="panel-header clickable" @click="goToPage('/reports')">
              <span class="panel-title">每日销售趋势</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div ref="trendChart" style="height: 280px;"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="panel-card">
            <div class="panel-header clickable" @click="goToPage('/reports')">
              <span class="panel-title">用户偏好分析</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <div class="preference-content">
              <div class="preference-item">
                <div class="pref-title">稀有度分布</div>
                <div class="pref-bars">
                  <div class="pref-bar" v-for="r in rarityBars" :key="r.name">
                    <span class="pref-label">{{ r.name }}</span>
                    <div class="pref-bar-track">
                      <div class="pref-bar-fill" :style="{ width: r.percent + '%', background: r.color }"></div>
                    </div>
                    <span class="pref-value">¥{{ r.amount }}</span>
                  </div>
                </div>
              </div>
              <div class="preference-item">
                <div class="pref-title">场景分布</div>
                <div class="pref-bars">
                  <div class="pref-bar" v-for="s in sceneBars" :key="s.name">
                    <span class="pref-label">{{ s.name }}</span>
                    <div class="pref-bar-track">
                      <div class="pref-bar-fill" :style="{ width: s.percent + '%', background: s.color }"></div>
                    </div>
                    <span class="pref-value">¥{{ s.amount }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top: 16px;">
        <el-col :span="12">
          <div class="panel-card">
            <div class="panel-header clickable" @click="goToPage('/reports')">
              <span class="panel-title">主播收入排行</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <el-table :data="anchorList" size="small" @row-click="viewAnchorDetail">
              <el-table-column label="排名" width="60" align="center">
                <template #default="{ $index }">
                  <el-tag v-if="$index < 3" :type="['danger', 'warning', 'success'][$index]" size="small">{{ $index + 1 }}</el-tag>
                  <span v-else>{{ $index + 1 }}</span>
                </template>
              </el-table-column>
              <el-table-column label="主播" width="120">
                <template #default="{ row }">{{ row.nickname || row.username }}</template>
              </el-table-column>
              <el-table-column prop="total_quantity" label="礼物数" width="80" align="center" />
              <el-table-column prop="fan_count" label="粉丝数" width="80" align="center" />
              <el-table-column prop="total_received" label="总收入">
                <template #default="{ row }">¥{{ (row.total_received || 0).toFixed(2) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="panel-card">
            <div class="panel-header clickable" @click="goToPage('/reports')">
              <span class="panel-title">热销礼物 TOP6</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <el-table :data="giftList" size="small" @row-click="viewGiftDetail">
              <el-table-column label="礼物" width="140">
                <template #default="{ row }">
                  <span class="gift-icon">{{ row.icon }}</span>{{ row.name }}
                </template>
              </el-table-column>
              <el-table-column prop="total_quantity" label="销量" width="70" align="center" />
              <el-table-column prop="order_count" label="订单数" width="70" align="center" />
              <el-table-column prop="total_amount" label="销售额">
                <template #default="{ row }">¥{{ (row.total_amount || 0).toFixed(2) }}</template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16" style="margin-top: 16px;">
        <el-col :span="24">
          <div class="panel-card">
            <div class="panel-header clickable" @click="goToPage('/orders')">
              <span class="panel-title">最近订单</span>
              <el-icon><ArrowRight /></el-icon>
            </div>
            <el-table :data="recentOrders" size="small" stripe>
              <el-table-column prop="order_no" label="订单号" width="170" />
              <el-table-column label="送礼用户" width="110">
                <template #default="{ row }">{{ row.user_nickname || row.user_name }}</template>
              </el-table-column>
              <el-table-column label="接收主播" width="110">
                <template #default="{ row }">{{ row.receiver_nickname || row.receiver_name }}</template>
              </el-table-column>
              <el-table-column label="礼物" width="120">
                <template #default="{ row }">{{ row.gift_icon }} {{ row.gift_name }} x{{ row.quantity }}</template>
              </el-table-column>
              <el-table-column prop="total_amount" label="金额" width="90" align="right">
                <template #default="{ row }">¥{{ (row.total_amount || 0).toFixed(2) }}</template>
              </el-table-column>
              <el-table-column prop="scene" label="场景" width="70" align="center" />
              <el-table-column prop="activity_name" label="活动来源" width="130">
                <template #default="{ row }">{{ row.activity_name || '-' }}</template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="70" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">{{ row.status === 'success' ? '成功' : '失败' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="message" label="留言" min-width="100" show-overflow-tooltip />
              <el-table-column prop="created_at" label="时间" width="150" />
              <el-table-column label="操作" width="70" align="center">
                <template #default="{ row }">
                  <el-button size="small" link @click.stop="viewOrderDetail(row)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-dialog v-model="orderDetailVisible" title="订单详情" width="500px">
      <div v-if="currentOrder">
        <el-descriptions :column="1" border size="small">
          <el-descriptions-item label="订单号">{{ currentOrder.order_no }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentOrder.status === 'success' ? 'success' : 'danger'" size="small">{{ currentOrder.status === 'success' ? '成功' : '失败' }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="送礼用户">{{ currentOrder.user_nickname || currentOrder.user_name }}</el-descriptions-item>
          <el-descriptions-item label="接收主播">{{ currentOrder.receiver_nickname || currentOrder.receiver_name }}</el-descriptions-item>
          <el-descriptions-item label="礼物">{{ currentOrder.gift_icon }} {{ currentOrder.gift_name }} x {{ currentOrder.quantity }}</el-descriptions-item>
          <el-descriptions-item label="金额">¥{{ (currentOrder.total_amount || 0).toFixed(2) }}</el-descriptions-item>
          <el-descriptions-item label="场景">{{ currentOrder.scene || '-' }}</el-descriptions-item>
          <el-descriptions-item label="活动来源">{{ currentOrder.activity_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="留言">{{ currentOrder.message || '-' }}</el-descriptions-item>
          <el-descriptions-item label="时间">{{ currentOrder.created_at }}</el-descriptions-item>
          <el-descriptions-item v-if="currentOrder.status === 'failed'" label="失败原因">
            <span style="color: #f56c6c;">{{ currentOrder.fail_reason }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../store/user'
import { ArrowRight, Loading } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import request from '../utils/request'

const router = useRouter()
const userStore = useUserStore()
const overview = ref(null)
const loading = ref(true)
const trendChart = ref(null)
const orderDetailVisible = ref(false)
const currentOrder = ref(null)

const isAdmin = computed(() => userStore.user?.role === 'admin')
const isOperator = computed(() => userStore.user?.role === 'operator')
const isFinance = computed(() => userStore.user?.role === 'finance')
const isAnchor = computed(() => userStore.user?.role === 'anchor')
const isUser = computed(() => userStore.user?.role === 'user')

const statCards = computed(() => {
  if (!overview.value) return []
  
  const cards = [
    {
      icon: '📦',
      label: '订单总数',
      value: overview.value.totalOrders?.count || 0,
      sub: `总金额: ¥${(overview.value.totalOrders?.amount || 0).toFixed(2)}`,
      alert: overview.value.failedOrders?.count > 0 ? `失败 ${overview.value.failedOrders.count} 笔` : null,
      color: '#409eff',
      link: '/orders'
    },
    {
      icon: '👥',
      label: '付费用户',
      value: overview.value.userStats?.paying_users || 0,
      sub: `接收用户: ${overview.value.userStats?.receiving_users || 0}`,
      color: '#67c23a',
      link: '/users'
    }
  ]

  if (isAnchor.value) {
    const me = overview.value.anchorIncome?.find(a => a.id === userStore.user?.id)
    cards.push(
      {
        icon: '💰',
        label: '我的收益',
        value: `¥${(me?.total_received || 0).toFixed(2)}`,
        sub: `收到礼物: ${me?.total_quantity || 0} 个`,
        color: '#e6a23c',
        link: null
      },
      {
        icon: '❤️',
        label: '我的粉丝',
        value: me?.fan_count || 0,
        sub: '送礼人数',
        color: '#f56c6c',
        link: null
      }
    )
  } else {
    cards.push(
      {
        icon: '🎁',
        label: '礼物库',
        value: getGiftCount('online') + getGiftCount('offline'),
        sub: `上架: ${getGiftCount('online')} | 下架: ${getGiftCount('offline')}`,
        color: '#e6a23c',
        link: '/gifts'
      },
      {
        icon: '🎉',
        label: '进行中活动',
        value: getActivityCount('published'),
        sub: `草稿: ${getActivityCount('draft')} | 结束: ${getActivityCount('ended')}`,
        color: '#f56c6c',
        link: '/activities'
      }
    )
  }

  return cards
})

const riskItems = computed(() => {
  if (!overview.value?.riskStats) return {}
  const types = {
    abnormal_recharge: '异常充值',
    malicious_ranking: '恶意刷榜',
    refund_dispute: '退款争议',
    minor_consumption: '未成年消费'
  }
  const result = {}
  for (const [type, label] of Object.entries(types)) {
    const item = overview.value.riskStats.find(r => r.type === type && r.status === 'pending')
    result[type] = { count: item?.count || 0, label }
  }
  return result
})

const frozenCount = computed(() => getFrozenCount('frozen'))
const frozenAmount = computed(() => (getFrozenAmount('frozen') || 0).toFixed(2))
const releasedCount = computed(() => getFrozenCount('released'))

const topActivities = computed(() => {
  return (overview.value?.activityEffectiveness || []).filter(a => a.order_count > 0).slice(0, 3)
})

const anchorList = computed(() => overview.value?.anchorIncome?.slice(0, 6) || [])
const giftList = computed(() => overview.value?.giftSales?.slice(0, 6) || [])
const recentOrders = computed(() => overview.value?.recentOrders || [])

const rarityBars = computed(() => {
  if (!overview.value?.giftSales) return []
  const map = { normal: '普通', rare: '稀有', epic: '史诗', legendary: '传说' }
  const colors = { normal: '#909399', rare: '#409eff', epic: '#9c27b0', legendary: '#f56c6c' }
  const data = {}
  overview.value.giftSales.forEach(g => {
    if (!data[g.rarity]) data[g.rarity] = 0
    data[g.rarity] += g.total_amount || 0
  })
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  return Object.entries(data).map(([rarity, amount]) => ({
    name: map[rarity] || rarity,
    amount: amount.toFixed(0),
    percent: total > 0 ? Math.round((amount / total) * 100) : 0,
    color: colors[rarity] || '#909399'
  })).sort((a, b) => b.amount - a.amount)
})

const sceneBars = computed(() => {
  if (!overview.value?.recentOrders) return []
  const data = {}
  overview.value.recentOrders.forEach(o => {
    if (o.status !== 'success') return
    const scene = o.scene || '其他'
    if (!data[scene]) data[scene] = 0
    data[scene] += o.total_amount || 0
  })
  const total = Object.values(data).reduce((a, b) => a + b, 0)
  const colors = { '直播': '#409eff', '社区': '#67c23a', '其他': '#909399' }
  return Object.entries(data).map(([name, amount]) => ({
    name,
    amount: amount.toFixed(0),
    percent: total > 0 ? Math.round((amount / total) * 100) : 0,
    color: colors[name] || '#909399'
  })).sort((a, b) => b.amount - a.amount)
})

function getGiftCount(status) {
  if (!overview.value?.giftStats) return 0
  const s = overview.value.giftStats.find(g => g.status === status)
  return s?.count || 0
}

function getActivityCount(status) {
  if (!overview.value?.activityStats) return 0
  const s = overview.value.activityStats.find(a => a.status === status)
  return s?.count || 0
}

function getFrozenCount(status) {
  if (!overview.value?.frozenStats) return 0
  const s = overview.value.frozenStats.find(f => f.status === status)
  return s?.count || 0
}

function getFrozenAmount(status) {
  if (!overview.value?.frozenStats) return 0
  const s = overview.value.frozenStats.find(f => f.status === status)
  return s?.amount || 0
}

function goToPage(path) {
  router.push(path)
}

function viewGiftDetail(row) {
  router.push({ path: '/reports', query: { tab: 'gift-sales', giftId: row.id } })
}

function viewAnchorDetail(row) {
  router.push({ path: '/reports', query: { tab: 'anchor-ranking', anchorId: row.id } })
}

function viewOrderDetail(row) {
  currentOrder.value = row
  orderDetailVisible.value = true
}

async function loadData() {
  loading.value = true
  try {
    overview.value = await request.get('/reports/overview')
    await nextTick()
    renderCharts()
  } finally {
    loading.value = false
  }
}

function renderCharts() {
  if (trendChart.value && overview.value?.dailyData) {
    const chart = echarts.init(trendChart.value)
    const dates = overview.value.dailyData.map(d => d.date).reverse()
    const amounts = overview.value.dailyData.map(d => d.total_amount).reverse()
    const counts = overview.value.dailyData.map(d => d.order_count).reverse()
    
    chart.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['销售额', '订单数'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: dates },
      yAxis: [{ type: 'value', name: '金额' }, { type: 'value', name: '数量' }],
      series: [
        { name: '销售额', type: 'line', data: amounts, smooth: true, itemStyle: { color: '#409eff' } },
        { name: '订单数', type: 'bar', yAxisIndex: 1, data: counts, itemStyle: { color: '#67c23a' } }
      ]
    })
  }
}

onMounted(loadData)
</script>

<style scoped>
.dashboard-page {
  min-height: 100%;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #909399;
}

.loading-icon {
  font-size: 40px;
  margin-bottom: 12px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  transition: all 0.3s;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 16px;
  color: #fff;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
  line-height: 1.2;
}

.stat-sub {
  font-size: 12px;
  color: #909399;
}

.stat-alert {
  font-size: 12px;
  margin-top: 4px;
}

.panel-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.panel-header.clickable {
  cursor: pointer;
}

.panel-header.clickable:hover {
  color: #409eff;
}

.panel-title {
  display: flex;
  align-items: center;
}

.risk-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.risk-item {
  text-align: center;
  padding: 8px 4px;
  background: #f5f7fa;
  border-radius: 6px;
}

.risk-count {
  font-size: 20px;
  font-weight: 600;
  color: #909399;
  line-height: 1.2;
}

.risk-count.highlight {
  color: #f56c6c;
}

.risk-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.activity-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.activity-rank {
  width: 20px;
  font-weight: 600;
  color: #f56c6c;
}

.activity-name {
  flex: 1;
  margin: 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-stats {
  font-size: 12px;
  color: #67c23a;
  flex-shrink: 0;
}

.empty-tip {
  text-align: center;
  color: #909399;
  padding: 20px 0;
  font-size: 13px;
}

.preference-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preference-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.pref-title {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

.pref-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pref-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pref-label {
  width: 50px;
  font-size: 12px;
  color: #909399;
  flex-shrink: 0;
}

.pref-bar-track {
  flex: 1;
  height: 8px;
  background: #f0f2f5;
  border-radius: 4px;
  overflow: hidden;
}

.pref-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.pref-value {
  width: 60px;
  font-size: 12px;
  color: #606266;
  text-align: right;
  flex-shrink: 0;
}

.page-subtitle {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.gift-icon {
  margin-right: 4px;
}
</style>
