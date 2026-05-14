<template>
  <div class="orders-container">
    <van-nav-bar title="我的订单" />
    
    <van-tabs v-model="activeTab">
      <van-tab title="全部">
        <div class="order-list">
          <div 
            v-for="order in orders" 
            :key="order.id" 
            class="order-item"
            @click="goOrderDetail(order.id)"
          >
            <div class="order-header">
              <span class="order-no">订单号: {{ order.order_no }}</span>
              <span class="order-status">{{ getStatusText(order.status) }}</span>
            </div>
            <div class="order-items">
              <div 
                v-for="item in order.items" 
                :key="item.product_id" 
                class="order-product"
              >
                <img :src="item.image" :alt="item.name" class="product-img" />
                <div class="product-info">
                  <span class="product-name">{{ item.name }}</span>
                  <span class="product-price">¥{{ item.price }} x {{ item.quantity }}</span>
                </div>
              </div>
            </div>
            <div class="order-footer">
              <span class="order-total">共{{ getTotalQuantity(order) }}件商品 合计: ¥{{ order.total_amount.toFixed(2) }}</span>
            </div>
          </div>
        </div>
        <van-empty v-if="orders.length === 0" description="暂无订单" />
      </van-tab>
      <van-tab title="待付款">
        <van-empty description="暂无待付款订单" />
      </van-tab>
      <van-tab title="待发货">
        <van-empty description="暂无待发货订单" />
      </van-tab>
      <van-tab title="待收货">
        <van-empty description="暂无待收货订单" />
      </van-tab>
    </van-tabs>
    
    <van-tabbar v-model="activeNav" route>
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="search" to="/search">搜索</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart" to="/cart">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Tabs, Tab, Empty, Tabbar, TabbarItem } from 'vant'
import { orderApi } from '../services/api'

const router = useRouter()
const activeTab = ref(0)
const activeNav = ref(3)
const orders = ref([])

const getStatusText = (status) => {
  const statusMap = {
    pending: '待付款',
    paid: '待发货',
    shipped: '待收货',
    completed: '已完成'
  }
  return statusMap[status] || status
}

const getTotalQuantity = (order) => {
  return order.items.reduce((sum, item) => sum + item.quantity, 0)
}

const goOrderDetail = (id) => {
  router.push(`/order/${id}`)
}

onMounted(() => {
  orderApi.getOrders().then(res => {
    if (res.code === 200) {
      orders.value = res.data
    }
  })
})
</script>

<style scoped>
.orders-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.order-list {
  padding: 10px;
}

.order-item {
  background: white;
  margin-bottom: 10px;
  border-radius: 8px;
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.order-no {
  font-size: 14px;
  color: #666;
}

.order-status {
  font-size: 14px;
  color: #ff6b6b;
}

.order-items {
  padding: 10px;
}

.order-product {
  display: flex;
  margin-bottom: 10px;
}

.order-product:last-child {
  margin-bottom: 0;
}

.product-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  margin-right: 10px;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 14px;
  color: #333;
}

.product-price {
  font-size: 14px;
  color: #ff444{"file_path": "/Users/chen/Documents/trae_projects/local_projects/may-984/frontend/src/pages/OrdersPage.vue", "content": 