<template>
  <div class="cart-page">
    <van-nav-bar title="购物车" />

    <div class="cart-content" v-if="!loading">
      <div v-if="cartData.list && cartData.list.length > 0">
        <div class="cart-list">
          <van-checkbox
            v-model="selectAll"
            @change="handleSelectAll"
            class="checkbox-all"
          >
            全选
          </van-checkbox>

          <div
            class="cart-item"
            v-for="item in cartData.list"
            :key="item.id"
          >
            <van-checkbox
              v-model="item.selected"
              @change="handleSelectItem"
            />
            <img
              :src="item.main_image"
              class="product-image"
              @click="goProductDetail(item.id)"
            />
            <div class="product-info">
              <div class="product-name" @click="goProductDetail(item.id)">
                {{ item.name }}
              </div>
              <div class="price-row">
                <span class="current-price">{{ item.price }}</span>
                <van-stepper
                  v-model="item.quantity"
                  :min="1"
                  :max="item.stock"
                  @change="(val) => updateCartItem(item, val)"
                />
              </div>
            </div>
            <van-icon
              name="delete"
              size="18"
              color="#969799"
              @click="removeItem(item.id)"
            />
          </div>
        </div>
      </div>

      <div v-else class="empty-container">
        <van-empty description="购物车是空的">
          <template #image>
            <van-icon name="shopping-cart-o" size="80" color="#ebedf0" />
          </template>
          <van-button type="primary" plain round @click="goHome">
            去逛逛
          </van-button>
        </van-empty>
      </div>
    </div>

    <div class="bottom-bar" v-if="cartData.list && cartData.list.length > 0">
      <van-checkbox
        v-model="selectAll"
        @change="handleSelectAll"
        class="checkbox-all"
      >
        全选
      </van-checkbox>
      <div class="total-info">
        <span class="total-text">合计：</span>
        <span class="total-price">{{ cartData.total_amount.toFixed(2) }}</span>
      </div>
      <van-button
        type="danger"
        size="large"
        :disabled="cartData.selected_count === 0"
        @click="handleCheckout"
        class="checkout-btn"
      >
        结算({{ cartData.selected_count }})
      </van-button>
    </div>

    <van-tabbar v-model="activeTab">
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="apps-o" to="/category">分类</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart-o" :badge="cartData.total_count || 0">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>

    <van-loading v-if="loading" type="spinner" color="#1989fa" class="global-loading" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showDialog } from 'vant'
import { getCart, updateCart, removeFromCart, createOrder, payOrder } from '../../api/product'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref(2)
const loading = ref(false)
const cartData = ref({
  list: [],
  total_amount: 0,
  selected_count: 0,
  total_count: 0
})

const selectAll = ref(false)

const fetchCart = async () => {
  loading.value = true
  try {
    const res = await getCart()
    cartData.value = res.data
    updateSelectAllState()
  } catch (error) {
    console.error('获取购物车失败:', error)
  } finally {
    loading.value = false
  }
}

const updateSelectAllState = () => {
  if (cartData.value.list.length === 0) {
    selectAll.value = false
    return
  }
  selectAll.value = cartData.value.list.every(item => item.selected)
}

const handleSelectAll = (checked) => {
  cartData.value.list.forEach(item => {
    item.selected = checked ? 1 : 0
  })
  updateCartData()
}

const handleSelectItem = () => {
  updateSelectAllState()
  updateCartData()
}

const updateCartData = () => {
  let totalAmount = 0
  let selectedCount = 0

  cartData.value.list.forEach(item => {
    if (item.selected) {
      totalAmount += item.price * item.quantity
      selectedCount += item.quantity
    }
  })

  cartData.value.total_amount = totalAmount
  cartData.value.selected_count = selectedCount
}

const updateCartItem = async (item, quantity) => {
  try {
    await updateCart({ cartId: item.id, quantity })
    updateCartData()
  } catch (error) {
    console.error('更新购物车失败:', error)
  }
}

const removeItem = async (cartId) => {
  try {
    await showDialog({
      title: '提示',
      message: '确定要删除该商品吗？'
    })
    await removeFromCart({ cartIds: [cartId] })
    showSuccessToast('已删除')
    fetchCart()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除商品失败:', error)
    }
  }
}

const handleCheckout = async () => {
  const selectedItems = cartData.value.list.filter(item => item.selected)
  
  if (selectedItems.length === 0) {
    showToast('请选择要结算的商品')
    return
  }

  try {
    const items = selectedItems.map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      cartId: item.id
    }))

    const createRes = await createOrder({ items })
    const payRes = await payOrder({ orderId: createRes.data.orderId, payType: 'balance' })
    
    showSuccessToast('支付成功')
    fetchCart()
  } catch (error) {
    console.error('结算失败:', error)
  }
}

const goHome = () => {
  router.push('/home')
}

const goProductDetail = (id) => {
  router.push(`/product/${id}`)
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    fetchCart()
  } else {
    router.push('/login')
  }
})
</script>

<style lang="less" scoped>
.cart-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.cart-content {
  padding: 12px;
  padding-bottom: 60px;
}

.cart-list {
  background: #fff;
  border-radius: 12px;
  padding: 12px;

  .checkbox-all {
    padding-bottom: 12px;
    border-bottom: 1px solid #f7f8fa;
  }

  .cart-item {
    display: flex;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f7f8fa;

    &:last-child {
      border-bottom: none;
    }

    .product-image {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      object-fit: cover;
      margin: 0 12px;
    }

    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .product-name {
        font-size: 14px;
        color: #323233;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .price-row {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .current-price {
          font-size: 16px;
          font-weight: 600;
          color: #ee0a24;

          &::before {
            content: '¥';
            font-size: 0.8em;
          }
        }
      }
    }
  }
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
}

.bottom-bar {
  position: fixed;
  bottom: 50px;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  background: #fff;
  padding: 8px 16px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  z-index: 100;

  .total-info {
    flex: 1;
    text-align: right;
    padding-right: 12px;

    .total-text {
      font-size: 14px;
      color: #323233;
    }

    .total-price {
      font-size: 18px;
      font-weight: 600;
      color: #ee0a24;

      &::before {
        content: '¥';
        font-size: 0.8em;
      }
    }
  }

  .checkout-btn {
    border-radius: 20px;
    background: linear-gradient(135deg, #ee0a24, #ff4d4f);
    border: none;
    min-width: 100px;
  }
}

.global-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 999;
}
</style>
