<template>
  <div class="product-detail-page">
    <van-nav-bar
      title="商品详情"
      left-arrow
      @click-left="goBack"
    >
      <template #right>
        <van-icon name="share-o" size="20" @click="handleShare" />
      </template>
    </van-nav-bar>

    <div class="detail-content">
      <div class="swiper-wrapper" @click="showImagePreview = true">
        <van-swipe
          :autoplay="3000"
          indicator-color="rgba(255,255,255,0.6)"
          indicator-active-color="#fff"
        >
          <van-swipe-item
            v-for="(img, idx) in productImages"
            :key="idx"
          >
            <img :src="img" class="product-image" />
          </van-swipe-item>
        </van-swipe>
      </div>

      <div class="product-info">
        <div class="price-row">
          <span class="current-price">{{ productData.price }}</span>
          <span class="original-price" v-if="productData.original_price > productData.price">
            ¥{{ productData.original_price }}
          </span>
          <div class="sales">已售{{ productData.sales }}</div>
        </div>

        <div class="product-name">{{ productData.name }}</div>
        <div class="product-desc">{{ productData.description || '品质保证' }}</div>

        <div class="tags">
          <span class="tag" v-if="productData.is_hot">热销</span>
          <span class="tag" v-if="productData.is_new">新品</span>
          <span class="tag" v-if="productData.is_recommend">推荐</span>
        </div>
      </div>
    </div>

    <van-cell-group inset class="info-group">
      <van-cell title="库存" :value="`${productData.stock}件`" is-link />
      <van-cell title="服务">
        <template #value>
          <div class="service-tags">
            <span class="service-tag">正品保障</span>
            <span class="service-tag">7天无理由</span>
            <span class="service-tag">极速发货</span>
          </div>
        </template>
      </van-cell>
    </van-cell-group>

    <van-cell-group inset class="detail-group">
      <van-cell title="商品详情" is-link />
    </van-cell-group>

    <div class="detail-content" v-if="productData.details">
      <div class="section-title">商品详情</div>
      <div class="detail-html" v-html="productData.details"></div>
    </div>

    <div class="bottom-bar">
      <div class="bar-actions">
        <div class="action-item" @click="goHome">
          <van-icon name="home-o" size="20" color="#646566" />
          <span>首页</span>
        </div>
        <div class="action-item" @click="toggleFavorite" :class="{ active: isFavorite }">
          <van-icon :name="isFavorite ? 'star' : 'star-o'" size="20" :color="isFavorite ? '#ff976a' : '#646566'" />
          <span>收藏</span>
        </div>
        <div class="action-item" @click="goCart">
          <van-icon name="shopping-cart-o" size="20" color="#646566" :badge="cartCount" />
          <span>购物车</span>
        </div>
        <div class="action-item" @click="handleContact">
          <van-icon name="service-o" size="20" color="#646566" />
          <span>客服</span>
        </div>
      </div>
      <div class="bar-buttons">
        <van-button type="warning" size="large" @click="addToCart" class="cart-btn">
          加入购物车
        </van-button>
        <van-button type="danger" size="large" @click="showBuyPopup = true" class="buy-btn">
          立即购买
        </van-button>
      </div>
    </div>

    <van-popup
      v-model:show="showBuyPopup"
      round
      position="bottom"
      :style="{ height: '60%' }"
    >
      <div class="buy-popup">
        <div class="popup-header">
          <span class="popup-title">确认购买</span>
          <van-icon name="cross" size="20" @click="showBuyPopup = false" />
        </div>
        <div class="popup-content">
          <div class="product-preview">
            <img :src="productData.main_image" class="preview-image" />
            <div class="preview-info">
              <div class="preview-name">{{ productData.name }}</div>
              <div class="preview-price">
                <span class="current-price">{{ productData.price }}</span>
                <span class="stock-text">库存{{ productData.stock }}件</span>
              </div>
            </div>
          </div>

          <div class="quantity-row">
            <span class="label">购买数量</span>
            <van-stepper
              v-model="buyQuantity"
              :min="1"
              :max="productData.stock"
            />
          </div>

          <div class="total-row">
            <span class="label">合计</span>
            <span class="total-price">{{ (productData.price * buyQuantity).toFixed(2) }}</span>
          </div>
        </div>
        <div class="popup-footer">
          <van-button type="danger" block size="large" @click="handleBuy">
            确认购买 ¥{{ (productData.price * buyQuantity).toFixed(2) }}
          </van-button>
        </div>
      </div>
    </van-popup>

    <van-image-preview
      v-model:show="showImagePreview"
      :images="productImages"
      :start-position="0"
    />

    <van-loading v-if="loading" type="spinner" color="#1989fa" class="global-loading" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { getProductDetail, toggleFavorite as toggleFavoriteApi, addToCart, getCart, createOrder, payOrder } from '../../api/product'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const productId = computed(() => route.params.id)
const loading = ref(false)
const productData = ref({})
const isFavorite = ref(false)
const cartCount = ref(0)
const showImagePreview = ref(false)
const showBuyPopup = ref(false)
const buyQuantity = ref(1)

const productImages = computed(() => {
  if (productData.value.images && Array.isArray(productData.value.images)) {
    return productData.value.images
  }
  if (productData.value.main_image) {
    return [productData.value.main_image]
  }
  return []
})

const fetchProductDetail = async () => {
  loading.value = true
  try {
    const res = await getProductDetail(productId.value)
    productData.value = res.data
    isFavorite.value = res.data.is_favorite || false
  } catch (error) {
    console.error('获取商品详情失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchCartCount = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await getCart()
    cartCount.value = res.data.total_count || 0
  } catch (error) {
    console.error('获取购物车数量失败:', error)
  }
}

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/home')
}

const goCart = () => {
  router.push('/cart')
}

const handleShare = () => {
  showToast('分享功能')
}

const handleContact = () => {
  showToast('客服功能')
}

const toggleFavorite = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  try {
    const res = await toggleFavoriteApi({ productId: productId.value })
    isFavorite.value = res.data.is_favorite
    showSuccessToast(res.message)
  } catch (error) {
    console.error('收藏失败:', error)
  }
}

const addToCart = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  if (productData.value.stock <= 0) {
    showToast('库存不足')
    return
  }
  try {
    const res = await addToCart({ productId: productId.value, quantity: 1 })
    cartCount.value = res.data.cart_count || 0
    showSuccessToast('已加入购物车')
  } catch (error) {
    console.error('加入购物车失败:', error)
  }
}

const handleBuy = async () => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  if (productData.value.stock < buyQuantity.value) {
    showToast('库存不足')
    return
  }
  try {
    const createRes = await createOrder({
      items: [{ productId: productId.value, quantity: buyQuantity.value }]
    })
    const payRes = await payOrder({ orderId: createRes.data.orderId, payType: 'balance' })
    showSuccessToast('购买成功')
    showBuyPopup.value = false
    setTimeout(() => {
      router.push('/orders')
    }, 1000)
  } catch (error) {
    console.error('购买失败:', error)
  }
}

onMounted(() => {
  fetchProductDetail()
  fetchCartCount()
})
</script>

<style lang="less" scoped>
.product-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 60px;
}

.detail-content {
  padding: 12px;
}

.swiper-wrapper {
  margin: -12px -12px 0 -12px;
  background: #fff;

  .van-swipe {
    height: 375px;
  }

  .product-image {
    width: 100%;
    height: 375px;
    object-fit: cover;
  }
}

.product-info {
  background: #fff;
  padding: 16px;
  margin: 0 -12px;

  .price-row {
    display: flex;
    align-items: baseline;
    margin-bottom: 12px;

    .current-price {
      font-size: 24px;
      font-weight: 600;
      color: #ee0a24;

      &::before {
        content: '¥';
        font-size: 0.8em;
      }
    }

    .original-price {
      font-size: 14px;
      color: #969799;
      text-decoration: line-through;
      margin-left: 12px;
    }

    .sales {
      margin-left: auto;
      font-size: 12px;
      color: #969799;
    }
  }

  .product-name {
    font-size: 16px;
    font-weight: 500;
    color: #323233;
    margin-bottom: 8px;
  }

  .product-desc {
    font-size: 13px;
    color: #646566;
    margin-bottom: 12px;
  }

  .tags {
    display: flex;
    gap: 8px;

    .tag {
      padding: 2px 8px;
      background: #fff0f0;
      color: #ee0a24;
      font-size: 11px;
      border-radius: 4px;
    }
  }
}

.info-group {
  margin: 12px 0;
}

.service-tags {
  display: flex;
  gap: 8px;

  .service-tag {
    padding: 2px 8px;
    background: #f7f8fa;
    color: #646566;
    font-size: 11px;
    border-radius: 4px;
  }
}

.detail-group {
  margin: 12px 0;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #323233;
  padding: 12px 0;
}

.detail-html {
  background: #fff;
  padding: 16px;
  border-radius: 12px;
  font-size: 14px;
  color: #646566;
  line-height: 1.8;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  background: #fff;
  padding: 8px 12px;
  padding-bottom: calc(8px + constant(safe-area-inset-bottom));
  padding-bottom: calc(8px + env(safe-area-inset-bottom));
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
  z-index: 100;

  .bar-actions {
    display: flex;
    gap: 16px;
    margin-right: 16px;

    .action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;

      &.active {
        .van-icon,
        span {
          color: #ff976a;
        }
      }

      span {
        font-size: 10px;
        color: #646566;
        margin-top: 2px;
      }
    }
  }

  .bar-buttons {
    flex: 1;
    display: flex;
    gap: 12px;

    .cart-btn {
      flex: 1;
      border-radius: 20px;
      background: linear-gradient(135deg, #ff976a, #ff7d00);
      border: none;
    }

    .buy-btn {
      flex: 1;
      border-radius: 20px;
      background: linear-gradient(135deg, #ee0a24, #ff4d4f);
      border: none;
    }
  }
}

.buy-popup {
  height: 100%;
  display: flex;
  flex-direction: column;

  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #ebedf0;

    .popup-title {
      font-size: 16px;
      font-weight: 600;
    }
  }

  .popup-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;

    .product-preview {
      display: flex;
      padding: 16px;
      background: #f7f8fa;
      border-radius: 12px;
      margin-bottom: 20px;

      .preview-image {
        width: 80px;
        height: 80px;
        border-radius: 8px;
        object-fit: cover;
        margin-right: 12px;
      }

      .preview-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;

        .preview-name {
          font-size: 14px;
          color: #323233;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .preview-price {
          display: flex;
          align-items: baseline;
          justify-content: space-between;

          .current-price {
            font-size: 18px;
            font-weight: 600;
            color: #ee0a24;

            &::before {
              content: '¥';
              font-size: 0.8em;
            }
          }

          .stock-text {
            font-size: 12px;
            color: #969799;
          }
        }
      }
    }

    .quantity-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #f7f8fa;

      .label {
        font-size: 14px;
        color: #646566;
      }
    }

    .total-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 0;
      margin-top: 12px;

      .label {
        font-size: 14px;
        color: #323233;
      }

      .total-price {
        font-size: 20px;
        font-weight: 600;
        color: #ee0a24;

        &::before {
          content: '¥';
          font-size: 0.8em;
        }
      }
    }
  }

  .popup-footer {
    padding: 16px 20px;
    border-top: 1px solid #ebedf0;
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
