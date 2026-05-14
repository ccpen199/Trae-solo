<template>
  <div class="home-container">
    <div class="header">
      <div class="location" @click="goAddress">
        <span class="location-icon">📍</span>
        <span class="location-text">{{ currentAddress }}</span>
        <span class="arrow">▼</span>
      </div>
      <div class="weather">
        <span class="weather-icon">☀️</span>
        <span class="weather-text">26°</span>
      </div>
    </div>

    <div class="search-bar" @click="goSearch">
      <span class="search-icon">🔍</span>
      <span class="search-placeholder">搜索商家或商品</span>
    </div>

    <div class="food-tags">
      <span 
        v-for="tag in foodTags" 
        :key="tag" 
        class="food-tag"
        :class="{ active: selectedTag === tag }"
        @click="selectedTag = tag"
      >{{ tag }}</span>
    </div>

    <div class="categories-scroll">
      <div class="categories-wrapper">
        <div 
          v-for="category in categories" 
          :key="category.id" 
          class="category-item"
          @click="handleCategoryClick(category.id)"
        >
          <span class="category-icon">{{ category.icon }}</span>
          <span class="category-name">{{ category.name }}</span>
        </div>
      </div>
    </div>

    <div class="banners-scroll">
      <div class="banners-wrapper" :style="{ transform: `translateX(-${bannerIndex * 100}%)` }">
        <div 
          v-for="banner in banners" 
          :key="banner.id" 
          class="banner-item"
          @click="openBanner(banner)"
        >
          <img :src="banner.image" alt="banner" class="banner-image" />
        </div>
      </div>
      <div class="banner-indicators">
        <span 
          v-for="(_, index) in banners" 
          :key="index"
          class="banner-indicator"
          :class="{ active: index === bannerIndex }"
        ></span>
      </div>
    </div>

    <div class="topics-section">
      <h3 class="section-title">专题活动</h3>
      <div class="topics-wrapper">
        <div 
          v-for="topic in topics" 
          :key="topic.id" 
          class="topic-item"
          @click="openTopic(topic)"
        >
          <img :src="topic.image" alt="topic" class="topic-image" />
          <div class="topic-info">
            <h4 class="topic-title">{{ topic.title }}</h4>
            <p class="topic-desc">{{ topic.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="merchants-section">
      <h3 class="section-title">推荐商家</h3>
      <div class="merchants-wrapper">
        <div 
          v-for="merchant in merchants" 
          :key="merchant.id" 
          class="merchant-item"
          @click="goMerchant(merchant.id)"
        >
          <img :src="merchant.logo" alt="logo" class="merchant-logo" />
          <div class="merchant-info">
            <h4 class="merchant-name">{{ merchant.name }}</h4>
            <div class="merchant-tags">
              <span class="rating">{{ merchant.rating }}分</span>
              <span class="delivery-time">{{ merchant.delivery_time }}分钟</span>
              <span class="delivery-fee">¥{{ merchant.delivery_fee }}配送费</span>
              <span class="min-order">¥{{ merchant.min_order }}起送</span>
            </div>
            <p class="merchant-tags-text">{{ merchant.tags }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-nav">
      <div class="nav-item active" @click="goHome">
        <span class="nav-icon">🏠</span>
        <span class="nav-text">首页</span>
      </div>
      <div class="nav-item" @click="goOrders">
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { homeAPI, merchantAPI } from '@/api'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const currentAddress = ref('北京市朝阳区望京SOHO')
const selectedTag = ref('全部')
const foodTags = ['全部', '外卖', '美食', '超市', '水果', '鲜花']
const categories = ref([])
const banners = ref([])
const topics = ref([])
const merchants = ref([])
const bannerIndex = ref(0)
let bannerTimer = null

const cartTotalCount = ref(0)

onMounted(() => {
  loadData()
  startBannerLoop()
  cartTotalCount.value = cartStore.totalCount
})

onUnmounted(() => {
  if (bannerTimer) {
    clearInterval(bannerTimer)
  }
})

async function loadData() {
  try {
    const [categoriesRes, bannersRes, topicsRes, merchantsRes] = await Promise.all([
      homeAPI.getCategories(),
      homeAPI.getBanners(),
      homeAPI.getTopics(),
      merchantAPI.getMerchants({ page: 1, pageSize: 10 })
    ])
    
    if (categoriesRes.success) categories.value = categoriesRes.data
    if (bannersRes.success) banners.value = bannersRes.data
    if (topicsRes.success) topics.value = topicsRes.data
    if (merchantsRes.success) merchants.value = merchantsRes.data
  } catch (err) {
    console.error('加载数据失败:', err)
  }
}

function startBannerLoop() {
  bannerTimer = setInterval(() => {
    bannerIndex.value = (bannerIndex.value + 1) % banners.value.length
  }, 3000)
}

function goSearch() {
  router.push('/search')
}

function goAddress() {
  router.push('/address')
}

function goMerchant(id) {
  router.push(`/merchant/${id}`)
}

function goHome() {
  router.push('/home')
}

function goOrders() {
  router.push('/orders')
}

function goCart() {
  router.push('/cart')
}

function goProfile() {
  router.push('/profile')
}

function handleCategoryClick(categoryId) {
  router.push({ path: '/search-result', query: { category_id: categoryId } })
}

function openBanner(banner) {
  console.log('打开banner:', banner.link)
}

function openTopic(topic) {
  console.log('打开专题:', topic.link)
}
</script>

<style scoped>
.home-container {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 12px;
  background: #fff;
}

.location {
  display: flex;
  align-items: center;
  gap: 4px;
}

.location-icon {
  font-size: 18px;
}

.location-text {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.arrow {
  font-size: 12px;
  color: #999;
}

.weather {
  display: flex;
  align-items: center;
  gap: 4px;
}

.weather-icon {
  font-size: 18px;
}

.weather-text {
  font-size: 14px;
  color: #666;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 24px;
}

.search-icon {
  font-size: 16px;
}

.search-placeholder {
  font-size: 14px;
  color: #999;
}

.food-tags {
  display: flex;
  gap: 12px;
  padding: 0 16px;
  margin-bottom: 12px;
  overflow-x: auto;
}

.food-tag {
  padding: 6px 16px;
  background: #fff;
  border-radius: 16px;
  font-size: 13px;
  color: #666;
  white-space: nowrap;
}

.food-tag.active {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  color: #fff;
}

.categories-scroll {
  background: #fff;
  padding: 16px 0;
}

.categories-wrapper {
  display: flex;
  gap: 20px;
  padding: 0 16px;
  overflow-x: auto;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 64px;
}

.category-icon {
  font-size: 40px;
}

.category-name {
  font-size: 12px;
  color: #333;
}

.banners-scroll {
  position: relative;
  margin: 16px;
}

.banners-wrapper {
  display: flex;
  transition: transform 0.5s ease;
}

.banner-item {
  width: 100%;
  flex-shrink: 0;
}

.banner-image {
  width: 100%;
  height: 120px;
  border-radius: 12px;
  object-fit: cover;
}

.banner-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 12px;
}

.banner-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
}

.banner-indicator.active {
  background: #ff6b35;
}

.topics-section {
  background: #fff;
  padding: 16px;
  margin-bottom: 12px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 12px;
}

.topics-wrapper {
  display: flex;
  gap: 12px;
  overflow-x: auto;
}

.topic-item {
  flex-shrink: 0;
  width: 120px;
}

.topic-image {
  width: 100%;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}

.topic-info {
  padding: 8px 0;
}

.topic-title {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin: 0 0 4px 0;
}

.topic-desc {
  font-size: 11px;
  color: #999;
  margin: 0;
}

.merchants-section {
  padding: 0 16px;
}

.merchants-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.merchant-item {
  display: flex;
  gap: 12px;
  background: #fff;
  padding: 12px;
  border-radius: 12px;
}

.merchant-logo {
  width: 72px;
  height: 72px;
  border-radius: 8px;
  object-fit: cover;
}

.merchant-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.merchant-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.merchant-tags {
  display: flex;
  gap: 8px;
}

.rating {
  font-size: 12px;
  color: #ff6b35;
}

.delivery-time, .delivery-fee, .min-order {
  font-size: 12px;
  color: #999;
}

.merchant-tags-text {
  font-size: 12px;
  color: #666;
  margin: 0;
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