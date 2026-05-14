<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left" @click="goBack">‹</div>
      <div class="search-bar">
        <input type="text" v-model="keyword" placeholder="搜索商品" @keyup.enter="handleSearch" />
      </div>
      <div class="header-right" @click="handleSearch">搜索</div>
    </div>

    <div class="content">
      <div v-if="!searched" class="search-history">
        <div class="history-header">
          <span>搜索历史</span>
          <span class="clear" @click="clearHistory">清空</span>
        </div>
        <div class="history-tags">
          <span 
            v-for="(tag, index) in searchHistory" 
            :key="index"
            class="history-tag"
            @click="search(tag)"
          >
            {{ tag }}
          </span>
        </div>

        <div class="hot-search">
          <div class="hot-header">热门搜索</div>
          <div class="hot-list">
            <div 
              v-for="(item, index) in hotKeywords" 
              :key="index"
              class="hot-item"
              @click="search(item)"
            >
              <span class="hot-rank" :class="{ top3: index < 3 }">{{ index + 1 }}</span>
              <span class="hot-text">{{ item }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div v-if="loading" class="loading"></div>
        <div v-else-if="error" class="error-state">
          <div class="icon">❌</div>
          <p>{{ error }}</p>
          <button @click="handleSearch">重试</button>
        </div>
        <div v-else-if="products.length === 0" class="empty-state">
          <div class="icon">🔍</div>
          <p>未找到相关商品</p>
          <button class="btn btn-primary" @click="goBack">返回</button>
        </div>
        <div v-else class="search-result">
          <div class="result-header">找到 {{ products.length }} 件商品</div>
          <div class="product-list">
            <div 
              v-for="product in products" 
              :key="product.id"
              class="product-card"
              @click="goToProduct(product.id)"
            >
              <img :src="product.images?.[0]" alt="Product" class="product-image" />
              <div class="product-info">
                <h3 class="product-name">{{ product.name }}</h3>
                <div class="product-price">
                  <span class="price">¥{{ product.price }}</span>
                  <span class="price-original">¥{{ product.original_price }}</span>
                </div>
                <div class="product-sales">已售 {{ product.sales }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productAPI } from '../api'

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const products = ref([])
const loading = ref(false)
const error = ref('')
const searched = ref(false)

const searchHistory = ref(['连衣裙', 'iPhone', 'T恤', '电视'])
const hotKeywords = ['夏季连衣裙', 'iPhone 15', '男士T恤', '智能电视', '进口车厘子', '雅诗兰黛']

function search(key) {
  keyword.value = key
  handleSearch()
}

async function handleSearch() {
  if (!keyword.value.trim()) return
  
  searched.value = true
  loading.value = true
  error.value = ''
  
  try {
    const res = await productAPI.search({ keyword: keyword.value.trim() })
    if (res.success) {
      products.value = res.data
    }
    
    const history = [...new Set([keyword.value.trim(), ...searchHistory.value])].slice(0, 10)
    searchHistory.value = history
  } catch (err) {
    error.value = err.message || '搜索失败'
  } finally {
    loading.value = false
  }
}

function clearHistory() {
  searchHistory.value = []
}

function goBack() {
  router.back()
}

function goToProduct(id) {
  router.push(`/product/${id}`)
}

onMounted(() => {
  const urlKeyword = route.query.keyword
  if (urlKeyword) {
    keyword.value = decodeURIComponent(urlKeyword)
    handleSearch()
  }
})
</script>

<style scoped>
.content {
  padding-top: 54px;
}

.search-history {
  padding: 15px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 14px;
  font-weight: bold;
}

.clear {
  font-size: 12px;
  color: var(--gray-color);
  font-weight: normal;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 25px;
}

.history-tag {
  padding: 8px 16px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 14px;
}

.hot-search {
  background: #fff;
  border-radius: 8px;
  padding: 15px;
}

.hot-header {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 15px;
}

.hot-list {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.hot-item {
  display: flex;
  align-items: center;
  width: calc(50% - 8px);
}

.hot-rank {
  width: 24px;
  height: 24px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--gray-color);
  margin-right: 10px;
}

.hot-rank.top3 {
  background: var(--primary-color);
  color: #fff;
}

.hot-text {
  font-size: 14px;
}

.search-result {
  padding: 15px;
}

.result-header {
  font-size: 14px;
  color: var(--gray-color);
  margin-bottom: 15px;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-card {
  display: flex;
  background: #fff;
  padding: 15px;
  border-radius: 8px;
}

.product-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 15px;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.product-name {
  font-size: 15px;
  color: #333;
  line-height: 1.5;
  height: 3em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 10px;
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 5px;
}

.price {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
}

.product-sales {
  font-size: 12px;
  color: var(--gray-color);
}
</style>