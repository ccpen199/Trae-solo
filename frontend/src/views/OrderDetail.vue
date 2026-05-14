<template>
  <div class="order-detail-container">
    <div class="header">
      <div class="back-btn" @click="$router.back()">
        <span>←</span>
      </div>
      <h1 class="title">订单详情</h1>
      <div class="placeholder"></div>
    </div>

    <div class="order-status" :class="orderStatusClass">
      <span class="status-icon">{{ statusIcon }}</span>
      <div class="status-info">
        <h3 class="status-text">{{ statusText }}</h3>
        <p class="status-desc">{{ statusDesc }}</p>
      </div>
    </div>

    <div class="order-info">
      <div class="info-row">
        <span class="info-label">订单编号</span>
        <span class="info-value">{{ order.id }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">下单时间</span>
        <span class="info-value">{{ formatTime(order.created_at) }}</span>
      </div>
      <div class="info-row">
        <span class="info-label">支付方式</span>
        <span class="info-value">{{ paymentMethodText }}</span>
      </div>
    </div>

    <div class="address-section">
      <h4 class="section-title">收货地址</h4>
      <div class="address-card">
        <div class="address-icon">📍</div>
        <div class="address-info">
          <div class="address-header">
            <span class="address-name">{{ order.address?.name }}</span>
            <span class="address-phone">{{ order.address?.phone }}</span>
          </div>
          <p class="address-detail">
            {{ order.address?.province }} {{ order.address?.city }} {{ order.address?.district }} {{ order.address?.detail }}
          </p>
        </div>
      </div>
    </div>

    <div class="items-section">
      <h4 class="section-title">商品清单</h4>
      <div class="items-list">
        <div 
          v-for="item in order.items" 
          :key="item.product_id" 
          class="order-item"
        >
          <div class="order-item-info">
            <h4 class="order-item-name">{{ item.name }}</h4>
            <div class="order-item-footer">
              <span class="order-item-price">¥{{ item.price }}</span>
              <span class="order-item-quantity">x{{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="summary-section">
      <div class="summary-row">
        <span class="summary-label">商品小计</span>
        <span class="summary-value">¥{{ order.total_price }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">配送费</span>
        <span class="summary-value">¥{{ order.delivery_fee }}</span>
      </div>
      <div class="summary-row total">
        <span class="summary-label">实付金额</span>
        <span class="summary-value">¥{{ (order.total_price + order.delivery_fee).toFixed(2) }}</span>
      </div>
    </div>

    <div v-if="order.remark" class="remark-section">
      <h4 class="section-title">订单备注</h4>
      <p class="remark-text">{{ order.remark }}</p>
    </div>

    <div class="bottom-bar">
      <button class="btn btn-secondary" @click="goHome">继续点餐</button>
      <button class="btn btn-primary" @click="goOrders">查看全部订单</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { orderAPI } from '@/api'

const router = useRouter()
const route = useRoute()

const order = ref({
  id: '',
  status: 'pending',
  pay_status: 'unpaid',
  pay_method: '',
  total_price: 0,
  delivery_fee: 0,
  remark: '',
  created_at: '',
  items: [],
  address: {}
})

onMounted(() => {
  loadOrder()
})

async function loadOrder() {
  const id = route.params.id
  try {
    const result = await orderAPI.getOrder(id)
    if (result.success) {
      order.value = result.data
    }
  } catch (err) {
    console.error('加载订单失败:', err)
  }
}

const orderStatusClass = computed(() => {
  if (order.value.pay_status === 'paid') {
    return 'success'
  }
  return 'pending'
})

const statusIcon = computed(() => {
  if (order.value.pay_status === 'paid') {
    return '✅'
  }
  return '⏳'
})

const statusText = computed(() => {
  if (order.value.pay_status === 'paid') {
    return '支付成功'
  }
  return '待支付'
})

const statusDesc = computed(() => {
  if (order.value.pay_status === 'paid') {
    return '订单已提交，商家正在准备中'
  }
  return '请尽快完成支付'
})

const paymentMethodText = computed(() => {
  const methods = {
    alipay: '支付宝',
    wechat: '微信支付',
    bank: '银行卡'
  }
  return methods[order.value.pay_method] || '未知'
})

function formatTime(time) {
  if (!time) return ''
  const date = new Date(time)
  return date.toLocaleString('zh-CN')
}

function goHome() {
  router.push('/home')
}

function goOrders() {
  router.push('/orders')
}
</script>

<style scoped>
.order-detail-container {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
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

.order-status {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  margin: 12px;
  border-radius: 12px;
}

.order-status.success {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
}

.order-status.pending {
  background: linear-gradient(135deg, #faad14 0%, #ffc53d 100%);
}

.status-icon {
  font-size: 36px;
}

.status-info {
  color: #fff;
}

.status-text {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 4px 0;
}

.status-desc {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

.order-info {
  background: #fff;
  margin: 0 16px 12px;
  padding: 16px;
  border-radius: 12px;
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 14px;
  color: #333;
}

.address-section, .items-section, .summary-section, .remark-section {
  background: #fff;
  margin: 0 16px 12px;
  padding: 16px;
  border-radius: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin: 0 0 12px 0;
}

.address-card {
  display: flex;
  gap: 12px;
}

.address-icon {
  font-size: 24px;
}

.address-info {
  flex: 1;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.address-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.address-phone {
  font-size: 14px;
  color: #666;
}

.address-detail {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.order-item {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.order-item-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.order-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.order-item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.order-item-price {
  font-size: 14px;
  font-weight: bold;
  color: #ff6b35;
}

.order-item-quantity {
  font-size: 12px;
  color: #999;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.summary-row.total {
  padding-top: 12px;
  border-top: 1px dashed #e0e0e0;
}

.summary-label {
  font-size: 14px;
  color: #666;
}

.summary-value {
  font-size: 14px;
  color: #333;
}

.summary-row.total .summary-value {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b35;
}

.remark-text {
  font-size: 14px;
  color: #666;
  margin: 0;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.bottom-bar .btn {
  flex: 1;
  height: 48px;
  border-radius: 24px;
}
</style>