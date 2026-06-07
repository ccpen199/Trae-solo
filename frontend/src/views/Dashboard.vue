<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="6" v-for="item in statCards" :key="item.title">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" :style="{ backgroundColor: item.color }">
              <el-icon :size="28"><component :is="item.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ item.value }}</div>
              <div class="stat-title">{{ item.title }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :lg="16" :md="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">{{ waybillCardTitle }}</span>
              <el-button type="primary" text @click="goToWaybill">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentWaybills" v-loading="loading.waybills" stripe>
            <el-table-column prop="id" label="运单号" width="120" />
            <el-table-column prop="cargo_name" label="货物名称" min-width="120" />
            <el-table-column label="路线" min-width="180">
              <template #default="{ row }">
                {{ row.departure_city || row.start_city }} → {{ row.destination_city || row.end_city }}
              </template>
            </el-table-column>
            <el-table-column prop="driver_name" label="司机" width="100" />
            <el-table-column prop="price" label="运费" width="100">
              <template #default="{ row }">
                ¥{{ formatMoney(row.price ?? row.agreed_price) }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewWaybill(row.id)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!loading.waybills && recentWaybills.length === 0" description="暂无运单数据" />
        </el-card>
      </el-col>

      <el-col :lg="8" :md="24">
        <el-card shadow="hover">
          <template #header>
            <span class="card-title">快捷操作</span>
          </template>
          <div class="quick-actions">
            <div class="action-item" v-for="action in quickActions" :key="action.title" @click="action.handler">
              <div class="action-icon" :style="{ backgroundColor: action.color }">
                <el-icon :size="24"><component :is="action.icon" /></el-icon>
              </div>
              <span class="action-text">{{ action.title }}</span>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" style="margin-top: 20px">
          <template #header>
            <span class="card-title">待处理预警</span>
          </template>
          <div class="alerts-list" v-if="alerts.length > 0">
            <div class="alert-item" v-for="alert in alerts" :key="alert.id">
              <el-icon :class="['alert-icon', alert.type]"><Warning /></el-icon>
              <div class="alert-content">
                <div class="alert-title">{{ alert.title }}</div>
                <div class="alert-time">{{ alert.time }}</div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无预警信息" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Goods, Document, Wallet, Warning,
  Plus, List, User, Message,
  TrendCharts, DataAnalysis, ScaleToOriginal
} from '@element-plus/icons-vue'
import { waybillApi } from '../api/index'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

const isShipper = computed(() => userStore.isShipper)
const isDriver = computed(() => userStore.isDriver)
const isAdmin = computed(() => userStore.isAdmin)

const loading = reactive({
  stats: false,
  waybills: false
})

const stats = ref({
  total_cargo: 0,
  pending_waybills: 0,
  balance: 0,
  pending_alerts: 0,
  available_cargo: 0,
  my_bids: 0,
  credit_score: 0,
  total_users: 0,
  total_waybills: 0,
  platform_funds: 0
})

const recentWaybills = ref([])
const alerts = ref([])

const statCards = computed(() => {
  if (isShipper.value) {
    return [
      { title: '总货源', value: stats.value.total_cargo, icon: Goods, color: '#409eff' },
      { title: '待处理运单', value: stats.value.pending_waybills, icon: Document, color: '#67c23a' },
      { title: '账户余额', value: `¥${stats.value.balance?.toFixed(2) || '0.00'}`, icon: Wallet, color: '#e6a23c' },
      { title: '待处理预警', value: stats.value.pending_alerts, icon: Warning, color: '#f56c6c' }
    ]
  }
  if (isDriver.value) {
    return [
      { title: '可接货源', value: stats.value.available_cargo, icon: Goods, color: '#409eff' },
      { title: '我的报价', value: stats.value.my_bids, icon: Document, color: '#67c23a' },
      { title: '账户余额', value: `¥${stats.value.balance?.toFixed(2) || '0.00'}`, icon: Wallet, color: '#e6a23c' },
      { title: '信用评分', value: stats.value.credit_score, icon: TrendCharts, color: '#f56c6c' }
    ]
  }
  if (isAdmin.value) {
    return [
      { title: '总用户', value: stats.value.total_users, icon: User, color: '#409eff' },
      { title: '总运单', value: stats.value.total_waybills, icon: Document, color: '#67c23a' },
      { title: '平台资金', value: `¥${stats.value.platform_funds?.toFixed(2) || '0.00'}`, icon: Wallet, color: '#e6a23c' },
      { title: '待处理预警', value: stats.value.pending_alerts, icon: Warning, color: '#f56c6c' }
    ]
  }
  return [
    { title: '总货源', value: stats.value.total_cargo, icon: Goods, color: '#409eff' },
    { title: '待处理运单', value: stats.value.pending_waybills, icon: Document, color: '#67c23a' },
    { title: '账户余额', value: `¥${stats.value.balance?.toFixed(2) || '0.00'}`, icon: Wallet, color: '#e6a23c' },
    { title: '待处理预警', value: stats.value.pending_alerts, icon: Warning, color: '#f56c6c' }
  ]
})

const quickActions = computed(() => {
  if (isShipper.value) {
    return [
      { title: '发布货源', icon: Plus, color: '#409eff', handler: () => router.push('/shipper/cargo/publish') },
      { title: '货源管理', icon: List, color: '#67c23a', handler: () => router.push('/shipper/cargo') },
      { title: '企业认证', icon: User, color: '#e6a23c', handler: () => router.push('/shipper/cert') },
      { title: '熟车白名单', icon: ScaleToOriginal, color: '#909399', handler: () => router.push('/shipper/whitelist') },
      { title: '合作记录', icon: Message, color: '#b37feb', handler: () => router.push('/shipper/cooperation') }
    ]
  }
  if (isDriver.value) {
    return [
      { title: '货源接单池', icon: Goods, color: '#409eff', handler: () => router.push('/driver/cargo-pool') },
      { title: '我的报价', icon: List, color: '#67c23a', handler: () => router.push('/driver/my-bids') },
      { title: '司机信息', icon: User, color: '#e6a23c', handler: () => router.push('/driver/info') }
    ]
  }
  if (isAdmin.value) {
    return [
      { title: '用户管理', icon: User, color: '#409eff', handler: () => router.push('/admin/users') },
      { title: '运单监控', icon: Document, color: '#67c23a', handler: () => router.push('/admin/waybills') },
      { title: '异常预警', icon: Warning, color: '#e6a23c', handler: () => router.push('/admin/alerts') },
      { title: '资金对账', icon: DataAnalysis, color: '#f56c6c', handler: () => router.push('/admin/reconciliation') }
    ]
  }
  return []
})

const waybillCardTitle = computed(() => {
  if (isShipper.value || isDriver.value) return '我的运单'
  return '最近运单'
})

function getStatusType(status) {
  const map = {
    created: 'info',
    pending: 'info',
    loading: 'warning',
    in_transit: 'primary',
    transporting: 'primary',
    completed: 'success',
    abnormal: 'danger',
    exception: 'danger',
    cancelled: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = {
    created: '待装货',
    pending: '待处理',
    loading: '装货中',
    in_transit: '运输中',
    transporting: '运输中',
    completed: '已完成',
    abnormal: '异常',
    exception: '异常',
    cancelled: '已取消'
  }
  return map[status] || status
}

function formatMoney(value) {
  const amount = Number(value ?? 0)
  return amount.toFixed(2)
}

function goToWaybill() {
  if (isShipper.value) return router.push('/shipper/cargo')
  if (isDriver.value) return router.push('/driver/cargo-pool')
  if (isAdmin.value) return router.push('/admin/waybills')
  return router.push('/waybill')
}

function viewWaybill(id) {
  router.push(`/waybill/${id}`)
}

async function fetchStats() {
  loading.stats = true
  try {
    const res = await waybillApi.getDashboardStats()
    stats.value = { ...stats.value, ...(res.data || {}) }
    if (res.data?.alerts) {
      alerts.value = res.data.alerts
    }
  } catch (e) {
    console.error('获取统计数据失败', e)
  } finally {
    loading.stats = false
  }
}

async function fetchWaybills() {
  loading.waybills = true
  try {
    const res = await waybillApi.getList({ page: 1, page_size: 5 })
    recentWaybills.value = res.data?.list || res.data || []
  } catch (e) {
    ElMessage.error('获取运单列表失败')
  } finally {
    loading.waybills = false
  }
}

onMounted(() => {
  fetchStats()
  fetchWaybills()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}
.stats-row {
  margin-bottom: 20px;
}
.stat-card {
  border-radius: 8px;
}
.stat-content {
  display: flex;
  align-items: center;
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
}
.stat-info {
  flex: 1;
}
.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  line-height: 1.2;
}
.stat-title {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}
.content-row {
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-weight: 600;
  font-size: 16px;
}
.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}
.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}
.action-item:hover {
  background-color: #f5f7fa;
}
.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.action-text {
  font-size: 13px;
  color: #606266;
}
.alerts-list {
  max-height: 240px;
  overflow-y: auto;
}
.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}
.alert-item:last-child {
  border-bottom: none;
}
.alert-icon {
  font-size: 20px;
  margin-top: 2px;
}
.alert-icon.warning {
  color: #e6a23c;
}
.alert-icon.danger {
  color: #f56c6c;
}
.alert-content {
  flex: 1;
}
.alert-title {
  font-size: 14px;
  color: #303133;
  line-height: 1.4;
}
.alert-time {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
