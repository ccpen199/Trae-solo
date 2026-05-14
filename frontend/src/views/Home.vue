<template>
  <div class="home-page">
    <div class="hero-section">
      <div class="container">
        <h1>产品吧 - 商品内容社区</h1>
        <p class="subtitle">围绕产品的选购经验、使用心得、问题交流</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="goToBars">
            浏览产品吧
          </el-button>
          <el-button size="large" @click="goToProducts">
            发现商品
          </el-button>
        </div>
      </div>
    </div>

    <div class="container">
      <section class="section">
        <div class="section-header">
          <h2>热门产品吧</h2>
          <router-link to="/bars?sort=hot">
            <el-button text type="primary">查看更多</el-button>
          </router-link>
        </div>
        
        <div v-if="loading" class="page-loading">
          <el-skeleton :rows="3" animated />
        </div>
        
        <div v-else-if="hotBars.length === 0" class="page-empty">
          <el-empty description="暂无产品吧" />
        </div>
        
        <div v-else class="bar-grid">
          <div 
            v-for="bar in hotBars" 
            :key="bar.id" 
            class="bar-card"
            @click="goToBar(bar.id)"
          >
            <div class="bar-cover">
              <img :src="bar.cover_image || bar.product_cover" :alt="bar.name" />
            </div>
            <div class="bar-info">
              <h3 class="bar-name">{{ bar.name }}</h3>
              <p class="bar-desc">{{ bar.description || '暂无描述' }}</p>
              <div class="bar-stats">
                <span><el-icon><User /></el-icon> {{ bar.member_count || 0 }} 成员</span>
                <span><el-icon><Document /></el-icon> {{ bar.post_count || 0 }} 帖子</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="section-header">
          <h2>最新产品</h2>
          <router-link to="/products">
            <el-button text type="primary">查看更多</el-button>
          </router-link>
        </div>
        
        <div v-if="loadingProducts" class="page-loading">
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
              <img :src="product.cover_image" :alt="product.name" />
            </div>
            <div class="product-info">
              <h3 class="product-name">{{ product.name }}</h3>
              <p class="product-brand">{{ product.brand || '未知品牌' }}</p>
              <p class="product-price" v-if="product.price">¥{{ product.price.toFixed(2) }}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { User, Document } from '@element-plus/icons-vue'
import api from '@/utils/api'

const router = useRouter()

const loading = ref(true)
const loadingProducts = ref(true)
const hotBars = ref([])
const products = ref([])

async function loadHotBars() {
  loading.value = true
  try {
    const res = await api.get('/product-bars', {
      params: { sort: 'hot', pageSize: 6 }
    })
    if (res.success) {
      hotBars.value = res.data.list || []
    }
  } catch (e) {
    console.error('加载热门产品吧失败:', e)
  } finally {
    loading.value = false
  }
}

async function loadProducts() {
  loadingProducts.value = true
  try {
    const res = await api.get('/products', {
      params: { pageSize: 6 }
    })
    if (res.success) {
      products.value = res.data.list || []
    }
  } catch (e) {
    console.error('加载商品失败:', e)
  } finally {
    loadingProducts.value = false
  }
}

function goToBars() {
  router.push('/bars')
}

function goToProducts() {
  router.push('/products')
}

function goToBar(id) {
  router.push(`/bars/${id}`)
}

function goToProduct(id) {
  router.push(`/products/${id}`)
}

onMounted(() => {
  loadHotBars()
  loadProducts()
})
</script>

<style scoped>
.home-page {
  min-height: 100%;
}

.hero-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 80px 20px;
  text-align: center;
  color: #fff;
}

.hero-section h1 {
  font-size: 42px;
  margin-bottom: 16px;
}

.subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 32px;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.section {
  margin: 50px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-header h2 {
  font-size: 24px;
  color: #303133;
}

.bar-grid,
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.bar-card,
.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #ebeef5;
}

.bar-card:hover,
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.bar-cover,
.product-cover {
  height: 160px;
  overflow: hidden;
  background: #f5f7fa;
}

.bar-cover img,
.product-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bar-info,
.product-info {
  padding: 16px;
}

.bar-name,
.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-desc {
  font-size: 14px;
  color: #909399;
  margin-bottom: 12px;
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.bar-stats {
  display: flex;
  gap: 20px;
  font-size: 13px;
  color: #909399;
}

.bar-stats span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.product-brand {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.product-price {
  font-size: 18px;
  color: #f56c6c;
  font-weight: 600;
}
</style>
