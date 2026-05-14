<template>
  <div class="merchant-container">
    <div class="header">
      <div class="back-btn" @click="$router.back()">
        <span>←</span>
      </div>
      <div class="header-info">
        <img :src="merchant.logo" alt="logo" class="merchant-logo" />
        <div class="merchant-header-info">
          <h1 class="merchant-name">{{ merchant.name }}</h1>
          <div class="merchant-header-tags">
            <span class="rating">{{ merchant.rating }}分</span>
            <span class="sales">月售{{ merchant.sales }}</span>
            <span class="delivery-time">{{ merchant.delivery_time }}分钟</span>
          </div>
        </div>
      </div>
    </div>

    <div class="merchant-info-bar">
      <div class="info-item">
        <span class="info-icon">💰</span>
        <span class="info-text">配送费 ¥{{ merchant.delivery_fee }}</span>
      </div>
      <div class="info-item">
        <span class="info-icon">🎯</span>
        <span class="info-text">起送价 ¥{{ merchant.min_order }}</span>
      </div>
      <div class="info-item">
        <span class="info-icon">📍</span>
        <span class="info-text">{{ merchant.address }}</span>
      </div>
    </div>

    <div class="menu-section">
      <h3 class="menu-title">店铺菜单</h3>
      
      <div class="product-list">
        <div 
          v-for="product in products" 
          :key="product.id" 
          class="product-item"
        >
          <img :src="product.image" alt="product" class="product-image" />
          <div class="product-info">
            <h4 class="product-name">{{ product.name }}</h4>
            <p class="product-desc">{{ product.description }}</p>
            <div class="product-footer">
              <span class="product-price">¥{{ product.price }}</span>
              <span v-if="product.original_price" class="product-original-price">¥{{ product.original_price }}</span>
              <span class="product-sales">已售{{ product.sales }}</span>
            </div>
          </div>
          <div class="product-action">
            <button 
              class="minus-btn" 
              v-if="getQuantity(product.id) > 0"
              @click="decreaseQuantity(product)"
            >-</button>
            <span v-if="getQuantity(product.id) > 0" class="quantity">{{ getQuantity(product.id) }}</span>
            <button class="plus-btn" @click="addToCart(product)">+</button>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="cart-info">
        <span class="cart-icon">🛒</span>
        <span v-if="cartTotalCount > 0" class="cart-badge">{{ cartTotalCount }}</span>
        <span class="cart-price">¥{{ cartTotalPrice.toFixed(2) }}</span>
      </div>
      <button 
        class="btn btn-primary checkout-btn"
        :disabled="cartTotalCount === 0"
        @click="goCheckout"
      >
        去结算
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { merchantAPI } from '@/api'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const cartStore = useCartStore()
const userStore = useUserStore()

const merchant = ref({
  id: '',
  name: '',
  logo: '',
  rating: 0,
  delivery_time: 30,
  delivery_fee: 5,
  min_order: 20,
  sales: 0,
  address: ''
})
const products = ref([])

const cartTotalCount = ref(0)
const cartTotalPrice = ref(0)

onMounted(() => {
  loadMerchant()
})

async function loadMerchant() {
  const id = route.params.id
  try {
    const result = await merchantAPI.getMerchant(id)
    if (result.success) {
      merchant.value = result.data.merchant
      products.value = result.data.products
    }
  } catch (err) {
    console.error('加载商家信息失败:', err)
  }
}

function addToCart(product) {
  cartStore.addItem(product)
  updateCartInfo()
}

function decreaseQuantity(product) {
  const currentQuantity = getQuantity(product.id)
  if (currentQuantity > 0) {
    cartStore.updateQuantity(product.id, currentQuantity - 1)
    updateCartInfo()
  }
}

function getQuantity(productId) {
  const item = cartStore.items.find(item => item.id === productId)
  return item ? item.quantity : 0
}

function updateCartInfo() {
  cartTotalCount.value = cartStore.totalCount
  cartTotalPrice.value = cartStore.totalPrice
}

function goCheckout() {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  router.push('/cart')
}
</script>

<style scoped>
.merchant-container {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
}

.back-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #333;
}

.header-info {
  flex: 1;
  display: flex;
  gap: 12px;
}

.merchant-logo {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
}

.merchant-header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.merchant-name {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin: 0 0 8px 0;
}

.merchant-header-tags {
  display: flex;
  gap: 12px;
}

.rating {
  font-size: 12px;
  color: #ff6b35;
}

.sales, .delivery-time {
  font-size: 12px;
  color: #999;
}

.merchant-info-bar {
  display: flex;
  gap: 16px;
  padding: 12px 16px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  overflow-x: auto;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.info-icon {
  font-size: 14px;
}

.info-text {
  font-size: 12px;
  color: #666;
}

.menu-section {
  margin-top: 12px;
}

.menu-title {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  padding: 16px;
  margin: 0;
  background: #fff;
}

.product-list {
  background: #fff;
  padding: 0 16px 16px;
}

.product-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.product-item:last-child {
  border-bottom: none;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.product-desc {
  font-size: 12px;
  color: #999;
  margin: 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-footer {
  display: flex;
  align-items: center;
  gap: 8px;
}

.product-price {
  font-size: 16px;
  font-weight: bold;
  color: #ff6b35;
}

.product-original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
}

.product-sales {
  font-size: 11px;
  color: #999;
}

.product-action {
  display: flex;
  align-items: center;
  gap: 8px;
}

.minus-btn, .plus-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid #e0e0e0;
  background: #fff;
  font-size: 18px;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
}

.minus-btn {
  color: #999;
}

.plus-btn {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  color: #fff;
  border: none;
}

.quantity {
  font-size: 14px;
  color: #333;
  min-width: 24px;
  text-align: center;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.cart-info {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.cart-icon {
  font-size: 28px;
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -12px;
  min-width: 16px;
  height: 16px;
  background: #ff4757;
  color: #fff;
  font-size: 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

.cart-price {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b35;
}

.checkout-btn {
  padding: 12px 32px;
  border-radius: 24px;
  font-size: 16px;
}
</style>