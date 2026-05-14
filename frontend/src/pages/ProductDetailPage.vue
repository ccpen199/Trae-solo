<template>
  <div class="product-detail-container">
    <van-nav-bar title="商品详情" left-text="返回" @click-left="goBack" />
    
    <div class="product-content" v-if="product">
      <div class="product-image">
        <img :src="product.image" :alt="product.name" />
      </div>
      
      <div class="product-info">
        <div class="price-row">
          <span class="current-price">¥{{ product.price }}</span>
          <span class="original-price" v-if="product.original_price">¥{{ product.original_price }}</span>
        </div>
        
        <h1 class="product-name">{{ product.name }}</h1>
        <p class="product-desc">{{ product.description }}</p>
        
        <div class="product-meta">
          <span class="meta-item">销量 {{ product.sales }}</span>
          <span class="meta-item">库存 {{ product.stock }}</span>
          <span class="meta-item tag" v-if="product.is_new">新品</span>
          <span class="meta-item tag hot" v-if="product.is_hot">爆款</span>
        </div>
      </div>
      
      <div class="section">
        <h3 class="section-title">商品详情</h3>
        <div class="detail-content">
          <p>商品编号: {{ product.id }}</p>
          <p>分类: {{ categoryName }}</p>
          <p v-if="product.barcode">条形码: {{ product.barcode }}</p>
        </div>
      </div>
    </div>
    
    <div class="bottom-bar">
      <van-button icon="share-o" type="default" @click="shareProduct">分享</van-button>
      <van-button icon="shopping-cart" type="default" @click="goCart">购物车</van-button>
      <van-button type="primary" @click="addToCart">加入购物车</van-button>
      <van-button type="danger" @click="buyNow">立即购买</van-button>
    </div>
    
    <van-popup v-model="showStepper" position="bottom">
      <div class="stepper-content">
        <img :src="product?.image" :alt="product?.name" class="stepper-img" />
        <div class="stepper-info">
          <span class="stepper-name">{{ product?.name }}</span>
          <span class="stepper-price">¥{{ product?.price }}</span>
        </div>
        <van-stepper v-model="quantity" :min="1" :max="product?.stock || 99" />
        <van-button type="primary" block @click="confirmAddToCart">确认加入购物车</van-button>
      </div>
    </van-popup>
    
    <SharePopup v-model:show="showSharePopup" :share-url="shareUrl" :share-title="product?.name" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NavBar, Button, Stepper, Popup, showToast } from 'vant'
import { productApi, cartApi } from '../services/api'
import store from '../store'
import SharePopup from '../components/SharePopup.vue'

const router = useRouter()
const route = useRoute()
const product = ref(null)
const quantity = ref(1)
const showStepper = ref(false)
const showSharePopup = ref(false)

const categoryName = computed(() => {
  const categories = ['', '蔬菜水果', '肉禽蛋品', '海鲜水产', '乳品烘焙', '粮油调味', '休闲零食', '酒水饮料', '日用百货']
  return categories[product.value?.category_id] || ''
})

const shareUrl = computed(() => {
  return `${window.location.origin}/product/${product.value?.id}`
})

const goBack = () => {
  router.back()
}

const shareProduct = () => {
  showSharePopup.value = true
}

const goCart = () => {
  router.push('/cart')
}

const addToCart = () => {
  showStepper.value = true
}

const confirmAddToCart = () => {
  if (!store.state.user.token) {
    showToast('请先登录')
    router.push('/login')
    return
  }
  
  cartApi.addToCart({ productId: product.value.id, quantity: quantity.value }).then(res => {
    if (res.code === 200) {
      showToast('添加购物车成功')
      showStepper.value = false
    } else {
      showToast(res.message)
    }
  }).catch(() => {
    showToast('添加失败')
  })
}

const buyNow = () => {
  if (!store.state.user.token) {
    showToast('请先登录')
    router.push('/login')
    return
  }
  
  cartApi.addToCart({ productId: product.value.id, quantity: quantity.value }).then(res => {
    if (res.code === 200) {
      router.push('/cart')
    } else {
      showToast(res.message)
    }
  }).catch(() => {
    showToast('添加失败')
  })
}

onMounted(() => {
  const id = route.params.id
  productApi.getProduct(id).then(res => {
    if (res.code === 200) {
      product.value = res.data
    }
  })
})
</script>

<style scoped>
.product-detail-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.product-image img {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.product-info {
  background: white;
  padding: 15px;
  margin-top: 10px;
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 10px;
}

.current-price {
  font-size: 28px;
  font-weight: bold;
  color: #ff4444;
}

.original-price {
  font-size: 16px;
  color: #999;
  text-decoration: line-through;
}

.product-name {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.product-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 15px;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.meta-item {
  font-size: 12px;
  color: #999;
}

.meta-item.tag {
  background: #fff0f0;
  color: #ff4444;
  padding: 3px 8px;
  border-radius: 4px;
}

.meta-item.tag.hot {
  background: linear-gradient(135deg, #ff6b6b, #ff8e53);
  color: white;
}

.section {
  background: white;
  padding: 15px;
  margin-top: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
}

.detail-content p {
  font-size: 14px;
  color: #666;
  line-height: 2;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: white;
  padding: 10px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.bottom-bar .van-button {
  flex: 1;
  margin-right: 5px;
}

.bottom-bar .van-button:last-child {
  margin-right: 0;
}

.stepper-content {
  padding: 20px;
}

.stepper-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 15px;
}

.stepper-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stepper-name {
  font-size: 16px;
  font-weight: bold;
}

.stepper-price {
  font-size: 20px;
  color: #ff4444;
  font-weight: bold;
}
</style>