<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>全屋定制订单管理系统</h1>
      <p>欢迎使用智能订单管理平台</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon demand-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.demands }}</div>
          <div class="stat-label">需求总数</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon order-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <path d="M16 10a4 4 0 0 1-8 0"></path>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.orders }}</div>
          <div class="stat-label">订单数量</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon production-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="11" width="12" height="11" rx="2"></rect>
            <circle cx="12" cy="5" r="3"></circle>
            <path d="M9 17h6"></path>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.production }}</div>
          <div class="stat-label">生产任务</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon installation-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
            <path d="M15 2v4h4M7 10h2M7 14h2M7 18h2"></path>
          </svg>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ stats.installations }}</div>
          <div class="stat-label">安装任务</div>
        </div>
      </div>
    </div>

    <div class="recent-section">
      <h2>最近订单</h2>
      <el-table :data="recentOrders" border>
        <el-table-column prop="orderNumber" label="订单编号" />
        <el-table-column prop="title" label="订单名称" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="金额" formatter="formatMoney" />
        <el-table-column prop="createdAt" label="创建时间" />
        <el-table-column label="操作">
          <template #default="scope">
            <el-button size="small" @click="goToOrder(scope.row.id)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="quick-actions">
      <h2>快捷操作</h2>
      <div class="action-grid">
        <div class="action-card" @click="$router.push('/demands')">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          <span>创建需求</span>
        </div>
        <div class="action-card" @click="$router.push('/orders')">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9"></path>
          </svg>
          <span>订单管理</span>
        </div>
        <div class="action-card" @click="$router.push('/production')">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 0 18 14.158V11a6.002 6.002 0 0 0-4-5.659V5a2 2 0 1 0-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"></path>
          </svg>
          <span>生产管理</span>
        </div>
        <div class="action-card" @click="$router.push('/installations')">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 6h2l3-3h6l3 3h2"></path>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
            <path d="M7 6h10"></path>
            <line x1="9" y1="12" x2="9" y2="15"></line>
            <line x1="15" y1="12" x2="15" y2="15"></line>
          </svg>
          <span>安装管理</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { orderApi, demandApi, productionApi, installationApi } from '../api'

const router = useRouter()
const stats = ref({
  demands: 0,
  orders: 0,
  production: 0,
  installations: 0
})

const recentOrders = ref<any[]>([])

onMounted(async () => {
  await loadStats()
  await loadRecentOrders()
})

const loadStats = async () => {
  try {
    const [demandRes, orderRes, productionRes, installationRes] = await Promise.all([
      demandApi.list(),
      orderApi.list(),
      productionApi.list(),
      installationApi.list()
    ])
    stats.value = {
      demands: (demandRes.data.data?.demands || demandRes.data.demands || []).length,
      orders: (orderRes.data.data?.orders || orderRes.data.orders || []).length,
      production: (productionRes.data.data?.tasks || productionRes.data.tasks || []).length,
      installations: (installationRes.data.data?.installations || installationRes.data.installations || []).length
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const loadRecentOrders = async () => {
  try {
    const res = await orderApi.list()
    recentOrders.value = ((res.data.data?.orders || res.data.orders || []) as any[]).slice(0, 5)
  } catch (error) {
    console.error('加载最近订单失败:', error)
  }
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    'PENDING': 'warning',
    'CONTRACT_SIGNED': 'info',
    'PAID': 'success',
    'PRODUCTION_SCHEDULED': 'info',
    'PRODUCTION_IN_PROGRESS': 'warning',
    'PRODUCTION_COMPLETED': 'success',
    'INSTALLATION_ASSIGNED': 'info',
    'INSTALLATION_SCHEDULED': 'info',
    'INSTALLATION_IN_PROGRESS': 'warning',
    'INSTALLATION_COMPLETED': 'success',
    'ACCEPTED': 'success'
  }
  return types[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'PENDING': '待处理',
    'CONTRACT_SIGNED': '已签约',
    'PAID': '已支付',
    'PRODUCTION_SCHEDULED': '生产已安排',
    'PRODUCTION_IN_PROGRESS': '生产中',
    'PRODUCTION_COMPLETED': '生产完成',
    'INSTALLATION_ASSIGNED': '安装已分配',
    'INSTALLATION_SCHEDULED': '安装已安排',
    'INSTALLATION_IN_PROGRESS': '安装中',
    'INSTALLATION_COMPLETED': '安装完成',
    'ACCEPTED': '已验收'
  }
  return texts[status] || status
}

const goToOrder = (id: string) => {
  router.push(`/orders/${id}`)
}
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.dashboard-header {
  margin-bottom: 30px;
}

.dashboard-header h1 {
  font-size: 28px;
  color: #1f2937;
  margin: 0;
}

.dashboard-header p {
  color: #6b7280;
  margin-top: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.demand-icon {
  background: #dbeafe;
  color: #3b82f6;
}

.order-icon {
  background: #dcfce7;
  color: #22c55e;
}

.production-icon {
  background: #fef3c7;
  color: #f59e0b;
}

.installation-icon {
  background: #fce7f3;
  color: #ec4899;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.recent-section, .quick-actions {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.recent-section h2, .quick-actions h2 {
  font-size: 18px;
  margin: 0 0 20px 0;
  color: #1f2937;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: #f9fafb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  color: #374151;
}

.action-card:hover {
  background: #f3f4f6;
  transform: translateY(-2px);
}

.action-card svg {
  color: #6b7280;
}
</style>