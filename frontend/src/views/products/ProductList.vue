<template>
  <div class="product-list-page">
    <div class="container">
      <h1 class="page-title">商品</h1>
      
      <div class="filter-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索商品"
          style="width: 300px;"
          clearable
          @keyup.enter="loadProducts"
        >
          <template #append>
            <el-button :icon="Search" @click="loadProducts" />
          </template>
        </el-input>
      </div>
      
      <div v-if="loading" class="page-loading">
        <el-skeleton :rows="3" animated />
      </div>
      
      <div v-else-if="products.length === 0" class="page-empty">
        <el-empty description="暂无商品" />
      </div>
      
      <div v-else class="product-grid">
        <div
          v-for="product in products"
          :key="product.id"
          class="product-card"
          @click="goToProduct(product.id)"
        >
          <div class="product-cover">
            <img :src="product.cover_image || defaultCover" :alt="product.name" />
          </div>
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <p class="product-brand">{{ product.brand || '未知品牌' }}</p>
            <div class="product-footer">
              <span class="product-price" v-if="product.price">¥{{ product.price.toFixed(2) }}</span>
              <span class="bar-count" v-if="product.bar_ids">
                {{ product.bar_ids.split(',').length }} 个产品吧
              </span>
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
import { Search } from '@element-plus/icons-vue'
import api from '@/utils/api'

const router = useRouter()

const loading = ref(false)
const keyword = ref('')
const products = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 12,
  total: 0
})

const defaultCover = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f2f5" width="200" height="200"/%3E%3Ctext fill="%23909399" font-family="Arial" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E商品%3C/text%3E%3C/svg%3E'

async function loadProducts() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize
    }
    if (keyword.value) {
      params.keyword = keyword.value
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

function goToProduct(id) {
  router.push(`/products/${id}`)
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.product-list-page {
  padding: 30px 0;
}

.page-title {
  font-size: 28px;
  margin-bottom: 30px;
  color: #303133;
}

.filter-bar {
  margin-bottom: 24px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #ebeef5;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.product-cover {
  height: 180px;
  overflow: hidden;
  background: #f5f7fa;
}

.product-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 16px;
}

.product-name {
  font-size: 15px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 8px;
  height: 44px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-brand {
  font-size: 13px;
  color: #909399;
  margin-bottom: 12px;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 18px;
  color: #f56c6c;
  font-weight: 600;
}

.bar-count {
  font-size: 12px;
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 40px;
}
</style>
