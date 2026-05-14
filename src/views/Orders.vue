<template>
  <div class="orders-container">
    <van-nav-bar title="我的订单" left-text="返回" @click-left="goBack" />

    <div class="order-tabs">
      <van-tab v-model="activeTab" title="全部" @click="activeTab = 'all'" />
      <van-tab v-model="activeTab" title="待支付" @click="activeTab = 'pending'" />
      <van-tab v-model="activeTab" title="配送中" @click="activeTab = 'delivering'" />
      <van-tab v-model="activeTab" title="已完成" @click="activeTab = 'completed'" />
    </div>

    <div class="order-list">
      <div 
        v-for="order in filteredOrders" 
        :key="order.id" 
        class="order-card"
      >
        <div class="order-header">
          <span class="order-id">订单号: {{ order.id }}</span>
          <span class="order-status" :class="order.status">{{ orderStatusMap[order.status] }}</span>
        </div>
        <div class="order-items">
          <div class="order-item">
            <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' style='background:%23f5f5f5;'><text y='50%' x='50%' text-anchor='middle' dominant-baseline='middle' fill='%23999' font-size='14'>商品</text></svg>" class="item-image" />
            <div class="item-info">
              <p class="item-name">商品名称</p>
              <p class="item-spec">规格信息</p>
            </div>
            <span class="item-price">¥{{ order.total }}</span>
          </div>
        </div>
        <div class="order-footer">
          <span class="order-total">合计: <strong>¥{{ order.total.toFixed(2) }}</strong></span>
          <div class="order-actions">
            <van-button v-if="order.status === 'pending'" type="primary" @click="payOrder(order)">去支付</van-button>
            <van-button v-if="order.status === 'delivering'" type="default" @click="confirmOrder(order)">确认收货</van-button>
            <van-button v-if="order.status === 'completed'" type="default" @click="reorder(order)">再次购买</van-button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredOrders.length === 0" class="empty-state">
      <div class="empty-icon">📦</div>
      <p>暂无订单</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { orderStatusMap } from '@/data/mockData'
import { showToast } from 'vant'

const router = useRouter()
const appStore = useAppStore()

const activeTab = ref('all')

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') {
    return appStore.orders
  }
  return appStore.orders.filter(order => order.status === activeTab.value)
})

const goBack = () => {
  router.back()
}

const payOrder = (order) => {
  showToast(`支付订单: ${order.id}`)
}

const confirmOrder = (order) => {
  showToast(`确认收货: ${order.id}`)
}

const reorder = (order) => {
  showToast(`再次购买: ${order.id}`)
}
</script>

<style scoped>
.orders-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.order-tabs {
  background: #fff;
}

.order-list {
  padding: 16px;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.order-id {
  font-size: 12px;
  color: #999;
}

.order-status {
  font-size: 14px;
  font-weight: bold;
}

.order-status.pending {
  color: #ff6b35;
}

.order-status.delivering {
  color: #4dabf7;
}

.order-status.completed {
  color: #07c160;
}

.order-items {
  border-top: 1px dashed #f0f0f0;
  border-bottom: 1px dashed #f0f0f0;
  padding: 12px 0;
}

.order-item {
  display: flex;
  align-items: center;
}

.item-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}

.item-info {
  flex: 1;
  margin-left: 12px;
}

.item-name {
  font-size: 14px;
  color: #333;
  margin: 0;
}

.item-spec {
  font-size: 12px;
  color: #999;
  margin: 4px 0 0;
}

.item-price {
  font-size: 14px;
  color: #333;
  font-weight: bold;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.order-total {
  font-size: 14px;
  color: #333;
}

.order-total strong {
  color: #ff6b35;
}

.order-actions {
  display: flex;
  gap: 12px;
}

.order-actions .van-button {
  padding: 6px 16px;
  font-size: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 100px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  color: #999;
  font-size: 16px;
}
</style>
