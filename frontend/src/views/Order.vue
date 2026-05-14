<template>
  <div class="order-container">
    <div class="header">
      <div class="back-btn" @click="$router.back()">
        <span>←</span>
      </div>
      <h1 class="title">确认订单</h1>
      <div class="placeholder"></div>
    </div>

    <div class="address-section">
      <div class="address-card" @click="goAddress">
        <div class="address-icon">📍</div>
        <div class="address-info">
          <div class="address-header">
            <span class="address-name">{{ selectedAddress.name }}</span>
            <span class="address-phone">{{ selectedAddress.phone }}</span>
          </div>
          <p class="address-detail">
            {{ selectedAddress.province }} {{ selectedAddress.city }} {{ selectedAddress.district }} {{ selectedAddress.detail }}
          </p>
        </div>
        <span class="address-arrow">→</span>
      </div>
    </div>

    <div class="merchant-section">
      <div class="merchant-info">
        <img :src="merchantInfo.logo" alt="logo" class="merchant-logo" />
        <div class="merchant-detail">
          <h4 class="merchant-name">{{ merchantInfo.name }}</h4>
          <span class="merchant-delivery">{{ merchantInfo.delivery_time }}分钟送达</span>
        </div>
      </div>
    </div>

    <div class="order-items">
      <div 
        v-for="item in cartItems" 
        :key="item.id" 
        class="order-item"
      >
        <img :src="item.image" alt="product" class="order-item-image" />
        <div class="order-item-info">
          <h4 class="order-item-name">{{ item.name }}</h4>
          <p class="order-item-desc">{{ item.description }}</p>
          <div class="order-item-footer">
            <span class="order-item-price">¥{{ item.price }}</span>
            <span class="order-item-quantity">x{{ item.quantity }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="remark-section">
      <textarea 
        v-model="remark" 
        class="remark-input"
        placeholder="如需特殊要求，请备注..."
        rows="2"
      ></textarea>
    </div>

    <div class="payment-section">
      <h4 class="section-title">支付方式</h4>
      <div class="payment-options">
        <label 
          v-for="method in paymentMethods" 
          :key="method.value"
          class="payment-option"
          :class="{ selected: selectedPayment === method.value }"
        >
          <input type="radio" :value="method.value" v-model="selectedPayment" />
          <span class="payment-icon">{{ method.icon }}</span>
          <span class="payment-name">{{ method.name }}</span>
        </label>
      </div>
    </div>

    <div class="order-summary">
      <div class="summary-row">
        <span class="summary-label">商品小计</span>
        <span class="summary-value">¥{{ cartTotalPrice.toFixed(2) }}</span>
      </div>
      <div class="summary-row">
        <span class="summary-label">配送费</span>
        <span class="summary-value">¥{{ deliveryFee.toFixed(2) }}</span>
      </div>
      <div class="summary-row total">
        <span class="summary-label">实付金额</span>
        <span class="summary-value">¥{{ totalPrice.toFixed(2) }}</span>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="order-total">
        <span class="total-label">实付:</span>
        <span class="total-price">¥{{ totalPrice.toFixed(2) }}</span>
      </div>
      <button class="btn btn-primary submit-btn" @click="submitOrder">
        提交订单
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { addressAPI, orderAPI } from '@/api'

const router = useRouter()
const cartStore = useCartStore()

const cartItems = computed(() => cartStore.items)
const cartTotalPrice = computed(() => cartStore.totalPrice)
const deliveryFee = computed(() => 5)
const totalPrice = computed(() => cartTotalPrice.value + deliveryFee.value)

const selectedAddress = ref({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: ''
})

const remark = ref('')
const selectedPayment = ref('alipay')

const paymentMethods = [
  { value: 'alipay', name: '支付宝', icon: '🔷' },
  { value: 'wechat', name: '微信支付', icon: '💬' },
  { value: 'bank', name: '银行卡', icon: '💳' }
]

const merchantInfo = computed(() => {
  if (cartItems.value.length > 0) {
    return {
      name: '麦当劳',
      logo: cartItems.value[0].logo || '',
      delivery_time: 25
    }
  }
  return { name: '', logo: '', delivery_time: 30 }
})

onMounted(() => {
  loadAddresses()
})

async function loadAddresses() {
  try {
    const result = await addressAPI.getAddresses()
    if (result.success && result.data.length > 0) {
      const defaultAddress = result.data.find(a => a.is_default === 1) || result.data[0]
      selectedAddress.value = defaultAddress
    }
  } catch (err) {
    console.error('加载地址失败:', err)
  }
}

function goAddress() {
  router.push('/address')
}

async function submitOrder() {
  if (!selectedAddress.value.name || !selectedAddress.value.phone || !selectedAddress.value.detail) {
    alert('请先添加收货地址')
    return
  }

  if (cartItems.value.length === 0) {
    alert('购物车是空的')
    return
  }

  try {
    const items = cartItems.value.map(item => ({
      product_id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }))

    const result = await orderAPI.createOrder({
      merchant_id: cartItems.value[0].merchant_id,
      address_id: selectedAddress.value.id,
      items,
      total_price: cartTotalPrice.value,
      delivery_fee: deliveryFee.value,
      remark: remark.value
    })

    if (result.success) {
      const orderId = result.data.id
      cartStore.clearCart()
      await orderAPI.payOrder(orderId, selectedPayment.value)
      router.push(`/order-detail/${orderId}`)
    }
  } catch (err) {
    console.error('提交订单失败:', err)
    alert(err.message || '提交订单失败')
  }
}
</script>

<style scoped>
.order-container {
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

.address-section {
  padding: 16px;
}

.address-card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  padding: 16px;
  border-radius: 12px;
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

.address-arrow {
  font-size: 18px;
  color: #999;
}

.merchant-section {
  padding: 0 16px;
  margin-bottom: 12px;
}

.merchant-info {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #fff;
  padding: 12px;
  border-radius: 12px;
}

.merchant-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.merchant-detail {
  flex: 1;
}

.merchant-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
}

.merchant-delivery {
  font-size: 12px;
  color: #999;
}

.order-items {
  background: #fff;
  margin: 0 16px 12px;
  padding: 12px;
  border-radius: 12px;
}

.order-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.order-item:last-child {
  border-bottom: none;
}

.order-item-image {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
}

.order-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.order-item-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.order-item-desc {
  font-size: 12px;
  color: #999;
  margin: 4px 0;
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

.remark-section {
  padding: 0 16px;
  margin-bottom: 12px;
}

.remark-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
}

.payment-section {
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

.payment-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.payment-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
}

.payment-option.selected {
  border-color: #ff6b35;
  background: #fff5f0;
}

.payment-icon {
  font-size: 24px;
}

.payment-name {
  flex: 1;
  font-size: 14px;
  color: #333;
}

.order-summary {
  background: #fff;
  margin: 0 16px;
  padding: 16px;
  border-radius: 12px;
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

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.order-total {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.total-label {
  font-size: 14px;
  color: #666;
}

.total-price {
  font-size: 20px;
  font-weight: bold;
  color: #ff6b35;
}

.submit-btn {
  padding: 12px 40px;
  border-radius: 24px;
  font-size: 16px;
}
</style>