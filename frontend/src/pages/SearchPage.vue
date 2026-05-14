<template>
  <div class="search-container">
    <van-nav-bar title="搜索">
      <template #right>
        <van-icon name="scan" @click="goScan" />
      </template>
    </van-nav-bar>
    
    <div class="search-content">
      <van-search 
        v-model="keyword" 
        placeholder="搜索商品" 
        show-action
        @search="onSearch"
        @action="onSearch"
      />
      
      <div class="search-history" v-if="history.length > 0">
        <div class="history-header">
          <span class="history-title">搜索历史</span>
          <van-icon name="delete-o" @click="clearHistory" />
        </div>
        <div class="history-tags">
          <span 
            v-for="(item, index) in history" 
            :key="index" 
            class="history-tag"
            @click="searchKeyword(item)"
          >{{ item }}</span>
        </div>
      </div>
      
      <div class="hot-words">
        <div class="hot-header">
          <span class="hot-title">🔥 实时热搜</span>
        </div>
        <div class="hot-tags">
          <span 
            v-for="(word, index) in hotWords" 
            :key="index" 
            class="hot-tag"
            :class="{ 'hot-tag-top': index < 3 }"
            @click="searchKeyword(word)"
          >{{ word }}</span>
        </div>
      </div>
      
      <div class="new-arrivals">
        <div class="new-header">
          <span class="new-title">🌱 新品时令</span>
        </div>
        <div class="new-list">
          <div 
            v-for="product in newProducts" 
            :key="product.id" 
            class="new-item"
            @click="goProductDetail(product.id)"
          >
            <img :src="product.image" :alt="product.name" class="new-img" />
            <div class="new-info">
              <span class="new-name">{{ product.name }}</span>
              <span class="new-price">¥{{ product.price }}</span>
            </div>
          </div>
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
import { NavBar, Icon, Search, Tabbar, TabbarItem } from 'vant'
import { productApi } from '../services/api'
import store from '../store'

const router = useRouter()
const keyword = ref('')
const activeTab = ref(1)
const history = ref(JSON.parse(localStorage.getItem('searchHistory') || '[]'))
const hotWords = ref([])
const newProducts = ref([])
const cartCount = ref(store.state.cart.count)

const goScan = () => {
  router.push('/scan')
}

const onSearch = () => {
  if (!keyword.value.trim()) return
  
  if (!history.value.includes(keyword.value)) {
    history.value.unshift(keyword.value)
    if (history.value.length > 10) {
      history.value.pop()
    }
    localStorage.setItem('searchHistory', JSON.stringify(history.value))
  }
  
  router.push({ path: '/search-result', query: { keyword: keyword.value } })
}

const searchKeyword = (word) => {
  keyword.value = word
  onSearch()
}

const clearHistory = () => {
  history.value = []
  localStorage.removeItem('searchHistory')
}

const goProductDetail = (id) => {
  router.push(`/product/${id}`)
}

onMounted(() => {
  productApi.getHotWords().then(res => {
    if (res.code === 200) {
      hotWords.value = res.data
    }
  })
  
  productApi.getNewProducts().then(res => {
    if (res.code === 200) {
      newProducts.value = res.data.slice(0, 6)
    }
  })
})
</script>

<style scoped>
.search-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.search-content {
  padding: 10px;
}

.search-history {
  background: white;
  margin-top: 10px;
  border-radius: 8px;
  padding: 15px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.history-title {
  font-size: 14px;
  color: #666;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.history-tag {
  padding: 6px 12px;
  background: #f5f5f5;
  border-radius: 15px;
  font-size: 13px;
  color: #666;
}

.hot-words {
  background: white;
  margin-top: 10px;
  border-radius: 8px;
  padding: 15px;
}

.hot-header {
  margin-bottom: 10px;
}

.hot-title {
  font-size: 14px;
  color: #666;
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.hot-tag {
  padding: 6px 12px;
  background: #fff0f0;
  border-radius: 15px;
  font-size: 13px;
  color: #ff4444;
}

.hot-tag-top {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: white;
}

.new-arrivals {
  background: white;
  margin-top: 10px;
  border-radius: 8px;
  padding: 15px;
}

.new-header {
  margin-bottom: 10px;
}

.new-title {
  font-size: 14px;
  color: #666;
}

.new-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.new-item {
  display: flex;
  flex-direction: column;
}

.new-img {
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: 6px;
}

.new-info {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
}

.new-name {
  font-size: 12px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.new-price {
  font-size: 12px;
  color: #ff4444;
}
</style>