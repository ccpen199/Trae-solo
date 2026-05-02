<template>
  <div class="dashboard-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon income">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ todayData.total_amount || 0 }}</div>
              <div class="stat-label">今日交易额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon order">
              <el-icon><List /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ todayData.order_count || 0 }}</div>
              <div class="stat-label">今日订单数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon balance">
              <el-icon><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ balanceData.available || 0 }}</div>
              <div class="stat-label">可用余额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon frozen">
              <el-icon><Lock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ balanceData.frozen || 0 }}</div>
              <div class="stat-label">冻结金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近订单</span>
              <el-button type="primary" text @click="goToOrders">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" v-loading="loading" stripe>
            <el-table-column prop="order_no" label="订单号" min-width="150">
              <template #default="{ row }">
                <el-text type="primary" size="small">{{ row.order_no }}</el-text>
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" width="100">
              <template #default="{ row }">
                ¥{{ row.amount }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="时间" width="160">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="action-card" @click="goToBalance">
                <el-icon class="action-icon"><Wallet /></el-icon>
                <div class="action-label">余额管理</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="action-card" @click="goToPayouts">
                <el-icon class="action-icon"><Money /></el-icon>
                <div class="action-label">申请打款</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="action-card" @click="goToProfitSharings">
                <el-icon class="action-icon"><PieChart /></el-icon>
                <div class="action-label">分润明细</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Money, List, Wallet, Lock, PieChart } from '@element-plus/icons-vue'
import api from '@/utils/api'

const router = useRouter()

const loading = ref(false)
const todayData = reactive({
  total_amount: 0,
  order_count: 0
})

const balanceData = reactive({
  available: 0,
  frozen: 0
})

const recentOrders = ref([])

const statusMap = {
  'pending': { label: '待支付', type: 'info' },
  'paying': { label: '支付中', type: 'warning' },
  'paid': { label: '已支付', type: 'success' },
  'failed': { label: '支付失败', type: 'danger' },
  'refunding': { label: '退款中', type: 'warning' },
  'refunded': { label: '已退款', type: 'info' },
  'closed': { label: '已关闭', type: 'info' }
}

function getStatusLabel(status) {
  return statusMap[status]?.label || status
}

function getStatusType(status) {
  return statusMap[status]?.type || 'info'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

async function loadDashboard() {
  loading.value = true
  try {
    const response = await api.get('/v1/merchant/dashboard')
    if (response.success) {
      const data = response.data
      todayData.total_amount = data.today?.total_amount || 0
      todayData.order_count = data.today?.order_count || 0
      balanceData.available = data.balance?.available || 0
      balanceData.frozen = data.balance?.frozen || 0
      recentOrders.value = data.recent_orders || []
    }
  } catch (error) {
    console.error('Load dashboard error:', error)
  } finally {
    loading.value = false
  }
}

function goToOrders() {
  router.push({ name: 'MerchantOrders' })
}

function goToBalance() {
  router.push({ name: 'MerchantBalance' })
}

function goToPayouts() {
  router.push({ name: 'MerchantPayouts' })
}

function goToProfitSharings() {
  router.push({ name: 'MerchantProfitSharings' })
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.dashboard-container {
  width: 100%;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #fff;
  margin-right: 16px;
}

.stat-icon.income {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.order {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.balance {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.frozen {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-card {
  text-align: center;
  padding: 30px 20px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
}

.action-card:hover {
  background: #f5f7fa;
}

.action-icon {
  font-size: 40px;
  color: #409eff;
  margin-bottom: 12px;
}

.action-label {
  font-size: 14px;
  color: #606266;
}
</style>
