<template>
  <div class="profile-container">
    <van-nav-bar title="我的" />
    
    <div class="user-info" v-if="user">
      <div class="avatar">
        <van-icon name="user" size="48" />
      </div>
      <div class="user-detail">
        <span class="user-name">{{ user.nickname || '点击登录' }}</span>
        <span class="user-phone">{{ user.phone }}</span>
      </div>
      <van-button v-if="!isLoggedIn" type="primary" size="small" @click="goLogin">登录</van-button>
      <van-button v-else type="default" size="small" @click="logout">退出登录</van-button>
    </div>
    
    <div class="order-section">
      <div class="section-header">
        <span class="section-title">我的订单</span>
        <a href="#" @click="goOrders">查看全部 ></a>
      </div>
      <div class="order-tabs">
        <div class="order-tab" @click="goOrders">
          <van-icon name="shopping-cart" />
          <span class="tab-text">待付款</span>
        </div>
        <div class="order-tab" @click="goOrders">
          <van-icon name="package" />
          <span class="tab-text">待发货</span>
        </div>
        <div class="order-tab" @click="goOrders">
          <van-icon name="truck" />
          <span class="tab-text">待收货</span>
        </div>
        <div class="order-tab" @click="goOrders">
          <van-icon name="star" />
          <span class="tab-text">待评价</span>
        </div>
        <div class="order-tab" @click="goOrders">
          <van-icon name="refresh" />
          <span class="tab-text">退换/售后</span>
        </div>
      </div>
    </div>
    
    <div class="menu-section">
      <van-cell-group>
        <van-cell icon="location-o" title="收货地址" @click="goAddress" />
        <van-cell icon="headphones-o" title="客服中心" />
        <van-cell icon="settings-o" title="设置" />
        <van-cell icon="info-o" title="关于我们" />
      </van-cell-group>
    </div>
    
    <van-tabbar v-model="activeTab" route>
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="search" to="/search">搜索</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart" to="/cart" :badge="cartCount">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Icon, Button, Cell, CellGroup, Tabbar, TabbarItem, showToast } from 'vant'
import store from '../store'

const router = useRouter()
const activeTab = ref(3)
const cartCount = ref(store.state.cart.count)

const user = computed(() => store.state.user.info)
const isLoggedIn = computed(() => !!store.state.user.token)

const goLogin = () => {
  router.push('/login')
}

const logout = () => {
  store.mutations.clearUser()
  showToast('已退出登录')
}

const goOrders = () => {
  router.push('/orders')
}

const goAddress = () => {
  router.push('/address')
}
</script>

<style scoped>
.profile-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.user-info {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  padding: 30px 20px;
}

.avatar {
  width: 70px;
  height: 70px;
  background: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 15px;
}

.avatar .van-icon {
  color: #ff6b6b;
}

.user-detail {
  flex: 1;
}

.user-name {
  display: block;
  font-size: 18px;
  font-weight: bold;
  color: white;
  margin-bottom: 5px;
}

.user-phone {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

.order-section {
  background: white;
  margin: 10px;
  border-radius: 8px;
  padding: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
}

.section-header a {
  font-size: 14px;
  color: #666;
}

.order-tabs {
  display: flex;
  justify-content: space-around;
}

.order-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.order-tab .van-icon {
  font-size: 24px;
  color: #666;
  margin-bottom: 5px;
}

.tab-text {
  font-size: 12px;
  color: #666;
}

.menu-section {
  margin: 10px;
}
</style>