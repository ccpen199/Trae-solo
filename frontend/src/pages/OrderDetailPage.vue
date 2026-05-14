<template>
  <div class="order-detail-container">
    <van-nav-bar title="订单详情" left-text="返回" @click-left="goBack" />
    
    <div class="order-content" v-if="order">
      <div class="order-info">
        <div class="order-header">
          <span class="order-no">订单号: {{ order.order_no }}</span>
          <span class="order-status">{{ getStatusText(order.status) }}</span>
        </div>
        <div class="order-time">下单时间: {{ order.created_at }}</div>
      </div>
      
      <div class="address-section">
        <h3 class="section-title">收货信息</h3>
        <div class="address-info">
          <span class="address-name">{{ address?.name }} {{ address?.phone }}</span>
          <p class="address-detail">{{ address?.province }}{{ address?.city }}{{ address?.district }}{{ address?.detail }}</p>
        </div>
      </div>
      
      <div class="products-section">
        <h3 class="section-title">商品清单</h3>
        <div class="product-list">
          <div 
            v-for="item in order.items" 
            :key="item.product_id" 
            class="product-item"
          >
            <img :src="item.image" :alt="item.name" class="product-img" />
            <div class="product-info">
              <span class="product-name">{{ item.name }}</span>
              <span class="product-price">¥{{ item.price }}</span>
            </div>
            <span class="product-quantity">x{{ item.quantity }}</span>
          </div>
        </div>
      </div>
      
      <div class="summary-section">
        <div class="summary-row">
          <span class="summary-label">商品金额</span>
          <span class="summary-value">¥{{ order.total_amount.toFixed(2) }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">运费</span>
          <span class="summary-value">¥0.00</span>
        </div>
        <div class="summary-row total">
          <span class="summary-label">实付金额</span>
          <span class="summary-value">¥{{ order.total_amount.toFixed(2) }}</span>
        </div>
      </div>
    </div>
    
    <div class="bottom-bar" v-if="order">
      <van-button type="default" @click="goHome">继续购物</van-button>
      <van-button type="primary" @click="handleAction">{{ getButtonText(order.status) }}</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NavBar, Button, showToast } from 'vant'
import { orderApi, addressApi } from '../services/api'

const router = useRouter()
const route = useRoute()
const order = ref(null)
const address = ref(null)

const getStatusText = (status) => {
  const map = {
    pending: '待付款',
    paid: '待配送',
    shipping: '配送中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getButtonText = (status) => {
  const map = {
    pending: '立即支付',
    paid: '催单',
    shipping: '确认收货',
    completed: '再来一单',
    cancelled: '重新购买'
  }
  return map[status] || '操作'
}

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/home')
}

const handleAction = () => {
  if (order.value.status === 'pending') {
    showToast('支付功能开发中')
  } else if (order.value.status === 'completed') {
    showToast('再来一单功能开发中')
  }
}

onMounted(() => {
  const id = route.params.id
  orderApi.getOrder(id).then(res => {
    if (res.code === 200) {
      order.value = res.data
      
      if (order.value.address_id) {
        addressApi.getAddresses().then(res => {
          if (res.code === 200) {
            address.value = res.data.find(a => a.id === order.value.address_id)
          }
        })
      }
    }
  })
})
</script>

<style scoped>
.order-detail-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.order-content {
  padding: 10px;
}

.order-info {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.order-no {
  font-size: 14px;
  color: #666;
}

.order-status {
  font-size: 14px;
  color: #ff6b6b;
}

.order-time {
  font-size: 12px;
  color: #999;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
}

.address-section {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.address-info {
  margin-top: 10px;
}

.address-name {
  font-size: 16px;
  font-weight: bold;
}

.address-detail {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.products-section {
  background: white;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
}

.product-list {
  margin-top: 10px;
}

.product-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.product-item:last-child {
  margin-bottom: 0;
}

.product-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 15px;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.product-name {
  font-size: 14px;
  color: #333;
}

.product-price {
  font-size: 16px;
  color: #ff4444;
  font-weight: bold;
}

.product-quantity {
  font-size: 14px;
  color: #666;
}

.summary-section {
  background: white;
  padding: 15px;
  border-radius: 8px;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.summary-label {
  font-size: 14px;
  color: #666;
}

.summary-value {
  font-size: 14px;
}

.summary-row.total .summary-value {
  font-size: 18px;
  color: #ff4444;
  font-weight: bold;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: white;
  padding: 15px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  gap: 15px;
}

.bottom-bar .van-button {
  flex: 1;
}
</style>