<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left" @click="handleScan">🔍</div>
      <div class="search-bar">
        <input type="text" placeholder="搜索商品" v-model="keyword" @keyup.enter="handleSearch" />
      </div>
      <div class="header-right" @click="goToProfile">👤</div>
    </div>

    <div class="content">
      <div class="banner">
        <img src="https://neeko-copilot.bytedance.net/api/text_to_image?prompt=ecommerce%20banner%20summer%20sale%20promotion%20colorful&image_size=landscape_16_9" alt="Banner" />
      </div>

      <div class="quick-entries">
        <div class="entry-item" v-for="entry in quickEntries" :key="entry.name" @click="handleQuickEntry(entry)">
          <span class="entry-icon">{{ entry.icon }}</span>
          <span class="entry-name">{{ entry.name }}</span>
        </div>
      </div>

      <div class="category-scroll">
        <div 
          class="category-item" 
          v-for="cat in categories" 
          :key="cat.id"
          :class="{ active: activeCategory === cat.id }"
          @click="handleCategoryClick(cat.id)"
        >
          {{ cat.icon }} {{ cat.name }}
        </div>
      </div>

      <div class="section-title">
        <span class="title">热门商品</span>
        <span class="more">更多 ›</span>
      </div>

      <div v-if="loading" class="loading"></div>
      <div v-else-if="error" class="error-state">
        <div class="icon">❌</div>
        <p>{{ error }}</p>
        <button @click="loadProducts">重试</button>
      </div>
      <div v-else-if="products.length === 0" class="empty-state">
        <div class="icon">📦</div>
        <p>暂无商品</p>
      </div>
      <div v-else class="product-list">
        <div 
          class="product-card" 
          v-for="product in products" 
          :key="product.id"
          @click="goToProduct(product.id)"
        >
          <img :src="product.images?.[0] || defaultImage" alt="Product" class="product-image" @error="handleImageError($event)" />
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

    <TabBar />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { productAPI } from '../api'
import TabBar from '../components/TabBar.vue'

const router = useRouter()

const keyword = ref('')
const categories = ref([])
const products = ref([])
const activeCategory = ref(null)
const loading = ref(true)
const error = ref('')
const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWKoOiAhueZu+eUqDwvdGV4dD48L3N2Zz4='

const quickEntries = [
  { name: '限时秒杀', icon: '⚡', action: 'seckill' },
  { name: '品牌特卖', icon: '🏷️', action: 'brand' },
  { name: '新品首发', icon: '✨', action: 'new' },
  { name: '会员中心', icon: '🎫', action: 'vip' },
  { name: '优惠券', icon: '🎁', action: 'coupon' },
  { name: '充值中心', icon: '💰', action: 'recharge' },
  { name: '积分商城', icon: '⭐', action: 'points' },
  { name: '帮助中心', icon: '❓', action: 'help' }
]

async function loadCategories() {
  try {
    const res = await productAPI.getCategories()
    if (res.success) {
      categories.value = res.data
    }
  } catch (err) {
    console.error('加载分类失败:', err)
  }
}

async function loadProducts(category_id = null) {
  loading.value = true
  error.value = ''
  
  try {
    const params = category_id ? { category_id } : {}
    const res = await productAPI.getProducts(params)
    if (res.success) {
      products.value = res.data
    }
  } catch (err) {
    error.value = err.message || '加载商品失败'
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  if (keyword.value.trim()) {
    router.push(`/search?keyword=${encodeURIComponent(keyword.value)}`)
  }
}

function handleScan() {
  const event = new CustomEvent('showToast', { detail: '扫描功能开发中' })
  window.dispatchEvent(event)
}

function goToProfile() {
  router.push('/profile')
}

function handleCategoryClick(id) {
  activeCategory.value = id
  loadProducts(id)
}

function handleQuickEntry(entry) {
  const routeMap = {
    seckill: '/promotion?type=seckill',
    brand: '/promotion?type=brand',
    new: '/promotion?type=new',
    vip: '/profile',
    coupon: '/coupon',
    recharge: '/recharge',
    points: '/points',
    help: '/help'
  }
  
  const path = routeMap[entry.action]
  if (path) {
    router.push(path)
  } else {
    const event = new CustomEvent('showToast', { detail: '功能开发中' })
    window.dispatchEvent(event)
  }
}

function handleImageError(event) {
  event.target.src = defaultImage
}

function goToProduct(id) {
  router.push(`/product/${id}`)
}

onMounted(() => {
  loadCategories()
  loadProducts()
})
</script>

<style scoped>
.content {
  padding-top: 54px;
}

.banner {
  padding: 10px;
}

.banner img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}

.quick-entries {
  display: flex;
  flex-wrap: wrap;
  background: #fff;
  padding: 10px;
}

.entry-item {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
}

.entry-icon {
  font-size: 28px;
  margin-bottom: 5px;
}

.entry-name {
  font-size: 12px;
  color: #333;
}

.category-scroll {
  display: flex;
  overflow-x: auto;
  background: #fff;
  padding: 10px 0;
  white-space: nowrap;
  border-top: 1px solid #eee;
}

.category-scroll::-webkit-scrollbar {
  display: none;
}

.category-item {
  padding: 8px 16px;
  margin: 0 5px;
  background: #f5f5f5;
  border-radius: 20px;
  font-size: 14px;
  flex-shrink: 0;
}

.category-item.active {
  background: var(--primary-color);
  color: #fff;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  font-size: 16px;
  font-weight: bold;
}

.more {
  font-size: 14px;
  color: var(--gray-color);
  font-weight: normal;
}

.product-list {
  display: flex;
  flex-wrap: wrap;
  padding: 0 10px;
}

.product-card {
  width: calc(50% - 5px);
  background: #fff;
  margin-bottom: 10px;
  border-radius: 8px;
  overflow: hidden;
}

.product-card:nth-child(odd) {
  margin-right: 10px;
}

.product-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.product-info {
  padding: 10px;
}

.product-name {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 8px;
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-bottom: 5px;
}

.price {
  font-size: 16px;
  font-weight: bold;
}

.product-sales {
  font-size: 12px;
  color: var(--gray-color);
}
</style>