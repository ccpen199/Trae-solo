<template>
  <div class="cart-container">
    <van-nav-bar title="购物车" />
    
    <div class="cart-content" v-if="cartData.items.length > 0">
      <div 
        v-for="item in cartData.items" 
        :key="item.id" 
        class="cart-item"
      >
        <van-checkbox v-model="selectedItems" :value="item.id" />
        <img :src="item.image" :alt="item.name" class="item-img" @click="goProductDetail(item.product_id)" />
        <div class="item-info">
          <span class="item-name" @click="goProductDetail(item.product_id)">{{ item.name }}</span>
          <span class="item-price">¥{{ item.price }}</span>
          <van-stepper 
            v-model="item.quantity" 
            :min="1" 
            :max="item.stock"
            @change="(val) => updateQuantity(item.id, val)"
          />
        </div>
        <van-icon name="delete" class="delete-icon" @click="deleteItem(item.id)" />
      </div>
    </div>
    
    <van-empty v-else description="购物车是空的" />
    
    <div class="bottom-bar" v-if="cartData.items.length > 0">
      <van-checkbox v-model="selectAll" @change="toggleSelectAll">全选</van-checkbox>
      <div class="total-info">
        <span class="total-text">合计:</span>
        <span class="total-price">¥{{ cartData.totalPrice.toFixed(2) }}</span>
      </div>
      <van-button type="primary" @click="checkout">结算({{ selectedCount }})</van-button>
    </div>
    
    <van-tabbar v-model="activeTab" route>
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="search" to="/search">搜索</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart" to="/cart" :badge="cartData.totalCount">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { NavBar, Checkbox, Stepper, Icon, Empty, Tabbar, TabbarItem, Button, showToast } from 'vant'
import { cartApi } from '../services/api'

const router = useRouter()
const cartData = ref({ items: [], totalPrice: 0, totalCount: 0 })
const selectedItems = ref([])
const activeTab = ref(2)

const selectAll = computed({
  get: () => cartData.value.items.length > 0 && selectedItems.value.length === cartData.value.items.length,
  set: (val) => {
    if (val) {
      selectedItems.value = cartData.value.items.map(item => item.id)
    } else {
      selectedItems.value = []
    }
  }
})

const selectedCount = computed(() => selectedItems.value.length)

const toggleSelectAll = (val) => {
  if (val) {
    selectedItems.value = cartData.value.items.map(item => item.id)
  } else {
    selectedItems.value = []
  }
}

const goProductDetail = (id) => {
  router.push(`/product/${id}`)
}

const updateQuantity = (id, quantity) => {
  cartApi.updateCart(id, { quantity }).then(res => {
    if (res.code === 200) {
      loadCart()
    } else {
      showToast(res.message)
    }
  })
}

const deleteItem = (id) => {
  cartApi.deleteCart(id).then(res => {
    if (res.code === 200) {
      loadCart()
      selectedItems.value = selectedItems.value.filter(itemId => itemId !== id)
    } else {
      showToast(res.message)
    }
  })
}

const checkout = () => {
  if (selectedItems.value.length === 0) {
    showToast('请选择商品')
    return
  }
  showToast('结算功能开发中')
}

const loadCart = () => {
  cartApi.getCart().then(res => {
    if (res.code === 200) {
      cartData.value = res.data
    }
  })
}

onMounted(() => {
  loadCart()
})
</script>

<style scoped>
.cart-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120px;
}

.cart-content {
  padding: 10px;
}

.cart-item {
  display: flex;
  align-items: center;
  background: white;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 8px;
}

.item-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 15px;
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-name {
  font-size: 14px;
  color: #333;
}

.item-price {
  font-size: 16px;
  color: #ff4444;
  font-weight: bold;
}

.delete-icon {
  color: #999;
  font-size: 20px;
}

.bottom-bar {
  position: fixed;
  bottom: 60px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  background: white;
  padding: 15px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.total-info {
  flex: 1;
  text-align: right;
  margin-right: 15px;
}

.total-text {
  font-size: 14px;
  color: #666;
}

.total-price {
  font-size: 20px;
  color: #ff4444;
  font-weight: bold;
}
</style>