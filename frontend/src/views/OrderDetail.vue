<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left" @click="goBack">‹</div>
      <div class="header-title">订单详情</div>
      <div class="header-right"></div>
    </div>

    <div v-if="loading" class="loading"></div>
    <div v-else-if="error" class="error-state">
      <div class="icon">❌</div>
      <p>{{ error }}</p>
      <button @click="loadOrder">重试</button>
    </div>
    <div v-else class="content">
      <div class="status-bar" :class="getStatusClass(order.status)">
        <span class="status-text">{{ getStatusText(order.status) }}</span>
      </div>

      <div class="order-info">
        <div class="info-row">
          <span>订单号</span>
          <span>{{ order.order_no }}</span>
        </div>
        <div class="info-row">
          <span>下单时间</span>
          <span>{{ order.created_at }}</span>
        </div>
        <div class="info-row">
          <span>收货地址</span>
          <span>{{ order.shipping_address }}</span>
        </div>
      </div>

      <div class="product-section">
        <div class="section-header">商品清单</div>
        <div 
          v-for="item in order.items" 
          :key="item.id"
          class="product-item"
        >
          <img :src="item.product?.images?.[0]" alt="Product" class="product-image" />
          <div class="product-info">
            <h3 class="product-name">{{ item.product?.name }}</h3>
            <span class="product-spec">{{ item.spec }}</span>
            <div class="product-bottom">
              <span class="product-price">¥{{ item.price }}</span>
              <span class="product-quantity">x{{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="summary-section">
        <div class="summary-row">
          <span>商品金额</span>
          <span>¥{{ order.total_amount }}</span>
        </div>
        <div class="summary-row">
          <span>运费</span>
          <span>¥0</span>
        </div>
        <div class="summary-row total">
          <span>实付款</span>
          <span class="total-price">¥{{ order.total_amount }}</span>
        </div>
      </div>
    </div>

    <div class="bottom-bar safe-area-bottom">
      <button class="btn-back" @click="goBack">返回订单列表</button>
      <button 
        v-if="order.status === 'pending'" 
        class="btn-pay"
        @click="handlePay"
      >
        立即支付
      </button>
      <button 
        v-if="order.status === 'paid'" 
        class="btn-confirm"
        @click="handleConfirm"
      >
        确认收货
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { orderAPI } from '../api'

const route = useRoute()
const router = useRouter()

const order = ref({})
const loading = ref(true)
const error = ref('')

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

async function loadOrder() {
  loading.value = true
  error.value = ''
  
  try {
    const res = await orderAPI.getOrder(route.params.id)
    if (res.success) {
      order.value = res.data
    }
  } catch (err) {
    error.value = err.message || '加载订单失败'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/orders')
}

async function handlePay() {
  try {
    const res = await orderAPI.payOrder(order.value.id)
    if (res.success) {
      const event = new CustomEvent('showToast', { detail: '支付成功' })
      window.dispatchEvent(event)
      await loadOrder()
    } else {
      const event = new CustomEvent('showToast', { detail: res.message || '支付失败' })
      window.dispatchEvent(event)
    }
  } catch (err) {
    const event = new CustomEvent('showToast', { detail: err.message || '支付失败' })
    window.dispatchEvent(event)
  }
}

async function handleConfirm() {
  try {
    const res = await orderAPI.updateStatus(order.value.id, 'completed')
    if (res.success) {
      const event = new CustomEvent('showToast', { detail: '确认收货成功' })
      window.dispatchEvent(event)
      await loadOrder()
    } else {
      const event = new CustomEvent('showToast', { detail: res.message || '操作失败' })
      window.dispatchEvent(event)
    }
  } catch (err) {
    const event = new CustomEvent('showToast', { detail: err.message || '操作失败' })
    window.dispatchEvent(event)
  }
}

onMounted(() => {
  loadOrder()
})
</script>

<style scoped>
.content {
  padding-top: 54px;
  padding-bottom: 80px;
}

.status-bar {
  padding: 20px;
  text-align: center;
  margin-bottom: 10px;
}

.status-bar.pending {
  background: #fff3f3;
}

.status-bar.paid {
  background: #fff8f0;
}

.status-bar.completed {
  background: #f0f9ff;
}

.status-text {
  font-size: 16px;
  font-weight: bold;
  color: var(--primary-color);
}

.order-info {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  padding: 15px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 14px;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row span:first-child {
  color: var(--gray-color);
}

.product-section {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;
}

.section-header {
  padding: 15px;
  font-size: 14px;
  font-weight: bold;
  border-bottom: 1px solid var(--border-color);
}

.product-item {
  display: flex;
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
}

.product-item:last-child {
  border-bottom: none;
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 10px;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 5px;
}

.product-spec {
  font-size: 12px;
  color: var(--gray-color);
  margin-bottom: 10px;
}

.product-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 14px;
  font-weight: bold;
  color: var(--primary-color);
}

.summary-section {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  padding: 15px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}

.summary-row.total {
  padding-top: 15px;
  margin-top: 8px;
  border-top: 1px solid var(--border-color);
}

.total-price {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 10px;
  padding: 10px;
  background: #fff;
  border-top: 1px solid var(--border-color);
}

.btn-back {
  flex: 1;
  padding: 12px;
  background: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 4px;
  font-size: 14px;
}

.btn-pay {
  flex: 1;
  padding: 12px;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
}

.btn-confirm {
  flex: 1;
  padding: 12px;
  background: var(--secondary-color);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
}
</style>