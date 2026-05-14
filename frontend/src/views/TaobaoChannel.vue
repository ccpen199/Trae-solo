<template>
  <div class="taobao-channel-page">
    <div class="hero-section">
      <div class="container">
        <h1 class="hero-title">淘宝精选频道</h1>
        <p class="hero-subtitle">发现优质好货，购买更放心</p>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品名称、品牌..."
          class="hero-search"
          clearable
          @keyup.enter="loadProducts"
        >
          <template #append>
            <el-button :icon="Search" @click="loadProducts" />
          </template>
        </el-input>
      </div>
    </div>
    
    <div class="container">
      <div class="category-bar">
        <el-button
          v-for="cat in categories"
          :key="cat"
          :type="selectedCategory === cat ? 'primary' : ''"
          size="large"
          @click="selectCategory(cat)"
        >
          {{ cat || '全部' }}
        </el-button>
      </div>
      
      <div v-if="loading" class="loading-wrapper">
        <el-skeleton :rows="3" animated />
      </div>
      
      <div v-else-if="products.length === 0" class="empty-wrapper">
        <el-empty description="暂无商品数据" />
      </div>
      
      <div v-else class="product-grid">
        <div
          v-for="product in products"
          :key="product.id"
          class="product-card"
          @click="goToProduct(product.id)"
        >
          <div class="product-image">
            <el-image
              :src="product.cover_image || 'https://fpoimg.com/300x300?text=Product'"
              fit="cover"
            />
            <div v-if="product.related_bar_count" class="bar-badge">
              <el-icon><Collection /></el-icon>
              {{ product.related_bar_count }}
            </div>
          </div>
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-brand">{{ product.brand || '精选品牌' }}</p>
            <div class="product-footer">
              <span class="product-price">¥{{ product.price || '0.00' }}</span>
              <el-button type="primary" size="small" link>去购买</el-button>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="pagination.total > pagination.pageSize" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          layout="prev, pager, next"
          @current-change="loadProducts"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Collection } from '@element-plus/icons-vue'
import api from '@/utils/api'

const router = useRouter()

const loading = ref(false)
const searchKeyword = ref('')
const selectedCategory = ref('')
const categories = ref([])
const products = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0
})

async function loadCategories() {
  try {
    const res = await api.get('/product-bars/categories')
    if (res.success) {
      categories.value = ['全部', ...res.data]
    }
  } catch (e) {
    console.error('加载分类失败:', e)
  }
}

async function loadProducts() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    if (selectedCategory.value && selectedCategory.value !== '全部') {
      params.category = selectedCategory.value
    }
    
    const res = await api.get('/products', { params })
    if (res.success) {
      products.value = res.data.list || []
      pagination.total = res.data.pagination?.total || 0
    }
  } catch (e) {
    console.error('加载商品失败:', e)
  } finally {
    loading.value = false
  }
}

function selectCategory(cat) {
  selectedCategory.value = cat === '全部' ? '' : cat
  pagination.page = 1
  loadProducts()
}

function goToProduct(productId) {
  router.push(`/products/${productId}`)
}

onMounted(() => {
  loadCategories()
  loadProducts()
})
</script>

<style scoped>
.taobao-channel-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.hero-section {
  background: linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%);
  padding: 60px 0;
  text-align: center;
}

.hero-title {
  font-size: 36px;
  color: #fff;
  margin: 0 0 12px 0;
}

.hero-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 30px 0;
}

.hero-search {
  max-width: 500px;
}

.category-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 24px 0;
  background: #fff;
  border-radius: 8px;
  margin-top: 20px;
  padding: 20px;
}

.loading-wrapper,
.empty-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 40px 20px;
  margin-top: 20px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.product-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.product-image {
  position: relative;
  width: 100%;
  height: 200px;
  background: #f5f7fa;
}

.bar-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(64, 158, 255, 0.9);
  color: #fff;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.product-info {
  padding: 16px;
}

.product-name {
  font-size: 16px;
  color: #303133;
  margin: 0 0 8px 0;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-brand {
  font-size: 13px;
  color: #909399;
  margin: 0 0 12px 0;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 20px;
  color: #f56c6c;
  font-weight: bold;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding: 30px 0;
}
</style>
