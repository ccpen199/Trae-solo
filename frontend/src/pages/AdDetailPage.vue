<template>
  <div class="ad-detail-container">
    <van-nav-bar title="广告详情" left-text="返回" @click-left="goBack" />
    
    <div class="ad-content" v-if="ad">
      <img :src="ad.image" :alt="ad.title" class="ad-image" />
      <div class="ad-info">
        <h1 class="ad-title">{{ ad.title }}</h1>
        <p class="ad-desc">这是一个精选商品推荐页面，为您推荐优质商品</p>
      </div>
      
      <div class="hot-products">
        <h3 class="section-title">🔥 热门商品</h3>
        <div class="product-list">
          <van-card 
            v-for="product in hotProducts" 
            :key="product.id" 
            :title="product.name"
            :desc="product.description"
            :price="product.price"
            :original-price="product.original_price"
            :thumb="product.image"
            @click="goProductDetail(product.id)"
          />
        </div>
      </div>
    </div>
    
    <div class="bottom-bar">
      <van-button icon="share-o" type="default" @click="shareAd">分享</van-button>
      <van-button type="primary" @click="goCart">去购物车</van-button>
    </div>
    
    <SharePopup v-model:show="showSharePopup" :share-url="shareUrl" :share-title="ad?.title" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NavBar, Card, Button } from 'vant'
import { adApi, productApi } from '../services/api'
import SharePopup from '../components/SharePopup.vue'

const router = useRouter()
const route = useRoute()
const ad = ref(null)
const hotProducts = ref([])
const showSharePopup = ref(false)

const shareUrl = computed(() => {
  return `${window.location.origin}/ad-detail/${ad.value?.id}`
})

const goBack = () => {
  router.back()
}

const goProductDetail = (id) => {
  router.push(`/product/${id}`)
}

const goCart = () => {
  router.push('/cart')
}

const shareAd = () => {
  showSharePopup.value = true
}

onMounted(() => {
  const id = route.params.id
  adApi.getAds().then(res => {
    if (res.code === 200) {
      ad.value = res.data.find(a => a.id == id)
    }
  })
  
  productApi.getHotProducts().then(res => {
    if (res.code === 200) {
      hotProducts.value = res.data.slice(0, 4)
    }
  })
})
</script>

<style scoped>
.ad-detail-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 100px;
}

.ad-content {
  padding: 10px;
}

.ad-image {
  width: 100%;
  height: 250px;
  object-fit: cover;
  border-radius: 8px;
}

.ad-info {
  background: white;
  padding: 15px;
  margin-top: 10px;
  border-radius: 8px;
}

.ad-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}

.ad-desc {
  font-size: 14px;
  color: #666;
}

.hot-products {
  background: white;
  padding: 15px;
  margin-top: 10px;
  border-radius: 8px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
}

.product-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: white;
  padding: 15px;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  gap: 15px;
}

.bottom-bar .van-button {
  flex: 1;
}
</style>