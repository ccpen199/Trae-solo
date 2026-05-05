<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="card-row">
      <el-col :xs="12" :sm="12" :lg="6">
        <el-card class="box-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <el-icon><User /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-value">{{ stats.customers }}</div>
            <div class="card-label">客户总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6">
        <el-card class="box-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <el-icon><Document /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-value">{{ stats.orders }}</div>
            <div class="card-label">订单总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6">
        <el-card class="box-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <el-icon><Box /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-value">{{ stats.products }}</div>
            <div class="card-label">产品总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6">
        <el-card class="box-card">
          <div class="card-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <el-icon><Money /></el-icon>
          </div>
          <div class="card-content">
            <div class="card-value">{{ stats.totalAmount }}</div>
            <div class="card-label">总金额</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24" :lg="12">
        <el-card class="action-card">
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="action-grid">
            <router-link to="/orders-create" class="action-item" v-if="userStore.isSales || userStore.isAdmin">
              <el-icon class="action-icon" style="color: #409EFF;"><Plus /></el-icon>
              <span>创建订单</span>
            </router-link>
            <router-link to="/customers" class="action-item" v-if="userStore.isSales || userStore.isAdmin">
              <el-icon class="action-icon" style="color: #67c23a;"><UserPlus /></el-icon>
              <span>客户管理</span>
            </router-link>
            <router-link to="/pending-shipment" class="action-item" v-if="userStore.isWarehouse || userStore.isAdmin">
              <el-icon class="action-icon" style="color: #e6a23c;"><Truck /></el-icon>
              <span>待发货</span>
            </router-link>
            <router-link to="/deposit-orders" class="action-item" v-if="userStore.isFinance || userStore.isAdmin">
              <el-icon class="action-icon" style="color: #f56c6c;"><EditPen /></el-icon>
              <span>审核定金单</span>
            </router-link>
            <router-link to="/order-follow" class="action-item" v-if="userStore.isCustomerService || userStore.isAdmin">
              <el-icon class="action-icon" style="color: #909399;"><ChatDotRound /></el-icon>
              <span>订单跟进</span>
            </router-link>
            <router-link to="/inventory" class="action-item" v-if="userStore.isWarehouse || userStore.isAdmin">
              <el-icon class="action-icon" style="color: #409EFF;"><Grid /></el-icon>
              <span>库存管理</span>
            </router-link>
          </div>
        </el-card>
      </el-col>

      <el-col :span="24" :lg="12">
        <el-card class="action-card">
          <template #header>
            <span>订单状态统计</span>
          </template>
          <div class="status-list">
            <div class="status-item">
              <el-tag type="info">待审核</el-tag>
              <span class="status-count">{{ statusCounts.pending_review || 0 }}</span>
            </div>
            <div class="status-item">
              <el-tag type="primary">待发货</el-tag>
              <span class="status-count">{{ statusCounts.pending_shipment || 0 }}</span>
            </div>
            <div class="status-item">
              <el-tag type="warning">已发货</el-tag>
              <span class="status-count">{{ statusCounts.shipped || 0 }}</span>
            </div>
            <div class="status-item">
              <el-tag type="success">已签收</el-tag>
              <span class="status-count">{{ statusCounts.delivered || 0 }}</span>
            </div>
            <div class="status-item">
              <el-tag type="danger">已退货</el-tag>
              <span class="status-count">{{ statusCounts.returned || 0 }}</span>
            </div>
            <div class="status-item">
              <el-tag type="info" effect="plain">已取消</el-tag>
              <span class="status-count">{{ statusCounts.cancelled || 0 }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { getCustomerList } from '@/api/customers'
import { getOrderList } from '@/api/orders'
import { getProductList } from '@/api/products'

const userStore = useUserStore()

const stats = ref({
  customers: 0,
  orders: 0,
  products: 0,
  totalAmount: '0.00'
})

const statusCounts = ref({})

const fetchStats = async () => {
  try {
    const [customersRes, ordersRes, productsRes] = await Promise.all([
      getCustomerList({ page: 1, pageSize: 1 }),
      getOrderList({ page: 1, pageSize: 1000 }),
      getProductList({ page: 1, pageSize: 1 })
    ])

    stats.value.customers = customersRes.data?.total || 0
    stats.value.products = productsRes.data?.total || 0

    const orders = ordersRes.data?.list || []
    stats.value.orders = ordersRes.data?.total || 0
    
    const totalAmount = orders.reduce((sum, order) => sum + (order.final_amount || 0), 0)
    stats.value.totalAmount = totalAmount.toFixed(2)

    const counts = {}
    orders.forEach(order => {
      const status = order.status || 'unknown'
      counts[status] = (counts[status] || 0) + 1
    })
    statusCounts.value = counts

  } catch (error) {
    console.error('Fetch stats error:', error)
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.dashboard-container {
  padding: 0;
}

.card-row {
  margin-bottom: 20px;
}

.box-card {
  border-radius: 8px;
  overflow: hidden;
}

.box-card :deep(.el-card__body) {
  display: flex;
  padding: 20px;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
  flex-shrink: 0;
}

.card-content {
  margin-left: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
}

.card-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.action-card {
  border-radius: 8px;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 10px;
  background: #f5f7fa;
  border-radius: 8px;
  text-decoration: none;
  color: #303133;
  transition: all 0.3s;
  cursor: pointer;
}

.action-item:hover {
  background: #ecf5ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.status-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.status-count {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
}
</style>
