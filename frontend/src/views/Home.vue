<template>
  <div class="home-page">
    <div class="header">
      <div class="car-selector" @click="openCarSelector">
        <div class="car-icon">
          <el-icon :size="20"><Car /></el-icon>
        </div>
        <div class="car-info">
          <span class="car-label">选择车型</span>
          <span class="car-name" v-if="userCar">
            {{ userCar.carInfo?.brandName }} {{ userCar.carInfo?.seriesName }}
          </span>
          <span class="car-name placeholder" v-else>请选择车型</span>
        </div>
        <el-icon :size="12"><ArrowRight /></el-icon>
      </div>
      <div class="search-bar" @click="handleSearch">
        <el-icon :size="16"><Search /></el-icon>
        <span class="search-placeholder">搜索机油、轮胎、刹车片</span>
      </div>
    </div>

    <div class="banner-section">
      <div class="banner">
        <div class="banner-content">
          <h2>春季养护特惠</h2>
          <p>全场保养套餐低至5折起</p>
          <el-button type="primary" size="small">立即抢购</el-button>
        </div>
      </div>
    </div>

    <div class="quick-menu">
      <div class="menu-row">
        <div class="menu-item" @click="goToCategory('机油')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <el-icon :size="24"><Oil /></el-icon>
          </div>
          <span>机油</span>
        </div>
        <div class="menu-item" @click="goToCategory('轮胎')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
            <el-icon :size="24"><Promotion /></el-icon>
          </div>
          <span>轮胎</span>
        </div>
        <div class="menu-item" @click="goToCategory('刹车片')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
            <el-icon :size="24"><Tools /></el-icon>
          </div>
          <span>刹车片</span>
        </div>
        <div class="menu-item" @click="goToCategory('空调滤芯')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
            <el-icon :size="24"><Aim /></el-icon>
          </div>
          <span>空调滤芯</span>
        </div>
      </div>
      <div class="menu-row">
        <div class="menu-item" @click="goToCategory('空气滤芯')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
            <el-icon :size="24"><WindPower /></el-icon>
          </div>
          <span>空气滤芯</span>
        </div>
        <div class="menu-item" @click="goToCategory('火花塞')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);">
            <el-icon :size="24"><Lightning /></el-icon>
          </div>
          <span>火花塞</span>
        </div>
        <div class="menu-item" @click="goToCategory('蓄电池')">
          <div class="menu-icon" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);">
            <el-icon :size="24"><Connection /></el-icon>
          </div>
          <span>蓄电池</span>
        </div>
        <div class="menu-item" @click="goToStore">
          <div class="menu-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <el-icon :size="24"><OfficeBuilding /></el-icon>
          </div>
          <span>门店服务</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h3>热销推荐</h3>
        <span class="more" @click="goToCategory('all')">更多 ></span>
      </div>
      <div class="product-list">
        <div 
          v-for="product in hotProducts" 
          :key="product.id"
          class="product-card"
          @click="goToProduct(product.id)"
        >
          <div class="product-image">
            <div class="placeholder-img">
              <el-icon :size="40"><Picture /></el-icon>
            </div>
          </div>
          <div class="product-info">
            <h4 class="product-name">{{ product.name }}</h4>
            <p class="product-desc">{{ product.description }}</p>
            <div class="product-price">
              <span class="current-price">¥{{ product.price }}</span>
              <span class="original-price" v-if="product.originalPrice">¥{{ product.originalPrice }}</span>
            </div>
            <div class="product-meta">
              <span class="brand">{{ product.brand }}</span>
              <span class="sales">已售{{ product.sales }}件</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section" style="padding-bottom: 80px;">
      <div class="section-header">
        <h3>养车知识</h3>
        <span class="more" @click="goToDiscover">更多 ></span>
      </div>
      <div class="article-list">
        <div 
          v-for="article in articles" 
          :key="article.id"
          class="article-card"
          @click="goToArticle(article.id)"
        >
          <div class="article-content">
            <h4 class="article-title">{{ article.title }}</h4>
            <p class="article-summary">{{ article.content.substring(0, 80) }}...</p>
            <div class="article-meta">
              <span class="view-count">{{ article.viewCount }}阅读</span>
              <span class="like-count">{{ article.likeCount }}点赞</span>
            </div>
          </div>
          <div class="article-cover" v-if="article.coverImage">
            <img :src="article.coverImage" alt="">
          </div>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import TabBar from '@/components/TabBar.vue'
import request from '@/utils/request'

const router = useRouter()
const userStore = useUserStore()

const openCarSelector = inject('openCarSelector')
const userCar = ref(null)

const hotProducts = ref([
  { 
    id: 1, 
    name: '美孚1号 全合成机油 0W-40 SN级 4L',
    description: '美孚1号 0W-40 是先进的全合成发动机油，能为引擎提供卓越的保护。',
    price: 399.00,
    originalPrice: 499.00,
    brand: '美孚',
    sales: 5689
  },
  { 
    id: 2, 
    name: '米其林轮胎 PRIMACY 4 215/55R17 94V',
    description: '米其林浩悦4代，静音舒适，湿地抓地力出色。',
    price: 899.00,
    originalPrice: 1099.00,
    brand: '米其林',
    sales: 3568
  }
])

const articles = ref([
  {
    id: 1,
    title: '汽车保养小常识：机油多久更换一次？',
    content: '很多车主都知道机油需要定期更换，但具体多久更换一次呢？其实，机油的更换周期取决于多个因素...',
    viewCount: 12568,
    likeCount: 568
  },
  {
    id: 2,
    title: '冬天来了，汽车轮胎胎压应该调到多少？',
    content: '随着气温下降，很多车主开始关注轮胎胎压的问题。那么冬天胎压应该调多少呢？...',
    viewCount: 8956,
    likeCount: 425
  }
])

const handleSearch = () => {
  // 搜索功能
}

const goToCategory = (category) => {
  router.push('/category')
}

const goToStore = () => {
  router.push('/store')
}

const goToProduct = (id) => {
  router.push(`/product/${id}`)
}

const goToDiscover = () => {
  router.push('/discover')
}

const goToArticle = (id) => {
  router.push(`/article/${id}`)
}

onMounted(() => {
  userStore.initFromStorage()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 70px;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 16px 16px 20px;
}

.car-selector {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 12px;
  cursor: pointer;
}

.car-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 12px;
}

.car-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.car-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
}

.car-name {
  font-size: 14px;
  color: #fff;
  font-weight: 500;
}

.car-name.placeholder {
  color: rgba(255, 255, 255, 0.8);
}

.header .el-icon:last-child {
  color: rgba(255, 255, 255, 0.8);
}

.search-bar {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 20px;
  padding: 10px 16px;
  cursor: pointer;
}

.search-bar .el-icon {
  color: #999;
  margin-right: 8px;
}

.search-placeholder {
  font-size: 13px;
  color: #999;
}

.banner-section {
  padding: 12px 16px;
}

.banner {
  height: 140px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ffa502 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  position: relative;
  overflow: hidden;
}

.banner::after {
  content: '';
  position: absolute;
  right: -40px;
  top: -20px;
  width: 140px;
  height: 140px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.banner-content h2 {
  color: #fff;
  font-size: 20px;
  margin-bottom: 8px;
}

.banner-content p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  margin-bottom: 12px;
}

.banner-content .el-button {
  border-radius: 15px;
  background: #fff;
  color: #ff6b6b;
  border: none;
}

.quick-menu {
  background: #fff;
  margin: 0 16px 12px;
  border-radius: 12px;
  padding: 16px 0;
}

.menu-row {
  display: flex;
  padding: 0 8px;
}

.menu-row:first-child {
  margin-bottom: 8px;
}

.menu-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  cursor: pointer;
}

.menu-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-bottom: 6px;
}

.menu-item span {
  font-size: 12px;
  color: #333;
}

.section {
  background: #fff;
  margin: 0 16px 12px;
  border-radius: 12px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  font-size: 16px;
  color: #333;
  margin: 0;
}

.more {
  font-size: 12px;
  color: #999;
  cursor: pointer;
}

.product-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.product-card {
  width: calc(50% - 6px);
  background: #f9f9f9;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.product-image {
  height: 140px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-img {
  width: 80px;
  height: 80px;
  background: #f5f5f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
}

.product-info {
  padding: 12px;
}

.product-name {
  font-size: 13px;
  color: #333;
  margin: 0 0 4px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.product-desc {
  font-size: 11px;
  color: #999;
  margin: 0 0 8px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 4px;
}

.current-price {
  font-size: 16px;
  font-weight: bold;
  color: #ff6600;
}

.original-price {
  font-size: 11px;
  color: #999;
  text-decoration: line-through;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: #999;
}

.article-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.article-card {
  display: flex;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.article-card:hover {
  background-color: #f9f9f9;
}

.article-content {
  flex: 1;
}

.article-title {
  font-size: 14px;
  color: #333;
  margin: 0 0 6px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-summary {
  font-size: 12px;
  color: #999;
  margin: 0 0 8px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: #ccc;
}

.article-cover {
  width: 100px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.article-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
