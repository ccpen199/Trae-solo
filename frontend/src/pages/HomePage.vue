<template>
  <div class="home-container">
    <van-nav-bar 
      title="盒马鲜生" 
      :left-text="currentAddress?.name || '选择门店'"
      @click-left="goAddress"
    >
      <template #right>
        <van-icon name="search" @click="goSearch" />
        <van-icon name="scan" @click="goScan" />
      </template>
    </van-nav-bar>
    
    <div class="main-content">
      <van-swipe :autoplay="3000" :loop="true" indicator-color="rgba(255,255,255,0.5)" indicator-active-color="white">
        <van-swipe-item v-for="ad in ads" :key="ad.id" @click="goAdDetail(ad.id)">
          <img :src="ad.image" :alt="ad.title" class="banner-img" />
        </van-swipe-item>
      </van-swipe>
      
      <div class="categories">
        <div 
          v-for="cat in categories" 
          :key="cat.id" 
          class="category-item"
          @click="goCategory(cat.id)"
        >
          <span class="category-icon">{{ cat.icon }}</span>
          <span class="category-name">{{ cat.name }}</span>
        </div>
      </div>
      
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">🔥 爆款热卖</h2>
          <a href="#" class="section-more" @click="goHotProducts">更多 ></a>
        </div>
        <div class="product-list">
          <van-card 
            v-for="product in hotProducts" 
            :key="product.id" 
            :title="product.name"
            :desc="product.description"
            :price="product.price"
            :original-price="product.original_price"
            :thumb="product.image"
            @click="goProductDetail(product.id)"
          />
        </div>
      </div>
      
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">✨ 新品上市</h2>
          <a href="#" class="section-more" @click="goNewProducts">更多 ></a>
        </div>
        <div class="product-list">
          <van-card 
            v-for="product in newProducts" 
            :key="product.id" 
            :title="product.name"
            :desc="product.description"
            :price="product.price"
            :original-price="product.original_price"
            :thumb="product.image"
            @click="goProductDetail(product.id)"
          />
        </div>
      </div>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Icon, Swipe, SwipeItem, Tabbar, TabbarItem, Card } from 'vant'
import { productApi, adApi, cartApi } from '../services/api'
import store from '../store'

const router = useRouter()
const activeTab = ref(0)
const categories = ref([])
const hotProducts = ref([])
const newProducts = ref([])
const ads = ref([])
const cartCount = ref(0)
const currentAddress = ref(store.state.currentAddress)

const goSearch = () => {
  router.push('/search')
}

const goScan = () => {
  router.push('/scan')
}

const goAddress = () => {
  router.push('/address')
}

const goCategory = (id) => {
  router.push({ path: '/search-result', query: { categoryId: id } })
}

const goProductDetail = (id) => {
  router.push(`/product/${id}`)
}

const goHotProducts = () => {
  router.push({ path: '/search-result', query: { isHot: 1 } })
}

const goNewProducts = () => {
  router.push({ path: '/search-result', query: { isNew: 1 } })
}

const goAdDetail = (id) => {
  router.push(`/ad-detail/${id}`)
}

const loadData = () => {
  productApi.getCategories().then(res => {
    if (res.code === 200) {
      categories.value = res.data
    }
  })
  
  productApi.getHotProducts().then(res => {
    if (res.code === 200) {
      hotProducts.value = res.data
    }
  })
  
  productApi.getNewProducts().then(res => {
    if (res.code === 200) {
      newProducts.value = res.data
    }
  })
  
  adApi.getAds().then(res => {
    if (res.code === 200) {
      ads.value = res.data
    }
  })
  
  if (store.state.user.token) {
    cartApi.getCart().then(res => {
      if (res.code === 200) {
        cartCount.value = res.data.totalCount
        store.mutations.setCartCount(res.data.totalCount)
      }
    })
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.main-content {
  padding: 10px;
}

.banner-img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 8px;
}

.categories {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  padding: 15px 0;
  background: white;
  margin-top: 10px;
  border-radius: 8px;
  padding: 15px;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.category-icon {
  font-size: 36px;
  margin-bottom: 5px;
}

.category-name {
  font-size: 12px;
  color: #666;
}

.section {
  background: white;
  margin-top: 10px;
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

.section-more {
  font-size: 14px;
  color: #999;
}

.product-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
</style>