<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">商家工作台</h2>
      <p class="page-subtitle">{{ merchantProfile?.company_name || '商家管理中心' }}</p>
    </div>

    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-content">
            <div class="stat-icon order-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total_orders }}</div>
              <div class="stat-label">总订单数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-content">
            <div class="stat-icon pending-icon">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pending_orders }}</div>
              <div class="stat-label">待处理</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-content">
            <div class="stat-icon revenue-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatNumber(stats.total_revenue) }}</div>
              <div class="stat-label">总收入</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card card-shadow">
          <div class="stat-content">
            <div class="stat-icon rating-icon">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.avg_rating?.toFixed(1) }}</div>
              <div class="stat-label">平均评分</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <div class="flex-between">
              <span>最近订单</span>
              <el-link type="primary" @click="$router.push('/dashboard/merchant/orders')">查看全部</el-link>
            </div>
          </template>
          <el-table :data="recentOrders" style="width: 100%;">
            <el-table-column prop="order_no" label="订单号" width="140" />
            <el-table-column prop="couple_name" label="客户" />
            <el-table-column prop="service_name" label="服务" show-overflow-tooltip />
            <el-table-column prop="total_amount" label="金额">
              <template #default="{ row }">¥{{ row.total_amount }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow">
          <template #header>
            <div class="flex-between">
              <span>最新评价</span>
              <el-link type="primary" @click="$router.push('/dashboard/merchant/reviews')">查看全部</el-link>
            </div>
          </template>
          <div class="reviews-list">
            <div class="review-item" v-for="review in recentReviews" :key="review.id">
              <div class="review-header">
                <span class="reviewer">{{ review.couple_name }}</span>
                <el-rate v-model="review.rating" disabled size="small" />
              </div>
              <div class="review-content">{{ review.content }}</div>
              <div class="review-footer">
                <span class="review-date">{{ review.created_at }}</span>
                <el-tag v-if="review.is_negative" type="danger" size="small">差评</el-tag>
              </div>
            </div>
            <el-empty v-if="recentReviews.length === 0" description="暂无评价" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="card-shadow">
          <template #header>
            <div class="flex-between">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <div class="action-item" @click="$router.push('/dashboard/merchant/cases')">
              <el-icon class="action-icon"><Picture /></el-icon>
              <span>案例管理</span>
            </div>
            <div class="action-item" @click="$router.push('/dashboard/merchant/schedule')">
              <el-icon class="action-icon"><Calendar /></el-icon>
              <span>档期管理</span>
            </div>
            <div class="action-item" @click="$router.push('/dashboard/merchant/certification')">
              <el-icon class="action-icon"><Postcard /></el-icon>
              <span>资质认证</span>
            </div>
            <div class="action-item" @click="$router.push('/dashboard/merchant/orders')">
              <el-icon class="action-icon"><Document /></el-icon>
              <span>订单管理</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api'

const merchantProfile = ref(null)
const stats = ref({
  total_orders: 0,
  pending_orders: 0,
  total_revenue: 0,
  avg_rating: 5
})
const recentOrders = ref([])
const recentReviews = ref([])

function formatNumber(num) {
  return (num || 0).toLocaleString()
}

function getStatusType(status) {
  const types = {
    pending: 'warning',
    confirmed: 'primary',
    visited: 'info',
    delivered: 'success',
    reviewed: 'success',
    cancelled: 'danger'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    pending: '待确认',
    confirmed: '已确认',
    visited: '已到店',
    delivered: '已交付',
    reviewed: '已评价',
    cancelled: '已取消'
  }
  return texts[status] || status
}

async function loadStats() {
  try {
    const res = await api.get('/merchant/stats')
    stats.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function loadProfile() {
  try {
    const res = await api.get('/merchant/profile')
    merchantProfile.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function loadOrders() {
  try {
    const res = await api.get('/orders')
    recentOrders.value = res.data.slice(0, 5)
  } catch (e) {
    console.error(e)
  }
}

async function loadReviews() {
  try {
    const res = await api.get('/merchant/reviews')
    recentReviews.value = res.data.slice(0, 3)
  } catch (e) {
    console.error(e)
  }
}

onMounted(() => {
  loadProfile()
  loadStats()
  loadOrders()
  loadReviews()
})
</script>

<style scoped lang="scss">
.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      color: #fff;
      margin-right: 16px;
      
      &.order-icon {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      &.pending-icon {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
      
      &.revenue-icon {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
      
      &.rating-icon {
        background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      }
    }
    
    .stat-info {
      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 4px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #909399;
      }
    }
  }
}

.reviews-list {
  .review-item {
    padding: 12px 0;
    border-bottom: 1px solid #ebeef5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .review-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      
      .reviewer {
        font-weight: 500;
        color: #303133;
      }
    }
    
    .review-content {
      font-size: 14px;
      color: #606266;
      margin-bottom: 8px;
    }
    
    .review-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .review-date {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  
  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 30px;
    background: #f5f7fa;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      background: #e4e7ed;
      transform: translateY(-2px);
    }
    
    .action-icon {
      font-size: 40px;
      color: #ff6b9d;
      margin-bottom: 12px;
    }
    
    span {
      font-size: 16px;
      color: #303133;
    }
  }
}
</style>
