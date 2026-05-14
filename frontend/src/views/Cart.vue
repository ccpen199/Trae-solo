<template>
  <div class="cart-container">
    <div class="header">
      <div class="back-btn" @click="$router.back()">
        <span>←</span>
      </div>
      <h1 class="title">购物车</h1>
      <div class="placeholder"></div>
    </div>

    <div v-if="cartItems.length === 0" class="empty-cart">
      <span class="empty-icon">🛒</span>
      <p>购物车是空的</p>
      <button class="btn btn-primary" @click="$router.push('/home')">去逛逛</button>
    </div>

    <div v-else class="cart-list">
      <div 
        v-for="item in cartItems" 
        :key="item.id" 
        class="cart-item"
      >
        <img :src="item.image" alt="product" class="cart-item-image" />
        <div class="cart-item-info">
          <h4 class="cart-item-name">{{ item.name }}</h4>
          <p class="cart-item-desc">{{ item.description }}</p>
          <div class="cart-item-footer">
            <span class="cart-item-price">¥{{ item.price }}</span>
            <div class="quantity-control">
              <button class="minus-btn" @click="decreaseQuantity(item.id)">-</button>
              <span class="quantity">{{ item.quantity }}</span>
              <button class="plus-btn" @click="increaseQuantity(item.id)">+</button>
            </div>
          </div>
        </div>
      </div>

      <div class="cart-summary">
        <div class="summary-row">
          <span class="summary-label">商品小计</span>
          <span class="summary-value">¥{{ cartTotalPrice.toFixed(2) }}</span>
        </div>
        <div class="summary-row">
          <span class="summary-label">配送费</span>
          <span class="summary-value">¥{{ deliveryFee.toFixed(2) }}</span>
        </div>
        <div class="summary-row total">
          <span class="summary-label">合计</span>
          <span class="summary-value">¥{{ totalPrice.toFixed(2) }}</span>
        </div>
      </div>
    </div>

    <div v-if="cartItems.length > 0" class="bottom-bar">
      <div class="cart-total">
        <span class="total-label">合计:</span>
        <span class="total-price">¥{{ totalPrice.toFixed(2) }}</span>
      </div>
      <button class="btn btn-primary checkout-btn" @click="goOrder">
        去结算({{ cartTotalCount }})
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()

const cartItems = computed(() => cartStore.items)
const cartTotalCount = computed(() => cartStore.totalCount)
const cartTotalPrice = computed(() => cartStore.totalPrice)
const deliveryFee = computed(() => 5)
const totalPrice = computed(() => cartTotalPrice.value + deliveryFee.value)

function increaseQuantity(productId) {
  const item = cartItems.value.find(i => i.id === productId)
  if (item) {
    cartStore.updateQuantity(productId, item.quantity + 1)
  }
}

function decreaseQuantity(productId) {
  const item = cartItems.value.find(i => i.id === productId)
  if (item && item.quantity > 1) {
    cartStore.updateQuantity(productId, item.quantity - 1)
  } else if (item && item.quantity === 1) {
    cartStore.removeItem(productId)
  }
}

function goOrder() {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  router.push('/order')
}
</script>

<style scoped>
.cart-container {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.placeholder {
  width: 44px;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-cart p {
  font-size: 16px;
  color: #999;
  margin: 0 0 20px 0;
}

.cart-list {
  padding: 16px;
}

.cart-item {
  display: flex;
  gap: 12px;
  background: #fff;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.cart-item-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}

.cart-item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.cart-item-name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin: 0;
}

.cart-item-desc {
  font-size: 12px;
  color: #999;
  margin: 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cart-item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cart-item-price {
  font-size: 16px;
  font-weight: bold;
  color: #ff6b35;
}

.quantity-control {
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

.cart-summary {
  background: #fff;
  padding: 16px;
  border-radius: 12px;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.summary-row.total {
  padding-top: 12px;
  border-top: 1px dashed #e0e0e0;
}

.summary-label {
  font-size: 14px;
  color: #666;
}

.summary-value {
  font-size: 14px;
  color: #333;
}

.summary-row.total .summary-value {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b35;
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

.cart-total {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.total-label {
  font-size: 14px;
  color: #666;
}

.total-price {
  font-size: 20px;
  font-weight: bold;
  color: #ff6b35;
}

.checkout-btn {
  padding: 12px 32px;
  border-radius: 24px;
  font-size: 16px;
}
</style>