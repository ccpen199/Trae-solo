<template>
  <div class="orders-page">
    <div class="page-header">
      <h2>我的订单</h2>
    </div>
    
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading"><Loading /></el-icon>
      <p>加载中...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <el-icon :size="48"><Warning /></el-icon>
      <p>{{ error }}</p>
      <el-button type="primary" @click="fetchOrders">重试</el-button>
    </div>
    
    <div v-else-if="orders.length === 0" class="empty-container">
      <el-icon :size="64"><Document /></el-icon>
      <p>还没有订单</p>
      <p class="sub-text">去商城逛逛吧</p>
      <el-button type="primary" @click="$router.push('/shop')">去商城</el-button>
    </div>
    
    <div v-else class="orders-list">
      <div v-for="order in orders" :key="order.id" class="order-card">
        <div class="order-header">
          <span class="order-id">订单号: {{ order.order_no }}</span>
          <el-tag :type="getStatusType(order.status)" size="small">
            {{ getStatusText(order.status) }}
          </el-tag>
        </div>
        
        <div class="order-items">
          <div v-for="item in order.items" :key="item.id" class="order-item">
            <el-image :src="item.product_cover" fit="cover" class="item-image" />
            <div class="item-info">
              <h4 class="item-name">{{ item.product_name }}</h4>
              <p class="item-price">¥{{ item.price }} × {{ item.quantity }}</p>
            </div>
            <div class="item-total">¥{{ (item.price * item.quantity).toFixed(2) }}</div>
          </div>
        </div>
        
        <div class="order-footer">
          <div class="order-time">
            <el-icon><Clock /></el-icon>
            {{ formatTime(order.created_at) }}
          </div>
          <div class="order-total">
            共 {{ order.total_quantity }} 件商品，合计: 
            <span class="total-price">¥{{ order.total_amount }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Loading, Warning, Document, Clock } from '@element-plus/icons-vue'
import request from '@/utils/request'

const loading = ref(true)
const error = ref('')
const orders = ref([])

const fetchOrders = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await request.get('/api/orders')
    if (res.success) {
      orders.value = res.data || []
    } else {
      error.value = res.message || '加载失败'
    }
  } catch (err) {
    error.value = err.message || '网络错误'
    ElMessage.error(error.value)
  } finally {
    loading.value = false
  }
}

const getStatusType = (status) => {
  const map = {
    pending: 'warning',
    paid: 'primary',
    shipped: 'info',
    delivered: 'success',
    cancelled: 'info'
  }
  return map[status] || 'info'
}

const getStatusText = (status) => {
  const map = {
    pending: '待付款',
    paid: '已付款',
    shipped: '已发货',
    delivered: '已送达',
    cancelled: '已取消'
  }
  return map[status] || status
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped lang="scss">
.orders-page {
  padding: 20px;
  
  .page-header {
    margin-bottom: 24px;
    
    h2 {
      font-size: 24px;
      font-weight: 600;
      margin: 0;
      color: #333;
    }
  }
  
  .loading-container,
  .error-container,
  .empty-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    color: #999;
    
    .el-icon {
      margin-bottom: 16px;
      color: #c0c4cc;
    }
    
    p {
      margin: 8px 0;
      
      &.sub-text {
        font-size: 14px;
        color: #c0c4cc;
      }
    }
  }
  
  .orders-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .order-card {
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    
    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f5f5f5;
      
      .order-id {
        font-size: 14px;
        color: #666;
      }
    }
    
    .order-items {
      padding: 12px 20px;
      
      .order-item {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f5f5f5;
        
        &:last-child {
          border-bottom: none;
        }
        
        .item-image {
          width: 80px;
          height: 80px;
          border-radius: 8px;
          margin-right: 16px;
        }
        
        .item-info {
          flex: 1;
          
          .item-name {
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 500;
            color: #333;
          }
          
          .item-price {
            margin: 0;
            font-size: 14px;
            color: #999;
          }
        }
        
        .item-total {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
      }
    }
    
    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #fafafa;
      font-size: 14px;
      
      .order-time {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #999;
      }
      
      .order-total {
        color: #666;
        
        .total-price {
          font-size: 18px;
          font-weight: 600;
          color: #ff2442;
          margin-left: 8px;
        }
      }
    }
  }
}
</style>
