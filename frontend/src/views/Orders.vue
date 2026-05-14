<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left" @click="goBack">‹</div>
      <div class="header-title">我的订单</div>
      <div class="header-right"></div>
    </div>

    <div class="content">
      <div class="tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </div>
      </div>

      <div v-if="loading" class="loading"></div>
      <div v-else-if="error" class="error-state">
        <div class="icon">❌</div>
        <p>{{ error }}</p>
        <button @click="loadOrders">重试</button>
      </div>
      <div v-else-if="orders.length === 0" class="empty-state">
        <div class="icon">📦</div>
        <p>暂无订单</p>
        <button class="btn btn-primary" @click="goShopping">去购物</button>
      </div>
      <div v-else class="order-list">
        <div 
          v-for="order in orders" 
          :key="order.id"
          class="order-card"
          @click="goToOrder(order.id)"
        >
          <div class="order-header">
            <span class="order-no">订单号：{{ order.order_no }}</span>
            <span class="order-status" :class="getStatusClass(order.status)">
              {{ getStatusText(order.status) }}
            </span>
          </div>
          <div class="order-items">
            <div 
              v-for="item in order.items" 
              :key="item.id"
              class="order-item"
            >
              <img :src="item.product?.images?.[0]" alt="Product" class="order-image" />
              <div class="order-info">
                <h4 class="order-name">{{ item.product?.name }}</h4>
                <span class="order-spec">{{ item.spec }}</span>
                <div class="order-bottom">
                  <span class="order-price">¥{{ item.price }}</span>
                  <span class="order-quantity">x{{ item.quantity }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="order-footer">
            <span class="order-total">共{{ getOrderItemCount(order) }}件商品 实付：</span>
            <span class="order-amount">¥{{ order.total_amount }}</span>
          </div>
          <div class="order-actions">
            <button v-if="order.status === 'pending'" class="action-btn" @click.stop="handlePay(order.id)">
              去支付
            </button>
            <button v-if="order.status === 'paid'" class="action-btn" @click.stop="handleConfirm(order.id)">
              确认收货
            </button>
            <button class="action-btn" @click.stop="handleView(order.id)">
              查看详情
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { orderAPI } from '../api'

const router = useRouter()

const activeTab = ref('all')
const orders = ref([])
const loading = ref(true)
const error = ref('')

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待付款' },
  { key: 'paid', label: '待收货' },
  { key: 'shipped', label: '待评价' },
  { key: 'completed', label: '已完成' }
]

function getStatusText(status) {
  const map = {
    pending: '待付款',
    paid: '待收货',
    shipped: '待评价',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

function getStatusClass(status) {
  if (status === 'pending') return 'pending'
  if (status === 'paid') return 'paid'
  if (status === 'completed') return 'completed'
  return ''
}

function getOrderItemCount(order) {
  return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
}

async function loadOrders() {
  loading.value = true
  error.value = ''
  
  try {
    const params = activeTab.value !== 'all' ? { status: activeTab.value } : {}
    const res = await orderAPI.getOrders(params)
    if (res.success) {
      orders.value = res.data
    }
  } catch (err) {
    error.value = err.message || '加载订单失败'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

function goShopping() {
  router.push('/')
}

function goToOrder(id) {
  router.push(`/order/${id}`)
}

async function handlePay(orderId) {
  try {
    const res = await orderAPI.payOrder(orderId)
    if (res.success) {
      const event = new CustomEvent('showToast', { detail: '支付成功' })
      window.dispatchEvent(event)
      await loadOrders()
    } else {
      const event = new CustomEvent('showToast', { detail: res.message || '支付失败' })
      window.dispatchEvent(event)
    }
  } catch (err) {
    const event = new CustomEvent('showToast', { detail: err.message || '支付失败' })
    window.dispatchEvent(event)
  }
}

async function handleConfirm(orderId) {
  try {
    const res = await orderAPI.updateStatus(orderId, 'completed')
    if (res.success) {
      const event = new CustomEvent('showToast', { detail: '确认收货成功' })
      window.dispatchEvent(event)
      await loadOrders()
    } else {
      const event = new CustomEvent('showToast', { detail: res.message || '操作失败' })
      window.dispatchEvent(event)
    }
  } catch (err) {
    const event = new CustomEvent('showToast', { detail: err.message || '操作失败' })
    window.dispatchEvent(event)
  }
}

function handleView(orderId) {
  router.push(`/order/${orderId}`)
}

watch(activeTab, () => {
  loadOrders()
})

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.content {
  padding-top: 54px;
}

.tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid var(--border-color);
}

.tab {
  flex: 1;
  padding: 15px;
  text-align: center;
  font-size: 14px;
  color: var(--gray-color);
  border-bottom: 2px solid transparent;
}

.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.order-list {
  padding: 10px;
}

.order-card {
  background: #fff;
  margin-bottom: 10px;
  border-radius: 8px;
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
}

.order-no {
  font-size: 12px;
  color: var(--gray-color);
}

.order-status {
  font-size: 14px;
  font-weight: bold;
}

.order-status.pending {
  color: var(--primary-color);
}

.order-status.paid {
  color: var(--secondary-color);
}

.order-status.completed {
  color: var(--gray-color);
}

.order-items {
  padding: 15px;
}

.order-item {
  display: flex;
  margin-bottom: 10px;
}

.order-item:last-child {
  margin-bottom: 0;
}

.order-image {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 10px;
}

.order-info {
  flex: 1;
  min-width: 0;
}

.order-name {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 5px;
}

.order-spec {
  font-size: 12px;
  color: var(--gray-color);
  margin-bottom: 5px;
}

.order-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-price {
  font-size: 14px;
  font-weight: bold;
  color: var(--primary-color);
}

.order-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 10px 15px;
  border-top: 1px solid var(--border-color);
}

.order-total {
  font-size: 14px;
  color: #333;
}

.order-amount {
  font-size: 16px;
  font-weight: bold;
  color: var(--primary-color);
}

.order-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px;
  border-top: 1px solid var(--border-color);
}

.action-btn {
  padding: 8px 20px;
  border: 1px solid var(--primary-color);
  color: var(--primary-color);
  background: #fff;
  border-radius: 4px;
  font-size: 14px;
}
</style>