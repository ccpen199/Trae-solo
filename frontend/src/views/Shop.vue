<template>
  <div class="shop-page">
    <div class="filter-bar card">
      <el-select v-model="categoryId" placeholder="全部分类" clearable style="width: 150px">
        <el-option label="全部商品" :value="null" />
        <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
      </el-select>
      <el-select v-model="sortBy" placeholder="排序方式" style="width: 120px">
        <el-option label="最新" value="new" />
        <el-option label="销量" value="sales" />
        <el-option label="价格从低到高" value="price_asc" />
        <el-option label="价格从高到低" value="price_desc" />
      </el-select>
      <div class="price-filter">
        <el-input-number v-model="minPrice" :min="0" placeholder="最低价" size="small" style="width: 100px" />
        <span class="separator">-</span>
        <el-input-number v-model="maxPrice" :min="0" placeholder="最高价" size="small" style="width: 100px" />
      </div>
      <el-button type="primary" @click="fetchProducts(true)">筛选</el-button>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="6" animated />
    </div>

    <div v-else-if="products.length === 0" class="empty-state">
      <div class="empty-icon">🛒</div>
      <div class="empty-text">暂无商品</div>
    </div>

    <div v-else class="products-grid">
      <ProductCard v-for="product in products" :key="product.id" :product="product" />
    </div>

    <div v-if="hasMore && !loading" class="load-more">
      <el-button type="primary" @click="loadMore" :loading="loadingMore">
        加载更多
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import ProductCard from '@/components/ProductCard.vue'

const loading = ref(false)
const loadingMore = ref(false)
const page = ref(1)
const pageSize = ref(20)
const hasMore = ref(true)
const products = ref([])
const categories = ref([])
const categoryId = ref(null)
const sortBy = ref('new')
const minPrice = ref(null)
const maxPrice = ref(null)

const fetchCategories = async () => {
  try {
    const res = await request.get('/categories')
    categories.value = res.data || []
  } catch (error) {
    console.error('获取分类失败:', error)
  }
}

const fetchProducts = async (reset = false) => {
  if (reset) {
    loading.value = true
    page.value = 1
    hasMore.value = true
  } else {
    loadingMore.value = true
  }

  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      sort: sortBy.value
    }
    if (categoryId.value) params.categoryId = categoryId.value
    if (minPrice.value) params.minPrice = minPrice.value
    if (maxPrice.value) params.maxPrice = maxPrice.value

    const res = await request.get('/products', { params })
    const newProducts = res.data.list || []
    
    if (reset) {
      products.value = newProducts
    } else {
      products.value = [...products.value, ...newProducts]
    }
    
    hasMore.value = newProducts.length >= pageSize.value
  } catch (error) {
    console.error('获取商品失败:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = () => {
  page.value++
  fetchProducts(false)
}

onMounted(() => {
  fetchCategories()
  fetchProducts(true)
})
</script>

<style lang="scss" scoped>
.shop-page {
  .filter-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    margin-bottom: 20px;

    .price-filter {
      display: flex;
      align-items: center;
      gap: 8px;

      .separator {
        color: #999;
      }
    }
  }

  .products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }

  .load-more {
    text-align: center;
    padding: 30px 0;
  }
}
</style>
