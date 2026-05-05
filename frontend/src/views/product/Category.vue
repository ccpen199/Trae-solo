<template>
  <div class="category-page">
    <div class="category-header">
      <div class="header-title">商品分类</div>
    </div>

    <div class="category-content">
      <div class="left-nav">
        <div
          class="nav-item"
          :class="{ active: activeCategoryId === item.id }"
          v-for="item in categoryList"
          :key="item.id"
          @click="selectCategory(item.id)"
        >
          <span>{{ item.icon }}</span>
          <span class="nav-text">{{ item.name }}</span>
        </div>
      </div>

      <div class="right-content">
        <div class="category-group" v-if="currentProducts.length > 0">
          <div class="group-title">{{ activeCategory?.name || '全部商品' }}</div>
          <div class="product-grid">
            <div
              class="product-item"
              v-for="product in currentProducts"
              :key="product.id"
              @click="goProductDetail(product.id)"
            >
              <img :src="product.main_image" class="product-image" />
              <div class="product-name ellipsis-2">{{ product.name }}</div>
              <div class="product-price">
                <span class="current-price">¥{{ product.price }}</span>
                <span class="original-price" v-if="product.original_price > product.price">
                  ¥{{ product.original_price }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <van-empty description="暂无商品" v-if="currentProducts.length === 0 && !loading" />
      </div>
    </div>

    <van-tabbar v-model="activeTab" class="tab-bar">
      <van-tabbar-item icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item icon="apps-o" to="/category">分类</van-tabbar-item>
      <van-tabbar-item icon="shopping-cart-o" :badge="cartCount" to="/cart">购物车</van-tabbar-item>
      <van-tabbar-item icon="user-o" to="/profile">我的</van-tabbar-item>
    </van-tabbar>

    <van-loading v-if="loading" type="spinner" color="#1989fa" class="page-loading" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getProductList } from '../../api/product'
import { getCart } from '../../api/product'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeTab = ref(1)
const categoryList = ref([
  { id: 0, name: '全部商品', icon: '🏠' },
  { id: 1, name: '热门推荐', icon: '🔥' },
  { id: 2, name: '饮料酒水', icon: '🥤' },
  { id: 3, name: '休闲零食', icon: '🍿' },
  { id: 4, name: '日用百货', icon: '🧴' },
  { id: 5, name: '汽车用品', icon: '🚗' }
])

const productList = ref([])
const activeCategoryId = ref(0)
const loading = ref(false)
const cartCount = ref(0)

const activeCategory = computed(() => {
  return categoryList.value.find(item => item.id === activeCategoryId.value)
})

const currentProducts = computed(() => {
  if (activeCategoryId.value === 0) {
    return productList.value
  }
  return productList.value.filter(item => item.category_id === activeCategoryId.value)
})

const fetchProducts = async () => {
  loading.value = true
  try {
    const res = await getProductList({ page: 1, pageSize: 50 })
    productList.value = res.data.list || []
  } catch (error) {
    console.error('获取商品列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchCartCount = async () => {
  if (!userStore.isLoggedIn) {
    cartCount.value = 0
    return
  }
  try {
    const res = await getCart()
    cartCount.value = res.data.total_count || 0
  } catch (error) {
    console.error('获取购物车数量失败:', error)
  }
}

const selectCategory = (id) => {
  activeCategoryId.value = id
}

const goProductDetail = (id) => {
  router.push(`/product/${id}`)
}

onMounted(() => {
  if (route.query.categoryId) {
    activeCategoryId.value = parseInt(route.query.categoryId)
  }
  fetchProducts()
  fetchCartCount()
})

onActivated(() => {
  fetchCartCount()
})
</script>

<style lang="less" scoped>
.category-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.category-header {
  background: linear-gradient(180deg, #1989fa, #409eff);
  padding: 16px;

  .header-title {
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    text-align: center;
  }
}

.category-content {
  display: flex;
  height: calc(100vh - 120px);
}

.left-nav {
  width: 90px;
  background: #f7f8fa;
  overflow-y: auto;

  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 16px 8px;
    cursor: pointer;
    border-left: 3px solid transparent;

    .nav-text {
      margin-top: 4px;
      font-size: 12px;
      color: #646566;
    }

    &.active {
      background: #fff;
      border-left-color: #1989fa;

      .nav-text {
        color: #1989fa;
        font-weight: 500;
      }
    }
  }
}

.right-content {
  flex: 1;
  background: #fff;
  padding: 12px;
  overflow-y: auto;

  .category-group {
    .group-title {
      font-size: 15px;
      font-weight: 600;
      color: #323233;
      margin-bottom: 12px;
      padding-left: 4px;
    }

    .product-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;

      .product-item {
        width: calc(33.33% - 8px);
        cursor: pointer;

        .product-image {
          width: 100%;
          aspect-ratio: 1;
          border-radius: 8px;
          object-fit: cover;
          margin-bottom: 8px;
        }

        .product-name {
          font-size: 12px;
          color: #323233;
          min-height: 32px;
          margin-bottom: 4px;
        }

        .product-price {
          display: flex;
          align-items: baseline;

          .current-price {
            font-size: 14px;
            font-weight: 600;
            color: #ee0a24;
          }

          .original-price {
            font-size: 10px;
            color: #969799;
            margin-left: 4px;
            text-decoration: line-through;
          }
        }
      }
    }
  }
}

.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.page-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.ellipsis-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
