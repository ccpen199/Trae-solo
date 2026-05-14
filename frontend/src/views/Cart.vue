<template>
  <div class="cart-page page-container">
    <div class="header">
      <h1>购物车</h1>
    </div>

    <div v-if="loading" class="loading">
      <el-spinner />
    </div>

    <div v-else-if="cartItems.length === 0" class="empty">
      <ShoppingCart class="empty-icon" />
      <p>购物车为空</p>
      <el-button type="primary" @click="goShopping">去购物</el-button>
    </div>

    <div v-else class="content">
      <div class="cart-list">
        <div 
          v-for="item in cartItems" 
          :key="item.id" 
          class="cart-item"
        >
          <div class="item-image" @click="goProduct(item.product_id)">
            <img :src="getFirstImage(item.images)" :alt="item.title" />
          </div>
          <div class="item-info">
            <h4 class="item-title">{{ item.title }}</h4>
            <div class="item-price">¥{{ item.price }}</div>
            <div class="item-actions">
              <button class="qty-btn" @click="decreaseQty(item)">-</button>
              <span class="qty">{{ item.quantity }}</span>
              <button class="qty-btn" @click="increaseQty(item)">+</button>
              <button class="delete-btn" @click="removeItem(item.id)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-bar">
        <div class="total-info">
          <span class="total-label">合计：</span>
          <span class="total-price">¥{{ totalPrice }}</span>
        </div>
        <button class="checkout-btn" @click="handleCheckout">去结算</button>
      </div>
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ShoppingCart } from 'lucide-vue-next'
import BottomNav from '@/components/BottomNav.vue'
import { cartAPI, orderAPI } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(true)
const cartItems = ref([])

onMounted(() => {
  loadCart()
})

async function loadCart() {
  loading.value = true
  try {
    cartItems.value = await cartAPI.list()
  } catch {
    cartItems.value = []
  } finally {
    loading.value = false
  }
}

const totalPrice = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

function getFirstImage(imagesStr) {
  try {
    const images = JSON.parse(imagesStr)
    return images[0] || '/default-image.png'
  } catch {
    return '/default-image.png'
  }
}

async function increaseQty(item) {
  try {
    await cartAPI.update(item.id, item.quantity + 1)
    item.quantity++
  } catch {
    ElMessage.error('更新失败')
  }
}

async function decreaseQty(item) {
  if (item.quantity <= 1) return
  try {
    await cartAPI.update(item.id, item.quantity - 1)
    item.quantity--
  } catch {
    ElMessage.error('更新失败')
  }
}

async function removeItem(id) {
  try {
    await cartAPI.delete(id)
    cartItems.value = cartItems.value.filter(item => item.id !== id)
    ElMessage.success('删除成功')
  } catch {
    ElMessage.error('删除失败')
  }
}

async function handleCheckout() {
  if (cartItems.value.length === 0) return
  
  const items = cartItems.value.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity
  }))
  
  try {
    await orderAPI.create({ items })
    ElMessage.success('下单成功')
    cartItems.value = []
    router.push('/orders')
  } catch {
    ElMessage.error('下单失败')
  }
}

function goShopping() {
  router.push('/products')
}

function goProduct(id) {
  router.push(`/product/${id}`)
}
</script>

<style scoped>
.header {
  background: white;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.content {
  padding-bottom: 80px;
}

.cart-list {
  padding: 12px;
}

.cart-item {
  display: flex;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
}

.item-image {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.item-title {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-price {
  font-size: 16px;
  font-weight: 600;
  color: #ef4444;
  margin-bottom: auto;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  font-size: 16px;
}

.qty {
  width: 32px;
  text-align: center;
  font-size: 14px;
}

.delete-btn {
  margin-left: auto;
  color: #999;
  font-size: 13px;
  background: none;
  border: none;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.total-info {
  display: flex;
  align-items: baseline;
}

.total-label {
  font-size: 14px;
  color: #666;
}

.total-price {
  font-size: 20px;
  font-weight: 700;
  color: #ef4444;
}

.checkout-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 22px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 500;
}

.loading, .empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.empty-icon {
  width: 80px;
  height: 80px;
  color: #ddd;
  margin-bottom: 16px;
}

.empty p {
  color: #999;
  margin-bottom: 16px;
}
</style>