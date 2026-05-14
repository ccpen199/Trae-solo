<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left" @click="goBack">‹</div>
      <div class="search-bar">
        <input type="text" placeholder="搜索商品" v-model="keyword" @keyup.enter="handleSearch" />
      </div>
      <div class="header-right"></div>
    </div>

    <div class="content">
      <div class="category-sidebar">
        <div 
          v-for="cat in categories" 
          :key="cat.id"
          class="sidebar-item"
          :class="{ active: activeCategory === cat.id }"
          @click="handleCategoryClick(cat.id)"
        >
          {{ cat.icon }} {{ cat.name }}
        </div>
      </div>

      <div class="category-content">
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
        <div v-else class="product-grid">
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

    <TabBar />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productAPI } from '../api'
import TabBar from '../components/TabBar.vue'

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const categories = ref([])
const products = ref([])
const activeCategory = ref(parseInt(route.params.id) || null)
const loading = ref(true)
const error = ref('')

async function loadCategories() {
  try {
    const res = await productAPI.getCategories()
    if (res.success) {
      categories.value = res.data
      if (!activeCategory.value && categories.value.length > 0) {
        activeCategory.value = categories.value[0].id
      }
    }
  } catch (err) {
    console.error('加载分类失败:', err)
  }
}

async function loadProducts() {
  loading.value = true
  error.value = ''
  
  try {
    const params = activeCategory.value ? { category_id: activeCategory.value } : {}
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

function goBack() {
  router.back()
}

function handleCategoryClick(id) {
  activeCategory.value = id
}

function goToProduct(id) {
  router.push(`/product/${id}`)
}

watch(activeCategory, () => {
  if (activeCategory.value) {
    loadProducts()
  }
})

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.content {
  display: flex;
  padding-top: 54px;
  padding-bottom: 60px;
  height: calc(100vh - 114px);
}

.category-sidebar {
  width: 100px;
  background: #f5f5f5;
  overflow-y: auto;
}

.sidebar-item {
  padding: 15px 10px;
  text-align: center;
  font-size: 13px;
  color: #333;
  border-left: 3px solid transparent;
}

.sidebar-item.active {
  background: #fff;
  border-left-color: var(--primary-color);
  color: var(--primary-color);
  font-weight: bold;
}

.category-content {
  flex: 1;
  overflow-y: auto;
  background: #fff;
}

.product-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
}

.product-card {
  width: calc(50% - 5px);
  margin-bottom: 10px;
}

.product-card:nth-child(odd) {
  margin-right: 10px;
}

.product-image {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}

.product-info {
  padding: 8px;
}

.product-name {
  font-size: 12px;
  color: #333;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 5px;
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 5px;
  margin-bottom: 3px;
}

.price {
  font-size: 14px;
  font-weight: bold;
  color: var(--primary-color);
}

.product-sales {
  font-size: 11px;
  color: var(--gray-color);
}
</style>