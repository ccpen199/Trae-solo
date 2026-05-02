<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { request } from '@/utils/api'
import { showConfirmDialog, showLoadingToast, closeToast, showToast } from 'vant'
import type { CartItem } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const items = computed(() => cartStore.items)
const totalCount = computed(() => cartStore.totalCount)
const totalAmount = computed(() => cartStore.totalAmount)
const tableNumber = computed(() => cartStore.tableNumber)

const customerRemarks = ref('')

const updateQuantity = (item: CartItem, quantity: number) => {
  cartStore.updateQuantity(item.id, quantity)
}

const removeItem = async (item: CartItem) => {
  try {
    await showConfirmDialog({
      title: '提示',
      message: `确定要移除"${item.name}"吗？`,
    })
    cartStore.removeItem(item.id)
  } catch {
    // 用户取消
  }
}

const submitOrder = async () => {
  if (items.value.length === 0) {
    showToast('购物车为空')
    return
  }

  showLoadingToast({
    message: '提交订单中...',
    forbidClick: true,
  })

  try {
    const orderData = {
      tableId: cartStore.tableId,
      orderType: 'dine_in',
      guestCount: 2,
      items: items.value.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        specifications: item.specifications,
        customerRemarks: '',
      })),
      customerRemarks: customerRemarks.value,
      source: 'scan',
    }

    const result = await request.post('/orders', orderData)

    if (result) {
      cartStore.setOrderId(result.id)
      cartStore.clearCart()
      closeToast()
      showToast({ message: '订单提交成功', type: 'success' })
      router.push(`/order/${result.id}`)
    }
  } catch (error: any) {
    closeToast()
    showToast({ message: error.response?.data?.message || '提交失败', type: 'fail' })
  }
}

const goToMenu = () => {
  router.push('/menu')
}
</script>

<template>
  <div class="cart-page">
    <van-nav-bar
      title="购物车"
      left-text="返回"
      @click-left="$router.back()"
    />

    <div class="table-info">
      <van-icon name="location" color="#ff6b00" />
      <span>桌号：{{ tableNumber }}</span>
    </div>

    <div class="cart-content">
      <div v-if="items.length === 0" class="empty-cart">
        <van-icon name="shopping-cart-o" size="80" color="#ddd" />
        <p>购物车是空的</p>
        <van-button type="primary" size="large" @click="goToMenu">
          去点餐
        </van-button>
      </div>

      <div v-else class="cart-items">
        <div v-for="item in items" :key="item.id" class="cart-item">
          <div class="item-image">
            <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.name" />
            <van-icon v-else name="photo" size="48" color="#ddd" />
          </div>

          <div class="item-info">
            <h4 class="item-name">{{ item.name }}</h4>
            <p class="item-spec" v-if="item.specifications">
              {{ item.specifications }}
            </p>
            <div class="item-footer">
              <span class="item-price">¥{{ item.price }}</span>
              <div class="stepper-wrapper">
                <van-stepper
                  v-model="item.quantity"
                  :min="0"
                  :max="99"
                  @change="(val) => updateQuantity(item, val)"
                />
                <van-icon
                  name="delete-o"
                  color="#999"
                  size="18"
                  @click="removeItem(item)"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="remarks-section">
          <van-field
            v-model="customerRemarks"
            type="textarea"
            placeholder="请输入备注信息（可选）"
            :maxlength="200"
            show-word-limit
            autosize
          />
        </div>
      </div>
    </div>

    <van-submit-bar
      v-if="items.length > 0"
      :price="totalAmount * 100"
      button-text="提交订单"
      @submit="submitOrder"
    >
      <template #left>
        <div class="cart-summary">
          <span>共{{ totalCount }}件</span>
        </div>
      </template>
    </van-submit-bar>
  </div>
</template>

<style scoped>
.cart-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  padding-bottom: 50px;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff;
  font-size: 14px;
  color: #666;
  border-bottom: 1px solid #eee;
}

.cart-content {
  flex: 1;
  overflow-y: auto;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;

  p {
    margin: 0;
    font-size: 14px;
    color: #999;
  }
}

.cart-items {
  padding: 12px;
}

.cart-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.item-image {
  width: 70px;
  height: 70px;
  border-radius: 8px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.item-name {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.item-spec {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #999;
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.item-price {
  font-size: 16px;
  font-weight: 600;
  color: #ff6b00;
}

.stepper-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.remarks-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.cart-summary {
  font-size: 14px;
  color: #666;
}

:deep(.van-submit-bar__price) {
  color: #ff6b00;
  font-size: 18px;
  font-weight: 600;
}

:deep(.van-submit-bar__button) {
  background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
  border-radius: 20px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 500;
}
</style>
