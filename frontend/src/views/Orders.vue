<template>
  <div class="orders-container">
    <div class="header">
      <div class="back-btn" @click="$router.back()">
        <span>←</span>
      </div>
      <h1 class="title">我的订单</h1>
      <div class="placeholder"></div>
    </div>

    <div v-if="!userStore.isLoggedIn" class="login-tip">
      <div class="tip-icon">🔑</div>
      <p>请登录后查看订单</p>
      <button class="btn btn-primary" @click="goLogin">立即登录</button>
    </div>

    <div v-else-if="loading" class="loading">
      <span class="loading-icon">⏳</span>
      <span>加载中...</span>
    </div>

    <div v-else-if="orders.length === 0" class="empty-orders">
      <span class="empty-icon">📋</span>
      <p>暂无订单</p>
      <button class="btn btn-primary" @click="goHome">去点餐</button>
    </div>

    <div v-else class="orders-list">
      <div 
        v-for="order in orders" 
        :key="order.id" 
        class="order-card"
        @click="goOrderDetail(order.id)"
      >
        <div class="order-header">
          <span class="order-status" :class="getOrderStatusClass(order)">
            {{ getOrderStatusText(order) }}
          </span>
          <span class="order-time">{{ formatTime(order.created_at) }}</span>
        </div>
        
        <div class="order-items">
          <div 
            v-for="item in order.items.slice(0, 2)" 
            :key="item.product_id" 
            class="order-item"
          >
            <span class="item-name">{{ item.name }}</span>
            <span class="item-quantity">x{{ item.quantity }}</span>
          </div>
          <span v-if="order.items.length > 2" class="more-items">
            还有{{ order.items.length - 2 }}件商品
          </span>
        </div>

        <div class="order-footer">
          <span class="order-total">
            共{{ getTotalQuantity(order.items) }}件商品 实付 <span class="total-price">¥{{ (order.total_price + order.delivery_fee).toFixed(2) }}</span>
          </span>
          <button 
            v-if="order.pay_status === 'unpaid'" 
            class="btn btn-primary pay-btn"
            @click.stop="payOrder(order.id)"
          >
            去支付
          </button>
          <span v-else class="order-action">查看详情</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { orderAPI } from '@/api'

const router = useRouter()
const userStore = useUserStore()

const orders = ref([])
const loading = ref(true)

onMounted(() => {
  if (userStore.isLoggedIn) {
    loadOrders()
  }
})

async function loadOrders() {
  loading.value = true
  try {
    const result = await orderAPI.getOrders()
    if (result.success) {
      orders.value = result.data
    }
  } catch (err) {
    console.error('加载订单失败:', err)
  }
  loading.value = false
}

function getOrderStatusClass(order) {
  if (order.pay_status === 'paid') {
    return 'success'
  }
  return 'pending'
}

function getOrderStatusText(order) {
  if (order.pay_status === 'paid') {
    if (order.status === 'pending') {
      return '待确认'
    }
    return '已支付'
  }
  return '待支付'
}

function getTotalQuantity(items) {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

function formatTime(time) {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function goLogin() {
  router.push('/login')
}

function goHome() {
  router.push('/home')
}

function goOrderDetail(orderId) {
  router.push(`/order-detail/${orderId}`)
}

async function payOrder(orderId) {
  try {
    const result = await orderAPI.payOrder(orderId, 'alipay')
    if (result.success) {
      loadOrders()
    }
  } catch (err) {
    console.error('支付失败:', err)
    alert(err.message || '支付失败')
  }
}
</script>

<style scoped>
.orders-container {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #fff;
}

.back-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #333;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.placeholder {
  width: 44px;
}

.login-tip, .loading, .empty-orders {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.tip-icon, .loading-icon, .empty-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.login-tip p, .loading span:last-child, .empty-orders p {
  font-size: 16px;
  color: #666;
  margin: 0 0 20px 0;
}

.orders-list {
  padding: 16px;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.order-status {
  font-size: 14px;
  font-weight: 500;
}

.order-status.success {
  color: #52c41a;
}

.order-status.pending {
  color: #faad14;
}

.order-time {
  font-size: 12px;
  color: #999;
}

.order-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid #f5f5f5;
  border-bottom: 1px solid #f5f5f5;
  margin-bottom: 12px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #f9f9f9;
  border-radius: 4px;
}

.item-name {
  font-size: 12px;
  color: #333;
}

.item-quantity {
  font-size: 12px;
  color: #999;
}

.more-items {
  font-size: 12px;
  color: #999;
  padding: 4px 8px;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.order-total {
  font-size: 14px;
  color: #666;
}

.total-price {
  font-size: 16px;
  font-weight: bold;
  color: #ff6b35;
}

.pay-btn {
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 14px;
}

.order-action {
  font-size: 14px;
  color: #ff6b35;
}
</style>