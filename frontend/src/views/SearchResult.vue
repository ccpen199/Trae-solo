<template>
  <div class="search-result-container">
    <div class="header">
      <div class="back-btn" @click="$router.back()">
        <span>←</span>
      </div>
      <div class="search-input-wrapper">
        <input 
          type="text" 
          v-model="keyword" 
          class="search-input"
          placeholder="搜索商家或商品"
          @keyup.enter="handleSearch"
        />
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-scroll">
        <div 
          v-for="filter in filters" 
          :key="filter.key" 
          class="filter-item"
          :class="{ active: selectedFilter === filter.key }"
          @click="selectedFilter = filter.key"
        >
          {{ filter.label }}
        </div>
      </div>
      <div class="filter-more" @click="showFilterPanel = !showFilterPanel">
        <span>筛选</span>
        <span>▼</span>
      </div>
    </div>

    <div v-if="showFilterPanel" class="filter-panel">
      <div class="filter-section">
        <h4 class="filter-title">排序方式</h4>
        <div class="filter-options">
          <label 
            v-for="option in sortOptions" 
            :key="option.value"
            class="filter-option"
          >
            <input 
              type="radio" 
              :value="option.value" 
              v-model="sortBy"
            />
            <span>{{ option.label }}</span>
          </label>
        </div>
      </div>
      <div class="filter-section">
        <h4 class="filter-title">配送服务</h4>
        <div class="filter-options">
          <label class="filter-option">
            <input type="checkbox" v-model="filtersData.fengniao" />
            <span>蜂鸟专送</span>
          </label>
        </div>
      </div>
      <div class="filter-section">
        <h4 class="filter-title">优惠活动</h4>
        <div class="filter-options">
          <label class="filter-option">
            <input type="checkbox" v-model="filtersData.discount" />
            <span>优惠活动</span>
          </label>
        </div>
      </div>
    </div>

    <div class="result-count">
      共找到 {{ total }} 家商家
    </div>

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

    <div v-if="loading" class="loading">
      <span class="loading-icon">⏳</span>
      <span>加载中...</span>
    </div>

    <div v-if="merchants.length === 0 && !loading" class="empty">
      <span class="empty-icon">🔍</span>
      <p>没有找到相关商家</p>
      <button class="btn btn-secondary" @click="$router.back()">返回</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { merchantAPI } from '@/api'

const router = useRouter()
const route = useRoute()

const keyword = ref('')
const selectedFilter = ref('综合')
const showFilterPanel = ref(false)
const sortBy = ref('default')
const filtersData = ref({
  fengniao: false,
  discount: false
})
const merchants = ref([])
const total = ref(0)
const loading = ref(true)

const filters = [
  { key: '综合', label: '综合排序' },
  { key: '销量', label: '销量最高' },
  { key: '距离', label: '距离最近' },
  { key: '好评', label: '好评优先' },
  { key: '起送价', label: '起送价最低' },
  { key: '配送', label: '配送最快' }
]

const sortOptions = [
  { value: 'default', label: '综合排序' },
  { value: 'sales', label: '销量最高' },
  { value: 'rating', label: '好评优先' },
  { value: 'delivery_time', label: '配送最快' },
  { value: 'min_order', label: '起送价最低' },
  { value: 'delivery_fee', label: '配送费最低' }
]

onMounted(() => {
  keyword.value = route.query.keyword || ''
  loadMerchants()
})

async function loadMerchants() {
  loading.value = true
  try {
    const params = {
      keyword: keyword.value || undefined,
      category_id: route.query.category_id || undefined,
      sort: sortBy.value,
      page: 1,
      pageSize: 20
    }
    
    const result = await merchantAPI.getMerchants(params)
    if (result.success) {
      merchants.value = result.data
      total.value = result.total
    }
  } catch (err) {
    console.error('加载商家失败:', err)
  }
  loading.value = false
}

function handleSearch() {
  router.push({ path: '/search-result', query: { keyword: keyword.value } })
}

function goMerchant(id) {
  router.push(`/merchant/${id}`)
}
</script>

<style scoped>
.search-result-container {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
}

.back-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #333;
}

.search-input-wrapper {
  flex: 1;
}

.search-input {
  width: 100%;
  height: 40px;
  padding: 0 16px;
  background: #f5f5f5;
  border: none;
  border-radius: 20px;
  font-size: 14px;
}

.filter-bar {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

.filter-scroll {
  flex: 1;
  display: flex;
  gap: 20px;
  overflow-x: auto;
}

.filter-item {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.filter-item.active {
  color: #ff6b35;
}

.filter-more {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
  margin-left: 12px;
  padding-left: 12px;
  border-left: 1px solid #e0e0e0;
}

.filter-panel {
  background: #fff;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.filter-section {
  margin-bottom: 20px;
}

.filter-section:last-child {
  margin-bottom: 0;
}

.filter-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.result-count {
  padding: 12px 16px;
  font-size: 12px;
  color: #999;
}

.merchants-wrapper {
  padding: 0 16px;
}

.merchant-item {
  display: flex;
  gap: 12px;
  background: #fff;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 12px;
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

.loading, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-icon, .empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.empty p {
  font-size: 14px;
  color: #999;
  margin: 0 0 20px 0;
}
</style>