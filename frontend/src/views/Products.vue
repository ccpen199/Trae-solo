<template>
  <div class="products-page page-container">
    <div class="header">
      <div class="search-bar">
        <el-input v-model="searchKeyword" placeholder="搜索商品..." class="search-input" />
      </div>
      <div class="filter-bar">
        <div class="filter-item" :class="{ active: sortBy === 'sales' }" @click="sortBy = 'sales'">销量</div>
        <div class="filter-item" :class="{ active: sortBy === 'price' }" @click="sortBy = 'price'">价格</div>
        <div class="filter-item" @click="showFilter = true">筛选</div>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <el-spinner />
    </div>

    <div v-else class="product-list">
      <div 
        v-for="product in products" 
        :key="product.id" 
        class="product-card"
        @click="goDetail(product.id)"
      >
        <div class="product-image">
          <img :src="getFirstImage(product.images)" :alt="product.title" />
        </div>
        <div class="product-info">
          <h4 class="product-title">{{ product.title }}</h4>
          <p class="product-style">{{ product.style }}</p>
          <div class="product-price">
            <span class="current-price">¥{{ product.price }}</span>
            <span class="original-price">¥{{ product.original_price }}</span>
          </div>
          <div class="product-sales">销量 {{ product.sales }}</div>
        </div>
      </div>
    </div>

    <div v-if="!loading && products.length === 0" class="empty">
      <p>暂无商品</p>
    </div>

    <el-pagination
      v-if="total > limit"
      :current-page="page"
      :page-size="limit"
      :total="total"
      @current-change="handlePageChange"
      class="pagination"
    />

    <BottomNav />

    <el-dialog title="筛选条件" v-model="showFilter">
      <el-form :model="filterForm">
        <el-form-item label="风格">
          <el-select v-model="filterForm.style" placeholder="请选择风格">
            <el-option label="现代简约" value="现代简约" />
            <el-option label="北欧" value="北欧" />
            <el-option label="极简" value="极简" />
            <el-option label="中式" value="中式" />
            <el-option label="轻奢" value="轻奢" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格区间">
          <div class="price-range">
            <el-input v-model="filterForm.minPrice" placeholder="最低价" type="number" />
            <span class="separator">-</span>
            <el-input v-model="filterForm.maxPrice" placeholder="最高价" type="number" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFilter = false">取消</el-button>
        <el-button type="primary" @click="applyFilter">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BottomNav from '@/components/BottomNav.vue'
import { productAPI } from '@/api'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const products = ref([])
const page = ref(1)
const limit = ref(10)
const total = ref(0)
const sortBy = ref('sales')
const showFilter = ref(false)
const searchKeyword = ref('')

const filterForm = reactive({
  style: '',
  minPrice: '',
  maxPrice: ''
})

onMounted(() => {
  loadProducts()
  
  if (route.query.categoryId) {
    filterForm.categoryId = route.query.categoryId
  }
})

watch([sortBy, page], () => {
  loadProducts()
})

async function loadProducts() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      limit: limit.value
    }
    if (sortBy.value === 'price') {
      params.sort = 'price'
    }
    if (filterForm.categoryId) {
      params.categoryId = filterForm.categoryId
    }
    if (filterForm.style) {
      params.style = filterForm.style
    }
    if (filterForm.minPrice) {
      params.minPrice = filterForm.minPrice
    }
    if (filterForm.maxPrice) {
      params.maxPrice = filterForm.maxPrice
    }
    
    const data = await productAPI.list(params)
    products.value = data.products || []
    total.value = data.total || 0
  } catch {
    products.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handlePageChange(val) {
  page.value = val
}

function applyFilter() {
  showFilter.value = false
  page.value = 1
  loadProducts()
}

function getFirstImage(imagesStr) {
  try {
    const images = JSON.parse(imagesStr)
    return images[0] || '/default-image.png'
  } catch {
    return '/default-image.png'
  }
}

function goDetail(id) {
  router.push(`/product/${id}`)
}
</script>

<style scoped>
.header {
  position: sticky;
  top: 0;
  background: white;
  z-index: 99;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.search-bar {
  padding: 12px;
}

.search-input {
  border-radius: 25px;
  background: #f5f5f5;
  border: none;
}

.filter-bar {
  display: flex;
  padding: 0 12px 12px;
  gap: 20px;
}

.filter-item {
  font-size: 14px;
  color: #666;
}

.filter-item.active {
  color: #2563eb;
  font-weight: 500;
}

.product-list {
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.product-image {
  height: 160px;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 10px;
}

.product-title {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-style {
  font-size: 11px;
  color: #999;
  margin: 0 0 6px 0;
}

.product-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.current-price {
  font-size: 16px;
  font-weight: 700;
  color: #ef4444;
}

.original-price {
  font-size: 11px;
  color: #999;
  text-decoration: line-through;
}

.product-sales {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.loading, .empty {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.pagination {
  padding: 16px;
}

.price-range {
  display: flex;
  align-items: center;
  gap: 12px;
}

.separator {
  color: #999;
}
</style>