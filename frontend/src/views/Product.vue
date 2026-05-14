<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left" @click="goBack">‹</div>
      <div class="header-title">商品详情</div>
      <div class="header-right" @click="handleShare">↗</div>
    </div>

    <div v-if="loading" class="loading"></div>
    <div v-else-if="error" class="error-state">
      <div class="icon">❌</div>
      <p>{{ error }}</p>
      <button @click="loadProduct">重试</button>
    </div>
    <div v-else class="content">
      <div class="image-slider">
        <img 
          v-for="(img, index) in (product.images || [defaultImage])" 
          :key="index" 
          :src="img || defaultImage" 
          alt="Product"
          @click="previewImage(index)"
          @error="handleImageError($event)"
        />
      </div>

      <div class="product-header">
        <div class="price-row">
          <span class="current-price">¥{{ product.price }}</span>
          <span class="original-price">¥{{ product.original_price }}</span>
        </div>
        <h1 class="product-title">{{ product.name }}</h1>
        <div class="product-meta">
          <span>发货地：{{ product.shipping_address }}</span>
          <span>销量：{{ product.sales }}</span>
          <span>库存：{{ product.stock }}</span>
        </div>
      </div>

      <div class="spec-section">
        <div class="section-header">
          <span>规格选择</span>
        </div>
        <div class="spec-list">
          <button 
            v-for="spec in product.specs" 
            :key="spec"
            class="spec-item"
            :class="{ active: selectedSpec === spec }"
            @click="selectedSpec = spec"
          >
            {{ spec }}
          </button>
        </div>
      </div>

      <div class="tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.key"
          class="tab"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          {{ tab.label }}
        </div>
      </div>

      <div class="tab-content">
        <div v-if="activeTab === 'detail'" class="detail-content">
          <p>{{ product.description }}</p>
          <img v-for="(img, index) in (product.images || [])" :key="index" :src="img || defaultImage" alt="Detail" @error="handleImageError($event)" />
        </div>

        <div v-if="activeTab === 'reviews'" class="review-list">
          <div v-if="reviews.length === 0" class="empty-state">
            <div class="icon">💬</div>
            <p>暂无评价</p>
          </div>
          <div v-else class="review-item" v-for="review in reviews" :key="review.id">
            <div class="review-header">
              <span class="review-user">用户{{ review.user_id }}</span>
              <span class="review-rating">⭐{{ review.rating }}</span>
            </div>
            <p class="review-content">{{ review.content }}</p>
          </div>
        </div>

        <div v-if="activeTab === 'questions'" class="question-list">
          <div v-if="questions.length === 0" class="empty-state">
            <div class="icon">❓</div>
            <p>暂无问答</p>
          </div>
          <div v-else class="question-item" v-for="q in questions" :key="q.id">
            <div class="question-content">{{ q.content }}</div>
            <div v-if="q.answer" class="answer-content">答：{{ q.answer }}</div>
          </div>
        </div>
      </div>

      <div class="store-section" @click="goToStore">
        <div class="store-info">
          <span class="store-icon">🏪</span>
          <span class="store-name">{{ product.store?.name }}</span>
        </div>
        <span class="store-arrow">›</span>
      </div>
    </div>

    <div class="bottom-bar safe-area-bottom">
      <div class="bottom-left">
        <div class="bottom-item" @click="handleFavorite">
          <span class="icon">{{ isFavorite ? '❤️' : '🤍' }}</span>
          <span>收藏</span>
        </div>
        <div class="bottom-item" @click="handleCustomerService">
          <span class="icon">💬</span>
          <span>客服</span>
        </div>
        <div class="bottom-item" @click="goToCart">
          <span class="icon">🛒</span>
          <span>购物车</span>
          <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
        </div>
      </div>
      <div class="bottom-right">
        <button class="btn-cart" @click="handleAddToCart">加入购物车</button>
        <button class="btn-buy" @click="handleBuyNow">立即购买</button>
      </div>
    </div>

    <div v-if="showSpecModal" class="modal-mask" @click="showSpecModal = false">
      <div class="spec-modal" @click.stop>
        <div class="modal-header">
          <span>选择规格</span>
          <span class="modal-close" @click="showSpecModal = false">×</span>
        </div>
        <div class="spec-modal-content">
          <img :src="product.images?.[0] || defaultImage" alt="Product" @error="handleImageError($event)" />
          <div class="spec-price">¥{{ product.price }}</div>
          <div class="spec-options">
            <div class="spec-option">
              <span>规格</span>
              <div class="spec-buttons">
                <button 
                  v-for="spec in product.specs" 
                  :key="spec"
                  :class="{ active: selectedSpec === spec }"
                  @click="selectedSpec = spec"
                >
                  {{ spec }}
                </button>
              </div>
            </div>
            <div class="spec-option">
              <span>数量</span>
              <div class="quantity-control">
                <button @click="quantity = Math.max(1, quantity - 1)">-</button>
                <span>{{ quantity }}</span>
                <button @click="quantity = Math.min(product.stock, quantity + 1)">+</button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-confirm" @click="confirmSpec">确认</button>
        </div>
      </div>
    </div>

    <div v-if="showImagePreview" class="modal-mask" @click="showImagePreview = false">
      <div class="image-preview">
        <img :src="previewImageUrl" alt="Preview" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productAPI } from '../api'
import { useCartStore } from '../stores/cart'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const product = ref({})
const reviews = ref([])
const questions = ref([])
const loading = ref(true)
const error = ref('')
const activeTab = ref('detail')
const selectedSpec = ref('')
const quantity = ref(1)
const isFavorite = ref(false)
const showSpecModal = ref(false)
const showImagePreview = ref(false)
const previewImageUrl = ref('')
const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWKoOiAhueZu+eUqDwvdGV4dD48L3N2Zz4='

const tabs = [
  { key: 'detail', label: '详情' },
  { key: 'reviews', label: '评价' },
  { key: 'questions', label: '问答' }
]

const cartCount = computed(() => cartStore.totalCount)

async function loadProduct() {
  loading.value = true
  error.value = ''
  
  try {
    const res = await productAPI.getProduct(route.params.id)
    if (res.success && res.data) {
      product.value = res.data
      reviews.value = res.data.reviews || []
      questions.value = res.data.questions || []
      if (product.value.specs?.length > 0) {
        selectedSpec.value = product.value.specs[0]
      }
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

function handleShare() {
  const event = new CustomEvent('showToast', { detail: '分享功能开发中' })
  window.dispatchEvent(event)
}

function previewImage(index) {
  previewImageUrl.value = product.value.images?.[index] || ''
  showImagePreview.value = true
}

function handleFavorite() {
  isFavorite.value = !isFavorite.value
  const event = new CustomEvent('showToast', { detail: isFavorite.value ? '已收藏' : '已取消收藏' })
  window.dispatchEvent(event)
}

function handleCustomerService() {
  const event = new CustomEvent('showToast', { detail: '客服功能开发中' })
  window.dispatchEvent(event)
}

function goToCart() {
  router.push('/cart')
}

function handleAddToCart() {
  if (!selectedSpec.value) {
    const event = new CustomEvent('showToast', { detail: '请选择规格' })
    window.dispatchEvent(event)
    return
  }
  showSpecModal.value = true
}

function handleBuyNow() {
  if (!selectedSpec.value) {
    const event = new CustomEvent('showToast', { detail: '请选择规格' })
    window.dispatchEvent(event)
    return
  }
  showSpecModal.value = true
  confirmSpec(true)
}

async function confirmSpec(buyNow = false) {
  showSpecModal.value = false
  
  if (buyNow) {
    const items = [{
      product_id: product.value.id,
      quantity: quantity.value,
      spec: selectedSpec.value
    }]
    sessionStorage.setItem('checkoutItems', JSON.stringify(items))
    router.push('/checkout')
  } else {
    const res = await cartStore.addItem(product.value.id, quantity.value, selectedSpec.value)
    const event = new CustomEvent('showToast', { detail: res.success ? '已加入购物车' : (res.message || '加入失败') })
    window.dispatchEvent(event)
  }
  
  quantity.value = 1
}

function goToStore() {
  const event = new CustomEvent('showToast', { detail: '店铺页面开发中' })
  window.dispatchEvent(event)
}

function handleImageError(event) {
  event.target.src = defaultImage
}

onMounted(() => {
  loadProduct()
})
</script>

<style scoped>
.content {
  padding-top: 54px;
}

.image-slider {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
}

.image-slider img {
  width: 100%;
  height: 300px;
  flex-shrink: 0;
  object-fit: cover;
}

.product-header {
  background: #fff;
  padding: 15px;
  margin-bottom: 10px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}

.current-price {
  font-size: 28px;
  font-weight: bold;
  color: var(--primary-color);
}

.original-price {
  font-size: 14px;
  color: var(--gray-color);
  text-decoration: line-through;
}

.product-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  line-height: 1.5;
  margin-bottom: 10px;
}

.product-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: var(--gray-color);
}

.spec-section {
  background: #fff;
  padding: 15px;
  margin-bottom: 10px;
}

.section-header {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 10px;
}

.spec-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.spec-item {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 14px;
}

.spec-item.active {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.tabs {
  display: flex;
  background: #fff;
  border-bottom: 1px solid var(--border-color);
}

.tab {
  flex: 1;
  padding: 15px;
  text-align: center;
  font-size: 14px;
  color: var(--gray-color);
  border-bottom: 2px solid transparent;
}

.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
}

.tab-content {
  background: #fff;
  padding: 15px;
  min-height: 200px;
}

.detail-content {
  font-size: 14px;
  line-height: 1.8;
  color: #666;
}

.detail-content img {
  width: 100%;
  margin: 10px 0;
}

.review-item, .question-item {
  padding: 15px 0;
  border-bottom: 1px solid var(--border-color);
}

.review-item:last-child, .question-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.review-user {
  font-size: 12px;
  color: var(--gray-color);
}

.review-rating {
  font-size: 12px;
}

.review-content {
  font-size: 14px;
  color: #333;
}

.question-content {
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
}

.answer-content {
  font-size: 14px;
  color: var(--gray-color);
  padding-left: 15px;
}

.store-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 15px;
  margin-top: 10px;
}

.store-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.store-icon {
  font-size: 24px;
}

.store-name {
  font-size: 14px;
  font-weight: bold;
}

.store-arrow {
  color: var(--gray-color);
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  background: #fff;
  padding: 10px;
  border-top: 1px solid var(--border-color);
}

.bottom-left {
  display: flex;
  gap: 20px;
}

.bottom-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 12px;
  color: var(--gray-color);
  position: relative;
}

.bottom-item .icon {
  font-size: 20px;
  margin-bottom: 2px;
}

.cart-badge {
  position: absolute;
  top: -5px;
  right: -10px;
  background: var(--primary-color);
  color: #fff;
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 10px;
}

.bottom-right {
  flex: 1;
  display: flex;
  gap: 10px;
  margin-left: 20px;
}

.btn-cart {
  flex: 1;
  padding: 12px;
  background: var(--secondary-color);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
}

.btn-buy {
  flex: 1;
  padding: 12px;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
}

.spec-modal {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 15px 15px 0 0;
  padding: 15px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: bold;
}

.modal-close {
  font-size: 24px;
  color: var(--gray-color);
}

.spec-modal-content {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.spec-modal-content img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
}

.spec-price {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 15px;
}

.spec-options {
  flex: 1;
}

.spec-option {
  margin-bottom: 15px;
}

.spec-option span {
  font-size: 14px;
  color: var(--gray-color);
  margin-bottom: 10px;
  display: block;
}

.spec-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.spec-buttons button {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-size: 14px;
}

.spec-buttons button.active {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 15px;
}

.quantity-control button {
  width: 36px;
  height: 36px;
  border: 1px solid var(--border-color);
  border-radius: 50%;
  font-size: 18px;
}

.quantity-control span {
  font-size: 16px;
  font-weight: bold;
}

.modal-footer {
  padding-top: 15px;
  border-top: 1px solid var(--border-color);
}

.btn-confirm {
  width: 100%;
  padding: 15px;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: bold;
}

.image-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>