<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { request } from '@/utils/api'
import { showLoadingToast, closeToast, showToast } from 'vant'
import type { CartItem } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const activeCategory = ref(0)
const categories = ref<any[]>([])
const menuItems = ref<any[]>([])
const loading = ref(false)

const hasItems = computed(() => cartStore.hasItems)
const totalCount = computed(() => cartStore.totalCount)
const totalAmount = computed(() => cartStore.totalAmount)

const filteredItems = computed(() => {
  if (categories.value.length === 0) return []
  const category = categories.value[activeCategory.value]
  return category?.items || []
})

const fetchMenu = async () => {
  loading.value = true
  showLoadingToast({
    message: '加载菜单中...',
    forbidClick: true,
  })

  try {
    const data = await request.get('/menu/customer')
    categories.value = data
  } catch (error) {
      showToast({ message: '加载菜单失败', type: 'fail' })
    } finally {
    loading.value = false
    closeToast()
  }
}

const getItemQuantity = (menuItemId: string, specifications?: string): number => {
  const item = cartStore.items.find(
    (i) => i.menuItemId === menuItemId && i.specifications === specifications
  )
  return item?.quantity || 0
}

const handleAdd = (menuItem: any, quantity: number = 1) => {
  cartStore.addItem(
    {
      id: menuItem.id,
      name: menuItem.name,
      price: menuItem.price,
      imageUrl: menuItem.imageUrl,
      attributes: menuItem.attributes,
    },
    quantity
  )
}

const handleRemove = (menuItemId: string, specifications?: string) => {
  const item = cartStore.items.find(
    (i) => i.menuItemId === menuItemId && i.specifications === specifications
  )
  if (item) {
    cartStore.updateQuantity(item.id, item.quantity - 1)
  }
}

const goToCart = () => {
  router.push('/cart')
}

const getSpiceLabel = (level?: string) => {
  const labels: Record<string, string> = {
    none: '不辣',
    mild: '微辣',
    medium: '中辣',
    spicy: '特辣',
  }
  return labels[level || 'none']
}

onMounted(() => {
  fetchMenu()
  cartStore.loadFromLocalStorage()
})
</script>

<template>
  <div class="menu-page">
    <van-nav-bar
      title="菜单"
      left-text="退出"
      @click-left="$router.push('/scan')"
    />

    <div class="table-info">
      <van-icon name="location" color="#ff6b00" />
      <span>桌号：{{ cartStore.tableNumber }}</span>
    </div>

    <div class="menu-content">
      <div class="category-sidebar">
        <div
          v-for="(category, index) in categories"
          :key="category.id"
          :class="['category-item', { active: activeCategory === index }"
          @click="activeCategory = index"
        >
          <span>{{ category.name }}</span>
          <div
            v-if="category.items?.length > 0"
            class="category-badge"
          >
            {{ category.items.length }}
          </div>
        </div>
      </div>

      <div class="items-list">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="menu-item"
        >
          <div class="item-image">
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.name"
            />
            <van-icon
              v-else
              name="photo"
              size="48"
              color="#ddd"
            />
          </div>

          <div class="item-info">
            <div class="item-header">
              <h3 class="item-name">{{ item.name }}</h3>
              <div class="item-tags">
                <van-tag
                  v-if="item.attributes?.spicy"
                  type="danger"
                  size="mini"
                >
                  辣
                </van-tag>
                <van-tag
                  v-if="item.attributes?.vegetarian"
                  type="success"
                  size="mini"
                >
                  素
                </van-tag>
                <van-tag
                  v-if="item.attributes?.new"
                  type="primary"
                  size="mini"
                >
                  新
                </van-tag>
                <van-tag
                  v-if="item.attributes?.recommended"
                  type="warning"
                  size="mini"
                >
                  推荐
                </van-tag>
              </div>
            </div>

            <p class="item-desc" v-if="item.description">
              {{ item.description }}
            </p>

            <div class="item-footer">
              <div class="item-price">
                <span class="price-symbol">¥</span>
                <span class="price-value">{{ item.price }}</span>
                <span
                  v-if="item.originalPrice > item.price"
                  class="price-original"
                >
                  ¥{{ item.originalPrice }}
                </span>
              </div>

              <div class="item-stepper">
                <template v-if="getItemQuantity(item.id) > 0">
                  <van-icon
                  name="minus"
                  size="20"
                  color="#ff6b00"
                  @click="handleRemove(item.id)"
                  />
                  <span class="stepper-value">{{ getItemQuantity(item.id) }}</span>
                </template>
                <van-icon
                  name="plus"
                  size="20"
                  color="#ff6b00"
                  @click="handleAdd(item)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <van-submit-bar
      v-if="hasItems"
      :price="totalAmount * 100"
      button-text="去结算"
      @submit="goToCart"
    >
      <template #left>
        <div class="cart-summary">
          <div class="cart-icon-wrapper">
            <van-icon name="shopping-cart" size="24" color="#fff" />
            <van-badge
              v-if="totalCount > 0"
              :content="totalCount"
              class="cart-badge"
            />
          </div>
          <div class="cart-info">
            <span class="cart-label">共{{ totalCount }}件</span>
          </div>
        </div>
      </template>
    </van-submit-bar>
  </div>
</template>

<style scoped>
.menu-page {
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

.menu-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.category-sidebar {
  width: 90px;
  background: #fafafa;
  overflow-y: auto;
}

.category-item {
  padding: 16px 12px;
  font-size: 13px;
  color: #666;
  text-align: center;
  position: relative;
  cursor: pointer;

  &.active {
    background: #fff;
    color: #ff6b00;
    font-weight: 500;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 3px;
      height: 20px;
      background: #ff6b00;
      border-radius: 0 2px 2px 0;
    }
  }

  .category-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    min-width: 16px;
    height: 16px;
    background: #ff6b00;
    border-radius: 8px;
    font-size: 10px;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.items-list {
  flex: 1;
  background: #fff;
  overflow-y: auto;
  padding: 12px;
}

.menu-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.item-image {
  width: 80px;
  height: 80px;
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

.item-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;

  .item-name {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: #333;
    flex: 1;
  }

  .item-tags {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
}

.item-desc {
  margin: 4px 0 8px 0;
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.item-price {
  display: flex;
  align-items: baseline;
  gap: 4px;

  .price-symbol {
    font-size: 12px;
    color: #ff6b00;
  }

  .price-value {
    font-size: 18px;
    font-weight: 600;
    color: #ff6b00;
  }

  .price-original {
    font-size: 12px;
    color: #999;
    text-decoration: line-through;
  }
}

.item-stepper {
  display: flex;
  align-items: center;
  gap: 12px;

  .stepper-value {
    font-size: 14px;
    font-weight: 500;
    color: #333;
    min-width: 20px;
    text-align: center;
  }
}

.cart-summary {
  display: flex;
  align-items: center;
  gap: 8px;

  .cart-icon-wrapper {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: -10px;
  }

  .cart-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background: #ee0a24;
  }

  .cart-info {
    display: flex;
    flex-direction: column;

    .cart-label {
      font-size: 12px;
      color: #999;
    }
  }
}

:deep(.van-submit-bar__bar) {
  padding: 0 16px;
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
