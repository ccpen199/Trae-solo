<template>
  <div class="product-detail-page page-container">
    <div v-if="loading" class="loading">
      <el-icon class="loading-icon"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12.01" y2="18"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg></el-icon>
    </div>

    <div v-else-if="!product" class="error">
      <p>商品不存在</p>
    </div>

    <div v-else class="content">
      <div class="product-images">
        <img :src="getFirstImage(product.images)" :alt="product.title" />
      </div>

      <div class="product-header">
        <h1 class="product-title">{{ product.title }}</h1>
        <p class="product-category">{{ product.category_name }}</p>
        <div class="product-price-row">
          <span class="current-price">¥{{ product.price }}</span>
          <span class="original-price">¥{{ product.original_price }}</span>
          <span class="sales">销量 {{ product.sales }}</span>
        </div>
      </div>

      <div class="product-info">
        <div class="info-section">
          <h3>商品详情</h3>
          <p>{{ product.description }}</p>
        </div>
        <div class="info-section">
          <h3>规格参数</h3>
          <div class="specs">
            <div class="spec-item">
              <span class="label">风格</span>
              <span class="value">{{ product.style }}</span>
            </div>
            <div class="spec-item">
              <span class="label">库存</span>
              <span class="value">{{ product.stock }}件</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-bar">
        <div class="action-buttons">
          <button class="action-btn" @click="handleShare">
            <Share2 class="action-icon" />
            <span>分享</span>
          </button>
          <button class="action-btn" @click="handleAddCart">
            <ShoppingCart class="action-icon" />
            <span>加入购物车</span>
          </button>
        </div>
        <button class="buy-btn" @click="handleBuyNow">立即购买</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Share2, ShoppingCart } from 'lucide-vue-next'
import { productAPI, cartAPI, orderAPI } from '@/api'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElIcon } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const product = ref(null)

onMounted(() => {
  loadProduct()
})

async function loadProduct() {
  loading.value = true
  try {
    const id = route.params.id
    product.value = await productAPI.detail(id)
  } catch {
    product.value = null
  } finally {
    loading.value = false
  }
}

function getFirstImage(imagesStr) {
  try {
    const images = JSON.parse(imagesStr)
    return images[0] || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2ZmZiI+PC9yZWN0Pjx0ZXh0IHg9IjMwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkZ1cm5pdHVyZTwvdGV4dD48L3N2Zz4='
  } catch {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2ZmZiI+PC9yZWN0Pjx0ZXh0IHg9IjMwMCIgeT0iMjAwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkZ1cm5pdHVyZTwvdGV4dD48L3N2Zz4='
  }
}

function handleShare() {
  ElMessage.info('分享功能开发中')
}

async function handleAddCart() {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    await cartAPI.add({ product_id: product.value.id, quantity: 1 })
    ElMessage.success('已加入购物车')
  } catch {
    ElMessage.error('加入失败')
  }
}

async function handleBuyNow() {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    console.log('下单商品 ID:', product.value.id)
    await orderAPI.create({
      items: [{ product_id: product.value.id, quantity: 1 }]
    })
    ElMessage.success('下单成功')
    router.push('/orders')
  } catch (error) {
    console.error('下单失败:', error)
    ElMessage.error('下单失败')
  }
}
</script>

<style scoped>
.content {
  padding-bottom: 80px;
}

.product-images {
  height: 360px;
  background: white;
}

.product-images img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-header {
  background: white;
  padding: 16px;
  margin-bottom: 12px;
}

.product-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.product-category {
  font-size: 13px;
  color: #999;
  margin: 0 0 12px 0;
}

.product-price-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.current-price {
  font-size: 28px;
  font-weight: 700;
  color: #ef4444;
}

.original-price {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
}

.sales {
  font-size: 12px;
  color: #999;
}

.product-info {
  background: white;
  padding: 16px;
}

.info-section {
  margin-bottom: 20px;
}

.info-section:last-child {
  margin-bottom: 0;
}

.info-section h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.info-section p {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
}

.specs {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spec-item {
  display: flex;
  justify-content: space-between;
}

.spec-item .label {
  font-size: 14px;
  color: #999;
}

.spec-item .value {
  font-size: 14px;
  color: #333;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  align-items: center;
  padding: 12px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.action-buttons {
  display: flex;
  gap: 20px;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  cursor: pointer;
}

.action-icon {
  width: 24px;
  height: 24px;
  color: #666;
}

.action-btn span {
  font-size: 11px;
  color: #666;
}

.buy-btn {
  flex: 1;
  height: 44px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 22px;
  font-size: 16px;
  font-weight: 500;
  margin-left: 16px;
}

.loading, .error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-icon {
  font-size: 32px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>