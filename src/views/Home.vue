<template>
  <div class="home-container">
    <van-popup v-model:show="showCouponPopup" position="bottom" :style="{ height: '30%' }">
      <div class="popup-header">
        <h3>优惠券领取</h3>
        <van-icon name="cross" @click="showCouponPopup = false" />
      </div>
      <div class="coupon-list">
        <div class="coupon-item" v-for="coupon in appStore.coupons" :key="coupon.id">
          <div class="coupon-discount">{{ coupon.discount }}</div>
          <div class="coupon-info">
            <p class="coupon-name">{{ coupon.name }}</p>
            <p class="coupon-condition">满{{ coupon.minAmount }}可用</p>
          </div>
          <button class="coupon-btn">领取</button>
        </div>
      </div>
    </van-popup>

    <van-nav-bar :title="appStore.location" left-text="" right-text="">
      <template #left>
        <div class="location-btn" @click="goToLocation">
          <van-icon name="location-o" />
          <span>{{ appStore.location }}</span>
          <van-icon name="arrow-down" />
        </div>
      </template>
      <template #right>
        <van-icon name="search" class="search-icon" @click="goToSearch" />
      </template>
    </van-nav-bar>

    <div class="main-content" ref="scrollContainer" @scroll="onScroll">
      <div class="category-section">
        <div class="category-grid">
          <div 
            v-for="cat in categories" 
            :key="cat.id" 
            class="category-item"
            @click="goToActivity(cat.name)"
          >
            <div class="category-icon" :style="{ background: cat.color + '20', color: cat.color }">
              {{ cat.icon }}
            </div>
            <span class="category-name">{{ cat.name }}</span>
          </div>
        </div>
      </div>

      <van-swipe :autoplay="5000" indicator-color="rgba(255,255,255,0.5)" indicator-active-color="#fff">
        <van-swipe-item v-for="banner in banners" :key="banner.id">
          <img :src="banner.image" class="banner-image" @click="goToBannerUrl(banner.url)" />
        </van-swipe-item>
      </van-swipe>

      <div class="flash-sale-section">
        <div class="section-header">
          <div class="section-title">
            <van-icon name="clock-o" class="title-icon" />
            <span>限时秒杀</span>
          </div>
          <div class="countdown">
            <van-icon name="hourglass" />
            <span class="countdown-time">{{ countdownText }}</span>
          </div>
          <span class="more-link" @click="goToActivity('秒杀')">更多</span>
        </div>
        <div class="product-list">
          <div 
            v-for="product in flashSaleProducts" 
            :key="product.id" 
            class="product-card"
          >
            <img :src="product.image" class="product-image" />
            <div class="product-info">
              <p class="product-name">{{ product.name }}</p>
              <p class="product-unit">{{ product.unit }}</p>
              <div class="product-price">
                <span class="price-current">¥{{ product.price }}</span>
                <span class="price-original">¥{{ product.originalPrice }}</span>
              </div>
              <div class="product-stock">已抢{{ product.sold }}件</div>
            </div>
            <van-button type="primary" size="small" @click="addToCart(product)">抢购</van-button>
          </div>
        </div>
      </div>

      <div class="recommend-section">
        <div class="section-header">
          <div class="section-title">
            <van-icon name="star-o" class="title-icon" />
            <span>为你推荐</span>
          </div>
          <span class="more-link" @click="goToActivity('推荐')">更多</span>
        </div>
        <div class="recommend-grid">
          <div 
            v-for="product in recommendProducts" 
            :key="product.id" 
            class="recommend-card"
          >
            <img :src="product.image" class="recommend-image" />
            <div class="recommend-info">
              <p class="recommend-name">{{ product.name }}</p>
              <p class="recommend-unit">{{ product.unit }}</p>
              <div class="recommend-price">
                <span class="price-current">¥{{ product.price }}</span>
                <span class="sales-count">月销{{ product.sales }}</span>
              </div>
            </div>
            <van-button type="primary" size="small" @click="addToCart(product)">加入购物车</van-button>
          </div>
        </div>
      </div>
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { categories, banners, flashSaleProducts, recommendProducts } from '@/data/mockData'
import { showToast } from 'vant'

const router = useRouter()
const appStore = useAppStore()

const showCouponPopup = ref(true)
const activeTab = ref(0)
const countdownText = ref('02:35:48')
let countdownTimer = null

const updateCountdown = () => {
  const parts = countdownText.value.split(':')
  let hours = parseInt(parts[0])
  let minutes = parseInt(parts[1])
  let seconds = parseInt(parts[2])
  
  seconds--
  if (seconds < 0) {
    seconds = 59
    minutes--
    if (minutes < 0) {
      minutes = 59
      hours--
      if (hours < 0) {
        hours = 23
      }
    }
  }
  
  countdownText.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const goToLocation = () => {
  router.push('/location')
}

const goToSearch = () => {
  router.push('/search')
}

const goToActivity = (type) => {
  router.push(`/activity/${encodeURIComponent(type)}`)
}

const goToBannerUrl = (url) => {
  router.push(url)
}

const addToCart = (product) => {
  appStore.addToCart(product)
  showToast('已加入购物车')
}

const onScroll = () => {}

onMounted(() => {
  countdownTimer = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.location-btn {
  display: flex;
  align-items: center;
  color: #333;
  font-size: 14px;
}

.location-btn span {
  margin: 0 4px;
}

.search-icon {
  font-size: 20px;
  color: #666;
}

.main-content {
  padding: 0 16px 100px;
}

.category-section {
  background: #fff;
  padding: 16px 0;
  margin-bottom: 12px;
  border-radius: 12px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.category-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 8px;
}

.category-name {
  font-size: 12px;
  color: #333;
}

.banner-image {
  width: 100%;
  height: 120px;
  border-radius: 8px;
}

.flash-sale-section {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  margin-top: 12px;
  padding: 16px;
  border-radius: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  color: #fff;
  font-weight: bold;
}

.title-icon {
  margin-right: 8px;
}

.countdown {
  display: flex;
  align-items: center;
  margin-left: 12px;
  background: rgba(0, 0, 0, 0.3);
  padding: 4px 8px;
  border-radius: 4px;
  color: #fff;
  font-size: 12px;
}

.countdown-time {
  margin-left: 4px;
  font-family: monospace;
}

.more-link {
  margin-left: auto;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.product-list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
}

.product-card {
  flex-shrink: 0;
  width: 120px;
  background: #fff;
  border-radius: 8px;
  padding: 8px;
}

.product-image {
  width: 100%;
  height: 80px;
  border-radius: 4px;
  object-fit: cover;
}

.product-info {
  margin-top: 8px;
}

.product-name {
  font-size: 12px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-unit {
  font-size: 10px;
  color: #999;
  margin-top: 4px;
}

.product-price {
  display: flex;
  align-items: baseline;
  margin-top: 8px;
}

.price-current {
  color: #ff6b35;
  font-size: 16px;
  font-weight: bold;
}

.price-original {
  color: #999;
  font-size: 10px;
  text-decoration: line-through;
  margin-left: 4px;
}

.product-stock {
  font-size: 10px;
  color: #999;
  margin-top: 4px;
}

.product-card .van-button {
  width: 100%;
  margin-top: 8px;
  font-size: 12px;
  padding: 4px;
}

.recommend-section {
  margin-top: 16px;
}

.recommend-section .section-title {
  color: #333;
}

.recommend-section .more-link {
  color: #999;
}

.recommend-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.recommend-card {
  background: #fff;
  border-radius: 8px;
  padding: 8px;
}

.recommend-image {
  width: 100%;
  height: 100px;
  border-radius: 4px;
  object-fit: cover;
}

.recommend-info {
  margin-top: 8px;
}

.recommend-name {
  font-size: 13px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recommend-unit {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.recommend-price {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.sales-count {
  font-size: 11px;
  color: #999;
}

.recommend-card .van-button {
  width: 100%;
  margin-top: 8px;
  font-size: 12px;
  padding: 4px;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.popup-header h3 {
  margin: 0;
  font-size: 16px;
}

.coupon-list {
  padding: 16px;
}

.coupon-item {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #fff5f0 0%, #fff 100%);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #ffe5d9;
}

.coupon-discount {
  font-size: 28px;
  font-weight: bold;
  color: #ff6b35;
  margin-right: 12px;
}

.coupon-info {
  flex: 1;
}

.coupon-name {
  font-size: 14px;
  color: #333;
  margin: 0;
}

.coupon-condition {
  font-size: 12px;
  color: #999;
  margin: 4px 0 0;
}

.coupon-btn {
  background: #ff6b35;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
}
</style>
