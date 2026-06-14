<template>
  <div class="products-page">
    <div class="page-header">
      <h2 class="page-title">生活服务</h2>
      <div class="header-actions">
        <el-button @click="resetFilters">
          <el-icon><Refresh /></el-icon>
          重置筛选
        </el-button>
        <el-button type="primary" @click="loadProducts">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>
    </div>
    
    <div class="search-bar">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input v-model="filters.keyword" placeholder="搜索商品名称" clearable @keyup.enter="loadProducts">
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.category_id" placeholder="商品分类" clearable style="width: 100%;">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select v-model="filters.merchant_id" placeholder="商户" clearable style="width: 100%;">
            <el-option v-for="m in merchants" :key="m.id" :label="m.name" :value="m.id" />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-input-number v-model="filters.min_price" :min="0" placeholder="最低价" controls-position="right" style="width: 100%;" />
        </el-col>
        <el-col :span="4">
          <el-input-number v-model="filters.max_price" :min="0" placeholder="最高价" controls-position="right" style="width: 100%;" />
        </el-col>
        <el-col :span="6">
          <el-radio-group v-model="filters.sort" @change="loadProducts">
            <el-radio-button value="">默认</el-radio-button>
            <el-radio-button value="sales">销量</el-radio-button>
            <el-radio-button value="price_asc">价格↑</el-radio-button>
            <el-radio-button value="price_desc">价格↓</el-radio-button>
            <el-radio-button value="rating">评分</el-radio-button>
          </el-radio-group>
        </el-col>
      </el-row>
    </div>
    
    <div class="products-grid" v-loading="loading">
      <el-row :gutter="20">
        <el-col v-for="product in products" :key="product.id" :span="6" class="product-col">
          <el-card class="product-card" shadow="hover" @click="goToDetail(product.id)">
            <div class="product-image">
              <el-icon size="64"><Goods /></el-icon>
              <el-tag v-if="product.is_low_stock" type="danger" class="stock-tag" effect="dark">
                库存紧张
              </el-tag>
              <el-tag v-if="product.is_expiring_soon" type="warning" class="expiry-tag" effect="dark">
                即将到期
              </el-tag>
            </div>
            <div class="product-info">
              <h4 class="product-name">{{ product.name }}</h4>
              <p class="product-desc">{{ product.description }}</p>
              <div class="product-meta">
                <span class="merchant">{{ product.merchant_name }}</span>
                <el-rate v-model="product.merchant_rating" disabled show-score text-color="#ff9900" size="small" />
              </div>
              <div class="product-footer">
                <div class="price">
                  <span class="current">¥{{ product.price.toFixed(2) }}</span>
                  <span v-if="product.original_price" class="original">¥{{ product.original_price.toFixed(2) }}</span>
                </div>
                <div class="sales">已售 {{ product.sales_count || 0 }}</div>
              </div>
              <div class="stock-info">
                库存：{{ product.stock }}件
                <el-tag v-if="product.stock <= product.stock_warning" type="warning" size="small">
                  预警值 {{ product.stock_warning }}
                </el-tag>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <el-empty v-if="!loading && products.length === 0" description="没有找到相关商品" />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProducts, getCategories, getMerchants } from '../api'

const router = useRouter()
const loading = ref(false)
const products = ref([])
const categories = ref([])
const merchants = ref([])

const filters = reactive({
  keyword: '',
  category_id: null,
  merchant_id: null,
  min_price: null,
  max_price: null,
  sort: ''
})

async function loadProducts() {
  loading.value = true
  try {
    const params = { ...filters }
    if (!params.min_price) delete params.min_price
    if (!params.max_price) delete params.max_price
    if (!params.category_id) delete params.category_id
    if (!params.merchant_id) delete params.merchant_id
    if (!params.keyword) delete params.keyword
    if (!params.sort) delete params.sort
    
    const res = await getProducts(params)
    products.value = res.data
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  const res = await getCategories()
  categories.value = res.data
}

async function loadMerchants() {
  const res = await getMerchants({ qualification_status: 'verified' })
  merchants.value = res.data
}

function resetFilters() {
  filters.keyword = ''
  filters.category_id = null
  filters.merchant_id = null
  filters.min_price = null
  filters.max_price = null
  filters.sort = ''
  loadProducts()
}

function goToDetail(id) {
  router.push(`/products/${id}`)
}

onMounted(() => {
  loadCategories()
  loadMerchants()
  loadProducts()
})
</script>

<style scoped>
.products-page {
  padding: 0;
}

.search-bar {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.products-grid {
  min-height: 400px;
}

.product-col {
  margin-bottom: 20px;
}

.product-card {
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-4px);
}

.product-image {
  height: 160px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-radius: 8px;
  margin-bottom: 15px;
  position: relative;
}

.stock-tag, .expiry-tag {
  position: absolute;
  top: 10px;
}

.stock-tag { right: 10px; }
.expiry-tag { right: 80px; }

.product-info {
  padding: 0 5px;
}

.product-name {
  font-size: 16px;
  margin: 0 0 8px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  font-size: 13px;
  color: #909399;
  margin: 0 0 10px;
  height: 36px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.merchant {
  font-size: 12px;
  color: #606266;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.price .current {
  font-size: 20px;
  font-weight: 600;
  color: #f56c6c;
}

.price .original {
  font-size: 13px;
  color: #909399;
  text-decoration: line-through;
  margin-left: 8px;
}

.sales {
  font-size: 12px;
  color: #909399;
}

.stock-info {
  font-size: 12px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
