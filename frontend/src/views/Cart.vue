<template>
  <div class="page-container">
    <div class="header">
      <div class="header-left" @click="goBack">‹</div>
      <div class="header-title">购物车</div>
      <div class="header-right" @click="handleClear">清空</div>
    </div>

    <div class="content">
      <div v-if="loading" class="loading"></div>
      <div v-else-if="error" class="error-state">
        <div class="icon">❌</div>
        <p>{{ error }}</p>
        <button @click="loadCart">重试</button>
      </div>
      <div v-else-if="cartItems.length === 0" class="empty-state">
        <div class="icon">🛒</div>
        <p>购物车空空如也</p>
        <button class="btn btn-primary" @click="goShopping">去购物</button>
      </div>
      <div v-else>
        <div class="cart-list">
          <div 
            v-for="item in cartItems" 
            :key="item.id"
            class="cart-item"
          >
            <div 
              class="checkbox" 
              :class="{ checked: selectedItems.includes(item.id) }"
              @click="toggleSelect(item.id)"
            ></div>
            <img 
              :src="item.images?.[0] || defaultImage" 
              alt="Product" 
              class="cart-image"
              @click="goToProduct(item.product_id)"
              @error="handleImageError($event)"
            />
            <div class="cart-info">
              <h3 class="cart-name">{{ item.name }}</h3>
              <span class="cart-spec">{{ item.spec }}</span>
              <div class="cart-bottom">
                <span class="cart-price">¥{{ item.price }}</span>
                <div class="quantity-control">
                  <button @click="handleMinus(item)">-</button>
                  <span>{{ item.quantity }}</span>
                  <button @click="handlePlus(item)">+</button>
                </div>
              </div>
            </div>
            <button class="cart-delete" @click="handleDelete(item.id)">×</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="cartItems.length > 0" class="bottom-bar safe-area-bottom">
      <div class="bottom-left">
        <div 
          class="checkbox" 
          :class="{ checked: isAllSelected }"
          @click="toggleSelectAll"
        ></div>
        <span>全选</span>
      </div>
      <div class="bottom-right">
        <div class="total-info">
          <span>合计：</span>
          <span class="total-price">¥{{ selectedTotal }}</span>
        </div>
        <button 
          class="btn-checkout" 
          :disabled="selectedItems.length === 0"
          @click="handleCheckout"
        >
          结算({{ selectedCount }})
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const loading = ref(true)
const error = ref('')
const selectedItems = ref([])
const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWKoOiAhueZu+eUqDwvdGV4dD48L3N2Zz4='

const cartItems = computed(() => cartStore.items)

const isAllSelected = computed(() => {
  return cartItems.value.length > 0 && selectedItems.value.length === cartItems.value.length
})

const selectedCount = computed(() => selectedItems.value.length)

const selectedTotal = computed(() => {
  return cartItems.value
    .filter(item => selectedItems.value.includes(item.id))
    .reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
})

async function loadCart() {
  loading.value = true
  error.value = ''
  
  try {
    await cartStore.loadCart()
  } catch (err) {
    error.value = err.message || '加载购物车失败'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.back()
}

function handleClear() {
  const confirm = window.confirm('确定清空购物车吗？')
  if (confirm) {
    cartStore.clearCart()
  }
}

function goShopping() {
  router.push('/')
}

function goToProduct(id) {
  router.push(`/product/${id}`)
}

function toggleSelect(id) {
  const index = selectedItems.value.indexOf(id)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  } else {
    selectedItems.value.push(id)
  }
}

function toggleSelectAll() {
  if (isAllSelected.value) {
    selectedItems.value = []
  } else {
    selectedItems.value = cartItems.value.map(item => item.id)
  }
}

async function handleMinus(item) {
  if (item.quantity > 1) {
    await cartStore.updateItem(item.id, item.quantity - 1)
  }
}

async function handlePlus(item) {
  await cartStore.updateItem(item.id, item.quantity + 1)
}

async function handleDelete(id) {
  const confirm = window.confirm('确定删除该商品吗？')
  if (confirm) {
    await cartStore.removeItem(id)
    const index = selectedItems.value.indexOf(id)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    }
  }
}

function handleCheckout() {
  if (selectedItems.value.length === 0) {
    const event = new CustomEvent('showToast', { detail: '请选择商品' })
    window.dispatchEvent(event)
    return
  }
  
  const items = cartItems.value
    .filter(item => selectedItems.value.includes(item.id))
    .map(item => ({
      cart_id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      spec: item.spec
    }))
  
  sessionStorage.setItem('checkoutItems', JSON.stringify(items))
  router.push('/checkout')
}

function handleImageError(event) {
  event.target.src = defaultImage
}

onMounted(() => {
  loadCart()
})
</script>

<style scoped>
.content {
  padding-top: 54px;
  padding-bottom: 80px;
}

.cart-list {
  padding: 10px;
}

.cart-item {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 10px;
  margin-bottom: 10px;
  border-radius: 8px;
}

.cart-item .checkbox {
  margin-right: 10px;
}

.cart-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 10px;
}

.cart-info {
  flex: 1;
  min-width: 0;
}

.cart-name {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  height: 2.8em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 5px;
}

.cart-spec {
  font-size: 12px;
  color: var(--gray-color);
  margin-bottom: 10px;
}

.cart-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cart-price {
  font-size: 16px;
  font-weight: bold;
  color: var(--primary-color);
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.quantity-control button {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-color);
  border-radius: 50%;
  font-size: 16px;
}

.cart-delete {
  width: 30px;
  height: 30px;
  border: none;
  background: #f5f5f5;
  color: var(--gray-color);
  font-size: 20px;
  border-radius: 50%;
  margin-left: 10px;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  padding: 10px;
  border-top: 1px solid var(--border-color);
}

.bottom-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.bottom-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.total-info {
  font-size: 14px;
}

.total-price {
  font-size: 18px;
  font-weight: bold;
  color: var(--primary-color);
}

.btn-checkout {
  padding: 12px 30px;
  background: var(--primary-color);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
}

.btn-checkout:disabled {
  background: #ccc;
}
</style>