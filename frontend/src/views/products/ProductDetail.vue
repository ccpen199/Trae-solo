<template>
  <div class="product-detail-page">
    <div class="container">
      <div v-if="loading" class="page-loading">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="error" class="page-error">
        <el-empty description="加载失败">
          <el-button type="primary" @click="loadProduct">重试</el-button>
        </el-empty>
      </div>
      
      <template v-else-if="product">
        <div class="product-main">
          <div class="product-cover">
            <img :src="product.cover_image || defaultCover" :alt="product.name" />
          </div>
          <div class="product-info">
            <h1 class="product-name">{{ product.name }}</h1>
            <p class="product-brand">{{ product.brand || '未知品牌' }}</p>
            <p class="product-price" v-if="product.price">¥{{ product.price.toFixed(2) }}</p>
            <p class="product-desc">{{ product.description }}</p>
          </div>
        </div>
        
        <div class="related-bars">
          <h2>相关产品吧</h2>
          
          <div v-if="(product.related_bars || []).length === 0" class="page-empty">
            <el-empty description="暂无相关产品吧">
              <router-link to="/bars/create">
                <el-button type="primary">创建产品吧</el-button>
              </router-link>
            </el-empty>
          </div>
          
          <div v-else class="bar-list">
            <div
              v-for="bar in product.related_bars"
              :key="bar.id"
              class="bar-item"
              @click="goToBar(bar.id)"
            >
              <div class="bar-cover">
                <img :src="bar.cover_image || defaultCover" />
              </div>
              <div class="bar-info">
                <h3>{{ bar.name }}</h3>
                <p class="bar-desc">{{ bar.description || '暂无描述' }}</p>
                <div class="bar-stats">
                  <span>{{ bar.member_count || 0 }} 成员</span>
                  <span>{{ bar.post_count || 0 }} 帖子</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/utils/api'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref(false)
const product = ref(null)

const defaultCover = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect fill="%23f0f2f5" width="200" height="200"/%3E%3Ctext fill="%23909399" font-family="Arial" font-size="24" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E商品%3C/text%3E%3C/svg%3E'

async function loadProduct() {
  loading.value = true
  error.value = false
  try {
    const res = await api.get(`/products/${route.params.id}`)
    if (res.success) {
      product.value = res.data
    }
  } catch (e) {
    console.error('加载商品失败:', e)
    error.value = true
  } finally {
    loading.value = false
  }
}

function goToBar(id) {
  router.push(`/bars/${id}`)
}

onMounted(() => {
  loadProduct()
})
</script>

<style scoped>
.product-detail-page {
  padding: 30px 0;
}

.product-main {
  display: flex;
  gap: 40px;
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 40px;
}

.product-cover {
  width: 300px;
  height: 300px;
  overflow: hidden;
  border-radius: 12px;
  background: #f5f7fa;
  flex-shrink: 0;
}

.product-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 28px;
  color: #303133;
  margin-bottom: 12px;
}

.product-brand {
  font-size: 16px;
  color: #909399;
  margin-bottom: 20px;
}

.product-price {
  font-size: 32px;
  color: #f56c6c;
  font-weight: 600;
  margin-bottom: 20px;
}

.product-desc {
  font-size: 15px;
  color: #606266;
  line-height: 1.8;
}

.related-bars h2 {
  font-size: 22px;
  color: #303133;
  margin-bottom: 20px;
}

.bar-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.bar-item {
  display: flex;
  gap: 16px;
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #ebeef5;
}

.bar-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
}

.bar-item .bar-cover {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f7fa;
}

.bar-item .bar-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bar-item .bar-info {
  flex: 1;
  min-width: 0;
}

.bar-item h3 {
  font-size: 16px;
  color: #303133;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.bar-stats {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #909399;
}
</style>
