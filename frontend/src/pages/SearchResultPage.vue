<template>
  <div class="search-result-container">
    <van-nav-bar :title="keyword || '搜索结果'" left-text="返回" @click-left="goBack" />
    
    <div class="filter-bar">
      <van-button 
        v-for="sort in sortOptions" 
        :key="sort.value"
        type="default"
        :class="{ active: currentSort === sort.value }"
        @click="setSort(sort.value)"
      >{{ sort.label }}</van-button>
    </div>
    
    <van-popup v-model="showFilter" position="bottom" :style="{ height: '60%' }">
      <view class="filter-content">
        <view class="filter-section">
          <text class="filter-title">价格区间</text>
          <view class="price-input">
            <van-field v-model="minPrice" placeholder="最低价" type="digit" />
            <text class="price-separator">-</text>
            <van-field v-model="maxPrice" placeholder="最高价" type="digit" />
          </view>
        </view>
        
        <view class="filter-section">
          <text class="filter-title">商品标签</text>
          <view class="filter-tags">
            <van-checkbox 
              v-model="filters.isNew" 
              shape="square"
            >新品</van-checkbox>
            <van-checkbox 
              v-model="filters.isHot" 
              shape="square"
            >爆款</van-checkbox>
          </view>
        </view>
        
        <view class="filter-actions">
          <van-button type="default" @click="resetFilter">重置</van-button>
          <van-button type="primary" @click="applyFilter">确定</van-button>
        </view>
      </view>
    </van-popup>
    
    <div class="result-header">
      <span class="result-count">共 {{ total }} 件商品</span>
      <van-button type="default" size="small" @click="showFilter = true">
        <van-icon name="filter" /> 筛选
      </van-button>
    </div>
    
    <div class="product-list">
      <van-card 
        v-for="product in products" 
        :key="product.id" 
        :title="product.name"
        :desc="product.description"
        :price="product.price"
        :original-price="product.original_price"
        :thumb="product.image"
        @click="goProductDetail(product.id)"
      />
    </div>
    
    <van-loading v-if="loading" />
    <van-empty v-if="!loading && products.length === 0" description="暂无商品" />
    
    <van-tabbar v-model="activeTab" route>
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="search" to="/search">搜索</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart" to="/cart" :badge="cartCount">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NavBar, Button, Icon, Popup, Field, Checkbox, Loading, Empty, Tabbar, TabbarItem, Card } from 'vant'
import { productApi } from '../services/api'
import store from '../store'

const router = useRouter()
const route = useRoute()
const keyword = ref('')
const products = ref([])
const total = ref(0)
const loading = ref(false)
const showFilter = ref(false)
const activeTab = ref(1)
const currentSort = ref('sales')
const minPrice = ref('')
const maxPrice = ref('')
const cartCount = ref(store.state.cart.count)

const filters = ref({
  isNew: false,
  isHot: false
})

const sortOptions = [
  { label: '综合', value: 'sales' },
  { label: '价格↑', value: 'price_asc' },
  { label: '价格↓', value: 'price_desc' },
  { label: '最新', value: 'newest' }
]

const goBack = () => {
  router.back()
}

const goProductDetail = (id) => {
  router.push(`/product/${id}`)
}

const setSort = (sort) => {
  currentSort.value = sort
  loadProducts()
}

const resetFilter = () => {
  minPrice.value = ''
  maxPrice.value = ''
  filters.value = { isNew: false, isHot: false }
}

const applyFilter = () => {
  showFilter.value = false
  loadProducts()
}

const loadProducts = () => {
  loading.value = true
  
  const params = {
    keyword: keyword.value,
    sort: currentSort.value,
    minPrice: minPrice.value || undefined,
    maxPrice: maxPrice.value || undefined,
    isNew: filters.value.isNew ? '1' : undefined,
    isHot: filters.value.isHot ? '1' : undefined,
    categoryId: route.query.categoryId || undefined
  }
  
  productApi.getProducts(params).then(res => {
    if (res.code === 200) {
      products.value = res.data.list
      total.value = res.data.pagination.total
    }
    loading.value = false
  }).catch(() => {
    loading.value = false
  })
}

onMounted(() => {
  keyword.value = route.query.keyword || ''
  loadProducts()
})

watch(() => route.query, () => {
  keyword.value = route.query.keyword || ''
  loadProducts()
}, { deep: true })
</script>

<style scoped>
.search-result-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.filter-bar {
  display: flex;
  background: white;
  padding: 10px;
  gap: 10px;
}

.filter-bar .van-button.active {
  background: #ff6b6b;
  color: white;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: white;
  margin-top: 10px;
}

.result-count {
  font-size: 14px;
  color: #666;
}

.product-list {
  padding: 10px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.filter-content {
  padding: 20px;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  display: block;
}

.price-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

.price-separator {
  font-size: 16px;
  color: #999;
}

.filter-tags {
  display: flex;
  gap: 20px;
}

.filter-actions {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.filter-actions .van-button {
  flex: 1;
}
</style>