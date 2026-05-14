<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left" @click="goBack">‹</div>
      <div class="header-title">{{ pageTitle }}</div>
      <div class="header-right"></div>
    </div>

    <div class="content">
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
          <div class="product-image-wrap">
            <img 
              :src="product.images?.[0] || defaultImage" 
              alt="Product" 
              class="product-image"
              @error="handleImageError($event)"
            />
            <div v-if="type === 'seckill'" class="seckill-tag">秒杀</div>
            <div v-else-if="type === 'brand'" class="brand-tag">品牌</div>
            <div v-else-if="type === 'new'" class="new-tag">新品</div>
          </div>
          <div class="product-info">
            <h3 class="product-name">{{ product.name }}</h3>
            <div class="product-price">
              <span class="price">¥{{ product.price }}</span>
              <span class="price-original">¥{{ product.original_price }}</span>
            </div>
            <div class="product-badge" v-if="type === 'seckill'">
              <span class="discount">{{ discountPercent(product.original_price, product.price) }}折</span>
              <span class="sales">已售{{ product.sales }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <TabBar />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productAPI } from '../api'
import TabBar from '../components/TabBar.vue'

const route = useRoute()
const router = useRouter()

const type = computed(() => route.query.type || 'seckill')
const products = ref([])
const loading = ref(true)
const error = ref('')
const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWKoOiAhueZu+eUqDwvdGV4dD48L3N2Zz4='

const pageTitle = computed(() => {
  const titles = {
    seckill: '限时秒杀',
    brand: '品牌特卖',
    new: '新品首发'
  }
  return titles[type.value] || '优惠活动'
})

function discountPercent(original, current) {
  if (!original || original === 0) return ''
  return ((current / original) * 10).toFixed(1)
}

async function loadProducts() {
  loading.value = true
  error.value = ''
  
  try {
    const res = await productAPI.getProducts({ limit: 20 })
    if (res.success) {
      let list = res.data
      
      if (type.value === 'seckill') {
        list = list.filter(p => p.original_price > p.price).sort((a, b) => {
          return (b.original_price - b.price) - (a.original_price - a.price)
        })
      } else if (type.value === 'new') {
        list = list.slice().reverse()
      }
      
      products.value = list
    }
  } catch (err) {
    error.value = err.message || '加载商品失败'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

function goToProduct(id) {
  router.push(`/product/${id}`)
}

function handleImageError(event) {
  event.target.src = defaultImage
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.content {
  padding-top: 54px;
  padding-bottom: 60px;
}

.product-list {
  display: flex;
  flex-wrap: wrap;
  padding: 10px;
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

.product-image-wrap {
  position: relative;
}

.product-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.seckill-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background: var(--primary-color);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.brand-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #333;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.new-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #FF9500;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
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
  margin-bottom: 8px;
}

.price {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
}

.price-original {
  font-size: 12px;
  color: var(--gray-color);
  text-decoration: line-through;
}

.product-badge {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.discount {
  background: #FFF2F2;
  color: var(--primary-color);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.sales {
  font-size: 12px;
  color: var(--gray-color);
}
</style>
