<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-info">
              <p class="stats-label">用户总数</p>
              <p class="stats-value">{{ stats.customers }}</p>
            </div>
            <div class="stats-icon icon-blue">
              <el-icon size="32"><UserFilled /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-info">
              <p class="stats-label">商品总数</p>
              <p class="stats-value">{{ stats.products }}</p>
            </div>
            <div class="stats-icon icon-green">
              <el-icon size="32"><Goods /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-info">
              <p class="stats-label">订单总数</p>
              <p class="stats-value">{{ stats.orders }}</p>
            </div>
            <div class="stats-icon icon-orange">
              <el-icon size="32"><ShoppingCart /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card class="stats-card" shadow="hover">
          <div class="stats-content">
            <div class="stats-info">
              <p class="stats-label">今日销售</p>
              <p class="stats-value">¥{{ stats.todaySales }}</p>
            </div>
            <div class="stats-icon icon-purple">
              <el-icon size="32"><Money /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="16" :lg="16">
        <el-card class="section-card">
          <template #header>
            <div class="card-header">
              <span>销售统计</span>
            </div>
          </template>
          <div class="sales-grid">
            <div class="sales-item">
              <div class="sales-label">今日订单</div>
              <div class="sales-value">{{ stats.todayOrders }}</div>
              <div class="sales-unit">笔</div>
            </div>
            <div class="sales-item">
              <div class="sales-label">本月销售额</div>
              <div class="sales-value">{{ stats.thisMonthSales }}</div>
              <div class="sales-unit">元</div>
            </div>
            <div class="sales-item">
              <div class="sales-label">待处理订单</div>
              <div class="sales-value danger">{{ stats.pendingOrders }}</div>
              <div class="sales-unit">笔</div>
            </div>
            <div class="sales-item">
              <div class="sales-label">待退款</div>
              <div class="sales-value warning">{{ stats.pendingRefunds }}</div>
              <div class="sales-unit">笔</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :sm="24" :md="8" :lg="8">
        <el-card class="section-card">
          <template #header>
            <div class="card-header">
              <span>库存预警</span>
              <el-tag type="danger" v-if="stats.lowInventory > 0">{{ stats.lowInventory }} 种商品</el-tag>
            </div>
          </template>
          <div class="warning-box" v-if="stats.lowInventory > 0">
            <el-icon size="48" color="#F56C6C"><WarningFilled /></el-icon>
            <p class="warning-text">有 {{ stats.lowInventory }} 种商品库存不足</p>
            <el-button type="primary" link @click="goToInventory">查看库存</el-button>
          </div>
          <div class="no-warning" v-else>
            <el-icon size="48" color="#67C23A"><CircleCheckFilled /></el-icon>
            <p>库存状态正常</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="section-card">
          <template #header>
            <div class="card-header">
              <span>快捷入口</span>
            </div>
          </template>
          <div class="quick-actions">
            <div
              v-for="item in quickActions"
              :key="item.key"
              class="quick-action-item"
              @click="goToPage(item.path)"
            >
              <el-icon :size="32" class="quick-action-icon">
                <component :is="item.icon" />
              </el-icon>
              <span class="quick-action-name">{{ item.name }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="section-card">
          <template #header>
            <div class="card-header">
              <span>最近订单</span>
              <el-button type="primary" link @click="goToOrders">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentOrders" v-loading="loading" stripe>
            <el-table-column prop="order_no" label="订单编号" min-width="180" />
            <el-table-column prop="customer_name" label="客户名称" min-width="120" />
            <el-table-column prop="customer_account" label="客户账号" min-width="120" />
            <el-table-column prop="total_amount" label="订单金额" min-width="100">
              <template #default="{ row }">
                ¥{{ row.total_amount }}
              </template>
            </el-table-column>
            <el-table-column prop="status_text" label="订单状态" min-width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ row.status_text }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" min-width="180">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import dayjs from 'dayjs'

const router = useRouter()

const loading = ref(false)
const stats = reactive({
  customers: 0,
  products: 0,
  orders: 0,
  todayOrders: 0,
  todaySales: 0,
  thisMonthSales: 0,
  pendingOrders: 0,
  pendingRefunds: 0,
  lowInventory: 0
})

const quickActions = ref([])
const recentOrders = ref([])

async function loadStats() {
  try {
    const res = await request.get('/api/dashboard/stats')
    if (res.success) {
      Object.assign(stats, res.data)
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

async function loadQuickActions() {
  try {
    const res = await request.get('/api/dashboard/quick-actions')
    if (res.success) {
      quickActions.value = res.data
    }
  } catch (error) {
    console.error('加载快捷入口失败:', error)
  }
}

async function loadRecentOrders() {
  loading.value = true
  try {
    const res = await request.get('/api/dashboard/recent-orders')
    if (res.success) {
      recentOrders.value = res.data
    }
  } catch (error) {
    console.error('加载最近订单失败:', error)
  } finally {
    loading.value = false
  }
}

function goToPage(path) {
  router.push(path)
}

function goToInventory() {
  router.push('/inventory')
}

function goToOrders() {
  router.push('/order')
}

function getStatusType(status) {
  const types = {
    1: 'warning',
    2: 'primary',
    3: 'info',
    4: 'success',
    5: 'danger',
    6: ''
  }
  return types[status] || ''
}

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

onMounted(() => {
  loadStats()
  loadQuickActions()
  loadRecentOrders()
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100%;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  border-radius: 8px;
}

.stats-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stats-info .stats-label {
  font-size: 14px;
  color: #909399;
  margin: 0 0 8px 0;
}

.stats-info .stats-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.stats-icon {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-blue {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.icon-green {
  background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
  color: #fff;
}

.icon-orange {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: #fff;
}

.icon-purple {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.section-card {
  border-radius: 8px;
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.sales-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.sales-item {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.sales-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.sales-value {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.sales-value.danger {
  color: #f56c6c;
}

.sales-value.warning {
  color: #e6a23c;
}

.sales-unit {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.warning-box,
.no-warning {
  text-align: center;
  padding: 20px 0;
}

.warning-text {
  color: #f56c6c;
  font-size: 16px;
  margin: 16px 0 8px 0;
}

.no-warning p {
  color: #67c23a;
  font-size: 16px;
  margin: 16px 0 0 0;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.quick-action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 32px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-action-item:hover {
  background: #ecf5ff;
  transform: translateY(-2px);
}

.quick-action-icon {
  color: #409eff;
}

.quick-action-name {
  font-size: 14px;
  color: #606266;
}
</style>
