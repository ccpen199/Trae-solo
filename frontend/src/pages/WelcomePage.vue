<template>
  <div class="welcome-container">
    <van-swipe :autoplay="3000" :loop="true" indicator-color="rgba(255,255,255,0.5)" indicator-active-color="white">
      <van-swipe-item v-for="(ad, index) in ads" :key="index" @click="goAdDetail(ad.id)">
        <div class="banner" :style="{ background: bannerColors[index % bannerColors.length] }">
          <img :src="ad.image" :alt="ad.title" class="banner-img" />
        </div>
      </van-swipe-item>
    </van-swipe>
    
    <div class="features">
      <div class="feature-item">
        <span class="feature-icon">🚀</span>
        <p class="feature-text">30分钟送达</p>
      </div>
      <div class="feature-item">
        <span class="feature-icon">🥬</span>
        <p class="feature-text">新鲜直采</p>
      </div>
      <div class="feature-item">
        <span class="feature-icon">🎁</span>
        <p class="feature-text">品质保证</p>
      </div>
      <div class="feature-item">
        <span class="feature-icon">💰</span>
        <p class="feature-text">实惠价格</p>
      </div>
    </div>
    
    <div class="actions">
      <van-button class="btn-primary" type="primary" block @click="goHome">立即体验</van-button>
      <van-button class="btn-outline" type="default" block @click="goLogin">登录</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Swipe, SwipeItem, Button } from 'vant'
import { adApi } from '../services/api'

const router = useRouter()
const ads = ref([
  { id: 1, title: '新人专享', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=hema%20fresh%20new%20user%20promotion%20banner&image_size=landscape_16_9', link: '/promotion/newuser' },
  { id: 2, title: '限时特惠', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=limited%20time%20sale%20banner%20colorful&image_size=landscape_16_9', link: '/promotion/sale' },
  { id: 3, title: '爆款推荐', image: 'https://neeko-copilot.bytedance.net/api/text_to_image?prompt=popular%20products%20recommendation%20banner&image_size=landscape_16_9', link: '/products/hot' }
])

const bannerColors = [
  'linear-gradient(135deg, #ff6b6b, #ff8e53)',
  'linear-gradient(135deg, #4ecdc4, #44a08d)',
  'linear-gradient(135deg, #a8edea, #fed6e3)'
]

const goHome = () => {
  router.push('/home')
}

const goLogin = () => {
  router.push('/login')
}

const goAdDetail = (id) => {
  router.push(`/ad-detail/${id}`)
}

onMounted(() => {
  adApi.getAds().then(res => {
    if (res.code === 200) {
      ads.value = res.data
    }
  })
})
</script>

<style scoped>
.welcome-container {
  min-height: 100vh;
  background: #f5f5f5;
}

.banner {
  width: 100%;
  height: 280px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.features {
  display: flex;
  justify-content: space-around;
  padding: 30px 20px;
  background: white;
  margin: 10px;
  border-radius: 12px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.feature-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.feature-text {
  font-size: 12px;
  color: #666;
}

.actions {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-primary {
  border-radius: 8px;
}

.btn-outline {
  border-radius: 8px;
}
</style>