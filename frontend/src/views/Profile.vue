<template>
  <div class="profile-container">
    <div class="profile-header">
      <div v-if="userStore.isLoggedIn" class="user-info">
        <div class="avatar">👤</div>
        <div class="user-detail">
          <h3 class="user-name">{{ userStore.user.nickname }}</h3>
          <p class="user-phone">{{ userStore.user.phone }}</p>
        </div>
      </div>
      <div v-else class="login-prompt" @click="goLogin">
        <div class="avatar">👤</div>
        <span class="login-text">登录/注册</span>
      </div>
    </div>

    <div class="menu-section">
      <div class="menu-item" @click="goOrders">
        <span class="menu-icon">📋</span>
        <span class="menu-text">我的订单</span>
        <span class="menu-arrow">→</span>
      </div>
      <div class="menu-item" @click="goAddress">
        <span class="menu-icon">📍</span>
        <span class="menu-text">收货地址</span>
        <span class="menu-arrow">→</span>
      </div>
      <div class="menu-item" @click="showFeatureTip('收藏商家')">
        <span class="menu-icon">❤️</span>
        <span class="menu-text">收藏商家</span>
        <span class="menu-arrow">→</span>
      </div>
      <div class="menu-item" @click="showFeatureTip('金币商城')">
        <span class="menu-icon">💰</span>
        <span class="menu-text">金币商城</span>
        <span class="menu-arrow">→</span>
      </div>
      <div class="menu-item" @click="showFeatureTip('推荐有奖')">
        <span class="menu-icon">🎁</span>
        <span class="menu-text">推荐有奖</span>
        <span class="menu-arrow">→</span>
      </div>
      <div class="menu-item" @click="showFeatureTip('周边优惠')">
        <span class="menu-icon">🎟️</span>
        <span class="menu-text">周边优惠</span>
        <span class="menu-arrow">→</span>
      </div>
      <div class="menu-item" @click="showFeatureTip('免费流量')">
        <span class="menu-icon">📶</span>
        <span class="menu-text">免费流量</span>
        <span class="menu-arrow">→</span>
      </div>
      <div class="menu-item" @click="showFeatureTip('官方活动')">
        <span class="menu-icon">🎉</span>
        <span class="menu-text">官方活动</span>
        <span class="menu-arrow">→</span>
      </div>
      <div class="menu-item" @click="showFeatureTip('早餐预订')">
        <span class="menu-icon">🌅</span>
        <span class="menu-text">早餐预订</span>
        <span class="menu-arrow">→</span>
      </div>
    </div>

    <div class="menu-section">
      <div class="menu-item" @click="showSettings">
        <span class="menu-icon">⚙️</span>
        <span class="menu-text">设置</span>
        <span class="menu-arrow">→</span>
      </div>
      <div class="menu-item" @click="showAbout">
        <span class="menu-icon">ℹ️</span>
        <span class="menu-text">关于我们</span>
        <span class="menu-arrow">→</span>
      </div>
    </div>

    <div v-if="userStore.isLoggedIn" class="logout-section">
      <button class="btn btn-secondary logout-btn" @click="handleLogout">退出登录</button>
    </div>

    <div class="bottom-nav">
      <div class="nav-item" @click="goHome">
        <span class="nav-icon">🏠</span>
        <span class="nav-text">首页</span>
      </div>
      <div class="nav-item active" @click="goOrders">
        <span class="nav-icon">📋</span>
        <span class="nav-text">订单</span>
      </div>
      <div class="cart-nav-item" @click="goCart">
        <span class="nav-icon">🛒</span>
        <span v-if="cartTotalCount > 0" class="cart-badge">{{ cartTotalCount }}</span>
        <span class="nav-text">购物车</span>
      </div>
      <div class="nav-item" @click="goProfile">
        <span class="nav-icon">👤</span>
        <span class="nav-text">我的</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const cartTotalCount = computed(() => cartStore.totalCount)

function goLogin() {
  router.push('/login')
}

function goOrders() {
  router.push('/orders')
}

function goAddress() {
  router.push('/address')
}

function goHome() {
  router.push('/home')
}

function goCart() {
  router.push('/cart')
}

function goProfile() {
  router.push('/profile')
}

function showFeatureTip(feature) {
  alert(`${feature}功能开发中，敬请期待！`)
}

function showSettings() {
  alert('设置页面开发中，敬请期待！')
}

function showAbout() {
  alert('饿了么外卖 v1.0.0\n品质外卖 准时送达')
}

function handleLogout() {
  if (confirm('确定要退出登录吗？')) {
    userStore.logout()
  }
}
</script>

<style scoped>
.profile-container {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.profile-header {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  padding: 30px 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
}

.user-detail {
  color: #fff;
}

.user-name {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 4px 0;
}

.user-phone {
  font-size: 14px;
  margin: 0;
  opacity: 0.8;
}

.login-prompt {
  display: flex;
  align-items: center;
  gap: 16px;
}

.login-text {
  color: #fff;
  font-size: 16px;
  font-weight: 500;
}

.menu-section {
  background: #fff;
  margin: 12px;
  border-radius: 12px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f5f5f5;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 24px;
  margin-right: 12px;
}

.menu-text {
  flex: 1;
  font-size: 15px;
  color: #333;
}

.menu-arrow {
  font-size: 16px;
  color: #999;
}

.logout-section {
  padding: 20px 16px;
}

.logout-btn {
  width: 100%;
  height: 48px;
  border-radius: 24px;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: #fff;
  padding: 8px 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #999;
}

.nav-item.active {
  color: #ff6b35;
}

.cart-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #999;
  position: relative;
}

.cart-nav-item.active {
  color: #ff6b35;
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: 50%;
  transform: translateX(8px);
  min-width: 16px;
  height: 16px;
  background: #ff4757;
  color: #fff;
  font-size: 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.nav-icon {
  font-size: 24px;
}

.nav-text {
  font-size: 11px;
}
</style>