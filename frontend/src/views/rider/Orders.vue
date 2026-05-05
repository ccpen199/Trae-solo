<template>
  <div class="orders-page">
    <div class="page-header">
      <h1>订单列表</h1>
    </div>
    
    <div class="page-content">
      <div class="tab-header">
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'; loadOrders()"
        >全部</div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'pending' }"
          @click="activeTab = 'pending_pickup'; loadOrders()"
        >待取货</div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'delivery' }"
          @click="activeTab = 'in_delivery'; loadOrders()"
        >配送中</div>
        <div 
          class="tab-item" 
          :class="{ active: activeTab === 'completed' }"
          @click="activeTab = 'completed'; loadOrders()"
        >已完成</div>
      </div>
      
      <div v-if="loading" class="loading">
        加载中...
      </div>
      
      <div v-else-if="orders.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>暂无订单数据</p>
      </div>
      
      <div v-else style="padding: 12px;">
        <div 
          v-for="order in orders" 
          :key="order.id" 
          class="card"
          style="cursor: pointer; margin: 0 0 12px 0;"
          @click="$router.push(`/rider/orders/${order.id}`)"
        >
          <div class="card-header">
            <span class="card-title">{{ order.merchantName }}</span>
            <span class="card-badge" :class="getBadgeClass(order.status)">
              {{ getStatusText(order.status) }}
            </span>
          </div>
          
          <div class="info-row">
            <span class="info-label">订单号</span>
            <span class="info-value">{{ order.orderNumber }}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">送达地址</span>
            <span class="info-value">{{ order.deliveryAddress }}</span>
          </div>
          
          <div class="info-row" v-if="order.estimatedDeliveryTime">
            <span class="info-label">预计送达</span>
            <span class="info-value">{{ formatDateTime(order.estimatedDeliveryTime) }}</span>
          </div>
          
          <div class="flex-between" style="margin-top: 12px;">
            <div class="earnings">¥{{ order.riderEarnings }}</div>
            <div style="font-size: 12px; color: #999;">
              {{ formatDateTime(order.createdAt) }}
            </div>
          </div>
        </div>
      </div>
      
      <div style="height: 20px;"></div>
    </div>
    
    <div class="bottom-nav">
      <div class="nav-item" @click="$router.push('/rider')">
        <div class="nav-icon">🏠</div>
        <div class="nav-text">首页</div>
      </div>
      <div class="nav-item active" @click="$router.push('/rider/orders')">
        <div class="nav-icon">📋</div>
        <div class="nav-text">订单</div>
      </div>
      <div class="nav-item" @click="$router.push('/rider/schedule')">
        <div class="nav-icon">📅</div>
        <div class="nav-text">排班</div>
      </div>
      <div class="nav-item" @click="$router.push('/rider/profile')">
        <div class="nav-icon">👤</div>
        <div class="nav-text">我的</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { orderApi } from '../../api'

const activeTab = ref('all')
const orders = ref([])
const loading = ref(false)

const getBadgeClass = (status) => {
  const classes = {
    available: 'badge-available',
    pending_pickup: 'badge-pending',
    offsite_delivered: 'badge-pending',
    in_delivery: 'badge-delivery',
    completed: 'badge-completed',
    refund_pending: 'badge-pending'
  }
  return classes[status] || 'badge-completed'
}

const getStatusText = (status) => {
  const texts = {
    available: '可抢单',
    pending_pickup: '待取货',
    offsite_delivered: '校外已送达',
    in_delivery: '配送中',
    completed: '已完成',
    refund_pending: '退单待审',
    refunded: '已退单'
  }
  return texts[status] || status
}

const formatDateTime = (dateStr) => {
  const date = new Date(dateStr)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

const loadOrders = async () => {
  loading.value = true
  try {
    const status = activeTab.value === 'all' ? undefined : activeTab.value
    const response = await orderApi.getAll(status)
    if (response.data.success) {
      orders.value = response.data.data
    }
  } catch (err) {
    console.error('加载订单失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadOrders()
})
</script>
