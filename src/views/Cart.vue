<template>
  <div class="cart-container">
    <van-nav-bar title="购物车" right-text="编辑" @click-right="toggleEdit">
      <template #left>
        <span v-if="!appStore.isLoggedIn" class="login-tip" @click="goToLogin">请登录</span>
      </template>
    </van-nav-bar>

    <div v-if="!appStore.isLoggedIn" class="empty-cart login-empty">
      <div class="empty-icon">🛒</div>
      <p>请先登录</p>
      <van-button type="primary" @click="goToLogin">立即登录</van-button>
    </div>

    <div v-else-if="appStore.cartItems.length === 0" class="empty-cart">
      <div class="empty-icon">🛒</div>
      <p>购物车空空如也</p>
      <van-button type="primary" @click="goToHome">去逛逛</van-button>
    </div>

    <div v-else class="cart-content">
      <div class="cart-list">
        <div 
          v-for="item in appStore.cartItems" 
          :key="item.id" 
          class="cart-item"
        >
          <van-checkbox 
            v-model="selectedItems" 
            :name="item.id"
            @change="updateTotal"
          />
          <img :src="item.image" class="item-image" />
          <div class="item-info">
            <p class="item-name">{{ item.name }}</p>
            <p class="item-unit">{{ item.unit }}</p>
            <div class="item-bottom">
              <span class="item-price">¥{{ item.price }}</span>
              <van-stepper 
                v-model="item.quantity" 
                @change="onQuantityChange(item.id, $event)"
                min="1"
              />
            </div>
          </div>
          <van-icon 
            v-if="isEditing" 
            name="delete-o" 
            class="delete-icon"
            @click="removeItem(item.id)"
          />
        </div>
      </div>

      <div class="cart-footer">
        <van-checkbox 
          v-model="selectAll" 
          @change="toggleSelectAll"
        >
          <span>全选</span>
        </van-checkbox>
        <div class="footer-right">
          <div class="total-section">
            <span class="total-label">合计:</span>
            <span class="total-price">¥{{ totalPrice.toFixed(2) }}</span>
          </div>
          <van-button 
            type="primary" 
            class="checkout-btn"
            :disabled="selectedItems.length === 0"
            @click="checkout"
          >
            结算({{ selectedCount }})
          </van-button>
        </div>
      </div>
    </div>

    <van-tabbar v-model="activeTab" active-color="#ff6b35" inactive-color="#999">
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="play-circle-o" to="/food">美食</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart-o" to="/cart" :badge="appStore.cartCount() > 0 ? appStore.cartCount() : 0">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/user">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { showToast } from 'vant'

const router = useRouter()
const appStore = useAppStore()

const isEditing = ref(false)
const activeTab = ref(2)
const selectedItems = ref([])
const selectAll = ref(false)

const selectedCount = computed(() => {
  return selectedItems.value.length
})

const totalPrice = computed(() => {
  return selectedItems.value.reduce((sum, itemId) => {
    const item = appStore.cartItems.find(i => i.id === itemId)
    return sum + (item ? item.price * item.quantity : 0)
  }, 0)
})

watch(() => appStore.cartItems.length, () => {
  if (appStore.cartItems.length === 0) {
    selectedItems.value = []
    selectAll.value = false
  } else if (selectAll.value) {
    selectedItems.value = appStore.cartItems.map(i => i.id)
  }
})

const toggleEdit = () => {
  isEditing.value = !isEditing.value
}

const goToLogin = () => {
  appStore.login()
}

const goToHome = () => {
  router.push('/home')
}

const toggleSelectAll = () => {
  if (selectAll.value) {
    selectedItems.value = appStore.cartItems.map(item => item.id)
  } else {
    selectedItems.value = []
  }
}

const updateTotal = () => {
  selectAll.value = selectedItems.value.length === appStore.cartItems.length
}

const onQuantityChange = (itemId, quantity) => {
  appStore.updateCartQuantity(itemId, quantity)
}

const removeItem = (itemId) => {
  appStore.removeFromCart(itemId)
  const index = selectedItems.value.indexOf(itemId)
  if (index > -1) {
    selectedItems.value.splice(index, 1)
  }
}

const checkout = () => {
  if (selectedItems.value.length === 0) {
    showToast('请选择商品')
    return
  }
  showToast('结算成功')
}
</script>

<style scoped>
.cart-container {
  min-height: 100vh;
  background: #f7f8fa;
}

.login-tip {
  color: #ff6b35;
  font-size: 14px;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 100px;
}

.login-empty {
  padding-top: 150px;
}

.empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
}

.empty-cart p {
  color: #999;
  font-size: 16px;
  margin-bottom: 24px;
}

.cart-content {
  padding-bottom: 120px;
}

.cart-list {
  padding: 16px;
}

.cart-item {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
  position: relative;
}

.cart-item .van-checkbox {
  margin-right: 12px;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}

.item-info {
  flex: 1;
  margin-left: 12px;
}

.item-name {
  font-size: 14px;
  color: #333;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-unit {
  font-size: 12px;
  color: #999;
  margin: 4px 0;
}

.item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.item-price {
  color: #ff6b35;
  font-size: 16px;
  font-weight: bold;
}

.delete-icon {
  position: absolute;
  right: 12px;
  color: #999;
  font-size: 20px;
}

.cart-footer {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  background: #fff;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.footer-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
}

.total-section {
  display: flex;
  align-items: baseline;
}

.total-label {
  color: #666;
  font-size: 14px;
}

.total-price {
  color: #ff6b35;
  font-size: 20px;
  font-weight: bold;
  margin-left: 4px;
}

.checkout-btn {
  background: #ff6b35;
  border: none;
  padding: 10px 30px;
  border-radius: 25px;
}

.checkout-btn:disabled {
  background: #ccc;
}
</style>
