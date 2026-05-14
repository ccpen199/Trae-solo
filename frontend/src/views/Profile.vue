<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left" @click="goBack">‹</div>
      <div class="header-title">我的</div>
      <div class="header-right"></div>
    </div>

    <div class="content">
      <div class="user-card">
        <div class="user-avatar">👤</div>
        <div class="user-info">
          <div class="user-name">{{ user?.username || '点击登录' }}</div>
          <div class="user-id">ID：{{ user?.id || '-' }}</div>
        </div>
        <button v-if="!isLoggedIn" class="login-btn" @click="goToLogin">登录</button>
        <button v-else class="logout-btn" @click="handleLogout">退出</button>
      </div>

      <div class="order-section">
        <div class="section-header">
          <span>我的订单</span>
          <span class="more" @click="goToOrders">查看全部 ›</span>
        </div>
        <div class="order-tabs">
          <div class="order-tab" @click="goToOrdersWithStatus('pending')">
            <span class="tab-icon">💰</span>
            <span class="tab-label">待付款</span>
          </div>
          <div class="order-tab" @click="goToOrdersWithStatus('paid')">
            <span class="tab-icon">📦</span>
            <span class="tab-label">待收货</span>
          </div>
          <div class="order-tab" @click="goToOrdersWithStatus('shipped')">
            <span class="tab-icon">⭐</span>
            <span class="tab-label">待评价</span>
          </div>
          <div class="order-tab" @click="goToOrdersWithStatus('completed')">
            <span class="tab-icon">📋</span>
            <span class="tab-label">已完成</span>
          </div>
        </div>
      </div>

      <div class="menu-section">
        <div class="menu-item" @click="handleMenuClick('favorites')">
          <span class="menu-icon">❤️</span>
          <span class="menu-text">我的收藏</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="handleMenuClick('coupons')">
          <span class="menu-icon">🎫</span>
          <span class="menu-text">优惠券</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="handleMenuClick('address')">
          <span class="menu-icon">📍</span>
          <span class="menu-text">收货地址</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="handleMenuClick('service')">
          <span class="menu-icon">💬</span>
          <span class="menu-text">客服中心</span>
          <span class="menu-arrow">›</span>
        </div>
        <div class="menu-item" @click="handleMenuClick('settings')">
          <span class="menu-icon">⚙️</span>
          <span class="menu-text">设置</span>
          <span class="menu-arrow">›</span>
        </div>
      </div>

      <div class="member-section" v-if="isLoggedIn">
        <div class="member-info">
          <span class="member-icon">🎖️</span>
          <div class="member-content">
            <span class="member-title">会员中心</span>
            <span class="member-level">普通会员</span>
          </div>
        </div>
        <button class="member-btn">查看会员码</button>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useCartStore } from '../stores/cart'
import TabBar from '../components/TabBar.vue'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)

function goBack() {
  router.back()
}

function goToLogin() {
  router.push('/login')
}

function handleLogout() {
  userStore.logout()
  cartStore.clearLocal()
  const event = new CustomEvent('showToast', { detail: '已退出登录' })
  window.dispatchEvent(event)
}

function goToOrders() {
  router.push('/orders')
}

function goToOrdersWithStatus(status) {
  router.push(`/orders?status=${status}`)
}

function handleMenuClick(type) {
  const messages = {
    favorites: '收藏功能开发中',
    coupons: '优惠券功能开发中',
    address: '地址管理功能开发中',
    service: '客服功能开发中',
    settings: '设置功能开发中'
  }
  const event = new CustomEvent('showToast', { detail: messages[type] })
  window.dispatchEvent(event)
}
</script>

<style scoped>
.content {
  padding-top: 54px;
}

.user-card {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, var(--primary-color) 0%, #ff6b6b 100%);
  padding: 30px 20px;
  color: #fff;
}

.user-avatar {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  margin-right: 20px;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 5px;
}

.user-id {
  font-size: 14px;
  opacity: 0.8;
}

.login-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid #fff;
  color: #fff;
  border-radius: 20px;
  font-size: 14px;
}

.logout-btn {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid #fff;
  color: #fff;
  border-radius: 20px;
  font-size: 14px;
}

.order-section {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  padding: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: bold;
}

.more {
  font-size: 14px;
  color: var(--gray-color);
  font-weight: normal;
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

.tab-icon {
  font-size: 28px;
  margin-bottom: 5px;
}

.tab-label {
  font-size: 12px;
  color: #333;
}

.menu-section {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid var(--border-color);
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 20px;
  margin-right: 15px;
}

.menu-text {
  flex: 1;
  font-size: 15px;
  color: #333;
}

.menu-arrow {
  color: var(--gray-color);
}

.member-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #fff8f0 0%, #fff 100%);
  margin: 10px;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #ffe4cc;
}

.member-info {
  display: flex;
  align-items: center;
}

.member-icon {
  font-size: 32px;
  margin-right: 15px;
}

.member-content {
  display: flex;
  flex-direction: column;
}

.member-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.member-level {
  font-size: 12px;
  color: var(--secondary-color);
}

.member-btn {
  padding: 10px 25px;
  background: var(--secondary-color);
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
}
</style>