<template>
  <div class="orders-page page-container">
    <div class="header">
      <h1>我的订单</h1>
    </div>

    <div v-if="loading" class="loading">
      <el-spinner />
    </div>

    <div v-else-if="orders.length === 0" class="empty">
      <Package class="empty-icon" />
      <p>暂无订单</p>
      <el-button type="primary" @click="goShopping">去购物</el-button>
    </div>

    <div v-else class="content">
      <div class="order-list">
        <div 
          v-for="order in orders" 
          :key="order.id" 
          class="order-card"
        >
          <div class="order-header">
            <span class="order-no">订单号：{{ order.order_no }}</span>
            <span class="order-status" :class="getStatusClass(order.status)">
              {{ getStatusText(order.status) }}
            </span>
          </div>
          
          <div class="order-items">
            <div 
              v-for="(item, index) in JSON.parse(order.items)" 
              :key="index" 
              class="order-item"
            >
              <div class="item-info">
                <span class="item-name">{{ getItemName(item.product_id) }}</span>
                <span class="item-qty">x{{ item.quantity }}</span>
              </div>
            </div>
          </div>
          
          <div class="order-footer">
            <span class="order-total">实付：<span class="total-price">¥{{ order.pay_amount }}</span></span>
            <button 
              v-if="order.status === 'pending'" 
              class="pay-btn"
              @click="handlePay(order.id)"
            >
              去支付
            </button>
            <span v-else class="status-text">{{ getStatusText(order.status) }}</span>
          </div>
        </div>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Package } from 'lucide-vue-next'
import BottomNav from '@/components/BottomNav.vue'
import { orderAPI } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(true)
const orders = ref([])

const productMap = {
  1: '现代简约布艺沙发',
  2: '北欧风格真皮沙发',
  3: '极简风格双人床',
  4: '实木衣柜',
  5: '大理石餐桌',
  6: '简约书桌',
  7: '玻璃茶几',
  8: '电视柜组合'
}

onMounted(() => {
  loadOrders()
})

async function loadOrders() {
  loading.value = true
  try {
    const data = await orderAPI.list()
    orders.value = data.orders || []
  } catch {
    orders.value = []
  } finally {
    loading.value = false
  }
}

function getItemName(productId) {
  return productMap[productId] || `商品${productId}`
}

function getStatusText(status) {
  const statusMap = {
    pending: '待支付',
    paid: '已支付',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

function getStatusClass(status) {
  const classMap = {
    pending: 'status-pending',
    paid: 'status-paid',
    shipped: 'status-shipped',
    completed: 'status-completed',
    cancelled: 'status-cancelled'
  }
  return classMap[status] || ''
}

async function handlePay(orderId) {
  try {
    await orderAPI.pay(orderId)
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = 'paid'
    }
    ElMessage.success('支付成功')
  } catch {
    ElMessage.error('支付失败')
  }
}

function goShopping() {
  router.push('/products')
}
</script>

<style scoped>
.header {
  background: white;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.content {
  padding: 12px;
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-no {
  font-size: 13px;
  color: #666;
}

.order-status {
  font-size: 13px;
  font-weight: 500;
}

.status-pending { color: #f59e0b; }
.status-paid { color: #22c55e; }
.status-shipped { color: #3b82f6; }
.status-completed { color: #6b7280; }
.status-cancelled { color: #ef4444; }

.order-items {
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 0;
}

.order-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.order-item:last-child {
  margin-bottom: 0;
}

.item-name {
  font-size: 14px;
  color: #333;
}

.item-qty {
  font-size: 14px;
  color: #999;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.order-total {
  font-size: 14px;
}

.total-price {
  font-size: 18px;
  font-weight: 700;
  color: #ef4444;
}

.pay-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 20px;
  font-size: 14px;
}

.status-text {
  font-size: 14px;
  color: #999;
}

.loading, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  color: #ddd;
  margin-bottom: 16px;
}

.empty p {
  color: #999;
  margin-bottom: 16px;
}
</style>