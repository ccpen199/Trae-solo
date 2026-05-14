<template>
  <div class="user-container">
    <div class="user-header">
      <div class="header-bg"></div>
      <div class="user-info">
        <div class="avatar">
          <van-icon name="user-o" />
        </div>
        <div class="info-text">
          <h2 class="user-name">{{ appStore.userInfo.name }}</h2>
          <div class="member-badge">{{ appStore.userInfo.memberLevel }}</div>
        </div>
        <div class="points-info">
          <span class="points-label">积分</span>
          <span class="points-value">{{ appStore.userInfo.points }}</span>
        </div>
      </div>
    </div>

    <div class="order-section">
      <div class="section-header">
        <span class="section-title">我的订单</span>
        <span class="more-link" @click="goToOrders('all')">全部订单</span>
      </div>
      <div class="order-tabs">
        <div 
          v-for="tab in orderTabs" 
          :key="tab.key"
          class="order-tab"
          @click="goToOrders(tab.key)"
        >
          <van-icon :name="tab.icon" />
          <span class="tab-text">{{ tab.name }}</span>
          <van-badge v-if="tab.count > 0" :content="tab.count" />
        </div>
      </div>
    </div>

    <div class="menu-section">
      <div class="menu-group">
        <div class="menu-item" @click="goToCoupon">
          <van-icon name="ticket-o" class="menu-icon" />
          <span class="menu-text">优惠券</span>
          <van-icon name="arrow-right" class="menu-arrow" />
          <span class="menu-count">{{ appStore.coupons.length }}</span>
        </div>
        <div class="menu-item" @click="goToFavorites">
          <van-icon name="star-o" class="menu-icon" />
          <span class="menu-text">我的关注</span>
          <van-icon name="arrow-right" class="menu-arrow" />
        </div>
        <div class="menu-item" @click="goToAddress">
          <van-icon name="map-o" class="menu-icon" />
          <span class="menu-text">收货地址</span>
          <van-icon name="arrow-right" class="menu-arrow" />
        </div>
        <div class="menu-item" @click="goToFeedback">
          <van-icon name="message-circle-o" class="menu-icon" />
          <span class="menu-text">意见反馈</span>
          <van-icon name="arrow-right" class="menu-arrow" />
        </div>
      </div>

      <div class="menu-group">
        <div class="menu-item" @click="goToRecruit">
          <van-icon name="users" class="menu-icon" />
          <span class="menu-text">招兵买马</span>
          <van-icon name="arrow-right" class="menu-arrow" />
        </div>
        <div class="menu-item" @click="goToService">
          <van-icon name="headphones" class="menu-icon" />
          <span class="menu-text">在线客服</span>
          <van-icon name="arrow-right" class="menu-arrow" />
        </div>
        <div class="menu-item" @click="goToSettings">
          <van-icon name="settings" class="menu-icon" />
          <span class="menu-text">设置</span>
          <van-icon name="arrow-right" class="menu-arrow" />
        </div>
      </div>
    </div>

    <div class="logout-section">
      <van-button 
        v-if="appStore.isLoggedIn" 
        type="default" 
        class="logout-btn"
        @click="handleLogout"
      >
        退出登录
      </van-button>
      <van-button 
        v-else 
        type="primary" 
        class="logout-btn"
        @click="handleLogin"
      >
        登录/注册
      </van-button>
    </div>

    <van-tabbar v-model="activeTab" active-color="#ff6b35" inactive-color="#999">
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="play-circle-o" to="/food">美食</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart-o" to="/cart" :badge="appStore.cartCount() > 0 ? appStore.cartCount() : 0">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/user">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { showToast } from 'vant'

const router = useRouter()
const appStore = useAppStore()

const activeTab = ref(3)

const orderTabs = [
  { key: 'pending', name: '待支付', icon: 'clock-o', count: 1 },
  { key: 'delivering', name: '配送中', icon: 'truck', count: 1 },
  { key: 'completed', name: '已完成', icon: 'check-circle-o', count: 0 },
]

const goToOrders = (status) => {
  router.push(`/orders?status=${status}`)
}

const goToCoupon = () => {
  router.push('/coupon')
}

const goToFavorites = () => {
  showToast('我的关注')
}

const goToAddress = () => {
  router.push('/address')
}

const goToFeedback = () => {
  showToast('意见反馈')
}

const goToRecruit = () => {
  showToast('招兵买马')
}

const goToService = () => {
  showToast('在线客服')
}

const goToSettings = () => {
  router.push('/settings')
}

const handleLogin = () => {
  appStore.login()
  showToast('登录成功')
}

const handleLogout = () => {
  appStore.logout()
  showToast('已退出登录')
}
</script>

<style scoped>
.user-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.user-header {
  position: relative;
  padding: 60px 16px 24px;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 180px;
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
}

.user-info {
  position: relative;
  display: flex;
  align-items: center;
}

.avatar {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.avatar van-icon {
  font-size: 40px;
  color: #fff;
}

.info-text {
  flex: 1;
}

.user-name {
  font-size: 20px;
  color: #fff;
  font-weight: bold;
  margin: 0;
}

.member-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-top: 8px;
}

.points-info {
  text-align: center;
}

.points-label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.points-value {
  display: block;
  font-size: 24px;
  color: #fff;
  font-weight: bold;
}

.order-section {
  background: #fff;
  margin: 0 16px;
  border-radius: 12px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.more-link {
  font-size: 12px;
  color: #999;
}

.order-tabs {
  display: flex;
  justify-content: space-around;
}

.order-tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.order-tab van-icon {
  font-size: 24px;
  color: #666;
}

.tab-text {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
}

.menu-section {
  margin: 16px;
}

.menu-group {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 20px;
  color: #666;
  margin-right: 12px;
}

.menu-text {
  flex: 1;
  font-size: 15px;
  color: #333;
}

.menu-arrow {
  font-size: 16px;
  color: #ccc;
}

.menu-count {
  font-size: 14px;
  color: #ff6b35;
  margin-left: 8px;
}

.logout-section {
  padding: 16px;
}

.logout-btn {
  width: 100%;
  border-radius: 25px;
}
</style>
