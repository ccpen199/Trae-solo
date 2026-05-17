<template>
  <div class="cart-page">
    <h2 class="page-title">购物车</h2>
    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="5" animated />
    </div>
    <div v-else-if="cartItems.length === 0" class="empty-state">
      <div class="empty-icon">🛒</div>
      <div class="empty-text">购物车还是空的</div>
      <el-button type="primary" @click="$router.push('/shop')">去购物</el-button>
    </div>
    <div v-else class="cart-content">
      <div class="cart-list">
        <div v-for="item in cartItems" :key="item.id" class="cart-item card">
          <img :src="item.images?.[0] || item.product_image" class="item-image" />
          <div class="item-info">
            <h3 class="item-name">{{ item.name || item.product_name }}</h3>
            <p class="item-price">¥{{ item.price?.toFixed(2) }}</p>
          </div>
          <div class="item-quantity">
            <el-button size="small" @click="updateQuantity(item, item.quantity - 1)" :disabled="item.quantity <= 1">-</el-button>
            <span class="quantity-num">{{ item.quantity }}</span>
            <el-button size="small" @click="updateQuantity(item, item.quantity + 1)">+</el-button>
          </div>
          <el-button type="danger" size="small" @click="removeItem(item.id)">删除</el-button>
        </div>
      </div>
      <div class="cart-summary card">
        <div class="summary-row">
          <span>商品数量</span>
          <span>{{ totalQuantity }} 件</span>
        </div>
        <div class="summary-row total">
          <span>合计</span>
          <span class="total-price">¥{{ totalAmount.toFixed(2) }}</span>
        </div>
        <el-button type="primary" size="large" class="checkout-btn" @click="checkout">
          结算
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const cartItems = ref([])

const totalQuantity = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
})

const totalAmount = computed(() => {
  return cartItems.value.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0)
})

const fetchCart = async () => {
  loading.value = true
  try {
    const res = await request.get('/cart')
    cartItems.value = res.data?.list || []
  } catch (error) {
    console.error('获取购物车失败:', error)
  } finally {
    loading.value = false
  }
}

const updateQuantity = async (item, quantity) => {
  try {
    await request.put(`/cart/${item.id}`, { quantity })
    item.quantity = quantity
  } catch (error) {
    console.error('更新数量失败:', error)
  }
}

const removeItem = async (itemId) => {
  try {
    await request.delete(`/cart/${itemId}`)
    cartItems.value = cartItems.value.filter(item => item.id !== itemId)
    ElMessage.success('已删除')
  } catch (error) {
    console.error('删除失败:', error)
  }
}

const checkout = () => {
  ElMessage.success('订单提交成功！')
}

onMounted(() => {
  fetchCart()
})
</script>

<style lang="scss" scoped>
.cart-page {
  max-width: 1000px;
  margin: 0 auto;

  .page-title {
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 20px;
  }

  .cart-content {
    display: flex;
    gap: 20px;
  }

  .cart-list {
    flex: 1;
  }

  .cart-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    margin-bottom: 12px;

    .item-image {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 8px;
    }

    .item-info {
      flex: 1;

      .item-name {
        font-size: 16px;
        font-weight: 600;
        margin: 0 0 8px 0;
      }

      .item-price {
        font-size: 18px;
        color: #ff2442;
        font-weight: 600;
        margin: 0;
      }
    }

    .item-quantity {
      display: flex;
      align-items: center;
      gap: 8px;

      .quantity-num {
        font-size: 16px;
        font-weight: 600;
        min-width: 30px;
        text-align: center;
      }
    }
  }

  .cart-summary {
    width: 300px;
    padding: 20px;
    height: fit-content;

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 12px;
      font-size: 14px;

      &.total {
        font-size: 18px;
        font-weight: 600;
        padding-top: 12px;
        border-top: 1px solid #eee;

        .total-price {
          color: #ff2442;
        }
      }
    }

    .checkout-btn {
      width: 100%;
      margin-top: 16px;
    }
  }
}
</style>
